-- Expenses (grocery, house bills, peer IOUs) + task seed without supermarket

-- ---------------------------------------------------------------------------
-- Enums + tables
-- ---------------------------------------------------------------------------

create type public.expense_kind as enum (
  'GROCERY',
  'HOUSE',
  'PEER'
);

create type public.expense_status as enum (
  'OPEN',
  'SETTLED'
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes (id) on delete cascade,
  title text not null,
  description text,
  kind public.expense_kind not null,
  amount numeric(10, 2) not null default 0 check (amount >= 0),
  currency text not null default 'EUR',
  paid_by uuid not null references public.profiles (id) on delete restrict,
  status public.expense_status not null default 'OPEN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index expenses_home_id_idx on public.expenses (home_id);
create index expenses_home_kind_idx on public.expenses (home_id, kind);
create index expenses_paid_by_idx on public.expenses (paid_by);

create table public.expense_shares (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes (id) on delete cascade,
  expense_id uuid not null references public.expenses (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  share_amount numeric(10, 2) not null default 0 check (share_amount >= 0),
  is_settled boolean not null default false,
  created_at timestamptz not null default now(),
  unique (expense_id, user_id)
);

create index expense_shares_home_id_idx on public.expense_shares (home_id);
create index expense_shares_expense_id_idx on public.expense_shares (expense_id);

alter table public.expenses enable row level security;
alter table public.expense_shares enable row level security;

create policy "expenses_select_member"
  on public.expenses for select
  to authenticated
  using (public.is_home_member(home_id));

create policy "expenses_insert_member"
  on public.expenses for insert
  to authenticated
  with check (public.is_home_member(home_id));

create policy "expenses_update_member"
  on public.expenses for update
  to authenticated
  using (public.is_home_member(home_id))
  with check (public.is_home_member(home_id));

create policy "expenses_delete_member"
  on public.expenses for delete
  to authenticated
  using (public.is_home_member(home_id));

create policy "expense_shares_select_member"
  on public.expense_shares for select
  to authenticated
  using (public.is_home_member(home_id));

create policy "expense_shares_insert_member"
  on public.expense_shares for insert
  to authenticated
  with check (public.is_home_member(home_id));

create policy "expense_shares_update_member"
  on public.expense_shares for update
  to authenticated
  using (public.is_home_member(home_id))
  with check (public.is_home_member(home_id));

create policy "expense_shares_delete_member"
  on public.expense_shares for delete
  to authenticated
  using (public.is_home_member(home_id));

grant select, insert, update, delete on table public.expenses to authenticated;
grant select, insert, update, delete on table public.expense_shares to authenticated;

create trigger expenses_set_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Move leftover grocery tasks into expenses, then drop them from the board
-- ---------------------------------------------------------------------------

insert into public.expenses (
  home_id, title, description, kind, amount, paid_by, status
)
select
  t.home_id,
  t.title,
  t.description,
  'GROCERY'::public.expense_kind,
  0,
  coalesce(
    t.assigned_to,
    (
      select hm.user_id
      from public.home_members hm
      where hm.home_id = t.home_id
      order by hm.joined_at
      limit 1
    )
  ),
  'OPEN'::public.expense_status
from public.tasks t
where t.category = 'GROCERY'
  and coalesce(
    t.assigned_to,
    (
      select hm.user_id
      from public.home_members hm
      where hm.home_id = t.home_id
      order by hm.joined_at
      limit 1
    )
  ) is not null;

insert into public.expense_shares (home_id, expense_id, user_id, share_amount)
select e.home_id, e.id, hm.user_id, 0
from public.expenses e
join public.home_members hm on hm.home_id = e.home_id
where e.kind = 'GROCERY'
  and e.amount = 0
on conflict do nothing;

delete from public.tasks where category = 'GROCERY';

-- ---------------------------------------------------------------------------
-- Seeds
-- ---------------------------------------------------------------------------

create or replace function public.seed_default_home_tasks(p_home_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
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
    (p_home_id, 'Reponer Papel Higiénico', 'Dejar al menos un rollo de reserva.', 'QUICK', 'roll', 'PENDING', now() + interval '2 days', 5, 'WEEKLY', true);
end;
$$;

create or replace function public.seed_default_home_expenses(p_home_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payer uuid;
begin
  if exists (select 1 from public.expenses e where e.home_id = p_home_id) then
    return;
  end if;

  select hm.user_id into v_payer
  from public.home_members hm
  where hm.home_id = p_home_id
  order by hm.joined_at
  limit 1;

  if v_payer is null then
    return;
  end if;

  insert into public.expenses (home_id, title, description, kind, amount, paid_by, status)
  values
    (
      p_home_id,
      'Comprar productos de limpieza comunes',
      'Estropajos, detergente, lejía… anota el importe al comprar.',
      'GROCERY',
      0,
      v_payer,
      'OPEN'
    ),
    (
      p_home_id,
      'Alquiler',
      'Gasto fijo del piso. Edita el importe y quién adelanta.',
      'HOUSE',
      0,
      v_payer,
      'OPEN'
    ),
    (
      p_home_id,
      'Agua / luz',
      'Suministros compartidos.',
      'HOUSE',
      0,
      v_payer,
      'OPEN'
    );

  insert into public.expense_shares (home_id, expense_id, user_id, share_amount)
  select e.home_id, e.id, hm.user_id, 0
  from public.expenses e
  join public.home_members hm on hm.home_id = e.home_id
  where e.home_id = p_home_id
  on conflict do nothing;
end;
$$;

grant execute on function public.seed_default_home_expenses(uuid) to authenticated;

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
  perform public.seed_default_home_expenses(v_home.id);

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
  perform public.seed_default_home_expenses(v_home.id);

  return row_to_json(v_home);
end;
$$;

grant execute on function public.join_home_by_invite_code(text) to authenticated;
