import type { Task } from '@/types/database.types';
import { TASK_STATUS, type TaskStatus } from '@/types/task-status';

import { CLOSED_TASK_STATUSES, OPEN_TASK_STATUSES } from '@/features/tasks/lib/task-transitions';

export type TaskBoardSummary = {
  total: number;
  pending: number;
  submitted: number;
  completed: number;
  overdue: number;
  open: number;
  closed: number;
  /** 0–100 score based on completed vs open+completed (excludes skipped). */
  healthScore: number;
  healthLabel: 'Excelente' | 'Regular' | 'Crítico';
};

/**
 * Builds a board summary used by the Home feed health indicator.
 *
 * @param tasks - Tasks of the active home.
 */
export function summarizeTasks(tasks: readonly Pick<Task, 'status'>[]): TaskBoardSummary {
  const counts: Record<TaskStatus, number> = {
    PENDING: 0,
    SUBMITTED: 0,
    COMPLETED: 0,
    OVERDUE: 0,
    RESOLVED_LATE: 0,
    RESOLVED_BY_PEER: 0,
    SKIPPED: 0,
  };

  for (const task of tasks) {
    counts[task.status] += 1;
  }

  const completed =
    counts.COMPLETED + counts.RESOLVED_LATE + counts.RESOLVED_BY_PEER;
  const open = OPEN_TASK_STATUSES.reduce((sum, status) => sum + counts[status], 0);
  const closed = CLOSED_TASK_STATUSES.reduce((sum, status) => sum + counts[status], 0);
  const actionable = open + completed;
  const healthScore =
    actionable === 0 ? 100 : Math.round((completed / actionable) * 100);

  let healthLabel: TaskBoardSummary['healthLabel'] = 'Excelente';
  if (healthScore < 40 || counts.OVERDUE > 0) {
    healthLabel = 'Crítico';
  } else if (healthScore < 70) {
    healthLabel = 'Regular';
  }

  return {
    total: tasks.length,
    pending: counts.PENDING,
    submitted: counts.SUBMITTED,
    completed,
    overdue: counts.OVERDUE,
    open,
    closed,
    healthScore,
    healthLabel,
  };
}

/**
 * Splits tasks into open board items vs history items.
 */
export function partitionTasks<T extends Pick<Task, 'status'>>(
  tasks: readonly T[],
): { open: T[]; closed: T[] } {
  const open: T[] = [];
  const closed: T[] = [];

  for (const task of tasks) {
    if (OPEN_TASK_STATUSES.includes(task.status) || task.status === TASK_STATUS.OVERDUE) {
      open.push(task);
    } else {
      closed.push(task);
    }
  }

  return { open, closed };
}
