import { isShareSettled } from '@/features/expenses/lib/expense-settlement';

export type ExpenseOwnershipLabel = 'Tú pagaste' | 'Debes' | 'Pagado';

type ShareLike = {
  user_id: string;
  settlement_status?: 'PENDING' | 'REQUESTED' | 'SETTLED' | null;
  is_settled?: boolean;
};

type ExpenseLike = {
  paid_by: string;
  expense_shares: readonly ShareLike[];
};

/**
 * Personal ownership chip for the current viewer on an expense card.
 */
export function expenseOwnershipLabel(
  expense: ExpenseLike,
  currentUserId: string | null | undefined,
): ExpenseOwnershipLabel | null {
  if (!currentUserId) {
    return null;
  }
  if (currentUserId === expense.paid_by) {
    return 'Tú pagaste';
  }
  const myShare = expense.expense_shares.find(
    (share) => share.user_id === currentUserId && share.user_id !== expense.paid_by,
  );
  if (!myShare) {
    return null;
  }
  return isShareSettled(myShare) ? 'Pagado' : 'Debes';
}
