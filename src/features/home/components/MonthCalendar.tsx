import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { DayAgendaSheet } from '@/features/home/components/DayAgendaSheet';
import {
  agendaItemsForDay,
  buildAgendaItems,
  startOfDay,
  type AgendaItem,
} from '@/features/home/lib/agenda-items';
import {
  buildMonthCells,
  formatMonthTitle,
  shiftMonth,
} from '@/features/home/lib/month-calendar';
import { expenseFocusHref, taskFocusHref } from '@/lib/navigation/board-focus';
import { useIconPack } from '@/providers/IconPackProvider';
import type { ExpenseWithRelations, TaskWithRelations } from '@/types/database.types';

type MonthCalendarProps = {
  tasks: TaskWithRelations[];
  expenses: ExpenseWithRelations[];
  currentUserId?: string | null;
  now?: Date;
};

const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

/**
 * Full-month calendar with mine/roommate color dots and day detail navigation.
 */
export function MonthCalendar({
  tasks,
  expenses,
  currentUserId,
  now = new Date(),
}: MonthCalendarProps) {
  const { pack } = useIconPack();
  const [visibleMonth, setVisibleMonth] = useState(() => startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const items = useMemo(
    () => buildAgendaItems({ tasks, expenses, currentUserId, pack }),
    [tasks, expenses, currentUserId, pack],
  );

  const cells = useMemo(() => buildMonthCells(visibleMonth, now), [visibleMonth, now]);
  const selectedItems = selectedDay ? agendaItemsForDay(items, selectedDay) : [];

  function openItem(item: AgendaItem) {
    setSelectedDay(null);
    router.push(item.kind === 'task' ? taskFocusHref(item.entityId) : expenseFocusHref(item.entityId));
  }

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-gray-500">Calendario mensual</Text>
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => setVisibleMonth((month) => shiftMonth(month, -1))}
            accessibilityLabel="Mes anterior"
            className="h-9 w-9 items-center justify-center rounded-full bg-gray-100">
            <Text className="text-base font-bold text-gray-700">‹</Text>
          </Pressable>
          <Pressable
            onPress={() => setVisibleMonth((month) => shiftMonth(month, 1))}
            accessibilityLabel="Mes siguiente"
            className="h-9 w-9 items-center justify-center rounded-full bg-gray-100">
            <Text className="text-base font-bold text-gray-700">›</Text>
          </Pressable>
        </View>
      </View>

      <Text className="text-base font-semibold text-gray-900">{formatMonthTitle(visibleMonth)}</Text>
      <Text className="text-xs text-gray-500">Azul = tuyo · Verde = compañeros</Text>

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
              return <View key={`pad-${index}`} className="h-12 w-[14.28%]" />;
            }

            const dayItems = agendaItemsForDay(items, cell.date);
            const hasMine = dayItems.some((item) => item.mine);
            const hasOthers = dayItems.some((item) => !item.mine);
            const selected =
              selectedDay !== null && startOfDay(selectedDay).getTime() === cell.date.getTime();

            return (
              <Pressable
                key={cell.date.toISOString()}
                onPress={() => setSelectedDay(cell.date)}
                className={`h-12 w-[14.28%] items-center justify-center rounded-lg ${
                  selected ? 'bg-blue-50' : ''
                } ${cell.isToday ? 'border border-blue-300' : ''}`}>
                <Text
                  className={`text-sm ${
                    cell.isToday ? 'font-bold text-blue-800' : 'font-medium text-gray-800'
                  }`}>
                  {cell.date.getDate()}
                </Text>
                <View className="mt-0.5 h-1.5 flex-row items-center gap-0.5">
                  {hasMine ? <View className="h-1.5 w-1.5 rounded-full bg-blue-600" /> : null}
                  {hasOthers ? <View className="h-1.5 w-1.5 rounded-full bg-teal-600" /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <DayAgendaSheet
        visible={selectedDay !== null}
        day={selectedDay}
        items={selectedItems}
        onClose={() => setSelectedDay(null)}
        onOpenItem={openItem}
      />
    </View>
  );
}
