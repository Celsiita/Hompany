import { toggleChipFilter } from '@/lib/filters';

describe('toggleChipFilter', () => {
  it('selects a chip and clears it when pressed again', () => {
    expect(toggleChipFilter('ALL', 'GROCERY')).toBe('GROCERY');
    expect(toggleChipFilter('GROCERY', 'GROCERY')).toBe('ALL');
    expect(toggleChipFilter('GROCERY', 'HOUSE')).toBe('HOUSE');
  });
});
