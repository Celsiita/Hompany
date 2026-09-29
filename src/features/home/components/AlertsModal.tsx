import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import { AlertsInbox } from '@/features/home/components/AlertsBanner';
import type { HomeAlert } from '@/features/home/lib/alerts';
import { expenseFocusHref, taskFocusHref } from '@/lib/navigation/board-focus';

type AlertsModalProps = {
  visible: boolean;
  alerts: HomeAlert[];
  onClose: () => void;
};

/**
 * Sheet inbox for in-app home alerts. Tapping a row opens the related board item.
 */
export function AlertsModal({ visible, alerts, onClose }: AlertsModalProps) {
  function openAlert(alert: HomeAlert) {
    onClose();
    router.push(
      alert.entityType === 'task'
        ? taskFocusHref(alert.entityId)
        : expenseFocusHref(alert.entityId),
    );
  }

  const urgentCount = alerts.filter((item) => item.section === 'urgent').length;

  return (
    <BottomSheetModal visible={visible} onClose={onClose} maxHeightClassName="max-h-[80%]">
      <View className="mb-3 gap-1">
        <Text className="text-lg font-bold text-stone-900">Avisos</Text>
        <Text className="text-sm text-stone-500">
          {alerts.length === 0
            ? 'Nada pendiente ahora mismo.'
            : urgentCount > 0
              ? `${alerts.length} aviso${alerts.length === 1 ? '' : 's'} · ${urgentCount} urgente${urgentCount === 1 ? '' : 's'}`
              : `${alerts.length} aviso${alerts.length === 1 ? '' : 's'} activos`}
        </Text>
      </View>
      <AlertsInbox alerts={alerts} onPressAlert={openAlert} />
      <Pressable onPress={onClose} className="mt-4 rounded-xl bg-stone-100 px-3 py-3">
        <Text className="text-center text-sm font-semibold text-stone-700">Cerrar</Text>
      </Pressable>
    </BottomSheetModal>
  );
}
