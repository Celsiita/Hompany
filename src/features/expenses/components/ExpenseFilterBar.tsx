import { RecurrenceFilterChips, type RecurrenceFilter } from '@/components/ui/RecurrenceFilterChips';
import { ToggleChipRow } from '@/components/ui/ToggleChipRow';
import { Pressable, Text, View } from 'react-native';

import {
  EXPENSE_KIND,
  EXPENSE_KIND_LABEL,
} from '@/types/expense';
import type {
  ExpenseInvolvementFilter,
  ExpenseKindFilter,
} from '@/schemas/expense.schema';

const KIND_CHIPS: { key: Exclude<ExpenseKindFilter, 'ALL'>; label: string }[] = [
  { key: EXPENSE_KIND.GROCERY, label: EXPENSE_KIND_LABEL.GROCERY },
  { key: EXPENSE_KIND.HOUSE, label: EXPENSE_KIND_LABEL.HOUSE },
  { key: EXPENSE_KIND.PEER, label: EXPENSE_KIND_LABEL.PEER },
];

type ExpenseFilterBarProps = {
  involvement: ExpenseInvolvementFilter;
  onInvolvementChange: (value: ExpenseInvolvementFilter) => void;
  kind: ExpenseKindFilter;
  onKindChange: (value: ExpenseKindFilter) => void;
  recurrence: RecurrenceFilter;
  onRecurrenceChange: (value: RecurrenceFilter) => void;
};

/**
 * Personal debt toggle + kind chips for the open expenses board.
 */
export function ExpenseFilterBar({
  involvement,
  onInvolvementChange,
  kind,
  onKindChange,
  recurrence,
  onRecurrenceChange,
}: ExpenseFilterBarProps) {
  return (
    <View className="gap-3">
      <View className="flex-row gap-2">
        <Pressable
          onPress={() => onInvolvementChange(involvement === 'I_OWE' ? 'ALL' : 'I_OWE')}
          className={`flex-1 rounded-xl px-3 py-2 ${involvement === 'I_OWE' ? 'bg-blue-50 border border-blue-300' : 'bg-gray-50 border border-gray-200'}`}>
          <Text className="text-center text-sm font-semibold text-gray-800">Lo que debo</Text>
        </Pressable>
        <Pressable
          onPress={() => onInvolvementChange(involvement === 'THEY_OWE_ME' ? 'ALL' : 'THEY_OWE_ME')}
          className={`flex-1 rounded-xl px-3 py-2 ${involvement === 'THEY_OWE_ME' ? 'bg-blue-50 border border-blue-300' : 'bg-gray-50 border border-gray-200'}`}>
          <Text className="text-center text-sm font-semibold text-gray-800">Me deben</Text>
        </Pressable>
      </View>

      <ToggleChipRow value={kind} chips={KIND_CHIPS} onChange={onKindChange} />
      <RecurrenceFilterChips value={recurrence} onChange={onRecurrenceChange} />
    </View>
  );
}
