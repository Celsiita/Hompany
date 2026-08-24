import {
  computeNextDueAt,
  computeSpawnDueAt,
  countOpenInstancesForTemplate,
  shouldSpawnRecurringInstance,
} from '@/features/tasks/lib/recurrence';
import {
  computeNextOccurrence,
  computeCurrentPeriodDueAt,
  cycleInstanceTitle,
  defaultDueAtForMode,
  ensureRecurrenceConfigDefaults,
  isRecurrenceCalendarDayEnabled,
  pickNextAssignee,
  shouldSpawnRecurring,
  syncRecurrenceConfigFromDate,
} from '@/lib/recurrence';
import { isHomeAdminRole } from '@/lib/roles';
import { TASK_STATUS } from '@/types/task-status';
import { canTransitionTaskStatus } from '@/features/tasks/lib/task-transitions';

describe('task recurrence', () => {
  it('spawns the next daily or weekly instance only when none is open', () => {
    expect(
      shouldSpawnRecurringInstance({
        recurrence: 'DAILY',
        is_active: true,
        openInstanceCount: 0,
      }),
    ).toBe(true);
    expect(
      shouldSpawnRecurringInstance({
        recurrence: 'DAILY',
        is_active: true,
        openInstanceCount: 1,
      }),
    ).toBe(false);
    expect(
      shouldSpawnRecurringInstance({
        recurrence: 'ONCE',
        is_active: false,
        openInstanceCount: 0,
      }),
    ).toBe(false);
    expect(
      shouldSpawnRecurringInstance({
        recurrence: 'WEEKLY',
        is_active: false,
        openInstanceCount: 0,
      }),
    ).toBe(false);
  });

  it('does not spawn when paused', () => {
    expect(
      shouldSpawnRecurring({
        recurrence: 'MONTHLY',
        config: { is_paused: true },
        openInstanceCount: 0,
      }),
    ).toBe(false);
  });

  it('advances due dates by one period and skips missed windows', () => {
    const lastDue = '2026-08-19T22:00:00.000Z';
    const now = new Date('2026-08-20T12:00:00.000Z');
    const nextDaily = new Date(computeNextDueAt(lastDue, 'DAILY', now));
    expect(nextDaily.getTime()).toBeGreaterThan(now.getTime());

    const nextWeekly = new Date(computeNextDueAt('2026-08-10T22:00:00.000Z', 'WEEKLY', now));
    expect(nextWeekly.getTime()).toBeGreaterThan(now.getTime());
  });

  it('uses a default due date when creating a recurring item', () => {
    const now = new Date('2026-08-17T10:00:00.000Z');
    const daily = new Date(computeSpawnDueAt('DAILY', now));
    const weekly = new Date(computeSpawnDueAt('WEEKLY', now));
    const once = new Date(computeSpawnDueAt('ONCE', now));

    expect(daily.getTime()).toBeGreaterThan(now.getTime());
    expect(weekly.getTime()).toBeGreaterThan(now.getTime());
    expect(once.getTime()).toBeGreaterThan(now.getTime());
  });

  it('counts only open instances of the same template', () => {
    const templateId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1';
    const count = countOpenInstancesForTemplate(
      [
        { template_id: templateId, status: TASK_STATUS.PENDING },
        { template_id: templateId, status: TASK_STATUS.COMPLETED },
        { template_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', status: TASK_STATUS.OVERDUE },
      ],
      templateId,
    );
    expect(count).toBe(1);
  });

  it('allows reopening a completed task', () => {
    expect(canTransitionTaskStatus(TASK_STATUS.COMPLETED, TASK_STATUS.PENDING)).toBe(true);
  });
});

describe('flexible recurrence engine', () => {
  it('targets a specific weekday', () => {
    const next = computeNextOccurrence({
      lastDueAt: '2026-08-17T12:00:00.000Z',
      recurrence: 'WEEKLY',
      config: { day_of_week: 5 },
      now: new Date('2026-08-17T12:00:00.000Z'),
    });
    expect(next).not.toBeNull();
    expect(next ? ((next.getDay() + 6) % 7) + 1 : 0).toBe(5);
  });

  it('uses the last day of the month', () => {
    const next = computeNextOccurrence({
      lastDueAt: '2026-01-31T12:00:00.000Z',
      recurrence: 'MONTHLY',
      config: { due_day_type: 'LAST_DAY_OF_MONTH' },
      now: new Date('2026-02-01T12:00:00.000Z'),
    });
    expect(next?.getDate()).toBe(28);
  });

  it('skips inactive months', () => {
    const next = computeNextOccurrence({
      lastDueAt: '2026-06-15T12:00:00.000Z',
      recurrence: 'MONTHLY',
      config: { day_of_month: 15, active_months: [1, 2, 3, 4, 5, 6, 9, 10, 11, 12] },
      now: new Date('2026-06-16T12:00:00.000Z'),
    });
    expect(next?.getMonth()).toBe(8);
  });

  it('builds monthly cycle titles', () => {
    expect(cycleInstanceTitle('Alquiler', 'MONTHLY', new Date(2026, 8, 1))).toBe(
      'Alquiler - Septiembre 2026',
    );
    expect(cycleInstanceTitle('Basura', 'DAILY', new Date(2026, 8, 1))).toContain('Basura -');
  });

  it('keeps a monthly due in the current month when the day has not passed', () => {
    const now = new Date(2026, 7, 18, 10, 0, 0);
    const due = computeCurrentPeriodDueAt('MONTHLY', { day_of_month: 30 }, now);
    expect(due?.getMonth()).toBe(7);
    expect(due?.getDate()).toBe(30);
  });

  it('keeps weekly due in the current week when the weekday is today', () => {
    // Wednesday 19 Aug 2026
    const now = new Date(2026, 7, 19, 15, 0, 0);
    const due = computeCurrentPeriodDueAt('WEEKLY', { day_of_week: 3 }, now, 'DEADLINE');
    expect(due).not.toBeNull();
    expect(due?.getDate()).toBe(19);
  });

  it('returns null for a monthly day already passed this month', () => {
    const now = new Date(2026, 7, 18, 10, 0, 0);
    expect(computeCurrentPeriodDueAt('MONTHLY', { day_of_month: 10 }, now)).toBeNull();
  });

  it('defaults EXECUTION to tomorrow at 09:00 and DEADLINE to today 23:59', () => {
    const now = new Date(2026, 7, 20, 15, 30, 0);
    const execution = defaultDueAtForMode('EXECUTION', now);
    expect(execution.getFullYear()).toBe(2026);
    expect(execution.getMonth()).toBe(7);
    expect(execution.getDate()).toBe(21);
    expect(execution.getHours()).toBe(9);
    expect(execution.getMinutes()).toBe(0);

    const deadline = defaultDueAtForMode('DEADLINE', now);
    expect(deadline.getDate()).toBe(20);
    expect(deadline.getHours()).toBe(23);
    expect(deadline.getMinutes()).toBe(59);
  });

  it('rotates assignees', () => {
    expect(pickNextAssignee(['a', 'b', 'c'], 'a')).toBe('b');
    expect(pickNextAssignee(['a', 'b', 'c'], 'c')).toBe('a');
  });

  it('syncs weekday and month day from a calendar pick', () => {
    const monday = new Date(2026, 7, 17); // Mon
    expect(syncRecurrenceConfigFromDate('WEEKLY', monday, {}).day_of_week).toBe(1);
    expect(
      syncRecurrenceConfigFromDate('MONTHLY', new Date(2026, 7, 31), {
        due_day_type: 'SPECIFIC_DAY',
      }).day_of_month,
    ).toBe(31);
  });

  it('restricts calendar days for weekly and monthly rules', () => {
    const now = new Date(2026, 7, 17); // Mon 17 Aug 2026
    expect(
      isRecurrenceCalendarDayEnabled('WEEKLY', { day_of_week: 1 }, 2026, 7, 17, now),
    ).toBe(true);
    expect(
      isRecurrenceCalendarDayEnabled('WEEKLY', { day_of_week: 1 }, 2026, 7, 18, now),
    ).toBe(false);
    expect(
      isRecurrenceCalendarDayEnabled(
        'MONTHLY',
        { due_day_type: 'SPECIFIC_DAY', day_of_month: 31 },
        2026,
        8,
        30,
        now,
      ),
    ).toBe(true); // Sep has 30 days → clamped
    expect(
      isRecurrenceCalendarDayEnabled(
        'MONTHLY',
        { due_day_type: 'LAST_DAY_OF_MONTH' },
        2026,
        7,
        31,
        now,
      ),
    ).toBe(true); // Aug 31
    expect(
      isRecurrenceCalendarDayEnabled(
        'MONTHLY',
        { due_day_type: 'LAST_DAY_OF_MONTH' },
        2026,
        7,
        30,
        now,
      ),
    ).toBe(false);
  });

  it('seeds required weekly and monthly config defaults', () => {
    const from = new Date(2026, 7, 19); // Wed
    expect(ensureRecurrenceConfigDefaults('WEEKLY', {}, from).day_of_week).toBe(3);
    expect(ensureRecurrenceConfigDefaults('MONTHLY', {}, from).day_of_month).toBe(19);
  });
});

describe('roles', () => {
  it('treats owner and admin as elevated', () => {
    expect(isHomeAdminRole('owner')).toBe(true);
    expect(isHomeAdminRole('admin')).toBe(true);
    expect(isHomeAdminRole('member')).toBe(false);
  });
});
