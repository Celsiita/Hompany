import { isUserAbsentOnDate, pickNextAvailableAssignee } from '@/lib/absences';
import { localDateKey } from '@/lib/recurrence';
import { isTaskAssignedToUser } from '@/features/tasks/lib/board-filters';
import type { MemberAbsence } from '@/schemas/absence.schema';
import type { TaskWithRelations } from '@/types/database.types';
import { TASK_STATUS } from '@/types/task-status';

const OPEN_STATUSES: ReadonlySet<string> = new Set([
  TASK_STATUS.PENDING,
  TASK_STATUS.SUBMITTED,
  TASK_STATUS.OVERDUE,
]);

/**
 * Counts open tasks assigned to the user whose due date falls in [start, end].
 */
export function countOpenTasksInDateRange(params: {
  tasks: readonly TaskWithRelations[];
  userId: string | null | undefined;
  startDate: string;
  endDate: string;
}): number {
  if (!params.userId) {
    return 0;
  }
  return params.tasks.filter((task) => {
    if (!OPEN_STATUSES.has(task.status) || !task.due_at) {
      return false;
    }
    if (!isTaskAssignedToUser(task, params.userId!)) {
      return false;
    }
    const key = localDateKey(new Date(task.due_at));
    return key >= params.startDate && key <= params.endDate;
  }).length;
}

/**
 * Open auto-assign tasks for a user in a date range (candidates for reassignment).
 */
export function listRotatingTasksInDateRange(params: {
  tasks: readonly TaskWithRelations[];
  userId: string;
  startDate: string;
  endDate: string;
}): TaskWithRelations[] {
  return params.tasks.filter((task) => {
    if (!task.auto_assign || !OPEN_STATUSES.has(task.status) || !task.due_at) {
      return false;
    }
    if (!isTaskAssignedToUser(task, params.userId)) {
      return false;
    }
    const key = localDateKey(new Date(task.due_at));
    return key >= params.startDate && key <= params.endDate;
  });
}

/**
 * Picks a replacement assignee for a rotating task during a punctual absence.
 */
export function pickReplacementForAbsentAssignee(params: {
  memberIds: string[];
  absentUserId: string;
  absences: readonly Pick<MemberAbsence, 'user_id' | 'start_date' | 'end_date'>[];
  dueAt: Date;
}): string | null {
  const pool = params.memberIds.filter((id) => id !== params.absentUserId);
  return pickNextAvailableAssignee(pool, params.absentUserId, params.absences, params.dueAt);
}

/**
 * True when the assignee is absent on the task due date (punctual absences only).
 */
export function isAssigneePunctuallyAbsent(params: {
  task: TaskWithRelations;
  absences: readonly Pick<MemberAbsence, 'user_id' | 'start_date' | 'end_date'>[];
}): boolean {
  const assigneeId = params.task.assigned_to ?? params.task.task_assignees[0]?.user_id;
  if (!assigneeId || !params.task.due_at) {
    return false;
  }
  return isUserAbsentOnDate(params.absences, assigneeId, new Date(params.task.due_at));
}
