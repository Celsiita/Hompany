import { Pressable, Text, View } from 'react-native';

import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import { formatHistoryDate } from '@/lib/recurrence';
import type { HomeActivityEventWithActor } from '@/types/database.types';

type ActivityListModalProps = {
  visible: boolean;
  title: string;
  events: HomeActivityEventWithActor[];
  onClose: () => void;
};

/**
 * Read-only activity history sheet for a roommate.
 */
export function ActivityListModal({ visible, title, events, onClose }: ActivityListModalProps) {
  return (
    <BottomSheetModal visible={visible} onClose={onClose} maxHeightClassName="max-h-[70%]" animationType="fade">
      <Text className="mb-3 text-sm font-semibold text-stone-500">{title}</Text>
      {events.length === 0 ? (
        <Text className="py-4 text-sm text-stone-500">Sin movimientos todavía.</Text>
      ) : (
        events.slice(0, 30).map((event) => (
          <View key={event.id} className="border-b border-stone-100 py-3">
            <Text className="text-sm text-stone-900">{event.summary}</Text>
            <Text className="mt-1 text-xs text-stone-500">{formatHistoryDate(event.created_at)}</Text>
          </View>
        ))
      )}
      <Pressable onPress={onClose} className="mt-3 rounded-xl bg-stone-100 px-3 py-3">
        <Text className="text-center text-sm font-semibold text-stone-700">Cerrar</Text>
      </Pressable>
    </BottomSheetModal>
  );
}
