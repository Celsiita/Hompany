-- Fix expense INSERT / RETURNING under involvement-only SELECT policies.
-- Payers must be able to read rows they create before shares exist.

drop policy if exists "expenses_insert_member" on public.expenses;
create policy "expenses_insert_member"
  on public.expenses for insert
  to authenticated
  with check (
    public.is_home_member(home_id)
    and exists (
      select 1
      from public.home_members hm
      where hm.home_id = expenses.home_id
        and hm.user_id = expenses.paid_by
    )
  );

drop policy if exists "expenses_select_payer" on public.expenses;
create policy "expenses_select_payer"
  on public.expenses for select
  to authenticated
  using (paid_by = auth.uid());

comment on policy "expenses_select_payer" on public.expenses is
  'Payer can read their expense immediately after INSERT RETURNING (before shares exist).';
