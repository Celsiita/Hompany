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
import { useLocale } from '@/providers/LocaleProvider';

type AgendaScopeBarProps = {
  viewScope: AgendaViewScope;
  categories: AgendaCategoryFilter;
  lifeFocus: AgendaLifeFocus;
  onViewScopeChange: (scope: AgendaViewScope) => void;
  onCategoriesChange: (categories: AgendaCategoryFilter) => void;
  onLifeFocusChange: (focus: AgendaLifeFocus) => void;
};

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
  const { t } = useLocale();
  const scopeOptions = [
    { value: 'mine' as const, label: t('filters.mine') },
    { value: 'others' as const, label: t('filters.others') },
  ];
  const categoryChips: { key: 'tasks' | 'expenses'; label: string; accent: 'blue' | 'amber' }[] = [
    { key: 'tasks', label: t('filters.tasks'), accent: 'blue' },
    { key: 'expenses', label: t('filters.expenses'), accent: 'amber' },
  ];
  const lifeChips: { key: 'absences' | 'silence' | 'visits'; label: string }[] = [
    { key: 'absences', label: t('filters.absences') },
    { key: 'silence', label: t('filters.silence') },
    { key: 'visits', label: t('filters.visits') },
  ];

  const categoryValue: 'tasks' | 'expenses' | 'ALL' =
    categories.tasks && !categories.expenses
      ? 'tasks'
      : categories.expenses && !categories.tasks
        ? 'expenses'
        : 'ALL';

  return (
    <View className="gap-3">
      <FilterGroup label={t('filters.who')}>
        <FilterTogglePair value={viewScope} options={scopeOptions} onChange={onViewScopeChange} />
      </FilterGroup>
      <FilterGroup label={t('filters.what')}>
        <ToggleChipRow
          value={categoryValue}
          chips={categoryChips}
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
      <FilterGroup label={t('filters.life')}>
        <ToggleChipRow
          value={lifeFocus}
          chips={lifeChips}
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
