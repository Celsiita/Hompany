import { Pressable, Text, View } from 'react-native';

import { MascotEmpty } from '@/components/ui/MascotEmpty';
import {
  groupHomeAlerts,
  type HomeAlert,
  type HomeAlertTone,
} from '@/features/home/lib/alerts';

type AlertsBannerProps = {
  alerts: HomeAlert[];
  /** Max rows in a compact Pulso preview. */
  previewLimit?: number;
  onPressAlert?: (alert: HomeAlert) => void;
  onPressSeeAll?: () => void;
};

const TONE_CLASS: Record<HomeAlertTone, string> = {
  red: 'border-red-200 bg-red-50',
  amber: 'border-amber-200 bg-amber-50',
  teal: 'border-teal-200 bg-teal-50',
};

const TONE_ICON: Record<HomeAlertTone, string> = {
  red: '!',
  amber: '⏳',
  teal: '✓',
};

function AlertRow({
  alert,
  showChevron,
}: {
  alert: HomeAlert;
  showChevron: boolean;
}) {
  return (
    <View
      className={`flex-row items-center gap-3 rounded-xl border px-3 py-3 ${TONE_CLASS[alert.tone]}`}>
      <View className="h-9 w-9 items-center justify-center rounded-full bg-white/80">
        <Text className="text-sm font-bold text-stone-800">{TONE_ICON[alert.tone]}</Text>
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="text-sm font-semibold text-stone-900">{alert.title}</Text>
        <Text className="text-xs text-stone-600">{alert.message}</Text>
      </View>
      {showChevron ? <Text className="text-stone-400">›</Text> : null}
    </View>
  );
}

/**
 * Compact alert rows for inbox sheets (not shown inline on Pulso).
 */
export function AlertsBanner({
  alerts,
  previewLimit,
  onPressAlert,
  onPressSeeAll,
}: AlertsBannerProps) {
  if (alerts.length === 0) {
    return null;
  }

  const visible = previewLimit ? alerts.slice(0, previewLimit) : alerts;
  const hidden = previewLimit ? Math.max(0, alerts.length - visible.length) : 0;

  return (
    <View className="gap-2">
      {visible.map((alert) =>
        onPressAlert ? (
          <Pressable
            key={alert.id}
            onPress={() => onPressAlert(alert)}
            accessibilityRole="button"
            accessibilityLabel={`${alert.title}. ${alert.message}`}>
            <AlertRow alert={alert} showChevron />
          </Pressable>
        ) : (
          <View key={alert.id}>
            <AlertRow alert={alert} showChevron={false} />
          </View>
        ),
      )}
      {hidden > 0 && onPressSeeAll ? (
        <Pressable onPress={onPressSeeAll} className="rounded-xl bg-stone-100 px-3 py-2.5">
          <Text className="text-center text-sm font-semibold text-teal-800">
            Ver {hidden} aviso{hidden === 1 ? '' : 's'} más
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

type AlertsInboxProps = {
  alerts: HomeAlert[];
  onPressAlert: (alert: HomeAlert) => void;
};

/**
 * Sectioned inbox used inside the alerts sheet.
 */
export function AlertsInbox({ alerts, onPressAlert }: AlertsInboxProps) {
  if (alerts.length === 0) {
    return <MascotEmpty kind="alerts" />;
  }

  const groups = groupHomeAlerts(alerts);

  return (
    <View className="gap-4">
      {groups.map((group) => (
        <View key={group.section} className="gap-2">
          <Text className="text-xs font-bold uppercase tracking-wide text-stone-500">
            {group.label}
          </Text>
          <AlertsBanner alerts={group.items} onPressAlert={onPressAlert} />
        </View>
      ))}
    </View>
  );
}
