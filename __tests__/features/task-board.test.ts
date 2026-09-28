import { formatCountdown, formatDuration, formatDueSummary } from '@/features/tasks/lib/countdown';
import { partitionTasks, summarizeTasks } from '@/features/tasks/lib/task-summary';
import { canTransitionTaskStatus } from '@/features/tasks/lib/task-transitions';
import type { Task } from '@/types/database.types';
import { TASK_STATUS } from '@/types/task-status';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    home_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    title: 'Test',
    description: null,
    status: TASK_STATUS.PENDING,
    category: 'QUICK',
    item_type_id: null,
    icon: 'checklist',
    recurrence: 'ONCE',
    is_template: false,
    template_id: null,
    created_by: null,
    base_title: 'Test',
    auto_assign: false,
    recurrence_config: {},
    assigned_to: null,
    completed_by: null,
    due_at: '2026-08-18T10:00:00.000Z',
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
    ...overrides,
  };
}

describe('formatDueSummary', () => {
  it('shows absolute date and calendar-day relative label', () => {
    const now = Date.parse('2026-08-16T10:00:00.000Z');
    // Force local-stable by using midday local via Date constructor in test env —
    // use a far future ISO so calendar days are clearly positive.
    const summary = formatDueSummary('2026-08-19T22:00:00.000Z', 'DEADLINE', now);
    expect(summary.isOverdue).toBe(false);
    expect(summary.label).toContain('Vence el');
    expect(summary.calendarDays).toBeGreaterThanOrEqual(2);
  });
});

describe('formatCountdown', () => {
  it('formats remaining time', () => {
    const now = Date.parse('2026-08-16T10:00:00.000Z');
    const result = formatCountdown('2026-08-17T12:00:00.000Z', now);
    expect(result.isOverdue).toBe(false);
    expect(result.label).toContain('Quedan');
  });

  it('marks overdue tasks', () => {
    const now = Date.parse('2026-08-18T10:00:00.000Z');
    const result = formatCountdown('2026-08-17T10:00:00.000Z', now);
    expect(result.isOverdue).toBe(true);
    expect(result.label).toContain('Vencida');
  });
});

describe('formatDuration', () => {
  it('formats minutes and hours', () => {
    expect(formatDuration(90 * 60_000)).toBe('1h 30m');
    expect(formatDuration(45 * 60_000)).toBe('45m');
  });
});

describe('task transitions', () => {
  it('allows PENDING to SUBMITTED', () => {
    expect(canTransitionTaskStatus(TASK_STATUS.PENDING, TASK_STATUS.SUBMITTED)).toBe(true);
  });

  it('allows COMPLETED to PENDING for reopen', () => {
    expect(canTransitionTaskStatus(TASK_STATUS.COMPLETED, TASK_STATUS.PENDING)).toBe(true);
  });
});

describe('summarizeTasks', () => {
  it('computes health from open and completed tasks', () => {
    const summary = summarizeTasks([
      makeTask({ status: TASK_STATUS.PENDING }),
      makeTask({ id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', status: TASK_STATUS.COMPLETED }),
    ]);

    expect(summary.pending).toBe(1);
    expect(summary.completed).toBe(1);
    expect(summary.healthScore).toBe(50);
    expect(summary.healthLabel).toBe('Regular');
  });

  it('marks chaos when there are overdue tasks', () => {
    const summary = summarizeTasks([
      makeTask({ status: TASK_STATUS.OVERDUE }),
      makeTask({ id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', status: TASK_STATUS.COMPLETED }),
    ]);

    expect(summary.healthLabel).toBe('Crítico');
  });
});

describe('partitionTasks', () => {
  it('splits open and closed tasks', () => {
    const { open, closed } = partitionTasks([
      makeTask({ status: TASK_STATUS.PENDING }),
      makeTask({ id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', status: TASK_STATUS.SUBMITTED }),
      makeTask({ id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', status: TASK_STATUS.COMPLETED }),
    ]);

    expect(open).toHaveLength(2);
    expect(closed).toHaveLength(1);
  });
});
