import { useMemo, useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { RecurrenceEditor } from '@/components/ui/RecurrenceEditor';
import { SafePressable } from '@/components/ui/SafePressable';
import { ScheduleRangeCalendar } from '@/components/ui/ScheduleRangeCalendar';
import {
  parseTimeInput,
  sanitizeTimeDraft,
} from '@/components/ui/DateTimePickerModal';
import { interactive, mergeStyles } from '@/lib/interactive-styles';
import {
  buildScheduleFromRange,
  formatHistoryDate,
  localDateKey,
  startOfLocalDay,
  validateScheduleRangeAgainstRecurrence,
  type RecurrenceConfig,
  type RecurrenceKind,
} from '@/lib/recurrence';

type ScheduleEditorProps = {
  startsAt: Date;
  dueAt: Date;
  allDay: boolean;
  onStartsAtChange: (next: Date) => void;
  onDueAtChange: (next: Date) => void;
  onAllDayChange: (next: boolean) => void;
  recurrence: RecurrenceKind;
  recurrenceConfig: RecurrenceConfig;
  onRecurrenceChange: (value: RecurrenceKind) => void;
  onConfigChange: (value: RecurrenceConfig) => void;
  compact?: boolean;
};

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function formatRangeLabel(start: Date, end: Date): string {
  const a = formatHistoryDate(start.toISOString());
  const b = formatHistoryDate(end.toISOString());
  if (localDateKey(start) === localDateKey(end)) {
    return a;
  }
  return `${a} → ${b}`;
}

/**
 * First occurrence (calendar range → hours) then periodicity.
 */
export function ScheduleEditor({
  startsAt,
  dueAt,
  allDay,
  onStartsAtChange,
  onDueAtChange,
  onAllDayChange,
  recurrence,
  recurrenceConfig,
  onRecurrenceChange,
  onConfigChange,
  compact = false,
}: ScheduleEditorProps) {
  const rangeStart = startOfLocalDay(startsAt);
  const rangeEnd = startOfLocalDay(dueAt);
  const [startTimeText, setStartTimeText] = useState(
    () => `${pad(startsAt.getHours())}:${pad(startsAt.getMinutes())}`,
  );
  const [endTimeText, setEndTimeText] = useState(
    () => `${pad(dueAt.getHours())}:${pad(dueAt.getMinutes())}`,
  );
  const [timeError, setTimeError] = useState<string | null>(null);

  const ordered = useMemo(() => {
    if (rangeStart.getTime() <= rangeEnd.getTime()) {
      return { start: rangeStart, end: rangeEnd };
    }
    return { start: rangeEnd, end: rangeStart };
  }, [rangeStart, rangeEnd]);

  const rangeRecurrenceError = useMemo(
    () =>
      validateScheduleRangeAgainstRecurrence({
        startsAt,
        dueAt,
        recurrence,
        recurrenceConfig,
      }),
    [startsAt, dueAt, recurrence, recurrenceConfig],
  );

  function applyRange(start: Date, end: Date) {
    const startTime = parseTimeInput(startTimeText);
    const endTime = parseTimeInput(endTimeText);
    const built = buildScheduleFromRange({
      rangeStart: start,
      rangeEnd: end,
      allDay,
      startTime: startTime
        ? new Date(0, 0, 0, startTime.hours, startTime.minutes)
        : startsAt,
      endTime: endTime ? new Date(0, 0, 0, endTime.hours, endTime.minutes) : dueAt,
    });
    onStartsAtChange(built.startsAt);
    onDueAtChange(built.dueAt);
  }

  function setAllDay(next: boolean) {
    onAllDayChange(next);
    const built = buildScheduleFromRange({
      rangeStart: ordered.start,
      rangeEnd: ordered.end,
      allDay: next,
      startTime: startsAt,
      endTime: dueAt,
    });
    onStartsAtChange(built.startsAt);
    onDueAtChange(built.dueAt);
    if (!next) {
      setStartTimeText(`${pad(built.startsAt.getHours())}:${pad(built.startsAt.getMinutes())}`);
      setEndTimeText(`${pad(built.dueAt.getHours())}:${pad(built.dueAt.getMinutes())}`);
    }
    setTimeError(null);
  }

  function commitTimes() {
    const startParsed = parseTimeInput(startTimeText);
    const endParsed = parseTimeInput(endTimeText);
    if (!startParsed || !endParsed) {
      setTimeError('Usa HH:mm (ej. 09:00 y 18:00)');
      return;
    }
    setTimeError(null);
    const built = buildScheduleFromRange({
      rangeStart: ordered.start,
      rangeEnd: ordered.end,
      allDay: false,
      startTime: new Date(0, 0, 0, startParsed.hours, startParsed.minutes),
      endTime: new Date(0, 0, 0, endParsed.hours, endParsed.minutes),
    });
    onStartsAtChange(built.startsAt);
    onDueAtChange(built.dueAt);
  }

  return (
    <View className="gap-4">
      <View className="gap-2">
        <Text className="text-sm font-medium text-gray-700">1. Primera vez (fechas)</Text>
        <Text className="text-xs text-gray-500">
          Seleccionado: {formatRangeLabel(ordered.start, ordered.end)}
        </Text>
        <ScheduleRangeCalendar
          rangeStart={ordered.start}
          rangeEnd={ordered.end}
          onChangeRange={applyRange}
        />
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-gray-700">2. Horas</Text>
        <SafePressable
          onPress={() => setAllDay(!allDay)}
          contentStyle={mergeStyles(
            interactive.borderedCard,
            interactive.rowBetween,
            allDay ? interactive.borderedCardActive : undefined,
          )}>
          <View className="flex-1 pr-2">
            <Text className="text-sm font-semibold text-gray-900">Todo el día</Text>
            <Text className="text-xs text-gray-500">
              Inicio 00:00 del primer día · fin 23:59 del último
            </Text>
          </View>
          <Text className="text-sm text-teal-700">{allDay ? '✓' : ''}</Text>
        </SafePressable>

        {!allDay ? (
          <View className="gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
            <Text className="text-xs text-gray-600">
              Hora de inicio (primer día) · Hora de fin (último día)
            </Text>
            <View className="flex-row gap-3">
              <View className="flex-1 gap-1">
                <Text className="text-xs font-semibold text-gray-500">Inicio</Text>
                <TextInput
                  value={startTimeText}
                  onChangeText={(raw) => setStartTimeText(sanitizeTimeDraft(raw))}
                  onBlur={commitTimes}
                  keyboardType="number-pad"
                  maxLength={5}
                  placeholder="09:00"
                  placeholderTextColor="#9ca3af"
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-center text-base font-semibold text-gray-900"
                />
              </View>
              <View className="flex-1 gap-1">
                <Text className="text-xs font-semibold text-gray-500">Fin</Text>
                <TextInput
                  value={endTimeText}
                  onChangeText={(raw) => setEndTimeText(sanitizeTimeDraft(raw))}
                  onBlur={commitTimes}
                  keyboardType="number-pad"
                  maxLength={5}
                  placeholder="18:00"
                  placeholderTextColor="#9ca3af"
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-center text-base font-semibold text-gray-900"
                />
              </View>
            </View>
            {timeError ? <Text className="text-xs text-red-600">{timeError}</Text> : null}
          </View>
        ) : null}
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-gray-700">3. Periodicidad</Text>
        <RecurrenceEditor
          recurrence={recurrence}
          config={recurrenceConfig}
          onRecurrenceChange={onRecurrenceChange}
          onConfigChange={onConfigChange}
          compact={compact}
          seedFrom={ordered.start}
        />
        {rangeRecurrenceError ? (
          <Text className="text-xs text-red-600">{rangeRecurrenceError}</Text>
        ) : null}
      </View>
    </View>
  );
}
