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
    label: 'Completado',
    bg: 'bg-emerald-100',
    text: 'text-emerald-900',
  },
  settled: {
    label: 'Saldado',
    bg: 'bg-emerald-100',
    text: 'text-emerald-900',
  },
  overdue: {
    label: 'Atrasado',
    bg: 'bg-red-100',
    text: 'text-red-900',
  },
  late: {
    label: 'Atrasado',
    bg: 'bg-orange-100',
    text: 'text-orange-900',
  },
  peer: {
    label: 'Por compañero',
    bg: 'bg-sky-100',
    text: 'text-sky-900',
  },
  skipped: {
    label: 'Omitida',
    bg: 'bg-slate-200',
    text: 'text-slate-800',
  },
  paused: {
    label: 'Pausado',
    bg: 'bg-slate-100',
    text: 'text-slate-800',
  },
  requested: {
    label: 'Solicitado',
    bg: 'bg-sky-100',
    text: 'text-sky-900',
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
  options?: { paused?: boolean; openOverdue?: boolean },
): StatusBadgeTone {
  if (options?.paused) {
    return STATUS_BADGE.paused;
  }
  if (options?.openOverdue && (status === TASK_STATUS.PENDING || status === TASK_STATUS.OVERDUE)) {
    return STATUS_BADGE.overdue;
  }
  switch (status) {
    case TASK_STATUS.PENDING:
      return STATUS_BADGE.pending;
    case TASK_STATUS.SUBMITTED:
      return STATUS_BADGE.review;
    case TASK_STATUS.COMPLETED:
      return STATUS_BADGE.completed;
    case TASK_STATUS.RESOLVED_BY_PEER:
      return STATUS_BADGE.peer;
    case TASK_STATUS.OVERDUE:
      return STATUS_BADGE.overdue;
    case TASK_STATUS.RESOLVED_LATE:
      return STATUS_BADGE.late;
    case TASK_STATUS.SKIPPED:
      return { ...STATUS_BADGE.skipped, label: 'Omitido' };
    default:
      return STATUS_BADGE.pending;
  }
}

/**
 * Resolves the badge for an expense. DB keeps OPEN; UI shows Pendiente / Solicitado / Atrasado.
 */
export function expenseStatusBadge(params: {
  status: 'OPEN' | 'SETTLED' | 'ARCHIVED' | 'SKIPPED';
  paused?: boolean;
  noAmount?: boolean;
  overdue?: boolean;
  requested?: boolean;
}): StatusBadgeTone {
  if (params.paused) {
    return STATUS_BADGE.paused;
  }
  if (params.status === 'SKIPPED') {
    return { ...STATUS_BADGE.skipped, label: 'Omitido' };
  }
  if (params.status === 'SETTLED') {
    if (params.overdue) {
      return STATUS_BADGE.late;
    }
    return STATUS_BADGE.settled;
  }
  if (params.status === 'ARCHIVED') {
    return STATUS_BADGE.settled;
  }
  if (params.requested) {
    return STATUS_BADGE.requested;
  }
  if (params.noAmount) {
    return STATUS_BADGE.reminder;
  }
  if (params.overdue) {
    return STATUS_BADGE.overdue;
  }
  return STATUS_BADGE.pending;
}
