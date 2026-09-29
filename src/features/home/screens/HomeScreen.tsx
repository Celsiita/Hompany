import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';

import { CollapsibleSection } from '@/components/ui/CollapsibleFilterPanel';
import { FeedSectionHeader } from '@/components/ui/FeedSectionHeader';
import { HealthMeter, MetricsBar } from '@/components/ui/HealthMeter';
import { HomeSectionBar, type HomeSection } from '@/components/ui/HomeSectionBar';
import { MascotLoading } from '@/components/ui/MascotLoading';
import { OverflowMenu } from '@/components/ui/OverflowMenu';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { AlertsBanner } from '@/features/home/components/AlertsBanner';
import { AlertsModal } from '@/features/home/components/AlertsModal';
import { HomeAgenda } from '@/features/home/components/HomeAgenda';
import { HomeInfoCard } from '@/features/home/components/HomeInfoCard';
import { HomeLeaderboard } from '@/features/home/components/HomeLeaderboard';
import {
  HomeLifeSheet,
  type HomeLifeSheetKind,
} from '@/features/home/components/HomeLifeSheet';
import { HomeNoticesPanel } from '@/features/home/components/HomeNoticesPanel';
import { useHomeAbsences } from '@/features/home/hooks/useHomeAbsences';
import { useHomeExamPeriods } from '@/features/home/hooks/useHomeExamPeriods';
import { useHomeNotices } from '@/features/home/hooks/useHomeNotices';
import { useHomePresence } from '@/features/home/hooks/useHomePresence';
import { BalanceSummary } from '@/features/expenses/components/BalanceSummary';
import { useHomeExpenses } from '@/features/expenses/hooks/useHomeExpenses';
import { useHomeLeaderboard } from '@/features/home/hooks/useHomeLeaderboard';
import { buildHomeAlerts, type HomeAlert } from '@/features/home/lib/alerts';
import {
  excludeAbsentAssigneeTasks,
  filterTasksForAbsentViewer,
} from '@/features/tasks/lib/absence-task-rules';
import { reassignRotatingTasksForPunctualAbsence } from '@/features/tasks/api/tasks-api';
import { filterExpensesForViewer, type AgendaItem } from '@/features/home/lib/agenda-items';
import { useHomeTasks } from '@/features/tasks/hooks/useHomeTasks';
import { canRequestTaskSwap } from '@/features/tasks/lib/board-filters';
import { summarizeTasks } from '@/features/tasks/lib/task-summary';
import { expenseFocusHref, taskFocusHref } from '@/lib/navigation/board-focus';
import { isUserSystemFrozen } from '@/lib/presence';
import { useAuth } from '@/providers/AuthProvider';
import { useHome } from '@/providers/HomeProvider';
import { useIconPack } from '@/providers/IconPackProvider';
import { usePurchases } from '@/providers/PurchasesProvider';

/**
 * Home — Feed (status → alerts → game → money → flat info) and Agenda (calendar first).
 * Absences, silence and visits open from the ⋮ menu.
 */
