import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { AlertsBanner } from '@/features/home/components/AlertsBanner';
import type { HomeAlert } from '@/features/home/lib/alerts';

type AlertsModalProps = {
  visible: boolean;
  alerts: HomeAlert[];
  onClose: () => void;
};

/**
 * Sheet that lists in-app home alerts opened from the overflow menu.
 */
export function AlertsModal({ visible, alerts, onClose }: AlertsModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable
          className="max-h-[70%] rounded-t-3xl bg-white p-4 pb-8"
          onPress={(event) => event.stopPropagation()}>
          <Text className="mb-3 text-sm font-semibold text-gray-500">Avisos / Notificaciones</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {alerts.length === 0 ? (
              <Text className="py-4 text-sm text-gray-500">No hay avisos ahora mismo.</Text>
            ) : (
              <AlertsBanner alerts={alerts} showHeading={false} />
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
