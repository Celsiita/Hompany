import { z } from 'zod';

import { getAppLocale } from '@/lib/i18n/locale-store';
import { translate } from '@/lib/i18n/strings';
import type { AppLocale } from '@/lib/i18n/types';

/**
 * One row of the home leaderboard returned by `get_home_leaderboard`.
 */
export const homeLeaderboardRowSchema = z.object({
  user_id: z.string().uuid(),
  display_name: z.string().min(1),
  avatar_url: z.string().nullable(),
  reputation_points: z.number().int().min(0).max(1000),
  rank: z.number().int().positive(),
  tasks_pending: z.number().int().min(0),
  tasks_submitted: z.number().int().min(0),
  tasks_completed: z.number().int().min(0),
  tasks_overdue: z.number().int().min(0),
  task_points_earned: z.number().int().min(0),
});

export type HomeLeaderboardRow = z.infer<typeof homeLeaderboardRowSchema>;

export const homeLeaderboardSchema = z.array(homeLeaderboardRowSchema);

function pluralStat(
  locale: AppLocale,
  n: number,
  oneKey: string,
  manyKey: string,
): string {
  return n === 1 ? translate(locale, oneKey) : translate(locale, manyKey, { n });
}

/**
 * Short task stats line for a leaderboard row.
 */
export function formatLeaderboardTaskInfo(
  row: Pick<
    HomeLeaderboardRow,
    'tasks_completed' | 'tasks_pending' | 'tasks_submitted' | 'tasks_overdue'
  >,
  locale: AppLocale = getAppLocale(),
): string {
  const parts = [
    pluralStat(locale, row.tasks_completed, 'lb.doneOne', 'lb.doneMany'),
    pluralStat(locale, row.tasks_pending, 'lb.pendingOne', 'lb.pendingMany'),
  ];
  if (row.tasks_submitted > 0) {
    parts.push(pluralStat(locale, row.tasks_submitted, 'lb.reviewOne', 'lb.reviewMany'));
  }
  if (row.tasks_overdue > 0) {
    parts.push(pluralStat(locale, row.tasks_overdue, 'lb.overdueOne', 'lb.overdueMany'));
  }
  return parts.join(' · ');
}

/**
 * Initial letter for avatar placeholder.
 */
export function leaderboardInitial(displayName: string): string {
  const trimmed = displayName.trim();
  return trimmed.length > 0 ? trimmed[0]!.toUpperCase() : '?';
}