export function HomeScreen() {
  const { user } = useAuth();
  const { activeHome, updateHomePracticalInfo } = useHome();
  const {
    tasks,
    isLoading,
    isAdmin,
    members: taskMembers,
    cancelOccurrence: cancelTaskOccurrence,
    reassignOccurrence: reassignTaskOccurrence,
    requestSwap,
  } = useHomeTasks();
  const {
    balances,
    members,
    expenses,
    isLoading: expensesLoading,
    cancelOccurrence: cancelExpenseOccurrence,
    reassignOccurrence: reassignExpenseOccurrence,
  } = useHomeExpenses();
  const {
    absences,
    isLoading: absencesLoading,
    addAbsence,
    removeAbsence,
  } = useHomeAbsences();
  const {
    examPeriods,
    isLoading: examPeriodsLoading,
    addExamPeriod,
    removeExamPeriod,
  } = useHomeExamPeriods();
  const {
    systemLeaves,
    isLoading: presenceLoading,
    addSystemLeave,
    removeSystemLeave,
  } = useHomePresence();
  const {
    feedNotices,
    calendarNotices,
    isLoading: noticesLoading,
    addNotice,
    removeNotice,
  } = useHomeNotices();
  const {
    rows: leaderboard,
    isLoading: leaderboardLoading,
    error: leaderboardError,
  } = useHomeLeaderboard();
  const { packId, setPackId, packs, isPackLocked } = useIconPack();
  const { isPlus } = usePurchases();
  const [section, setSection] = useState<HomeSection>('FEED');
  const [menuOpen, setMenuOpen] = useState(false);
  const [packOpen, setPackOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [lifeSheet, setLifeSheet] = useState<HomeLifeSheetKind | null>(null);

  const visibleExpenses = useMemo(
    () => filterExpensesForViewer(expenses, user?.id),
    [expenses, user?.id],
  );

  const systemFrozen = useMemo(
    () =>
      isUserSystemFrozen({
        leaves: systemLeaves,
        userId: user?.id,
      }),
    [systemLeaves, user?.id],
  );

  const agendaTasks = useMemo(
    () =>
      systemFrozen
        ? []
        : filterTasksForAbsentViewer(tasks, absences, user?.id),
    [tasks, absences, user?.id, systemFrozen],
  );

  const agendaExpenses = useMemo(
    () => (systemFrozen ? [] : visibleExpenses),
    [systemFrozen, visibleExpenses],
  );

  const healthSummary = useMemo(
    () => summarizeTasks(excludeAbsentAssigneeTasks(tasks, absences)),
    [tasks, absences],
  );

  const alerts = useMemo(
    () =>
      buildHomeAlerts({
        tasks,
        expenses: visibleExpenses,
        absences,
        systemLeaves,
        currentUserId: user?.id,
      }),
    [tasks, visibleExpenses, absences, systemLeaves, user?.id],
  );

  const urgentAlertsCount = useMemo(
    () => alerts.filter((item) => item.section === 'urgent').length,
    [alerts],
  );

  const agendaMembers = members.length > 0 ? members : taskMembers;

  const memberDisplayName = (userId: string) =>
    agendaMembers.find((member) => member.user_id === userId)?.profiles?.display_name ??
    'Compañero';

  const subtitle =
    section === 'FEED'
      ? isPlus
        ? 'Estado del piso · Plus'
        : 'Estado del piso'
      : 'Calendario y día a día';

  function openAlert(alert: HomeAlert) {
    router.push(
      alert.entityType === 'task'
        ? taskFocusHref(alert.entityId)
        : expenseFocusHref(alert.entityId),
    );
  }

  async function handleCancelOccurrence(item: AgendaItem) {
    if (item.kind === 'task') {
      await cancelTaskOccurrence(
        item.entityId,
        item.lifecycle === 'scheduled' ? item.when.toISOString() : undefined,
      );
      return;
    }
    await cancelExpenseOccurrence(
      item.entityId,
      item.lifecycle === 'scheduled' ? item.when.toISOString() : undefined,
    );
  }

  async function handleReassignOccurrence(item: AgendaItem, userId: string) {
    if (item.kind === 'task') {
      await reassignTaskOccurrence(
        item.entityId,
        userId,
        item.lifecycle === 'scheduled' ? item.when.toISOString() : undefined,
      );
      return;
    }
    await reassignExpenseOccurrence(
      item.entityId,
      userId,
      item.lifecycle === 'scheduled' ? item.when.toISOString() : undefined,
    );
  }

  return (
    <Screen>
      <View className="flex-1 gap-4 pt-2">
        <ScreenHeader
          title={activeHome?.name ?? 'El piso'}
          subtitle={subtitle}
          onAlertsPress={() => setAlertsOpen(true)}
          alertsCount={alerts.length}
          urgentAlertsCount={urgentAlertsCount}
          onMenuPress={() => setMenuOpen(true)}
        />

        <HomeSectionBar section={section} onSectionChange={setSection} />

        {section === 'FEED' ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            overScrollMode="never"
            contentInsetAdjustmentBehavior="never"
            contentContainerClassName="gap-4 pb-8">
            <FeedSectionHeader title="Estado" subtitle="Salud del piso esta semana" />
            {isLoading ? <MascotLoading /> : <HealthMeter summary={healthSummary} />}
            {!isLoading ? (
              <MetricsBar
                pending={healthSummary.pending}
                submitted={healthSummary.submitted}
                completed={healthSummary.completed}
              />
            ) : null}

            <FeedSectionHeader
              title="Avisos"
              subtitle={
                alerts.length > 0
                  ? `${alerts.length} pendientes · toca para abrir`
                  : 'Nada urgente ahora'
              }
            />
            {alerts.length > 0 ? (
              <AlertsBanner
                alerts={alerts}
                previewLimit={2}
                onPressAlert={openAlert}
                onPressSeeAll={() => setAlertsOpen(true)}
              />
            ) : (
              <Text className="text-sm text-stone-500">El piso está al día. 🔔 en la cabecera si aparece algo.</Text>
            )}

            <FeedSectionHeader title="Clasificación" subtitle="Reputación del equipo" />
            {leaderboardLoading ? (
              <MascotLoading label="Ordenando el ranking…" />
            ) : leaderboardError ? (
              <Text className="text-sm text-red-600">{leaderboardError}</Text>
            ) : (
              <HomeLeaderboard rows={leaderboard} currentUserId={user?.id} />
            )}

            <FeedSectionHeader title="Cuentas" subtitle="Quién debe a quién" />
            {expensesLoading ? (
              <MascotLoading label="Sumando quién debe a quién…" />
            ) : (
              <BalanceSummary balances={balances} members={members} currentUserId={user?.id} />
            )}

            <FeedSectionHeader title="Datos del piso" subtitle="Info práctica y convivencia" />
            <CollapsibleSection title="Wi‑Fi, portal y notas" accent="stone" defaultExpanded={false}>
              <HomeInfoCard
                home={activeHome}
                onSave={async (input) => {
                  await updateHomePracticalInfo(input);
                }}
              />
            </CollapsibleSection>
            <CollapsibleSection title="Reglas y quejas" accent="stone" defaultExpanded={false}>
              <HomeNoticesPanel
                notices={feedNotices}
                isLoading={noticesLoading}
                currentUserId={user?.id}
                isAdmin={isAdmin}
                authorName={memberDisplayName}
                onAdd={async (input) => {
                  await addNotice(input);
                }}
                onRemove={removeNotice}
              />
            </CollapsibleSection>
          </ScrollView>
        ) : (
          <HomeAgenda
            tasks={agendaTasks}
            expenses={agendaExpenses}
            members={agendaMembers}
            absences={absences}
            examPeriods={examPeriods}
            calendarNotices={calendarNotices}
            currentUserId={user?.id}
            isAdmin={isAdmin}
            onCancelOccurrence={handleCancelOccurrence}
            onReassignOccurrence={handleReassignOccurrence}
            onRequestSwap={(item) => {
              if (item.kind !== 'task') {
                return;
              }
              const task = tasks.find((row) => row.id === item.entityId);
              if (!task || !canRequestTaskSwap(task)) {
                return;
              }
              const other = agendaMembers.find((member) => member.user_id !== user?.id);
              if (!other) {
                return;
              }
              void requestSwap(task, other.user_id);
            }}
          />
        )}
      </View>

      <OverflowMenu
        visible={menuOpen}
        title="Más opciones"
        onClose={() => setMenuOpen(false)}
        actions={[
          {
            key: 'alerts',
            label:
              alerts.length > 0
                ? `Avisos (${alerts.length})`
                : 'Avisos',
            onPress: () => setAlertsOpen(true),
          },
          {
            key: 'absences',
            label: 'Ausencias',
            onPress: () => setLifeSheet('absences'),
          },
          {
            key: 'exams',
            label: 'Modo silencio (exámenes)',
            onPress: () => setLifeSheet('exams'),
          },
          {
            key: 'visits',
            label: 'Visitas y avisos del piso',
            onPress: () => setLifeSheet('visits'),
          },
          {
            key: 'icons',
            label: 'Paquete de iconos',
            onPress: () => setPackOpen(true),
          },
        ]}
      />

      <OverflowMenu
        visible={packOpen}
        title="Elige un paquete"
        onClose={() => setPackOpen(false)}
        actions={packs.map((item) => ({
          key: item.id,
          label: `${item.name}${packId === item.id ? ' · activo' : ''}${isPackLocked(item.id) ? ' · Plus' : ''}`,
          onPress: () => {
            void setPackId(item.id);
          },
        }))}
      />

      <AlertsModal visible={alertsOpen} alerts={alerts} onClose={() => setAlertsOpen(false)} />

      <HomeLifeSheet
        kind={lifeSheet}
        onClose={() => setLifeSheet(null)}
        members={agendaMembers}
        currentUserId={user?.id}
        isAdmin={isAdmin}
        tasks={tasks}
        absences={absences}
        absencesLoading={absencesLoading}
        systemLeaves={systemLeaves}
        systemLeavesLoading={presenceLoading}
        examPeriods={examPeriods}
        examPeriodsLoading={examPeriodsLoading}
        calendarNotices={calendarNotices}
        calendarNoticesLoading={noticesLoading}
        onAddAbsence={async (input) => {
          await addAbsence(input);
          if (user?.id && activeHome?.id) {
            await reassignRotatingTasksForPunctualAbsence({
              homeId: activeHome.id,
              actorId: user.id,
              absentUserId: user.id,
              startDate: input.start_date,
              endDate: input.end_date,
            });
          }
        }}
        onRemoveAbsence={removeAbsence}
        onAddSystemLeave={addSystemLeave}
        onRemoveSystemLeave={removeSystemLeave}
        onAddExamPeriod={async (input) => {
          await addExamPeriod(input);
        }}
        onRemoveExamPeriod={removeExamPeriod}
        onAddCalendarNotice={async (input) => {
          await addNotice(input);
        }}
        onRemoveCalendarNotice={removeNotice}
      />
    </Screen>
  );
}
