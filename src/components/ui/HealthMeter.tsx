import { Text, View } from 'react-native';

import type { TaskBoardSummary } from '@/features/tasks/lib/task-summary';

type HealthMeterProps = {
  summary: TaskBoardSummary;
};

const TONE: Record<
  TaskBoardSummary['healthLabel'],
  { bar: string; bg: string; border: string; text: string }
> = {
  Excelente: {
    bar: 'bg-emerald-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-800',
  },
  Regular: {
    bar: 'bg-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
  },
  Crítico: {
    bar: 'bg-red-500',
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
  },
};

/**
 * Linear health meter with color by state (green / amber / red).
 */
export function HealthMeter({ summary }: HealthMeterProps) {
  const tone = TONE[summary.healthLabel];
  const width = `${Math.max(4, Math.min(100, summary.healthScore))}%` as `${number}%`;

  return (
    <View
      className={`rounded-2xl border p-4 gap-3 ${tone.bg} ${tone.border}`}
      style={{
        shadowColor: '#1c1917',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
      }}>
      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-stone-500">Estado del piso</Text>
        <Text className={`text-base font-bold ${tone.text}`}>{summary.healthLabel}</Text>
      </View>
      <View className="h-3.5 overflow-hidden rounded-full bg-white/90">
        <View className={`h-3.5 rounded-full ${tone.bar}`} style={{ width }} />
      </View>
      <Text className="text-sm text-stone-700">
        Cumplimiento {summary.healthScore}%
        {summary.overdue > 0
          ? ` · ${summary.overdue} vencida${summary.overdue === 1 ? '' : 's'}`
          : summary.pending > 0
            ? ` · ${summary.pending} pendiente${summary.pending === 1 ? '' : 's'}`
            : ' · sin vencidas'}
      </Text>
    </View>
  );
}

type MetricsBarProps = {
  pending: number;
  submitted: number;
  completed: number;
};

/**
 * Single horizontal strip replacing three stacked counter cards.
 */
export function MetricsBar({ pending, submitted, completed }: MetricsBarProps) {
  return (
    <View
      className="flex-row rounded-2xl border border-stone-200 bg-white/90"
      style={{
        shadowColor: '#1c1917',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 1,
      }}>
      <View className="flex-1 items-center py-3">
        <Text
          className={`text-lg font-bold ${pending > 0 ? 'text-blue-800' : 'text-stone-900'}`}>
          {pending}
        </Text>
        <Text className="text-[11px] text-stone-500">Pendientes</Text>
      </View>
      <View className="w-px bg-stone-200" />
      <View className="flex-1 items-center py-3">
        <Text
          className={`text-lg font-bold ${submitted > 0 ? 'text-sky-800' : 'text-stone-900'}`}>
          {submitted}
        </Text>
        <Text className="text-[11px] text-stone-500">En revisión</Text>
      </View>
      <View className="w-px bg-stone-200" />
      <View className="flex-1 items-center py-3">
        <Text
          className={`text-lg font-bold ${completed > 0 ? 'text-emerald-800' : 'text-stone-900'}`}>
          {completed}
        </Text>
        <Text className="text-[11px] text-stone-500">Hechas</Text>
      </View>
    </View>
  );
}
