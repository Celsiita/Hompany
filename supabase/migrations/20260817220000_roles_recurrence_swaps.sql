-- Recurrence config, auto-assign, task swaps, admin activity, stricter RLS
-- Columns MUST exist before helper functions that reference them.

-- ---------------------------------------------------------------------------
-- Task / template columns
-- ---------------------------------------------------------------------------

alter table public.tasks
  add column if not exists created_by uuid references public.profiles (id) on delete set null,
  add column if not exists base_title text,
  add column if not exists auto_assign boolean not null default false,
  add column if not exists recurrence_config jsonb not null default '{}'::jsonb;

alter table public.task_templates
  add column if not exists base_title text,
  add column if not exists auto_assign boolean not null default false,
  add column if not exists recurrence_config jsonb not null default '{}'::jsonb;

update public.tasks
set base_title = coalesce(base_title, title)
where base_title is null;

update public.task_templates
set base_title = coalesce(base_title, title)
where base_title is null;

-- ---------------------------------------------------------------------------
-- Expenses columns
-- ---------------------------------------------------------------------------

alter table public.expenses
  add column if not exists base_title text,
  add column if not exists series_id uuid,
  add column if not exists due_at timestamptz,
  add column if not exists recurrence_config jsonb not null default '{}'::jsonb,
  add column if not exists auto_assign boolean not null default false;

update public.expenses
set
  base_title = coalesce(base_title, title),
  series_id = coalesce(series_id, id),
  due_at = coalesce(due_at, created_at);

alter table public.expenses
  alter column series_id set default gen_random_uuid();

-- ---------------------------------------------------------------------------
-- Helpers (after columns they read)
-- ---------------------------------------------------------------------------

create or replace function public.is_home_admin(p_home_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.home_members hm
    where hm.home_id = p_home_id
      and hm.user_id = auth.uid()
      and hm.role in ('owner', 'admin')
  );
$$;

