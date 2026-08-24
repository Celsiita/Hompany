import type { TaskStatus } from '@/types/task-status';
import { TASK_STATUS } from '@/types/task-status';

export type StatusBadgeTone = {
  label: string;
  bg: string;
  text: string;
};

/**
 * Semantic badge styles — high contrast, no flat gray for primary states.
 */
export const STATUS_BADGE = {
  pending: {
    label: 'Pendiente',
    bg: 'bg-amber-100',
    text: 'text-amber-900',
  },
  review: {
    label: 'En revisión',
    bg: 'bg-sky-100',
    text: 'text-sky-900',
  },
  completed: {
    label: 'Completada',
    bg: 'bg-emerald-100',
    text: 'text-emerald-900',
  },
  settled: {
    label: 'Saldado',
    bg: 'bg-emerald-100',
    text: 'text-emerald-900',
  },
  overdue: {
    label: 'Vencida',
    bg: 'bg-red-100',
    text: 'text-red-900',
  },
  late: {
    label: 'Tarde',
    bg: 'bg-orange-100',
    text: 'text-orange-900',
  },
  peer: {
    label: 'Por compañero',
    bg: 'bg-violet-100',
    text: 'text-violet-900',
  },
  skipped: {
    label: 'Archivada',
    bg: 'bg-slate-200',
    text: 'text-slate-800',
  },
  paused: {
    label: 'Pausada',
    bg: 'bg-indigo-100',
    text: 'text-indigo-900',
  },
  archived: {
    label: 'Archivado',
    bg: 'bg-slate-200',
    text: 'text-slate-800',
  },
  reminder: {
    label: 'Sin importe',
    bg: 'bg-amber-100',
    text: 'text-amber-900',
  },
} as const satisfies Record<string, StatusBadgeTone>;

/**
 * Resolves the badge for a task lifecycle status.
 */
export function taskStatusBadge(
  status: TaskStatus,
  options?: { paused?: boolean },
): StatusBadgeTone {
  if (options?.paused) {
    return STATUS_BADGE.paused;
  }
  switch (status) {
    case TASK_STATUS.PENDING:
      return STATUS_BADGE.pending;
    case TASK_STATUS.SUBMITTED:
      return STATUS_BADGE.review;
    case TASK_STATUS.COMPLETED:
      return STATUS_BADGE.completed;
    case TASK_STATUS.OVERDUE:
      return STATUS_BADGE.overdue;
    case TASK_STATUS.RESOLVED_LATE:
      return STATUS_BADGE.late;
    case TASK_STATUS.RESOLVED_BY_PEER:
      return STATUS_BADGE.peer;
    case TASK_STATUS.SKIPPED:
      return STATUS_BADGE.skipped;
    default:
      return STATUS_BADGE.pending;
  }
}

/**
 * Resolves the badge for an expense. DB keeps OPEN; UI shows Pendiente.
 */
export function expenseStatusBadge(params: {
  status: 'OPEN' | 'SETTLED' | 'ARCHIVED';
  paused?: boolean;
  noAmount?: boolean;
}): StatusBadgeTone {
  if (params.paused) {
    return { ...STATUS_BADGE.paused, label: 'Pausado' };
  }
  if (params.status === 'ARCHIVED') {
    return STATUS_BADGE.archived;
  }
  if (params.status === 'SETTLED') {
    return STATUS_BADGE.settled;
  }
  if (params.noAmount) {
    return STATUS_BADGE.reminder;
  }
  return STATUS_BADGE.pending;
}
