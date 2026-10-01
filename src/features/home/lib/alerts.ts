import { formatCountdown } from '@/features/tasks/lib/countdown';
import { isTaskAssignedToUser } from '@/features/tasks/lib/board-filters';
import { canViewerParticipateInTasks, isViewerAbsentOnDate } from '@/features/tasks/lib/absence-task-rules';
import { isUserInvolvedInExpense } from '@/features/expenses/lib/expense-filters';
import { getAppLocale } from '@/lib/i18n/locale-store';
import { translate } from '@/lib/i18n/strings';
import { isUserSystemFrozen } from '@/lib/presence';
import type { MemberAbsence } from '@/schemas/absence.schema';
import type { MemberPresencePeriod, MemberSystemLeave } from '@/schemas/presence.schema';
import type { ExpenseWithRelations, TaskWithRelations } from '@/types/database.types';
import { TASK_STATUS } from '@/types/task-status';

export type HomeAlertTone = 'red' | 'amber' | 'teal';

/** Inbox grouping for the alerts sheet. */
export type HomeAlertSection = 'urgent' | 'soon' | 'review' | 'money';

export type HomeAlert = {
  id: string;
  tone: HomeAlertTone;
  section: HomeAlertSection;
  title: string;
  message: string;
  entityType: 'task' | 'expense';
  entityId: string;
};

const SOON_MS = 24 * 60 * 60 * 1000;
const RECENT_MS = 48 * 60 * 60 * 1000;

const SECTION_PRIORITY: Record<HomeAlertSection, number> = {
  urgent: 0,
  soon: 1,
  review: 2,
  money: 3,
};

const SECTION_LABEL_KEY: Record<HomeAlertSection, string> = {
  urgent: 'alert.section.urgent',
  soon: 'alert.section.soon',
  review: 'alert.section.review',
  money: 'alert.section.money',
};

/**
 * Localized inbox section labels (reads current app locale).
 */
export function homeAlertSectionLabel(section: HomeAlertSection): string {
  return translate(getAppLocale(), SECTION_LABEL_KEY[section]);
}

/** @deprecated Prefer homeAlertSectionLabel(); kept for callers that expect a map. */
export const HOME_ALERT_SECTION_LABEL: Record<HomeAlertSection, string> = {
  get urgent() {
    return homeAlertSectionLabel('urgent');
  },
  get soon() {
    return homeAlertSectionLabel('soon');
  },
  get review() {
    return homeAlertSectionLabel('review');
  },
  get money() {
    return homeAlertSectionLabel('money');
  },
};

/**
 * Sorts alerts: urgent → soon → review → money, then by id for stability.
 */
export function sortHomeAlerts(alerts: HomeAlert[]): HomeAlert[] {
  return [...alerts].sort((a, b) => {
    const bySection = SECTION_PRIORITY[a.section] - SECTION_PRIORITY[b.section];
    if (bySection !== 0) {
      return bySection;
    }
    return a.id.localeCompare(b.id);
  });
}

/**
 * Groups sorted alerts into labeled inbox sections (empty sections omitted).
 */
export function groupHomeAlerts(
  alerts: HomeAlert[],
): Array<{ section: HomeAlertSection; label: string; items: HomeAlert[] }> {
  const sorted = sortHomeAlerts(alerts);
  const order: HomeAlertSection[] = ['urgent', 'soon', 'review', 'money'];
  return order
    .map((section) => ({
      section,
      label: homeAlertSectionLabel(section),
      items: sorted.filter((item) => item.section === section),
    }))
    .filter((group) => group.items.length > 0);
}

/**
 * Builds in-app alerts for due work, reviews, new debts and overdue items.
 * System leave freezes everything except overdue expenses.
 */
