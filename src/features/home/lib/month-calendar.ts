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

/**
 * Monday of the week containing `anchor` (local midnight). Used by the month grid.
 */
export function startOfWeek(anchor: Date): Date {
  const date = startOfDay(anchor);
  const weekday = mondayFirstWeekday(date);
  date.setDate(date.getDate() - weekday);
  return date;
}

/**
 * Seven consecutive local days starting on `anchor` (rolling week, not Monday-based).
 * Agenda week view uses today as the first day so past days stay hidden.
 */
export function daysInWeek(anchor: Date): Date[] {
  const start = startOfDay(anchor);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return startOfDay(day);
  });
}

/**
 * Earliest allowed week-view anchor (today). Prevents navigating into past days.
 */
export function clampWeekAnchor(anchor: Date, today: Date = new Date()): Date {
  const start = startOfDay(anchor);
  const min = startOfDay(today);
  return start.getTime() < min.getTime() ? min : start;
}

/**
 * All local days in the month of `monthAnchor` (day 1 of that month).
 */
export function daysInMonth(monthAnchor: Date): Date[] {
  const monthStart = startOfMonth(monthAnchor);
  const count = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  return Array.from({ length: count }, (_, index) =>
    startOfDay(new Date(monthStart.getFullYear(), monthStart.getMonth(), index + 1)),
  );
}

/**
 * Month title for agenda calendar. When the visible week contains today, uses today's month.
 */
export function monthTitleForCalendar(params: {
  expanded: boolean;
  visibleMonth: Date;
  weekDays: Date[];
  now: Date;
}): string {
  if (params.expanded) {
    return formatMonthTitle(params.visibleMonth);
  }
  const todayKey = startOfDay(params.now).getTime();
  if (params.weekDays.some((day) => startOfDay(day).getTime() === todayKey)) {
    return formatMonthTitle(startOfMonth(params.now));
  }
  const pivot = params.weekDays[params.weekDays.length - 1] ?? params.now;
  return formatMonthTitle(startOfMonth(pivot));
}

/**
 * Month to show when expanding from week view (prefers the month containing today).
 */
export function monthForExpandedView(weekDays: Date[], now: Date): Date {
  const todayKey = startOfDay(now).getTime();
  if (weekDays.some((day) => startOfDay(day).getTime() === todayKey)) {
    return startOfMonth(now);
  }
  return startOfMonth(weekDays[3] ?? now);
}

/**
 * Shifts a rolling week anchor by `delta` weeks (7-day steps from `anchor`).
 * Does not go before `today` when provided (defaults to now).
 */
export function shiftWeek(anchor: Date, delta: number, today: Date = new Date()): Date {
  const start = startOfDay(anchor);
  start.setDate(start.getDate() + delta * 7);
  return clampWeekAnchor(start, today);
}

/**
 * True when the calendar day falls inside the visible week.
 */
export function isDayInWeek(day: Date, weekDays: Date[]): boolean {
  const key = startOfDay(day).getTime();
  return weekDays.some((candidate) => startOfDay(candidate).getTime() === key);
}
