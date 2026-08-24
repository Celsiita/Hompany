import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable
          className="max-h-[70%] rounded-t-3xl bg-white p-4 pb-8"
          onPress={(event) => event.stopPropagation()}>
          <Text className="text-sm font-semibold text-gray-500 mb-3">{title}</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {events.length === 0 ? (
              <Text className="text-sm text-gray-500 py-4">Sin movimientos todavía.</Text>
            ) : (
              events.slice(0, 30).map((event) => (
                <View key={event.id} className="border-b border-gray-100 py-3">
                  <Text className="text-sm text-gray-900">{event.summary}</Text>
                  <Text className="text-xs text-gray-500 mt-1">
                    {formatHistoryDate(event.created_at)}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
          <Pressable onPress={onClose} className="rounded-xl bg-gray-100 px-3 py-3 mt-3">
            <Text className="text-center text-sm font-semibold text-gray-700">Cerrar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
