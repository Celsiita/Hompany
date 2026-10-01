import { displayExpenseKind, displayTaskCategory, tLocale } from '@/lib/i18n/display';
import { getAppLocale } from '@/lib/i18n/locale-store';
import type { HomeItemType } from '@/schemas/item-type.schema';
import type { ExpenseKind } from '@/types/expense';
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
  return displayTaskCategory(params.category, tLocale(getAppLocale()));
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
  return displayExpenseKind(params.kind, tLocale(getAppLocale()));
}
