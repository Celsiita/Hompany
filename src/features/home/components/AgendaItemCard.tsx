import { Pressable, Text, View } from 'react-native';

import {
  agendaItemAvailability,
  type AgendaItem,
} from '@/features/home/lib/agenda-items';
import { formatHistoryDate, stripCycleSuffix } from '@/lib/recurrence';

type AgendaItemCardProps = {
  item: AgendaItem;
  onPress: () => void;
  now?: Date;
};

function cardClass(item: AgendaItem, availability: ReturnType<typeof agendaItemAvailability>): string {
  if (availability === 'overdue') {
    return 'border-red-400 bg-red-50';
  }
  if (availability === 'locked' || item.lifecycle === 'scheduled') {
    if (item.kind === 'expense') {
      return 'border-emerald-100 bg-emerald-50/50 opacity-60';
    }
    return item.mine
      ? 'border-blue-100 bg-blue-50/50 opacity-60'
      : 'border-teal-100 bg-teal-50/50 opacity-60';
  }
  if (item.kind === 'expense') {
    return item.mine
      ? 'border-emerald-400 bg-emerald-50'
      : 'border-emerald-200 bg-emerald-50/90';
  }
  return item.mine ? 'border-blue-300 bg-blue-50' : 'border-teal-200 bg-teal-50/90';
}

function statusBadge(
  item: AgendaItem,
  availability: ReturnType<typeof agendaItemAvailability>,
): string {
  const startLabel = item.startsAt ? formatHistoryDate(item.startsAt.toISOString()) : '';
  if (availability === 'overdue') {
    return 'Atrasada · vencida';
  }
  if (availability === 'locked') {
    return startLabel ? `🔒 Se desbloquea el ${startLabel}` : '🔒 Programada';
  }
  return startLabel ? `Disponible (desde ${startLabel})` : 'Disponible';
}

function kindLabel(item: AgendaItem): string {
  const base = item.kind === 'task' ? 'Tarea' : 'Gasto';
  return item.lifecycle === 'scheduled' ? `${base} · Futura` : `${base} · Abierta`;
}

/**
 * Compact agenda row card with schedule-window badges (due-day anchored).
 */
export function AgendaItemCard({ item, onPress, now = new Date() }: AgendaItemCardProps) {
  const availability = agendaItemAvailability(item, now);
  const locked = availability === 'locked';

  return (
    <Pressable
      onPress={onPress}
      disabled={locked && item.lifecycle === 'scheduled'}
      className={`rounded-xl border px-3 py-2.5 ${cardClass(item, availability)}`}
      accessibilityRole="button">
      <View className="flex-row items-center gap-2">
        <Text className="text-base">{item.glyph}</Text>
        <View className="flex-1">
          <Text
            className={`text-sm text-gray-900 ${
              availability === 'available' ? 'font-semibold' : 'font-medium'
            }`}>
            {stripCycleSuffix(item.title)}
          </Text>
          <Text className="mt-0.5 text-xs text-gray-500">
            {kindLabel(item)} · {item.actorLabel}
          </Text>
          <Text
            className={`mt-1 text-[11px] font-semibold ${
              availability === 'overdue'
                ? 'text-red-700'
                : availability === 'locked'
                  ? 'text-amber-800'
                  : 'text-emerald-800'
            }`}>
            {statusBadge(item, availability)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
