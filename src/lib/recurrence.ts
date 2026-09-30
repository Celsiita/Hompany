import { z } from 'zod';

export const recurrenceKindSchema = z.enum(['ONCE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']);
export type RecurrenceKind = z.infer<typeof recurrenceKindSchema>;

export const dueModeSchema = z.enum(['DEADLINE', 'EXECUTION']);
export type DueMode = z.infer<typeof dueModeSchema>;

/** @deprecated Prefer starts_at + due_at schedule window in the UI. */
export const DUE_MODE_LABEL: Record<DueMode, string> = {
  DEADLINE: 'Fecha límite',
  EXECUTION: 'Fecha de ejecución',
};

/** @deprecated Prefer starts_at + due_at schedule window in the UI. */
export const DUE_MODE_HINT: Record<DueMode, string> = {
  DEADLINE: 'Momento máximo para completar o pagar.',
  EXECUTION: 'Día exacto programado para hacerlo.',
};

export const recurrenceDueDayTypeSchema = z.enum(['SPECIFIC_DAY', 'LAST_DAY_OF_MONTH']);

export const recurrenceFrequencyUnitSchema = z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']);
export type RecurrenceFrequencyUnit = z.infer<typeof recurrenceFrequencyUnitSchema>;

export const recurrenceConfigSchema = z.object({
  /** Repeat every N units (default 1). */
  interval: z.number().int().min(1).max(365).optional(),
  day_of_week: z.number().int().min(1).max(7).optional(),
  /** Multiple weekdays when frequency is WEEKLY (1=Mon … 7=Sun). */
  days_of_week: z.array(z.number().int().min(1).max(7)).optional(),
  due_day_type: recurrenceDueDayTypeSchema.optional(),
  day_of_month: z.number().int().min(1).max(31).optional(),
  /** Multiple month days when frequency is MONTHLY. */
  days_of_month: z.array(z.number().int().min(1).max(31)).optional(),
  /** Months 1–12 when frequency is YEARLY (empty = every month). */
  active_months: z.array(z.number().int().min(1).max(12)).optional(),
  is_paused: z.boolean().optional(),
  /** Local calendar days (YYYY-MM-DD) cancelled without breaking the series. */
  skipped_dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  /** Point assignee overrides keyed by YYYY-MM-DD (does not change template rotation). */
  assignee_overrides: z.record(z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.string().uuid()).optional(),
});

export type RecurrenceConfig = z.infer<typeof recurrenceConfigSchema>;

export const RECURRENCE_KIND_LABEL: Record<RecurrenceKind, string> = {
  ONCE: 'Una vez',
  DAILY: 'Diaria',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensual',
  YEARLY: 'Anual',
};

export const RECURRENCE_FREQUENCY_UNIT_LABEL: Record<RecurrenceFrequencyUnit, string> = {
  DAILY: 'Día(s)',
  WEEKLY: 'Semana(s)',
  MONTHLY: 'Mes(es)',
  YEARLY: 'Año(s)',
};

export type ScheduleAvailability = 'available' | 'locked' | 'overdue';

/**
 * Normalized repeat interval (>= 1).
 */
export function recurrenceInterval(config: RecurrenceConfig | null | undefined): number {
  const raw = config?.interval ?? 1;
  return Number.isFinite(raw) && raw >= 1 ? Math.min(365, Math.floor(raw)) : 1;
}

export const WEEKDAY_CHIPS: { value: number; label: string }[] = [
  { value: 1, label: 'L' },
  { value: 2, label: 'M' },
  { value: 3, label: 'X' },
  { value: 4, label: 'J' },
  { value: 5, label: 'V' },
  { value: 6, label: 'S' },
  { value: 7, label: 'D' },
];

export const MONTH_LABELS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

const CYCLE_SUFFIX =
  / - (Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre) \d{4}$/;
const DATE_SUFFIX = / - \d{1,2} [a-zA-Záéíóúü.]{3,}(\s\d{4})?$/;

/**
 * Parses a stored JSON recurrence config, falling back to an empty object.
 */
export function parseRecurrenceConfig(value: unknown): RecurrenceConfig {
  const parsed = recurrenceConfigSchema.safeParse(value ?? {});
  return parsed.success ? parsed.data : {};
}

/**
 * Returns whether recurrence spawning is paused indefinitely.
 */
