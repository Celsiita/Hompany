import { View } from 'react-native';

import { FilterGroup } from '@/components/ui/FilterGroup';
import { FilterTogglePair } from '@/components/ui/FilterTogglePair';
import { RecurrenceFilterChips, type RecurrenceFilter } from '@/components/ui/RecurrenceFilterChips';
import { ExpenseStatusFilterChips, type ExpenseBoardStatusFilter } from '@/components/ui/StatusFilterChips';
import { ToggleChipRow } from '@/components/ui/ToggleChipRow';
import { EXPENSE_KIND, EXPENSE_KIND_LABEL } from '@/types/expense';
import type { HomeItemType } from '@/schemas/item-type.schema';
import type { ExpenseInvolvementFilter, ExpenseKindFilter } from '@/schemas/expense.schema';

const INVOLVEMENT_OPTIONS = [
  { value: 'I_OWE' as const, label: 'Mis deudas' },
  { value: 'THEY_OWE_ME' as const, label: 'Mis cobros' },
] as const;

type ExpenseFilterBarProps = {
  involvement: ExpenseInvolvementFilter;
  onInvolvementChange: (value: ExpenseInvolvementFilter) => void;
  kind: ExpenseKindFilter;
  onKindChange: (value: ExpenseKindFilter) => void;
  customTypes?: HomeItemType[];
  recurrence: RecurrenceFilter;
  onRecurrenceChange: (value: RecurrenceFilter) => void;
  status: ExpenseBoardStatusFilter;
  onStatusChange: (value: ExpenseBoardStatusFilter) => void;
  history?: boolean;
};

/**
 * Expense board filters: involvement, kind, recurrence and status (shared pill format).
 */
export function ExpenseFilterBar({
  involvement,
  onInvolvementChange,
  kind,
  onKindChange,
  customTypes = [],
  recurrence,
  onRecurrenceChange,
  status,
  onStatusChange,
  history = false,
}: ExpenseFilterBarProps) {
  const kindChips = [
    { key: EXPENSE_KIND.GROCERY, label: EXPENSE_KIND_LABEL.GROCERY },
    { key: EXPENSE_KIND.HOUSE, label: EXPENSE_KIND_LABEL.HOUSE },
    { key: EXPENSE_KIND.PEER, label: EXPENSE_KIND_LABEL.PEER },
    ...customTypes.map((type) => ({ key: type.id, label: type.name })),
  ];

  return (
    <View className="gap-3">
      <FilterGroup label="Alcance">
        <FilterTogglePair
          value={involvement === 'I_OWE' || involvement === 'THEY_OWE_ME' ? involvement : 'ALL'}
          options={INVOLVEMENT_OPTIONS}
          onChange={onInvolvementChange}
        />
      </FilterGroup>
      <FilterGroup label="Tipo">
        <ToggleChipRow value={kind} chips={kindChips} onChange={onKindChange} />
      </FilterGroup>
      <FilterGroup label="Periodicidad">
        <RecurrenceFilterChips value={recurrence} onChange={onRecurrenceChange} />
      </FilterGroup>
      <FilterGroup label="Estado">
        <ExpenseStatusFilterChips value={status} onChange={onStatusChange} history={history} />
      </FilterGroup>
    </View>
  );
}
