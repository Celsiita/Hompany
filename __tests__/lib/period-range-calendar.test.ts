import {
  applyPeriodRangeSelection,
  isMineBlockedDay,
  rangeOverlapsMineBlocked,
} from '@/features/home/lib/period-range-calendar';
import type { PeriodRangeMark } from '@/features/home/lib/period-range-calendar';
import { startOfDay } from '@/features/home/lib/agenda-items';

describe('period-range-calendar', () => {
  const marks: PeriodRangeMark[] = [
    {
      start_date: '2026-09-01',
      end_date: '2026-09-05',
      tone: 'mine-absence',
    },
    {
      start_date: '2026-09-10',
      end_date: '2026-09-12',
      tone: 'absence',
    },
  ];

  it('blocks only own registered days', () => {
    expect(isMineBlockedDay(new Date(2026, 8, 3), marks)).toBe(true);
    expect(isMineBlockedDay(new Date(2026, 8, 10), marks)).toBe(false);
  });

  it('rejects selecting a blocked day', () => {
    const result = applyPeriodRangeSelection({
      date: new Date(2026, 8, 2),
      rangeStart: null,
      rangeEnd: null,
      marks,
    });
    expect(result.error).toMatch(/ya tiene un periodo/i);
    expect(result.rangeStart).toBeNull();
  });

  it('allows selecting a free day', () => {
    const result = applyPeriodRangeSelection({
      date: new Date(2026, 8, 15),
      rangeStart: null,
      rangeEnd: null,
      marks,
    });
    expect(result.error).toBeNull();
    expect(result.rangeStart).toEqual(startOfDay(new Date(2026, 8, 15)));
  });

  it('rejects ranges overlapping blocked days', () => {
    expect(
      rangeOverlapsMineBlocked(new Date(2026, 8, 4), new Date(2026, 8, 8), marks),
    ).toBe(true);
    expect(
      rangeOverlapsMineBlocked(new Date(2026, 8, 15), new Date(2026, 8, 20), marks),
    ).toBe(false);
  });
});
