import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { DayAgendaSheet } from '@/features/home/components/DayAgendaSheet';
import { ExamCalendarBands } from '@/features/home/components/ExamCalendarBands';
import {
  agendaItemsForDay,
  buildAgendaItems,
  startOfDay,
  type AgendaItem,
  type AgendaScopeFilter,
} from '@/features/home/lib/agenda-items';
import {
  buildMonthCells,
  formatMonthTitle,
  shiftMonth,
} from '@/features/home/lib/month-calendar';
import { hasAbsencesOnDate } from '@/lib/absences';
import { examPeriodsOnDate, hasExamPeriodsOnDate } from '@/lib/exam-periods';
import { useIconPack } from '@/providers/IconPackProvider';
import type { HomeMemberWithProfile } from '@/features/home/api/homes-api';
import type { MemberAbsence } from '@/schemas/absence.schema';
import type { MemberExamPeriod } from '@/schemas/exam-period.schema';
import type { ExpenseWithRelations, TaskWithRelations } from '@/types/database.types';

type MonthCalendarProps = {
  tasks: TaskWithRelations[];
  expenses: ExpenseWithRelations[];
  absences?: MemberAbsence[];
  examPeriods?: MemberExamPeriod[];
  members?: HomeMemberWithProfile[];
  currentUserId?: string | null;
  scope?: AgendaScopeFilter;
  now?: Date;
  onOpenItem: (item: AgendaItem) => void;
};

const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

/**
 * Full-month calendar with task/expense dots and exam-period shaded bands.
 */
export function MonthCalendar({
  tasks,
  expenses,
  absences = [],
  examPeriods = [],
  members = [],
  currentUserId,
  scope,
  now = new Date(),
  onOpenItem,
}: MonthCalendarProps) {
  const { pack } = useIconPack();
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)),
  );
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const monthEnd = useMemo(
    () => startOfDay(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0)),
    [visibleMonth],
  );

  const horizon = useMemo(() => {
    const end = startOfDay(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 2, 0));
    return end;
  }, [visibleMonth]);

  const items = useMemo(
    () =>
      buildAgendaItems({
        tasks,
        expenses,
        currentUserId,
        pack,
        now,
        horizon,
        scope,
      }),
    [tasks, expenses, currentUserId, pack, now, horizon, scope],
  );

  const cells = useMemo(() => buildMonthCells(visibleMonth, now), [visibleMonth, now]);
  const selectedItems = selectedDay ? agendaItemsForDay(items, selectedDay) : [];
  const selectedExamLabels =
    selectedDay !== null
      ? examPeriodsOnDate(examPeriods, selectedDay).map((period) => period.label)
      : [];

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
      <Text className="text-xs text-gray-500">
        Azul = tuyas · teal = otras · ámbar = gastos · celeste = exámenes · violeta = ausencias
      </Text>

      <ExamCalendarBands
        examPeriods={examPeriods}
        members={members}
        monthStart={visibleMonth}
        monthEnd={monthEnd}
      />

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
              return <View key={`pad-${index}`} className="h-14 w-[14.28%]" />;
            }

            const dayItems = agendaItemsForDay(items, cell.date);
            const selected =
              selectedDay !== null && startOfDay(selectedDay).getTime() === cell.date.getTime();
            const inExamPeriod = hasExamPeriodsOnDate(examPeriods, cell.date);

            return (
              <Pressable
                key={cell.date.toISOString()}
                onPress={() => setSelectedDay(cell.date)}
                className={`h-14 w-[14.28%] items-center justify-center rounded-lg ${
                  inExamPeriod ? 'bg-sky-100/90' : ''
                } ${selected ? 'ring-1 ring-blue-400' : ''} ${
                  cell.isToday ? 'border border-blue-300' : ''
                }`}>
                <Text
                  className={`text-sm ${
                    cell.isToday ? 'font-bold text-blue-800' : 'font-medium text-gray-800'
                  }`}>
                  {cell.date.getDate()}
                </Text>
                {inExamPeriod ? (
                  <Text className="text-[9px] text-sky-800" numberOfLines={1}>
                    📚
                  </Text>
                ) : null}
                <View className="mt-0.5 h-1.5 flex-row items-center gap-0.5">
                  {(() => {
                    const mineTasks = dayItems.filter((item) => item.kind === 'task' && item.mine);
                    const othersTasks = dayItems.filter((item) => item.kind === 'task' && !item.mine);
                    const dayExpenses = dayItems.filter((item) => item.kind === 'expense');
                    const dots: { key: string; className: string }[] = [];
                    if (mineTasks.length > 0) {
                      const open = mineTasks.some((item) => item.lifecycle === 'open');
                      dots.push({
                        key: 'mine-task',
                        className: open ? 'bg-blue-600' : 'bg-blue-300',
                      });
                    }
                    if (othersTasks.length > 0) {
                      const open = othersTasks.some((item) => item.lifecycle === 'open');
                      dots.push({
                        key: 'others-task',
                        className: open ? 'bg-teal-600' : 'bg-teal-300',
                      });
                    }
                    if (dayExpenses.length > 0) {
                      const open = dayExpenses.some((item) => item.lifecycle === 'open');
                      dots.push({
                        key: 'expense',
                        className: open ? 'bg-amber-500' : 'bg-amber-300',
                      });
                    }
                    if (hasAbsencesOnDate(absences, cell.date)) {
                      dots.push({ key: 'absence', className: 'bg-violet-500' });
                    }
                    return dots.map((dot) => (
                      <View key={dot.key} className={`h-1.5 w-1.5 rounded-full ${dot.className}`} />
                    ));
                  })()}
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
        examLabels={selectedExamLabels}
        onClose={() => setSelectedDay(null)}
        onOpenItem={(item) => {
          setSelectedDay(null);
          onOpenItem(item);
        }}
      />
    </View>
  );
}
