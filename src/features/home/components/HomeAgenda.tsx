import { useCallback, useMemo, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { router } from 'expo-router';

import {
  AgendaScopeBar,
  DEFAULT_AGENDA_CATEGORY_FILTER,
  DEFAULT_AGENDA_LIFE_FOCUS,
  DEFAULT_AGENDA_VIEW_SCOPE,
} from '@/features/home/components/AgendaScopeBar';
import { CollapsibleFilterPanel } from '@/components/ui/CollapsibleFilterPanel';
import { HelpTip } from '@/components/ui/HelpTip';
import {
  SCROLL_TO_TOP_THRESHOLD,
  ScrollToTopButton,
} from '@/components/ui/ScrollToTopButton';
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
  type AgendaLifeFocus,
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
  onRefresh?: () => Promise<void>;
  onCancelOccurrence: (item: AgendaItem) => Promise<void>;
  onReassignOccurrence: (item: AgendaItem, userId: string) => Promise<void>;
  onRequestSwap?: (item: AgendaItem) => void;
};

/**
 * Agenda: calendar → legend → filters (collapsed) → day list.
 * Life management create/edit lives in Home ⋮; filters only show/hide markers here.
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
  onRefresh,
  onCancelOccurrence,
  onReassignOccurrence,
  onRequestSwap,
}: HomeAgendaProps) {
  const confirm = useConfirmDialog();
  const listRef = useRef<AgendaListHandle>(null);
  const scrollRef = useRef<ScrollView>(null);

  const [viewScope, setViewScope] = useState<AgendaViewScope>(DEFAULT_AGENDA_VIEW_SCOPE);
  const [categories, setCategories] = useState<AgendaCategoryFilter>(DEFAULT_AGENDA_CATEGORY_FILTER);
  const [lifeFocus, setLifeFocus] = useState<AgendaLifeFocus>(DEFAULT_AGENDA_LIFE_FOCUS);
  const [calendarExpanded, setCalendarExpanded] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(() => startOfDay(new Date()));
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [weekAnchor, setWeekAnchor] = useState(() => startOfDay(new Date()));
  const [selected, setSelected] = useState<AgendaItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [agendaRefreshing, setAgendaRefreshing] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

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
      lifeFocus,
    }),
    [
      tasks,
      expenses,
      absences,
      examPeriods,
      calendarNotices,
      members,
      currentUserId,
      scope,
      lifeFocus,
    ],
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
    if (lifeFocus !== DEFAULT_AGENDA_LIFE_FOCUS) {
      count += 1;
    }
    return count > 0 ? `${count} activo${count === 1 ? '' : 's'}` : null;
  }, [viewScope, categories, lifeFocus]);

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    setShowScrollTop(event.nativeEvent.contentOffset.y > SCROLL_TO_TOP_THRESHOLD);
  }

  return (
    <View className="flex-1">
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        bounces
        overScrollMode="auto"
        scrollEventThrottle={16}
        onScroll={handleScroll}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={agendaRefreshing}
              tintColor="#0f766e"
              colors={['#0f766e']}
              onRefresh={() => {
                void (async () => {
                  setAgendaRefreshing(true);
                  try {
                    await onRefresh();
                  } finally {
                    setAgendaRefreshing(false);
                  }
                })();
              }}
            />
          ) : undefined
        }>
        <View className="gap-3 pb-8">
          <View className="flex-row items-center justify-end">
            <HelpTip
              title="Agenda"
              message="Toca un día para ver su lista. Azul = tuyas, cielo = compañeros, rosa = debes, ámbar = te deben. 🧳 ausencia, 🔇 silencio, 🚪 visita, 🔧 reparación, 📅 evento. Crear o editar: pestaña Piso."
            />
          </View>

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

          <CollapsibleFilterPanel
            activeHint={filterHint}
            closedHint="Mis cosas · Compañeros · Ausencias · Silencio · Visitas">
            <AgendaScopeBar
              viewScope={viewScope}
              categories={categories}
              lifeFocus={lifeFocus}
              onViewScopeChange={setViewScope}
              onCategoriesChange={setCategories}
              onLifeFocusChange={setLifeFocus}
            />
          </CollapsibleFilterPanel>

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

      <ScrollToTopButton
        visible={showScrollTop}
        onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
      />

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
