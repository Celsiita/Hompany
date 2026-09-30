import type { TaskBoardSummary } from '@/features/tasks/lib/task-summary';
import type { AppLocale } from '@/lib/i18n/types';
import { getAppLocale } from '@/lib/i18n/locale-store';

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

export type MascotScreenLine = 'feed' | 'agenda' | 'piso' | 'tasks' | 'expenses' | 'settings';

type MascotPersona = {
  /** Accent used by drawn face (fur / cheeks). */
  fur: string;
  cheek: string;
  eye: 'open' | 'wink' | 'closed' | 'wide';
  mouth: 'smile' | 'flat' | 'o' | 'grimace';
  headline: string;
  quip: string;
};

type MoodVisual = Pick<MascotPersona, 'fur' | 'cheek' | 'eye' | 'mouth'>;

const MOOD_VISUAL: Record<MascotMood, MoodVisual> = {
  thriving: { fur: '#C4A574', cheek: '#F5B7A5', eye: 'open', mouth: 'smile' },
  okay: { fur: '#B8956A', cheek: '#E8C4B8', eye: 'wink', mouth: 'flat' },
  chaos: { fur: '#A67C52', cheek: '#D4A090', eye: 'wide', mouth: 'grimace' },
  shame: { fur: '#9A7B55', cheek: '#E0A898', eye: 'closed', mouth: 'o' },
  exam: { fur: '#C4A574', cheek: '#F5B7A5', eye: 'wink', mouth: 'flat' },
  guard: { fur: '#C4A574', cheek: '#F5B7A5', eye: 'open', mouth: 'flat' },
};

const MOOD_COPY: Record<MascotMood, Record<AppLocale, { headline: string; quip: string }>> = {
  thriving: {
    es: {
      headline: 'El piso rueda',
      quip: `${MASCOT_NAME} se pavonea: casi no hay drama esta semana.`,
    },
    en: {
      headline: 'The flat is rolling',
      quip: `${MASCOT_NAME} struts: almost no drama this week.`,
    },
  },
  okay: {
    es: {
      headline: 'Hay que empujar un poco',
      quip: `${MASCOT_NAME} levanta una ceja… algo se está acumulando.`,
    },
    en: {
      headline: 'Needs a little push',
      quip: `${MASCOT_NAME} raises an eyebrow… things are piling up.`,
    },
  },
  chaos: {
    es: {
      headline: 'Caos en el piso',
      quip: `${MASCOT_NAME} se tira del pelo: demasiadas cosas pendientes.`,
    },
    en: {
      headline: 'Chaos in the flat',
      quip: `${MASCOT_NAME} pulls their hair: too much still open.`,
    },
  },
  shame: {
    es: {
      headline: 'Paseo de la vergüenza',
      quip: `${MASCOT_NAME} mira al suelo… toca recuperar reputación.`,
    },
    en: {
      headline: 'Walk of shame',
      quip: `${MASCOT_NAME} stares at the floor… time to earn reputation back.`,
    },
  },
  exam: {
    es: {
      headline: 'Modo silencio',
      quip: `${MASCOT_NAME} susurra: hay exámenes en casa, id con tacto.`,
    },
    en: {
      headline: 'Quiet mode',
      quip: `${MASCOT_NAME} whispers: exams at home, tread lightly.`,
    },
  },
  guard: {
    es: {
      headline: 'Mono de guardia',
      quip: `${MASCOT_NAME} cubre el fuerte mientras alguien está fuera.`,
    },
    en: {
      headline: 'Monkey on duty',
      quip: `${MASCOT_NAME} holds the fort while someone is away.`,
    },
  },
};

const EMPTY_COPY: Record<MascotEmptyKind, Record<AppLocale, { title: string; body: string }>> = {
  tasks_open: {
    es: {
      title: 'Nada pendiente',
      body: 'El cuadrante está limpio. Crea una tarea con + o disfruta el momento.',
    },
    en: {
      title: 'Nothing pending',
      body: 'The board is clear. Create a task with + or enjoy the moment.',
    },
  },
  tasks_history: {
    es: {
      title: 'Historial vacío',
      body: 'Cuando cerréis tareas, aparecerán aquí con fecha de realización.',
    },
    en: {
      title: 'Empty history',
      body: 'When you close tasks, they show up here with a completion date.',
    },
  },
  tasks_filtered: {
    es: { title: 'Nada con estos filtros', body: 'Prueba a quitar algún chip.' },
    en: { title: 'Nothing with these filters', body: 'Try clearing a chip.' },
  },
  expenses_open: {
    es: {
      title: 'Sin gastos abiertos',
      body: 'Crea uno con + o disfruta de las cuentas en paz.',
    },
    en: {
      title: 'No open expenses',
      body: 'Create one with + or enjoy peaceful balances.',
    },
  },
  expenses_history: {
    es: {
      title: 'Sin historial de gastos',
      body: 'Los gastos saldados aparecen aquí con fecha.',
    },
    en: {
      title: 'No expense history',
      body: 'Settled expenses appear here with a date.',
    },
  },
  expenses_i_owe: {
    es: { title: 'No debes nada', body: 'Estás al día con el piso.' },
    en: { title: 'You owe nothing', body: 'You are square with the flat.' },
  },
  expenses_they_owe: {
    es: { title: 'Nadie te debe', body: 'No hay cobros pendientes ahora mismo.' },
    en: { title: 'Nobody owes you', body: 'No open collections right now.' },
  },
  expenses_filtered: {
    es: { title: 'Nada con estos filtros', body: 'Afloja un filtro y reintenta.' },
    en: { title: 'Nothing with these filters', body: 'Relax a filter and try again.' },
  },
  agenda_day: {
    es: {
      title: 'Día libre',
      body: 'Nada previsto. Toca otro día o crea algo desde Tareas / Gastos.',
    },
    en: {
      title: 'Free day',
      body: 'Nothing planned. Pick another day or create from Tasks / Expenses.',
    },
  },
  agenda_list: {
    es: {
      title: 'Agenda en calma',
      body: 'No hay eventos en este rango. Prueba Mis cosas o Compañeros en filtros.',
    },
    en: {
      title: 'Calm agenda',
      body: 'No events in this range. Try Mine or Roommates in filters.',
    },
  },
  leaderboard: {
    es: { title: 'Clasificación vacía', body: 'Aún no hay compañeros en el piso.' },
    en: { title: 'Empty leaderboard', body: 'No roommates in the flat yet.' },
  },
  alerts: {
    es: {
      title: 'Bandeja limpia',
      body: 'Aquí salen vencidas, revisiones y deudas. Si algo urge, la campanita se marca en rojo.',
    },
    en: {
      title: 'Inbox clear',
      body: 'Overdues, reviews and debts land here. If something is urgent, the bell turns red.',
    },
  },
};

