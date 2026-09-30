import { View } from 'react-native';

import { FilterGroup } from '@/components/ui/FilterGroup';
import { FilterTogglePair } from '@/components/ui/FilterTogglePair';
import { ToggleChipRow } from '@/components/ui/ToggleChipRow';
import {
  DEFAULT_AGENDA_CATEGORY_FILTER,
  DEFAULT_AGENDA_LIFE_FOCUS,
  DEFAULT_AGENDA_VIEW_SCOPE,
  type AgendaCategoryFilter,
  type AgendaLifeFocus,
  type AgendaViewScope,
} from '@/features/home/lib/agenda-items';

type AgendaScopeBarProps = {
  viewScope: AgendaViewScope;
  categories: AgendaCategoryFilter;
  lifeFocus: AgendaLifeFocus;
  onViewScopeChange: (scope: AgendaViewScope) => void;
  onCategoriesChange: (categories: AgendaCategoryFilter) => void;
  onLifeFocusChange: (focus: AgendaLifeFocus) => void;
};

const SCOPE_OPTIONS = [
  { value: 'mine' as const, label: 'Mis cosas' },
  { value: 'others' as const, label: 'Compañeros' },
] as const;

const CATEGORY_CHIPS: { key: 'tasks' | 'expenses'; label: string; accent: 'blue' | 'amber' }[] = [
  { key: 'tasks', label: 'Tareas', accent: 'blue' },
  { key: 'expenses', label: 'Gastos', accent: 'amber' },
];

const LIFE_CHIPS: { key: 'absences' | 'silence' | 'visits'; label: string }[] = [
  { key: 'absences', label: 'Ausencias' },
  { key: 'silence', label: 'Silencio' },
  { key: 'visits', label: 'Visitas' },
];

/**
 * Agenda filters: Mis cosas / Compañeros, Tareas / Gastos, Ausencias / Silencio / Visitas.
 */
export function AgendaScopeBar({
  viewScope,
  categories,
  lifeFocus,
  onViewScopeChange,
  onCategoriesChange,
  onLifeFocusChange,
}: AgendaScopeBarProps) {
  const categoryValue: 'tasks' | 'expenses' | 'ALL' =
    categories.tasks && !categories.expenses
      ? 'tasks'
      : categories.expenses && !categories.tasks
        ? 'expenses'
        : 'ALL';

  return (
    <View className="gap-3">
      <FilterGroup label="Quién">
        <FilterTogglePair value={viewScope} options={SCOPE_OPTIONS} onChange={onViewScopeChange} />
      </FilterGroup>
      <FilterGroup label="Qué">
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
      <FilterGroup label="Vida del piso">
        <ToggleChipRow
          value={lifeFocus}
          chips={LIFE_CHIPS}
          onChange={(next) => onLifeFocusChange(next === 'ALL' ? 'ALL' : next)}
        />
      </FilterGroup>
    </View>
  );
}

export {
  DEFAULT_AGENDA_CATEGORY_FILTER,
  DEFAULT_AGENDA_LIFE_FOCUS,
  DEFAULT_AGENDA_VIEW_SCOPE,
};
