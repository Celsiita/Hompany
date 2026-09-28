import { noticeEmojisOnDate, noticesOnDate } from '@/lib/home-notices';
import type { HomeNotice } from '@/schemas/home-notice.schema';

const notices: HomeNotice[] = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    home_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    kind: 'REPAIR',
    title: 'Fontanero',
    body: null,
    is_anonymous: false,
    author_id: null,
    starts_on: '2026-09-10',
    ends_on: '2026-09-12',
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    home_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    kind: 'VISIT',
    title: 'Casero',
    body: null,
    is_anonymous: false,
    author_id: null,
    starts_on: '2026-09-11',
    ends_on: '2026-09-11',
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    home_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    kind: 'RULE',
    title: 'No fumar',
    body: null,
    is_anonymous: false,
    author_id: null,
    starts_on: null,
    ends_on: null,
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: '2026-09-01T00:00:00.000Z',
  },
];

describe('home-notices calendar helpers', () => {
  it('filters notices covering a day', () => {
    const day = new Date(2026, 8, 11);
    const onDay = noticesOnDate(notices, day);
    expect(onDay.map((row) => row.kind)).toEqual(['REPAIR', 'VISIT']);
  });

  it('builds unique emoji markers per kind', () => {
    const day = new Date(2026, 8, 11);
    expect(noticeEmojisOnDate(notices, day)).toEqual([
      { key: 'notice-REPAIR', glyph: '🔧' },
      { key: 'notice-VISIT', glyph: '🚪' },
    ]);
  });
});
