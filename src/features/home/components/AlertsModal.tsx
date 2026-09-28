import { Pressable, Text } from 'react-native';

import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
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
    <BottomSheetModal visible={visible} onClose={onClose} maxHeightClassName="max-h-[70%]" animationType="fade">
      <Text className="mb-3 text-sm font-semibold text-gray-500">Avisos / Notificaciones</Text>
      {alerts.length === 0 ? (
        <Text className="py-4 text-sm text-gray-500">No hay avisos ahora mismo.</Text>
      ) : (
        <AlertsBanner alerts={alerts} showHeading={false} />
      )}
      <Pressable onPress={onClose} className="mt-3 rounded-xl bg-gray-100 px-3 py-3">
        <Text className="text-center text-sm font-semibold text-gray-700">Cerrar</Text>
      </Pressable>
    </BottomSheetModal>
  );
}
