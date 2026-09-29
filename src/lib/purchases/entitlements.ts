import type { CustomerInfo } from 'react-native-purchases';

/** RevenueCat entitlement that unlocks HOMPANY Plus cosmetics. */
export const HOMPANY_PLUS_ENTITLEMENT = 'hompany_plus';

/**
 * Returns whether the customer currently holds the given entitlement.
 */
export function hasActiveEntitlement(
  customerInfo: CustomerInfo | null | undefined,
  entitlementId: string = HOMPANY_PLUS_ENTITLEMENT,
): boolean {
  if (!customerInfo?.entitlements?.active) {
    return false;
  }
  return typeof customerInfo.entitlements.active[entitlementId] !== 'undefined';
}