create or replace function public.can_mutate_task(p_home_id uuid, p_task_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_home_admin(p_home_id)
    or exists (
      select 1 from public.tasks t
      where t.id = p_task_id
        and t.home_id = p_home_id
        and t.created_by = auth.uid()
    )
    or exists (
      select 1 from public.tasks t
      where t.id = p_task_id
        and t.home_id = p_home_id
        and t.assigned_to = auth.uid()
    )
    or exists (
      select 1 from public.task_assignees ta
      where ta.task_id = p_task_id
        and ta.home_id = p_home_id
        and ta.user_id = auth.uid()
    );
$$;

create or replace function public.can_mutate_expense(p_home_id uuid, p_expense_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_home_admin(p_home_id)
    or exists (
      select 1 from public.expenses e
      where e.id = p_expense_id
        and e.home_id = p_home_id
        and e.paid_by = auth.uid()
    )
    or exists (
      select 1 from public.expense_shares es
      where es.expense_id = p_expense_id
        and es.home_id = p_home_id
        and es.user_id = auth.uid()
    );
$$;

-- ---------------------------------------------------------------------------
-- Swaps
-- ---------------------------------------------------------------------------

create type public.task_swap_status as enum (
  'PENDING',
  'ACCEPTED',
  'REJECTED'
);

create table public.task_swap_requests (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes (id) on delete cascade,
  task_id uuid not null references public.tasks (id) on delete cascade,
  from_user_id uuid not null references public.profiles (id) on delete cascade,
  to_user_id uuid not null references public.profiles (id) on delete cascade,
  status public.task_swap_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (from_user_id <> to_user_id)
);

create unique index task_swap_requests_pending_unique
  on public.task_swap_requests (task_id, from_user_id, to_user_id)
  where status = 'PENDING';

create index task_swap_requests_home_id_idx on public.task_swap_requests (home_id);
create index task_swap_requests_to_user_idx on public.task_swap_requests (home_id, to_user_id, status);

create trigger task_swap_requests_set_updated_at
  before update on public.task_swap_requests
  for each row execute function public.set_updated_at();

alter table public.task_swap_requests enable row level security;

create policy "task_swap_requests_select_member"
  on public.task_swap_requests for select
  to authenticated
  using (public.is_home_member(home_id));

create policy "task_swap_requests_insert_member"
  on public.task_swap_requests for insert
  to authenticated
  with check (
    public.is_home_member(home_id)
    and from_user_id = auth.uid()
  );

create policy "task_swap_requests_update_parties"
  on public.task_swap_requests for update
  to authenticated
  using (
    public.is_home_member(home_id)
    and (from_user_id = auth.uid() or to_user_id = auth.uid() or public.is_home_admin(home_id))
  )
  with check (
    public.is_home_member(home_id)
    and (from_user_id = auth.uid() or to_user_id = auth.uid() or public.is_home_admin(home_id))
  );

grant select, insert, update, delete on table public.task_swap_requests to authenticated;

-- ---------------------------------------------------------------------------
-- Admin / reopen / repeat activity log
-- ---------------------------------------------------------------------------

create table public.home_activity_events (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes (id) on delete cascade,
  actor_id uuid not null references public.profiles (id) on delete cascade,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index home_activity_events_home_id_idx
  on public.home_activity_events (home_id, created_at desc);

alter table public.home_activity_events enable row level security;

create policy "home_activity_events_select_member"
  on public.home_activity_events for select
  to authenticated
  using (public.is_home_member(home_id));

create policy "home_activity_events_insert_member"
  on public.home_activity_events for insert
  to authenticated
  with check (
    public.is_home_member(home_id)
    and actor_id = auth.uid()
  );

grant select, insert on table public.home_activity_events to authenticated;

-- ---------------------------------------------------------------------------
-- RLS: tasks / expenses — members mutate own, admins mutate all, delete = admin
-- ---------------------------------------------------------------------------

drop policy if exists "tasks_update_member" on public.tasks;
create policy "tasks_update_member_or_admin"
  on public.tasks for update
  to authenticated
  using (public.can_mutate_task(home_id, id))
  with check (public.can_mutate_task(home_id, id));

drop policy if exists "tasks_delete_owner" on public.tasks;
create policy "tasks_delete_admin"
  on public.tasks for delete
  to authenticated
  using (public.is_home_admin(home_id));

drop policy if exists "expenses_update_member" on public.expenses;
create policy "expenses_update_involved_or_admin"
  on public.expenses for update
  to authenticated
  using (public.can_mutate_expense(home_id, id))
  with check (public.can_mutate_expense(home_id, id));

drop policy if exists "expenses_delete_member" on public.expenses;
create policy "expenses_delete_admin"
  on public.expenses for delete
  to authenticated
  using (public.is_home_admin(home_id));

drop policy if exists "home_members_update_owner" on public.home_members;
create policy "home_members_update_admin"
  on public.home_members for update
  to authenticated
  using (public.is_home_admin(home_id))
  with check (public.is_home_admin(home_id));

drop policy if exists "home_members_delete_owner_or_self" on public.home_members;
create policy "home_members_delete_admin_or_self"
  on public.home_members for delete
  to authenticated
  using (
    public.is_home_admin(home_id)
    or user_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- Role change RPC (never demote the last owner)
-- ---------------------------------------------------------------------------

create or replace function public.set_home_member_role(
  p_home_id uuid,
  p_user_id uuid,
  p_role public.home_member_role
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target public.home_members;
  v_owner_count integer;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_home_admin(p_home_id) then
    raise exception 'Only admins can change roles';
  end if;

  if p_role = 'owner' then
    raise exception 'Cannot assign owner role';
  end if;

  select * into v_target
  from public.home_members
  where home_id = p_home_id and user_id = p_user_id;

  if v_target.id is null then
    raise exception 'Member not found';
  end if;

  if v_target.role = 'owner' then
    raise exception 'Cannot change the creator role';
  end if;

  update public.home_members
  set role = p_role
  where home_id = p_home_id and user_id = p_user_id;

  insert into public.home_activity_events (
    home_id, actor_id, action, entity_type, entity_id, summary, payload
  )
  values (
    p_home_id,
    auth.uid(),
    case when p_role = 'admin' then 'ADMIN_PROMOTE' else 'ADMIN_DEMOTE' end,
    'member',
    v_target.id,
    case
      when p_role = 'admin' then 'Nombró a un compañero como admin'
      else 'Quitó el rol de admin a un compañero'
    end,
    jsonb_build_object('user_id', p_user_id, 'role', p_role)
  );

  select count(*) into v_owner_count
  from public.home_members
  where home_id = p_home_id and role = 'owner';

  if v_owner_count < 1 then
    raise exception 'A home must keep one owner';
  end if;
end;
$$;

grant execute on function public.set_home_member_role(uuid, uuid, public.home_member_role) to authenticated;
grant execute on function public.is_home_admin(uuid) to authenticated;
