import { resolveActiveHomeId } from '@/providers/HomeProvider';
import type { Home } from '@/types/database.types';

const homeA: Home = {
  id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  name: 'Piso A',
  invite_code: 'CODEAAAA',
  created_by: '11111111-1111-1111-1111-111111111111',
  created_at: '2026-08-16T00:00:00.000Z',
  updated_at: '2026-08-16T00:00:00.000Z',
  wifi_ssid: null,
  wifi_password: null,
  portal_code: null,
  bin_day: null,
  notes: null,
  proof_mode: 'OPTIONAL',
  proof_capture: 'CAMERA_OR_GALLERY',
};

const homeB: Home = {
  ...homeA,
  id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  name: 'Piso B',
  invite_code: 'CODEBBBB',
};

describe('resolveActiveHomeId', () => {
  it('returns null when there are no homes', () => {
    expect(resolveActiveHomeId([], null)).toBeNull();
  });

  it('prefers a stored home that is still a membership', () => {
    expect(resolveActiveHomeId([homeA, homeB], homeB.id)).toBe(homeB.id);
  });

  it('falls back to the first home when stored id is missing', () => {
    expect(resolveActiveHomeId([homeA, homeB], null)).toBe(homeA.id);
  });
});
