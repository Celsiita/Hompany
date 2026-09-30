import { useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { palette } from '@/lib/interactive-styles';
import { useAuth } from '@/providers/AuthProvider';
import { loginSchema } from '@/schemas/auth.schema';
import { useRouter } from 'expo-router';

/**
 * Email/password login screen with brand-first hero.
 */
export function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Datos no válidos');
      return;
    }

    setLoading(true);
    try {
      await signIn(parsed.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen className="justify-center gap-8">
      <Animated.View entering={FadeInDown.duration(420)} className="gap-3">
        <Text
          className="text-5xl font-extrabold tracking-tight"
          style={{ color: palette.brand }}>
          HOMPANY
        </Text>
        <Text className="text-base leading-6" style={{ color: palette.inkMuted }}>
          Para pisos de estudiantes: tareas con foto, gastos claros y reputación sin drama.
        </Text>
        <View className="mt-1 gap-0.5 rounded-xl border border-teal-200 bg-teal-50/80 px-3 py-2.5">
          <Text className="text-xs font-semibold text-teal-900">Demo local</Text>
          <Text className="text-xs leading-4 text-teal-800/80">
            ana@hompany.local · password123
          </Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(420)} className="gap-3">
        <TextField
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />
        <TextField
          label="Contraseña"
          secureTextEntry
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
        />
        {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
        <Button label="Entrar" loading={loading} onPress={() => void handleSubmit()} />
        <Button
          label="Crear cuenta"
          variant="ghost"
          onPress={() => router.push('/(auth)/register')}
        />
      </Animated.View>
    </Screen>
  );
}