export function isRecurrencePaused(config: RecurrenceConfig | null | undefined): boolean {
  return Boolean(config?.is_paused);
}

/**
 * ISO weekday 1 (Monday) through 7 (Sunday).
 */
export function isoWeekday(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

/**
 * Weekdays selected for WEEKLY rules (falls back to single day_of_week).
 */
export function weeklyDays(config: RecurrenceConfig | null | undefined, fallbackFrom?: Date): number[] {
  const multi = config?.days_of_week?.filter((d) => d >= 1 && d <= 7);
  if (multi && multi.length > 0) {
    return Array.from(new Set(multi)).sort((a, b) => a - b);
  }
  const single = config?.day_of_week ?? (fallbackFrom ? isoWeekday(fallbackFrom) : 1);
  return [single];
}

/**
 * Days of month for MONTHLY rules (1–31).
 */
export function monthlyDays(config: RecurrenceConfig | null | undefined, fallbackFrom?: Date): number[] {
  const multi = config?.days_of_month?.filter((d) => d >= 1 && d <= 31);
  if (multi && multi.length > 0) {
    return Array.from(new Set(multi)).sort((a, b) => a - b);
  }
  if (config?.due_day_type === 'LAST_DAY_OF_MONTH') {
    return [];
  }
  const single = config?.day_of_month ?? (fallbackFrom ? fallbackFrom.getDate() : 1);
  return [single];
}

/**
 * Months (1–12) for YEARLY rules. Empty means every month is allowed.
 */
export function yearlyMonths(config: RecurrenceConfig | null | undefined, fallbackFrom?: Date): number[] {
  const multi = config?.active_months?.filter((m) => m >= 1 && m <= 12);
  if (multi && multi.length > 0) {
    return Array.from(new Set(multi)).sort((a, b) => a - b);
  }
  if (fallbackFrom) {
    return [fallbackFrom.getMonth() + 1];
  }
  return [];
}

/**
 * Combines a calendar day with hours/minutes from a time source.
 */
export function combineDateAndTime(day: Date, timeSource: Date): Date {
  const next = startOfLocalDay(day);
  next.setHours(timeSource.getHours(), timeSource.getMinutes(), 0, 0);
  return next;
}

/**
 * Applies calendar range + all-day / clock times to starts_at + due_at.
 */
export function buildScheduleFromRange(params: {
  rangeStart: Date;
  rangeEnd: Date;
  allDay: boolean;
  startTime?: Date;
  endTime?: Date;
}): { startsAt: Date; dueAt: Date } {
  const from = startOfLocalDay(params.rangeStart);
  const to = startOfLocalDay(params.rangeEnd);
  const startDay = from.getTime() <= to.getTime() ? from : to;
  const endDay = from.getTime() <= to.getTime() ? to : from;
  if (params.allDay) {
    return { startsAt: startOfLocalDay(startDay), dueAt: endOfLocalDay(endDay) };
  }
  const startTime = params.startTime ?? combineDateAndTime(startDay, new Date(0, 0, 0, 9, 0));
  const endTime = params.endTime ?? combineDateAndTime(endDay, new Date(0, 0, 0, 18, 0));
  let startsAt = combineDateAndTime(startDay, startTime);
  let dueAt = combineDateAndTime(endDay, endTime);
  if (dueAt.getTime() < startsAt.getTime()) {
    dueAt = new Date(startsAt.getTime() + 60 * 60 * 1000);
  }
  return { startsAt, dueAt };
}

/**
 * Local calendar start of day (00:00).
 */
export function startOfLocalDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

/**
 * Monday 00:00 of the ISO week containing `date`.
 */
export function startOfIsoWeek(date: Date): Date {
  const start = startOfLocalDay(date);
  start.setDate(start.getDate() - (isoWeekday(start) - 1));
  return start;
}

function endOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(23, 59, 0, 0);
  return next;
}

function executionTime(date: Date): Date {
  const next = new Date(date);
  next.setHours(9, 0, 0, 0);
  return next;
}

/**
 * Local end of calendar day (23:59).
 */
export function endOfLocalDay(date: Date): Date {
  return endOfDay(date);
}

/**
 * Applies all-day semantics: starts 00:00, due 23:59 on their calendar days.
 */
export function applyAllDayWindow(startsAt: Date, dueAt: Date): { startsAt: Date; dueAt: Date } {
  return {
    startsAt: startOfLocalDay(startsAt),
    dueAt: endOfLocalDay(dueAt),
  };
}

