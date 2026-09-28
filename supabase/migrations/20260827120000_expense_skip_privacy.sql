-- Expense skip (cancel this occurrence) + privacy: only involved users can read expenses.

alter type public.expense_status add value if not exists 'SKIPPED';

-- Replace broad member SELECT with involvement-only.
drop policy if exists "expenses_select_member" on public.expenses;
create policy "expenses_select_involved"
  on public.expenses for select
  to authenticated
  using (
    paid_by = auth.uid()
    or exists (
      select 1
      from public.expense_shares es
      where es.expense_id = expenses.id
        and es.user_id = auth.uid()
    )
  );

drop policy if exists "expense_shares_select_member" on public.expense_shares;
create policy "expense_shares_select_involved"
  on public.expense_shares for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.expenses e
      where e.id = expense_shares.expense_id
        and e.paid_by = auth.uid()
    )
    or exists (
      select 1
      from public.expense_shares peer
      where peer.expense_id = expense_shares.expense_id
        and peer.user_id = auth.uid()
    )
  );

comment on type public.expense_status is
  'OPEN | SETTLED | ARCHIVED | SKIPPED (omit this occurrence; series continues)';
