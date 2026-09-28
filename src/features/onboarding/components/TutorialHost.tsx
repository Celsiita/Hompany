import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { MASCOT_NAME } from '@/lib/mascot';
import {
  isTutorialCompleted,
  markTutorialCompleted,
  TUTORIAL_STEPS,
} from '@/lib/tutorial';
import { useAuth } from '@/providers/AuthProvider';
import { useHome } from '@/providers/HomeProvider';

type TutorialHostProps = {
  /** Force-open from Settings (replay). */
  forceOpen?: boolean;
  onForceOpenHandled?: () => void;
};

/**
 * First-run (and replayable) tutorial overlay hosted by Mico.
 */
export function TutorialHost({ forceOpen = false, onForceOpenHandled }: TutorialHostProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { activeHomeId, isLoading: homeLoading } = useHome();
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const step = TUTORIAL_STEPS[stepIndex] ?? TUTORIAL_STEPS[0];
  const isLast = stepIndex >= TUTORIAL_STEPS.length - 1;

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      if (authLoading || homeLoading || !user || !activeHomeId) {
        return;
      }
      const done = await isTutorialCompleted();
      if (cancelled) {
        return;
      }
      setReady(true);
      if (!done) {
        setStepIndex(0);
        setVisible(true);
      }
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, [authLoading, homeLoading, user, activeHomeId]);

  useEffect(() => {
    if (!forceOpen) {
      return;
    }
    setStepIndex(0);
    setVisible(true);
    onForceOpenHandled?.();
  }, [forceOpen, onForceOpenHandled]);

  const finish = useCallback(async () => {
    await markTutorialCompleted();
    setVisible(false);
    setStepIndex(0);
  }, []);

  const next = useCallback(() => {
    if (isLast) {
      void finish();
      return;
    }
    setStepIndex((index) => index + 1);
  }, [finish, isLast]);

  const progressLabel = useMemo(
    () => `${stepIndex + 1} / ${TUTORIAL_STEPS.length}`,
    [stepIndex],
  );

  if (!ready && !forceOpen) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => void finish()}>
      <View className="flex-1 items-center justify-center bg-black/50 px-5">
        <View className="w-full max-w-md gap-4 rounded-3xl bg-white p-5">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-semibold uppercase tracking-wide text-amber-800">
              Tutorial · {MASCOT_NAME}
            </Text>
            <Text className="text-xs text-gray-500">{progressLabel}</Text>
          </View>

          <View className="items-center gap-2 py-2">
            <Text className="text-5xl">{step.emoji}</Text>
            <Text className="text-center text-xl font-bold text-gray-900">{step.title}</Text>
            <Text className="text-center text-sm leading-5 text-gray-600">{step.body}</Text>
          </View>

          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button label="Saltar" variant="secondary" onPress={() => void finish()} />
            </View>
            <View className="flex-1">
              <Button label={isLast ? 'Listo' : 'Siguiente'} onPress={next} />
            </View>
          </View>

          <Pressable onPress={() => void finish()} hitSlop={8}>
            <Text className="text-center text-xs text-gray-400">Cerrar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