/**
 * Default schedule window for new items (today 00:00 → today 23:59).
 */
export function defaultScheduleWindow(now = new Date()): { startsAt: Date; dueAt: Date } {
  return applyAllDayWindow(now, now);
}

/**
 * Availability of an item relative to its schedule window.
 * locked: before starts_at; available: within window; overdue: past due_at.
 */
export function scheduleAvailability(params: {
  startsAt?: string | Date | null;
  dueAt: string | Date;
  now?: Date;
}): ScheduleAvailability {
  const now = params.now ?? new Date();
  const due = params.dueAt instanceof Date ? params.dueAt : new Date(params.dueAt);
  const startRaw = params.startsAt ?? params.dueAt;
  const start = startRaw instanceof Date ? startRaw : new Date(startRaw);
  if (Number.isNaN(due.getTime())) {
    return 'available';
  }
  if (now.getTime() > due.getTime()) {
    return 'overdue';
  }
  if (!Number.isNaN(start.getTime()) && now.getTime() < start.getTime()) {
    return 'locked';
  }
  return 'available';
}

/**
 * Shifts starts_at by the same delta as due_at when spawning the next occurrence.
 */
export function shiftStartsAtForNextDue(params: {
  previousStartsAt: string | Date | null | undefined;
  previousDueAt: string | Date;
  nextDueAt: Date;
}): Date {
  const prevDue =
    params.previousDueAt instanceof Date
      ? params.previousDueAt
      : new Date(params.previousDueAt);
  const prevStartRaw = params.previousStartsAt ?? params.previousDueAt;
  const prevStart =
    prevStartRaw instanceof Date ? prevStartRaw : new Date(prevStartRaw);
  if (Number.isNaN(prevDue.getTime()) || Number.isNaN(prevStart.getTime())) {
    return startOfLocalDay(params.nextDueAt);
  }
  const duration = Math.max(0, prevDue.getTime() - prevStart.getTime());
  return new Date(params.nextDueAt.getTime() - duration);
}

/**
 * Human label for interval + unit (e.g. "Cada 2 semanas").
 */
export function recurrenceIntervalLabel(
  recurrence: RecurrenceKind,
  config?: RecurrenceConfig | null,
): string {
  if (recurrence === 'ONCE') {
    return RECURRENCE_KIND_LABEL.ONCE;
  }
  const n = recurrenceInterval(config);
  const plural: Record<Exclude<RecurrenceKind, 'ONCE'>, [string, string]> = {
    DAILY: ['día', 'días'],
    WEEKLY: ['semana', 'semanas'],
    MONTHLY: ['mes', 'meses'],
    YEARLY: ['año', 'años'],
  };
  const [one, many] = plural[recurrence];
  if (n === 1) {
    return `Cada ${one}`;
  }
  return `Cada ${n} ${many}`;
}

/**
 * Inclusive local calendar days in the schedule window (same day = 1).
 */
export function inclusiveCalendarDays(startsAt: Date, dueAt: Date): number {
  const a = startOfLocalDay(startsAt);
  const b = startOfLocalDay(dueAt);
  const from = a.getTime() <= b.getTime() ? a : b;
  const to = a.getTime() <= b.getTime() ? b : a;
  return Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
}

/**
 * Inclusive calendar months spanned by the window (same month = 1).
 */
export function inclusiveCalendarMonths(startsAt: Date, dueAt: Date): number {
  const a = startOfLocalDay(startsAt);
  const b = startOfLocalDay(dueAt);
  const from = a.getTime() <= b.getTime() ? a : b;
  const to = a.getTime() <= b.getTime() ? b : a;
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()) + 1;
}

/**
 * Inclusive calendar years spanned by the window (same year = 1).
 */
export function inclusiveCalendarYears(startsAt: Date, dueAt: Date): number {
  const a = startOfLocalDay(startsAt);
  const b = startOfLocalDay(dueAt);
  const from = a.getTime() <= b.getTime() ? a : b;
  const to = a.getTime() <= b.getTime() ? b : a;
  return to.getFullYear() - from.getFullYear() + 1;
}

/**
 * True when the first-occurrence window is longer than the repeat period
 * (would make successive instances overlap). ONCE always fits.
 */
