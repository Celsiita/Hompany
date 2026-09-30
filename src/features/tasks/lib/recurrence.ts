import {
  computeInitialDueAt,
  computeNextOccurrence,
  isRecurrencePaused,
  parseRecurrenceConfig,
  pickNextAssignee,
  shouldSpawnRecurring,
  type RecurrenceConfig,
  type RecurrenceKind,
  recurrenceLabel as sharedRecurrenceLabel,
} from '@/lib/recurrence';
import { TASK_STATUS, type TaskStatus } from '@/types/task-status';

export {
  parseRecurrenceConfig,
  isRecurrencePaused,
  pickNextAssignee,
  shouldSpawnRecurring,
};

/** Board instances that block spawning another copy of the same template. */
export const OPEN_INSTANCE_STATUSES: TaskStatus[] = [
  TASK_STATUS.PENDING,
  TASK_STATUS.SUBMITTED,
  TASK_STATUS.OVERDUE,
];

/** Terminal statuses that grant points or close the chore — and skip that also advances the series. */
export const SPAWN_ON_CLOSE_STATUSES: TaskStatus[] = [
  TASK_STATUS.COMPLETED,
  TASK_STATUS.RESOLVED_LATE,
  TASK_STATUS.RESOLVED_BY_PEER,
  TASK_STATUS.SKIPPED,
];

/**
 * Recurring templates keep spawning unless paused or one-off.
 */
export function isAutoRecurring(params: {
  recurrence: RecurrenceKind;
  is_active?: boolean;
  recurrence_config?: RecurrenceConfig | null;
}): boolean {
  if (params.recurrence === 'ONCE' || isRecurrencePaused(params.recurrence_config)) {
    return false;
  }
  if (params.is_active === false) {
    return false;
  }
  return true;
}

/**
 * Next ISO due date for a recurring task instance.
 */
export function computeNextDueAt(
  lastDueAt: string,
  recurrence: RecurrenceKind,
  now = new Date(),
  config?: RecurrenceConfig | null,
  dueMode?: import('@/lib/recurrence').DueMode,
): string {
  const next = computeNextOccurrence({ lastDueAt, recurrence, config, now, dueMode });
  if (next) {
    return next.toISOString();
  }
  return computeInitialDueAt(recurrence, config, now, dueMode).toISOString();
}

/**
 * Default due date when spawning without a previous instance.
 */
export function computeSpawnDueAt(
  recurrence: RecurrenceKind,
  now = new Date(),
  config?: RecurrenceConfig | null,
  dueMode?: import('@/lib/recurrence').DueMode,
): string {
  return computeInitialDueAt(recurrence, config, now, dueMode).toISOString();
}

/**
 * Returns whether an auto-recurring template should create a board instance.
 */
export function shouldSpawnRecurringInstance(params: {
  recurrence: RecurrenceKind;
  is_active: boolean;
  openInstanceCount: number;
  recurrence_config?: RecurrenceConfig | null;
}): boolean {
  return shouldSpawnRecurring({
    recurrence: params.recurrence,
    config: {
      ...(params.recurrence_config ?? {}),
      is_paused: params.is_active === false || isRecurrencePaused(params.recurrence_config),
    },
    openInstanceCount: params.openInstanceCount,
  });
}

/**
 * Counts open instances linked to a template.
 */
export function countOpenInstancesForTemplate(
  instances: readonly { template_id: string | null; status: TaskStatus }[],
  templateId: string,
): number {
  return instances.filter(
    (instance) =>
      instance.template_id === templateId && OPEN_INSTANCE_STATUSES.includes(instance.status),
  ).length;
}

/**
 * Human-readable recurrence label for cards (honours interval, e.g. "Cada 2 semanas").
 */
export function recurrenceLabel(
  recurrence: RecurrenceKind,
  config?: RecurrenceConfig | null | unknown,
): string {
  return sharedRecurrenceLabel(
    recurrence,
    config && typeof config === 'object' ? parseRecurrenceConfig(config) : null,
  );
}

/**
 * Paused recurring items belong on both the live board and history.
 */
export function isPausedRecurring(params: {
  recurrence: RecurrenceKind;
  recurrence_config?: unknown;
}): boolean {
  return params.recurrence !== 'ONCE' && isRecurrencePaused(parseRecurrenceConfig(params.recurrence_config));
}
