import { isPeriodActiveOrUpcoming, toDateKey } from '@/lib/absences';

describe('isPeriodActiveOrUpcoming', () => {
  it('treats null end as still relevant', () => {
    expect(isPeriodActiveOrUpcoming(null, '2026-09-30')).toBe(true);
  });

  it('includes today and future ends, excludes past ends', () => {
    expect(isPeriodActiveOrUpcoming('2026-09-30', '2026-09-30')).toBe(true);
    expect(isPeriodActiveOrUpcoming('2026-10-02', '2026-09-30')).toBe(true);
    expect(isPeriodActiveOrUpcoming('2026-09-29', '2026-09-30')).toBe(false);
  });

  it('defaults today via toDateKey', () => {
    const today = toDateKey(new Date());
    expect(isPeriodActiveOrUpcoming(today)).toBe(true);
  });
});
