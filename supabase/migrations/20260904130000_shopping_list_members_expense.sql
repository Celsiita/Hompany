-- Shopping list members + controlled linked expense.

alter table public.home_shopping_lists
  add column if not exists expense_id uuid references public.expenses (id) on delete set null;

create table if not exists public.home_shopping_list_members (
  list_id uuid not null references public.home_shopping_lists (id) on delete cascade,
  home_id uuid not null references public.homes (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (list_id, user_id)
);

create index if not exists home_shopping_list_members_user_idx
  on public.home_shopping_list_members (home_id, user_id);

alter table public.home_shopping_list_members enable row level security;

create policy home_shopping_list_members_select on public.home_shopping_list_members
  for select using (public.is_home_member(home_id));
create policy home_shopping_list_members_insert on public.home_shopping_list_members
  for insert with check (public.is_home_member(home_id));
create policy home_shopping_list_members_update on public.home_shopping_list_members
  for update using (public.is_home_member(home_id));
create policy home_shopping_list_members_delete on public.home_shopping_list_members
  for delete using (public.is_home_member(home_id));

-- Backfill: every home member shares existing lists.
insert into public.home_shopping_list_members (list_id, home_id, user_id)
select l.id, l.home_id, m.user_id
from public.home_shopping_lists l
join public.home_members m on m.home_id = l.home_id
on conflict do nothing;
