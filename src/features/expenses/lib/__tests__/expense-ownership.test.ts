import { expenseOwnershipLabel } from '@/features/expenses/lib/expense-ownership';

function share(userId: string, settled: boolean) {
  return {
    id: `s-${userId}`,
    expense_id: 'e1',
    user_id: userId,
    share_amount: 10,
    settled_at: settled ? '2026-01-01T00:00:00Z' : null,
    settlement_requested_at: null,
    settlement_status: settled ? ('SETTLED' as const) : ('PENDING' as const),
    created_at: '2026-01-01T00:00:00Z',
    profiles: null,
  };
}

describe('expenseOwnershipLabel', () => {
  const expense = {
    paid_by: 'creditor',
    expense_shares: [share('creditor', true), share('debtor', false), share('paid', true)],
  };

  it('returns null without viewer', () => {
    expect(expenseOwnershipLabel(expense, null)).toBeNull();
  });

  it('labels the payer', () => {
    expect(expenseOwnershipLabel(expense, 'creditor')).toBe('Tú pagaste');
  });

  it('labels an open debt', () => {
    expect(expenseOwnershipLabel(expense, 'debtor')).toBe('Debes');
  });

  it('labels a settled share', () => {
    expect(expenseOwnershipLabel(expense, 'paid')).toBe('Pagado');
  });

  it('returns null for outsiders', () => {
    expect(expenseOwnershipLabel(expense, 'other')).toBeNull();
  });
});
