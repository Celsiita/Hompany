import { ICON_PACKS } from '@/lib/icons/packs';
import {
  agendaItemsForDay,
  buildAgendaItems,
  computeAgendaDayDots,
  computeAgendaDayEmojis,
  filterExpensesForViewer,
  isMineExpense,
  isMineTask,
  startOfDay,
  toAgendaScopeFilter,
} from '@/features/home/lib/agenda-items';
import {
  buildMonthCells,
  daysInMonth,
  daysInWeek,
  formatMonthTitle,
  mondayFirstWeekday,
  shiftMonth,
  shiftWeek,
  startOfMonth,
  startOfWeek,
  monthTitleForCalendar,
  monthForExpandedView,
} from '@/features/home/lib/month-calendar';
import {
  localDateKey,
  projectOccurrenceDates,
  withSkippedOccurrenceDate,
} from '@/lib/recurrence';
import type { ExpenseWithRelations, TaskWithRelations } from '@/types/database.types';
import { TASK_STATUS } from '@/types/task-status';

const HOME_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const ANA = '11111111-1111-1111-1111-111111111111';
const BRUNO = '22222222-2222-2222-2222-222222222222';

function makeTask(overrides: Partial<TaskWithRelations> = {}): TaskWithRelations {
  return {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    home_id: HOME_ID,
    title: 'Fregar',
    description: null,
    status: TASK_STATUS.PENDING,
    category: 'QUICK',
    item_type_id: null,
    icon: 'checklist',
    recurrence: 'ONCE',
    is_template: false,
    template_id: null,
    created_by: null,
    base_title: 'Fregar',
    auto_assign: false,
    recurrence_config: {},
    assigned_to: ANA,
    completed_by: null,
    due_at: '2026-08-20T18:00:00.000Z',
    due_mode: 'DEADLINE',
    starts_at: null,
    all_day: false,
    completed_at: null,
    proof_image_url: null,
    points_value: 10,
    review_note: null,
    review_note_kind: null,
    created_at: '2026-08-16T00:00:00.000Z',
    updated_at: '2026-08-16T00:00:00.000Z',
    task_assignees: [
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
        home_id: HOME_ID,
        task_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        user_id: ANA,
        created_at: '2026-08-16T00:00:00.000Z',
        profiles: { id: ANA, display_name: 'Ana', avatar_url: null },
      },
    ],
    ...overrides,
  };
}

function makeExpense(overrides: Partial<ExpenseWithRelations> = {}): ExpenseWithRelations {
  return {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    home_id: HOME_ID,
    title: 'Alquiler',
    description: null,
    kind: 'HOUSE',
    item_type_id: null,
    amount: 500,
    currency: 'EUR',
    paid_by: BRUNO,
    status: 'OPEN',
    receipt_image_url: null,
    recurrence: 'MONTHLY',
    created_at: '2026-08-01T00:00:00.000Z',
    updated_at: '2026-08-01T00:00:00.000Z',
    base_title: 'Alquiler',
    series_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    due_at: '2026-08-22T12:00:00.000Z',
    due_mode: 'DEADLINE',
    starts_at: null,
    all_day: false,
    completed_at: null,
    recurrence_config: {},
    auto_assign: false,
    split_mode: 'EQUAL',
    payer: { id: BRUNO, display_name: 'Bruno', avatar_url: null },
    expense_shares: [
      {
        id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        home_id: HOME_ID,
        expense_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        user_id: ANA,
        share_amount: 250,
        share_percent: null,
        settlement_status: 'PENDING',
        created_at: '2026-08-01T00:00:00.000Z',
        profiles: { id: ANA, display_name: 'Ana', avatar_url: null },
      },
    ],
    ...overrides,
  };
}

