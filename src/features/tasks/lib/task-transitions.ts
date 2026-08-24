import { TASK_STATUS, type TaskStatus } from '@/types/task-status';

/** Terminal task statuses shown in History. */
export const CLOSED_TASK_STATUSES: TaskStatus[] = [
  TASK_STATUS.COMPLETED,
  TASK_STATUS.RESOLVED_LATE,
  TASK_STATUS.RESOLVED_BY_PEER,
  TASK_STATUS.SKIPPED,
  TASK_STATUS.OVERDUE,
];

/** Active board statuses (open work). */
export const OPEN_TASK_STATUSES: TaskStatus[] = [
  TASK_STATUS.PENDING,
  TASK_STATUS.SUBMITTED,
];

/**
 * Allowed manual transitions for Paso 4 (before photo check-in).
 */
export const ALLOWED_TASK_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  PENDING: [TASK_STATUS.SUBMITTED, TASK_STATUS.OVERDUE, TASK_STATUS.SKIPPED],
  SUBMITTED: [TASK_STATUS.COMPLETED, TASK_STATUS.PENDING, TASK_STATUS.SKIPPED],
  COMPLETED: [TASK_STATUS.PENDING],
  OVERDUE: [TASK_STATUS.RESOLVED_LATE, TASK_STATUS.RESOLVED_BY_PEER, TASK_STATUS.SKIPPED, TASK_STATUS.PENDING],
  RESOLVED_LATE: [TASK_STATUS.PENDING],
  RESOLVED_BY_PEER: [TASK_STATUS.PENDING],
  SKIPPED: [TASK_STATUS.PENDING],
};

/**
 * Returns whether a status transition is allowed by the lifecycle rules for Paso 4.
 *
 * @param from - Current status.
 * @param to - Target status.
 */
export function canTransitionTaskStatus(from: TaskStatus, to: TaskStatus): boolean {
  return ALLOWED_TASK_TRANSITIONS[from].includes(to);
}

/**
 * Asserts a status transition is allowed.
 *
 * @throws {Error} When the transition is not permitted.
 */
export function assertTaskTransition(from: TaskStatus, to: TaskStatus): void {
  if (!canTransitionTaskStatus(from, to)) {
    throw new Error(`Transición de tarea no permitida: ${from} → ${to}`);
  }
}
