import { z } from 'zod';

import type { ExpenseKind } from '@/types/expense';

export type BuiltinIconPackId = 'classic' | 'cozy' | 'playful';

export type IconPackId = BuiltinIconPackId | `custom:${string}`;

export type IconPack = {
  id: IconPackId;
  name: string;
  description: string;
  tasks: Record<string, string>;
  expenses: Record<ExpenseKind, string>;
};

const CLASSIC_TASKS: Record<string, string> = {
  'fork.knife': '🍽',
  shower: '🚿',
  sofa: '🛋',
  trash: '🗑',
  roll: '🧻',
  cart: '🛒',
  checklist: '✅',
  broom: '🧹',
};

export const TASK_ICON_KEYS = Object.keys(CLASSIC_TASKS);

/**
 * Built-in thematic emoji packs for task and expense categories.
 */
export const ICON_PACKS: Record<BuiltinIconPackId, IconPack> = {
  classic: {
    id: 'classic',
    name: 'Clásico',
    description: 'Iconos de casa y limpieza.',
    tasks: CLASSIC_TASKS,
    expenses: { GROCERY: '🛒', HOUSE: '🏠', PEER: '🎲' },
  },
  cozy: {
    id: 'cozy',
    name: 'Hogar',
    description: 'Tono cálido para el piso.',
    tasks: {
      'fork.knife': '🥘',
      shower: '🫧',
      sofa: '🪴',
      trash: '♻️',
      roll: '🧻',
      cart: '🧺',
      checklist: '📋',
      broom: '✨',
    },
    expenses: { GROCERY: '🥦', HOUSE: '🔑', PEER: '☕' },
  },
  playful: {
    id: 'playful',
    name: 'Play',
    description: 'Más color para la gamificación.',
    tasks: {
      'fork.knife': '🍕',
      shower: '🦆',
      sofa: '🎮',
      trash: '🦝',
      roll: '🧻',
      cart: '🚀',
      checklist: '🏆',
      broom: '🪄',
    },
    expenses: { GROCERY: '🍪', HOUSE: '💡', PEER: '🎉' },
  },
};

export const ICON_PACK_STORAGE_KEY = 'hompany.iconPack';
export const CUSTOM_ICON_PACKS_STORAGE_KEY = 'hompany.customIconPacks';

export const importedIconPackSchema = z.object({
  name: z.string().trim().min(1).max(40),
  description: z.string().trim().max(120).optional(),
  tasks: z.record(z.string().min(1).max(8)).optional(),
  expenses: z
    .object({
      GROCERY: z.string().min(1).max(8).optional(),
      HOUSE: z.string().min(1).max(8).optional(),
      PEER: z.string().min(1).max(8).optional(),
    })
    .optional(),
});

export type ImportedIconPackInput = z.infer<typeof importedIconPackSchema>;

/**
 * Builds a custom pack id and merges missing glyphs from Clásico.
 */
export function createCustomIconPack(
  input: ImportedIconPackInput,
  idSuffix = Date.now().toString(36),
): IconPack {
  const base = ICON_PACKS.classic;
  const id = `custom:${idSuffix}` as IconPackId;
  return {
    id,
    name: input.name.trim(),
    description: input.description?.trim() || 'Pack importado.',
    tasks: { ...base.tasks, ...(input.tasks ?? {}) },
    expenses: {
      GROCERY: input.expenses?.GROCERY ?? base.expenses.GROCERY,
      HOUSE: input.expenses?.HOUSE ?? base.expenses.HOUSE,
      PEER: input.expenses?.PEER ?? base.expenses.PEER,
    },
  };
}

/**
 * Parses a JSON string into a custom icon pack.
 */
export function parseImportedIconPackJson(raw: string): IconPack {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('El JSON no es válido');
  }
  const result = importedIconPackSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? 'Pack de iconos no válido');
  }
  return createCustomIconPack(result.data);
}

/**
 * Resolves a task icon key to an emoji using the active pack.
 */
export function glyphForTaskIcon(pack: IconPack, icon: string): string {
  return pack.tasks[icon] ?? ICON_PACKS.classic.tasks[icon] ?? '✅';
}

/**
 * Resolves an expense kind glyph from the active pack.
 */
export function glyphForExpenseKind(pack: IconPack, kind: ExpenseKind): string {
  return pack.expenses[kind] ?? ICON_PACKS.classic.expenses[kind] ?? '💶';
}

/**
 * Returns whether an id refers to a built-in pack.
 */
export function isBuiltinIconPackId(id: string): id is BuiltinIconPackId {
  return id === 'classic' || id === 'cozy' || id === 'playful';
}
