import { z } from 'zod';

export const recurrenceKindSchema = z.enum(['ONCE', 'DAILY', 'WEEKLY', 'MONTHLY']);
export type RecurrenceKind = z.infer<typeof recurrenceKindSchema>;

export const dueModeSchema = z.enum(['DEADLINE', 'EXECUTION']);
export type DueMode = z.infer<typeof dueModeSchema>;

export const DUE_MODE_LABEL: Record<DueMode, string> = {
  DEADLINE: 'Fecha límite',
  EXECUTION: 'Fecha de ejecución',
};

export const DUE_MODE_HINT: Record<DueMode, string> = {
  DEADLINE: 'Momento máximo para completar o pagar.',
  EXECUTION: 'Día exacto programado para hacerlo.',
};

export const recurrenceDueDayTypeSchema = z.enum(['SPECIFIC_DAY', 'LAST_DAY_OF_MONTH']);

export const recurrenceConfigSchema = z.object({
  day_of_week: z.number().int().min(1).max(7).optional(),
  due_day_type: recurrenceDueDayTypeSchema.optional(),
  day_of_month: z.number().int().min(1).max(31).optional(),
  active_months: z.array(z.number().int().min(1).max(12)).optional(),
  is_paused: z.boolean().optional(),
});

export type RecurrenceConfig = z.infer<typeof recurrenceConfigSchema>;

export const RECURRENCE_KIND_LABEL: Record<RecurrenceKind, string> = {
  ONCE: 'Una vez',
  DAILY: 'Diaria',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensual',
};

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
 * Local calendar start of day (00:00).
 */
export function startOfLocalDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
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
  if (recurrence === 'DAILY') {
    const next = new Date(from);
    next.setDate(next.getDate() + 1);
    return applyDueModeToDate(next, dueMode);
  }

  if (recurrence === 'WEEKLY') {
    const target = config.day_of_week ?? isoWeekday(from);
    const next = new Date(from);
    next.setDate(next.getDate() + 1);
    while (isoWeekday(next) !== target) {
      next.setDate(next.getDate() + 1);
    }
    return applyDueModeToDate(next, dueMode);
  }

  const dueDayType = config.due_day_type ?? 'SPECIFIC_DAY';
  const preferredDay = config.day_of_month ?? from.getDate();
  let year = from.getFullYear();
  let monthIndex = from.getMonth() + 1;
  if (monthIndex > 11) {
    monthIndex = 0;
    year += 1;
  }

  const monthAnchor = nextAllowedMonthDate(new Date(year, monthIndex, 1), config);
  year = monthAnchor.getFullYear();
  monthIndex = monthAnchor.getMonth();

  if (dueDayType === 'LAST_DAY_OF_MONTH') {
    return lastDateOfMonth(year, monthIndex, dueMode);
  }
  return clampDayOfMonth(year, monthIndex, preferredDay, dueMode);
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
    const target = parsed.day_of_week ?? isoWeekday(now);
    const delta = (target - isoWeekday(now) + 7) % 7;
    const day = new Date(now);
    day.setDate(day.getDate() + delta);
    const stamped = applyDueModeToDate(day, dueMode);
    return isCurrentOrFutureCalendarDay(stamped, now) ? stamped : null;
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
export function recurrenceLabel(recurrence: RecurrenceKind): string {
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
 * Fills required weekly/monthly fields from a calendar day (defaults to `from`).
 */
export function ensureRecurrenceConfigDefaults(
  recurrence: RecurrenceKind,
  config: RecurrenceConfig,
  from = new Date(),
): RecurrenceConfig {
  if (recurrence === 'WEEKLY') {
    return {
      ...config,
      day_of_week: config.day_of_week ?? isoWeekday(from),
    };
  }
  if (recurrence === 'MONTHLY') {
    const dueDayType = config.due_day_type ?? 'SPECIFIC_DAY';
    if (dueDayType === 'LAST_DAY_OF_MONTH') {
      return {
        ...config,
        due_day_type: 'LAST_DAY_OF_MONTH',
        day_of_month: undefined,
      };
    }
    return {
      ...config,
      due_day_type: 'SPECIFIC_DAY',
      day_of_month: config.day_of_month ?? from.getDate(),
    };
  }
  return config;
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
    return { ...config, day_of_week: isoWeekday(date) };
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

  if (recurrence === 'ONCE' || recurrence === 'DAILY') {
    return true;
  }

  const cfg = ensureRecurrenceConfigDefaults(recurrence, config, now);

  if (recurrence === 'WEEKLY') {
    return isoWeekday(date) === cfg.day_of_week;
  }

  if (cfg.due_day_type === 'LAST_DAY_OF_MONTH') {
    return day === new Date(year, monthIndex + 1, 0).getDate();
  }

  const target = cfg.day_of_month ?? now.getDate();
  const last = new Date(year, monthIndex + 1, 0).getDate();
  return day === Math.min(target, last);
}
