import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import { AlertsInbox } from '@/features/home/components/AlertsBanner';
import type { HomeAlert } from '@/features/home/lib/alerts';
import { expenseFocusHref, taskFocusHref } from '@/lib/navigation/board-focus';
import { useLocale } from '@/providers/LocaleProvider';

type AlertsModalProps = {
  visible: boolean;
  alerts: HomeAlert[];
  onClose: () => void;
};

/**
 * Sheet inbox for in-app home alerts. Tapping a row opens the related board item.
 */
export function AlertsModal({ visible, alerts, onClose }: AlertsModalProps) {
  const { t } = useLocale();

  function openAlert(alert: HomeAlert) {
    onClose();
    router.push(
      alert.entityType === 'task'
        ? taskFocusHref(alert.entityId)
        : expenseFocusHref(alert.entityId),
    );
  }

  const urgentCount = alerts.filter((item) => item.section === 'urgent').length;
  const count = alerts.length;

  let summary: string | null = null;
  if (count > 0) {
    if (urgentCount > 0) {
      summary =
        count === 1
          ? t('alerts.summaryOneUrgent', { u: urgentCount })
          : t('alerts.summaryUrgent', { n: count, u: urgentCount });
    } else {
      summary = count === 1 ? t('alerts.summaryOne') : t('alerts.summary', { n: count });
    }
  }

  return (
    <BottomSheetModal visible={visible} onClose={onClose} maxHeightClassName="max-h-[80%]">
      <View className="mb-3 gap-1">
        <Text className="text-lg font-bold text-stone-900">{t('alerts.title')}</Text>
        {summary ? (
          <Text className="text-sm text-stone-500">{summary}</Text>
        ) : (
          <Text className="text-sm text-stone-500">{t('alerts.empty')}</Text>
        )}
      </View>
      <AlertsInbox alerts={alerts} onPressAlert={openAlert} />
      <Pressable onPress={onClose} className="mt-4 rounded-xl bg-stone-100 px-3 py-3">
        <Text className="text-center text-sm font-semibold text-stone-700">{t('common.close')}</Text>
      </Pressable>
    </BottomSheetModal>
  );
}
