import { useState, type ReactNode } from 'react';
import { Text, View } from 'react-native';

import { SafePressable } from '@/components/ui/SafePressable';
import { interactive, mergeStyles, palette } from '@/lib/interactive-styles';

type CollapsibleFilterPanelProps = {
  children: ReactNode;
  /** Shown when one or more filters differ from default (e.g. "2 activos"). */
  activeHint?: string | null;
  /** Hint under the title when the panel is closed. */
  closedHint?: string;
};

/**
 * Single-card filter toggle shared by Agenda, Tareas and Gastos.
 */
export function CollapsibleFilterPanel({
  children,
  activeHint,
  closedHint = 'Alcance, tipo, periodicidad…',
}: CollapsibleFilterPanelProps) {
  const [open, setOpen] = useState(false);
  const hasActive = Boolean(activeHint);

  return (
    <View
      className="overflow-hidden rounded-2xl border"
      style={{
        borderColor: open || hasActive ? palette.emerald200 : palette.gray200,
        backgroundColor: open ? '#f0fdfa' : palette.white,
      }}>
      <SafePressable
        onPress={() => setOpen((value) => !value)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={open ? 'Ocultar filtros' : 'Mostrar filtros'}
        contentStyle={mergeStyles(interactive.rowBetween, {
          paddingHorizontal: 14,
          paddingVertical: 12,
        })}>
        <View className="min-w-0 flex-1 flex-row items-center gap-2">
          <View className="min-w-0 flex-1 gap-0.5">
            <Text className="text-sm font-bold text-stone-900">Filtros</Text>
            <Text className="text-[11px] text-stone-500" numberOfLines={1}>
              {open ? 'Toca para ocultar' : closedHint}
            </Text>
          </View>
          {hasActive ? (
            <View className="rounded-full bg-teal-700 px-2.5 py-1">
              <Text className="text-[11px] font-bold text-white">{activeHint}</Text>
            </View>
          ) : null}
        </View>
        <Text className="ml-2 text-lg font-semibold text-teal-800">{open ? '⌃' : '⌄'}</Text>
      </SafePressable>
      {open ? (
        <View className="gap-3 border-t border-teal-100 bg-white px-3 pb-3 pt-3">{children}</View>
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
    divider: 'border-violet-100',
  },
  amber: {
    border: 'border-amber-200',
    bg: 'bg-amber-50/30',
    title: 'text-amber-950',
    chevron: 'text-amber-800',
    divider: 'border-amber-100',
  },
  teal: {
    border: 'border-teal-200',
    bg: 'bg-teal-50/40',
    title: 'text-teal-900',
    chevron: 'text-teal-700',
    divider: 'border-teal-100',
  },
  stone: {
    border: 'border-stone-200',
    bg: 'bg-white/80',
    title: 'text-stone-900',
    chevron: 'text-stone-600',
    divider: 'border-stone-100',
  },
} as const;

/**
 * Collapsible card section (legacy panels / settings groups).
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
    <View className={`overflow-hidden rounded-2xl border ${tone.border} ${tone.bg}`}>
      <SafePressable
        onPress={() => setExpanded((value) => !value)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        contentStyle={mergeStyles(interactive.rowBetween, {
          paddingHorizontal: 16,
          paddingVertical: 12,
        })}>
        <View className="flex-row flex-1 items-center gap-2">
          <Text className={`text-sm font-semibold ${tone.title}`}>{title}</Text>
          {info}
        </View>
        <Text className={`text-lg font-semibold ${tone.chevron}`}>{expanded ? '⌃' : '⌄'}</Text>
      </SafePressable>
      {expanded ? (
        <View className={`gap-3 border-t px-4 pb-4 pt-3 ${tone.divider}`}>{children}</View>
      ) : null}
    </View>
  );
}
