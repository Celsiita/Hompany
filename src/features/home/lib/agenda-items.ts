import type { IconPack } from '@/lib/icons/packs';
import { glyphForExpenseKind, glyphForTaskIcon } from '@/lib/icons/packs';
import { isUserOwesExpense } from '@/features/expenses/lib/expense-filters';
import {
  assigneeOverrideForDate,
  localDateKey,
  parseRecurrenceConfig,
  projectOccurrenceDates,
  scheduleAvailability,
  shiftStartsAtForNextDue,
  startOfLocalDay,
  type ScheduleAvailability,
} from '@/lib/recurrence';
import type { ExpenseWithRelations, TaskWithRelations } from '@/types/database.types';
import { TASK_STATUS } from '@/types/task-status';

export type AgendaItemKind = 'task' | 'expense';
export type AgendaLifecycle = 'open' | 'scheduled';

/** Who sees tasks/expenses in the agenda. None selected = Todo el piso. */
export type AgendaViewScope = 'mine' | 'others' | 'ALL';

/** Category multi-select for agenda content. */
export type AgendaCategoryFilter = {
  tasks: boolean;
  expenses: boolean;
};

/** Life markers on the agenda (absences / silence / visits). Cleared = show all. */
export type AgendaLifeFocus = 'absences' | 'silence' | 'visits' | 'ALL';

export const DEFAULT_AGENDA_VIEW_SCOPE: AgendaViewScope = 'ALL';

export const DEFAULT_AGENDA_CATEGORY_FILTER: AgendaCategoryFilter = {
  tasks: true,
  expenses: true,
};

export const DEFAULT_AGENDA_LIFE_FOCUS: AgendaLifeFocus = 'ALL';

/** @deprecated Internal projection flags; prefer {@link toAgendaScopeFilter}. */
export type AgendaScopeFilter = {
  /** Show my tasks. */
  myTasks: boolean;
  /** Show roommates' tasks. */
  othersTasks: boolean;
  /** Show expenses I owe. */
  myExpenses: boolean;
  /** Show expenses others owe me (I'm involved, not as debtor). */
  othersExpenses: boolean;
};

export const DEFAULT_AGENDA_SCOPE: AgendaScopeFilter = {
  myTasks: true,
  othersTasks: true,
  myExpenses: true,
  othersExpenses: true,
};

/**
 * Maps UI scope + category chips to projection flags.
 * No scope pill (ALL) = Todo el piso.
 */
export function toAgendaScopeFilter(
  viewScope: AgendaViewScope,
  categories: AgendaCategoryFilter,
): AgendaScopeFilter {
  const mine = viewScope === 'mine' || viewScope === 'ALL';
  const others = viewScope === 'others' || viewScope === 'ALL';
  return {
    myTasks: categories.tasks && mine,
    othersTasks: categories.tasks && others,
    myExpenses: categories.expenses && mine,
    othersExpenses: categories.expenses && others,
  };
}

/**
 * Which life markers (and list rows) are visible for the current life filter.
 */
export function agendaLifeVisibility(focus: AgendaLifeFocus = 'ALL'): {
  absences: boolean;
  silence: boolean;
  visits: boolean;
} {
  return {
    absences: focus === 'ALL' || focus === 'absences',
    silence: focus === 'ALL' || focus === 'silence',
    visits: focus === 'ALL' || focus === 'visits',
  };
}

export type AgendaDayDot = {
  key: string;
  kind: 'mine-task' | 'others-task' | 'expense-owe' | 'expense-credit' | 'absence';
  /** Open items use solid dots; scheduled use lighter / hollow styling. */
  open: boolean;
};

/**
 * Builds calendar dot descriptors for a single day.
 */
