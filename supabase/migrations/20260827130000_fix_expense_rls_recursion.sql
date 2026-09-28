-- Fix expense RLS recursion: nested select expenses ↔ expense_shares under involvement policies.
-- Use a security-definer helper so policies do not re-enter each other.

create or replace function public.is_expense_participant(p_expense_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from public.expenses e
      where e.id = p_expense_id
        and e.paid_by = auth.uid()
    )
    or exists (
      select 1
      from public.expense_shares es
      where es.expense_id = p_expense_id
        and es.user_id = auth.uid()
    );
$$;

revoke all on function public.is_expense_participant(uuid) from public;
grant execute on function public.is_expense_participant(uuid) to authenticated;

drop policy if exists "expenses_select_involved" on public.expenses;
create policy "expenses_select_involved"
  on public.expenses for select
  to authenticated
  using (public.is_expense_participant(id));

drop policy if exists "expense_shares_select_involved" on public.expense_shares;
create policy "expense_shares_select_involved"
  on public.expense_shares for select
  to authenticated
  using (public.is_expense_participant(expense_id));

comment on function public.is_expense_participant(uuid) is
  'True when auth.uid() is payer or share holder; security definer avoids RLS recursion.';
