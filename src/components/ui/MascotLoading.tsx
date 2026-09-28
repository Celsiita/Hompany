import { ActivityIndicator, Text, View } from 'react-native';

type MascotLoadingProps = {
  label?: string;
};

/**
 * Simple loading row (Mico kept light — no illustrated face).
 */
export function MascotLoading({ label = 'Cargando…' }: MascotLoadingProps) {
  return (
    <View className="items-center justify-center gap-2 py-6">
      <ActivityIndicator color="#2563eb" />
      <Text className="text-center text-sm text-gray-500">{label}</Text>
    </View>
  );
}
