import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HelpTip } from '@/components/ui/HelpTip';
import { AgendaColorLegend } from '@/features/home/components/AgendaColorLegend';
import { AgendaDayMarkers } from '@/features/home/components/AgendaDayMarkers';
import {
  agendaItemsForDay,
  agendaLifeVisibility,
  buildAgendaItems,
  computeAgendaDayDots,
  computeAgendaDayEmojis,
  startOfDay,
  type AgendaItem,
  type AgendaLifeFocus,
  type AgendaScopeFilter,
  type AgendaViewScope,
} from '@/features/home/lib/agenda-items';
import {
  buildMonthCells,
  clampWeekAnchor,
  daysInWeek,
  monthTitleForCalendar,
  shiftMonth,
  shiftWeek,
  startOfMonth,
} from '@/features/home/lib/month-calendar';
import { hasAbsencesOnDate } from '@/lib/absences';
import { hasExamPeriodsOnDate } from '@/lib/exam-periods';
import { noticeEmojisOnDate } from '@/lib/home-notices';
import { interactive, mergeStyles, palette } from '@/lib/interactive-styles';
import { useIconPack } from '@/providers/IconPackProvider';
import { useLocale } from '@/providers/LocaleProvider';
import type { MemberAbsence } from '@/schemas/absence.schema';
import type { MemberExamPeriod } from '@/schemas/exam-period.schema';
import type { HomeNotice } from '@/schemas/home-notice.schema';
import type { ExpenseWithRelations, TaskWithRelations } from '@/types/database.types';

const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const WEEKDAY_SHORT = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
const MONTH_CELL_HEIGHT = 68;

type AgendaCalendarProps = {
  tasks: TaskWithRelations[];
  expenses: ExpenseWithRelations[];
  absences?: MemberAbsence[];
  examPeriods?: MemberExamPeriod[];
  calendarNotices?: HomeNotice[];
  currentUserId?: string | null;
  scope?: AgendaScopeFilter;
  lifeFocus?: AgendaLifeFocus;
  viewScope: AgendaViewScope;
  expanded: boolean;
  onToggleExpanded: () => void;
  visibleMonth: Date;
  onVisibleMonthChange: (month: Date) => void;
  weekAnchor: Date;
  onWeekAnchorChange: (anchor: Date) => void;
  selectedDay: Date | null;
  onSelectDay: (day: Date) => void;
  now?: Date;
};

/**
 * Collapsible agenda calendar: compact week strip (default) or full month grid.
 */