describe('agenda-items', () => {
  it('marks tasks and expenses as mine when the user is involved', () => {
    const task = makeTask();
    const expense = makeExpense();
    expect(isMineTask(task, ANA)).toBe(true);
    expect(isMineTask(task, BRUNO)).toBe(false);
    expect(isMineExpense(expense, ANA)).toBe(true);
    expect(isMineExpense(expense, BRUNO)).toBe(true);
  });

  it('hides expenses from users who are not involved', () => {
    const stranger = '33333333-3333-3333-3333-333333333333';
    expect(filterExpensesForViewer([makeExpense()], stranger)).toHaveLength(0);
    expect(filterExpensesForViewer([makeExpense()], ANA)).toHaveLength(1);
  });

  it('builds open agenda items and filters by calendar day', () => {
    const items = buildAgendaItems({
      tasks: [makeTask({ due_at: '2026-08-20T10:00:00.000Z' })],
      expenses: [makeExpense({ due_at: '2026-08-22T10:00:00.000Z' })],
      currentUserId: ANA,
      pack: ICON_PACKS.classic,
      now: new Date(2026, 7, 18),
    });
    expect(items.some((item) => item.kind === 'task' && item.lifecycle === 'open')).toBe(true);
    expect(items.some((item) => item.kind === 'expense' && item.lifecycle === 'open')).toBe(true);
    const day = startOfDay(new Date(2026, 7, 20));
    expect(agendaItemsForDay(items, day).every((item) => item.kind === 'task')).toBe(true);
  });

  it('projects scheduled weekly occurrences beyond the open instance', () => {
    const openDue = new Date(2026, 7, 17, 23, 59, 0); // Mon
    const items = buildAgendaItems({
      tasks: [
        makeTask({
          recurrence: 'WEEKLY',
          template_id: 'tttttttt-tttt-tttt-tttt-tttttttttttt',
          due_at: openDue.toISOString(),
          recurrence_config: { day_of_week: 1 },
        }),
      ],
      expenses: [],
      currentUserId: ANA,
      pack: ICON_PACKS.classic,
      now: new Date(2026, 7, 17),
      horizon: new Date(2026, 8, 15),
    });
    const scheduled = items.filter((item) => item.lifecycle === 'scheduled');
    expect(scheduled.length).toBeGreaterThan(0);
    expect(scheduled.every((item) => item.kind === 'task')).toBe(true);
  });

  it('respects skipped_dates when projecting', () => {
    const from = new Date(2026, 7, 17, 23, 59, 0);
    const nextWeek = new Date(2026, 7, 24, 23, 59, 0);
    const config = withSkippedOccurrenceDate({ day_of_week: 1 }, nextWeek);
    const projected = projectOccurrenceDates({
      recurrence: 'WEEKLY',
      config,
      fromDueAt: from,
      horizon: new Date(2026, 8, 10),
    });
    expect(projected.some((date) => localDateKey(date) === localDateKey(nextWeek))).toBe(false);
  });

  it('maps view scope and categories to projection flags', () => {
    expect(toAgendaScopeFilter('mine', { tasks: true, expenses: true })).toEqual({
      myTasks: true,
      othersTasks: false,
      myExpenses: true,
      othersExpenses: false,
    });
    expect(toAgendaScopeFilter('others', { tasks: true, expenses: false })).toEqual({
      myTasks: false,
      othersTasks: true,
      myExpenses: false,
      othersExpenses: false,
    });
    expect(toAgendaScopeFilter('ALL', { tasks: false, expenses: true })).toEqual({
      myTasks: false,
      othersTasks: false,
      myExpenses: true,
      othersExpenses: true,
    });
  });

  it('shows only debts in Mis cosas expense filter', () => {
    const creditorExpense = makeExpense({
      id: 'creditor-expense',
      paid_by: ANA,
      recurrence: 'ONCE',
      due_at: '2026-08-20T12:00:00.000Z',
      expense_shares: [
        {
          id: 'share-1',
          home_id: HOME_ID,
          expense_id: 'creditor-expense',
          user_id: BRUNO,
          share_amount: 10,
        share_percent: null,
          settlement_status: 'PENDING',
          created_at: '2026-08-16T00:00:00.000Z',
          profiles: { id: BRUNO, display_name: 'Bruno', avatar_url: null },
        },
      ],
    });
    const debtorExpense = makeExpense({
      id: 'debtor-expense',
      paid_by: BRUNO,
      recurrence: 'ONCE',
      due_at: '2026-08-21T12:00:00.000Z',
      expense_shares: [
        {
          id: 'share-2',
          home_id: HOME_ID,
          expense_id: 'debtor-expense',
          user_id: ANA,
          share_amount: 15,
        share_percent: null,
          settlement_status: 'PENDING',
          created_at: '2026-08-16T00:00:00.000Z',
          profiles: { id: ANA, display_name: 'Ana', avatar_url: null },
        },
      ],
    });
    const items = buildAgendaItems({
      tasks: [],
      expenses: [creditorExpense, debtorExpense],
      currentUserId: ANA,
      pack: ICON_PACKS.classic,
      now: new Date(2026, 7, 18),
      scope: toAgendaScopeFilter('mine', { tasks: false, expenses: true }),
    });
    expect(items.map((item) => item.entityId)).toEqual(['debtor-expense']);
  });

  it('builds calendar dots and emojis separately', () => {
    const items = buildAgendaItems({
      tasks: [makeTask({ due_at: '2026-08-20T10:00:00.000Z' })],
      expenses: [makeExpense({ due_at: '2026-08-20T12:00:00.000Z' })],
      currentUserId: ANA,
      pack: ICON_PACKS.classic,
      now: new Date(2026, 7, 18),
      scope: toAgendaScopeFilter('ALL', { tasks: true, expenses: true }),
    });
    const day = startOfDay(new Date(2026, 7, 20));
    const dayItems = agendaItemsForDay(items, day);
    const dots = computeAgendaDayDots(dayItems);
    const emojis = computeAgendaDayEmojis(dayItems, { silence: true, absence: true });
    expect(emojis.map((emoji) => emoji.key)).toEqual(['silence', 'absence', 'expense']);
  });

  it('projects scheduled monthly expenses like tasks', () => {
    const openDue = new Date(2026, 7, 22, 23, 59, 0);
    const items = buildAgendaItems({
      tasks: [],
      expenses: [
        makeExpense({
          due_at: openDue.toISOString(),
          recurrence: 'MONTHLY',
          recurrence_config: { day_of_month: 22 },
        }),
      ],
      currentUserId: ANA,
      pack: ICON_PACKS.classic,
      now: new Date(2026, 7, 18),
      horizon: new Date(2026, 11, 31),
      scope: toAgendaScopeFilter('ALL', { tasks: false, expenses: true }),
    });
    expect(items.some((item) => item.kind === 'expense' && item.lifecycle === 'open')).toBe(true);
    expect(items.some((item) => item.kind === 'expense' && item.lifecycle === 'scheduled')).toBe(
      true,
    );
  });
});

