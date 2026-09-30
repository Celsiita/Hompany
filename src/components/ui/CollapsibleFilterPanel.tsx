import { useState, type ReactNode } from 'react';
import { Text, View } from 'react-native';

import { SafePressable } from '@/components/ui/SafePressable';
import { interactive, mergeStyles } from '@/lib/interactive-styles';

type CollapsibleFilterPanelProps = {
  children: ReactNode;
  /** Shown when one or more filters differ from default (e.g. "2 activos"). */
  activeHint?: string | null;
  /** Hint under the title when the panel is closed. */
  closedHint?: string;
};

/**
 * Toggle button that shows/hides a filter block (Home, Tareas, Gastos).
 */
export function CollapsibleFilterPanel({
  children,
  activeHint,
  closedHint = 'Alcance, tipo, periodicidad…',
}: CollapsibleFilterPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <View className="gap-2">
      <SafePressable
        onPress={() => setOpen((value) => !value)}
        contentStyle={mergeStyles(interactive.rowBetween, interactive.borderedCard, {
          paddingHorizontal: 14,
          paddingVertical: 12,
          backgroundColor: open ? '#f0fdfa' : '#ffffff',
          borderColor: open ? '#99f6e4' : '#e7e5e4',
        })}>
        <View className="flex-1 gap-0.5">
          <Text className="text-sm font-bold text-stone-900">
            Filtros{activeHint ? ` · ${activeHint}` : ''}
          </Text>
          <Text className="text-[11px] text-stone-500">
            {open ? 'Toca para ocultar' : closedHint}
          </Text>
        </View>
        <Text className="text-base text-teal-800" accessibilityLabel={open ? 'Ocultar filtros' : 'Mostrar filtros'}>
          {open ? '▲' : '▼'}
        </Text>
      </SafePressable>
      {open ? (
        <View className="gap-3 rounded-2xl border border-stone-200 bg-white/90 p-3">{children}</View>
      ) : null}
    </View>
  );
}

type CollapsibleSectionProps = {
  title: string;
  info?: ReactNode;
  accent?: 'violet' | 'amber' | 'teal' | 'stone';
  children: ReactNode;
  defaultExpanded?: boolean;
};

const ACCENT = {
  violet: {
    border: 'border-violet-200',
    bg: 'bg-violet-50/40',
    title: 'text-violet-900',
    chevron: 'text-violet-700',
  },
  amber: {
    border: 'border-amber-200',
    bg: 'bg-amber-50/30',
    title: 'text-amber-950',
    chevron: 'text-amber-800',
  },
  teal: {
    border: 'border-teal-200',
    bg: 'bg-teal-50/40',
    title: 'text-teal-900',
    chevron: 'text-teal-700',
  },
  stone: {
    border: 'border-stone-200',
    bg: 'bg-white/80',
    title: 'text-stone-900',
    chevron: 'text-stone-600',
  },
} as const;

/**
 * Collapsible card section (Ausencias, Modo silencio).
 */
export function CollapsibleSection({
  title,
  info,
  accent = 'teal',
  children,
  defaultExpanded = false,
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const tone = ACCENT[accent];

  return (
    <View className={`gap-0 rounded-2xl border ${tone.border} ${tone.bg} overflow-hidden`}>
      <SafePressable
        onPress={() => setExpanded((value) => !value)}
        contentStyle={mergeStyles(interactive.rowBetween, {
          paddingHorizontal: 16,
          paddingVertical: 12,
        })}>
        <View className="flex-row flex-1 items-center gap-2">
          <Text className={`text-sm font-semibold ${tone.title}`}>{title}</Text>
          {info}
        </View>
        <Text className={`text-xs font-semibold ${tone.chevron}`}>
          {expanded ? '▲' : '▼'}
        </Text>
      </SafePressable>
      {expanded ? <View className="gap-3 border-t border-white/60 px-4 pb-4 pt-3">{children}</View> : null}
    </View>
  );
}
