import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import type { TaskBoardSummary } from '@/features/tasks/lib/task-summary';

type HealthMeterProps = {
  summary: TaskBoardSummary;
};

const TONE: Record<
  TaskBoardSummary['healthLabel'],
  { bar: string; bg: string; border: string; text: string; chip: string }
> = {
  Excelente: {
    bar: 'bg-emerald-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-900',
    chip: 'bg-emerald-100',
  },
  Regular: {
    bar: 'bg-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-900',
    chip: 'bg-amber-100',
  },
  Crítico: {
    bar: 'bg-red-500',
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-900',
    chip: 'bg-red-100',
  },
};

const CARD_SHADOW = {
  shadowColor: '#1c1917',
  shadowOpacity: 0.1,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 3,
} as const;

/**
 * One-line status under the health score (overdue beats pending).
 */
export function formatHealthDetailLine(
  summary: Pick<TaskBoardSummary, 'overdue' | 'pending'>,
): string {
  if (summary.overdue > 0) {
    return `${summary.overdue} vencida${summary.overdue === 1 ? '' : 's'}`;
  }
  if (summary.pending > 0) {
    return `${summary.pending} pendiente${summary.pending === 1 ? '' : 's'}`;
  }
  return 'Sin vencidas';
}

/**
 * Hero health card for Feed: big %, label chip, bar, and task counters in one block.
 */
export function HealthMeter({ summary }: HealthMeterProps) {
  const tone = TONE[summary.healthLabel];
  const width = `${Math.max(4, Math.min(100, summary.healthScore))}%` as `${number}%`;

  return (
    <Animated.View
      entering={FadeInDown.duration(320).springify().damping(18)}
      className={`gap-4 rounded-3xl border p-5 ${tone.bg} ${tone.border}`}
      style={CARD_SHADOW}>
      <View className="flex-row items-end justify-between gap-3">
        <View className="gap-1">
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
            Cumplimiento
          </Text>
          <Text className={`text-4xl font-black tracking-tight ${tone.text}`}>
            {summary.healthScore}%
          </Text>
        </View>
        <View className={`rounded-full px-3 py-1.5 ${tone.chip}`}>
          <Text className={`text-sm font-bold ${tone.text}`}>{summary.healthLabel}</Text>
        </View>
      </View>

      <View className="h-4 overflow-hidden rounded-full bg-white/85">
        <View className={`h-4 rounded-full ${tone.bar}`} style={{ width }} />
      </View>

      <Text className="text-sm leading-5 text-stone-700">{formatHealthDetailLine(summary)}</Text>

      <MetricsBar
        pending={summary.pending}
        submitted={summary.submitted}
        completed={summary.completed}
        embedded
      />
    </Animated.View>
  );
}

type MetricsBarProps = {
  pending: number;
  submitted: number;
  completed: number;
  /** When true, sits inside HealthMeter without outer card chrome. */
  embedded?: boolean;
};

/**
 * Horizontal strip: pendientes / en revisión / hechas.
 */
export function MetricsBar({
  pending,
  submitted,
  completed,
  embedded = false,
}: MetricsBarProps) {
  const body = (
    <>
      <MetricCell
        value={pending}
        label="Pendientes"
        activeClass="text-blue-800"
        active={pending > 0}
      />
      <View className="w-px self-stretch bg-stone-200/90" />
      <MetricCell
        value={submitted}
        label="En revisión"
        activeClass="text-sky-800"
        active={submitted > 0}
      />
      <View className="w-px self-stretch bg-stone-200/90" />
      <MetricCell
        value={completed}
        label="Hechas"
        activeClass="text-emerald-800"
        active={completed > 0}
      />
    </>
  );

  if (embedded) {
    return (
      <View className="flex-row overflow-hidden rounded-2xl border border-white/70 bg-white/80">
        {body}
      </View>
    );
  }

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
      {body}
    </View>
  );
}

type MetricCellProps = {
  value: number;
  label: string;
  activeClass: string;
  active: boolean;
};

function MetricCell({ value, label, activeClass, active }: MetricCellProps) {
  return (
    <View className="flex-1 items-center py-3">
      <Text className={`text-xl font-bold ${active ? activeClass : 'text-stone-900'}`}>{value}</Text>
      <Text className="text-[11px] text-stone-500">{label}</Text>
    </View>
  );
}
