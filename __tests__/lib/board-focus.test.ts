import { parseFocusId, expenseFocusHref, taskFocusHref } from '@/lib/navigation/board-focus';

describe('board-focus navigation', () => {
  it('parses focusId from string or array params', () => {
    expect(parseFocusId('abc')).toBe('abc');
    expect(parseFocusId(['abc', 'def'])).toBe('abc');
    expect(parseFocusId(undefined)).toBeUndefined();
    expect(parseFocusId('')).toBeUndefined();
  });

  it('builds tab hrefs with focusId', () => {
    expect(taskFocusHref('task-1')).toEqual({
      pathname: '/(tabs)/tasks',
      params: { focusId: 'task-1' },
    });
    expect(expenseFocusHref('exp-1')).toEqual({
      pathname: '/(tabs)/expenses',
      params: { focusId: 'exp-1' },
    });
  });
});
