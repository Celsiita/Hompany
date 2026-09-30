import { Text, View } from 'react-native';

import type { TutorialHighlight } from '@/lib/tutorial';

type TutorialFocusFrameProps = {
  highlight: TutorialHighlight;
};

type FocusSlot = {
  label: string;
  /** Approximate vertical placement as % of screen above the sheet. */
  topPct: number;
  leftPct: number;
  widthPct: number;
  heightPct: number;
};

const FOCUS_SLOTS: Partial<Record<TutorialHighlight, FocusSlot>> = {
  feed: {
    label: 'Feed · estado y ranking',
    topPct: 14,
    leftPct: 6,
    widthPct: 88,
    heightPct: 28,
  },
  bell: {
    label: 'Campanita de avisos',
    topPct: 6,
    leftPct: 62,
    widthPct: 32,
    heightPct: 8,
  },
  agenda: {
    label: 'Agenda · calendario',
    topPct: 18,
    leftPct: 6,
    widthPct: 88,
    heightPct: 36,
  },
  piso: {
    label: 'Piso · vida del hogar',
    topPct: 18,
    leftPct: 6,
    widthPct: 88,
    heightPct: 32,
  },
  tasks: {
    label: 'Pestaña Tareas',
    topPct: 86,
    leftPct: 26,
    widthPct: 22,
    heightPct: 8,
  },
  expenses: {
    label: 'Pestaña Gastos',
    topPct: 86,
    leftPct: 50,
    widthPct: 22,
    heightPct: 8,
  },
  settings: {
    label: 'Pestaña Ajustes',
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
          <Text className="text-[11px] font-bold text-white">{slot.label}</Text>
        </View>
      </View>
    </View>
  );
}
