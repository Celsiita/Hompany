import {
  TUTORIAL_COMPLETED_KEY,
  TUTORIAL_STEPS,
} from '@/lib/tutorial';

describe('tutorial', () => {
  it('covers the main app surfaces with interactive CTAs', () => {
    const ids = TUTORIAL_STEPS.map((step) => step.id);
    expect(ids).toEqual([
      'welcome',
      'feed',
      'bell',
      'agenda',
      'piso',
      'tasks',
      'expenses',
      'settings',
    ]);
    expect(TUTORIAL_STEPS[0]?.title).toMatch(/Mico/);
    expect(TUTORIAL_STEPS.every((step) => step.cta.length > 0)).toBe(true);
    expect(TUTORIAL_STEPS.some((step) => step.homeSection === 'AGENDA')).toBe(true);
    expect(TUTORIAL_STEPS.some((step) => step.goTab === '/(tabs)/tasks')).toBe(true);
  });

  it('uses a stable AsyncStorage key for v2 interactive tour', () => {
    expect(TUTORIAL_COMPLETED_KEY).toBe('hompany.tutorial.completed.v2');
  });
});
