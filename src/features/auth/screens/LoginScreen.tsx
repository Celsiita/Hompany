import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { useAuth } from '@/providers/AuthProvider';
import { loginSchema } from '@/schemas/auth.schema';

/**
 * Email/password login screen.
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
    <Screen className="justify-center gap-6">
      <View className="gap-2">
        <Text className="text-3xl font-bold text-gray-900">HOMPANY</Text>
        <Text className="text-base text-gray-600">Entra a tu piso compartido</Text>
      </View>

      <View className="gap-3">
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
      </View>
    </Screen>
  );
}
