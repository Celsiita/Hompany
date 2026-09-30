import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { setAppLocale } from '@/lib/i18n/locale-store';
import { translate } from '@/lib/i18n/strings';
import type { AppLocale } from '@/lib/i18n/types';

const STORAGE_KEY = 'hompany.locale';

type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => Promise<void>;
  /** Translate a dictionary key for the active locale. */
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * App-wide ES/EN strings. Persist choice and expose `t()`.
 */
export function LocaleProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<AppLocale>('es');

  useEffect(() => {
    void (async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored === 'es' || stored === 'en') {
        setLocaleState(stored);
        setAppLocale(stored);
      }
    })();
  }, []);

  const setLocale = useCallback(async (next: AppLocale) => {
    setLocaleState(next);
    setAppLocale(next);
    await AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
    }),
    [locale, setLocale, t],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/**
 * Active app locale and translator.
 */
export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return ctx;
}

export type { AppLocale };
