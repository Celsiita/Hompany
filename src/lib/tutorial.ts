import AsyncStorage from '@react-native-async-storage/async-storage';

import { MASCOT_NAME } from '@/lib/mascot';

/** Persisted flag: user finished or skipped the intro tutorial. */
export const TUTORIAL_COMPLETED_KEY = 'hompany.tutorial.completed.v1';

export type TutorialStep = {
  id: string;
  title: string;
  body: string;
  emoji: string;
};

/**
 * Guided tour steps narrated by Mico (first launch + Settings replay).
 */
export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: `Hola, soy ${MASCOT_NAME}`,
    body: 'Te enseño el piso en un minuto: Feed, Agenda, Tareas y Gastos. Luego vuelves a la app.',
    emoji: '🐵',
  },
  {
    id: 'feed',
    title: 'Home · Feed',
    body: 'Aquí ves la salud del piso, la info práctica (Wi‑Fi, portal), reglas, quejas, el ranking y quién debe a quién.',
    emoji: '🏠',
  },
  {
    id: 'agenda',
    title: 'Home · Agenda',
    body: 'Calendario de tareas y gastos, ausencias, modo silencio y avisos del piso (visitas, reparaciones, eventos).',
    emoji: '📅',
  },
  {
    id: 'tasks',
    title: 'Tareas',
    body: 'Crea con +. Completa con foto (según ajustes del piso), los compañeros validan o impugnan con motivo. Sin reabrir lo cerrado.',
    emoji: '✅',
  },
  {
    id: 'expenses',
    title: 'Gastos',
    body: 'Reparto igualitario, porcentajes o cantidades. Mis deudas / Mis cobros. También se crean con +.',
    emoji: '💶',
  },
  {
    id: 'settings',
    title: 'Ajustes',
    body: 'Perfil, invitación al piso, compañeros y (si eres admin) si la foto de prueba es obligatoria o solo con cámara. Puedes repetir este tutorial cuando quieras.',
    emoji: '⚙️',
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
