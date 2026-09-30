import type { AppLocale } from '@/lib/i18n/types';

let currentLocale: AppLocale = 'es';
const listeners = new Set<(locale: AppLocale) => void>();

/**
 * Sync locale for non-React modules (mascot, tutorial helpers).
 */
export function getAppLocale(): AppLocale {
  return currentLocale;
}

/**
 * Updates the process-wide locale and notifies subscribers.
 */
export function setAppLocale(locale: AppLocale): void {
  currentLocale = locale;
  listeners.forEach((listener) => listener(locale));
}

/**
 * Subscribe to locale changes (e.g. remount tips).
 */
export function subscribeAppLocale(listener: (locale: AppLocale) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