export function computeAgendaDayDots(dayItems: AgendaItem[]): AgendaDayDot[] {
  const dots: AgendaDayDot[] = [];
  const mineTasks = dayItems.filter((item) => item.kind === 'task' && item.mine);
  const othersTasks = dayItems.filter((item) => item.kind === 'task' && !item.mine);
  const debtExpenses = dayItems.filter(
    (item) => item.kind === 'expense' && item.expenseRole === 'i_owe',
  );
  const creditExpenses = dayItems.filter(
    (item) => item.kind === 'expense' && item.expenseRole !== 'i_owe',
  );

  if (mineTasks.length > 0) {
    dots.push({
      key: 'mine-task',
      kind: 'mine-task',
      open: mineTasks.some((item) => item.lifecycle === 'open'),
    });
  }
  if (othersTasks.length > 0) {
    dots.push({
      key: 'others-task',
      kind: 'others-task',
      open: othersTasks.some((item) => item.lifecycle === 'open'),
    });
  }
  if (debtExpenses.length > 0) {
    dots.push({
      key: 'expense-owe',
      kind: 'expense-owe',
      open: debtExpenses.some((item) => item.lifecycle === 'open'),
    });
  }
  if (creditExpenses.length > 0) {
    dots.push({
      key: 'expense-credit',
      kind: 'expense-credit',
      open: creditExpenses.some((item) => item.lifecycle === 'open'),
    });
  }
  return dots;
}

export type AgendaDayEmoji = {
  key: string;
  glyph: string;
};

/**
 * Status emojis under the day number: silencio / ausencia / visitas.
 * Expenses use colored dots only (no diamond glyph).
 */
export function computeAgendaDayEmojis(
  dayItems: AgendaItem[],
  options: {
    silence: boolean;
    absence: boolean;
    noticeEmojis?: { key: string; glyph: string }[];
  },
): AgendaDayEmoji[] {
  const emojis: AgendaDayEmoji[] = [];
  if (options.silence) {
    emojis.push({ key: 'silence', glyph: '🔇' });
  }
  if (options.absence) {
    emojis.push({ key: 'absence', glyph: '🧳' });
  }
  for (const notice of options.noticeEmojis ?? []) {
    emojis.push(notice);
  }
  return emojis;
}

export type AgendaExpenseRole = 'i_owe' | 'they_owe_me';

export type AgendaItem = {
  /** Composite key for list rendering. */
  id: string;
  /** Open-row UUID when `lifecycle === 'open'`; series/template anchor otherwise. */
  entityId: string;
  /** Template id (tasks) or series id (expenses) for scheduled actions. */
  seriesId: string | null;
  when: Date;
  /** Activation instant; agenda day is still keyed by `when` (due). */
  startsAt: Date | null;
  title: string;
  mine: boolean;
  kind: AgendaItemKind;
  /** For expenses: debt vs credit from the current user's view. */
  expenseRole?: AgendaExpenseRole;
  glyph: string;
  dueMode: 'DEADLINE' | 'EXECUTION';
  lifecycle: AgendaLifecycle;
  /** Display name of assignee / payer for the sheet. */
  actorLabel: string;
  assignedUserId: string | null;
};

/**
 * Agenda list badge for schedule window relative to `now`.
 * Day membership is always by due date (`item.when`).
 */
export function agendaItemAvailability(
  item: Pick<AgendaItem, 'startsAt' | 'when' | 'lifecycle'>,
  now = new Date(),
): ScheduleAvailability {
  return scheduleAvailability({
    startsAt: item.startsAt,
    dueAt: item.when,
    now,
  });
}

/**
 * Calendar day at local midnight (hours zeroed).
 */
export function startOfDay(date: Date): Date {
  return startOfLocalDay(date);
}

/**
 * True when the current user is assignee (task) of the item.
 */
export function isMineTask(task: TaskWithRelations, userId?: string | null): boolean {
  if (!userId) {
    return false;
  }
  const assignees = task.task_assignees ?? [];
  return task.assigned_to === userId || assignees.some((item) => item.user_id === userId);
}

/**
 * True when the current user pays or shares the expense.
 */
export function isMineExpense(expense: ExpenseWithRelations, userId?: string | null): boolean {
  if (!userId) {
    return false;
  }
  const shares = expense.expense_shares ?? [];
  return expense.paid_by === userId || shares.some((share) => share.user_id === userId);
}

/**
 * Creditor-only involvement (paid_by).
 */
