import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesError,
} from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

import { PlusPaywallSheet } from '@/features/settings/components/PlusPaywallSheet';
import { getEnv } from '@/lib/env';
import {
  hasActiveEntitlement,
  HOMPANY_PLUS_ENTITLEMENT,
} from '@/lib/purchases/entitlements';
import { getAppLocale } from '@/lib/i18n/locale-store';
import { translate } from '@/lib/i18n/strings';
import { useAuth } from '@/providers/AuthProvider';

type PurchasesContextValue = {
  /** True when the active user holds `hompany_plus`. */
  isPlus: boolean;
  /** True while configuring or refreshing CustomerInfo. */
  isLoading: boolean;
  /** False when no RevenueCat API key is configured. */
  isConfigured: boolean;
  /** Latest CustomerInfo from RevenueCat, if any. */
  customerInfo: CustomerInfo | null;
  /** Opens the RevenueCat paywall, or in-app fallback on Expo Go Preview. */
  presentPaywall: () => Promise<boolean>;
  /** Opens Customer Center (manage subscription) when available. */
  presentCustomerCenter: () => Promise<void>;
  /** Restores previous purchases and refreshes Plus status. */
  restorePurchases: () => Promise<boolean>;
  /** Forces a CustomerInfo refresh. */
  refreshCustomerInfo: () => Promise<void>;
};

const PurchasesContext = createContext<PurchasesContextValue | null>(null);

function readApiKey(): string | null {
  try {
    const env = getEnv();
    const key = env.EXPO_PUBLIC_REVENUECAT_API_KEY?.trim();
    return key && key.length > 0 ? key : null;
  } catch {
    return null;
  }
}

function shouldUseFallbackPaywall(err: unknown): boolean {
  const message =
    err && typeof err === 'object' && 'message' in err
      ? String((err as { message: unknown }).message)
      : String(err ?? '');
  const lower = message.toLowerCase();
  return (
    lower.includes('preview') ||
    lower.includes('document is not available') ||
    lower.includes('browser environment') ||
    lower.includes('no effect')
  );
}

/**
 * Configures RevenueCat, syncs App User ID with Supabase auth, and exposes Plus status.
 * Without an API key the provider stays inert (`isPlus` false) so local/tests still boot.
 */
