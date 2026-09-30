import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  type RefObject,
} from 'react';
import { ScrollView, Text, View } from 'react-native';

import { AgendaItemCard } from '@/features/home/components/AgendaItemCard';
import type { HomeMemberWithProfile } from '@/features/home/api/homes-api';
import {
  agendaItemsForDay,
  buildAgendaItems,
  startOfDay,
  type AgendaItem,
  type AgendaScopeFilter,
} from '@/features/home/lib/agenda-items';
import { absencesOnDate, formatAbsenceDayLabel } from '@/lib/absences';
import { examPeriodsOnDate, formatSilenceModeDayLabel } from '@/lib/exam-periods';
import {
  CALENDAR_NOTICE_GLYPH,
  CALENDAR_NOTICE_LABEL,
  noticesOnDate,
} from '@/lib/home-notices';
import { localDateKey } from '@/lib/recurrence';
import { useIconPack } from '@/providers/IconPackProvider';
import type { MemberAbsence } from '@/schemas/absence.schema';
import type { MemberExamPeriod } from '@/schemas/exam-period.schema';
import type { HomeNotice } from '@/schemas/home-notice.schema';
import type { ExpenseWithRelations, TaskWithRelations } from '@/types/database.types';

const ESTIMATED_SECTION_HEIGHT = 120;

export type AgendaListHandle = {
  scrollToDay: (day: Date) => void;
};

type AgendaListProps = {
  days: Date[];
  tasks: TaskWithRelations[];
  expenses: ExpenseWithRelations[];
  absences?: MemberAbsence[];
  examPeriods?: MemberExamPeriod[];
  calendarNotices?: HomeNotice[];
  members?: HomeMemberWithProfile[];
  currentUserId?: string | null;
  scope?: AgendaScopeFilter;
  selectedDay?: Date | null;
  now?: Date;
  scrollRef?: RefObject<ScrollView | null>;
  onOpenItem: (item: AgendaItem) => void;
};

/**
 * Continuous scrollable agenda list synced with the calendar header.
 */
export const AgendaList = forwardRef<AgendaListHandle, AgendaListProps>(function AgendaList(
  {
    days,
    tasks,
    expenses,
    absences = [],
    examPeriods = [],
    calendarNotices = [],
    members = [],
    currentUserId,
    scope,
    selectedDay,
    now = new Date(),
    scrollRef,
    onOpenItem,
  },
  ref,
) {
  const { pack } = useIconPack();
  const listRootY = useRef(0);
  const offsetsRef = useRef<Record<string, number>>({});

  const memberName = useCallback(
    (userId: string) =>
      members.find((member) => member.user_id === userId)?.profiles?.display_name ?? 'Compañero',
    [members],
  );

  const horizon = useMemo(() => {
    const last = days[days.length - 1];
    if (!last) {
      return startOfDay(now);
    }
    const end = new Date(last);
    end.setDate(end.getDate() + 1);
    return end;
  }, [days, now]);

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

  const scrollToDay = useCallback(
    (day: Date) => {
      const key = localDateKey(day);
      const index = days.findIndex((candidate) => localDateKey(candidate) === key);
      if (index < 0 || !scrollRef?.current) {
        return;
      }

      const runScroll = () => {
        const measured = offsetsRef.current[key];
        const y = measured ?? listRootY.current + index * ESTIMATED_SECTION_HEIGHT;
        if (!Number.isFinite(y)) {
          return;
        }
        try {
          scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
        } catch {
          scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: false });
        }
      };

      runScroll();
      requestAnimationFrame(runScroll);
      setTimeout(runScroll, 120);
      setTimeout(runScroll, 320);
    },
    [days, scrollRef],
  );

  useImperativeHandle(ref, () => ({ scrollToDay }), [scrollToDay]);

  const registerSectionOffset = useCallback((key: string, relativeY: number) => {
    offsetsRef.current[key] = listRootY.current + relativeY;
  }, []);

  return (
    <View
      className="gap-3 pb-4"
      onLayout={(event) => {
        listRootY.current = event.nativeEvent.layout.y;
      }}>
      {days.map((day) => {
        const dayItems = agendaItemsForDay(items, day);
        const daySilence = examPeriodsOnDate(examPeriods, day);
        const dayAbsences = absencesOnDate(absences, day);
        const dayNotices = noticesOnDate(calendarNotices, day);
        const label = new Intl.DateTimeFormat('es-ES', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
        }).format(day);
        const key = localDateKey(day);
        const isToday = startOfDay(day).getTime() === startOfDay(now).getTime();
        const isSelected =
          selectedDay != null && startOfDay(selectedDay).getTime() === day.getTime();
        const hasMarkers =
          daySilence.length > 0 || dayAbsences.length > 0 || dayNotices.length > 0;

        return (
          <View
            key={key}
            onLayout={(event) => {
              registerSectionOffset(key, event.nativeEvent.layout.y);
            }}
            className={`gap-2 rounded-xl border p-3 ${
              isSelected
                ? 'border-teal-300 bg-teal-50/50'
                : isToday
                  ? 'border-gray-200 bg-white'
                  : 'border-gray-100 bg-white'
            }`}>
            <Text
              className={`text-xs font-bold uppercase ${
                isToday ? 'text-teal-800' : 'text-gray-500'
              }`}>
              {label}
            </Text>

            {daySilence.length > 0 ? (
              <View className="gap-0.5 rounded-lg bg-violet-50 px-2 py-1">
                {daySilence.map((period, index) => (
                  <Text
                    key={`silence-${key}-${period.user_id}-${index}`}
                    className="text-xs text-violet-800">
                    {formatSilenceModeDayLabel(period.label, memberName(period.user_id))}
                  </Text>
                ))}
              </View>
            ) : null}

            {dayAbsences.length > 0 ? (
              <View className="gap-0.5 rounded-lg bg-amber-50 px-2 py-1">
                {dayAbsences.map((absence, index) => (
                  <Text
                    key={`absence-${key}-${absence.user_id}-${index}`}
                    className="text-xs text-amber-900">
                    {formatAbsenceDayLabel(memberName(absence.user_id), absence.reason)}
                  </Text>
                ))}
              </View>
            ) : null}

            {dayNotices.length > 0 ? (
              <View className="gap-0.5 rounded-lg bg-sky-50 px-2 py-1">
                {dayNotices.map((notice, index) => {
                  const glyph =
                    notice.kind === 'VISIT' ||
                    notice.kind === 'REPAIR' ||
                    notice.kind === 'EVENT'
                      ? CALENDAR_NOTICE_GLYPH[notice.kind]
                      : '📌';
                  const kindLabel =
                    notice.kind === 'VISIT' ||
                    notice.kind === 'REPAIR' ||
                    notice.kind === 'EVENT'
                      ? CALENDAR_NOTICE_LABEL[notice.kind]
                      : notice.kind;
                  return (
                    <Text
                      key={`notice-${key}-${notice.title}-${index}`}
                      className="text-xs text-sky-900">
                      {glyph} {kindLabel}: {notice.title}
                    </Text>
                  );
                })}
              </View>
            ) : null}

            {dayItems.length === 0 ? (
              hasMarkers ? null : (
                <Text className="text-xs text-gray-400">Libre</Text>
              )
            ) : (
              dayItems.map((item) => (
                <AgendaItemCard key={item.id} item={item} onPress={() => onOpenItem(item)} />
              ))
            )}
          </View>
        );
      })}
    </View>
  );
});