export function isMyCreditorExpense(
  expense: ExpenseWithRelations,
  userId?: string | null,
): boolean {
  return Boolean(userId && expense.paid_by === userId);
}

function defaultHorizon(now: Date): Date {
  const horizon = startOfDay(now);
  horizon.setMonth(horizon.getMonth() + 3);
  horizon.setDate(horizon.getDate() + 1);
  return horizon;
}

function taskActorLabel(task: TaskWithRelations, when: Date): {
  label: string;
  userId: string | null;
} {
  const config = parseRecurrenceConfig(task.recurrence_config);
  const override = assigneeOverrideForDate(config, when);
  if (override) {
    const match = (task.task_assignees ?? []).find((item) => item.user_id === override);
    return {
      label: match?.profiles?.display_name ?? 'Compañero',
      userId: override,
    };
  }
  const primary = (task.task_assignees ?? [])[0];
  return {
    label: primary?.profiles?.display_name ?? 'Sin asignar',
    userId: task.assigned_to ?? primary?.user_id ?? null,
  };
}

/**
 * Filters expenses to those the current user may see (involved). Admins get no free pass.
 */
export function filterExpensesForViewer(
  expenses: ExpenseWithRelations[],
  userId?: string | null,
): ExpenseWithRelations[] {
  if (!userId) {
    return [];
  }
  return expenses.filter((expense) => isMineExpense(expense, userId));
}

/**
 * Builds open + projected scheduled agenda items for calendar / week views.
 */
