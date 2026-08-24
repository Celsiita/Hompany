import { Pressable, Text, View } from 'react-native';
import { useState } from 'react';

import { DateTimePickerModal, formatDueDateTime } from '@/components/ui/DateTimePickerModal';
import { formatDueSummary } from '@/features/tasks/lib/countdown';
import {
  applyDueModeToDate,
  defaultDueAtForMode,
  DUE_MODE_HINT,
  DUE_MODE_LABEL,
  isRecurrenceCalendarDayEnabled,
  type DueMode,
  type RecurrenceConfig,
  type RecurrenceKind,
} from '@/lib/recurrence';

type DueDateFieldsProps = {
  dueMode: DueMode;
  dueAt: Date;
  onDueModeChange: (mode: DueMode) => void;
  onDueAtChange: (next: Date) => void;
  recurrence?: RecurrenceKind;
  recurrenceConfig?: RecurrenceConfig;
};

/**
 * Shared due-mode selector + date picker + live absolute/relative preview.
 * EXECUTION defaults to tomorrow 09:00; DEADLINE to end-of-day on the current day.
 * Picker time is kept as edited (not overwritten by due-mode stamps).
 */
export function DueDateFields({
  dueMode,
  dueAt,
  onDueModeChange,
  onDueAtChange,
  recurrence = 'ONCE',
  recurrenceConfig = {},
}: DueDateFieldsProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const preview = formatDueSummary(dueAt.toISOString(), dueMode);
  const isPeriodic = recurrence !== 'ONCE';

  function selectMode(mode: DueMode) {
    if (mode === dueMode) {
      return;
    }
    onDueModeChange(mode);
    if (isPeriodic) {
      return;
    }
    onDueAtChange(
      mode === 'EXECUTION'
        ? defaultDueAtForMode('EXECUTION')
        : applyDueModeToDate(dueAt, 'DEADLINE'),
    );
  }

  const dateFieldLabel = isPeriodic
    ? dueMode === 'EXECUTION'
      ? 'Primer día de ejecución'
      : 'Primer vencimiento'
    : dueMode === 'EXECUTION'
      ? 'Día de ejecución'
      : 'Fecha y hora límite';

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-gray-700">Tipo de fecha</Text>
      <View className="flex-row gap-2">
        {(['DEADLINE', 'EXECUTION'] as DueMode[]).map((mode) => {
          const active = mode === dueMode;
          return (
            <Pressable
              key={mode}
              onPress={() => selectMode(mode)}
              className={`flex-1 rounded-xl border px-3 py-3 ${active ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
              <Text className="text-sm font-semibold text-gray-900">{DUE_MODE_LABEL[mode]}</Text>
              <Text className="mt-1 text-[11px] text-gray-500">{DUE_MODE_HINT[mode]}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => setPickerOpen(true)}
        className="rounded-xl border border-gray-200 bg-white px-3 py-3">
        <Text className="text-sm font-medium text-gray-700">{dateFieldLabel}</Text>
        <Text className="mt-1 text-base font-semibold text-gray-900">
          {formatDueDateTime(dueAt)}
        </Text>
        <Text className={`mt-1 text-xs ${preview.isOverdue ? 'text-red-600' : 'text-blue-700'}`}>
          {preview.label}
        </Text>
      </Pressable>

      <DateTimePickerModal
        visible={pickerOpen}
        value={dueAt}
        title={dateFieldLabel}
        isDayEnabled={
          isPeriodic
            ? (year, monthIndex, day) =>
                isRecurrenceCalendarDayEnabled(
                  recurrence,
                  recurrenceConfig,
                  year,
                  monthIndex,
                  day,
                )
            : undefined
        }
        onClose={() => setPickerOpen(false)}
        onConfirm={onDueAtChange}
      />
    </View>
  );
}
