import {
  scheduleRangeExceedsRecurrence,
  validateScheduleRangeAgainstRecurrence,
} from '@/lib/recurrence';

function day(year: number, month: number, date: number, hours = 0, minutes = 0): Date {
  return new Date(year, month - 1, date, hours, minutes, 0, 0);
}

describe('scheduleRangeExceedsRecurrence', () => {
  it('allows ONCE with any range', () => {
    expect(
      scheduleRangeExceedsRecurrence({
        startsAt: day(2026, 9, 1),
        dueAt: day(2026, 9, 30, 23, 59),
        recurrence: 'ONCE',
      }),
    ).toBe(false);
  });

  it('rejects a 2-day range with daily interval 1', () => {
    expect(
      scheduleRangeExceedsRecurrence({
        startsAt: day(2026, 9, 1),
        dueAt: day(2026, 9, 2, 23, 59),
        recurrence: 'DAILY',
        recurrenceConfig: { interval: 1 },
      }),
    ).toBe(true);
  });

  it('allows a 2-day range with daily interval 2', () => {
    expect(
      scheduleRangeExceedsRecurrence({
        startsAt: day(2026, 9, 1),
        dueAt: day(2026, 9, 2, 23, 59),
        recurrence: 'DAILY',
        recurrenceConfig: { interval: 2 },
      }),
    ).toBe(false);
  });

  it('allows a same-day window with daily interval 1', () => {
    expect(
      scheduleRangeExceedsRecurrence({
        startsAt: day(2026, 9, 1),
        dueAt: day(2026, 9, 1, 23, 59),
        recurrence: 'DAILY',
        recurrenceConfig: { interval: 1 },
      }),
    ).toBe(false);
  });

  it('rejects an 8-day range with weekly interval 1', () => {
    expect(
      scheduleRangeExceedsRecurrence({
        startsAt: day(2026, 9, 1),
        dueAt: day(2026, 9, 8, 23, 59),
        recurrence: 'WEEKLY',
        recurrenceConfig: { interval: 1 },
      }),
    ).toBe(true);
  });

  it('allows a 7-day range with weekly interval 1', () => {
    expect(
      scheduleRangeExceedsRecurrence({
        startsAt: day(2026, 9, 1),
        dueAt: day(2026, 9, 7, 23, 59),
        recurrence: 'WEEKLY',
        recurrenceConfig: { interval: 1 },
      }),
    ).toBe(false);
  });

  it('rejects a 2-month range with monthly interval 1', () => {
    expect(
      scheduleRangeExceedsRecurrence({
        startsAt: day(2026, 1, 1),
        dueAt: day(2026, 2, 1, 23, 59),
        recurrence: 'MONTHLY',
        recurrenceConfig: { interval: 1 },
      }),
    ).toBe(true);
  });

  it('allows a full month with monthly interval 1', () => {
    expect(
      scheduleRangeExceedsRecurrence({
        startsAt: day(2026, 1, 1),
        dueAt: day(2026, 1, 31, 23, 59),
        recurrence: 'MONTHLY',
        recurrenceConfig: { interval: 1 },
      }),
    ).toBe(false);
  });

  it('rejects a 2-year span with yearly interval 1', () => {
    expect(
      scheduleRangeExceedsRecurrence({
        startsAt: day(2026, 1, 1),
        dueAt: day(2027, 1, 1, 23, 59),
        recurrence: 'YEARLY',
        recurrenceConfig: { interval: 1 },
      }),
    ).toBe(true);
  });

  it('returns a Spanish error message when invalid', () => {
    const message = validateScheduleRangeAgainstRecurrence({
      startsAt: day(2026, 9, 1),
      dueAt: day(2026, 9, 2, 23, 59),
      recurrence: 'DAILY',
      recurrenceConfig: { interval: 1 },
    });
    expect(message).toMatch(/2 días/);
    expect(message).toMatch(/periodicidad/i);
  });

  it('returns null when valid', () => {
    expect(
      validateScheduleRangeAgainstRecurrence({
        startsAt: day(2026, 9, 1),
        dueAt: day(2026, 9, 1, 23, 59),
        recurrence: 'DAILY',
        recurrenceConfig: { interval: 1 },
      }),
    ).toBeNull();
  });
});