export function scheduleRangeExceedsRecurrence(params: {
  startsAt: Date;
  dueAt: Date;
  recurrence: RecurrenceKind;
  recurrenceConfig?: RecurrenceConfig | null;
}): boolean {
  const { startsAt, dueAt, recurrence, recurrenceConfig } = params;
  if (recurrence === 'ONCE') {
    return false;
  }
  const interval = recurrenceInterval(recurrenceConfig);
  if (recurrence === 'DAILY') {
    return inclusiveCalendarDays(startsAt, dueAt) > interval;
  }
  if (recurrence === 'WEEKLY') {
    return inclusiveCalendarDays(startsAt, dueAt) > interval * 7;
  }
  if (recurrence === 'MONTHLY') {
    return inclusiveCalendarMonths(startsAt, dueAt) > interval;
  }
  return inclusiveCalendarYears(startsAt, dueAt) > interval;
}

/**
 * User-facing error when the date range is longer than the selected periodicity.
 * Returns null when valid.
 */
export function validateScheduleRangeAgainstRecurrence(params: {
  startsAt: Date;
  dueAt: Date;
  recurrence: RecurrenceKind;
  recurrenceConfig?: RecurrenceConfig | null;
}): string | null {
  if (!scheduleRangeExceedsRecurrence(params)) {
    return null;
  }
  const { startsAt, dueAt, recurrence, recurrenceConfig } = params;
  const periodLabel = recurrenceIntervalLabel(recurrence, recurrenceConfig).toLowerCase();
  if (recurrence === 'MONTHLY') {
    const months = inclusiveCalendarMonths(startsAt, dueAt);
    return `El rango (${months} ${months === 1 ? 'mes' : 'meses'}) no puede ser mayor que la periodicidad (${periodLabel}).`;
  }
  if (recurrence === 'YEARLY') {
    const years = inclusiveCalendarYears(startsAt, dueAt);
    return `El rango (${years} ${years === 1 ? 'año' : 'años'}) no puede ser mayor que la periodicidad (${periodLabel}).`;
  }
  const days = inclusiveCalendarDays(startsAt, dueAt);
  return `El rango (${days} ${days === 1 ? 'día' : 'días'}) no puede ser mayor que la periodicidad (${periodLabel}).`;
}

/**
 * Applies due-mode time semantics to a calendar day.
 * DEADLINE → 23:59 local; EXECUTION → 09:00 local.
 */
export function applyDueModeToDate(date: Date, dueMode: DueMode = 'DEADLINE'): Date {
  return dueMode === 'EXECUTION' ? executionTime(date) : endOfDay(date);
}

/**
 * Form default when picking a due mode.
 * EXECUTION → tomorrow at 09:00 local; DEADLINE → today at 23:59 local.
 */
export function defaultDueAtForMode(dueMode: DueMode, now = new Date()): Date {
  if (dueMode === 'EXECUTION') {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return executionTime(tomorrow);
  }
  return applyDueModeToDate(now, 'DEADLINE');
}

/**
 * True when the candidate calendar day is today or in the future (local).
 */
export function isCurrentOrFutureCalendarDay(candidate: Date, now: Date): boolean {
  return startOfLocalDay(candidate).getTime() >= startOfLocalDay(now).getTime();
}

/**
 * Quick “today” instant according to due mode.
 */
export function dueAtForToday(dueMode: DueMode = 'DEADLINE', now = new Date()): Date {
  return applyDueModeToDate(now, dueMode);
}

function lastDateOfMonth(year: number, monthIndex: number, dueMode: DueMode): Date {
  return applyDueModeToDate(new Date(year, monthIndex + 1, 0), dueMode);
}

function clampDayOfMonth(
  year: number,
  monthIndex: number,
  day: number,
  dueMode: DueMode,
): Date {
  const last = new Date(year, monthIndex + 1, 0).getDate();
  const clamped = Math.min(day, last);
  return applyDueModeToDate(new Date(year, monthIndex, clamped), dueMode);
}

function isMonthAllowed(monthNumber: number, config: RecurrenceConfig): boolean {
  const months = config.active_months;
  if (!months || months.length === 0) {
    return true;
  }
  return months.includes(monthNumber);
}

