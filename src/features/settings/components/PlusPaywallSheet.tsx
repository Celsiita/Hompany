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
import {
  hasActiveEntitlement,
  HOMPANY_PLUS_ENTITLEMENT,
  HOMPANY_PLUS_PACKAGES,
} from '@/lib/purchases/entitlements';

type PlusPaywallSheetProps = {
  visible: boolean;
  onClose: (purchased: boolean) => void;
};

const PACKAGE_ORDER = [...HOMPANY_PLUS_PACKAGES];

function packageLabel(pkg: PurchasesPackage): string {
  const id = pkg.identifier.replace('$rc_', '');
  if (id === 'monthly' || pkg.packageType === 'MONTHLY') {
    return 'Mensual';
  }
  if (id === 'yearly' || pkg.packageType === 'ANNUAL') {
    return 'Anual';
  }
  if (id === 'lifetime' || pkg.packageType === 'LIFETIME') {
    return 'De por vida';
  }
  return pkg.product.title || id;
}

/**
 * In-app paywall fallback when RevenueCatUI.presentPaywall is unavailable
 * (Expo Go Preview API mode / no native paywall module).
 */
export function PlusPaywallSheet({ visible, onClose }: PlusPaywallSheetProps) {
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
            setError('No hay productos en el offering. Revisa RevenueCat (monthly / yearly / lifetime).');
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err && typeof err === 'object' && 'message' in err
              ? String((err as PurchasesError).message)
              : 'No se pudieron cargar los productos',
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
  }, [visible]);

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
      setError(
        purchasesError.message ?? 'No se pudo completar la compra',
      );
    } finally {
      setBuyingId(null);
    }
  }

  return (
    <BottomSheetModal visible={visible} onClose={() => onClose(false)} maxHeightClassName="max-h-[85%]">
      <View className="gap-4">
        <View className="gap-1">
          <Text className="text-lg font-bold text-stone-900">HOMPANY Plus</Text>
          <Text className="text-sm leading-5 text-stone-600">
            Desbloquea el plan Plus. En Expo Go usamos este paywall (Preview); en un development
            build verás el de RevenueCat.
          </Text>
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
                    <Text className="text-base font-bold text-stone-900">{packageLabel(pkg)}</Text>
                    <Text className="text-base font-semibold text-teal-800">
                      {pkg.product.priceString}
                    </Text>
                  </View>
                  {pkg.product.description ? (
                    <Text className="text-xs text-stone-500">{pkg.product.description}</Text>
                  ) : null}
                  <Text className="text-xs font-semibold text-teal-700">
                    {busy ? 'Comprando…' : 'Elegir'}
                  </Text>
                </SafePressable>
              );
            })
          : null}

        {error ? <Text className="text-sm text-red-600">{error}</Text> : null}

        <Button label="Cerrar" variant="secondary" onPress={() => onClose(false)} />
      </View>
    </BottomSheetModal>
  );
}
