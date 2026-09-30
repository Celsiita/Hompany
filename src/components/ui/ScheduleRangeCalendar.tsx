import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import {
  buildMonthCells,
  formatMonthTitle,
  shiftMonth,
} from '@/features/home/lib/month-calendar';
import { mergeStyles, palette } from '@/lib/interactive-styles';
import { localDateKey, startOfLocalDay } from '@/lib/recurrence';

type ScheduleRangeCalendarProps = {
  rangeStart: Date;
  rangeEnd: Date;
  onChangeRange: (start: Date, end: Date) => void;
};

/**
 * Month calendar: tap one day (single) or two days (range) for the first occurrence.
 */
export function ScheduleRangeCalendar({
  rangeStart,
  rangeEnd,
  onChangeRange,
}: ScheduleRangeCalendarProps) {
  const [visibleMonth, setVisibleMonth] = useState(() => startOfLocalDay(rangeStart));
  const [pickingEnd, setPickingEnd] = useState(false);
  const cells = useMemo(() => buildMonthCells(visibleMonth, new Date()), [visibleMonth]);

  const startKey = localDateKey(rangeStart);
  const endKey = localDateKey(rangeEnd);
  const fromKey = startKey <= endKey ? startKey : endKey;
  const toKey = startKey <= endKey ? endKey : startKey;

  function selectDay(date: Date) {
    const day = startOfLocalDay(date);
    if (!pickingEnd) {
      onChangeRange(day, day);
      setPickingEnd(true);
      return;
    }
    onChangeRange(rangeStart, day);
    setPickingEnd(false);
  }

  function dayStyle(date: Date) {
    const key = localDateKey(date);
    const inRange = key >= fromKey && key <= toKey;
    const isEdge = key === fromKey || key === toKey;
    return mergeStyles(
      {
        borderRadius: 8,
        paddingVertical: 8,
        alignItems: 'center' as const,
        backgroundColor: inRange ? (isEdge ? palette.blue600 : '#dbeafe') : palette.gray50,
      },
    );
  }

  return (
    <View className="gap-2 rounded-xl border border-stone-200 bg-white p-3">
      <View className="flex-row items-center justify-between">
        <Pressable onPress={() => setVisibleMonth(shiftMonth(visibleMonth, -1))} className="px-3 py-2">
          <Text className="text-lg text-teal-700">‹</Text>
        </Pressable>
        <Text className="text-sm font-semibold capitalize text-stone-800">
          {formatMonthTitle(visibleMonth)}
        </Text>
        <Pressable onPress={() => setVisibleMonth(shiftMonth(visibleMonth, 1))} className="px-3 py-2">
          <Text className="text-lg text-teal-700">›</Text>
        </Pressable>
      </View>
      <View className="flex-row">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((label) => (
          <Text key={label} className="flex-1 text-center text-[10px] font-bold text-stone-400">
            {label}
          </Text>
        ))}
      </View>
      <View className="flex-row flex-wrap">
        {cells.map((cell, index) => (
          <View key={`${visibleMonth.getMonth()}-${index}`} style={{ width: '14.28%', padding: 2 }}>
            {cell.date ? (
              <Pressable onPress={() => selectDay(cell.date!)} style={dayStyle(cell.date)}>
                <Text
                  style={{
                    textAlign: 'center',
                    fontSize: 14,
                    fontWeight: '600',
                    color:
                      localDateKey(cell.date) === fromKey || localDateKey(cell.date) === toKey
                        ? palette.white
                        : '#1f2937',
                  }}>
                  {cell.date.getDate()}
                </Text>
              </Pressable>
            ) : (
              <View style={{ paddingVertical: 8 }} />
            )}
          </View>
        ))}
      </View>
      <Text className="text-xs text-stone-500">
        Toca un día, o dos días para un rango. {pickingEnd ? 'Elige el día final.' : ''}
      </Text>
    </View>
  );
}
