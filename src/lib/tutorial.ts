import AsyncStorage from '@react-native-async-storage/async-storage';

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
  homeSection?: 'FEED' | 'AGENDA' | 'PISO';
  /** Navigate to a tab route when pressing CTA (before advancing). */
  goTab?: '/(tabs)' | '/(tabs)/tasks' | '/(tabs)/expenses' | '/(tabs)/settings';
};

/**
 * Interactive guided tour: each step highlights a product area and invites action.
 */
export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: `${MASCOT_NAME} te da la bienvenida`,
    body: 'HOMPANY es el juego de convivencia de tu piso: tareas con foto, gastos claros y un poco de reputación. En un minuto ves dónde está cada cosa.',
    emoji: '🐵',
    highlight: 'welcome',
    cta: 'Empezar tour',
    tip: 'Puedes saltar y repetirlo luego en Ajustes.',
  },
  {
    id: 'feed',
    title: 'Feed = el estado del piso',
    body: 'Aquí ves si el piso va bien, el ranking y quién debe a quién. Nada de Wi‑Fi aquí: eso vive en Piso.',
    emoji: '🏠',
    highlight: 'feed',
    homeSection: 'FEED',
    cta: 'Ver el Feed',
    tip: 'Mira la barra de cumplimiento y la clasificación.',
  },
  {
    id: 'bell',
    title: 'Campanita = avisos',
    body: 'Lo urgente (vencido, foto por validar, gastos) aparece en la 🔔. Toca un aviso y saltas a la tarjeta.',
    emoji: '🔔',
    highlight: 'bell',
    homeSection: 'FEED',
    cta: 'Siguiente',
    tip: 'Badge rojo = hay algo urgente.',
  },
  {
    id: 'agenda',
    title: 'Agenda = calendario vivo',
    body: 'Azul = tus tareas, círculo cielo = compañeros, ámbar = gastos. Toca un día y baja a la lista.',
    emoji: '📅',
    highlight: 'agenda',
    homeSection: 'AGENDA',
    cta: 'Abrir Agenda',
    tip: 'Ausencias y exámenes están en el menú ⋮, no estorban aquí.',
  },
  {
    id: 'piso',
    title: 'Piso = datos del hogar',
    body: 'Wi‑Fi, portal, basura, reglas y quejas. Lo que siempre buscas en el grupo de WhatsApp… pero ordenado.',
    emoji: '🔑',
    highlight: 'piso',
    homeSection: 'PISO',
    cta: 'Ver Piso',
  },
  {
    id: 'tasks',
    title: 'Tareas con prueba',
    body: 'Crea con +. Entrega con foto. Los compañeros aprueban o impugnan. Intercambia si no puedes.',
    emoji: '✅',
    highlight: 'tasks',
    goTab: '/(tabs)/tasks',
    cta: 'Ir a Tareas',
    tip: 'Chip «Tuya» / «Compañero» y el countdown te orientan al instante.',
  },
  {
    id: 'expenses',
    title: 'Gastos sin drama',
    body: 'Reparte a partes iguales, por % o cantidades. Los chips «Debes» / «Tú pagaste» y Mis deudas / Mis cobros dejan claro el dinero.',
    emoji: '💶',
    highlight: 'expenses',
    goTab: '/(tabs)/expenses',
    cta: 'Ir a Gastos',
    tip: 'Chips Debes / Te deben y Mis deudas / Mis cobros dejan el dinero claro.',
  },
  {
    id: 'settings',
    title: 'Ajustes y Plus',
    body: 'Invita con código/QR, gestiona compañeros y desbloquea packs de iconos con HOMPANY Plus.',
    emoji: '⚙️',
    highlight: 'settings',
    goTab: '/(tabs)/settings',
    cta: 'Terminar',
    tip: 'Desde aquí puedes repetir este tutorial.',
  },
];

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
