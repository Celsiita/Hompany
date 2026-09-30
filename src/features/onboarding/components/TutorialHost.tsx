import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import type { HomeSection } from '@/components/ui/HomeSectionBar';
import { Button } from '@/components/ui/Button';
import { TutorialFocusFrame } from '@/features/onboarding/components/TutorialFocusFrame';
import { TutorialPreview } from '@/features/onboarding/components/TutorialPreview';
import { MASCOT_NAME } from '@/lib/mascot';
import {
  getTutorialSteps,
  isTutorialCompleted,
  markTutorialCompleted,
  tutorialHighlightLabel,
} from '@/lib/tutorial';
import { useAuth } from '@/providers/AuthProvider';
import { useHome } from '@/providers/HomeProvider';
import { useLocale } from '@/providers/LocaleProvider';

type TutorialHostProps = {
  /** Force-open from Settings (replay). */
  forceOpen?: boolean;
  onForceOpenHandled?: () => void;
  setHomeSection: (section: HomeSection) => void;
};

/**
 * First-run tour after login + active home. Never shows on auth screens.
 * Each step includes a visual mini-preview of the target screen.
 */
export function TutorialHost({
  forceOpen = false,
  onForceOpenHandled,
  setHomeSection,
}: TutorialHostProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { activeHomeId, isLoading: homeLoading } = useHome();
  const { locale, t } = useLocale();
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const steps = useMemo(() => getTutorialSteps(locale), [locale]);
  const canShow = Boolean(user && activeHomeId && !authLoading && !homeLoading);
  const step = steps[stepIndex] ?? steps[0];
  const isLast = stepIndex >= steps.length - 1;

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      if (!canShow) {
        setVisible(false);
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
  }, [canShow]);

  useEffect(() => {
    if (!forceOpen) {
      return;
    }
    if (!canShow) {
      onForceOpenHandled?.();
      return;
    }
    setStepIndex(0);
    setVisible(true);
    onForceOpenHandled?.();
  }, [forceOpen, canShow, onForceOpenHandled]);

  useEffect(() => {
    if (!visible || !canShow) {
      return;
    }
    if (step.homeSection) {
      setHomeSection(step.homeSection);
      router.push('/(tabs)');
    }
  }, [visible, canShow, step.homeSection, step.id, setHomeSection]);

  const finish = useCallback(async () => {
    await markTutorialCompleted();
    setVisible(false);
    setStepIndex(0);
    if (canShow) {
      router.push('/(tabs)');
    }
  }, [canShow]);

  const runCta = useCallback(() => {
    if (!canShow) {
      return;
    }
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
  }, [canShow, finish, isLast, setHomeSection, step.goTab, step.homeSection]);

  const progressLabel = useMemo(
    () => `${stepIndex + 1} / ${steps.length}`,
    [stepIndex, steps.length],
  );

  if ((!ready && !forceOpen) || !canShow || !visible) {
    return null;
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => void finish()}>
      <View className="flex-1 justify-end">
        <TutorialFocusFrame highlight={step.highlight} />
        <View className="mx-3 mb-3 gap-3 rounded-3xl bg-white p-5" style={{ elevation: 8, zIndex: 2 }}>
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-semibold uppercase tracking-wide text-teal-800">
              {MASCOT_NAME} · {t('tutorial.tour')}
            </Text>
            <Text className="text-xs text-stone-500">{progressLabel}</Text>
          </View>

          <View className="flex-row gap-1.5">
            {steps.map((item, index) => (
              <View
                key={item.id}
                className={`h-1.5 flex-1 rounded-full ${
                  index <= stepIndex ? 'bg-teal-600' : 'bg-stone-200'
                }`}
              />
            ))}
          </View>

          <View className="self-start rounded-md bg-teal-50 px-3 py-1">
            <Text className="text-[11px] font-bold text-teal-900">
              {tutorialHighlightLabel(step.highlight, locale)}
            </Text>
          </View>

          <TutorialPreview highlight={step.highlight} />

          <View className="items-center gap-1.5">
            <Text className="text-center text-xl font-bold text-stone-900">{step.title}</Text>
            <Text className="text-center text-sm leading-5 text-stone-600">{step.body}</Text>
            {step.tip ? (
              <Text className="text-center text-xs text-teal-800">{step.tip}</Text>
            ) : null}
          </View>

          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button label={t('tutorial.skip')} variant="secondary" onPress={() => void finish()} />
            </View>
            <View className="flex-1">
              <Button label={step.cta} onPress={runCta} />
            </View>
          </View>

          {!isLast ? (
            <Pressable
              onPress={() => setStepIndex((index) => Math.min(index + 1, steps.length - 1))}
              hitSlop={8}>
              <Text className="text-center text-xs font-semibold text-stone-500">
                {t('tutorial.nextStay')}
              </Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => void finish()} hitSlop={8}>
              <Text className="text-center text-xs text-stone-400">{t('tutorial.close')}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}
