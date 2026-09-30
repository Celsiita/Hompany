import { View } from 'react-native';

import { FilterGroup } from '@/components/ui/FilterGroup';
import { FilterTogglePair } from '@/components/ui/FilterTogglePair';
import { RecurrenceFilterChips, type RecurrenceFilter } from '@/components/ui/RecurrenceFilterChips';
import { TaskStatusFilterChips, type TaskBoardStatusFilter } from '@/components/ui/StatusFilterChips';
import { ToggleChipRow } from '@/components/ui/ToggleChipRow';
import { getAppLocale } from '@/lib/i18n/locale-store';
import { displayTaskCategory } from '@/lib/i18n/display';
import { translate } from '@/lib/i18n/strings';
import { useLocale } from '@/providers/LocaleProvider';
import type { HomeItemType } from '@/schemas/item-type.schema';
import type { TaskAssigneeScope, TaskBoardCategoryFilter } from '@/schemas/task.schema';

type TaskFilterBarProps = {
  category: TaskBoardCategoryFilter;
  onCategoryChange: (value: TaskBoardCategoryFilter) => void;
  customTypes?: HomeItemType[];
  scope: TaskAssigneeScope;
  onScopeChange: (value: TaskAssigneeScope) => void;
  recurrence: RecurrenceFilter;
  onRecurrenceChange: (value: RecurrenceFilter) => void;
  status: TaskBoardStatusFilter;
  onStatusChange: (value: TaskBoardStatusFilter) => void;
  history?: boolean;
};

/**
 * Task board filters: scope, type, recurrence and status (shared pill format).
 */
export function TaskFilterBar({
  category,
  onCategoryChange,
  customTypes = [],
  scope,
  onScopeChange,
  recurrence,
  onRecurrenceChange,
  status,
  onStatusChange,
  history = false,
}: TaskFilterBarProps) {
  const { t } = useLocale();
  const scopeOptions = [
    { value: 'MINE' as const, label: t('filters.myTasks') },
    { value: 'OTHERS' as const, label: t('filters.peerTasks') },
  ] as const;
  const typeChips = [
    { key: 'QUICK' as const, label: displayTaskCategory('QUICK', t) },
    ...customTypes.map((type) => ({ key: type.id, label: type.name })),
  ];

  return (
    <View className="gap-3">
      <FilterGroup label={t('filters.scope')}>
        <FilterTogglePair
          value={scope === 'MINE' || scope === 'OTHERS' ? scope : 'ALL'}
          options={scopeOptions}
          onChange={(next) => onScopeChange(next === 'ALL' ? 'ALL' : next)}
        />
      </FilterGroup>
      <FilterGroup label={t('filters.type')}>
        <ToggleChipRow value={category} chips={typeChips} onChange={onCategoryChange} />
      </FilterGroup>
      <FilterGroup label={t('filters.recurrence')}>
        <RecurrenceFilterChips value={recurrence} onChange={onRecurrenceChange} />
      </FilterGroup>
      <FilterGroup label={t('filters.status')}>
        <TaskStatusFilterChips value={status} onChange={onStatusChange} history={history} />
      </FilterGroup>
    </View>
  );
}

export function categoryLabel(category: import('@/types/task-category').TaskCategory): string {
  return displayTaskCategory(category, (key) => translate(getAppLocale(), key));
}
