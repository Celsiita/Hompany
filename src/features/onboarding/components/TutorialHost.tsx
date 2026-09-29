import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import type { HomeSection } from '@/components/ui/HomeSectionBar';
import { Button } from '@/components/ui/Button';
import { MASCOT_NAME } from '@/lib/mascot';
import {
  isTutorialCompleted,
  markTutorialCompleted,
  TUTORIAL_STEPS,
  type TutorialHighlight,
} from '@/lib/tutorial';
import { useAuth } from '@/providers/AuthProvider';
import { useHome } from '@/providers/HomeProvider';

type TutorialHostProps = {
  /** Force-open from Settings (replay). */
  forceOpen?: boolean;
  onForceOpenHandled?: () => void;
  setHomeSection: (section: HomeSection) => void;
};

const HIGHLIGHT_COPY: Record<TutorialHighlight, string> = {
  welcome: 'Tour guiado',
  feed: 'Sección Feed',
  agenda: 'Sección Agenda',
  piso: 'Sección Piso',
  bell: 'Campanita de avisos',
  tasks: 'Pestaña Tareas',
  expenses: 'Pestaña Gastos',
  settings: 'Pestaña Ajustes',
};

/**
 * Interactive first-run tutorial: switches Home sections and can jump to tabs.
 */
export function TutorialHost({
  forceOpen = false,
  onForceOpenHandled,
  setHomeSection,
}: TutorialHostProps) {
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

  useEffect(() => {
    if (!visible) {
      return;
    }
    if (step.homeSection) {
      setHomeSection(step.homeSection);
      router.push('/(tabs)');
    }
  }, [visible, step.homeSection, step.id, setHomeSection]);

  const finish = useCallback(async () => {
    await markTutorialCompleted();
    setVisible(false);
    setStepIndex(0);
    router.push('/(tabs)');
  }, []);

  const runCta = useCallback(() => {
    if (step.goTab) {
      router.push(step.goTab);
    } else if (step.homeSection) {
      setHomeSection(step.homeSection);
      router.push('/(tabs)');
    }

    if (isLast) {
      void finish();
      return;
    }
    setStepIndex((index) => index + 1);
  }, [finish, isLast, setHomeSection, step.goTab, step.homeSection]);

  const progressLabel = useMemo(
    () => `${stepIndex + 1} / ${TUTORIAL_STEPS.length}`,
    [stepIndex],
  );

  if (!ready && !forceOpen) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => void finish()}>
      <View className="flex-1 justify-end bg-black/55">
        <View className="mx-3 mb-3 gap-3 rounded-3xl bg-white p-5">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-semibold uppercase tracking-wide text-teal-800">
              {MASCOT_NAME} · tour
            </Text>
            <Text className="text-xs text-stone-500">{progressLabel}</Text>
          </View>

          <View className="flex-row gap-1.5">
            {TUTORIAL_STEPS.map((item, index) => (
              <View
                key={item.id}
                className={`h-1.5 flex-1 rounded-full ${
                  index <= stepIndex ? 'bg-teal-600' : 'bg-stone-200'
                }`}
              />
            ))}
          </View>

          <View className="self-start rounded-full bg-teal-50 px-3 py-1">
            <Text className="text-[11px] font-bold text-teal-900">
              {HIGHLIGHT_COPY[step.highlight]}
            </Text>
          </View>

          <View className="items-center gap-2 py-1">
            <Text className="text-5xl">{step.emoji}</Text>
            <Text className="text-center text-xl font-bold text-stone-900">{step.title}</Text>
            <Text className="text-center text-sm leading-5 text-stone-600">{step.body}</Text>
            {step.tip ? (
              <Text className="text-center text-xs text-teal-800">{step.tip}</Text>
            ) : null}
          </View>

          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button label="Saltar" variant="secondary" onPress={() => void finish()} />
            </View>
            <View className="flex-1">
              <Button label={step.cta} onPress={runCta} />
            </View>
          </View>

          {!isLast ? (
            <Pressable
              onPress={() => setStepIndex((index) => Math.min(index + 1, TUTORIAL_STEPS.length - 1))}
              hitSlop={8}>
              <Text className="text-center text-xs font-semibold text-stone-400">
                Continuar sin moverme
              </Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => void finish()} hitSlop={8}>
              <Text className="text-center text-xs text-stone-400">Cerrar</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}
