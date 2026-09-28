import { localDateKey } from '@/lib/recurrence';
import type { MemberExamPeriod } from '@/schemas/exam-period.schema';

type ExamPeriodLike = Pick<MemberExamPeriod, 'user_id' | 'start_date' | 'end_date' | 'label'>;

/**
 * True when the user has an exam period covering the calendar day.
 */
export function isUserInExamPeriodOnDate(
  periods: readonly ExamPeriodLike[],
  userId: string,
  date: Date,
): boolean {
  const key = localDateKey(date);
  return periods.some(
    (period) =>
      period.user_id === userId && key >= period.start_date && key <= period.end_date,
  );
}

/**
 * Exam periods active on a given calendar day (all members).
 */
export function examPeriodsOnDate(
  periods: readonly ExamPeriodLike[],
  date: Date,
): ExamPeriodLike[] {
  const key = localDateKey(date);
  return periods.filter((period) => key >= period.start_date && key <= period.end_date);
}

/**
 * True when any exam period covers the day.
 */
export function hasExamPeriodsOnDate(periods: readonly ExamPeriodLike[], date: Date): boolean {
  return examPeriodsOnDate(periods, date).length > 0;
}

/**
 * Periods overlapping a month window (inclusive).
 */
export function examPeriodsOverlappingRange(
  periods: readonly MemberExamPeriod[],
  rangeStart: Date,
  rangeEnd: Date,
): MemberExamPeriod[] {
  const startKey = localDateKey(rangeStart);
  const endKey = localDateKey(rangeEnd);
  return periods.filter(
    (period) => period.end_date >= startKey && period.start_date <= endKey,
  );
}

/**
 * Calendar banner copy for silence mode (exams are a common example label).
 */
export function formatSilenceModeBanner(label: string, memberName: string): string {
  return `🔇 Modo silencio: ${label} · ${memberName}`;
}

/**
 * @deprecated Use {@link formatSilenceModeBanner}.
 */
export function formatExamPeriodBanner(label: string, memberName: string): string {
  return formatSilenceModeBanner(label, memberName);
}

/**
 * List / calendar copy for silence mode on a day.
 */
export function formatSilenceModeDayLabel(label: string, memberName?: string): string {
  return memberName ? formatSilenceModeBanner(label, memberName) : `🔇 Modo silencio: ${label}`;
}

/**
 * Subtle silence-mode copy for direct complaints / notifications to someone in exams.
 */
export function examSilenceWarning(displayName: string): string {
  return `Recuerda que ${displayName} está en periodo de exámenes`;
}

/**
 * Whether to show the silence warning before a direct action toward a roommate.
 * Never warns when targeting yourself.
 */
export function shouldWarnExamSilence(params: {
  actorUserId?: string | null;
  targetUserId: string;
  periods: readonly ExamPeriodLike[];
  date?: Date;
}): boolean {
  if (!params.actorUserId || params.actorUserId === params.targetUserId) {
    return false;
  }
  return isUserInExamPeriodOnDate(params.periods, params.targetUserId, params.date ?? new Date());
}

/**
 * Parses a Date to YYYY-MM-DD for exam period forms.
 */
export function toExamDateKey(date: Date): string {
  return localDateKey(date);
}

/**
 * Formats YYYY-MM-DD for display (local calendar day).
 */
export function formatExamDateKey(key: string): string {
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(date);
}
