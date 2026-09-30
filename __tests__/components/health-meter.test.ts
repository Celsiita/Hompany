import { formatHealthDetailLine } from '@/components/ui/HealthMeter';

describe('formatHealthDetailLine', () => {
  it('prefers overdue over pending', () => {
    expect(formatHealthDetailLine({ overdue: 2, pending: 5 })).toBe('2 vencidas');
    expect(formatHealthDetailLine({ overdue: 1, pending: 0 })).toBe('1 vencida');
  });

  it('falls back to pending, then clear status', () => {
    expect(formatHealthDetailLine({ overdue: 0, pending: 3 })).toBe('3 pendientes');
    expect(formatHealthDetailLine({ overdue: 0, pending: 1 })).toBe('1 pendiente');
    expect(formatHealthDetailLine({ overdue: 0, pending: 0 })).toBe('Sin vencidas');
  });
});
