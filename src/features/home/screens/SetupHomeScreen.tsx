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
import { useLocale } from '@/providers/LocaleProvider';
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
  const { t } = useLocale();
  const [mode, setMode] = useState<Mode>('join');
  const [name, setName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setError(null);
    const parsed = createHomeInputSchema.safeParse({ name });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('toast.invalidName'));
      return;
    }

    setLoading(true);
    try {
      await createHome(parsed.data);
    } catch (err) {
      setError(errorMessage(err, t('toast.homeCreateFail')));
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    setError(null);
    const parsed = joinHomeInputSchema.safeParse({ inviteCode });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('toast.invalidCode'));
      return;
    }

    setLoading(true);
    try {
      await joinHome(parsed.data);
    } catch (err) {
      setError(errorMessage(err, t('toast.joinFail')));
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
        <Text className="text-xl font-semibold text-stone-900">{t('setup.title')}</Text>
        <Text className="text-base text-stone-600">{t('setup.body')}</Text>
      </Animated.View>

      {homes.length > 0 ? (
        <Animated.View entering={FadeInDown.delay(60).duration(420)} className="gap-2">
          <Text className="text-sm font-semibold text-stone-700">{t('setup.yourHomes')}</Text>
          {homes.map((home) => (
            <Pressable
              key={home.id}
              className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3"
              onPress={() => {
                void setActiveHomeId(home.id);
              }}>
              <Text className="text-base font-semibold text-stone-900">{home.name}</Text>
              <Text className="text-sm text-stone-500">
                {t('settings.codeLabel', { code: home.invite_code })}
              </Text>
            </Pressable>
          ))}
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(100).duration(420)} className="gap-3">
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Button
              label={t('setup.create')}
              variant={mode === 'create' ? 'primary' : 'secondary'}
              onPress={() => setMode('create')}
            />
          </View>
          <View className="flex-1">
            <Button
              label={t('setup.haveCode')}
              variant={mode === 'join' ? 'primary' : 'secondary'}
              onPress={() => setMode('join')}
            />
          </View>
        </View>

        <View className="gap-3">
          {mode === 'create' ? (
            <>
              <TextField
                label={t('setup.homeName')}
                value={name}
                onChangeText={setName}
                placeholder={t('setup.homeName.ph')}
              />
              {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
              <Button
                label={t('setup.create')}
                loading={loading}
                onPress={() => void handleCreate()}
              />
            </>
          ) : (
            <>
              <TextField
                label={t('setup.inviteCode')}
                autoCapitalize="characters"
                value={inviteCode}
                onChangeText={setInviteCode}
                placeholder={t('setup.inviteCode.ph')}
              />
              <Text className="text-xs text-stone-500">{t('setup.joinHint')}</Text>
              {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
              <Button
                label={t('setup.join')}
                loading={loading}
                onPress={() => void handleJoin()}
              />
            </>
          )}
        </View>
      </Animated.View>

      <Button
        label={t('settings.signOut')}
        variant="ghost"
        onPress={() => {
          void confirm({
            title: t('settings.signOut'),
            message: t('settings.signOutBody'),
            confirmLabel: t('settings.signOut'),
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