describe('month-calendar helpers', () => {
  it('builds monday-first grids and titles', () => {
    expect(mondayFirstWeekday(new Date(2026, 7, 17))).toBe(0);
    expect(formatMonthTitle(startOfMonth(new Date(2026, 7, 1)))).toMatch(/agosto/i);
    expect(buildMonthCells(new Date(2026, 7, 1), new Date(2026, 7, 18)).length).toBeGreaterThan(28);
    expect(shiftMonth(new Date(2026, 7, 1), 1).getMonth()).toBe(8);
  });

  it('builds rolling week ranges from the anchor day', () => {
    const week = daysInWeek(new Date(2026, 7, 20));
    expect(week).toHaveLength(7);
    expect(week[0]?.getDate()).toBe(20);
    expect(week[6]?.getDate()).toBe(26);
    expect(startOfWeek(new Date(2026, 7, 20)).getDay()).toBe(1);
    expect(daysInMonth(new Date(2026, 7, 1))).toHaveLength(31);
    expect(shiftWeek(new Date(2026, 7, 20), 1, new Date(2026, 7, 1)).getDate()).toBe(27);
    expect(shiftWeek(new Date(2026, 7, 20), -1, new Date(2026, 7, 20)).getDate()).toBe(20);
  });

  it('prefers the current month in cross-month weeks', () => {
    const now = new Date(2026, 8, 1);
    const week = daysInWeek(now);
    expect(monthTitleForCalendar({ expanded: false, visibleMonth: startOfMonth(now), weekDays: week, now })).toMatch(
      /septiembre/i,
    );
    expect(monthForExpandedView(week, now).getMonth()).toBe(8);
  });
});