export function buildHomeAlerts(params: {
  tasks: TaskWithRelations[];
  expenses: ExpenseWithRelations[];
  absences?: readonly MemberAbsence[];
  systemLeaves?: readonly MemberSystemLeave[];
  presencePeriods?: readonly MemberPresencePeriod[];
  currentUserId?: string | null;
  now?: number;
  /** Max alerts kept after sort (default 12). */
  limit?: number;
}): HomeAlert[] {
  const locale = getAppLocale();
  const t = (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars);
  const now = params.now ?? Date.now();
  const nowDate = new Date(now);
  const absences = params.absences ?? [];
  const systemLeaves = params.systemLeaves ?? [];
  const presencePeriods = params.presencePeriods ?? [];
  const limit = params.limit ?? 12;
  const frozen = isUserSystemFrozen({
    leaves: systemLeaves,
    presencePeriods,
    userId: params.currentUserId,
    date: nowDate,
  });
  const canParticipateInTasks =
    !frozen && canViewerParticipateInTasks(absences, params.currentUserId, nowDate);
  const alerts: HomeAlert[] = [];

  if (!frozen) {
    for (const task of params.tasks) {
      const dueDate = task.due_at ? new Date(task.due_at) : null;
      const assigneeAbsent =
        dueDate &&
        params.currentUserId &&
        isTaskAssignedToUser(task, params.currentUserId) &&
        isViewerAbsentOnDate(absences, params.currentUserId, dueDate);

      if (assigneeAbsent) {
        continue;
      }

      const remaining = dueDate ? dueDate.getTime() - now : 0;
      const pastDue =
        task.status === TASK_STATUS.OVERDUE ||
        (task.status === TASK_STATUS.PENDING && remaining <= 0);

      if (pastDue) {
        alerts.push({
          id: `task-overdue-${task.id}`,
          tone: 'red',
          section: 'urgent',
          title: t('alert.taskOverdue'),
          message: t('alert.taskOverdueMsg', { title: task.title }),
          entityType: 'task',
          entityId: task.id,
        });
      } else if (task.status === TASK_STATUS.PENDING && remaining > 0 && remaining <= SOON_MS) {
        alerts.push({
          id: `task-soon-${task.id}`,
          tone: 'amber',
          section: 'soon',
          title: t('alert.taskSoon'),
          message: t('alert.taskSoonMsg', {
            title: task.title,
            when: formatCountdown(task.due_at, now).label,
          }),
          entityType: 'task',
          entityId: task.id,
        });
      } else if (
        task.status === TASK_STATUS.SUBMITTED &&
        params.currentUserId &&
        canParticipateInTasks &&
        !isTaskAssignedToUser(task, params.currentUserId)
      ) {
        alerts.push({
          id: `task-review-${task.id}`,
          tone: 'teal',
          section: 'review',
          title: t('alert.taskReview'),
          message: t('alert.taskReviewMsg', { title: task.title }),
          entityType: 'task',
          entityId: task.id,
        });
      }
    }
  }

  for (const expense of params.expenses) {
    const involved = isUserInvolvedInExpense(expense, params.currentUserId);
    const createdAgo = now - new Date(expense.created_at).getTime();
    const updatedAgo = now - new Date(expense.updated_at || expense.created_at).getTime();
    const isOverdue =
      expense.status === 'OPEN' &&
      Boolean(expense.due_at) &&
      new Date(expense.due_at).getTime() - now <= 0;

    if (frozen) {
      if (isOverdue && involved) {
        alerts.push({
          id: `expense-overdue-${expense.id}`,
          tone: 'red',
          section: 'urgent',
          title: t('alert.expenseOverdue'),
          message: t('alert.expenseOverdueMsg', { title: expense.title }),
          entityType: 'expense',
          entityId: expense.id,
        });
      }
      continue;
    }

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
        tone: 'teal',
        section: 'money',
        title: t('alert.expenseNew'),
        message: t('alert.expenseNewMsg', { title: expense.title }),
        entityType: 'expense',
        entityId: expense.id,
      });
    }

    if (expense.status === 'SETTLED' && involved && updatedAgo >= 0 && updatedAgo <= RECENT_MS) {
      alerts.push({
        id: `expense-settled-${expense.id}`,
        tone: 'teal',
        section: 'money',
        title: t('alert.expenseSettled'),
        message: t('alert.expenseSettledMsg', { title: expense.title }),
        entityType: 'expense',
        entityId: expense.id,
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
          section: 'urgent',
          title: t('alert.expenseOverdue'),
          message: t('alert.expenseOverdueMsg', { title: expense.title }),
          entityType: 'expense',
          entityId: expense.id,
        });
      } else if (remaining <= SOON_MS) {
        alerts.push({
          id: `expense-soon-${expense.id}`,
          tone: 'amber',
          section: 'soon',
          title: t('alert.expenseSoon'),
          message: t('alert.expenseSoonMsg', {
            title: expense.title,
            when: formatCountdown(expense.due_at, now).label,
          }),
          entityType: 'expense',
          entityId: expense.id,
        });
      }
    }
  }

  return sortHomeAlerts(alerts).slice(0, limit);
}

/**
 * Catalog of planned local/push reminders. Used by docs and a future scheduler.
 * Titles use i18n keys; `when` stays English for internal docs.
 */
export const NOTIFICATION_CATALOG = [
  {
    id: 'task_due_soon',
    titleKey: 'alert.taskSoon',
    when: '24 h before due_at if still PENDING',
  },
  {
    id: 'task_overdue',
    titleKey: 'alert.taskOverdue',
    when: 'When due_at passes without submit',
  },
  {
    id: 'task_proof_review',
    titleKey: 'alert.taskReview',
    when: 'Roommate in SUBMITTED',
  },
  {
    id: 'expense_created',
    titleKey: 'alert.expenseNew',
    when: 'Create that includes you (≤ 48 h)',
  },
  {
    id: 'expense_settled',
    titleKey: 'alert.expenseSettled',
    when: 'Recent SETTLED expense (≤ 48 h)',
  },
  {
    id: 'expense_overdue',
    titleKey: 'alert.expenseOverdue',
    when: 'OPEN and past due_at — also during system leave',
  },
];
