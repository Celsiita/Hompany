import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { buildAgendaItems, startOfDay, type AgendaItem } from '@/features/home/lib/agenda-items';
import { formatDueSummary } from '@/features/tasks/lib/countdown';
import { expenseFocusHref, taskFocusHref } from '@/lib/navigation/board-focus';
import { useIconPack } from '@/providers/IconPackProvider';
import type { ExpenseWithRelations, TaskWithRelations } from '@/types/database.types';

type WeekAgendaProps = {
  tasks: TaskWithRelations[];
  expenses: ExpenseWithRelations[];
  currentUserId?: string | null;
  now?: Date;
};

/**
 * 7-day agenda highlighting the current user's tasks and payments vs roommates.
 * Tapping an item opens its board card (focus), not the edit form.
 */
export function WeekAgenda({ tasks, expenses, currentUserId, now = new Date() }: WeekAgendaProps) {
  const { pack } = useIconPack();
  const origin = startOfDay(now);
  const days = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(origin);
    day.setDate(origin.getDate() + index);
    return day;
  });
  const horizon = new Date(origin);
  horizon.setDate(origin.getDate() + 7);

  const items = buildAgendaItems({ tasks, expenses, currentUserId, pack }).filter(
    (item) => item.when.getTime() < horizon.getTime() && item.when.getTime() >= origin.getTime(),
  );

  function openItem(item: AgendaItem) {
    router.push(item.kind === 'task' ? taskFocusHref(item.entityId) : expenseFocusHref(item.entityId));
  }

  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-gray-500">Agenda de 7 días</Text>
      <Text className="text-xs text-gray-500">Tú resaltado · el resto en gris. Toca para abrir.</Text>
      {days.map((day) => {
        const dayItems = items.filter((item) => startOfDay(item.when).getTime() === day.getTime());
        const label = new Intl.DateTimeFormat('es-ES', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        }).format(day);
        return (
          <View key={day.toISOString()} className="gap-1 rounded-xl border border-gray-200 bg-white p-3">
            <Text className="text-xs font-bold uppercase text-gray-500">{label}</Text>
            {dayItems.length === 0 ? (
              <Text className="text-sm text-gray-400">Nada previsto</Text>
            ) : (
              dayItems.map((item) => (
                <Pressable key={item.id} onPress={() => openItem(item)} hitSlop={4}>
                  <Text
                    className={`text-sm ${item.mine ? 'font-semibold text-blue-800' : 'text-gray-600'}`}>
                    {item.mine ? '● ' : '○ '}
                    {item.glyph} {item.title}
                    {' · '}
                    {formatDueSummary(item.when.toISOString(), item.dueMode).relativeLabel}
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
