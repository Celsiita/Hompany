import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
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
    <Screen className="justify-center gap-6">
      <View className="gap-2">
        <Text className="text-3xl font-bold text-gray-900">Crear cuenta</Text>
        <Text className="text-base text-gray-600">Únete a HOMPANY con tu email</Text>
      </View>

      <View className="gap-3">
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
      </View>
    </Screen>
  );
}
