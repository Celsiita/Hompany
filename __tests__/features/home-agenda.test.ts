import { ICON_PACKS } from '@/lib/icons/packs';
import {
  agendaItemsForDay,
  buildAgendaItems,
  isMineExpense,
  isMineTask,
  startOfDay,
} from '@/features/home/lib/agenda-items';
import {
  buildMonthCells,
  formatMonthTitle,
  mondayFirstWeekday,
  shiftMonth,
  startOfMonth,
} from '@/features/home/lib/month-calendar';
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
    completed_at: null,
    proof_image_url: null,
    points_value: 10,
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
    completed_at: null,
    recurrence_config: {},
    auto_assign: false,
    payer: { id: BRUNO, display_name: 'Bruno', avatar_url: null },
    expense_shares: [
      {
        id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        home_id: HOME_ID,
        expense_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        user_id: ANA,
        share_amount: 250,
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

  it('builds agenda items and filters by calendar day', () => {
    const items = buildAgendaItems({
      tasks: [makeTask({ due_at: '2026-08-20T10:00:00.000Z' })],
      expenses: [makeExpense({ due_at: '2026-08-22T10:00:00.000Z' })],
      currentUserId: ANA,
      pack: ICON_PACKS.classic,
    });
    expect(items).toHaveLength(2);
    expect(items[0]?.kind).toBe('task');
    expect(items[0]?.mine).toBe(true);
    expect(items[1]?.mine).toBe(true);

    const day = startOfDay(new Date(2026, 7, 20));
    expect(agendaItemsForDay(items, day)).toHaveLength(1);
    expect(agendaItemsForDay(items, day)[0]?.entityId).toBe(items[0]?.entityId);
  });
});

describe('month-calendar', () => {
  it('uses Monday-first weekday indexing', () => {
    // 2026-08-17 is a Monday
    expect(mondayFirstWeekday(new Date(2026, 7, 17))).toBe(0);
    // 2026-08-16 is a Sunday
    expect(mondayFirstWeekday(new Date(2026, 7, 16))).toBe(6);
  });

  it('builds a month grid covering August 2026', () => {
    const cells = buildMonthCells(new Date(2026, 7, 1), new Date(2026, 7, 20));
    const inMonth = cells.filter((cell) => cell.inMonth);
    expect(inMonth).toHaveLength(31);
    expect(cells.some((cell) => cell.isToday)).toBe(true);
    expect(formatMonthTitle(startOfMonth(new Date(2026, 7, 15)))).toMatch(/agosto.*2026/i);
    expect(shiftMonth(new Date(2026, 7, 1), 1).getMonth()).toBe(8);
  });
});
