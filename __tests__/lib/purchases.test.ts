import {
  hasActiveEntitlement,
  HOMPANY_PLUS_ENTITLEMENT,
} from '@/lib/purchases/entitlements';
import { iconPackRequiresPlus } from '@/lib/purchases/plus-packs';
import type { CustomerInfo } from 'react-native-purchases';

function makeInfo(activeKeys: string[]): CustomerInfo {
  const active: Record<string, object> = {};
  for (const key of activeKeys) {
    active[key] = { identifier: key };
  }
  return {
    entitlements: { active, all: active, verification: 'NOT_REQUESTED' },
  } as unknown as CustomerInfo;
}

describe('hasActiveEntitlement', () => {
  it('is false for null or empty entitlements', () => {
    expect(hasActiveEntitlement(null)).toBe(false);
    expect(hasActiveEntitlement(makeInfo([]))).toBe(false);
  });

  it('detects hompany_plus by default', () => {
    expect(hasActiveEntitlement(makeInfo([HOMPANY_PLUS_ENTITLEMENT]))).toBe(true);
    expect(hasActiveEntitlement(makeInfo(['other']))).toBe(false);
  });
});

describe('iconPackRequiresPlus', () => {
  it('keeps classic free and locks cozy/playful/custom', () => {
    expect(iconPackRequiresPlus('classic')).toBe(false);
    expect(iconPackRequiresPlus('cozy')).toBe(false);
    expect(iconPackRequiresPlus('playful')).toBe(false);
    expect(iconPackRequiresPlus('custom:abc')).toBe(false);
  });
});
