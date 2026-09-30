import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

import { palette } from '@/lib/interactive-styles';

/**
 * Fallback screen for unmatched routes.
 */
export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'No encontrado' }} />
      <View
        className="flex-1 items-center justify-center gap-3 p-6"
        style={{ backgroundColor: palette.cream }}>
        <Text className="text-xl font-bold text-stone-900">Pantalla no encontrada</Text>
        <Text className="text-center text-sm text-stone-600">
          Esa ruta no existe en HOMPANY. Vuelve al inicio del piso.
        </Text>
        <Link href="/" className="mt-2">
          <Text className="text-base font-semibold" style={{ color: palette.brand }}>
            Volver al inicio
          </Text>
        </Link>
      </View>
    </>
  );
}
