import { Text, View } from 'react-native';

import type { TaskBoardSummary } from '@/features/tasks/lib/task-summary';

type HealthMeterProps = {
  summary: TaskBoardSummary;
};

const TONE: Record<
  TaskBoardSummary['healthLabel'],
  { bar: string, bg: string, border: string, text: string }
> = {
  Excelente: { bar: 'bg-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800' },
  Regular: { bar: 'bg-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800' },
  Crítico: { bar: 'bg-red-500', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800' },
};

/**
 * Linear health meter with color by state (green / amber / red).
 */
export function HealthMeter({ summary }: HealthMeterProps) {
  const tone = TONE[summary.healthLabel];
  const width = `${Math.max(4, Math.min(100, summary.healthScore))}%` as `${number}%`;

  return (
    <View className={`rounded-2xl border p-4 gap-3 ${tone.bg} ${tone.border}`}>
      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-gray-500">Estado del piso</Text>
        <Text className={`text-sm font-bold ${tone.text}`}>{summary.healthLabel}</Text>
      </View>
      <View className="h-3 overflow-hidden rounded-full bg-white/80">
        <View className={`h-3 rounded-full ${tone.bar}`} style={{ width }} />
      </View>
      <Text className="text-sm text-gray-700">
        Salud {summary.healthScore}%
        {summary.overdue > 0 ? ` · ${summary.overdue} vencidas` : ''}
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
    <View className="flex-row rounded-2xl border border-gray-200 bg-white">
      <View className="flex-1 items-center py-3">
        <Text className="text-lg font-bold text-gray-900">{pending}</Text>
        <Text className="text-[11px] text-gray-500">Pendientes</Text>
      </View>
      <View className="w-px bg-gray-200" />
      <View className="flex-1 items-center py-3">
        <Text className="text-lg font-bold text-gray-900">{submitted}</Text>
        <Text className="text-[11px] text-gray-500">Entregadas</Text>
      </View>
      <View className="w-px bg-gray-200" />
      <View className="flex-1 items-center py-3">
        <Text className="text-lg font-bold text-gray-900">{completed}</Text>
        <Text className="text-[11px] text-gray-500">Completadas</Text>
      </View>
    </View>
  );
}
