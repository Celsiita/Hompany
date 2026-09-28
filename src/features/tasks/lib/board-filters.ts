import type { TaskBoardStatusFilter } from '@/components/ui/StatusFilterChips';
import type { RecurrenceFilter } from '@/components/ui/RecurrenceFilterChips';
import { isPausedRecurring } from '@/features/tasks/lib/recurrence';
import type { TaskBoardCategoryFilter, TaskAssigneeScope } from '@/schemas/task.schema';
import type { TaskCategory } from '@/types/task-category';
import type { TaskWithRelations } from '@/types/database.types';
import { TASK_STATUS } from '@/types/task-status';

/**
 * Returns whether the given user is assigned to the task.
 */
export function isTaskAssignedToUser(
  task: TaskWithRelations,
  userId: string | null | undefined,
): boolean {
  if (!userId) {
    return false;
  }
  if (task.assigned_to === userId) {
    return true;
  }
  return task.task_assignees.some((assignee) => assignee.user_id === userId);
}

/**
 * Filters tasks by board category chip. Grocery tasks are excluded from the board.
 */
export function filterTasksByCategory(
  tasks: TaskWithRelations[],
  category: TaskBoardCategoryFilter,
): TaskWithRelations[] {
  const boardTasks = tasks.filter((task) => task.category !== 'GROCERY');
  if (category === 'ALL') {
    return boardTasks;
  }
  if (category === 'QUICK') {
    return boardTasks.filter((task) => !task.item_type_id);
  }
  return boardTasks.filter((task) => task.item_type_id === category);
}

/**
 * Filters tasks by personal vs other roommates.
 * `ALL` (no pill) shows every task. Unassigned tasks appear under Compañeros.
 */
export function filterTasksByAssigneeScope(
  tasks: TaskWithRelations[],
  scope: TaskAssigneeScope,
  userId: string | null | undefined,
): TaskWithRelations[] {
  if (!userId || scope === 'ALL') {
    return tasks;
  }

  if (scope === 'MINE') {
    return tasks.filter((task) => isTaskAssignedToUser(task, userId));
  }

  return tasks.filter((task) => !isTaskAssignedToUser(task, userId));
}

/**
 * Filters by recurrence chip.
 */
export function filterTasksByRecurrence(
  tasks: TaskWithRelations[],
  recurrence: RecurrenceFilter,
): TaskWithRelations[] {
  if (recurrence === 'ALL') {
    return tasks;
  }
  return tasks.filter((task) => task.recurrence === recurrence);
}

/**
 * Open work on the board (pending / submitted / overdue / paused recurring).
 */
export function filterOpenBoardTasks(tasks: TaskWithRelations[]): TaskWithRelations[] {
  return tasks.filter(
    (task) =>
      task.status === TASK_STATUS.PENDING ||
      task.status === TASK_STATUS.SUBMITTED ||
      task.status === TASK_STATUS.OVERDUE ||
      isPausedRecurring(task),
  );
}

/**
 * Submitted proofs waiting for a roommate decision.
 */
export function filterReviewBoardTasks(tasks: TaskWithRelations[]): TaskWithRelations[] {
  return tasks.filter((task) => task.status === TASK_STATUS.SUBMITTED);
}

/**
 * Open task past its due date (still actionable).
 */
export function isTaskOpenOverdue(
  task: TaskWithRelations,
  now: Date = new Date(),
): boolean {
  if (isPausedRecurring(task)) {
    return false;
  }
  if (task.status === TASK_STATUS.OVERDUE) {
    return true;
  }
  if (task.status !== TASK_STATUS.PENDING || !task.due_at) {
    return false;
  }
  return Date.parse(task.due_at) < now.getTime();
}

function dueAtMs(task: TaskWithRelations): number {
  return task.due_at ? Date.parse(task.due_at) : Number.POSITIVE_INFINITY;
}

function historyDateMs(task: TaskWithRelations): number {
  return Date.parse(task.completed_at ?? task.updated_at ?? task.due_at ?? 0);
}

/**
 * En curso sort: revisión → atrasadas → pendientes → pausadas; within group closest due first.
 */
