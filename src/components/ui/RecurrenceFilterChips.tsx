import { ToggleChipRow } from '@/components/ui/ToggleChipRow';

import { RECURRENCE_KIND_LABEL, type RecurrenceKind } from '@/lib/recurrence';

export type RecurrenceFilter = 'ALL' | RecurrenceKind;

const CHIPS: { key: RecurrenceKind; label: string }[] = [
  { key: 'ONCE', label: RECURRENCE_KIND_LABEL.ONCE },
  { key: 'DAILY', label: RECURRENCE_KIND_LABEL.DAILY },
  { key: 'WEEKLY', label: RECURRENCE_KIND_LABEL.WEEKLY },
  { key: 'MONTHLY', label: RECURRENCE_KIND_LABEL.MONTHLY },
];

type RecurrenceFilterChipsProps = {
  value: RecurrenceFilter;
  onChange: (value: RecurrenceFilter) => void;
};

/**
 * Recurrence pills without "Todas". Clearing the active chip shows every period.
 */
export function RecurrenceFilterChips({ value, onChange }: RecurrenceFilterChipsProps) {
  return <ToggleChipRow value={value} chips={CHIPS} onChange={onChange} />;
}
