/**
 * Task category taxonomy. GROCERY remains in the DB enum for compatibility
 * but the task board only uses QUICK plus custom home types.
 */
export const TASK_CATEGORY = {
  ZONE: 'ZONE',
  QUICK: 'QUICK',
  GROCERY: 'GROCERY',
} as const;

export type TaskCategory = (typeof TASK_CATEGORY)[keyof typeof TASK_CATEGORY];

export const TASK_CATEGORY_VALUES = Object.values(TASK_CATEGORY) as [
  TaskCategory,
  ...TaskCategory[],
];

export const TASK_BOARD_CATEGORY = {
  QUICK: 'QUICK',
} as const;

export type TaskBoardCategory =
  (typeof TASK_BOARD_CATEGORY)[keyof typeof TASK_BOARD_CATEGORY];

export const TASK_CATEGORY_LABEL: Record<TaskCategory, string> = {
  ZONE: 'Zonas',
  QUICK: 'Tareas Rápidas',
  GROCERY: 'Supermercado',
};

export const TASK_ICON_OPTIONS = [
  'fork.knife',
  'shower',
  'sofa',
  'trash',
  'roll',
  'checklist',
  'broom',
] as const;

export type TaskIcon = (typeof TASK_ICON_OPTIONS)[number];
