import { Text, View } from 'react-native';

import type { TutorialHighlight } from '@/lib/tutorial';
import { tutorialHighlightLabel } from '@/lib/tutorial';
import { useLocale } from '@/providers/LocaleProvider';

type TutorialFocusFrameProps = {
  highlight: TutorialHighlight;
};

type FocusSlot = {
  /** Approximate vertical placement as % of screen above the sheet. */
  topPct: number;
  leftPct: number;
  widthPct: number;
  heightPct: number;
};

const FOCUS_SLOTS: Partial<Record<TutorialHighlight, FocusSlot>> = {
  feed: {
    topPct: 14,
    leftPct: 6,
    widthPct: 88,
    heightPct: 28,
  },
  bell: {
    topPct: 6,
    leftPct: 62,
    widthPct: 32,
    heightPct: 8,
  },
  agenda: {
    topPct: 18,
    leftPct: 6,
    widthPct: 88,
    heightPct: 36,
  },
  piso: {
    topPct: 18,
    leftPct: 6,
    widthPct: 88,
    heightPct: 32,
  },
  tasks: {
    topPct: 86,
    leftPct: 26,
    widthPct: 22,
    heightPct: 8,
  },
  expenses: {
    topPct: 86,
    leftPct: 50,
    widthPct: 22,
    heightPct: 8,
  },
  settings: {
    topPct: 86,
    leftPct: 74,
    widthPct: 22,
    heightPct: 8,
  },
};

/**
 * Dim overlay with a cutout frame pointing at the UI area for the current tour step.
 */
export function TutorialFocusFrame({ highlight }: TutorialFocusFrameProps) {
  const { locale } = useLocale();
  const slot = FOCUS_SLOTS[highlight];
  if (!slot) {
    return <View className="absolute inset-0 bg-black/45" pointerEvents="none" />;
  }

  return (
    <View className="absolute inset-0" pointerEvents="none">
      <View className="absolute inset-0 bg-black/50" />
      <View
        className="absolute items-center justify-center rounded-2xl border-2 border-teal-300 bg-teal-400/15"
        style={{
          top: `${slot.topPct}%`,
          left: `${slot.leftPct}%`,
          width: `${slot.widthPct}%`,
          height: `${slot.heightPct}%`,
        }}>
        <View className="rounded-full bg-teal-500 px-3 py-1">
          <Text className="text-[11px] font-bold text-white">
            {tutorialHighlightLabel(highlight, locale)}
          </Text>
        </View>
      </View>
    </View>
  );
}
