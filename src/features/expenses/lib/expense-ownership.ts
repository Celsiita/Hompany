import { isShareSettled } from '@/features/expenses/lib/expense-settlement';
import type { ExpenseShareWithProfile, ExpenseWithRelations } from '@/types/database.types';

export type ExpenseOwnershipLabel = 'Tú pagaste' | 'Debes' | 'Pagado';

/**
 * Personal ownership chip for the current viewer on an expense card.
 */
export function expenseOwnershipLabel(
  expense: Pick<ExpenseWithRelations, 'paid_by' | 'expense_shares'>,
  currentUserId: string | null | undefined,
): ExpenseOwnershipLabel | null {
  if (!currentUserId) {
    return null;
  }
  if (currentUserId === expense.paid_by) {
    return 'Tú pagaste';
  }
  const myShare = expense.expense_shares.find(
    (share: ExpenseShareWithProfile) =>
      share.user_id === currentUserId && share.user_id !== expense.paid_by,
  );
  if (!myShare) {
    return null;
  }
  return isShareSettled(myShare) ? 'Pagado' : 'Debes';
}
