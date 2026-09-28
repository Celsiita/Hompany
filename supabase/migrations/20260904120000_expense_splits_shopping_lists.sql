-- Expense split modes, share percent, shopping lists.
-- Presence periods remain in DB but app no longer uses them for freeze.

create type public.expense_split_mode as enum ('EQUAL', 'PERCENT', 'AMOUNT');

alter table public.expenses
  add column if not exists split_mode public.expense_split_mode not null default 'EQUAL';

alter table public.expense_shares
  add column if not exists share_percent numeric(6, 2);

comment on column public.expenses.split_mode is
  'EQUAL = even split; PERCENT = share_percent must sum 100; AMOUNT = share_amount must sum total.';

-- Shared shopping / supply lists per home.
create table if not exists public.home_shopping_lists (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes (id) on delete cascade,
  name text not null,
  rotation_enabled boolean not null default false,
  current_buyer_user_id uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint home_shopping_lists_name_len check (char_length(trim(name)) between 1 and 60)
);

create table if not exists public.home_shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes (id) on delete cascade,
  list_id uuid not null references public.home_shopping_lists (id) on delete cascade,
  title text not null,
  needed boolean not null default true,
  sort_order integer not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint home_shopping_list_items_title_len check (char_length(trim(title)) between 1 and 80)
);

create index if not exists home_shopping_lists_home_idx
  on public.home_shopping_lists (home_id, created_at desc);

create index if not exists home_shopping_list_items_list_idx
  on public.home_shopping_list_items (list_id, sort_order, created_at);

alter table public.home_shopping_lists enable row level security;
alter table public.home_shopping_list_items enable row level security;

create policy home_shopping_lists_select on public.home_shopping_lists
  for select using (public.is_home_member(home_id));
create policy home_shopping_lists_insert on public.home_shopping_lists
  for insert with check (public.is_home_member(home_id));
create policy home_shopping_lists_update on public.home_shopping_lists
  for update using (public.is_home_member(home_id));
create policy home_shopping_lists_delete on public.home_shopping_lists
  for delete using (public.is_home_member(home_id));

create policy home_shopping_list_items_select on public.home_shopping_list_items
  for select using (public.is_home_member(home_id));
create policy home_shopping_list_items_insert on public.home_shopping_list_items
  for insert with check (public.is_home_member(home_id));
create policy home_shopping_list_items_update on public.home_shopping_list_items
  for update using (public.is_home_member(home_id));
create policy home_shopping_list_items_delete on public.home_shopping_list_items
  for delete using (public.is_home_member(home_id));

-- Seed a default "Compartido" list for existing homes.
insert into public.home_shopping_lists (home_id, name)
select h.id, 'Compartido'
from public.homes h
where not exists (
  select 1 from public.home_shopping_lists l where l.home_id = h.id and l.name = 'Compartido'
);
