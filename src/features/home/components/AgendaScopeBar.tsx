import { View } from 'react-native';

import { FilterGroup } from '@/components/ui/FilterGroup';
import { FilterTogglePair } from '@/components/ui/FilterTogglePair';
import { ToggleChipRow } from '@/components/ui/ToggleChipRow';
import {
  DEFAULT_AGENDA_CATEGORY_FILTER,
  DEFAULT_AGENDA_VIEW_SCOPE,
  type AgendaCategoryFilter,
  type AgendaExpenseDirection,
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

const MONEY_OPTIONS = [
  { value: 'owe' as const, label: 'Debes' },
  { value: 'credit' as const, label: 'Te deben' },
] as const;

/**
 * Agenda filters: Mis cosas / Compañeros, Tareas / Gastos, Debes / Te deben.
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

  const moneyValue: AgendaExpenseDirection = categories.expenseDirection;

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
              onCategoriesChange({
                tasks: true,
                expenses: true,
                expenseDirection: categories.expenseDirection,
              });
              return;
            }
            if (next === 'tasks') {
              onCategoriesChange({
                tasks: true,
                expenses: false,
                expenseDirection: 'ALL',
              });
              return;
            }
            onCategoriesChange({
              tasks: false,
              expenses: true,
              expenseDirection: categories.expenseDirection,
            });
          }}
        />
      </FilterGroup>
      {categories.expenses ? (
        <FilterGroup label="Dinero">
          <FilterTogglePair
            value={moneyValue}
            options={MONEY_OPTIONS}
            onChange={(next) => {
              onCategoriesChange({
                ...categories,
                expenses: true,
                expenseDirection: next === 'ALL' ? 'ALL' : next,
              });
            }}
          />
        </FilterGroup>
      ) : null}
    </View>
  );
}

export { DEFAULT_AGENDA_CATEGORY_FILTER, DEFAULT_AGENDA_VIEW_SCOPE };
