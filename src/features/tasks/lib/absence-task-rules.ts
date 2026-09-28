import { isUserAbsentOnDate } from '@/lib/absences';
import { isTaskAssignedToUser } from '@/features/tasks/lib/board-filters';
import type { MemberAbsence } from '@/schemas/absence.schema';
import type { TaskWithRelations } from '@/types/database.types';

type AbsenceLike = Pick<MemberAbsence, 'user_id' | 'start_date' | 'end_date'> & {
  reason?: MemberAbsence['reason'];
};

/**
 * True when the viewer is absent on the given calendar day.
 */
export function isViewerAbsentOnDate(
  absences: readonly AbsenceLike[],
  userId: string | null | undefined,
  date: Date,
): boolean {
  if (!userId) {
    return false;
  }
  return isUserAbsentOnDate(absences, userId, date);
}

/**
 * Hides tasks assigned to the viewer while they are absent on the task due date.
 */
export function filterTasksForAbsentViewer(
  tasks: readonly TaskWithRelations[],
  absences: readonly AbsenceLike[],
  userId: string | null | undefined,
): TaskWithRelations[] {
  if (!userId) {
    return [...tasks];
  }
  return tasks.filter((task) => {
    if (!task.due_at || !isTaskAssignedToUser(task, userId)) {
      return true;
    }
    return !isUserAbsentOnDate(absences, userId, new Date(task.due_at));
  });
}

/**
 * Excludes tasks whose assignee is absent on the due date (home metrics / rotation).
 */
export function excludeAbsentAssigneeTasks(
  tasks: readonly TaskWithRelations[],
  absences: readonly AbsenceLike[],
): TaskWithRelations[] {
  return tasks.filter((task) => {
    const assigneeId = task.assigned_to ?? task.task_assignees[0]?.user_id;
    if (!assigneeId || !task.due_at) {
      return true;
    }
    return !isUserAbsentOnDate(absences, assigneeId, new Date(task.due_at));
  });
}

/**
 * Absent users do not validate proofs, receive task alerts or interact with the task board.
 */
export function canViewerParticipateInTasks(
  absences: readonly AbsenceLike[],
  userId: string | null | undefined,
  now: Date = new Date(),
): boolean {
  return !isViewerAbsentOnDate(absences, userId, now);
}
