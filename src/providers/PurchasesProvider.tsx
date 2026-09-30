import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Alert, Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesError,
} from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

import { getEnv } from '@/lib/env';
import {
  hasActiveEntitlement,
  HOMPANY_PLUS_ENTITLEMENT,
} from '@/lib/purchases/entitlements';
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
  /** Opens the RevenueCat paywall (or a fallback alert). */
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

/**
 * Configures RevenueCat, syncs App User ID with Supabase auth, and exposes Plus status.
 * Without an API key the provider stays inert (`isPlus` false) so local/tests still boot.
 */
export function PurchasesProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);

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

  const presentPaywall = useCallback(async () => {
    if (!isConfigured) {
      Alert.alert(
        'HOMPANY Plus',
        'Las compras no están configuradas en este dispositivo. El resto de la app sigue disponible.',
      );
      return false;
    }

    try {
      const result = await RevenueCatUI.presentPaywall({
        displayCloseButton: true,
      });
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      return (
        result === PAYWALL_RESULT.PURCHASED ||
        result === PAYWALL_RESULT.RESTORED ||
        hasActiveEntitlement(info)
      );
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as PurchasesError).message)
          : 'No se pudo abrir el paywall';
      Alert.alert('HOMPANY Plus', message);
      return false;
    }
  }, [isConfigured]);

  const presentCustomerCenter = useCallback(async () => {
    if (!isConfigured) {
      Alert.alert('HOMPANY Plus', 'Las compras no están configuradas en este dispositivo.');
      return;
    }
    try {
      await RevenueCatUI.presentCustomerCenter();
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as PurchasesError).message)
          : 'No se pudo abrir el centro de cliente';
      Alert.alert('HOMPANY Plus', message);
    }
  }, [isConfigured]);

  const restorePurchases = useCallback(async () => {
    if (!isConfigured) {
      Alert.alert('HOMPANY Plus', 'Las compras no están configuradas en este dispositivo.');
      return false;
    }
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      const ok = hasActiveEntitlement(info);
      if (!ok) {
        Alert.alert('HOMPANY Plus', 'No se encontraron compras anteriores.');
      }
      return ok;
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as PurchasesError).message)
          : 'No se pudieron restaurar las compras';
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
    <PurchasesContext.Provider value={value}>{children}</PurchasesContext.Provider>
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
