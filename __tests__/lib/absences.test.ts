import {
  absentMemberWarning,
  areAllMembersAbsent,
  filterAvailableMemberIds,
  formatDateKey,
  isUserAbsentOnDate,
  pickNextAvailableAssignee,
  toDateKey,
} from '@/lib/absences';

describe('absences', () => {
  const absences = [
    {
      user_id: 'user-b',
      start_date: '2026-08-20',
      end_date: '2026-08-25',
    },
  ];

  it('detects absence on inclusive date range', () => {
    expect(isUserAbsentOnDate(absences, 'user-b', new Date(2026, 7, 19))).toBe(false);
    expect(isUserAbsentOnDate(absences, 'user-b', new Date(2026, 7, 20))).toBe(true);
    expect(isUserAbsentOnDate(absences, 'user-b', new Date(2026, 7, 25))).toBe(true);
    expect(isUserAbsentOnDate(absences, 'user-b', new Date(2026, 7, 26))).toBe(false);
    expect(isUserAbsentOnDate(absences, 'user-a', new Date(2026, 7, 22))).toBe(false);
  });

  it('skips absent members in round-robin rotation', () => {
    const pool = ['user-a', 'user-b', 'user-c'];
    const due = new Date(2026, 7, 22);
    expect(pickNextAvailableAssignee(pool, 'user-a', absences, due)).toBe('user-c');
    expect(pickNextAvailableAssignee(pool, 'user-c', absences, due)).toBe('user-a');
  });

  it('returns null when everyone is absent', () => {
    const pool = ['user-b'];
    expect(
      areAllMembersAbsent(pool, absences, new Date(2026, 7, 22)),
    ).toBe(true);
    expect(
      pickNextAvailableAssignee(pool, null, absences, new Date(2026, 7, 22)),
    ).toBeNull();
    expect(filterAvailableMemberIds(pool, absences, new Date(2026, 7, 22))).toEqual([]);
  });

  it('formats warnings and date keys', () => {
    expect(absentMemberWarning('Ana')).toBe('⚠️ Ana estará ausente en esta fecha');
    expect(toDateKey(new Date(2026, 7, 5))).toBe('2026-08-05');
    expect(formatDateKey('2026-08-05')).toMatch(/5/);
  });
});
