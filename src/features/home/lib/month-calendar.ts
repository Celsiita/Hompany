import { startOfDay } from '@/features/home/lib/agenda-items';

export type MonthCell = {
  /** Local calendar day, or null for empty padding cells. */
  date: Date | null;
  inMonth: boolean;
  isToday: boolean;
};

/**
 * Monday-first week index (0 = Monday … 6 = Sunday).
 */
export function mondayFirstWeekday(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

/**
 * First day of the month containing `anchor` (local midnight).
 */
export function startOfMonth(anchor: Date): Date {
  return startOfDay(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
}

/**
 * Builds a 6×7 (or shorter) grid of cells for a month view, Monday-first.
 */
export function buildMonthCells(anchor: Date, today: Date = new Date()): MonthCell[] {
  const monthStart = startOfMonth(anchor);
  const todayKey = startOfDay(today).getTime();
  const leading = mondayFirstWeekday(monthStart);
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const total = Math.ceil((leading + daysInMonth) / 7) * 7;
  const cells: MonthCell[] = [];

  for (let index = 0; index < total; index += 1) {
    const dayNumber = index - leading + 1;
    if (dayNumber < 1 || dayNumber > daysInMonth) {
      cells.push({ date: null, inMonth: false, isToday: false });
      continue;
    }
    const date = startOfDay(new Date(monthStart.getFullYear(), monthStart.getMonth(), dayNumber));
    cells.push({
      date,
      inMonth: true,
      isToday: date.getTime() === todayKey,
    });
  }

  return cells;
}

/**
 * Formats a month title in Spanish (e.g. "agosto 2026").
 */
export function formatMonthTitle(anchor: Date): string {
  const label = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(anchor);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Shifts `anchor` by `delta` months, keeping day 1.
 */
export function shiftMonth(anchor: Date, delta: number): Date {
  return startOfMonth(new Date(anchor.getFullYear(), anchor.getMonth() + delta, 1));
}
