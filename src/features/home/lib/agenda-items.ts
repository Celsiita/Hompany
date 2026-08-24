import type { IconPack } from '@/lib/icons/packs';
import { glyphForExpenseKind, glyphForTaskIcon } from '@/lib/icons/packs';
import type { ExpenseWithRelations, TaskWithRelations } from '@/types/database.types';
import { TASK_STATUS } from '@/types/task-status';

export type AgendaItemKind = 'task' | 'expense';

export type AgendaItem = {
  /** Composite key for list rendering (`t-{id}` / `e-{id}`). */
  id: string;
  /** Underlying task or expense UUID. */
  entityId: string;
  when: Date;
  title: string;
  mine: boolean;
  kind: AgendaItemKind;
  glyph: string;
  dueMode: 'DEADLINE' | 'EXECUTION';
};

/**
 * Calendar day at local midnight (hours zeroed).
 */
export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

/**
 * True when the current user is assignee (task) of the item.
 */
export function isMineTask(task: TaskWithRelations, userId?: string | null): boolean {
  if (!userId) {
    return false;
  }
  return task.assigned_to === userId || task.task_assignees.some((item) => item.user_id === userId);
}

/**
 * True when the current user pays or shares the expense.
 */
export function isMineExpense(expense: ExpenseWithRelations, userId?: string | null): boolean {
  if (!userId) {
    return false;
  }
  return expense.paid_by === userId || expense.expense_shares.some((share) => share.user_id === userId);
}

/**
 * Builds active agenda items (open tasks + open dated expenses) for calendar views.
 */
export function buildAgendaItems(params: {
  tasks: TaskWithRelations[];
  expenses: ExpenseWithRelations[];
  currentUserId?: string | null;
  pack: IconPack;
}): AgendaItem[] {
  const tasks = params.tasks
    .filter(
      (task) =>
        task.status === TASK_STATUS.PENDING ||
        task.status === TASK_STATUS.OVERDUE ||
        task.status === TASK_STATUS.SUBMITTED,
    )
    .map((task) => ({
      id: `t-${task.id}`,
      entityId: task.id,
      when: new Date(task.due_at),
      title: task.title,
      mine: isMineTask(task, params.currentUserId),
      kind: 'task' as const,
      glyph: glyphForTaskIcon(params.pack, task.icon),
      dueMode: (task.due_mode ?? 'DEADLINE') as 'DEADLINE' | 'EXECUTION',
    }));

  const expenses = params.expenses
    .filter((expense) => expense.status === 'OPEN' && expense.due_at)
    .map((expense) => ({
      id: `e-${expense.id}`,
      entityId: expense.id,
      when: new Date(expense.due_at as string),
      title: expense.title,
      mine: isMineExpense(expense, params.currentUserId),
      kind: 'expense' as const,
      glyph: glyphForExpenseKind(params.pack, expense.kind),
      dueMode: (expense.due_mode ?? 'DEADLINE') as 'DEADLINE' | 'EXECUTION',
    }));

  return [...tasks, ...expenses].sort((a, b) => a.when.getTime() - b.when.getTime());
}

/**
 * Items whose due date falls on the given local calendar day.
 */
export function agendaItemsForDay(items: AgendaItem[], day: Date): AgendaItem[] {
  const key = startOfDay(day).getTime();
  return items.filter((item) => startOfDay(item.when).getTime() === key);
}
