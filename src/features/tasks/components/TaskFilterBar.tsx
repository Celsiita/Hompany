import { View } from 'react-native';

import { FilterGroup } from '@/components/ui/FilterGroup';
import { FilterTogglePair } from '@/components/ui/FilterTogglePair';
import { RecurrenceFilterChips, type RecurrenceFilter } from '@/components/ui/RecurrenceFilterChips';
import { TaskStatusFilterChips, type TaskBoardStatusFilter } from '@/components/ui/StatusFilterChips';
import { ToggleChipRow } from '@/components/ui/ToggleChipRow';
import { TASK_CATEGORY_LABEL } from '@/types/task-category';
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

const SCOPE_OPTIONS = [
  { value: 'MINE' as const, label: 'Mis tareas' },
  { value: 'OTHERS' as const, label: 'Compañeros' },
] as const;

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
  const typeChips = [
    { key: 'QUICK' as const, label: TASK_CATEGORY_LABEL.QUICK },
    ...customTypes.map((type) => ({ key: type.id, label: type.name })),
  ];

  return (
    <View className="gap-3">
      <FilterGroup label="Alcance">
        <FilterTogglePair
          value={scope === 'MINE' || scope === 'OTHERS' ? scope : 'ALL'}
          options={SCOPE_OPTIONS}
          onChange={(next) => onScopeChange(next === 'ALL' ? 'ALL' : next)}
        />
      </FilterGroup>
      <FilterGroup label="Tipo">
        <ToggleChipRow value={category} chips={typeChips} onChange={onCategoryChange} />
      </FilterGroup>
      <FilterGroup label="Periodicidad">
        <RecurrenceFilterChips value={recurrence} onChange={onRecurrenceChange} />
      </FilterGroup>
      <FilterGroup label="Estado">
        <TaskStatusFilterChips value={status} onChange={onStatusChange} history={history} />
      </FilterGroup>
    </View>
  );
}

export function categoryLabel(category: import('@/types/task-category').TaskCategory): string {
  return TASK_CATEGORY_LABEL[category];
}
