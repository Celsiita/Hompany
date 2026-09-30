import { View } from 'react-native';

import { FilterGroup } from '@/components/ui/FilterGroup';
import { FilterTogglePair } from '@/components/ui/FilterTogglePair';
import { ToggleChipRow } from '@/components/ui/ToggleChipRow';
import {
  DEFAULT_AGENDA_CATEGORY_FILTER,
  DEFAULT_AGENDA_VIEW_SCOPE,
  type AgendaCategoryFilter,
  type AgendaViewScope,
} from '@/features/home/lib/agenda-items';

type AgendaScopeBarProps = {
  viewScope: AgendaViewScope;
  categories: AgendaCategoryFilter;
  onViewScopeChange: (scope: AgendaViewScope) => void;
  onCategoriesChange: (categories: AgendaCategoryFilter) => void;
};

const SCOPE_OPTIONS = [
  { value: 'mine' as const, label: 'Mis cosas' },
  { value: 'others' as const, label: 'Compañeros' },
] as const;

const CATEGORY_CHIPS: { key: 'tasks' | 'expenses'; label: string; accent: 'blue' | 'amber' }[] = [
  { key: 'tasks', label: 'Tareas', accent: 'blue' },
  { key: 'expenses', label: 'Gastos', accent: 'amber' },
];

/**
 * Agenda filters with the same labeled pill format as Tareas and Gastos.
 */
export function AgendaScopeBar({
  viewScope,
  categories,
  onViewScopeChange,
  onCategoriesChange,
}: AgendaScopeBarProps) {
  const categoryValue: 'tasks' | 'expenses' | 'ALL' =
    categories.tasks && !categories.expenses
      ? 'tasks'
      : categories.expenses && !categories.tasks
        ? 'expenses'
        : 'ALL';

  return (
    <View className="gap-3">
      <FilterGroup label="Alcance">
        <FilterTogglePair value={viewScope} options={SCOPE_OPTIONS} onChange={onViewScopeChange} />
      </FilterGroup>
      <FilterGroup label="Tipo">
        <ToggleChipRow
          value={categoryValue}
          chips={CATEGORY_CHIPS}
          onChange={(next) => {
            if (next === 'ALL') {
              onCategoriesChange({ tasks: true, expenses: true });
              return;
            }
            onCategoriesChange({
              tasks: next === 'tasks',
              expenses: next === 'expenses',
            });
          }}
        />
      </FilterGroup>
    </View>
  );
}

export { DEFAULT_AGENDA_CATEGORY_FILTER, DEFAULT_AGENDA_VIEW_SCOPE };