export function sortOpenBoardTasks(
  tasks: TaskWithRelations[],
  now: Date = new Date(),
): TaskWithRelations[] {
  const rank = (task: TaskWithRelations): number => {
    if (task.status === TASK_STATUS.SUBMITTED) {
      return 0;
    }
    if (isPausedRecurring(task)) {
      return 3;
    }
    if (isTaskOpenOverdue(task, now)) {
      return 1;
    }
    return 2;
  };

  return [...tasks].sort((a, b) => {
    const rankDiff = rank(a) - rank(b);
    if (rankDiff !== 0) {
      return rankDiff;
    }
    return dueAtMs(a) - dueAtMs(b);
  });
}

/**
 * Historial sort: only by date (most recent first).
 */
export function sortHistoryBoardTasks(tasks: TaskWithRelations[]): TaskWithRelations[] {
  return [...tasks].sort((a, b) => historyDateMs(b) - historyDateMs(a));
}

/**
 * Points awarded for a closed task (late completion is penalized to half).
 */
export function awardedTaskPoints(task: Pick<TaskWithRelations, 'status' | 'points_value'>): number {
  if (task.status === TASK_STATUS.SKIPPED) {
    return 0;
  }
  if (task.status === TASK_STATUS.RESOLVED_LATE) {
    return Math.max(0, Math.floor(task.points_value / 2));
  }
  if (
    task.status === TASK_STATUS.COMPLETED ||
    task.status === TASK_STATUS.RESOLVED_BY_PEER
  ) {
    return task.points_value;
  }
  return task.points_value;
}

/**
 * Swap is only for open, not-yet-submitted work (pending / overdue).
 * Once the assignee completes (SUBMITTED+) the task is no longer swappable.
 */
export function canRequestTaskSwap(task: TaskWithRelations): boolean {
  if (isPausedRecurring(task)) {
    return false;
  }
  return (
    task.status === TASK_STATUS.PENDING || task.status === TASK_STATUS.OVERDUE
  );
}

/**
 * Filters open/history tasks by status chip.
 */
export function filterTasksByBoardStatus(
  tasks: TaskWithRelations[],
  status: TaskBoardStatusFilter,
): TaskWithRelations[] {
  if (status === 'ALL') {
    return tasks;
  }
  if (status === 'PAUSED') {
    return tasks.filter((task) => isPausedRecurring(task));
  }
  if (status === 'PENDING') {
    return tasks.filter(
      (task) =>
        !isPausedRecurring(task) &&
        (task.status === TASK_STATUS.PENDING || task.status === TASK_STATUS.OVERDUE),
    );
  }
  if (status === 'SUBMITTED') {
    return tasks.filter(
      (task) => task.status === TASK_STATUS.SUBMITTED && !isPausedRecurring(task),
    );
  }
  if (status === 'COMPLETED') {
    return tasks.filter(
      (task) =>
        task.status === TASK_STATUS.COMPLETED || task.status === TASK_STATUS.RESOLVED_BY_PEER,
    );
  }
  if (status === 'RESOLVED_LATE') {
    return tasks.filter((task) => task.status === TASK_STATUS.RESOLVED_LATE);
  }
  if (status === 'SKIPPED') {
    return tasks.filter((task) => task.status === TASK_STATUS.SKIPPED);
  }
  return tasks.filter((task) => task.status === status && !isPausedRecurring(task));
}

/**
 * Applies category + assignee + recurrence + status filters together.
 */
export function applyTaskBoardFilters(params: {
  tasks: TaskWithRelations[];
  category: TaskBoardCategoryFilter;
  scope: TaskAssigneeScope;
  userId: string | null | undefined;
  recurrence?: RecurrenceFilter;
  status?: TaskBoardStatusFilter;
}): TaskWithRelations[] {
  const byCategory = filterTasksByCategory(params.tasks, params.category);
  const byScope = filterTasksByAssigneeScope(byCategory, params.scope, params.userId);
  const byRecurrence = filterTasksByRecurrence(byScope, params.recurrence ?? 'ALL');
  return filterTasksByBoardStatus(byRecurrence, params.status ?? 'ALL');
}

export function isTaskCategory(value: string): value is TaskCategory {
  return value === 'ZONE' || value === 'QUICK' || value === 'GROCERY';
}
