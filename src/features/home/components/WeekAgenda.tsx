import { Pressable, Text, View } from 'react-native';

import {
  buildAgendaItems,
  startOfDay,
  type AgendaItem,
  type AgendaScopeFilter,
} from '@/features/home/lib/agenda-items';
import { examPeriodsOnDate } from '@/lib/exam-periods';
import { mascotEmptyCopy } from '@/lib/mascot';
import { stripCycleSuffix } from '@/lib/recurrence';
import { useIconPack } from '@/providers/IconPackProvider';
import type { MemberExamPeriod } from '@/schemas/exam-period.schema';
import type { ExpenseWithRelations, TaskWithRelations } from '@/types/database.types';

type WeekAgendaProps = {
  tasks: TaskWithRelations[];
  expenses: ExpenseWithRelations[];
  examPeriods?: MemberExamPeriod[];
  currentUserId?: string | null;
  scope?: AgendaScopeFilter;
  now?: Date;
  onOpenItem: (item: AgendaItem) => void;
};

function itemTone(item: AgendaItem): string {
  if (item.lifecycle === 'scheduled') {
    if (item.kind === 'expense') {
      return 'text-amber-700/55';
    }
    return item.mine ? 'text-blue-800/50' : 'text-sky-700/50';
  }
  if (item.kind === 'expense') {
    return item.mine ? 'font-semibold text-amber-800' : 'text-amber-700';
  }
  return item.mine ? 'font-semibold text-blue-800' : 'text-sky-800';
}

/**
 * 7-day agenda with tasks + expenses (open and projected scheduled).
 */
export function WeekAgenda({
  tasks,
  expenses,
  examPeriods = [],
  currentUserId,
  scope,
  now = new Date(),
  onOpenItem,
}: WeekAgendaProps) {
  const { pack } = useIconPack();
  const origin = startOfDay(now);
  const days = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(origin);
    day.setDate(origin.getDate() + index);
    return day;
  });
  const horizon = new Date(origin);
  horizon.setDate(origin.getDate() + 7);

  const items = buildAgendaItems({
    tasks,
    expenses,
    currentUserId,
    pack,
    now,
    horizon,
    scope,
  }).filter((item) => item.when.getTime() < horizon.getTime() && item.when.getTime() >= origin.getTime());

  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-gray-500">Agenda de 7 días</Text>
      <Text className="text-xs text-gray-500">
        Tareas en azul · gastos en ámbar · programadas atenuadas.
      </Text>
      {days.map((day) => {
        const dayItems = items.filter((item) => startOfDay(item.when).getTime() === day.getTime());
        const dayExams = examPeriodsOnDate(examPeriods, day);
        const label = new Intl.DateTimeFormat('es-ES', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        }).format(day);
        return (
          <View key={day.toISOString()} className="gap-1 rounded-xl border border-gray-200 bg-white p-3">
            <Text className="text-xs font-bold uppercase text-gray-500">{label}</Text>
            {dayExams.length > 0 ? (
              <View className="mb-1 gap-0.5 rounded-lg bg-sky-50 px-2 py-1">
                {dayExams.map((period) => (
                  <Text key={`${period.user_id}-${period.label}`} className="text-xs text-sky-800">
                    📚 Exámenes: {period.label}
                  </Text>
                ))}
              </View>
            ) : null}
            {dayItems.length === 0 ? (
              <Text className="text-sm text-gray-400">{mascotEmptyCopy('agenda_list').title}</Text>
            ) : (
              dayItems.map((item) => (
                <Pressable key={item.id} onPress={() => onOpenItem(item)} hitSlop={4}>
                  <Text className={`text-sm ${itemTone(item)}`}>
                    {item.kind === 'expense' ? '◇ ' : item.mine ? '● ' : '○ '}
                    {item.glyph} {stripCycleSuffix(item.title)}
                  </Text>
                </Pressable>
              ))
            )}
          </View>
        );
      })}
    </View>
  );
}
