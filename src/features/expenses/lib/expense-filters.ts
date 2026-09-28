import type { ExpenseBoardStatusFilter } from '@/components/ui/StatusFilterChips';
import type { RecurrenceFilter } from '@/components/ui/RecurrenceFilterChips';
import { isShareSettlementRequested } from '@/features/expenses/lib/expense-settlement';
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
 * Returns whether the user has an outstanding share (owes the payer).
 */
export function isUserOwesExpense(
  expense: ExpenseWithRelations,
  userId: string | null | undefined,
): boolean {
  if (!userId) {
    return false;
  }
  return expense.expense_shares.some(
    (share) => share.user_id === userId && share.user_id !== expense.paid_by,
  );
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
  if (kind === 'GROCERY' || kind === 'HOUSE' || kind === 'PEER') {
    return expenses.filter((expense) => expense.kind === kind && !expense.item_type_id);
  }
  return expenses.filter((expense) => expense.item_type_id === kind);
}

/**
 * True when an open expense is past its due date.
 */
export function isExpenseOverdue(
  expense: ExpenseWithRelations,
  now: Date = new Date(),
): boolean {
  if (expense.status !== 'OPEN' || isExpensePaused(expense) || !expense.due_at) {
    return false;
  }
  return Date.parse(expense.due_at) < now.getTime();
}

/**
 * True when any debtor share is awaiting creditor confirmation.
 */
export function isExpenseSettlementRequested(expense: ExpenseWithRelations): boolean {
  if (expense.status !== 'OPEN' || isExpensePaused(expense)) {
    return false;
  }
  return expense.expense_shares.some(
    (share) =>
      share.user_id !== expense.paid_by && isShareSettlementRequested(share),
  );
}

/**
 * True when a closed expense finished after its due date (late settlement / skip).
 */
export function isExpenseSettledLate(expense: ExpenseWithRelations): boolean {
  if (expense.status !== 'SETTLED' && expense.status !== 'SKIPPED') {
    return false;
  }
  if (!expense.due_at) {
    return false;
  }
  const doneAt = Date.parse(expense.completed_at ?? expense.updated_at);
  return Number.isFinite(doneAt) && doneAt > Date.parse(expense.due_at);
}

function dueAtMs(expense: ExpenseWithRelations): number {
  return expense.due_at ? Date.parse(expense.due_at) : Number.POSITIVE_INFINITY;
}

function historyDateMs(expense: ExpenseWithRelations): number {
  return Date.parse(expense.completed_at ?? expense.updated_at ?? expense.due_at ?? 0);
}

/**
 * En curso: solicitado → pendiente → atrasados → pausado; within group closest due first.
 */
export function sortOpenBoardExpenses(
  expenses: ExpenseWithRelations[],
  now: Date = new Date(),
): ExpenseWithRelations[] {
  const rank = (expense: ExpenseWithRelations): number => {
    if (isExpensePaused(expense)) {
      return 3;
    }
    if (isExpenseSettlementRequested(expense)) {
      return 0;
    }
    if (isExpenseOverdue(expense, now)) {
      return 2;
    }
    return 1;
  };

  return [...expenses].sort((a, b) => {
    const rankDiff = rank(a) - rank(b);
    if (rankDiff !== 0) {
      return rankDiff;
    }
    return dueAtMs(a) - dueAtMs(b);
  });
}

/**
 * Historial: only by date (most recent first).
 */
export function sortHistoryBoardExpenses(expenses: ExpenseWithRelations[]): ExpenseWithRelations[] {
  return [...expenses].sort((a, b) => historyDateMs(b) - historyDateMs(a));
}

/**
 * Filters expenses by board status chip (open/history sub-states).
 */
export function filterExpensesByBoardStatus(
  expenses: ExpenseWithRelations[],
  status: ExpenseBoardStatusFilter,
  now: Date = new Date(),
): ExpenseWithRelations[] {
  if (status === 'ALL') {
    return expenses;
  }
  if (status === 'PAUSED') {
    return expenses.filter((expense) => isExpensePaused(expense));
  }
  if (status === 'REQUESTED') {
    return expenses.filter((expense) => isExpenseSettlementRequested(expense));
  }
  if (status === 'OVERDUE') {
    return expenses.filter((expense) => isExpenseSettledLate(expense));
  }
  if (status === 'OPEN') {
    return expenses.filter(
      (expense) =>
        expense.status === 'OPEN' &&
        !isExpensePaused(expense) &&
        !isExpenseSettlementRequested(expense),
    );
  }
  if (status === 'SETTLED') {
    return expenses.filter(
      (expense) => expense.status === 'SETTLED' && !isExpenseSettledLate(expense),
    );
  }
  if (status === 'SKIPPED') {
    return expenses.filter((expense) => expense.status === 'SKIPPED');
  }
  return expenses.filter((expense) => expense.status === status);
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
  return (
    expense.recurrence !== 'ONCE' &&
    isRecurrencePaused(parseRecurrenceConfig(expense.recurrence_config))
  );
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
  boardStatus?: ExpenseBoardStatusFilter;
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
  const byBoardStatus = filterExpensesByBoardStatus(byRecurrence, params.boardStatus ?? 'ALL');
  return filterExpensesByStatus(byBoardStatus, params.status);
}
