import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import Purchases, {
  type PurchasesPackage,
  type PurchasesError,
} from 'react-native-purchases';

import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import { Button } from '@/components/ui/Button';
import { SafePressable } from '@/components/ui/SafePressable';
import { mergeStyles, interactive, palette } from '@/lib/interactive-styles';
import { formatProductPrice } from '@/lib/i18n/format-price';
import {
  hasActiveEntitlement,
  HOMPANY_PLUS_ENTITLEMENT,
  HOMPANY_PLUS_PACKAGES,
} from '@/lib/purchases/entitlements';
import { useLocale } from '@/providers/LocaleProvider';

type PlusPaywallSheetProps = {
  visible: boolean;
  onClose: (purchased: boolean) => void;
};

const PACKAGE_ORDER = [...HOMPANY_PLUS_PACKAGES];

function packageKind(pkg: PurchasesPackage): 'monthly' | 'yearly' | 'lifetime' | 'other' {
  const id = pkg.identifier.replace('$rc_', '');
  if (id === 'monthly' || pkg.packageType === 'MONTHLY') {
    return 'monthly';
  }
  if (id === 'yearly' || pkg.packageType === 'ANNUAL') {
    return 'yearly';
  }
  if (id === 'lifetime' || pkg.packageType === 'LIFETIME') {
    return 'lifetime';
  }
  return 'other';
}

/**
 * In-app paywall fallback when RevenueCatUI.presentPaywall is unavailable
 * (Expo Go Preview API mode / no native paywall module).
 */
export function PlusPaywallSheet({ visible, onClose }: PlusPaywallSheetProps) {
  const { t, locale } = useLocale();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      return;
    }
    let cancelled = false;
    setError(null);
    setLoading(true);
    void (async () => {
      try {
        const offerings = await Purchases.getOfferings();
        const current = offerings.current ?? Object.values(offerings.all)[0];
        const available = current?.availablePackages ?? [];
        const sorted = [...available].sort((a, b) => {
          const ai = PACKAGE_ORDER.indexOf(
            a.identifier.replace('$rc_', '') as (typeof PACKAGE_ORDER)[number],
          );
          const bi = PACKAGE_ORDER.indexOf(
            b.identifier.replace('$rc_', '') as (typeof PACKAGE_ORDER)[number],
          );
          const ax = ai === -1 ? 99 : ai;
          const bx = bi === -1 ? 99 : bi;
          return ax - bx;
        });
        if (!cancelled) {
          setPackages(sorted);
          if (sorted.length === 0) {
            setError(t('paywall.empty'));
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err && typeof err === 'object' && 'message' in err
              ? String((err as PurchasesError).message)
              : t('paywall.empty'),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, t]);

  async function handleBuy(pkg: PurchasesPackage) {
    setBuyingId(pkg.identifier);
    setError(null);
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const ok = hasActiveEntitlement(customerInfo, HOMPANY_PLUS_ENTITLEMENT);
      onClose(ok);
    } catch (err) {
      const purchasesError = err as PurchasesError & { userCancelled?: boolean };
      if (purchasesError.userCancelled) {
        return;
      }
      setError(purchasesError.message ?? t('paywall.empty'));
    } finally {
      setBuyingId(null);
    }
  }

  function labelFor(pkg: PurchasesPackage): string {
    const kind = packageKind(pkg);
    if (kind === 'monthly') {
      return t('paywall.monthly');
    }
    if (kind === 'yearly') {
      return t('paywall.yearly');
    }
    if (kind === 'lifetime') {
      return t('paywall.lifetime');
    }
    return pkg.product.title || pkg.identifier;
  }

  return (
    <BottomSheetModal visible={visible} onClose={() => onClose(false)} maxHeightClassName="max-h-[85%]">
      <View className="gap-4">
        <View className="gap-1">
          <Text className="text-lg font-bold text-stone-900">{t('paywall.title')}</Text>
          <Text className="text-sm leading-5 text-stone-600">{t('paywall.body')}</Text>
        </View>

        {loading ? (
          <View className="items-center py-6">
            <ActivityIndicator color={palette.brand} />
          </View>
        ) : null}

        {!loading
          ? packages.map((pkg) => {
              const busy = buyingId === pkg.identifier;
              return (
                <SafePressable
                  key={pkg.identifier}
                  disabled={Boolean(buyingId)}
                  onPress={() => void handleBuy(pkg)}
                  contentStyle={mergeStyles(interactive.borderedCard, {
                    opacity: buyingId && !busy ? 0.5 : 1,
                    gap: 4,
                  })}>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-base font-bold text-stone-900">{labelFor(pkg)}</Text>
                    <Text className="text-base font-semibold text-teal-800">
                      {formatProductPrice(pkg.product, locale)}
                    </Text>
                  </View>
                  <Text className="text-xs font-semibold text-teal-700">
                    {busy ? t('paywall.buying') : t('paywall.pick')}
                  </Text>
                </SafePressable>
              );
            })
          : null}

        {error ? <Text className="text-sm text-red-600">{error}</Text> : null}

        <Button label={t('paywall.close')} variant="secondary" onPress={() => onClose(false)} />
      </View>
    </BottomSheetModal>
  );
}
