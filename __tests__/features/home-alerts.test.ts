import { buildHomeAlerts } from '@/features/home/lib/alerts';
import type { ExpenseWithRelations, TaskWithRelations } from '@/types/database.types';
import { TASK_STATUS } from '@/types/task-status';

const HOME_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const ANA = '11111111-1111-1111-1111-111111111111';
const BRUNO = '22222222-2222-2222-2222-222222222222';
const NOW = Date.parse('2026-08-18T12:00:00.000Z');

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
    due_at: '2026-08-18T20:00:00.000Z',
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
    title: 'Súper',
    description: null,
    kind: 'GROCERY',
    item_type_id: null,
    amount: 20,
    currency: 'EUR',
    paid_by: BRUNO,
    status: 'OPEN',
    receipt_image_url: null,
    recurrence: 'ONCE',
    created_at: '2026-08-18T10:00:00.000Z',
    updated_at: '2026-08-18T10:00:00.000Z',
    base_title: 'Súper',
    series_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    due_at: '2026-08-19T12:00:00.000Z',
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
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
        home_id: HOME_ID,
        expense_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        user_id: ANA,
        share_amount: 10,
        share_percent: null,
        settlement_status: 'PENDING',
        created_at: '2026-08-18T10:00:00.000Z',
        profiles: { id: ANA, display_name: 'Ana', avatar_url: null },
      },
    ],
    ...overrides,
  };
}

describe('buildHomeAlerts', () => {
  it('warns when a pending task is past due even before OVERDUE status', () => {
    const alerts = buildHomeAlerts({
      tasks: [makeTask({ due_at: '2026-08-18T10:00:00.000Z' })],
      expenses: [],
      currentUserId: ANA,
      now: NOW,
    });
    expect(alerts[0]?.id).toContain('overdue');
  });

  it('asks roommates to review a submitted proof, not the assignee', () => {
    const submitted = makeTask({
      status: TASK_STATUS.SUBMITTED,
      proof_image_url: 'https://example.com/photo.jpg',
    });
    const forAssignee = buildHomeAlerts({
      tasks: [submitted],
      expenses: [],
      currentUserId: ANA,
      now: NOW,
    });
    const forRoommate = buildHomeAlerts({
      tasks: [submitted],
      expenses: [],
      currentUserId: BRUNO,
      now: NOW,
    });
    expect(forAssignee.some((alert) => alert.id.startsWith('task-review'))).toBe(false);
    expect(forRoommate.some((alert) => alert.id.startsWith('task-review'))).toBe(true);
  });

  it('flags a new expense that includes the current user', () => {
    const alerts = buildHomeAlerts({
      tasks: [],
      expenses: [makeExpense()],
      currentUserId: ANA,
      now: NOW,
    });
    expect(alerts.some((alert) => alert.id.startsWith('expense-new'))).toBe(true);
  });

  it('flags a recently settled debt', () => {
    const alerts = buildHomeAlerts({
      tasks: [],
      expenses: [makeExpense({ status: 'SETTLED', updated_at: '2026-08-18T11:00:00.000Z' })],
      currentUserId: ANA,
      now: NOW,
    });
    expect(alerts.some((alert) => alert.id.startsWith('expense-settled'))).toBe(true);
  });

  it('on system leave keeps only overdue expenses', () => {
    const overdueExpense = makeExpense({
      due_at: '2026-08-17T10:00:00.000Z',
      status: 'OPEN',
    });
    const alerts = buildHomeAlerts({
      tasks: [makeTask()],
      expenses: [overdueExpense, makeExpense({ id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2' })],
      systemLeaves: [
        {
          id: 'llllllll-llll-llll-llll-llllllllllll',
          home_id: HOME_ID,
          user_id: ANA,
          kind: 'INDEFINITE',
          start_date: '2026-08-01',
          end_date: null,
          reason: null,
          created_at: '2026-08-01T00:00:00.000Z',
          updated_at: '2026-08-01T00:00:00.000Z',
        },
      ],
      currentUserId: ANA,
      now: NOW,
    });
    expect(alerts.every((alert) => alert.id.startsWith('expense-overdue'))).toBe(true);
    expect(alerts.some((alert) => alert.id.startsWith('task-'))).toBe(false);
  });
});
