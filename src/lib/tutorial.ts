import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppLocale } from '@/lib/i18n/types';
import { getAppLocale } from '@/lib/i18n/locale-store';
import { MASCOT_NAME } from '@/lib/mascot';

/** Persisted flag: user finished or skipped the intro tutorial (v2 interactive). */
export const TUTORIAL_COMPLETED_KEY = 'hompany.tutorial.completed.v2';

export type TutorialHighlight =
  | 'welcome'
  | 'feed'
  | 'agenda'
  | 'piso'
  | 'bell'
  | 'tasks'
  | 'expenses'
  | 'settings';

export type TutorialStep = {
  id: string;
  title: string;
  body: string;
  emoji: string;
  highlight: TutorialHighlight;
  /** Primary CTA label */
  cta: string;
  /** Optional secondary tip under the CTA */
  tip?: string;
  /** Switch Home section when this step shows (if on Home). */
  homeSection?: 'FEED' | 'AGENDA';
  /** Navigate to a tab route when pressing CTA (before advancing). */
  goTab?: '/(tabs)' | '/(tabs)/piso' | '/(tabs)/tasks' | '/(tabs)/expenses' | '/(tabs)/settings';
};

type TutorialStepBase = Omit<TutorialStep, 'title' | 'body' | 'cta' | 'tip'> & {
  title: Record<AppLocale, string>;
  body: Record<AppLocale, string>;
  cta: Record<AppLocale, string>;
  tip?: Record<AppLocale, string>;
};

const TUTORIAL_STEP_DEFS: TutorialStepBase[] = [
  {
    id: 'welcome',
    title: {
      es: `${MASCOT_NAME} te da la bienvenida`,
      en: `${MASCOT_NAME} welcomes you`,
    },
    body: {
      es: 'HOMPANY: deja de discutir por las tareas y el dinero. Foto al completar, deudas claras y un poco de reputación. En un minuto ves el piso.',
      en: 'HOMPANY: stop fighting over chores and money. Photo to complete, clear debts and a bit of reputation. See the flat in a minute.',
    },
    emoji: '🐵',
    highlight: 'welcome',
    cta: { es: 'Empezar tour', en: 'Start tour' },
    tip: {
      es: 'Puedes saltar y repetirlo luego en Ajustes.',
      en: 'You can skip and replay later in Settings.',
    },
  },
  {
    id: 'feed',
    title: {
      es: 'Feed = el estado del piso',
      en: 'Feed = flat status',
    },
    body: {
      es: 'Estado del piso, ranking y cuentas. Menos pelea, más claridad. Wi‑Fi y ausencias están en Piso.',
      en: 'Flat status, ranking and balances. Less fighting, more clarity. Wi‑Fi and absences live in Flat.',
    },
    emoji: '🏠',
    highlight: 'feed',
    homeSection: 'FEED',
    cta: { es: 'Ver el Feed', en: 'See the Feed' },
    tip: {
      es: 'Mira la barra de cumplimiento y la clasificación.',
      en: 'Check the compliance bar and the leaderboard.',
    },
  },
  {
    id: 'bell',
    title: {
      es: 'Campanita = avisos',
      en: 'Bell = alerts',
    },
    body: {
      es: 'Lo urgente (vencido, foto por validar, gastos) aparece en la 🔔. Toca un aviso y saltas a la tarjeta.',
      en: 'Urgents (overdue, photo to review, expenses) land in the 🔔. Tap an alert to jump to the card.',
    },
    emoji: '🔔',
    highlight: 'bell',
    homeSection: 'FEED',
    cta: { es: 'Siguiente', en: 'Next' },
    tip: {
      es: 'Badge rojo = hay algo urgente.',
      en: 'Red badge = something urgent.',
    },
  },
  {
    id: 'agenda',
    title: {
      es: 'Agenda = calendario vivo',
      en: 'Agenda = live calendar',
    },
    body: {
      es: 'Azul = tus tareas, círculo cielo = compañeros, ámbar = gastos. Toca un día y baja a la lista.',
      en: 'Blue = your tasks, sky ring = roommates, amber = expenses. Tap a day and scroll to the list.',
    },
    emoji: '📅',
    highlight: 'agenda',
    homeSection: 'AGENDA',
    cta: { es: 'Abrir Agenda', en: 'Open Agenda' },
    tip: {
      es: 'Ausencias y silencio se gestionan en la pestaña Piso.',
      en: 'Absences and quiet time are managed in the Flat tab.',
    },
  },
  {
    id: 'piso',
    title: {
      es: 'Piso = vida del hogar',
      en: 'Flat = house life',
    },
    body: {
      es: 'Ausencias, modo silencio, visitas, reclamar silencio, Wi‑Fi y reglas. Solo gestionas lo tuyo; el resto lo ve en Agenda.',
      en: 'Absences, quiet mode, visits, claim quiet, Wi‑Fi and rules. You only manage yours; the rest shows on Agenda.',
    },
    emoji: '🏠',
    highlight: 'piso',
    goTab: '/(tabs)/piso',
    cta: { es: 'Ir a Piso', en: 'Go to Flat' },
  },
  {
    id: 'tasks',
    title: {
      es: 'Tareas con prueba',
      en: 'Tasks with proof',
    },
    body: {
      es: 'Crea con +. Entrega con foto. Los compañeros aprueban o impugnan. Intercambia si no puedes.',
      en: 'Create with +. Submit with a photo. Roommates approve or dispute. Swap if you cannot.',
    },
    emoji: '✅',
    highlight: 'tasks',
    goTab: '/(tabs)/tasks',
    cta: { es: 'Ir a Tareas', en: 'Go to Tasks' },
    tip: {
      es: 'Chip «Tuya» / «Compañero» y el countdown te orientan al instante.',
      en: '“Yours” / “Roommate” chips and the countdown orient you instantly.',
    },
  },
  {
    id: 'expenses',
    title: {
      es: 'Gastos sin drama',
      en: 'Expenses without drama',
    },
    body: {
      es: 'Reparte a partes iguales, por % o cantidades. Los chips «Debes» / «Tú pagaste» y Mis deudas / Mis cobros dejan claro el dinero.',
      en: 'Split evenly, by % or fixed amounts. “You owe” / “You paid” chips and My debts / My collections keep money clear.',
    },
    emoji: '💶',
    highlight: 'expenses',
    goTab: '/(tabs)/expenses',
    cta: { es: 'Ir a Gastos', en: 'Go to Expenses' },
    tip: {
      es: 'Chips Debes / Te deben y Mis deudas / Mis cobros dejan el dinero claro.',
      en: 'You owe / They owe you chips keep money clear.',
    },
  },
  {
    id: 'settings',
    title: {
      es: 'Ajustes y Plus',
      en: 'Settings and Plus',
    },
    body: {
      es: 'Invita con código/QR, gestiona compañeros y desbloquea insights de reputación con HOMPANY Plus.',
      en: 'Invite with code/QR, manage roommates and unlock reputation insights with HOMPANY Plus.',
    },
    emoji: '⚙️',
    highlight: 'settings',
    goTab: '/(tabs)/settings',
    cta: { es: 'Terminar', en: 'Finish' },
    tip: {
      es: 'Desde aquí puedes repetir este tutorial.',
      en: 'From here you can replay this tutorial.',
    },
  },
];

