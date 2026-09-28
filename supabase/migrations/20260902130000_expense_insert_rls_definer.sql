-- Harden expense INSERT RLS: membership checks via security definer (no subquery RLS bleed).
-- Fixes "new row violates row level security policy for table expenses" when creating
-- expenses for another home member as payer/debtor.

create or replace function public.is_home_member_user(p_home_id uuid, p_user_id uuid)
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
      and hm.user_id = p_user_id
  );
$$;

revoke all on function public.is_home_member_user(uuid, uuid) from public;
grant execute on function public.is_home_member_user(uuid, uuid) to authenticated;

comment on function public.is_home_member_user(uuid, uuid) is
  'True when p_user_id belongs to p_home_id; security definer for RLS policy subqueries.';

drop policy if exists "expenses_insert_member" on public.expenses;
create policy "expenses_insert_member"
  on public.expenses for insert
  to authenticated
  with check (
    public.is_home_member(home_id)
    and public.is_home_member_user(home_id, paid_by)
  );

drop policy if exists "expenses_select_payer" on public.expenses;
create policy "expenses_select_payer"
  on public.expenses for select
  to authenticated
  using (paid_by = auth.uid());

drop policy if exists "expense_shares_insert_member" on public.expense_shares;
create policy "expense_shares_insert_member"
  on public.expense_shares for insert
  to authenticated
  with check (
    public.is_home_member(home_id)
    and public.is_home_member_user(home_id, user_id)
  );
