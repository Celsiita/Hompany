import {
  formatLeaderboardTaskInfo,
  homeLeaderboardSchema,
  leaderboardInitial,
} from '@/features/home/lib/leaderboard';

describe('homeLeaderboardSchema', () => {
  it('parses a ranked member row', () => {
    const rows = homeLeaderboardSchema.parse([
      {
        user_id: '11111111-1111-1111-1111-111111111111',
        display_name: 'Ana',
        avatar_url: null,
        reputation_points: 118,
        rank: 1,
        tasks_pending: 2,
        tasks_submitted: 1,
        tasks_completed: 4,
        tasks_overdue: 0,
        task_points_earned: 40,
      },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]?.rank).toBe(1);
    expect(rows[0]?.reputation_points).toBe(118);
  });

  it('rejects out-of-range reputation', () => {
    expect(() =>
      homeLeaderboardSchema.parse([
        {
          user_id: '11111111-1111-1111-1111-111111111111',
          display_name: 'Ana',
          avatar_url: null,
          reputation_points: 2000,
          rank: 1,
          tasks_pending: 0,
          tasks_submitted: 0,
          tasks_completed: 0,
          tasks_overdue: 0,
          task_points_earned: 0,
        },
      ]),
    ).toThrow();
  });
});

describe('formatLeaderboardTaskInfo', () => {
  it('summarizes completed and pending by default', () => {
    expect(
      formatLeaderboardTaskInfo({
        tasks_completed: 1,
        tasks_pending: 2,
        tasks_submitted: 0,
        tasks_overdue: 0,
      }),
    ).toBe('1 hecha · 2 pend.');
  });

  it('includes review and overdue when present', () => {
    expect(
      formatLeaderboardTaskInfo({
        tasks_completed: 3,
        tasks_pending: 0,
        tasks_submitted: 1,
        tasks_overdue: 2,
      }),
    ).toBe('3 hechas · 0 pend. · 1 en revisión · 2 vencidas');
  });
});

describe('leaderboardInitial', () => {
  it('returns the first letter uppercased', () => {
    expect(leaderboardInitial('bruno')).toBe('B');
  });

  it('falls back for blank names', () => {
    expect(leaderboardInitial('   ')).toBe('?');
  });
});
