import { ToggleChipRow } from '@/components/ui/ToggleChipRow';

import type { RecurrenceKind } from '@/lib/recurrence';
import { displayRecurrenceKind } from '@/lib/i18n/display';
import { useLocale } from '@/providers/LocaleProvider';

export type RecurrenceFilter = 'ALL' | RecurrenceKind;

type RecurrenceFilterChipsProps = {
  value: RecurrenceFilter;
  onChange: (value: RecurrenceFilter) => void;
};

/**
 * Recurrence pills without "Todas". Clearing the active chip shows every period.
 */
export function RecurrenceFilterChips({ value, onChange }: RecurrenceFilterChipsProps) {
  const { t } = useLocale();
  const chips: { key: RecurrenceKind; label: string }[] = [
    { key: 'ONCE', label: displayRecurrenceKind('ONCE', t) },
    { key: 'DAILY', label: displayRecurrenceKind('DAILY', t) },
    { key: 'WEEKLY', label: displayRecurrenceKind('WEEKLY', t) },
    { key: 'MONTHLY', label: displayRecurrenceKind('MONTHLY', t) },
    { key: 'YEARLY', label: displayRecurrenceKind('YEARLY', t) },
  ];
  return <ToggleChipRow value={value} chips={chips} onChange={onChange} />;
}
