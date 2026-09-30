import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { palette } from '@/lib/interactive-styles';
import { useAuth } from '@/providers/AuthProvider';
import { registerSchema } from '@/schemas/auth.schema';

/**
 * Email/password registration screen.
 */
export function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    const parsed = registerSchema.safeParse({ displayName, email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Datos no válidos');
      return;
    }

    setLoading(true);
    try {
      await signUp(parsed.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen className="justify-center gap-8">
      <Animated.View entering={FadeInDown.duration(420)} className="gap-2">
        <Text
          className="text-4xl font-extrabold tracking-tight"
          style={{ color: palette.brand }}>
          HOMPANY
        </Text>
        <Text className="text-2xl font-bold text-stone-900">Crear cuenta</Text>
        <Text className="text-base text-stone-600">
          Para tu piso de estudiantes: tareas, gastos y convivencia sin drama.
        </Text>
        <Pressable
          onPress={() => router.push('/(auth)/login')}
          accessibilityRole="button"
          accessibilityLabel="Ir al login con demo"
          className="mt-1 gap-0.5 rounded-xl border border-teal-200 bg-teal-50/80 px-3 py-2.5">
          <Text className="text-xs font-semibold text-teal-900">¿Demo local?</Text>
          <Text className="text-xs leading-4 text-teal-800/80">
            Entra con ana@hompany.local · password123
          </Text>
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(420)} className="gap-3">
        <TextField
          label="Nombre"
          autoComplete="name"
          value={displayName}
          onChangeText={setDisplayName}
        />
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
          autoComplete="password-new"
          value={password}
          onChangeText={setPassword}
        />
        {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
        <Button label="Registrarme" loading={loading} onPress={() => void handleSubmit()} />
        <Button
          label="Ya tengo cuenta"
          variant="ghost"
          onPress={() => router.replace('/(auth)/login')}
        />
      </Animated.View>
    </Screen>
  );
}
