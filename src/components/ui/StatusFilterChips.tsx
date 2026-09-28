import { ToggleChipRow } from '@/components/ui/ToggleChipRow';

export type TaskBoardStatusFilter =
  | 'ALL'
  | 'PENDING'
  | 'SUBMITTED'
  | 'PAUSED'
  | 'COMPLETED'
  | 'RESOLVED_LATE'
  | 'SKIPPED';

export type ExpenseBoardStatusFilter =
  | 'ALL'
  | 'OPEN'
  | 'REQUESTED'
  | 'OVERDUE'
  | 'PAUSED'
  | 'SETTLED'
  | 'SKIPPED';

const TASK_OPEN_CHIPS: { key: Exclude<TaskBoardStatusFilter, 'ALL'>; label: string }[] = [
  { key: 'PENDING', label: 'Pendiente' },
  { key: 'SUBMITTED', label: 'En revisión' },
  { key: 'PAUSED', label: 'Pausado' },
];

const TASK_HISTORY_CHIPS: { key: Exclude<TaskBoardStatusFilter, 'ALL'>; label: string }[] = [
  { key: 'COMPLETED', label: 'Completado' },
  { key: 'RESOLVED_LATE', label: 'Atrasado' },
  { key: 'SKIPPED', label: 'Omitido' },
];

const EXPENSE_OPEN_CHIPS: { key: Exclude<ExpenseBoardStatusFilter, 'ALL'>; label: string }[] = [
  { key: 'OPEN', label: 'Pendiente' },
  { key: 'REQUESTED', label: 'Solicitado' },
  { key: 'PAUSED', label: 'Pausado' },
];

const EXPENSE_HISTORY_CHIPS: { key: Exclude<ExpenseBoardStatusFilter, 'ALL'>; label: string }[] = [
  { key: 'SETTLED', label: 'Saldado' },
  { key: 'OVERDUE', label: 'Atrasado' },
  { key: 'SKIPPED', label: 'Omitido' },
];

type TaskStatusFilterChipsProps = {
  value: TaskBoardStatusFilter;
  onChange: (value: TaskBoardStatusFilter) => void;
  history?: boolean;
};

type ExpenseStatusFilterChipsProps = {
  value: ExpenseBoardStatusFilter;
  onChange: (value: ExpenseBoardStatusFilter) => void;
  history?: boolean;
};

/**
 * Task status pills: En curso (pendiente / revisión / pausado) o Historial.
 */
export function TaskStatusFilterChips({ value, onChange, history = false }: TaskStatusFilterChipsProps) {
  const chips = history ? TASK_HISTORY_CHIPS : TASK_OPEN_CHIPS;
  return <ToggleChipRow value={value} chips={chips} onChange={onChange} />;
}

/**
 * Expense status pills: En curso (pendiente / solicitado / pausado) o Historial.
 */
export function ExpenseStatusFilterChips({
  value,
  onChange,
  history = false,
}: ExpenseStatusFilterChipsProps) {
  const chips = history ? EXPENSE_HISTORY_CHIPS : EXPENSE_OPEN_CHIPS;
  return <ToggleChipRow value={value} chips={chips} onChange={onChange} />;
}