function nextAllowedMonthDate(from: Date, config: RecurrenceConfig): Date {
  const cursor = new Date(from);
  cursor.setDate(1);
  cursor.setHours(12, 0, 0, 0);
  for (let i = 0; i < 24; i += 1) {
    if (isMonthAllowed(cursor.getMonth() + 1, config)) {
      return cursor;
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return from;
}

/**
 * Builds a period-aware instance title.
 */
export function cycleInstanceTitle(
  baseTitle: string,
  recurrence: RecurrenceKind,
  dueAt: Date,
): string {
  const base = stripCycleSuffix(baseTitle).trim() || baseTitle;
  if (recurrence === 'ONCE') {
    return base;
  }
  if (recurrence === 'MONTHLY') {
    return `${base} - ${MONTH_LABELS[dueAt.getMonth()]} ${dueAt.getFullYear()}`;
  }
  if (recurrence === 'YEARLY') {
    return `${base} - ${dueAt.getFullYear()}`;
  }
  return `${base} - ${formatHistoryDate(dueAt.toISOString(), dueAt)}`;
}

/**
 * Removes a generated cycle suffix from a title so edits keep the base name.
 */
export function stripCycleSuffix(title: string): string {
  return title.replace(CYCLE_SUFFIX, '').replace(DATE_SUFFIX, '');
}

/**
 * Computes the next due instant for a recurring item.
 */
export function computeNextOccurrence(params: {
  lastDueAt: string;
  recurrence: RecurrenceKind;
  config?: RecurrenceConfig | null;
  dueMode?: DueMode;
  now?: Date;
}): Date | null {
  const config = params.config ?? {};
  const dueMode = params.dueMode ?? 'DEADLINE';
  if (params.recurrence === 'ONCE' || isRecurrencePaused(config)) {
    return null;
  }

  const now = params.now ?? new Date();
  let candidate = new Date(params.lastDueAt);

  for (let safety = 0; safety < 48; safety += 1) {
    candidate = advanceOnce(candidate, params.recurrence, config, dueMode);
    if (candidate.getTime() <= now.getTime()) {
      continue;
    }
    if (!isMonthAllowed(candidate.getMonth() + 1, config)) {
      continue;
    }
    return candidate;
  }

  return null;
}

function advanceOnce(
  from: Date,
  recurrence: RecurrenceKind,
  config: RecurrenceConfig,
  dueMode: DueMode,
): Date {
  const interval = recurrenceInterval(config);

  if (recurrence === 'DAILY') {
    const next = new Date(from);
    next.setDate(next.getDate() + interval);
    return applyDueModeToDate(next, dueMode);
  }

  if (recurrence === 'WEEKLY') {
    const days = weeklyDays(config, from);
    const originWeek = startOfIsoWeek(from).getTime();
    const next = new Date(from);
    next.setDate(next.getDate() + 1);
    for (let guard = 0; guard < 400; guard += 1) {
      if (days.includes(isoWeekday(next))) {
        const weeks = Math.round(
          (startOfIsoWeek(next).getTime() - originWeek) / (7 * 86_400_000),
        );
        if (weeks % interval === 0) {
          return applyDueModeToDate(next, dueMode);
        }
      }
      next.setDate(next.getDate() + 1);
    }
    return applyDueModeToDate(next, dueMode);
  }

  if (recurrence === 'YEARLY') {
    const months = yearlyMonths(config, from);
    const preferredDay = config.day_of_month ?? from.getDate();
    const next = new Date(from);
    next.setDate(next.getDate() + 1);
    for (let guard = 0; guard < 800; guard += 1) {
      const monthNumber = next.getMonth() + 1;
      const monthOk = months.length === 0 || months.includes(monthNumber);
      const last = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      const targetDay = Math.min(preferredDay, last);
      if (monthOk && next.getDate() === targetDay) {
        const yearDelta = next.getFullYear() - from.getFullYear();
        if (yearDelta % interval === 0) {
          return applyDueModeToDate(next, dueMode);
        }
      }
      next.setDate(next.getDate() + 1);
    }
    const fallback = new Date(from);
    fallback.setFullYear(fallback.getFullYear() + interval);
    return applyDueModeToDate(fallback, dueMode);
  }

  const dueDayType = config.due_day_type ?? 'SPECIFIC_DAY';
  const days = monthlyDays(config, from);

  if (dueDayType === 'LAST_DAY_OF_MONTH' || days.length === 0) {
    let year = from.getFullYear();
    let monthIndex = from.getMonth() + interval;
    while (monthIndex > 11) {
      monthIndex -= 12;
      year += 1;
    }
    const monthAnchor = nextAllowedMonthDate(new Date(year, monthIndex, 1), config);
    return lastDateOfMonth(monthAnchor.getFullYear(), monthAnchor.getMonth(), dueMode);
  }

  // MONTHLY with one or more days_of_month
  const next = new Date(from);
  next.setDate(next.getDate() + 1);
  const originMonth = from.getFullYear() * 12 + from.getMonth();
  for (let guard = 0; guard < 400; guard += 1) {
    const last = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    const matching = days.map((d) => Math.min(d, last));
    if (matching.includes(next.getDate())) {
      const monthIndex = next.getFullYear() * 12 + next.getMonth();
      const monthsAhead = monthIndex - originMonth;
      if (monthsAhead % interval === 0) {
        return applyDueModeToDate(next, dueMode);
      }
    }
    next.setDate(next.getDate() + 1);
  }
  return clampDayOfMonth(
    from.getFullYear(),
    from.getMonth() + interval,
    days[0] ?? from.getDate(),
    dueMode,
  );
}

/**
 * Due date inside the current period when the calendar day has not passed.
 */
export function computeCurrentPeriodDueAt(
  recurrence: RecurrenceKind,
  config: RecurrenceConfig | null | undefined,
  now = new Date(),
  dueMode: DueMode = 'DEADLINE',
): Date | null {
  const parsed = config ?? {};
  if (recurrence === 'ONCE' || isRecurrencePaused(parsed)) {
    return null;
  }

  if (recurrence === 'DAILY') {
    const today = applyDueModeToDate(now, dueMode);
    if (!isCurrentOrFutureCalendarDay(today, now)) {
      return null;
    }
    // Still “today” for the period; if exact clock already passed, caller may spawn next.
    return today;
  }

  if (recurrence === 'WEEKLY') {
    const days = weeklyDays(parsed, now);
    for (let offset = 0; offset < 7; offset += 1) {
      const day = new Date(now);
      day.setDate(day.getDate() + offset);
      if (!days.includes(isoWeekday(day))) {
        continue;
      }
      const stamped = applyDueModeToDate(day, dueMode);
      if (isCurrentOrFutureCalendarDay(stamped, now)) {
        return stamped;
      }
    }
    return null;
  }

  if (recurrence === 'YEARLY') {
    const candidate = applyDueModeToDate(
      new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      dueMode,
    );
    return isCurrentOrFutureCalendarDay(candidate, now) ? candidate : null;
  }

  const monthNumber = now.getMonth() + 1;
  if (!isMonthAllowed(monthNumber, parsed)) {
    return null;
  }

  const dueDayType = parsed.due_day_type ?? 'SPECIFIC_DAY';
  const candidate =
    dueDayType === 'LAST_DAY_OF_MONTH'
      ? lastDateOfMonth(now.getFullYear(), now.getMonth(), dueMode)
      : clampDayOfMonth(
          now.getFullYear(),
          now.getMonth(),
          parsed.day_of_month ?? now.getDate(),
          dueMode,
        );

  return isCurrentOrFutureCalendarDay(candidate, now) ? candidate : null;
}

/**
 * Default first due date when creating an item now (current period, else next).
 */
export function computeInitialDueAt(
  recurrence: RecurrenceKind,
  config: RecurrenceConfig | null | undefined,
  now = new Date(),
  dueMode: DueMode = 'DEADLINE',
): Date {
  if (recurrence === 'ONCE') {
    const due = new Date(now);
    due.setDate(due.getDate() + 2);
    return applyDueModeToDate(due, dueMode);
  }

  const current = computeCurrentPeriodDueAt(recurrence, config, now, dueMode);
  if (current && current.getTime() > now.getTime()) {
    return current;
  }

  // Same calendar day still counts as “this period” for EXECUTION (even if 09:00 passed).
  if (
    current &&
    dueMode === 'EXECUTION' &&
    isCurrentOrFutureCalendarDay(current, now)
  ) {
    return current;
  }

  const seeded = computeNextOccurrence({
    lastDueAt: now.toISOString(),
    recurrence,
    config: { ...(config ?? {}), is_paused: false },
    dueMode,
    now,
  });
  return seeded ?? applyDueModeToDate(now, dueMode);
}

/**
 * Round-robin assignee among the given members.
 */
export function pickNextAssignee(
  memberIds: string[],
  lastAssigneeId: string | null | undefined,
): string | null {
  if (memberIds.length === 0) {
    return null;
  }
  if (!lastAssigneeId) {
    return memberIds[0] ?? null;
  }
  const index = memberIds.indexOf(lastAssigneeId);
  if (index < 0) {
    return memberIds[0] ?? null;
  }
  return memberIds[(index + 1) % memberIds.length] ?? null;
}

/**
 * Formats a timestamp for history cards (es-ES, day + month + year).
 */
export function formatHistoryDate(iso: string, now = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  }).format(date);
}

