import type { TaskBoardSummary } from '@/features/tasks/lib/task-summary';

/** Display name of the flat mascot. */
export const MASCOT_NAME = 'Mico';

/**
 * Emotional moods for the mascot. v1 uses health-driven moods;
 * shame / exam / guard land in later phases.
 */
export type MascotMood = 'thriving' | 'okay' | 'chaos' | 'shame' | 'exam' | 'guard';

export type MascotEmptyKind =
  | 'tasks_open'
  | 'tasks_history'
  | 'tasks_filtered'
  | 'expenses_open'
  | 'expenses_history'
  | 'expenses_i_owe'
  | 'expenses_they_owe'
  | 'expenses_filtered'
  | 'agenda_day'
  | 'agenda_list'
  | 'leaderboard'
  | 'alerts';

export type MascotReactionKind =
  | 'approve'
  | 'dispute'
  | 'complete'
  | 'swap'
  | 'waiting_review'
  | 'swap_proposed'
  | 'loading';

export type MascotScreenLine = 'feed' | 'agenda' | 'convivencia' | 'tasks' | 'expenses' | 'settings';

type MascotPersona = {
  /** Accent used by drawn face (fur / cheeks). */
  fur: string;
  cheek: string;
  eye: 'open' | 'wink' | 'closed' | 'wide';
  mouth: 'smile' | 'flat' | 'o' | 'grimace';
  headline: string;
  quip: string;
};

const MOOD_PERSONA: Record<MascotMood, MascotPersona> = {
  thriving: {
    fur: '#C4A574',
    cheek: '#F5B7A5',
    eye: 'open',
    mouth: 'smile',
    headline: 'El piso rueda',
    quip: `${MASCOT_NAME} se pavonea: casi no hay drama esta semana.`,
  },
  okay: {
    fur: '#B8956A',
    cheek: '#E8C4B8',
    eye: 'wink',
    mouth: 'flat',
    headline: 'Hay que empujar un poco',
    quip: `${MASCOT_NAME} levanta una ceja… algo se está acumulando.`,
  },
  chaos: {
    fur: '#A67C52',
    cheek: '#D4A090',
    eye: 'wide',
    mouth: 'grimace',
    headline: 'Caos en el piso',
    quip: `${MASCOT_NAME} se tira del pelo: demasiadas cosas pendientes.`,
  },
  shame: {
    fur: '#9A7B55',
    cheek: '#E0A898',
    eye: 'closed',
    mouth: 'o',
    headline: 'Paseo de la vergüenza',
    quip: `${MASCOT_NAME} mira al suelo… toca recuperar reputación.`,
  },
  exam: {
    fur: '#C4A574',
    cheek: '#F5B7A5',
    eye: 'wink',
    mouth: 'flat',
    headline: 'Modo silencio',
    quip: `${MASCOT_NAME} susurra: hay exámenes en casa, id con tacto.`,
  },
  guard: {
    fur: '#C4A574',
    cheek: '#F5B7A5',
    eye: 'open',
    mouth: 'flat',
    headline: 'Mono de guardia',
    quip: `${MASCOT_NAME} cubre el fuerte mientras alguien está fuera.`,
  },
};

const EMPTY_COPY: Record<MascotEmptyKind, { title: string; body: string }> = {
  tasks_open: {
    title: 'Nada pendiente',
    body: 'El cuadrante está limpio. Crea una tarea con + o disfruta el momento.',
  },
  tasks_history: {
    title: 'Historial vacío',
    body: 'Cuando cerréis tareas, aparecerán aquí con fecha de realización.',
  },
  tasks_filtered: {
    title: 'Nada con estos filtros',
    body: 'Prueba a quitar algún chip.',
  },
  expenses_open: {
    title: 'Sin gastos abiertos',
    body: 'Crea uno con + o disfruta de las cuentas en paz.',
  },
  expenses_history: {
    title: 'Sin historial de gastos',
    body: 'Los gastos saldados aparecen aquí con fecha.',
  },
  expenses_i_owe: {
    title: 'No debes nada',
    body: 'Estás al día con el piso.',
  },
  expenses_they_owe: {
    title: 'Nadie te debe',
    body: 'No hay cobros pendientes ahora mismo.',
  },
  expenses_filtered: {
    title: 'Nada con estos filtros',
    body: 'Afloja un filtro y reintenta.',
  },
  agenda_day: {
    title: 'Día libre',
    body: 'Nada previsto. Toca otro día o crea algo desde Tareas / Gastos.',
  },
  agenda_list: {
    title: 'Agenda en calma',
    body: 'No hay eventos en este rango. Prueba Mis cosas o Compañeros en filtros.',
  },
  leaderboard: {
    title: 'Clasificación vacía',
    body: 'Aún no hay compañeros en el piso.',
  },
  alerts: {
    title: 'Bandeja limpia',
    body: 'Aquí salen vencidas, revisiones y deudas. Si algo urge, la campanita se marca en rojo.',
  },
};

