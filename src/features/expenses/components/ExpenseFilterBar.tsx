import { View } from 'react-native';

import { FilterGroup } from '@/components/ui/FilterGroup';
import { FilterTogglePair } from '@/components/ui/FilterTogglePair';
import { RecurrenceFilterChips, type RecurrenceFilter } from '@/components/ui/RecurrenceFilterChips';
import { ExpenseStatusFilterChips, type ExpenseBoardStatusFilter } from '@/components/ui/StatusFilterChips';
import { ToggleChipRow } from '@/components/ui/ToggleChipRow';
import { displayExpenseKind } from '@/lib/i18n/display';
import { useLocale } from '@/providers/LocaleProvider';
import { EXPENSE_KIND } from '@/types/expense';
import type { HomeItemType } from '@/schemas/item-type.schema';
import type { ExpenseInvolvementFilter, ExpenseKindFilter } from '@/schemas/expense.schema';

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
  const { t } = useLocale();
  const involvementOptions = [
    { value: 'I_OWE' as const, label: t('filters.myDebts') },
    { value: 'THEY_OWE_ME' as const, label: t('filters.myCredits') },
  ] as const;
  const kindChips = [
    { key: EXPENSE_KIND.GROCERY, label: displayExpenseKind(EXPENSE_KIND.GROCERY, t) },
    { key: EXPENSE_KIND.HOUSE, label: displayExpenseKind(EXPENSE_KIND.HOUSE, t) },
    { key: EXPENSE_KIND.PEER, label: displayExpenseKind(EXPENSE_KIND.PEER, t) },
    ...customTypes.map((type) => ({ key: type.id, label: type.name })),
  ];

  return (
    <View className="gap-3">
      <FilterGroup label={t('filters.scope')}>
        <FilterTogglePair
          value={involvement === 'I_OWE' || involvement === 'THEY_OWE_ME' ? involvement : 'ALL'}
          options={involvementOptions}
          onChange={onInvolvementChange}
        />
      </FilterGroup>
      <FilterGroup label={t('filters.type')}>
        <ToggleChipRow value={kind} chips={kindChips} onChange={onKindChange} />
      </FilterGroup>
      <FilterGroup label={t('filters.recurrence')}>
        <RecurrenceFilterChips value={recurrence} onChange={onRecurrenceChange} />
      </FilterGroup>
      <FilterGroup label={t('filters.status')}>
        <ExpenseStatusFilterChips value={status} onChange={onStatusChange} history={history} />
      </FilterGroup>
    </View>
  );
}
