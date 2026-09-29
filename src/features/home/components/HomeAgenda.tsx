import { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';

import {
  AgendaScopeBar,
  DEFAULT_AGENDA_CATEGORY_FILTER,
  DEFAULT_AGENDA_VIEW_SCOPE,
} from '@/features/home/components/AgendaScopeBar';
import { CollapsibleFilterPanel } from '@/components/ui/CollapsibleFilterPanel';
import { HelpTip } from '@/components/ui/HelpTip';
import { AgendaCalendar } from '@/features/home/components/AgendaCalendar';
import { AgendaColorLegend } from '@/features/home/components/AgendaColorLegend';
import { AgendaList, type AgendaListHandle } from '@/features/home/components/AgendaList';
import { ScheduledItemSheet } from '@/features/home/components/ScheduledItemSheet';
import type { HomeMemberWithProfile } from '@/features/home/api/homes-api';
import {
  startOfDay,
  toAgendaScopeFilter,
  type AgendaItem,
  type AgendaCategoryFilter,
  type AgendaViewScope,
} from '@/features/home/lib/agenda-items';
import { daysInMonth, daysInWeek, monthForExpandedView, startOfMonth } from '@/features/home/lib/month-calendar';
import { expenseFocusHref, taskFocusHref } from '@/lib/navigation/board-focus';
import { useConfirmDialog } from '@/providers/ConfirmProvider';
import type { MemberAbsence } from '@/schemas/absence.schema';
import type { MemberExamPeriod } from '@/schemas/exam-period.schema';
import type { HomeNotice } from '@/schemas/home-notice.schema';
import type { ExpenseWithRelations, TaskWithRelations } from '@/types/database.types';

type HomeAgendaProps = {
  tasks: TaskWithRelations[];
  expenses: ExpenseWithRelations[];
  members: HomeMemberWithProfile[];
  absences: MemberAbsence[];
  examPeriods: MemberExamPeriod[];
  calendarNotices?: HomeNotice[];
  currentUserId?: string | null;
  isAdmin?: boolean;
  onCancelOccurrence: (item: AgendaItem) => Promise<void>;
  onReassignOccurrence: (item: AgendaItem, userId: string) => Promise<void>;
  onRequestSwap?: (item: AgendaItem) => void;
};

/**
 * Agenda: filters → calendar → day list. Life management (absences, silence, visits)
 * lives in the Home ⋮ menu sheets, not in this scroll.
 */
export function HomeAgenda({
  tasks,
  expenses,
  members,
  absences,
  examPeriods,
  calendarNotices = [],
  currentUserId,
  isAdmin = false,
  onCancelOccurrence,
  onReassignOccurrence,
  onRequestSwap,
}: HomeAgendaProps) {
  const confirm = useConfirmDialog();
  const listRef = useRef<AgendaListHandle>(null);
  const scrollRef = useRef<ScrollView>(null);

  const [viewScope, setViewScope] = useState<AgendaViewScope>(DEFAULT_AGENDA_VIEW_SCOPE);
  const [categories, setCategories] = useState<AgendaCategoryFilter>(DEFAULT_AGENDA_CATEGORY_FILTER);
  const [calendarExpanded, setCalendarExpanded] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(() => startOfDay(new Date()));
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [weekAnchor, setWeekAnchor] = useState(() => startOfDay(new Date()));
  const [selected, setSelected] = useState<AgendaItem | null>(null);
  const [busy, setBusy] = useState(false);

  const scope = useMemo(
    () => toAgendaScopeFilter(viewScope, categories),
    [viewScope, categories],
  );

  const listDays = useMemo(
    () => (calendarExpanded ? daysInMonth(visibleMonth) : daysInWeek(weekAnchor)),
    [calendarExpanded, visibleMonth, weekAnchor],
  );

  const shared = useMemo(
    () => ({
      tasks,
      expenses,
      absences,
      examPeriods,
      calendarNotices,
      members,
      currentUserId,
      scope,
    }),
    [tasks, expenses, absences, examPeriods, calendarNotices, members, currentUserId, scope],
  );

  const handleSelectDay = useCallback((day: Date) => {
    setSelectedDay(day);
    setTimeout(() => listRef.current?.scrollToDay(day), 50);
    setTimeout(() => listRef.current?.scrollToDay(day), 250);
  }, []);

  function handleToggleExpanded() {
    setCalendarExpanded((expanded) => {
      if (!expanded) {
        setVisibleMonth(monthForExpandedView(daysInWeek(weekAnchor), new Date()));
      }
      return !expanded;
    });
  }

  function handleWeekAnchorChange(anchor: Date) {
    setWeekAnchor(startOfDay(anchor));
  }

  function openItem(item: AgendaItem) {
    if (item.lifecycle === 'scheduled') {
      setSelected(item);
      return;
    }
    router.push(item.kind === 'task' ? taskFocusHref(item.entityId) : expenseFocusHref(item.entityId));
  }

  async function handleCancel() {
    if (!selected) {
      return;
    }
    const ok = await confirm({
      title: 'Cancelar esta fecha',
      message: 'Se omitirá solo esta ejecución. La recurrencia sigue activa.',
      confirmLabel: 'Cancelar fecha',
    });
    if (!ok) {
      return;
    }
    setBusy(true);
    try {
      await onCancelOccurrence(selected);
      setSelected(null);
    } finally {
      setBusy(false);
    }
  }

  async function handleReassign(userId: string) {
    if (!selected) {
      return;
    }
    setBusy(true);
    try {
      await onReassignOccurrence(selected, userId);
      setSelected(null);
    } finally {
      setBusy(false);
    }
  }

  const filterHint = useMemo(() => {
    let count = 0;
    if (viewScope !== DEFAULT_AGENDA_VIEW_SCOPE) {
      count += 1;
    }
    if (categories.tasks !== DEFAULT_AGENDA_CATEGORY_FILTER.tasks) {
      count += 1;
    }
    if (categories.expenses !== DEFAULT_AGENDA_CATEGORY_FILTER.expenses) {
      count += 1;
    }
    return count > 0 ? `${count} activo${count === 1 ? '' : 's'}` : null;
  }, [viewScope, categories]);

  return (
    <View className="flex-1">
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never">
        <View className="gap-4 pb-8">
          <View className="flex-row items-start justify-between gap-2">
            <Text className="flex-1 text-xs text-stone-500">
              Calendario y lista del día. Ausencias, modo silencio y visitas → menú ⋮.
            </Text>
            <HelpTip
              title="Agenda"
              message="Toca un día para saltar a su lista. Azul = tus tareas, cielo = compañeros, ámbar = gastos. Las tarjetas abiertas te llevan al tablero."
            />
          </View>

          <CollapsibleFilterPanel activeHint={filterHint}>
            <AgendaScopeBar
              viewScope={viewScope}
              categories={categories}
              onViewScopeChange={setViewScope}
              onCategoriesChange={setCategories}
            />
          </CollapsibleFilterPanel>

          <AgendaCalendar
            {...shared}
            viewScope={viewScope}
            expanded={calendarExpanded}
            onToggleExpanded={handleToggleExpanded}
            visibleMonth={visibleMonth}
            onVisibleMonthChange={setVisibleMonth}
            weekAnchor={weekAnchor}
            onWeekAnchorChange={handleWeekAnchorChange}
            selectedDay={selectedDay}
            onSelectDay={handleSelectDay}
          />

          <AgendaColorLegend />

          <AgendaList
            ref={listRef}
            days={listDays}
            selectedDay={selectedDay}
            scrollRef={scrollRef}
            onOpenItem={openItem}
            {...shared}
          />
        </View>
      </ScrollView>

      <ScheduledItemSheet
        visible={selected !== null}
        item={selected}
        members={members}
        absences={absences}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        busy={busy}
        onClose={() => setSelected(null)}
        onCancelDate={() => void handleCancel()}
        onReassign={(userId) => void handleReassign(userId)}
        onRequestSwap={
          selected && onRequestSwap
            ? () => {
                onRequestSwap(selected);
                setSelected(null);
              }
            : undefined
        }
      />
    </View>
  );
}
