-- Presence months + system-wide leaves (indefinite / planned).
-- Punctual absences remain in member_absences (tasks only).

create type public.system_leave_kind as enum (
  'INDEFINITE',
  'PLANNED'
);

create table public.member_presence_months (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  year_month date not null,
  created_at timestamptz not null default now(),
  constraint member_presence_months_first_day check (extract(day from year_month) = 1),
  unique (home_id, user_id, year_month)
);

create index member_presence_months_home_user_idx
  on public.member_presence_months (home_id, user_id, year_month);

create table public.member_system_leaves (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind public.system_leave_kind not null,
  start_date date not null,
  end_date date,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint member_system_leaves_dates_valid check (
    (kind = 'INDEFINITE' and end_date is null)
    or (kind = 'PLANNED' and end_date is not null and end_date >= start_date)
  )
);

create index member_system_leaves_home_user_idx
  on public.member_system_leaves (home_id, user_id, start_date, end_date);

alter table public.member_presence_months enable row level security;
alter table public.member_system_leaves enable row level security;

create policy member_presence_months_select on public.member_presence_months
  for select using (public.is_home_member(home_id));

create policy member_presence_months_insert on public.member_presence_months
  for insert with check (
    public.is_home_member(home_id)
    and user_id = auth.uid()
  );

create policy member_presence_months_delete on public.member_presence_months
  for delete using (
    public.is_home_member(home_id)
    and (user_id = auth.uid() or public.is_home_admin(home_id))
  );

create policy member_system_leaves_select on public.member_system_leaves
  for select using (public.is_home_member(home_id));

create policy member_system_leaves_insert on public.member_system_leaves
  for insert with check (
    public.is_home_member(home_id)
    and user_id = auth.uid()
  );

create policy member_system_leaves_update on public.member_system_leaves
  for update using (
    public.is_home_member(home_id)
    and (user_id = auth.uid() or public.is_home_admin(home_id))
  );

create policy member_system_leaves_delete on public.member_system_leaves
  for delete using (
    public.is_home_member(home_id)
    and (user_id = auth.uid() or public.is_home_admin(home_id))
  );

comment on table public.member_presence_months is
  'Months each member expects to live in the home; empty = not configured (treated as present).';

comment on table public.member_system_leaves is
  'System-wide leave: freezes tasks/expenses/notifications except overdue expenses.';
