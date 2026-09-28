import { homeHasPracticalInfo } from '@/features/home/components/HomeInfoCard';
import type { Home } from '@/types/database.types';

function makeHome(overrides: Partial<Home> = {}): Home {
  return {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'Piso Demo',
    invite_code: 'DEMO2026',
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
    ...overrides,
  };
}

describe('homeHasPracticalInfo', () => {
  it('is false when empty', () => {
    expect(homeHasPracticalInfo(makeHome())).toBe(false);
    expect(homeHasPracticalInfo(null)).toBe(false);
  });

  it('is true when any field is filled', () => {
    expect(homeHasPracticalInfo(makeHome({ wifi_ssid: 'PisoFibra' }))).toBe(true);
    expect(homeHasPracticalInfo(makeHome({ portal_code: '1234#' }))).toBe(true);
  });
});
