import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import type { AgendaItem } from '@/features/home/lib/agenda-items';
import { formatDueSummary } from '@/features/tasks/lib/countdown';

type DayAgendaSheetProps = {
  visible: boolean;
  day: Date | null;
  items: AgendaItem[];
  onClose: () => void;
  onOpenItem: (item: AgendaItem) => void;
};

/**
 * Bottom sheet listing tasks and expenses scheduled for a calendar day.
 */
export function DayAgendaSheet({ visible, day, items, onClose, onOpenItem }: DayAgendaSheetProps) {
  const dayLabel = day
    ? new Intl.DateTimeFormat('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(day)
    : '';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable
          className="max-h-[70%] rounded-t-3xl bg-white p-4 pb-8"
          onPress={(event) => event.stopPropagation()}>
          <Text className="mb-1 text-sm font-semibold capitalize text-gray-500">{dayLabel}</Text>
          <Text className="mb-3 text-xs text-gray-500">
            Azul = tuyo · Verde = compañeros. Pulsa un ítem para abrirlo.
          </Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {items.length === 0 ? (
              <Text className="py-4 text-sm text-gray-500">Nada previsto este día.</Text>
            ) : (
              items.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => onOpenItem(item)}
                  className={`mb-2 rounded-xl border px-3 py-3 ${
                    item.mine ? 'border-blue-200 bg-blue-50' : 'border-teal-200 bg-teal-50'
                  }`}>
                  <Text
                    className={`text-sm font-semibold ${item.mine ? 'text-blue-900' : 'text-teal-900'}`}>
                    {item.glyph} {item.title}
                  </Text>
                  <Text className={`mt-1 text-xs ${item.mine ? 'text-blue-700' : 'text-teal-700'}`}>
                    {item.kind === 'task' ? 'Tarea' : 'Gasto'}
                    {' · '}
                    {formatDueSummary(item.when.toISOString(), item.dueMode).relativeLabel}
                  </Text>
                </Pressable>
              ))
            )}
          </ScrollView>
          <Pressable onPress={onClose} className="mt-3 rounded-xl bg-gray-100 px-3 py-3">
            <Text className="text-center text-sm font-semibold text-gray-700">Cerrar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
