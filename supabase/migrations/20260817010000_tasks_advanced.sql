-- Task categories, multi-assignees, reviews, default seeds, storage bucket

-- ---------------------------------------------------------------------------
-- Enums + task columns
-- ---------------------------------------------------------------------------

create type public.task_category as enum (
  'ZONE',
  'QUICK',
  'GROCERY'
);

create type public.task_recurrence as enum (
  'ONCE',
  'DAILY',
  'WEEKLY'
);

create type public.task_review_vote as enum (
  'APPROVE',
  'DISPUTE'
);

alter table public.tasks
  add column category public.task_category not null default 'QUICK',
  add column icon text not null default 'checklist',
  add column recurrence public.task_recurrence not null default 'ONCE',
  add column is_template boolean not null default false;

create index tasks_home_id_category_idx on public.tasks (home_id, category);

-- ---------------------------------------------------------------------------
-- Multi-assignees
-- ---------------------------------------------------------------------------

create table public.task_assignees (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes (id) on delete cascade,
  task_id uuid not null references public.tasks (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (task_id, user_id)
);

create index task_assignees_home_id_idx on public.task_assignees (home_id);
create index task_assignees_task_id_idx on public.task_assignees (task_id);
create index task_assignees_user_id_idx on public.task_assignees (user_id);

alter table public.task_assignees enable row level security;

create policy "task_assignees_select_member"
  on public.task_assignees for select
  to authenticated
  using (public.is_home_member(home_id));

create policy "task_assignees_insert_member"
  on public.task_assignees for insert
  to authenticated
  with check (public.is_home_member(home_id));

create policy "task_assignees_delete_member"
  on public.task_assignees for delete
  to authenticated
  using (public.is_home_member(home_id));

grant select, insert, update, delete on table public.task_assignees to authenticated;

alter table public.home_members
  drop constraint if exists home_members_user_id_fkey;

alter table public.home_members
  add constraint home_members_user_id_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;

-- Backfill assignees from assigned_to
insert into public.task_assignees (home_id, task_id, user_id)
select t.home_id, t.id, t.assigned_to
from public.tasks t
where t.assigned_to is not null
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Reviews (approve / dispute)
-- ---------------------------------------------------------------------------

create table public.task_reviews (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes (id) on delete cascade,
  task_id uuid not null references public.tasks (id) on delete cascade,
  reviewer_id uuid not null references public.profiles (id) on delete cascade,
  vote public.task_review_vote not null,
  emoji text not null default '👏',
  created_at timestamptz not null default now(),
  unique (task_id, reviewer_id)
);

create index task_reviews_home_id_idx on public.task_reviews (home_id);
create index task_reviews_task_id_idx on public.task_reviews (task_id);

alter table public.task_reviews enable row level security;

create policy "task_reviews_select_member"
  on public.task_reviews for select
  to authenticated
  using (public.is_home_member(home_id));

create policy "task_reviews_insert_member"
  on public.task_reviews for insert
  to authenticated
  with check (
    public.is_home_member(home_id)
    and reviewer_id = auth.uid()
  );

create policy "task_reviews_update_own"
  on public.task_reviews for update
  to authenticated
  using (reviewer_id = auth.uid() and public.is_home_member(home_id))
  with check (reviewer_id = auth.uid() and public.is_home_member(home_id));

grant select, insert, update, delete on table public.task_reviews to authenticated;

-- ---------------------------------------------------------------------------
-- Default task seed for a new home
-- ---------------------------------------------------------------------------

create or replace function public.seed_default_home_tasks(p_home_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_home_member(p_home_id) and auth.uid() is not null then
    -- allow when called from create_home (security definer, membership just inserted)
    null;
  end if;

  if exists (select 1 from public.tasks t where t.home_id = p_home_id) then
    return;
  end if;

  insert into public.tasks (
    home_id, title, description, category, icon, status, due_at, points_value, recurrence, is_template
  ) values
    (p_home_id, 'Cocina', 'Mantener la cocina limpia y ordenada.', 'ZONE', 'fork.knife', 'PENDING', now() + interval '2 days', 15, 'WEEKLY', true),
    (p_home_id, 'Baño', 'Limpiar baño y reponer lo básico.', 'ZONE', 'shower', 'PENDING', now() + interval '2 days', 15, 'WEEKLY', true),
    (p_home_id, 'Salón', 'Ordenar y aspirar el salón.', 'ZONE', 'sofa', 'PENDING', now() + interval '3 days', 15, 'WEEKLY', true),
    (p_home_id, 'Bajar la Basura', 'Sacar la basura de todas las papeleras.', 'QUICK', 'trash', 'PENDING', now() + interval '1 day', 10, 'DAILY', true),
    (p_home_id, 'Reponer Papel Higiénico', 'Dejar al menos un rollo de reserva.', 'QUICK', 'roll', 'PENDING', now() + interval '2 days', 5, 'WEEKLY', true),
    (p_home_id, 'Comprar productos de limpieza comunes', 'Estropajos, detergente, lejía, etc.', 'GROCERY', 'cart', 'PENDING', now() + interval '4 days', 10, 'WEEKLY', true);
end;
$$;

grant execute on function public.seed_default_home_tasks(uuid) to authenticated;

-- Hook into create_home
create or replace function public.create_home(p_name text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_home public.homes;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_name is null or char_length(trim(p_name)) = 0 then
    raise exception 'Home name is required';
  end if;

  insert into public.homes (name, invite_code, created_by)
  values (trim(p_name), public.generate_invite_code(), v_user_id)
  returning * into v_home;

  insert into public.home_members (home_id, user_id, role, reputation_points)
  values (v_home.id, v_user_id, 'owner', 100);

  perform public.seed_default_home_tasks(v_home.id);

  return row_to_json(v_home);
end;
$$;

grant execute on function public.create_home(text) to authenticated;

create or replace function public.join_home_by_invite_code(p_code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_home public.homes;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_home
  from public.homes h
  where upper(h.invite_code) = upper(trim(p_code))
  limit 1;

  if v_home.id is null then
    raise exception 'Invalid invite code';
  end if;

  insert into public.home_members (home_id, user_id, role, reputation_points)
  values (v_home.id, v_user_id, 'member', 100)
  on conflict (home_id, user_id) do nothing;

  perform public.seed_default_home_tasks(v_home.id);

  return row_to_json(v_home);
end;
$$;

grant execute on function public.join_home_by_invite_code(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: task proof photos
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'task-proofs',
  'task-proofs',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.storage_home_id_from_path(object_name text)
returns uuid
language sql
immutable
as $$
  select nullif(split_part(object_name, '/', 1), '')::uuid;
$$;

create policy "task_proofs_select_member"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'task-proofs'
    and public.is_home_member(public.storage_home_id_from_path(name))
  );

create policy "task_proofs_insert_member"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'task-proofs'
    and public.is_home_member(public.storage_home_id_from_path(name))
  );

create policy "task_proofs_update_member"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'task-proofs'
    and public.is_home_member(public.storage_home_id_from_path(name))
  );

create policy "task_proofs_delete_member"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'task-proofs'
    and public.is_home_member(public.storage_home_id_from_path(name))
  );

-- Public read for proof URLs (bucket is public); keep member write policies above.
create policy "task_proofs_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'task-proofs');
