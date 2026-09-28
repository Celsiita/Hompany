-- Custom item types for tasks/expenses, drop ZONE from use, presence date ranges.

update public.tasks set category = 'QUICK' where category = 'ZONE';
update public.task_templates set category = 'QUICK' where category = 'ZONE';

create table public.home_item_types (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes (id) on delete cascade,
  domain text not null check (domain in ('task', 'expense')),
  name text not null,
  created_at timestamptz not null default now(),
  constraint home_item_types_name_len check (char_length(trim(name)) between 1 and 40)
);

create unique index home_item_types_home_domain_name_idx
  on public.home_item_types (home_id, domain, lower(trim(name)));

create index home_item_types_home_id_idx on public.home_item_types (home_id);

alter table public.tasks
  add column if not exists item_type_id uuid references public.home_item_types (id) on delete set null;

alter table public.task_templates
  add column if not exists item_type_id uuid references public.home_item_types (id) on delete set null;

alter table public.expenses
  add column if not exists item_type_id uuid references public.home_item_types (id) on delete set null;

alter table public.home_item_types enable row level security;

create policy home_item_types_select on public.home_item_types
  for select using (public.is_home_member(home_id));

create policy home_item_types_insert on public.home_item_types
  for insert with check (public.is_home_member(home_id));

create policy home_item_types_delete on public.home_item_types
  for delete using (public.is_home_member(home_id));

create table public.member_presence_periods (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  constraint member_presence_periods_dates_valid check (end_date >= start_date)
);

create index member_presence_periods_home_user_idx
  on public.member_presence_periods (home_id, user_id, start_date, end_date);

alter table public.member_presence_periods enable row level security;

create policy member_presence_periods_select on public.member_presence_periods
  for select using (public.is_home_member(home_id));

create policy member_presence_periods_insert on public.member_presence_periods
  for insert with check (
    public.is_home_member(home_id)
    and user_id = auth.uid()
  );

create policy member_presence_periods_delete on public.member_presence_periods
  for delete using (
    public.is_home_member(home_id)
    and (user_id = auth.uid() or public.is_home_admin(home_id))
  );

insert into public.member_presence_periods (home_id, user_id, start_date, end_date)
select
  m.home_id,
  m.user_id,
  m.year_month,
  (m.year_month + interval '1 month - 1 day')::date
from public.member_presence_months m;

comment on table public.home_item_types is
  'Custom types beyond built-in Tareas rápidas / Supermercado-Casa-Ocio.';

comment on table public.member_presence_periods is
  'Date ranges when a member expects to be in the flat (months or specific dates).';
