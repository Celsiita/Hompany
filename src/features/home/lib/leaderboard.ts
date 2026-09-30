import { z } from 'zod';

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

/**
 * Short task stats line for a leaderboard row.
 */
export function formatLeaderboardTaskInfo(row: Pick<
  HomeLeaderboardRow,
  'tasks_completed' | 'tasks_pending' | 'tasks_submitted' | 'tasks_overdue'
>): string {
  const parts = [
    `${row.tasks_completed} hecha${row.tasks_completed === 1 ? '' : 's'}`,
    `${row.tasks_pending} pendiente${row.tasks_pending === 1 ? '' : 's'}`,
  ];
  if (row.tasks_submitted > 0) {
    parts.push(`${row.tasks_submitted} en revisión`);
  }
  if (row.tasks_overdue > 0) {
    parts.push(`${row.tasks_overdue} vencida${row.tasks_overdue === 1 ? '' : 's'}`);
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
