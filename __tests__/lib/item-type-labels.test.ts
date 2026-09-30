import { resolveExpenseTypeLabel, resolveTaskTypeLabel } from '@/lib/item-type-labels';
import { recurrenceLabel } from '@/lib/recurrence';
import type { HomeItemType } from '@/schemas/item-type.schema';

const TYPES: HomeItemType[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    home_id: '22222222-2222-2222-2222-222222222222',
    domain: 'task',
    name: 'Cocina',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    home_id: '22222222-2222-2222-2222-222222222222',
    domain: 'expense',
    name: 'Netflix',
    created_at: '2026-01-01T00:00:00.000Z',
  },
];

describe('item-type-labels', () => {
  it('prefers custom task type name over built-in category', () => {
    expect(
      resolveTaskTypeLabel({
        category: 'QUICK',
        itemTypeId: TYPES[0].id,
        itemTypes: TYPES,
      }),
    ).toBe('Cocina');
  });

  it('falls back to built-in task category', () => {
    expect(
      resolveTaskTypeLabel({
        category: 'QUICK',
        itemTypeId: null,
        itemTypes: TYPES,
      }),
    ).toBe('Tareas Rápidas');
  });

  it('prefers custom expense type name over built-in kind', () => {
    expect(
      resolveExpenseTypeLabel({
        kind: 'GROCERY',
        itemTypeId: TYPES[1].id,
        itemTypes: TYPES,
      }),
    ).toBe('Netflix');
  });
});

describe('recurrenceLabel with interval', () => {
  it('shows Semanal for weekly interval 1', () => {
    expect(recurrenceLabel('WEEKLY', { interval: 1 })).toBe('Semanal');
  });

  it('shows Cada 2 semanas for weekly interval 2', () => {
    expect(recurrenceLabel('WEEKLY', { interval: 2 })).toBe('Cada 2 semanas');
  });
});
