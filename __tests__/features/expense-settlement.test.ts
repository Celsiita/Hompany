import {
  EXPENSE_SHARE_SETTLEMENT_LABEL,
  isShareSettled,
  isShareSettlementRequested,
} from '@/features/expenses/lib/expense-settlement';

describe('expense share settlement', () => {
  it('maps labels for pending, requested and settled', () => {
    expect(EXPENSE_SHARE_SETTLEMENT_LABEL.PENDING).toBe('Pendiente');
    expect(EXPENSE_SHARE_SETTLEMENT_LABEL.REQUESTED).toBe('Solicitado');
    expect(EXPENSE_SHARE_SETTLEMENT_LABEL.SETTLED).toBe('Saldado');
  });

  it('detects settled and requested states', () => {
    expect(isShareSettled({ settlement_status: 'SETTLED' })).toBe(true);
    expect(isShareSettled({ settlement_status: 'PENDING' })).toBe(false);
    expect(isShareSettlementRequested({ settlement_status: 'REQUESTED' })).toBe(true);
    expect(isShareSettlementRequested({ settlement_status: 'PENDING' })).toBe(false);
  });
});
