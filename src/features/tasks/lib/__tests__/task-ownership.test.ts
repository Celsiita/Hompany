import { taskOwnershipLabel } from '@/features/tasks/lib/task-ownership';

describe('taskOwnershipLabel', () => {
  it('returns null without viewer', () => {
    expect(taskOwnershipLabel(['a'], null)).toBeNull();
  });

  it('labels own tasks', () => {
    expect(taskOwnershipLabel(['a', 'b'], 'a')).toBe('Tuya');
  });

  it('labels peer tasks', () => {
    expect(taskOwnershipLabel(['a'], 'b')).toBe('Compañero');
  });
});
