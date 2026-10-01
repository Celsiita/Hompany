/**
 * Formats remaining time until `dueAt` with calendar-day accuracy and absolute date.
 * Avoids the classic off-by-one where “almost 3 full days” showed as “2d …” only.
 */

import type { DueMode } from '@/lib/recurrence';
import { getAppLocale } from '@/lib/i18n/locale-store';
import { translate } from '@/lib/i18n/strings';
import type { AppLocale } from '@/lib/i18n/types';

export type DueSummary = {
  /** Combined label, e.g. "Vence el 15 mar (en 3 días)" / "Due 15 Mar (in 3 days)". */
  label: string;
  absoluteLabel: string;
  relativeLabel: string;
  isOverdue: boolean;
  totalMs: number;
  calendarDays: number;
};

/**
 * Local calendar start of day.
 */
export function startOfLocalDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

/**
 * Whole calendar days from `from` to `to` (local). Positive = to is in the future.
 */
export function calendarDaysBetween(from: Date, to: Date): number {
  const a = startOfLocalDay(from).getTime();
  const b = startOfLocalDay(to).getTime();
  return Math.round((b - a) / 86_400_000);
}

/**
 * Formats a positive duration in ms as `Xd Xh`, `Xh Xm` or `Xm`.
 */
export function formatDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

/**
 * Absolute due date for cards (locale-aware).
 */
export function formatAbsoluteDue(
  iso: string,
  now = new Date(),
  locale: AppLocale = getAppLocale(),
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  }).format(date);
}

function relativeFromCalendarDays(
  days: number,
  totalMs: number,
  isOverdue: boolean,
  locale: AppLocale,
): string {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(locale, key, vars);

  if (isOverdue) {
    if (days === 0) {
      return t('due.ago', { duration: formatDuration(Math.abs(totalMs)) });
    }
    if (days === -1) {
      return t('due.sinceYesterday');
    }
    return t('due.daysAgo', { n: Math.abs(days) });
  }

  if (days === 0) {
    return t('due.todayLeft', { duration: formatDuration(totalMs) });
  }
  if (days === 1) {
    return t('due.tomorrow');
  }
  return t('due.inDays', { n: days });
}

/**
 * Formats remaining time until `dueAt` as a short countdown label.
 */
export function formatCountdown(
  dueAt: string,
  now: number = Date.now(),
): { label: string; isOverdue: boolean; totalMs: number } {
  const locale = getAppLocale();
  const summary = formatDueSummary(dueAt, 'DEADLINE', now);
  return {
    label: summary.isOverdue
      ? translate(locale, 'due.overduePrefix', { relative: summary.relativeLabel })
      : translate(locale, 'due.leftPrefix', {
          duration: formatDuration(Math.max(0, summary.totalMs)),
        }),
    isOverdue: summary.isOverdue,
    totalMs: summary.totalMs,
  };
}

/**
 * Exact date + relative countdown for tasks and expenses.
 * Example ES: "Vence el 15 mar, 23:59 (en 3 días)".
 * Example EN: "Due 15 Mar, 11:59 PM (in 3 days)".
 */
export function formatDueSummary(
  dueAt: string,
  dueMode: DueMode = 'DEADLINE',
  now: number = Date.now(),
): DueSummary {
  const locale = getAppLocale();
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(locale, key, vars);
  const due = new Date(dueAt);
  const totalMs = due.getTime() - now;
  const absoluteLabel = formatAbsoluteDue(dueAt, new Date(now), locale);

  if (Number.isNaN(due.getTime())) {
    return {
      label: t('due.invalid'),
      absoluteLabel: '',
      relativeLabel: '',
      isOverdue: false,
      totalMs: 0,
      calendarDays: 0,
    };
  }

  const calendarDays = calendarDaysBetween(new Date(now), due);
  const isOverdue = totalMs <= 0;
  const relativeLabel = relativeFromCalendarDays(calendarDays, totalMs, isOverdue, locale);
  const verb = dueMode === 'EXECUTION' ? t('due.execution') : t('due.deadline');
  const overdueVerb =
    dueMode === 'EXECUTION' ? t('due.overdueExecution') : t('due.overdueDeadline');

  return {
    label: isOverdue
      ? `${overdueVerb} ${absoluteLabel} (${relativeLabel})`
      : `${verb} ${absoluteLabel} (${relativeLabel})`,
    absoluteLabel,
    relativeLabel,
    isOverdue,
    totalMs,
    calendarDays,
  };
}