const REACTIONS: Record<
  MascotReactionKind,
  { button: string; title?: string; body: string }
> = {
  approve: {
    button: 'Aprobar',
    title: 'Prueba aceptada',
    body: `${MASCOT_NAME} aplaude: entrega validada.`,
  },
  dispute: {
    button: '🤨 Impugnar',
    title: 'Mmm, sospechoso…',
    body: `${MASCOT_NAME} levanta ceja: hay que repetir la prueba.`,
  },
  complete: {
    button: '✓ Completar',
    title: 'A revisión',
    body: `${MASCOT_NAME} recoge la entrega y la pasa a los compañeros.`,
  },
  swap: {
    button: '⇄ Proponer cambio',
    title: 'Cambio de cromos',
    body: `${MASCOT_NAME} propone un trueque limpio entre compañeros.`,
  },
  waiting_review: {
    button: '',
    body: `${MASCOT_NAME} tiene la entrega en la mesa: falta el OK de un compañero.`,
  },
  swap_proposed: {
    button: '',
    title: 'Trueque a la vista',
    body: `${MASCOT_NAME} trae una propuesta de intercambio.`,
  },
  loading: {
    button: '',
    body: `${MASCOT_NAME} está colgado del mango… un segundo.`,
  },
};

const SCREEN_LINES: Record<MascotScreenLine, string> = {
  feed: 'Salud del piso, ranking y cuentas',
  agenda: 'Calendario de lo que toca esta semana',
  convivencia: 'Ausencias, silencio, visitas y Wi‑Fi',
  tasks: 'Cuadrante · foto y puntos',
  expenses: 'Súper, casa y deudas claras',
  settings: 'Piso, invitación, Plus y tutorial',
};

/**
 * Maps board health label to a mascot mood (v1).
 */
export function mascotMoodFromHealth(
  healthLabel: TaskBoardSummary['healthLabel'],
): MascotMood {
  if (healthLabel === 'Crítico') {
    return 'chaos';
  }
  if (healthLabel === 'Regular') {
    return 'okay';
  }
  return 'thriving';
}

/**
 * Visual + copy persona for a mood (drawn face uses fur/eye/mouth).
 */
export function mascotPersona(mood: MascotMood): MascotPersona & { name: string; mood: MascotMood } {
  return { name: MASCOT_NAME, mood, ...MOOD_PERSONA[mood] };
}

/**
 * Short headline shown next to the health meter.
 */
export function mascotHeadline(mood: MascotMood): string {
  return MOOD_PERSONA[mood].headline;
}

/**
 * One-line quip in Mico's voice.
 */
export function mascotQuip(mood: MascotMood): string {
  return MOOD_PERSONA[mood].quip;
}

/**
 * Empty-state copy in Mico's voice.
 */
export function mascotEmptyCopy(kind: MascotEmptyKind): { title: string; body: string } {
  return EMPTY_COPY[kind];
}

/**
 * Action / reaction copy (buttons, waiting states, loading).
 */
export function mascotReaction(kind: MascotReactionKind): {
  button: string;
  title?: string;
  body: string;
} {
  return REACTIONS[kind];
}

/**
 * Screen subtitle with Mico personality.
 */
export function mascotScreenLine(screen: MascotScreenLine): string {
  return SCREEN_LINES[screen];
}

/**
 * @deprecated Prefer drawn {@link mascotPersona}; kept for tests/legacy.
 */
export function mascotGlyph(mood: MascotMood): string {
  if (mood === 'okay') return '🙈';
  if (mood === 'chaos') return '🙉';
  if (mood === 'shame') return '🙊';
  return '🐵';
}
