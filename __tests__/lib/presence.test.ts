import {
  formatYearMonthKey,
  hasConfiguredPresence,
  isUserOnSystemLeaveRow,
  isUserPresentOnDate,
  isUserSystemFrozen,
  lastDateKeyOfMonth,
  punctualAbsenceTaskWarning,
  toYearMonthKey,
  upcomingYearMonthKeys,
} from '@/lib/presence';

describe('presence helpers', () => {
  it('builds year-month keys from dates', () => {
    expect(toYearMonthKey(new Date(2026, 8, 15))).toBe('2026-09-01');
    expect(formatYearMonthKey('2026-09-01')).toMatch(/2026/);
    expect(lastDateKeyOfMonth('2026-09-01')).toBe('2026-09-30');
  });

  it('lists upcoming months', () => {
    const keys = upcomingYearMonthKeys(new Date(2026, 0, 10), 3);
    expect(keys).toEqual(['2026-01-01', '2026-02-01', '2026-03-01']);
  });

  it('treats empty presence as present (not configured)', () => {
    expect(hasConfiguredPresence([], 'u1')).toBe(false);
    expect(isUserPresentOnDate([], 'u1', new Date(2026, 5, 1))).toBe(true);
  });

  it('ignores stay periods for system freeze (estancia removed)', () => {
    const periods = [{ user_id: 'u1', start_date: '2026-01-01', end_date: '2026-01-31' }];
    expect(isUserPresentOnDate(periods, 'u1', new Date(2026, 0, 15))).toBe(true);
    expect(isUserPresentOnDate(periods, 'u1', new Date(2026, 1, 1))).toBe(false);
    expect(
      isUserSystemFrozen({
        leaves: [],
        presencePeriods: periods,
        userId: 'u1',
        date: new Date(2026, 1, 1),
      }),
    ).toBe(false);
  });

  it('freezes only from system leave rows', () => {
    expect(
      isUserSystemFrozen({
        leaves: [{ user_id: 'u1', kind: 'INDEFINITE', start_date: '2026-01-01', end_date: null }],
        userId: 'u1',
        date: new Date(2026, 5, 1),
      }),
    ).toBe(true);
  });

  it('detects indefinite and planned system leaves', () => {
    expect(
      isUserOnSystemLeaveRow(
        [{ user_id: 'u1', kind: 'INDEFINITE', start_date: '2026-01-01', end_date: null }],
        'u1',
        new Date(2026, 5, 1),
      ),
    ).toBe(true);
    expect(
      isUserOnSystemLeaveRow(
        [{ user_id: 'u1', kind: 'PLANNED', start_date: '2026-03-01', end_date: '2026-03-10' }],
        'u1',
        new Date(2026, 2, 15),
      ),
    ).toBe(false);
  });

  it('builds punctual absence task warning copy', () => {
    expect(punctualAbsenceTaskWarning(0)).toBe('');
    expect(punctualAbsenceTaskWarning(1)).toContain('1 tarea');
    expect(punctualAbsenceTaskWarning(3)).toContain('3 tareas');
  });
});
