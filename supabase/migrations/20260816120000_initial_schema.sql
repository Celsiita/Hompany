-- HOMPANY initial schema: profiles, homes, home_members, tasks + RLS
-- Multi-tenancy: every home-scoped row is isolated by home_id and membership.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.task_status as enum (
  'PENDING',
  'SUBMITTED',
  'COMPLETED',
  'OVERDUE',
  'RESOLVED_LATE',
  'RESOLVED_BY_PEER',
  'SKIPPED'
);

create type public.home_member_role as enum (
  'owner',
  'member'
);

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Public profile for each authenticated user.';

-- ---------------------------------------------------------------------------
-- Homes
-- ---------------------------------------------------------------------------

create table public.homes (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  invite_code text not null unique,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index homes_created_by_idx on public.homes (created_by);
create index homes_invite_code_idx on public.homes (invite_code);

comment on table public.homes is 'Shared flat / household. All tenant data hangs off home_id.';

-- ---------------------------------------------------------------------------
-- Home members (memberships)
-- ---------------------------------------------------------------------------

create table public.home_members (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.home_member_role not null default 'member',
  reputation_points integer not null default 100
    check (reputation_points >= 0 and reputation_points <= 1000),
  joined_at timestamptz not null default now(),
  unique (home_id, user_id)
);

create index home_members_home_id_idx on public.home_members (home_id);
create index home_members_user_id_idx on public.home_members (user_id);

comment on table public.home_members is 'Membership of a user in a home. Required for multi-tenant access.';

-- ---------------------------------------------------------------------------
-- Tasks
-- ---------------------------------------------------------------------------

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes (id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  description text,
  status public.task_status not null default 'PENDING',
  assigned_to uuid references auth.users (id) on delete set null,
  completed_by uuid references auth.users (id) on delete set null,
  due_at timestamptz not null,
  proof_image_url text,
  points_value integer not null default 10 check (points_value >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_home_id_idx on public.tasks (home_id);
create index tasks_home_id_status_idx on public.tasks (home_id, status);
create index tasks_assigned_to_idx on public.tasks (assigned_to);
create index tasks_due_at_idx on public.tasks (due_at);

comment on table public.tasks is 'Task instance for a home. Status follows the HOMPANY lifecycle state machine.';
comment on column public.tasks.home_id is 'REQUIRED tenant key. Never query tasks without filtering by home_id.';

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger homes_set_updated_at
  before update on public.homes
  for each row execute function public.set_updated_at();

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Profile bootstrap on signup
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1), 'Usuario')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Invite code generator
-- ---------------------------------------------------------------------------

create or replace function public.generate_invite_code()
returns text
language plpgsql
as $$
declare
  code text;
  exists_already boolean;
begin
  loop
    code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    select exists(select 1 from public.homes where invite_code = code) into exists_already;
    exit when not exists_already;
  end loop;
  return code;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS helpers (security definer to avoid recursive policy checks)
-- ---------------------------------------------------------------------------

create or replace function public.is_home_member(p_home_id uuid)
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
  );
$$;

create or replace function public.is_home_owner(p_home_id uuid)
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
      and hm.role = 'owner'
  );
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.homes enable row level security;
alter table public.home_members enable row level security;
alter table public.tasks enable row level security;

-- ---------------------------------------------------------------------------
-- Policies: profiles
-- ---------------------------------------------------------------------------

create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- Policies: homes
-- ---------------------------------------------------------------------------

create policy "homes_select_member"
  on public.homes for select
  to authenticated
  using (public.is_home_member(id));

create policy "homes_insert_authenticated"
  on public.homes for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "homes_update_owner"
  on public.homes for update
  to authenticated
  using (public.is_home_owner(id))
  with check (public.is_home_owner(id));

create policy "homes_delete_owner"
  on public.homes for delete
  to authenticated
  using (public.is_home_owner(id));

-- ---------------------------------------------------------------------------
-- Policies: home_members
-- ---------------------------------------------------------------------------

create policy "home_members_select_same_home"
  on public.home_members for select
  to authenticated
  using (public.is_home_member(home_id));

create policy "home_members_insert_owner_or_self_owner"
  on public.home_members for insert
  to authenticated
  with check (
    -- Creator becomes first owner when creating a home
    (user_id = auth.uid() and role = 'owner')
    or public.is_home_owner(home_id)
  );

create policy "home_members_update_owner"
  on public.home_members for update
  to authenticated
  using (public.is_home_owner(home_id))
  with check (public.is_home_owner(home_id));

create policy "home_members_delete_owner_or_self"
  on public.home_members for delete
  to authenticated
  using (
    public.is_home_owner(home_id)
    or user_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- Policies: tasks (ALWAYS scoped by home membership / home_id)
-- ---------------------------------------------------------------------------

create policy "tasks_select_member"
  on public.tasks for select
  to authenticated
  using (public.is_home_member(home_id));

create policy "tasks_insert_member"
  on public.tasks for insert
  to authenticated
  with check (public.is_home_member(home_id));

create policy "tasks_update_member"
  on public.tasks for update
  to authenticated
  using (public.is_home_member(home_id))
  with check (public.is_home_member(home_id));

create policy "tasks_delete_owner"
  on public.tasks for delete
  to authenticated
  using (public.is_home_owner(home_id));
