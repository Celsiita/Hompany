import { formatCountdown } from '@/features/tasks/lib/countdown';
import { isTaskAssignedToUser } from '@/features/tasks/lib/board-filters';
import { isUserInvolvedInExpense } from '@/features/expenses/lib/expense-filters';
import type { ExpenseWithRelations, TaskWithRelations } from '@/types/database.types';
import { TASK_STATUS } from '@/types/task-status';

export type HomeAlert = {
  id: string;
  tone: 'red' | 'amber' | 'blue';
  message: string;
};

const SOON_MS = 24 * 60 * 60 * 1000;
const RECENT_MS = 48 * 60 * 60 * 1000;

/**
 * Builds in-app alerts for due work, reviews, new debts and overdue items.
 */
export function buildHomeAlerts(params: {
  tasks: TaskWithRelations[];
  expenses: ExpenseWithRelations[];
  currentUserId?: string | null;
  now?: number;
}): HomeAlert[] {
  const now = params.now ?? Date.now();
  const alerts: HomeAlert[] = [];

  for (const task of params.tasks) {
    const remaining = new Date(task.due_at).getTime() - now;
    const pastDue =
      task.status === TASK_STATUS.OVERDUE ||
      (task.status === TASK_STATUS.PENDING && remaining <= 0);

    if (pastDue) {
      alerts.push({
        id: `task-overdue-${task.id}`,
        tone: 'red',
        message: `«${task.title}» ha pasado el límite de tiempo.`,
      });
    } else if (task.status === TASK_STATUS.PENDING && remaining > 0 && remaining <= SOON_MS) {
      alerts.push({
        id: `task-soon-${task.id}`,
        tone: 'amber',
        message: `«${task.title}» vence pronto (${formatCountdown(task.due_at, now).label}).`,
      });
    } else if (
      task.status === TASK_STATUS.SUBMITTED &&
      params.currentUserId &&
      !isTaskAssignedToUser(task, params.currentUserId)
    ) {
      alerts.push({
        id: `task-review-${task.id}`,
        tone: 'blue',
        message: `Un compañero subió foto de «${task.title}» para validar.`,
      });
    }
  }

  for (const expense of params.expenses) {
    const involved = isUserInvolvedInExpense(expense, params.currentUserId);
    const createdAgo = now - new Date(expense.created_at).getTime();
    const updatedAgo = now - new Date(expense.updated_at || expense.created_at).getTime();

    if (
      expense.status === 'OPEN' &&
      involved &&
      params.currentUserId &&
      expense.paid_by !== params.currentUserId &&
      createdAgo >= 0 &&
      createdAgo <= RECENT_MS
    ) {
      alerts.push({
        id: `expense-new-${expense.id}`,
        tone: 'blue',
        message: `Nuevo gasto «${expense.title}» que te incluye.`,
      });
    }

    if (expense.status === 'SETTLED' && involved && updatedAgo >= 0 && updatedAgo <= RECENT_MS) {
      alerts.push({
        id: `expense-settled-${expense.id}`,
        tone: 'blue',
        message: `Se ha saldado la deuda de «${expense.title}».`,
      });
    }

    if (expense.status !== 'OPEN') {
      continue;
    }
    if (expense.due_at) {
      const remaining = new Date(expense.due_at).getTime() - now;
      if (remaining <= 0) {
        alerts.push({
          id: `expense-overdue-${expense.id}`,
          tone: 'red',
          message: `El gasto «${expense.title}» ha pasado la fecha límite.`,
        });
      } else if (remaining <= SOON_MS) {
        alerts.push({
          id: `expense-soon-${expense.id}`,
          tone: 'amber',
          message: `Quedan ${formatCountdown(expense.due_at, now).label.replace('Quedan ', '')} para saldar «${expense.title}».`,
        });
      }
    }
  }

  return alerts.slice(0, 6);
}

/**
 * Catalog of planned local/push reminders. Used by docs and a future scheduler.
 */
export const NOTIFICATION_CATALOG = [
  {
    id: 'task_due_soon',
    title: 'Tarea próxima a vencer',
    when: '24 h antes de due_at si sigue PENDING',
  },
  {
    id: 'task_overdue',
    title: 'Tarea vencida',
    when: 'Al cruzar due_at sin entrega',
  },
  {
    id: 'task_proof_review',
    title: 'Foto para validar',
    when: 'Un compañero pasa la tarea a SUBMITTED',
  },
  {
    id: 'expense_created',
    title: 'Nuevo gasto',
    when: 'Al crear un gasto que te incluye',
  },
  {
    id: 'expense_settled',
    title: 'Deuda saldada',
    when: 'Cuando se marca un share o el gasto entero',
  },
  {
    id: 'expense_overdue',
    title: 'Gasto fuera de plazo',
    when: 'Si due_at pasó y el gasto sigue OPEN',
  },
] as const;
