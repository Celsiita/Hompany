import { Pressable, Text, View } from 'react-native';

import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import { MascotEmpty } from '@/components/ui/MascotEmpty';
import type { AgendaItem } from '@/features/home/lib/agenda-items';
import { stripCycleSuffix } from '@/lib/recurrence';

type DayAgendaSheetProps = {
  visible: boolean;
  day: Date | null;
  items: AgendaItem[];
  /** Exam period labels active on the selected day. */
  examLabels?: string[];
  onClose: () => void;
  onOpenItem: (item: AgendaItem) => void;
};

function rowClass(item: AgendaItem): string {
  if (item.lifecycle === 'scheduled') {
    if (item.kind === 'expense') {
      return 'border-amber-100 bg-amber-50/60 opacity-70';
    }
    return item.mine
      ? 'border-blue-100 bg-blue-50/60 opacity-70'
      : 'border-sky-100 bg-sky-50/60 opacity-70';
  }
  return item.kind === 'expense'
    ? 'border-amber-200 bg-amber-50'
    : item.mine
      ? 'border-blue-200 bg-blue-50'
      : 'border-sky-200 bg-sky-50';
}

/**
 * Bottom sheet listing tasks and expenses scheduled for a calendar day.
 */
export function DayAgendaSheet({
  visible,
  day,
  items,
  examLabels = [],
  onClose,
  onOpenItem,
}: DayAgendaSheetProps) {
  const dayLabel = day
    ? new Intl.DateTimeFormat('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(day)
    : '';

  return (
    <BottomSheetModal visible={visible} onClose={onClose} maxHeightClassName="max-h-[70%]" animationType="fade">
      <Text className="mb-1 text-sm font-semibold capitalize text-gray-500">{dayLabel}</Text>
      <Text className="mb-3 text-xs text-gray-500">
        Tareas · gastos · programadas atenuadas. Toca un ítem para abrirlo.
      </Text>
      {examLabels.length > 0 ? (
        <View className="mb-3 gap-1">
          {examLabels.map((label) => (
            <Text key={label} className="text-xs font-medium text-sky-800">
              📚 Exámenes: {label}
            </Text>
          ))}
        </View>
      ) : null}
      {items.length === 0 ? (
        <MascotEmpty kind="agenda_day" />
      ) : (
        items.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => onOpenItem(item)}
            className={`mb-2 rounded-xl border px-3 py-3 ${rowClass(item)}`}>
            <Text className="text-sm font-semibold text-gray-900">
              {item.glyph} {stripCycleSuffix(item.title)}
            </Text>
            <Text className="mt-1 text-xs text-gray-600">
              {item.kind === 'task' ? 'Tarea' : 'Gasto'}
              {item.lifecycle === 'scheduled' ? ' · Programada' : ' · Abierta'}
              {' · '}
              {item.actorLabel}
            </Text>
          </Pressable>
        ))
      )}
      <Pressable onPress={onClose} className="mt-3 rounded-xl bg-gray-100 px-3 py-3">
        <Text className="text-center text-sm font-semibold text-gray-700">Cerrar</Text>
      </Pressable>
    </BottomSheetModal>
  );
}
