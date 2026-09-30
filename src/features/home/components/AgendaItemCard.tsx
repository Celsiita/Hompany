import { Pressable, Text, View } from 'react-native';

import {
  agendaItemAvailability,
  type AgendaItem,
} from '@/features/home/lib/agenda-items';
import { formatHistoryDate, stripCycleSuffix } from '@/lib/recurrence';
import { useLocale } from '@/providers/LocaleProvider';

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
      return item.expenseRole === 'i_owe'
        ? 'border-rose-100 bg-rose-50/40 opacity-70'
        : 'border-amber-100 bg-amber-50/40 opacity-70';
    }
    return item.mine
      ? 'border-blue-100 bg-blue-50/40 opacity-70'
      : 'border-sky-100 bg-sky-50/40 opacity-70';
  }
  if (item.kind === 'expense') {
    return item.expenseRole === 'i_owe'
      ? 'border-rose-400 bg-rose-50'
      : 'border-amber-400 bg-amber-50';
  }
  return item.mine ? 'border-blue-400 bg-blue-50' : 'border-sky-300 bg-sky-50';
}

/**
 * Compact agenda row: blue = your task, sky = roommate task, amber = expense.
 */
export function AgendaItemCard({ item, onPress, now = new Date() }: AgendaItemCardProps) {
  const { t } = useLocale();
  const availability = agendaItemAvailability(item, now);
  const locked = availability === 'locked';
  const chip =
    item.kind === 'expense'
      ? {
          label: item.expenseRole === 'i_owe' ? t('chip.youOwe') : t('chip.theyOwe'),
          className:
            item.expenseRole === 'i_owe'
              ? 'bg-rose-200/80 text-rose-950'
              : 'bg-amber-200/80 text-amber-950',
        }
      : {
          label: item.mine ? t('agenda.taskYours') : t('agenda.taskPeer'),
          className: item.mine ? 'bg-blue-200/80 text-blue-950' : 'bg-sky-200/80 text-sky-950',
        };

  const startLabel = item.startsAt ? formatHistoryDate(item.startsAt.toISOString()) : '';
  let status = t('status.pending');
  if (availability === 'overdue') {
    status = t('status.overdue');
  } else if (availability === 'locked') {
    status = startLabel || t('agenda.scheduled');
  } else if (startLabel) {
    status = startLabel;
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={locked && item.lifecycle === 'scheduled'}
      className={`rounded-xl border px-3 py-2.5 ${cardClass(item, availability)}`}
      accessibilityRole="button">
      <View className="flex-row items-center gap-2">
        <Text className="text-base">{item.glyph}</Text>
        <View className="flex-1 gap-1">
          <View className="flex-row flex-wrap items-center gap-1.5">
            <View className={`rounded-md px-2 py-0.5 ${chip.className}`}>
              <Text className="text-[10px] font-bold">{chip.label}</Text>
            </View>
            {item.lifecycle === 'scheduled' ? (
              <Text className="text-[10px] font-semibold text-stone-500">
                {t('agenda.scheduled')}
              </Text>
            ) : null}
          </View>
          <Text
            className={`text-sm text-stone-900 ${
              availability === 'available' ? 'font-semibold' : 'font-medium'
            }`}>
            {stripCycleSuffix(item.title)}
          </Text>
          <Text className="text-xs text-stone-600">{item.actorLabel}</Text>
          <Text
            className={`text-[11px] font-semibold ${
              availability === 'overdue'
                ? 'text-red-700'
                : availability === 'locked'
                  ? 'text-amber-800'
                  : 'text-teal-800'
            }`}>
            {status}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