/**
 * Date + time for history “realización”.
 */
export function formatHistoryDateTime(iso: string, now = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  }).format(date);
}

/**
 * Short recurrence label used on cards and filters.
 */
export function recurrenceLabel(
  recurrence: RecurrenceKind,
  config?: RecurrenceConfig | null,
): string {
  if (recurrence === 'ONCE') {
    return RECURRENCE_KIND_LABEL.ONCE;
  }
  const n = recurrenceInterval(config);
  if (n > 1) {
    return recurrenceIntervalLabel(recurrence, config);
  }
  return RECURRENCE_KIND_LABEL[recurrence];
}

/**
 * Returns whether the given recurrence should spawn a follow-up instance.
 */
export function shouldSpawnRecurring(params: {
  recurrence: RecurrenceKind;
  config?: RecurrenceConfig | null;
  openInstanceCount: number;
}): boolean {
  if (params.recurrence === 'ONCE' || isRecurrencePaused(params.config)) {
    return false;
  }
  return params.openInstanceCount === 0;
}

/**
 * Local calendar day key YYYY-MM-DD.
 */
export function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * True when the calendar day is listed as skipped in recurrence config.
 */
export function isSkippedOccurrenceDate(
  config: RecurrenceConfig | null | undefined,
  date: Date,
): boolean {
  const key = localDateKey(date);
  return Boolean(config?.skipped_dates?.includes(key));
}