const REACTIONS: Record<
  MascotReactionKind,
  Record<AppLocale, { button: string; title?: string; body: string }>
> = {
  approve: {
    es: {
      button: 'Aprobar',
      title: 'Prueba aceptada',
      body: `${MASCOT_NAME} aplaude: entrega validada.`,
    },
    en: {
      button: 'Approve',
      title: 'Proof accepted',
      body: `${MASCOT_NAME} applauds: delivery validated.`,
    },
  },
  dispute: {
    es: {
      button: '🤨 Impugnar',
      title: 'Mmm, sospechoso…',
      body: `${MASCOT_NAME} levanta ceja: hay que repetir la prueba.`,
    },
    en: {
      button: '🤨 Dispute',
      title: 'Hmm, suspicious…',
      body: `${MASCOT_NAME} raises an eyebrow: redo the proof.`,
    },
  },
  complete: {
    es: {
      button: '✓ Completar',
      title: 'A revisión',
      body: `${MASCOT_NAME} recoge la entrega y la pasa a los compañeros.`,
    },
    en: {
      button: '✓ Complete',
      title: 'In review',
      body: `${MASCOT_NAME} takes the delivery and hands it to roommates.`,
    },
  },
  swap: {
    es: {
      button: '⇄ Proponer cambio',
      title: 'Cambio de cromos',
      body: `${MASCOT_NAME} propone un trueque limpio entre compañeros.`,
    },
    en: {
      button: '⇄ Propose swap',
      title: 'Trade offer',
      body: `${MASCOT_NAME} proposes a clean swap between roommates.`,
    },
  },
  waiting_review: {
    es: {
      button: '',
      body: `${MASCOT_NAME} tiene la entrega en la mesa: falta el OK de un compañero.`,
    },
    en: {
      button: '',
      body: `${MASCOT_NAME} has the delivery on the table: waiting for a roommate OK.`,
    },
  },
  swap_proposed: {
    es: {
      button: '',
      title: 'Trueque a la vista',
      body: `${MASCOT_NAME} trae una propuesta de intercambio.`,
    },
    en: {
      button: '',
      title: 'Swap incoming',
      body: `${MASCOT_NAME} brings a swap proposal.`,
    },
  },
  loading: {
    es: { button: '', body: `${MASCOT_NAME} está colgado del mango… un segundo.` },
    en: { button: '', body: `${MASCOT_NAME} is hanging on… one second.` },
  },
};

const SCREEN_LINES: Record<MascotScreenLine, Record<AppLocale, string>> = {
  feed: {
    es: 'Menos discusiones · más claridad',
    en: 'Fewer arguments · more clarity',
  },
  agenda: {
    es: 'Qué toca esta semana, de un vistazo',
    en: 'What is due this week at a glance',
  },
  piso: {
    es: 'Silencio, ausencias y datos del hogar',
    en: 'Quiet time, absences and flat info',
  },
  tasks: {
    es: 'Foto y listo · sin pelear por fregar',
    en: 'Photo and done · no chore fights',
  },
  expenses: {
    es: 'Quién debe a quién · sin drama',
    en: 'Who owes whom · no drama',
  },
  settings: {
    es: 'Piso, Plus e iconos',
    en: 'Flat, Plus and icons',
  },
};

function locale(): AppLocale {
  return getAppLocale();
}

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
  const copy = MOOD_COPY[mood][locale()];
  return { name: MASCOT_NAME, mood, ...MOOD_VISUAL[mood], ...copy };
}

/**
 * Short headline shown next to the health meter.
 */
export function mascotHeadline(mood: MascotMood): string {
  return MOOD_COPY[mood][locale()].headline;
}

/**
 * One-line quip in Mico's voice.
 */
export function mascotQuip(mood: MascotMood): string {
  return MOOD_COPY[mood][locale()].quip;
}

/**
 * Empty-state copy in Mico's voice.
 */
export function mascotEmptyCopy(kind: MascotEmptyKind): { title: string; body: string } {
  return EMPTY_COPY[kind][locale()];
}

/**
 * Action / reaction copy (buttons, waiting states, loading).
 */
export function mascotReaction(kind: MascotReactionKind): {
  button: string;
  title?: string;
  body: string;
} {
  return REACTIONS[kind][locale()];
}

/**
 * Screen subtitle with Mico personality.
 */
export function mascotScreenLine(screen: MascotScreenLine): string {
  return SCREEN_LINES[screen][locale()];
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
