import { localDateKey } from '@/lib/recurrence';
import type { MemberPresencePeriod, MemberSystemLeave } from '@/schemas/presence.schema';

type PresenceLike = Pick<MemberPresencePeriod, 'user_id' | 'start_date' | 'end_date'>;
type LeaveLike = Pick<MemberSystemLeave, 'user_id' | 'kind' | 'start_date' | 'end_date'>;

/**
 * First calendar day of the month for a Date (YYYY-MM-01).
 */
export function toYearMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

/**
 * Last calendar day of the month for a YYYY-MM-01 key.
 */
export function lastDateKeyOfMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const last = new Date(year, month, 0);
  return localDateKey(last);
}

/**
 * True when a period is exactly one calendar month.
 */
export function isFullMonthPeriod(period: Pick<PresenceLike, 'start_date' | 'end_date'>): boolean {
  if (!/^\d{4}-\d{2}-01$/.test(period.start_date)) {
    return false;
  }
  return period.end_date === lastDateKeyOfMonth(period.start_date);
}

/**
 * Short label for a YYYY-MM-01 key (e.g. "sep 2026").
 */
export function formatYearMonthKey(key: string): string {
  const [year, month] = key.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat('es-ES', { month: 'short', year: 'numeric' }).format(date);
}

/**
 * Builds the next `count` month keys starting from `from` (inclusive).
 */
export function upcomingYearMonthKeys(from: Date = new Date(), count = 12): string[] {
  const keys: string[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), 1);
  for (let i = 0; i < count; i += 1) {
    keys.push(toYearMonthKey(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return keys;
}

/**
 * True when the user has at least one presence period configured.
 */
export function hasConfiguredPresence(
  periods: readonly PresenceLike[],
  userId: string | null | undefined,
): boolean {
  if (!userId) {
    return false;
  }
  return periods.some((row) => row.user_id === userId);
}

/**
 * True when the user is marked present on the given day.
 * If presence is not configured, returns true (backward compatible).
 */
export function isUserPresentOnDate(
  periods: readonly PresenceLike[],
  userId: string | null | undefined,
  date: Date = new Date(),
): boolean {
  if (!userId) {
    return true;
  }
  const mine = periods.filter((row) => row.user_id === userId);
  if (mine.length === 0) {
    return true;
  }
  const key = localDateKey(date);
  return mine.some((row) => key >= row.start_date && key <= row.end_date);
}

/**
 * @deprecated Use {@link isUserPresentOnDate}.
 */
export function isUserPresentInMonth(
  periods: readonly PresenceLike[],
  userId: string | null | undefined,
  date: Date = new Date(),
): boolean {
  return isUserPresentOnDate(periods, userId, date);
}

/**
 * True when a system leave row covers the calendar day.
 */
export function isUserOnSystemLeaveRow(
  leaves: readonly LeaveLike[],
  userId: string | null | undefined,
  date: Date = new Date(),
): boolean {
  if (!userId) {
    return false;
  }
  const key = localDateKey(date);
  return leaves.some((leave) => {
    if (leave.user_id !== userId) {
      return false;
    }
    if (key < leave.start_date) {
      return false;
    }
    if (leave.end_date == null) {
      return true;
    }
    return key <= leave.end_date;
  });
}

/**
 * Full system freeze from an active indefinite/planned leave only.
 */
export function isUserSystemFrozen(params: {
  leaves: readonly LeaveLike[];
  /** @deprecated Presence/estancia removed from product; ignored. */
  presencePeriods?: readonly PresenceLike[];
  /** @deprecated */
  presenceMonths?: readonly PresenceLike[];
  userId: string | null | undefined;
  date?: Date;
}): boolean {
  const date = params.date ?? new Date();
  return isUserOnSystemLeaveRow(params.leaves, params.userId, date);
}

/**
 * Active leave rows for a user on a day (for UI badges).
 */
export function systemLeavesOnDate(
  leaves: readonly LeaveLike[],
  date: Date = new Date(),
): LeaveLike[] {
  const key = localDateKey(date);
  return leaves.filter((leave) => {
    if (key < leave.start_date) {
      return false;
    }
    if (leave.end_date == null) {
      return true;
    }
    return key <= leave.end_date;
  });
}

/**
 * Copy for punctual absence save when open tasks exist in range.
 */
export function punctualAbsenceTaskWarning(taskCount: number): string {
  if (taskCount <= 0) {
    return '';
  }
  return taskCount === 1
    ? 'Hay 1 tarea asignada en esas fechas. Las rotativas se reasignarán a un compañero.'
    : `Hay ${taskCount} tareas asignadas en esas fechas. Las rotativas se reasignarán a un compañero.`;
}
