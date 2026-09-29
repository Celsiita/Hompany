import { Pressable, Text, View } from 'react-native';

type HeaderAlertsButtonProps = {
  count: number;
  urgentCount?: number;
  onPress: () => void;
};

/**
 * Header bell that opens the in-app alerts inbox.
 */
export function HeaderAlertsButton({ count, urgentCount = 0, onPress }: HeaderAlertsButtonProps) {
  const badge = count > 9 ? '9+' : String(count);
  const hasUrgent = urgentCount > 0;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={
        count > 0 ? `Avisos, ${count} pendientes` : 'Avisos, ninguno pendiente'
      }
      className="h-11 w-11 items-center justify-center rounded-full bg-white/90 border border-stone-200">
      <Text className="text-lg">🔔</Text>
      {count > 0 ? (
        <View
          className={`absolute -right-0.5 -top-0.5 min-w-[18px] items-center rounded-full px-1 ${
            hasUrgent ? 'bg-red-500' : 'bg-teal-600'
          }`}>
          <Text className="text-[10px] font-bold text-white">{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