/**
 * Adds a skipped calendar day to config (idempotent).
 */
export function withSkippedOccurrenceDate(
  config: RecurrenceConfig,
  date: Date,
): RecurrenceConfig {
  const key = localDateKey(date);
  const existing = config.skipped_dates ?? [];
  if (existing.includes(key)) {
    return config;
  }
  return { ...config, skipped_dates: [...existing, key].sort() };
}

/**
 * Sets or clears a point assignee override for a calendar day.
 */
export function withAssigneeOverride(
  config: RecurrenceConfig,
  date: Date,
  userId: string | null,
): RecurrenceConfig {
  const key = localDateKey(date);
  const current = { ...(config.assignee_overrides ?? {}) };
  if (!userId) {
    delete current[key];
  } else {
    current[key] = userId;
  }
  return {
    ...config,
    assignee_overrides: Object.keys(current).length > 0 ? current : undefined,
  };
}

/**
 * Point assignee override for a calendar day, if any.
 */
export function assigneeOverrideForDate(
  config: RecurrenceConfig | null | undefined,
  date: Date,
): string | null {
  const key = localDateKey(date);
  return config?.assignee_overrides?.[key] ?? null;
}

/**
 * Projects future due dates for a recurring series until `horizon` (exclusive end of day).
 * Skips paused series and dates listed in `skipped_dates`.
 */
export function projectOccurrenceDates(params: {
  recurrence: RecurrenceKind;
  config?: RecurrenceConfig | null;
  dueMode?: DueMode;
  /** Last known due instant (usually the open instance). */
  fromDueAt: Date;
  /** Do not include `fromDueAt` itself (open row already covers it). */
  includeFrom?: boolean;
  horizon: Date;
  maxCount?: number;
}): Date[] {
  const config = params.config ?? {};
  if (params.recurrence === 'ONCE' || isRecurrencePaused(config)) {
    return [];
  }

  const dueMode = params.dueMode ?? 'DEADLINE';
  const maxCount = params.maxCount ?? 48;
  const results: Date[] = [];
  let cursor = new Date(params.fromDueAt);

  if (params.includeFrom) {
    if (
      !isSkippedOccurrenceDate(config, cursor) &&
      startOfLocalDay(cursor).getTime() <= startOfLocalDay(params.horizon).getTime()
    ) {
      results.push(new Date(cursor));
    }
  }

  for (let i = 0; i < maxCount; i += 1) {
    const next = computeNextOccurrence({
      lastDueAt: cursor.toISOString(),
      recurrence: params.recurrence,
      config: { ...config, is_paused: false },
      dueMode,
      now: cursor,
    });
    if (!next) {
      break;
    }
    if (startOfLocalDay(next).getTime() > startOfLocalDay(params.horizon).getTime()) {
      break;
    }
    cursor = next;
    if (isSkippedOccurrenceDate(config, cursor)) {
      continue;
    }
    results.push(new Date(cursor));
  }

  return results;
}

