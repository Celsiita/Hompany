import { TASK_CATEGORY_LABEL } from '@/types/task-category';
import { EXPENSE_KIND_LABEL, type ExpenseKind } from '@/types/expense';
import type { HomeItemType } from '@/schemas/item-type.schema';
import type { TaskCategory } from '@/types/task-category';

/**
 * Label for a task type chip on cards: custom item type name, else built-in category.
 */
export function resolveTaskTypeLabel(params: {
  category: TaskCategory;
  itemTypeId?: string | null;
  itemTypes?: readonly HomeItemType[];
}): string {
  if (params.itemTypeId) {
    const match = params.itemTypes?.find((type) => type.id === params.itemTypeId);
    if (match?.name.trim()) {
      return match.name.trim();
    }
  }
  return TASK_CATEGORY_LABEL[params.category] ?? 'Tarea';
}

/**
 * Label for an expense type chip on cards: custom item type name, else built-in kind.
 */
export function resolveExpenseTypeLabel(params: {
  kind: ExpenseKind;
  itemTypeId?: string | null;
  itemTypes?: readonly HomeItemType[];
}): string {
  if (params.itemTypeId) {
    const match = params.itemTypes?.find((type) => type.id === params.itemTypeId);
    if (match?.name.trim()) {
      return match.name.trim();
    }
  }
  return EXPENSE_KIND_LABEL[params.kind] ?? 'Gasto';
}
