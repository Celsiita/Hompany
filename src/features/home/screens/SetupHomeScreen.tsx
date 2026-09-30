import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { palette } from '@/lib/interactive-styles';
import { useAuth } from '@/providers/AuthProvider';
import { useConfirmDialog } from '@/providers/ConfirmProvider';
import { useHome } from '@/providers/HomeProvider';
import {
  createHomeInputSchema,
  joinHomeInputSchema,
} from '@/schemas/onboarding.schema';

type Mode = 'create' | 'join';

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) {
    return err.message;
  }
  if (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof (err as { message: unknown }).message === 'string'
  ) {
    return (err as { message: string }).message;
  }
  return fallback;
}

/**
 * Onboarding screen to create a new home or join one with an invite code.
 * Also lists existing memberships so the user can re-enter a known home.
 */
export function SetupHomeScreen() {
  const { signOut } = useAuth();
  const { createHome, joinHome, homes, setActiveHomeId } = useHome();
  const confirm = useConfirmDialog();
  const [mode, setMode] = useState<Mode>('join');
  const [name, setName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setError(null);
    const parsed = createHomeInputSchema.safeParse({ name });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Nombre no válido');
      return;
    }

    setLoading(true);
    try {
      await createHome(parsed.data);
    } catch (err) {
      setError(errorMessage(err, 'No se pudo crear el piso'));
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    setError(null);
    const parsed = joinHomeInputSchema.safeParse({ inviteCode });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Código no válido');
      return;
    }

    setLoading(true);
    try {
      await joinHome(parsed.data);
    } catch (err) {
      setError(errorMessage(err, 'No se pudo unir al piso'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen className="justify-center gap-6">
      <Animated.View entering={FadeInDown.duration(420)} className="gap-2">
        <Text
          className="text-4xl font-extrabold tracking-tight"
          style={{ color: palette.brand }}>
          HOMPANY
        </Text>
        <Text className="text-xl font-semibold text-stone-900">Tu piso compartido</Text>
        <Text className="text-base text-stone-600">
          ¿Sois nuevos? Crea el piso y comparte el código. ¿Ya existe? Pega el código que te pasó un
          compañero.
        </Text>
      </Animated.View>

      {homes.length > 0 ? (
        <Animated.View entering={FadeInDown.delay(60).duration(420)} className="gap-2">
          <Text className="text-sm font-semibold text-stone-700">Tus pisos</Text>
          {homes.map((home) => (
            <Pressable
              key={home.id}
              className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3"
              onPress={() => {
                void setActiveHomeId(home.id);
              }}>
              <Text className="text-base font-semibold text-stone-900">{home.name}</Text>
              <Text className="text-sm text-stone-500">Código: {home.invite_code}</Text>
            </Pressable>
          ))}
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(100).duration(420)} className="gap-3">
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Button
              label="Crear piso"
              variant={mode === 'create' ? 'primary' : 'secondary'}
              onPress={() => setMode('create')}
            />
          </View>
          <View className="flex-1">
            <Button
              label="Tengo código"
              variant={mode === 'join' ? 'primary' : 'secondary'}
              onPress={() => setMode('join')}
            />
          </View>
        </View>

        <View className="gap-3">
          {mode === 'create' ? (
            <>
              <TextField
                label="Nombre del piso"
                value={name}
                onChangeText={setName}
                placeholder="Ej. Piso Erasmus / Calle Mayor 12"
              />
              {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
              <Button
                label="Crear piso"
                loading={loading}
                onPress={() => void handleCreate()}
              />
            </>
          ) : (
            <>
              <TextField
                label="Código de invitación"
                autoCapitalize="characters"
                value={inviteCode}
                onChangeText={setInviteCode}
                placeholder="Ej. A1B2C3"
              />
              <Text className="text-xs text-stone-500">
                Lo ves en Ajustes → Invitar (quien creó el piso).
              </Text>
              {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
              <Button
                label="Unirme al piso"
                loading={loading}
                onPress={() => void handleJoin()}
              />
            </>
          )}
        </View>
      </Animated.View>

      <Button
        label="Cerrar sesión"
        variant="ghost"
        onPress={() => {
          void confirm({
            title: 'Cerrar sesión',
            message: '¿Seguro que quieres salir de HOMPANY en este dispositivo?',
            confirmLabel: 'Cerrar sesión',
            tone: 'neutral',
          }).then((ok) => {
            if (ok) {
              void signOut();
            }
          });
        }}
      />
    </Screen>
  );
}