/**
 * Fills required weekly/monthly fields from a calendar day (defaults to `from`).
 */
export function ensureRecurrenceConfigDefaults(
  recurrence: RecurrenceKind,
  config: RecurrenceConfig,
  from = new Date(),
): RecurrenceConfig {
  const withInterval = { ...config, interval: recurrenceInterval(config) };
  if (recurrence === 'WEEKLY') {
    const days = weeklyDays(withInterval, from);
    return {
      ...withInterval,
      day_of_week: days[0],
      days_of_week: days,
    };
  }
  if (recurrence === 'MONTHLY') {
    const dueDayType = withInterval.due_day_type ?? 'SPECIFIC_DAY';
    if (dueDayType === 'LAST_DAY_OF_MONTH') {
      return {
        ...withInterval,
        due_day_type: 'LAST_DAY_OF_MONTH',
        day_of_month: undefined,
        days_of_month: undefined,
      };
    }
    const days = monthlyDays(withInterval, from);
    return {
      ...withInterval,
      due_day_type: 'SPECIFIC_DAY',
      days_of_month: days,
      day_of_month: days[0],
    };
  }
  if (recurrence === 'YEARLY') {
    const months = yearlyMonths(withInterval, from);
    return {
      ...withInterval,
      active_months: months.length > 0 ? months : [from.getMonth() + 1],
      day_of_month: withInterval.day_of_month ?? from.getDate(),
    };
  }
  return withInterval;
}

/**
 * Updates weekly/monthly rule fields from a picked calendar date.
 */
export function syncRecurrenceConfigFromDate(
  recurrence: RecurrenceKind,
  date: Date,
  config: RecurrenceConfig,
): RecurrenceConfig {
  if (recurrence === 'WEEKLY') {
    const days = weeklyDays(config, date);
    return {
      ...config,
      day_of_week: isoWeekday(date),
      days_of_week: days.includes(isoWeekday(date)) ? days : [isoWeekday(date)],
    };
  }
  if (recurrence === 'MONTHLY') {
    if (config.due_day_type === 'LAST_DAY_OF_MONTH') {
      return {
        ...config,
        due_day_type: 'LAST_DAY_OF_MONTH',
        day_of_month: undefined,
      };
    }
    return {
      ...config,
      due_day_type: 'SPECIFIC_DAY',
      day_of_month: date.getDate(),
    };
  }
  return config;
}

/**
 * Whether a calendar cell can be selected for the first due date.
 * WEEKLY/MONTHLY restrict by rule; past local days are blocked for recurring kinds.
 */
export function isRecurrenceCalendarDayEnabled(
  recurrence: RecurrenceKind,
  config: RecurrenceConfig,
  year: number,
  monthIndex: number,
  day: number,
  now = new Date(),
): boolean {
  const date = new Date(year, monthIndex, day);
  if (recurrence !== 'ONCE') {
    if (startOfLocalDay(date).getTime() < startOfLocalDay(now).getTime()) {
      return false;
    }
  }

  if (recurrence === 'ONCE' || recurrence === 'DAILY' || recurrence === 'YEARLY') {
    return true;
  }

  const cfg = ensureRecurrenceConfigDefaults(recurrence, config, now);

  if (recurrence === 'WEEKLY') {
    return weeklyDays(cfg, now).includes(isoWeekday(date));
  }

  if (cfg.due_day_type === 'LAST_DAY_OF_MONTH') {
    return day === new Date(year, monthIndex + 1, 0).getDate();
  }

  const target = cfg.day_of_month ?? now.getDate();
  const last = new Date(year, monthIndex + 1, 0).getDate();
  return day === Math.min(target, last);
}