export function AgendaCalendar({
  tasks,
  expenses,
  absences = [],
  examPeriods = [],
  calendarNotices = [],
  currentUserId,
  scope,
  lifeFocus = 'ALL',
  viewScope,
  expanded,
  onToggleExpanded,
  visibleMonth,
  onVisibleMonthChange,
  weekAnchor,
  onWeekAnchorChange,
  selectedDay,
  onSelectDay,
  now = new Date(),
}: AgendaCalendarProps) {
  const { pack } = useIconPack();
  const { t, locale } = useLocale();
  const weekdayLabels = locale === 'en' ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : WEEKDAY_LABELS;
  const weekdayShort =
    locale === 'en'
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : WEEKDAY_SHORT;

  const horizon = useMemo(() => {
    if (expanded) {
      return startOfDay(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 2, 0));
    }
    const end = startOfDay(now);
    end.setMonth(end.getMonth() + 3);
    return end;
  }, [expanded, visibleMonth, now]);

  const items = useMemo(
    () =>
      buildAgendaItems({
        tasks,
        expenses,
        currentUserId,
        pack,
        now,
        horizon,
        scope,
      }),
    [tasks, expenses, currentUserId, pack, now, horizon, scope],
  );

  const weekDays = useMemo(() => daysInWeek(weekAnchor), [weekAnchor]);
  const monthCells = useMemo(() => buildMonthCells(visibleMonth, now), [visibleMonth, now]);
  const showOthers = viewScope === 'others' || viewScope === 'ALL';
  const life = agendaLifeVisibility(lifeFocus);
  const canGoPrevWeek =
    clampWeekAnchor(shiftWeek(weekAnchor, -1, now), now).getTime() < startOfDay(weekAnchor).getTime();

  function isSelected(day: Date): boolean {
    return selectedDay != null && startOfDay(selectedDay).getTime() === day.getTime();
  }

  function isToday(day: Date): boolean {
    return startOfDay(day).getTime() === startOfDay(now).getTime();
  }

  function handleSelectDay(day: Date) {
    onSelectDay(day);
    onWeekAnchorChange(day);
    onVisibleMonthChange(startOfMonth(day));
  }

  function daySurfaceStyle(day: Date) {
    const inSilence = life.silence && hasExamPeriodsOnDate(examPeriods, day);
    const inAbsence = life.absences && hasAbsencesOnDate(absences, day);
    return mergeStyles(
      styles.daySurface,
      interactive.center,
      inSilence ? styles.silenceDay : inAbsence ? styles.absenceDay : undefined,
      isSelected(day) ? styles.selectedDay : isToday(day) ? styles.todayDay : undefined,
    );
  }

  function renderDayCell(day: Date, compact: boolean) {
    const dayItems = agendaItemsForDay(items, day);
    const dots = computeAgendaDayDots(dayItems);
    const inSilence = life.silence && hasExamPeriodsOnDate(examPeriods, day);
    const inAbsence = life.absences && hasAbsencesOnDate(absences, day);
    const noticeEmojis = life.visits ? noticeEmojisOnDate(calendarNotices, day) : [];
    const emojis = computeAgendaDayEmojis(dayItems, {
      silence: inSilence,
      absence: inAbsence,
      noticeEmojis,
    });
    const today = isToday(day);

    return (
      <Pressable
        cssInterop={false}
        onPress={() => handleSelectDay(day)}
        style={mergeStyles(
          compact ? styles.weekDayButton : styles.monthDayButton,
          daySurfaceStyle(day),
        )}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected(day) }}>
        {compact ? (
          <Text style={styles.weekdayShort}>
            {weekdayShort[day.getDay() === 0 ? 6 : day.getDay() - 1]}
          </Text>
        ) : null}
        <Text style={today ? styles.dayNumberToday : styles.dayNumber}>
          {day.getDate()}
        </Text>
        <AgendaDayMarkers dots={dots} emojis={emojis} showOthers={showOthers} />
      </Pressable>
    );
  }

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <View className="min-w-0 flex-1 flex-row items-center gap-2 pr-2">
          <Text className="text-base font-semibold text-stone-900" numberOfLines={1}>
            {monthTitleForCalendar({
              expanded,
              visibleMonth,
              weekDays,
              now,
            })}
          </Text>
          <HelpTip
            title={t('home.agenda')}
            message={t('agenda.help')}
            extra={<AgendaColorLegend />}
          />
        </View>
        <View className="flex-row items-center gap-2">
          {expanded ? (
            <>
              <Pressable
                cssInterop={false}
                onPress={() => onVisibleMonthChange(shiftMonth(visibleMonth, -1))}
                style={styles.navButton}
                accessibilityLabel="Mes anterior">
                <Text className="text-base font-bold text-stone-700">‹</Text>
              </Pressable>
              <Pressable
                cssInterop={false}
                onPress={() => onVisibleMonthChange(shiftMonth(visibleMonth, 1))}
                style={styles.navButton}
                accessibilityLabel="Mes siguiente">
                <Text className="text-base font-bold text-stone-700">›</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable
                cssInterop={false}
                onPress={() => {
                  if (!canGoPrevWeek) {
                    return;
                  }
                  onWeekAnchorChange(shiftWeek(weekAnchor, -1, now));
                }}
                style={[styles.navButton, !canGoPrevWeek ? { opacity: 0.35 } : null]}
                accessibilityLabel="Semana anterior"
                accessibilityState={{ disabled: !canGoPrevWeek }}>
                <Text className="text-base font-bold text-stone-700">‹</Text>
              </Pressable>
              <Pressable
                cssInterop={false}
                onPress={() => onWeekAnchorChange(shiftWeek(weekAnchor, 1, now))}
                style={styles.navButton}
                accessibilityLabel="Semana siguiente">
                <Text className="text-base font-bold text-stone-700">›</Text>
              </Pressable>
            </>
          )}
          <Pressable
            cssInterop={false}
            onPress={onToggleExpanded}
            style={styles.toggleButton}
            accessibilityLabel={expanded ? 'Volver a vista semanal' : 'Ver mes completo'}>
            <Text className="text-xs font-semibold text-teal-800">
              {expanded ? 'Ver semana' : 'Ver mes'}
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="rounded-2xl border border-stone-200 bg-white/95 p-2">
        {expanded ? (
          <>
            <View className="mb-1 flex-row">
              {weekdayLabels.map((label) => (
                <View key={label} className="flex-1 items-center py-1">
                  <Text className="text-[10px] font-bold uppercase text-stone-400">{label}</Text>
                </View>
              ))}
            </View>
            <View className="flex-row flex-wrap">
              {monthCells.map((cell, index) =>
                cell.date ? (
                  <View key={cell.date.toISOString()} style={styles.monthCellSlot}>
                    {renderDayCell(cell.date, false)}
                  </View>
                ) : (
                  <View key={`pad-${index}`} style={styles.monthCellSlot} />
                ),
              )}
            </View>
          </>
        ) : (
          <View className="flex-row">
            {weekDays.map((day) => (
              <View key={day.toISOString()} className="min-w-0 flex-1 px-0.5">
                {renderDayCell(day, true)}
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navButton: {
    height: 36,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    backgroundColor: palette.gray100,
  },
  toggleButton: {
    borderRadius: 9999,
    backgroundColor: palette.brandSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  monthCellSlot: {
    width: '14.28%',
    height: MONTH_CELL_HEIGHT,
    padding: 2,
  },
  weekDayButton: {
    flex: 1,
    width: '100%',
    minHeight: 64,
  },
  monthDayButton: {
    flex: 1,
    width: '100%',
    minHeight: MONTH_CELL_HEIGHT - 4,
  },
  daySurface: {
    borderRadius: 12,
    paddingHorizontal: 2,
    paddingVertical: 3,
  },
  silenceDay: { backgroundColor: 'rgba(237, 233, 254, 0.55)' },
  absenceDay: { backgroundColor: 'rgba(254, 243, 199, 0.55)' },
  selectedDay: { borderWidth: 2, borderColor: palette.brand },
  todayDay: { borderWidth: 1, borderColor: palette.brandMuted },
  weekdayShort: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#9ca3af',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  dayNumberToday: {
    fontWeight: '700',
    color: palette.brandDark,
  },
});

export type { AgendaItem };
