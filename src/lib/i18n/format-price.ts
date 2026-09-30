import type { AppLocale } from '@/lib/i18n/types';
import { getAppLocale } from '@/lib/i18n/locale-store';

type PricedProduct = {
  price: number;
  priceString: string;
  currencyCode?: string;
};

/**
 * Formats a store product price for the active (or given) app locale.
 * Spanish UI always shows euros; English shows USD unless the product is already EUR.
 */
export function formatProductPrice(product: PricedProduct, locale: AppLocale = getAppLocale()): string {
  const amount = Number.isFinite(product.price) ? product.price : 0;
  if (locale === 'es') {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(amount);
  }
  const currency =
    product.currencyCode && product.currencyCode.length === 3
      ? product.currencyCode
      : 'USD';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats a money amount for expenses / balances.
 * Spanish → EUR; English → USD.
 */
export function formatMoney(amount: number, locale: AppLocale = getAppLocale()): string {
  const absolute = Math.abs(amount);
  if (locale === 'es') {
    const [integerPart, decimalPart] = absolute.toFixed(2).split('.');
    const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${grouped},${decimalPart} €`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(absolute);
}

/**
 * Currency symbol for form labels.
 */
export function currencySymbol(locale: AppLocale = getAppLocale()): string {
  return locale === 'es' ? '€' : '$';
}
