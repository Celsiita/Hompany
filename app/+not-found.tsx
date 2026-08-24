import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

/**
 * Fallback screen for unmatched routes.
 */
export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'No encontrado' }} />
      <View className="flex-1 items-center justify-center bg-white p-4">
        <Text className="text-xl font-bold text-gray-900">Pantalla no encontrada</Text>
        <Link href="/" className="mt-4 text-blue-600">
          <Text>Volver al inicio</Text>
        </Link>
      </View>
    </>
  );
}