/**
 * Interactive guided tour steps for the given (or active) locale.
 */
export function getTutorialSteps(locale: AppLocale = getAppLocale()): TutorialStep[] {
  return TUTORIAL_STEP_DEFS.map((step) => ({
    id: step.id,
    emoji: step.emoji,
    highlight: step.highlight,
    homeSection: step.homeSection,
    goTab: step.goTab,
    title: step.title[locale],
    body: step.body[locale],
    cta: step.cta[locale],
    tip: step.tip?.[locale],
  }));
}

/**
 * Spanish steps (default) — kept for tests and static imports.
 */
export const TUTORIAL_STEPS: TutorialStep[] = getTutorialSteps('es');

/**
 * Highlight chip labels for the tour chrome.
 */
export function tutorialHighlightLabel(
  highlight: TutorialHighlight,
  locale: AppLocale = getAppLocale(),
): string {
  const labels: Record<TutorialHighlight, Record<AppLocale, string>> = {
    welcome: { es: 'Tour guiado', en: 'Guided tour' },
    feed: { es: 'Sección Feed', en: 'Feed section' },
    agenda: { es: 'Sección Agenda', en: 'Agenda section' },
    piso: { es: 'Pestaña Piso', en: 'Flat tab' },
    bell: { es: 'Campanita de avisos', en: 'Alerts bell' },
    tasks: { es: 'Pestaña Tareas', en: 'Tasks tab' },
    expenses: { es: 'Pestaña Gastos', en: 'Expenses tab' },
    settings: { es: 'Pestaña Ajustes', en: 'Settings tab' },
  };
  return labels[highlight][locale];
}

/**
 * Reads whether the tutorial was completed.
 */
export async function isTutorialCompleted(): Promise<boolean> {
  const value = await AsyncStorage.getItem(TUTORIAL_COMPLETED_KEY);
  return value === '1';
}

/**
 * Marks the tutorial as done (finished or skipped).
 */
export async function markTutorialCompleted(): Promise<void> {
  await AsyncStorage.setItem(TUTORIAL_COMPLETED_KEY, '1');
}
