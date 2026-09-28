import {
  examPeriodsOnDate,
  examPeriodsOverlappingRange,
  examSilenceWarning,
  formatSilenceModeBanner,
  isUserInExamPeriodOnDate,
  shouldWarnExamSilence,
} from '@/lib/exam-periods';

describe('exam-periods', () => {
  const periods = [
    {
      user_id: 'user-b',
      start_date: '2026-06-01',
      end_date: '2026-06-15',
      label: 'Finales',
    },
  ];

  it('detects exam period on inclusive date range', () => {
    expect(isUserInExamPeriodOnDate(periods, 'user-b', new Date(2026, 5, 1))).toBe(true);
    expect(isUserInExamPeriodOnDate(periods, 'user-b', new Date(2026, 5, 15))).toBe(true);
    expect(isUserInExamPeriodOnDate(periods, 'user-b', new Date(2026, 5, 16))).toBe(false);
  });

  it('lists periods on a day and overlapping a month', () => {
    expect(examPeriodsOnDate(periods, new Date(2026, 5, 10))).toHaveLength(1);
    expect(
      examPeriodsOverlappingRange(
        periods as import('@/schemas/exam-period.schema').MemberExamPeriod[],
        new Date(2026, 5, 1),
        new Date(2026, 5, 30),
      ),
    ).toHaveLength(1);
  });

  it('formats banners and silence warnings', () => {
    expect(formatSilenceModeBanner('Finales', 'Ana')).toBe('🔇 Modo silencio: Finales · Ana');
    expect(examSilenceWarning('Ana')).toBe('Recuerda que Ana está en periodo de exámenes');
  });

  it('warns others but not self in silence mode', () => {
    const duringExams = new Date(2026, 5, 10);
    expect(
      shouldWarnExamSilence({
        actorUserId: 'user-a',
        targetUserId: 'user-b',
        periods,
        date: duringExams,
      }),
    ).toBe(true);
    expect(
      shouldWarnExamSilence({
        actorUserId: 'user-b',
        targetUserId: 'user-b',
        periods,
        date: duringExams,
      }),
    ).toBe(false);
  });
});
