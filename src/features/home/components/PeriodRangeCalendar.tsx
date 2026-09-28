import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { startOfDay } from '@/features/home/lib/agenda-items';
import { isMineBlockedDay } from '@/features/home/lib/period-range-calendar';
import type { PeriodRangeMark } from '@/features/home/lib/period-range-calendar';
import {
  buildMonthCells,
  formatMonthTitle,
  shiftMonth,
} from '@/features/home/lib/month-calendar';
import { interactive, mergeStyles, palette } from '@/lib/interactive-styles';
import { localDateKey } from '@/lib/recurrence';

const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export type { PeriodRangeMark } from '@/features/home/lib/period-range-calendar';

type PeriodRangeCalendarProps = {
  visibleMonth: Date;
  onMonthChange: (month: Date) => void;
  marks: PeriodRangeMark[];
  rangeStart: Date | null;
  rangeEnd: Date | null;
  onSelectDate: (date: Date) => void;
};

function dateInRange(date: Date, start: string, end: string): boolean {
  const key = localDateKey(date);
  return key >= start && key <= end;
}

function markStyle(tone: PeriodRangeMark['tone'], blocked: boolean): ViewStyle {
  if (blocked) {
    return tone === 'mine-silence' || tone === 'silence'
      ? styles.blockedSilence
      : styles.blockedAbsence;
  }
  switch (tone) {
    case 'silence':
      return styles.silence;
    case 'absence':
      return styles.absence;
    case 'mine-silence':
      return styles.mineSilence;
    case 'mine-absence':
      return styles.mineAbsence;
    default:
      return styles.plain;
  }
}

function selectionStyle(date: Date, rangeStart: Date | null, rangeEnd: Date | null): ViewStyle {
  if (!rangeStart) {
    return styles.plain;
  }
  const startKey = localDateKey(rangeStart);
  const endKey = localDateKey(rangeEnd ?? rangeStart);
  const key = localDateKey(date);
  const from = startKey <= endKey ? startKey : endKey;
  const to = startKey <= endKey ? endKey : startKey;
  if (key < from || key > to) {
    return styles.plain;
  }
  return styles.selected;
}
/**
 * Month picker for registering date ranges with existing periods highlighted.
 */
export function PeriodRangeCalendar({
  visibleMonth,
  onMonthChange,
  marks,
  rangeStart,
  rangeEnd,
  onSelectDate,
}: PeriodRangeCalendarProps) {
  const cells = useMemo(() => buildMonthCells(visibleMonth, new Date()), [visibleMonth]);

  function toneForDay(day: Date): PeriodRangeMark['tone'] | null {
    const hit = marks.find((mark) => dateInRange(day, mark.start_date, mark.end_date));
    return hit?.tone ?? null;
  }

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-gray-900">{formatMonthTitle(visibleMonth)}</Text>
        <View className="flex-row gap-2">
          <Pressable
            cssInterop={false}
            onPress={() => onMonthChange(shiftMonth(visibleMonth, -1))}
            style={styles.navButton}>
            <Text className="text-base font-bold text-gray-700">‹</Text>
          </Pressable>
          <Pressable
            cssInterop={false}
            onPress={() => onMonthChange(shiftMonth(visibleMonth, 1))}
            style={styles.navButton}>
            <Text className="text-base font-bold text-gray-700">›</Text>
          </Pressable>
        </View>
      </View>

      <View className="rounded-xl border border-gray-200 bg-white p-2">
        <View className="mb-1 flex-row">
          {WEEKDAY_LABELS.map((label) => (
            <View key={label} className="flex-1 items-center py-1">
              <Text className="text-[10px] font-bold uppercase text-gray-400">{label}</Text>
            </View>
          ))}
        </View>
        <View className="flex-row flex-wrap">
          {cells.map((cell, index) => {
            if (!cell.date) {
              return <View key={`pad-${index}`} style={styles.cellSlot} />;
            }
            const day = cell.date;
            const tone = toneForDay(day);
            const blocked = isMineBlockedDay(day, marks);
            return (
              <View key={day.toISOString()} style={styles.cellSlot}>
                <Pressable
                  cssInterop={false}
                  disabled={blocked}
                  onPress={() => onSelectDate(startOfDay(day))}
                  style={mergeStyles(
                    styles.dayButton,
                    interactive.center,
                    tone ? markStyle(tone, blocked) : undefined,
                    selectionStyle(day, rangeStart, rangeEnd),
                    blocked ? styles.blocked : undefined,
                  )}>
                  <Text style={blocked ? styles.dayLabelBlocked : styles.dayLabel}>
                    {day.getDate()}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navButton: {
    height: 32,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    backgroundColor: palette.gray100,
  },
  cellSlot: {
    width: '14.28%',
    height: 44,
    padding: 2,
  },
  dayButton: {
    flex: 1,
    borderRadius: 8,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  dayLabelBlocked: {
    color: '#6b7280',
  },
  plain: {},
  selected: {
    borderWidth: 2,
    borderColor: palette.blue400,
  },
  silence: { backgroundColor: palette.violet200 },
  absence: { backgroundColor: palette.amber200 },
  mineSilence: {
    backgroundColor: palette.violet400,
    borderWidth: 1,
    borderColor: palette.violet500,
  },
  mineAbsence: {
    backgroundColor: palette.amber400,
    borderWidth: 1,
    borderColor: palette.amber500,
  },
  blockedSilence: { backgroundColor: palette.violet300 },
  blockedAbsence: { backgroundColor: palette.amber300 },
  blocked: { opacity: 0.6 },
});

/**
 * Builds calendar marks from stored periods for the registration UI.
 */
export function buildPeriodMarks(
  periods: readonly { start_date: string; end_date: string; user_id: string }[],
  currentUserId: string | null | undefined,
  tone: 'silence' | 'absence',
): PeriodRangeMark[] {
  return periods.map((period) => ({
    start_date: period.start_date,
    end_date: period.end_date,
    tone:
      period.user_id === currentUserId
        ? tone === 'silence'
          ? 'mine-silence'
          : 'mine-absence'
        : tone,
  }));
}
