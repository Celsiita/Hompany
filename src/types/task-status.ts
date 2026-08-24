/**
 * Task lifecycle states for HOMPANY.
 * Every task instance MUST follow this state machine strictly.
 */
export const TASK_STATUS = {
  PENDING: 'PENDING',
  SUBMITTED: 'SUBMITTED',
  COMPLETED: 'COMPLETED',
  OVERDUE: 'OVERDUE',
  RESOLVED_LATE: 'RESOLVED_LATE',
  RESOLVED_BY_PEER: 'RESOLVED_BY_PEER',
  SKIPPED: 'SKIPPED',
} as const;

export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

export const TASK_STATUS_VALUES = Object.values(TASK_STATUS) as [TaskStatus, ...TaskStatus[]];
