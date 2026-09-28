import {
  TUTORIAL_COMPLETED_KEY,
  TUTORIAL_STEPS,
} from '@/lib/tutorial';

describe('tutorial', () => {
  it('covers the main app surfaces', () => {
    const ids = TUTORIAL_STEPS.map((step) => step.id);
    expect(ids).toEqual(['welcome', 'feed', 'agenda', 'tasks', 'expenses', 'settings']);
    expect(TUTORIAL_STEPS[0]?.title).toMatch(/Mico/);
  });

  it('uses a stable AsyncStorage key', () => {
    expect(TUTORIAL_COMPLETED_KEY).toBe('hompany.tutorial.completed.v1');
  });
});
