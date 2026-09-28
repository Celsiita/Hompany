import { localDateKey, pickNextAssignee } from '@/lib/recurrence';
import type { MemberAbsence } from '@/schemas/absence.schema';

type AbsenceLike = Pick<MemberAbsence, 'user_id' | 'start_date' | 'end_date'> & {
  reason?: MemberAbsence['reason'];
};

/**
 * True when the user has a registered absence covering the calendar day.
 */
export function isUserAbsentOnDate(
  absences: readonly AbsenceLike[],
  userId: string,
  date: Date,
): boolean {
  const key = localDateKey(date);
  return absences.some(
    (absence) =>
      absence.user_id === userId && key >= absence.start_date && key <= absence.end_date,
  );
}

/**
 * Filters a member pool to those not absent on the given day.
 */
export function filterAvailableMemberIds(
  memberIds: string[],
  absences: readonly AbsenceLike[],
  date: Date,
): string[] {
  return memberIds.filter((userId) => !isUserAbsentOnDate(absences, userId, date));
}

/**
 * Round-robin among members available on the due date (skips absent users).
 */
export function pickNextAvailableAssignee(
  memberIds: string[],
  lastAssigneeId: string | null | undefined,
  absences: readonly AbsenceLike[],
  date: Date,
): string | null {
  const available = filterAvailableMemberIds(memberIds, absences, date);
  if (available.length === 0) {
    return null;
  }
  return pickNextAssignee(available, lastAssigneeId);
}

/**
 * True when every member in the pool is absent on the given day.
 */
export function areAllMembersAbsent(
  memberIds: string[],
  absences: readonly AbsenceLike[],
  date: Date,
): boolean {
  if (memberIds.length === 0) {
    return false;
  }
  return filterAvailableMemberIds(memberIds, absences, date).length === 0;
}

/**
 * User ids absent on the given day within the pool.
 */
export function absentMemberIdsOnDate(
  memberIds: string[],
  absences: readonly AbsenceLike[],
  date: Date,
): string[] {
  return memberIds.filter((userId) => isUserAbsentOnDate(absences, userId, date));
}

/**
 * UI copy for manual assignment to an absent member.
 */
export function absentMemberWarning(displayName: string): string {
  return `⚠️ ${displayName} estará ausente en esta fecha`;
}

/**
 * Parses a Date to YYYY-MM-DD for absence forms.
 */
export function toDateKey(date: Date): string {
  return localDateKey(date);
}

/**
 * Formats YYYY-MM-DD for display (local calendar day).
 */
export function formatDateKey(key: string): string {
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(date);
}

/**
 * Absences active on a given calendar day (all members).
 */
export function absencesOnDate(
  absences: readonly AbsenceLike[],
  date: Date,
): AbsenceLike[] {
  const key = localDateKey(date);
  return absences.filter(
    (absence) => key >= absence.start_date && key <= absence.end_date,
  );
}

/**
 * List / calendar copy for an absence on a day.
 */
export function formatAbsenceDayLabel(memberName: string, reason?: string | null): string {
  return reason?.trim()
    ? `🧳 Ausencia: ${memberName} · ${reason.trim()}`
    : `🧳 Ausencia: ${memberName}`;
}

/**
 * True when any registered absence covers the calendar day.
 */
export function hasAbsencesOnDate(
  absences: readonly AbsenceLike[],
  date: Date,
): boolean {
  const key = localDateKey(date);
  return absences.some((absence) => key >= absence.start_date && key <= absence.end_date);
}
