import type { RecurrenceFilter } from '@/components/ui/RecurrenceFilterChips';
import { isRecurrencePaused, parseRecurrenceConfig } from '@/lib/recurrence';
import type {
  ExpenseInvolvementFilter,
  ExpenseKindFilter,
  ExpenseStatusFilter,
} from '@/schemas/expense.schema';
import type { ExpenseWithRelations } from '@/types/database.types';

/**
 * Returns whether the user paid or has a share in the expense.
 */
export function isUserInvolvedInExpense(
  expense: ExpenseWithRelations,
  userId: string | null | undefined,
): boolean {
  if (!userId) {
    return false;
  }
  if (expense.paid_by === userId) {
    return true;
  }
  return expense.expense_shares.some((share) => share.user_id === userId);
}

/**
 * Filters expenses by personal debt direction.
 * `ALL` (no pill) shows every expense the user is involved in.
 */
export function filterExpensesByInvolvement(
  expenses: ExpenseWithRelations[],
  scope: ExpenseInvolvementFilter,
  userId: string | null | undefined,
): ExpenseWithRelations[] {
  if (!userId) {
    return [];
  }

  if (scope === 'ALL') {
    return expenses.filter((expense) => isUserInvolvedInExpense(expense, userId));
  }

  if (scope === 'I_OWE') {
    return expenses.filter((expense) =>
      expense.expense_shares.some(
        (share) => share.user_id === userId && share.user_id !== expense.paid_by,
      ),
    );
  }

  return expenses.filter(
    (expense) =>
      expense.paid_by === userId &&
      expense.expense_shares.some((share) => share.user_id !== userId),
  );
}

/**
 * Filters expenses by Gastos tab kind chips.
 */
export function filterExpensesByKind(
  expenses: ExpenseWithRelations[],
  kind: ExpenseKindFilter,
): ExpenseWithRelations[] {
  if (kind === 'ALL') {
    return expenses;
  }
  return expenses.filter((expense) => expense.kind === kind);
}

/**
 * Filters expenses by open vs settled.
 */
export function filterExpensesByStatus(
  expenses: ExpenseWithRelations[],
  status: ExpenseStatusFilter,
): ExpenseWithRelations[] {
  return expenses.filter((expense) => expense.status === status);
}

/**
 * Filters expenses by recurrence chip.
 */
export function filterExpensesByRecurrence(
  expenses: ExpenseWithRelations[],
  recurrence: RecurrenceFilter,
): ExpenseWithRelations[] {
  if (recurrence === 'ALL') {
    return expenses;
  }
  return expenses.filter((expense) => expense.recurrence === recurrence);
}

export function isExpensePaused(expense: ExpenseWithRelations): boolean {
  return expense.recurrence !== 'ONCE' && isRecurrencePaused(parseRecurrenceConfig(expense.recurrence_config));
}

/**
 * Builds the share participant list from debtors and optional payer split.
 */
export function buildExpenseParticipantIds(params: {
  paidBy: string;
  debtorIds: string[];
  includePayerInSplit: boolean;
}): string[] {
  const debtors = params.debtorIds.filter((id) => id !== params.paidBy);
  if (params.includePayerInSplit) {
    return [params.paidBy, ...debtors];
  }
  return debtors.length > 0 ? debtors : params.debtorIds;
}

/**
 * Applies involvement + kind + status filters together.
 */
export function applyExpenseBoardFilters(params: {
  expenses: ExpenseWithRelations[];
  kind: ExpenseKindFilter;
  status: ExpenseStatusFilter;
  involvement: ExpenseInvolvementFilter;
  userId: string | null | undefined;
  recurrence?: RecurrenceFilter;
}): ExpenseWithRelations[] {
  const byInvolvement = filterExpensesByInvolvement(
    params.expenses,
    params.involvement,
    params.userId,
  );
  const byKind = filterExpensesByKind(byInvolvement, params.kind);
  const byRecurrence = filterExpensesByRecurrence(byKind, params.recurrence ?? 'ALL');
  return filterExpensesByStatus(byRecurrence, params.status);
}
