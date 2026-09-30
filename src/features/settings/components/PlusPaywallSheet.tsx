import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
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

type PaywallLocale = 'es' | 'en';

const PACKAGE_ORDER = [...HOMPANY_PLUS_PACKAGES];

const COPY: Record<
  PaywallLocale,
  {
    title: string;
    body: string;
    pick: string;
    buying: string;
    close: string;
    empty: string;
    loadError: string;
    buyError: string;
    monthly: string;
    yearly: string;
    lifetime: string;
  }
> = {
  es: {
    title: 'HOMPANY Plus',
    body: 'Hecho para estudiantes: precio bajo, sin engaños. El piso sigue gratis; Plus es opcional.',
    pick: 'Elegir',
    buying: 'Comprando…',
    close: 'Cerrar',
    empty: 'No hay productos en el offering. Revisa RevenueCat (monthly / yearly / lifetime).',
    loadError: 'No se pudieron cargar los productos',
    buyError: 'No se pudo completar la compra',
    monthly: 'Mensual',
    yearly: 'Anual',
    lifetime: 'De por vida',
  },
  en: {
    title: 'HOMPANY Plus',
    body: 'Built for students: low prices, no tricks. Your flat stays free; Plus is optional.',
    pick: 'Choose',
    buying: 'Purchasing…',
    close: 'Close',
    empty: 'No products in the offering. Check RevenueCat (monthly / yearly / lifetime).',
    loadError: 'Could not load products',
    buyError: 'Purchase could not be completed',
    monthly: 'Monthly',
    yearly: 'Yearly',
    lifetime: 'Lifetime',
  },
};

function packageLabel(pkg: PurchasesPackage, locale: PaywallLocale): string {
  const copy = COPY[locale];
  const id = pkg.identifier.replace('$rc_', '');
  if (id === 'monthly' || pkg.packageType === 'MONTHLY') {
    return copy.monthly;
  }
  if (id === 'yearly' || pkg.packageType === 'ANNUAL') {
    return copy.yearly;
  }
  if (id === 'lifetime' || pkg.packageType === 'LIFETIME') {
    return copy.lifetime;
  }
  return pkg.product.title || id;
}

/**
 * In-app paywall fallback when RevenueCatUI.presentPaywall is unavailable
 * (Expo Go Preview API mode / no native paywall module).
 */
export function PlusPaywallSheet({ visible, onClose }: PlusPaywallSheetProps) {
  const [locale, setLocale] = useState<PaywallLocale>('es');
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const copy = useMemo(() => COPY[locale], [locale]);

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
            setError(COPY.es.empty);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err && typeof err === 'object' && 'message' in err
              ? String((err as PurchasesError).message)
              : COPY.es.loadError,
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
      setError(purchasesError.message ?? copy.buyError);
    } finally {
      setBuyingId(null);
    }
  }

  return (
    <BottomSheetModal visible={visible} onClose={() => onClose(false)} maxHeightClassName="max-h-[85%]">
      <View className="gap-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1 gap-1">
            <Text className="text-lg font-bold text-stone-900">{copy.title}</Text>
            <Text className="text-sm leading-5 text-stone-600">{copy.body}</Text>
          </View>
          <View className="flex-row overflow-hidden rounded-xl border border-stone-200">
            <Pressable
              onPress={() => setLocale('es')}
              className={`px-2.5 py-1.5 ${locale === 'es' ? 'bg-teal-700' : 'bg-white'}`}>
              <Text
                className={`text-xs font-bold ${locale === 'es' ? 'text-white' : 'text-stone-600'}`}>
                ES
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setLocale('en')}
              className={`px-2.5 py-1.5 ${locale === 'en' ? 'bg-teal-700' : 'bg-white'}`}>
              <Text
                className={`text-xs font-bold ${locale === 'en' ? 'text-white' : 'text-stone-600'}`}>
                EN
              </Text>
            </Pressable>
          </View>
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
                    <Text className="text-base font-bold text-stone-900">
                      {packageLabel(pkg, locale)}
                    </Text>
                    <Text className="text-base font-semibold text-teal-800">
                      {pkg.product.priceString}
                    </Text>
                  </View>
                  {pkg.product.description ? (
                    <Text className="text-xs text-stone-500">{pkg.product.description}</Text>
                  ) : null}
                  <Text className="text-xs font-semibold text-teal-700">
                    {busy ? copy.buying : copy.pick}
                  </Text>
                </SafePressable>
              );
            })
          : null}

        {error ? <Text className="text-sm text-red-600">{error}</Text> : null}

        <Button label={copy.close} variant="secondary" onPress={() => onClose(false)} />
      </View>
    </BottomSheetModal>
  );
}
