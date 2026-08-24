import { RecurrenceFilterChips, type RecurrenceFilter } from '@/components/ui/RecurrenceFilterChips';
import { ToggleChipRow } from '@/components/ui/ToggleChipRow';
import { Pressable, Text, View } from 'react-native';

import {
  TASK_BOARD_CATEGORY,
  TASK_CATEGORY_LABEL,
  type TaskCategory,
} from '@/types/task-category';
import type { TaskAssigneeScope, TaskBoardCategoryFilter } from '@/schemas/task.schema';

const CATEGORY_CHIPS: { key: 'ZONE' | 'QUICK'; label: string }[] = [
  { key: TASK_BOARD_CATEGORY.ZONE, label: TASK_CATEGORY_LABEL.ZONE },
  { key: TASK_BOARD_CATEGORY.QUICK, label: TASK_CATEGORY_LABEL.QUICK },
];

type TaskFilterBarProps = {
  category: TaskBoardCategoryFilter;
  onCategoryChange: (value: TaskBoardCategoryFilter) => void;
  scope: TaskAssigneeScope;
  onScopeChange: (value: TaskAssigneeScope) => void;
  recurrence: RecurrenceFilter;
  onRecurrenceChange: (value: RecurrenceFilter) => void;
};

/**
 * Scope toggle (mine vs roommates) plus category chips for the task board.
 */
export function TaskFilterBar({
  category,
  onCategoryChange,
  scope,
  onScopeChange,
  recurrence,
  onRecurrenceChange,
}: TaskFilterBarProps) {
  return (
    <View className="gap-3">
      <View className="flex-row gap-2">
        <Pressable
          onPress={() => onScopeChange(scope === 'MINE' ? 'ALL' : 'MINE')}
          className={`flex-1 rounded-xl px-3 py-2 ${scope === 'MINE' ? 'bg-blue-50 border border-blue-300' : 'bg-gray-50 border border-gray-200'}`}>
          <Text className="text-center text-sm font-semibold text-gray-800">Mis tareas</Text>
        </Pressable>
        <Pressable
          onPress={() => onScopeChange(scope === 'OTHERS' ? 'ALL' : 'OTHERS')}
          className={`flex-1 rounded-xl px-3 py-2 ${scope === 'OTHERS' ? 'bg-blue-50 border border-blue-300' : 'bg-gray-50 border border-gray-200'}`}>
          <Text className="text-center text-sm font-semibold text-gray-800">Compañeros</Text>
        </Pressable>
      </View>

      <ToggleChipRow value={category} chips={CATEGORY_CHIPS} onChange={onCategoryChange} />

      <RecurrenceFilterChips value={recurrence} onChange={onRecurrenceChange} />
    </View>
  );
}

export function categoryLabel(category: TaskCategory): string {
  return TASK_CATEGORY_LABEL[category];
}
