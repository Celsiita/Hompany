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

export type AppLocale = 'es' | 'en';

const STORAGE_KEY = 'hompany.locale';

type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => Promise<void>;
  /** Translate a dictionary key for the active locale. */
  t: (key: string) => string;
};

const STRINGS: Record<AppLocale, Record<string, string>> = {
  es: {
    'tabs.home': 'Inicio',
    'tabs.piso': 'Piso',
    'tabs.tasks': 'Tareas',
    'tabs.expenses': 'Gastos',
    'tabs.settings': 'Ajustes',
    'auth.tagline': 'Deja de discutir por fregar y por el súper.',
    'auth.login': 'Entrar',
    'auth.register': 'Crear cuenta',
    'auth.email': 'Email',
    'auth.password': 'Contraseña',
    'settings.title': 'Ajustes',
    'settings.language': 'Idioma',
    'settings.language.subtitle': 'Español o English en toda la app',
    'settings.plus': 'HOMPANY Plus',
    'settings.plus.see': 'Ver HOMPANY Plus',
    'settings.plus.restore': 'Restaurar compras',
    'settings.plus.manage': 'Gestionar suscripción',
    'settings.plus.free': 'Plan gratuito',
    'settings.plus.active': 'Activo',
    'paywall.title': 'HOMPANY Plus',
    'paywall.body': 'Hecho para estudiantes. El piso sigue gratis; Plus es opcional.',
    'paywall.pick': 'Elegir',
    'paywall.buying': 'Comprando…',
    'paywall.close': 'Cerrar',
    'paywall.monthly': 'Mensual',
    'paywall.yearly': 'Anual',
    'paywall.lifetime': 'De por vida',
    'paywall.empty': 'No hay productos. Revisa RevenueCat.',
    'screen.feed': 'Menos discusiones · más claridad',
    'screen.agenda': 'Qué toca esta semana, de un vistazo',
    'screen.piso': 'Silencio, ausencias y datos del hogar',
    'screen.tasks': 'Foto y listo · sin pelear por fregar',
    'screen.expenses': 'Quién debe a quién · sin drama',
    'screen.settings': 'Piso, Plus e iconos',
  },
  en: {
    'tabs.home': 'Home',
    'tabs.piso': 'Flat',
    'tabs.tasks': 'Tasks',
    'tabs.expenses': 'Expenses',
    'tabs.settings': 'Settings',
    'auth.tagline': 'Stop fighting over chores and money.',
    'auth.login': 'Sign in',
    'auth.register': 'Create account',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.language.subtitle': 'Spanish or English across the app',
    'settings.plus': 'HOMPANY Plus',
    'settings.plus.see': 'View HOMPANY Plus',
    'settings.plus.restore': 'Restore purchases',
    'settings.plus.manage': 'Manage subscription',
    'settings.plus.free': 'Free plan',
    'settings.plus.active': 'Active',
    'paywall.title': 'HOMPANY Plus',
    'paywall.body': 'Built for students. Your flat stays free; Plus is optional.',
    'paywall.pick': 'Choose',
    'paywall.buying': 'Purchasing…',
    'paywall.close': 'Close',
    'paywall.monthly': 'Monthly',
    'paywall.yearly': 'Yearly',
    'paywall.lifetime': 'Lifetime',
    'paywall.empty': 'No products. Check RevenueCat.',
    'screen.feed': 'Fewer arguments · more clarity',
    'screen.agenda': 'What is due this week at a glance',
    'screen.piso': 'Quiet time, absences and flat info',
    'screen.tasks': 'Photo and done · no chore fights',
    'screen.expenses': 'Who owes whom · no drama',
    'screen.settings': 'Flat, Plus and icons',
  },
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
      }
    })();
  }, []);

  const setLocale = useCallback(async (next: AppLocale) => {
    setLocaleState(next);
    await AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (key: string) => STRINGS[locale][key] ?? STRINGS.es[key] ?? key,
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
