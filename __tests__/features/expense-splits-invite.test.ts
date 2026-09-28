import {
  amountsSumToTotal,
  percentsSumToHundred,
  splitAmountByPercents,
  splitAmountEvenly,
} from '@/features/expenses/lib/expense-balances';
import { homeInviteUrl, parseInviteCodeFromUrl } from '@/lib/home-invite';

describe('expense split helpers', () => {
  it('splits evenly with cents remainder', () => {
    expect(splitAmountEvenly(10, 3)).toEqual([3.34, 3.33, 3.33]);
  });

  it('splits by percents to exact total', () => {
    expect(percentsSumToHundred([50, 30, 20])).toBe(true);
    expect(percentsSumToHundred([40, 40, 19])).toBe(false);
    const parts = splitAmountByPercents(100, [50, 30, 20]);
    expect(parts.reduce((sum, value) => sum + value, 0)).toBeCloseTo(100, 2);
  });

  it('validates fixed amounts against total', () => {
    expect(amountsSumToTotal([10, 5.5, 4.5], 20)).toBe(true);
    expect(amountsSumToTotal([10, 5], 20)).toBe(false);
  });
});

describe('home invite helpers', () => {
  it('builds and parses invite deep links', () => {
    const url = homeInviteUrl('demo2026');
    expect(url).toContain('hompany://join?code=DEMO2026');
    expect(parseInviteCodeFromUrl(url)).toBe('DEMO2026');
  });
});
