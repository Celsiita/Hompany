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
  return boardTasks.filter((task) => task.category === category);
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
 * Open work on the board (pending / overdue / paused recurring).
 */
export function filterOpenBoardTasks(tasks: TaskWithRelations[]): TaskWithRelations[] {
  return tasks.filter(
    (task) =>
      task.status === TASK_STATUS.PENDING ||
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
 * Applies category + assignee + recurrence filters together.
 */
export function applyTaskBoardFilters(params: {
  tasks: TaskWithRelations[];
  category: TaskBoardCategoryFilter;
  scope: TaskAssigneeScope;
  userId: string | null | undefined;
  recurrence?: RecurrenceFilter;
}): TaskWithRelations[] {
  const byCategory = filterTasksByCategory(params.tasks, params.category);
  const byScope = filterTasksByAssigneeScope(byCategory, params.scope, params.userId);
  return filterTasksByRecurrence(byScope, params.recurrence ?? 'ALL');
}

export function isTaskCategory(value: string): value is TaskCategory {
  return value === 'ZONE' || value === 'QUICK' || value === 'GROCERY';
}
