import type { CustomerInfo } from 'react-native-purchases';

/** RevenueCat entitlement for HOMPANY Plus (matching roadmap + paywall). */
export const HOMPANY_PLUS_ENTITLEMENT = 'hompany_plus';

/** Package identifiers expected in the default offering (Test Store / stores). */
export const HOMPANY_PLUS_PACKAGES = ['monthly', 'yearly', 'lifetime'] as const;

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
