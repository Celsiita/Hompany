import { Text, View } from 'react-native';

import type { HomeAlert } from '@/features/home/lib/alerts';

type AlertsBannerProps = {
  alerts: HomeAlert[];
  /** When false, omits the section heading (e.g. inside AlertsModal). */
  showHeading?: boolean;
};

const TONE_CLASS: Record<HomeAlert['tone'], string> = {
  red: 'border-red-200 bg-red-50',
  amber: 'border-amber-200 bg-amber-50',
  blue: 'border-blue-200 bg-blue-50',
};

/**
 * Compact in-app alert list (Home overflow sheet or embedded previews).
 */
export function AlertsBanner({ alerts, showHeading = true }: AlertsBannerProps) {
  if (alerts.length === 0) {
    return null;
  }

  return (
    <View className="gap-2">
      {showHeading ? <Text className="text-sm font-semibold text-gray-500">Avisos</Text> : null}
      {alerts.map((alert) => (
        <View key={alert.id} className={`rounded-xl border px-3 py-2 ${TONE_CLASS[alert.tone]}`}>
          <Text className="text-sm text-gray-800">{alert.message}</Text>
        </View>
      ))}
    </View>
  );
}