export function buildAgendaItems(params: {
  tasks: TaskWithRelations[];
  expenses: ExpenseWithRelations[];
  currentUserId?: string | null;
  pack: IconPack;
  now?: Date;
  horizon?: Date;
  scope?: AgendaScopeFilter;
}): AgendaItem[] {
  const now = params.now ?? new Date();
  const horizon = params.horizon ?? defaultHorizon(now);
  const scope = params.scope ?? DEFAULT_AGENDA_SCOPE;
  const visibleExpenses = filterExpensesForViewer(params.expenses, params.currentUserId);

  const openTasks = params.tasks.filter(
    (task) =>
      task.status === TASK_STATUS.PENDING ||
      task.status === TASK_STATUS.OVERDUE ||
      task.status === TASK_STATUS.SUBMITTED,
  );

  const items: AgendaItem[] = [];

  if (scope.myTasks || scope.othersTasks) {
    for (const task of openTasks) {
      if (!task.due_at) {
        continue;
      }
      const mine = isMineTask(task, params.currentUserId);
      const includeOpen = (mine && scope.myTasks) || (!mine && scope.othersTasks);
      if (!includeOpen) {
        continue;
      }

      const when = new Date(task.due_at);
      const startsAt = task.starts_at ? new Date(task.starts_at) : startOfLocalDay(when);
      const actor = taskActorLabel(task, when);
      items.push({
        id: `t-open-${task.id}`,
        entityId: task.id,
        seriesId: task.template_id,
        when,
        startsAt,
        title: task.title?.trim() || 'Sin título',
        mine,
        kind: 'task',
        glyph: glyphForTaskIcon(params.pack, task.icon ?? 'checklist'),
        dueMode: (task.due_mode ?? 'DEADLINE') as 'DEADLINE' | 'EXECUTION',
        lifecycle: 'open',
        actorLabel: actor.label,
        assignedUserId: actor.userId,
      });

      if (task.recurrence === 'ONCE') {
        continue;
      }

      const config = parseRecurrenceConfig(task.recurrence_config);
      const projected = projectOccurrenceDates({
        recurrence: task.recurrence,
        config,
        dueMode: task.due_mode ?? 'DEADLINE',
        fromDueAt: when,
        includeFrom: false,
        horizon,
      });

      for (const due of projected) {
        const actorProjected = taskActorLabel(task, due);
        const projectedMine = Boolean(
          params.currentUserId && actorProjected.userId === params.currentUserId,
        );
        const includeProjected =
          (projectedMine && scope.myTasks) || (!projectedMine && scope.othersTasks);
        if (!includeProjected) {
          continue;
        }
        items.push({
          id: `t-sched-${task.template_id ?? task.id}-${localDateKey(due)}`,
          entityId: task.id,
          seriesId: task.template_id ?? task.id,
          when: due,
          startsAt: shiftStartsAtForNextDue({
            previousStartsAt: startsAt,
            previousDueAt: when,
            nextDueAt: due,
          }),
          title: task.title?.trim() || 'Sin título',
          mine: projectedMine,
          kind: 'task',
          glyph: glyphForTaskIcon(params.pack, task.icon ?? 'checklist'),
          dueMode: (task.due_mode ?? 'DEADLINE') as 'DEADLINE' | 'EXECUTION',
          lifecycle: 'scheduled',
          actorLabel: actorProjected.label,
          assignedUserId: actorProjected.userId,
        });
      }
    }
  }

  if (scope.myExpenses || scope.othersExpenses) {
    const openExpenses = visibleExpenses.filter(
      (expense) => expense.status === 'OPEN' && expense.due_at,
    );

    for (const expense of openExpenses) {
      const creditor = isMyCreditorExpense(expense, params.currentUserId);
      const involved = isMineExpense(expense, params.currentUserId);
      const owes = isUserOwesExpense(expense, params.currentUserId);
      const show =
        (scope.myExpenses && (owes || creditor)) ||
        (scope.othersExpenses && involved && !owes && !creditor);
      if (!show) {
        continue;
      }

      const when = new Date(expense.due_at as string);
      const startsAt = expense.starts_at ? new Date(expense.starts_at) : startOfLocalDay(when);
      const expenseRole: AgendaExpenseRole = owes ? 'i_owe' : 'they_owe_me';
      const payerName = expense.payer?.display_name ?? 'Alguien';
      const actorLabel =
        expenseRole === 'i_owe' ? `Debes a ${payerName}` : `${payerName} te debe`;
      const mineExpense = owes || creditor;
      items.push({
        id: `e-open-${expense.id}`,
        entityId: expense.id,
        seriesId: expense.series_id,
        when,
        startsAt,
        title: expense.title?.trim() || 'Sin título',
        mine: mineExpense,
        expenseRole,
        kind: 'expense',
        glyph: glyphForExpenseKind(params.pack, expense.kind),
        dueMode: (expense.due_mode ?? 'DEADLINE') as 'DEADLINE' | 'EXECUTION',
        lifecycle: 'open',
        actorLabel,
        assignedUserId: expense.paid_by,
      });

      if (expense.recurrence === 'ONCE') {
        continue;
      }

      const config = parseRecurrenceConfig(expense.recurrence_config);
      const projected = projectOccurrenceDates({
        recurrence: expense.recurrence,
        config,
        dueMode: expense.due_mode ?? 'DEADLINE',
        fromDueAt: when,
        includeFrom: false,
        horizon,
      });

      for (const due of projected) {
        items.push({
          id: `e-sched-${expense.series_id ?? expense.id}-${localDateKey(due)}`,
          entityId: expense.id,
          seriesId: expense.series_id ?? expense.id,
          when: due,
          startsAt: shiftStartsAtForNextDue({
            previousStartsAt: startsAt,
            previousDueAt: when,
            nextDueAt: due,
          }),
          title: expense.title?.trim() || 'Sin título',
          mine: mineExpense,
          expenseRole,
          kind: 'expense',
          glyph: glyphForExpenseKind(params.pack, expense.kind),
          dueMode: (expense.due_mode ?? 'DEADLINE') as 'DEADLINE' | 'EXECUTION',
          lifecycle: 'scheduled',
          actorLabel,
          assignedUserId: expense.paid_by,
        });
      }
    }
  }

  return items
    .filter((item) => !Number.isNaN(item.when.getTime()))
    .sort((a, b) => a.when.getTime() - b.when.getTime());
}

/**
 * Items whose due date falls on the given local calendar day.
 */
export function agendaItemsForDay(items: AgendaItem[], day: Date): AgendaItem[] {
  const key = startOfDay(day).getTime();
  return items.filter((item) => startOfDay(item.when).getTime() === key);
}
