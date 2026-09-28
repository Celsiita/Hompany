import { Text, View } from 'react-native';
import { useState } from 'react';

import { DateTimePickerModal, formatDueDateTime } from '@/components/ui/DateTimePickerModal';
import { SafePressable } from '@/components/ui/SafePressable';
import { formatDueSummary } from '@/features/tasks/lib/countdown';
import { interactive, mergeStyles } from '@/lib/interactive-styles';
import {
  applyAllDayWindow,
  endOfLocalDay,
  formatHistoryDate,
  isRecurrenceCalendarDayEnabled,
  startOfLocalDay,
  type RecurrenceConfig,
  type RecurrenceKind,
} from '@/lib/recurrence';

type DueDateFieldsProps = {
  startsAt: Date;
  dueAt: Date;
  allDay: boolean;
  onStartsAtChange: (next: Date) => void;
  onDueAtChange: (next: Date) => void;
  onAllDayChange: (next: boolean) => void;
  recurrence?: RecurrenceKind;
  recurrenceConfig?: RecurrenceConfig;
};

type PickerTarget = 'start' | 'due';

/**
 * Schedule window: start (activation) + due (deadline), with optional all-day.
 */
export function DueDateFields({
  startsAt,
  dueAt,
  allDay,
  onStartsAtChange,
  onDueAtChange,
  onAllDayChange,
  recurrence = 'ONCE',
  recurrenceConfig = {},
}: DueDateFieldsProps) {
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const preview = formatDueSummary(dueAt.toISOString(), 'DEADLINE');
  const isPeriodic = recurrence !== 'ONCE';

  function toggleAllDay() {
    const next = !allDay;
    onAllDayChange(next);
    if (next) {
      const window = applyAllDayWindow(startsAt, dueAt);
      onStartsAtChange(window.startsAt);
      onDueAtChange(window.dueAt);
      return;
    }
    const start = new Date(startsAt);
    start.setHours(9, 0, 0, 0);
    const due = new Date(dueAt);
    due.setHours(23, 59, 0, 0);
    onStartsAtChange(start);
    onDueAtChange(due);
  }

  function applyPicked(next: Date) {
    if (pickerTarget === 'start') {
      let start = allDay ? startOfLocalDay(next) : next;
      let due = dueAt;
      if (start.getTime() > due.getTime()) {
        due = allDay ? endOfLocalDay(start) : new Date(start.getTime() + 60 * 60 * 1000);
      }
      onStartsAtChange(start);
      onDueAtChange(due);
      return;
    }
    let due = allDay ? endOfLocalDay(next) : next;
    let start = startsAt;
    if (due.getTime() < start.getTime()) {
      start = allDay ? startOfLocalDay(due) : new Date(due.getTime() - 60 * 60 * 1000);
    }
    onStartsAtChange(start);
    onDueAtChange(due);
  }

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-gray-700">Ventana temporal</Text>
      <SafePressable
        onPress={toggleAllDay}
        contentStyle={mergeStyles(
          interactive.borderedCard,
          interactive.rowBetween,
          allDay ? interactive.borderedCardActive : undefined,
        )}>
        <View className="flex-1 pr-2">
          <Text className="text-sm font-semibold text-gray-900">Todo el día</Text>
          <Text className="text-xs text-gray-500">Oculta la hora; inicio 00:00 · límite 23:59</Text>
        </View>
        <Text className="text-sm text-blue-700">{allDay ? '✓' : ''}</Text>
      </SafePressable>

      <SafePressable
        onPress={() => setPickerTarget('start')}
        contentStyle={interactive.borderedCard}>
        <Text className="text-xs font-semibold uppercase text-gray-500">
          {isPeriodic ? 'Inicio (primera ventana)' : 'Fecha de inicio'}
        </Text>
        <Text className="mt-1 text-sm font-semibold text-gray-900">
          {allDay ? formatHistoryDate(startsAt.toISOString()) : formatDueDateTime(startsAt)}
        </Text>
        <Text className="mt-0.5 text-xs text-gray-500">Desde cuándo se puede hacer</Text>
      </SafePressable>

      <SafePressable
        onPress={() => setPickerTarget('due')}
        contentStyle={interactive.borderedCard}>
        <Text className="text-xs font-semibold uppercase text-gray-500">
          {isPeriodic ? 'Límite (primera ventana)' : 'Fecha límite'}
        </Text>
        <Text className="mt-1 text-sm font-semibold text-gray-900">
          {allDay ? formatHistoryDate(dueAt.toISOString()) : formatDueDateTime(dueAt)}
        </Text>
        <Text className="mt-0.5 text-xs text-gray-500">{preview.label}</Text>
      </SafePressable>

      <DateTimePickerModal
        visible={pickerTarget !== null}
        title={pickerTarget === 'start' ? 'Fecha de inicio' : 'Fecha límite'}
        value={pickerTarget === 'start' ? startsAt : dueAt}
        mode={allDay ? 'date' : 'datetime'}
        onClose={() => setPickerTarget(null)}
        onConfirm={(next) => {
          applyPicked(next);
          setPickerTarget(null);
        }}
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
      />
    </View>
  );
}