export function PurchasesProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const fallbackResolverRef = useRef<((ok: boolean) => void) | null>(null);

  const refreshCustomerInfo = useCallback(async () => {
    if (!isConfigured) {
      setCustomerInfo(null);
      return;
    }
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
    } catch {
      setCustomerInfo(null);
    }
  }, [isConfigured]);

  useEffect(() => {
    let cancelled = false;
    const apiKey = readApiKey();

    async function configure() {
      if (!apiKey) {
        if (!cancelled) {
          setIsConfigured(false);
          setIsLoading(false);
        }
        return;
      }

      try {
        if (__DEV__) {
          Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        }
        Purchases.configure({ apiKey });
        if (!cancelled) {
          setIsConfigured(true);
        }
      } catch (err) {
        console.warn('[Purchases] configure failed', err);
        if (!cancelled) {
          setIsConfigured(false);
          setIsLoading(false);
        }
      }
    }

    void configure();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isConfigured) {
      return;
    }

    let cancelled = false;

    async function syncUser() {
      setIsLoading(true);
      try {
        if (user?.id) {
          const { customerInfo: info } = await Purchases.logIn(user.id);
          if (!cancelled) {
            setCustomerInfo(info);
          }
        } else {
          await Purchases.logOut();
          if (!cancelled) {
            setCustomerInfo(null);
          }
        }
      } catch {
        if (!cancelled) {
          await refreshCustomerInfo();
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void syncUser();
    return () => {
      cancelled = true;
    };
  }, [isConfigured, user?.id, refreshCustomerInfo]);

  useEffect(() => {
    if (!isConfigured) {
      return;
    }
    const listener = (info: CustomerInfo) => {
      setCustomerInfo(info);
    };
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [isConfigured]);

  const openFallbackPaywall = useCallback(() => {
    return new Promise<boolean>((resolve) => {
      fallbackResolverRef.current = resolve;
      setFallbackOpen(true);
    });
  }, []);

  const handleFallbackClose = useCallback(
    (purchased: boolean) => {
      setFallbackOpen(false);
      void refreshCustomerInfo();
      const resolve = fallbackResolverRef.current;
      fallbackResolverRef.current = null;
      resolve?.(purchased);
    },
    [refreshCustomerInfo],
  );

  const presentPaywall = useCallback(async () => {
    if (!isConfigured) {
      Alert.alert('HOMPANY Plus', translate(getAppLocale(), 'purchases.notConfigured'));
      return false;
    }

    try {
      const result = await RevenueCatUI.presentPaywall({
        displayCloseButton: true,
      });
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      if (
        result === PAYWALL_RESULT.NOT_PRESENTED ||
        result === PAYWALL_RESULT.ERROR
      ) {
        return openFallbackPaywall();
      }
      return (
        result === PAYWALL_RESULT.PURCHASED ||
        result === PAYWALL_RESULT.RESTORED ||
        hasActiveEntitlement(info)
      );
    } catch (err) {
      if (shouldUseFallbackPaywall(err)) {
        return openFallbackPaywall();
      }
      // Expo Go Preview often throws "document is not available".
      return openFallbackPaywall();
    }
  }, [isConfigured, openFallbackPaywall]);

  const presentCustomerCenter = useCallback(async () => {
    if (!isConfigured) {
      Alert.alert('HOMPANY Plus', translate(getAppLocale(), 'purchases.notConfigured'));
      return;
    }
    try {
      await RevenueCatUI.presentCustomerCenter();
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
    } catch (err) {
      if (shouldUseFallbackPaywall(err)) {
        Alert.alert(
          'HOMPANY Plus',
          'El centro de suscripción nativo no está disponible en Expo Go. Usa Restaurar compras o un development build.',
        );
        return;
      }
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as PurchasesError).message)
          : translate(getAppLocale(), 'purchases.centerFail');
      Alert.alert('HOMPANY Plus', message);
    }
  }, [isConfigured]);

  const restorePurchases = useCallback(async () => {
    if (!isConfigured) {
      Alert.alert('HOMPANY Plus', translate(getAppLocale(), 'purchases.notConfigured'));
      return false;
    }
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      const ok = hasActiveEntitlement(info);
      if (!ok) {
        Alert.alert('HOMPANY Plus', translate(getAppLocale(), 'purchases.noPrevious'));
      }
      return ok;
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as PurchasesError).message)
          : translate(getAppLocale(), 'purchases.restoreFail');
      Alert.alert('HOMPANY Plus', message);
      return false;
    }
  }, [isConfigured]);

  const isPlus = hasActiveEntitlement(customerInfo, HOMPANY_PLUS_ENTITLEMENT);

  const value = useMemo<PurchasesContextValue>(
    () => ({
      isPlus,
      isLoading,
      isConfigured,
      customerInfo,
      presentPaywall,
      presentCustomerCenter,
      restorePurchases,
      refreshCustomerInfo,
    }),
    [
      isPlus,
      isLoading,
      isConfigured,
      customerInfo,
      presentPaywall,
      presentCustomerCenter,
      restorePurchases,
      refreshCustomerInfo,
    ],
  );

  return (
    <PurchasesContext.Provider value={value}>
      {children}
      <PlusPaywallSheet visible={fallbackOpen} onClose={handleFallbackClose} />
    </PurchasesContext.Provider>
  );
}

/**
 * Plus / paywall helpers. Must be used within PurchasesProvider.
 */
export function usePurchases(): PurchasesContextValue {
  const context = useContext(PurchasesContext);
  if (!context) {
    throw new Error('usePurchases must be used within PurchasesProvider');
  }
  return context;
}

/**
 * Human-readable store label for debug UI.
 */
export function purchasesPlatformLabel(): string {
  if (Platform.OS === 'ios') {
    return 'App Store / Test Store';
  }
  if (Platform.OS === 'android') {
    return 'Play Store / Test Store';
  }
  return Platform.OS;
}
