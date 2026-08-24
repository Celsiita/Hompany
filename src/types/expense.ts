/**
 * Expense kinds shown in the Gastos tab (not task board categories).
 */
export const EXPENSE_KIND = {
  GROCERY: 'GROCERY',
  HOUSE: 'HOUSE',
  PEER: 'PEER',
} as const;

export type ExpenseKind = (typeof EXPENSE_KIND)[keyof typeof EXPENSE_KIND];

export const EXPENSE_KIND_VALUES = Object.values(EXPENSE_KIND) as [
  ExpenseKind,
  ...ExpenseKind[],
];

export const EXPENSE_KIND_LABEL: Record<ExpenseKind, string> = {
  GROCERY: 'Supermercado',
  HOUSE: 'Casa',
  PEER: 'Ocio',
};

export const EXPENSE_KIND_EMOJI: Record<ExpenseKind, string> = {
  GROCERY: '🛒',
  HOUSE: '🏠',
  PEER: '🤝',
};

export const EXPENSE_STATUS = {
  OPEN: 'OPEN',
  SETTLED: 'SETTLED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type ExpenseStatus = (typeof EXPENSE_STATUS)[keyof typeof EXPENSE_STATUS];

export const EXPENSE_RECURRENCE = {
  ONCE: 'ONCE',
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
} as const;

export type ExpenseRecurrence =
  (typeof EXPENSE_RECURRENCE)[keyof typeof EXPENSE_RECURRENCE];
