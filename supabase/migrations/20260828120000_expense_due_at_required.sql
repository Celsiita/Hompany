-- Expenses always require a due date (agenda / calendar / forms).

update public.expenses
set due_at = coalesce(due_at, created_at)
where due_at is null;

alter table public.expenses
  alter column due_at set not null;

create or replace function public.seed_default_home_expenses(p_home_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payer uuid;
  v_now timestamptz := timezone('utc', now());
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

  insert into public.expenses (
    home_id,
    title,
    description,
    kind,
    amount,
    paid_by,
    status,
    recurrence,
    recurrence_config,
    due_at,
    due_mode
  )
  values
    (
      p_home_id,
      'Comprar productos de limpieza comunes',
      'Estropajos, detergente, lejía… anota el importe al comprar.',
      'GROCERY',
      0,
      v_payer,
      'OPEN',
      'ONCE',
      '{}'::jsonb,
      v_now + interval '3 days',
      'DEADLINE'
    ),
    (
      p_home_id,
      'Alquiler',
      'Gasto fijo del piso. Edita el importe y quién adelanta.',
      'HOUSE',
      0,
      v_payer,
      'OPEN',
      'MONTHLY',
      jsonb_build_object('day_of_month', extract(day from (v_now + interval '7 days'))::int),
      date_trunc('day', v_now + interval '7 days') + interval '23 hours 59 minutes',
      'DEADLINE'
    ),
    (
      p_home_id,
      'Agua / luz',
      'Suministros compartidos.',
      'HOUSE',
      0,
      v_payer,
      'OPEN',
      'MONTHLY',
      jsonb_build_object('day_of_month', extract(day from (v_now + interval '14 days'))::int),
      date_trunc('day', v_now + interval '14 days') + interval '23 hours 59 minutes',
      'DEADLINE'
    );

  insert into public.expense_shares (home_id, expense_id, user_id, share_amount)
  select e.home_id, e.id, hm.user_id, 0
  from public.expenses e
  join public.home_members hm on hm.home_id = e.home_id
  where e.home_id = p_home_id
  on conflict do nothing;
end;
$$;
