import type { ExpenseOwnershipLabel } from '@/features/expenses/lib/expense-ownership';
import type { AppLocale } from '@/lib/i18n/types';
import { translate } from '@/lib/i18n/strings';
import type { ExpenseKind } from '@/types/expense';
import type { TaskCategory } from '@/types/task-category';
import type { RecurrenceKind } from '@/lib/recurrence';

type TFn = (key: string, vars?: Record<string, string | number>) => string;

/**
 * Displays task ownership chip (internal labels stay Spanish for comparisons).
 */
export function displayTaskOwnership(
  label: 'Tuya' | 'Compañero' | null,
  t: TFn,
): string | null {
  if (label === 'Tuya') {
    return t('chip.yours');
  }
  if (label === 'Compañero') {
    return t('chip.peer');
  }
  return null;
}

/**
 * Displays expense ownership chip.
 */
export function displayExpenseOwnership(label: ExpenseOwnershipLabel | null, t: TFn): string | null {
  if (!label) {
    return null;
  }
  if (label === 'Tú pagaste') {
    return t('chip.youPaid');
  }
  if (label === 'Debes') {
    return t('chip.youOwe');
  }
  if (label === 'Pagado') {
    return t('chip.paid');
  }
  return label;
}

/**
 * Maps a status badge Spanish label to the active locale.
 */
export function displayStatusLabel(label: string, t: TFn): string {
  const map: Record<string, string> = {
    Pendiente: 'status.pending',
    'En revisión': 'status.review',
    Completado: 'status.completed',
    Saldado: 'status.settled',
    Atrasado: 'status.overdue',
    'Por compañero': 'status.peer',
    Omitida: 'status.skippedF',
    Omitido: 'status.skipped',
    Pausado: 'status.paused',
    Solicitado: 'status.requested',
    Archivado: 'status.archived',
    'Sin importe': 'status.noAmount',
  };
  const key = map[label];
  return key ? t(key) : label;
}

/**
 * Expense kind label for filters / cards.
 */
export function displayExpenseKind(kind: ExpenseKind, t: TFn): string {
  if (kind === 'GROCERY') {
    return t('kind.grocery');
  }
  if (kind === 'HOUSE') {
    return t('kind.house');
  }
  return t('kind.peer');
}

/**
 * Task category label for filters / cards.
 */
export function displayTaskCategory(category: TaskCategory, t: TFn): string {
  if (category === 'QUICK') {
    return t('kind.quick');
  }
  if (category === 'ZONE') {
    return t('kind.zone');
  }
  return t('kind.grocery');
}

/**
 * Recurrence kind short label.
 */
export function displayRecurrenceKind(kind: RecurrenceKind, t: TFn): string {
  const map: Record<RecurrenceKind, string> = {
    ONCE: 'recurrence.once',
    DAILY: 'recurrence.daily',
    WEEKLY: 'recurrence.weekly',
    MONTHLY: 'recurrence.monthly',
    YEARLY: 'recurrence.yearly',
  };
  return t(map[kind]);
}

/**
 * Convenience translator bound to a locale (non-React helpers).
 */
export function tLocale(locale: AppLocale): TFn {
  return (key, vars) => translate(locale, key, vars);
}

/**
 * Monday-first single-letter weekday headers for calendars.
 */
export function calendarDowLabels(locale: AppLocale): string[] {
  return locale === 'en'
    ? ['M', 'T', 'W', 'T', 'F', 'S', 'S']
    : ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
}

/**
 * Short month labels (3 letters) for recurrence month chips.
 */
export function calendarMonthShortLabels(locale: AppLocale): string[] {
  const intl = locale === 'en' ? 'en-US' : 'es-ES';
  return Array.from({ length: 12 }, (_, index) => {
    const raw = new Intl.DateTimeFormat(intl, { month: 'short' }).format(
      new Date(2000, index, 1),
    );
    return raw.replace(/\.$/, '').slice(0, 3);
  });
}
