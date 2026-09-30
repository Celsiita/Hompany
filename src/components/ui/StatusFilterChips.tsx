import { ToggleChipRow } from '@/components/ui/ToggleChipRow';
import { useLocale } from '@/providers/LocaleProvider';

export type TaskBoardStatusFilter =
  | 'ALL'
  | 'PENDING'
  | 'SUBMITTED'
  | 'PAUSED'
  | 'COMPLETED'
  | 'RESOLVED_LATE'
  | 'RESOLVED_BY_PEER'
  | 'SKIPPED';

export type ExpenseBoardStatusFilter =
  | 'ALL'
  | 'OPEN'
  | 'REQUESTED'
  | 'OVERDUE'
  | 'PAUSED'
  | 'SETTLED'
  | 'SKIPPED';

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
  const { t } = useLocale();
  const chips = history
    ? [
        { key: 'COMPLETED' as const, label: t('status.completed') },
        { key: 'RESOLVED_BY_PEER' as const, label: t('status.peer') },
        { key: 'RESOLVED_LATE' as const, label: t('status.overdue') },
        { key: 'SKIPPED' as const, label: t('status.skipped') },
      ]
    : [
        { key: 'PENDING' as const, label: t('status.pending') },
        { key: 'SUBMITTED' as const, label: t('status.review') },
        { key: 'PAUSED' as const, label: t('status.paused') },
      ];
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
  const { t } = useLocale();
  const chips = history
    ? [
        { key: 'SETTLED' as const, label: t('status.settled') },
        { key: 'OVERDUE' as const, label: t('status.overdue') },
        { key: 'SKIPPED' as const, label: t('status.skipped') },
      ]
    : [
        { key: 'OPEN' as const, label: t('status.pending') },
        { key: 'REQUESTED' as const, label: t('status.requested') },
        { key: 'PAUSED' as const, label: t('status.paused') },
      ];
  return <ToggleChipRow value={value} chips={chips} onChange={onChange} />;
}
