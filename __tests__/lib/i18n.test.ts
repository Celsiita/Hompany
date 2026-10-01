import { formatMoney, formatProductPrice } from '@/lib/i18n/format-price';
import { setAppLocale } from '@/lib/i18n/locale-store';
import { translate } from '@/lib/i18n/strings';
import { getTutorialSteps } from '@/lib/tutorial';
import { mascotEmptyCopy, mascotReaction, mascotScreenLine } from '@/lib/mascot';

describe('i18n currency', () => {
  afterEach(() => {
    setAppLocale('es');
  });

  it('shows euros for Spanish locale regardless of store currency', () => {
    expect(
      formatProductPrice({ price: 2.99, priceString: '$2.99', currencyCode: 'USD' }, 'es'),
    ).toMatch(/2,99\s*€/);
  });

  it('shows dollars for English when product is USD', () => {
    expect(
      formatProductPrice({ price: 2.99, priceString: '$2.99', currencyCode: 'USD' }, 'en'),
    ).toMatch(/\$2\.99/);
  });

  it('formats expense money by locale', () => {
    setAppLocale('es');
    expect(formatMoney(14)).toBe('14,00 €');
    setAppLocale('en');
    expect(formatMoney(14)).toMatch(/\$14\.00/);
  });
});

describe('i18n strings', () => {
  it('translates core tabs', () => {
    expect(translate('es', 'tabs.home')).toBe('Inicio');
    expect(translate('en', 'tabs.home')).toBe('Home');
    expect(translate('en', 'piso.quiet')).toMatch(/quiet/i);
  });
});

describe('i18n tutorial + mascot', () => {
  afterEach(() => {
    setAppLocale('es');
  });

  it('returns English tutorial steps', () => {
    const steps = getTutorialSteps('en');
    expect(steps[0]?.title).toMatch(/welcome/i);
    expect(steps.every((step) => step.cta.length > 0)).toBe(true);
  });

  it('switches mascot copy with locale store', () => {
    setAppLocale('en');
    expect(mascotScreenLine('piso')).toMatch(/Quiet|absences/i);
    expect(mascotReaction('approve').button).toMatch(/approve/i);
    expect(mascotEmptyCopy('tasks_open').title).toMatch(/pending/i);
  });

  it('localizes roles and due prefixes', () => {
    setAppLocale('en');
    const { homeRoleLabel } = require('@/lib/roles') as typeof import('@/lib/roles');
    const { formatDueSummary } = require('@/features/tasks/lib/countdown') as typeof import('@/features/tasks/lib/countdown');
    expect(homeRoleLabel('member')).toBe('Member');
    expect(formatDueSummary('2099-01-01T12:00:00.000Z', 'DEADLINE').label).toMatch(/^Due /);
  });
});
