import { useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { FeedSectionHeader } from '@/components/ui/FeedSectionHeader';
import { HealthMeter, MetricsBar } from '@/components/ui/HealthMeter';
import { HelpTip } from '@/components/ui/HelpTip';
import { HomeSectionBar, type HomeSection } from '@/components/ui/HomeSectionBar';
import { MascotLoading } from '@/components/ui/MascotLoading';
import { OverflowMenu } from '@/components/ui/OverflowMenu';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
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
import { buildHomeAlerts } from '@/features/home/lib/alerts';
import {
  excludeAbsentAssigneeTasks,
  filterTasksForAbsentViewer,
} from '@/features/tasks/lib/absence-task-rules';
import { reassignRotatingTasksForPunctualAbsence } from '@/features/tasks/api/tasks-api';
import { filterExpensesForViewer, type AgendaItem } from '@/features/home/lib/agenda-items';
import { useHomeTasks } from '@/features/tasks/hooks/useHomeTasks';
import { canRequestTaskSwap } from '@/features/tasks/lib/board-filters';
import { summarizeTasks } from '@/features/tasks/lib/task-summary';
import { isUserSystemFrozen } from '@/lib/presence';
import { mascotScreenLine } from '@/lib/mascot';
import { useAuth } from '@/providers/AuthProvider';
import { useHome } from '@/providers/HomeProvider';
import { useIconPack } from '@/providers/IconPackProvider';
import { usePurchases } from '@/providers/PurchasesProvider';
import { useTutorial } from '@/providers/TutorialProvider';

/**
 * Home — Pulso (estado → ranking → cuentas), Agenda, Piso (info práctica).
 * Avisos solo en campanita. Ausencias / silencio / visitas en ⋮.
 */
export function HomeScreen() {
  const { user } = useAuth();
  const { activeHome, updateHomePracticalInfo } = useHome();
  const { registerHomeSectionSetter } = useTutorial();
  const {
    tasks,
    isLoading,
    isAdmin,
    members: taskMembers,
    refresh: refreshTasks,
    cancelOccurrence: cancelTaskOccurrence,
    reassignOccurrence: reassignTaskOccurrence,
    requestSwap,
  } = useHomeTasks();
  const {
    balances,
    members,
    expenses,
    isLoading: expensesLoading,
    refresh: refreshExpenses,
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
    refresh: refreshLeaderboard,
  } = useHomeLeaderboard();
  const { packId, setPackId, packs, isPackLocked } = useIconPack();
  const { isPlus } = usePurchases();
  const [section, setSection] = useState<HomeSection>('FEED');
  const [menuOpen, setMenuOpen] = useState(false);
  const [packOpen, setPackOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [lifeSheet, setLifeSheet] = useState<HomeLifeSheetKind | null>(null);
  const [pulsoRefreshing, setPulsoRefreshing] = useState(false);

  useEffect(() => {
    registerHomeSectionSetter(setSection);
  }, [registerHomeSectionSetter]);

  async function refreshPulso() {
    setPulsoRefreshing(true);
    try {
      await Promise.all([refreshTasks(), refreshExpenses(), refreshLeaderboard()]);
    } finally {
      setPulsoRefreshing(false);
    }
  }

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
      ? `${mascotScreenLine('feed')}${isPlus ? ' · Plus' : ''}`
      : section === 'AGENDA'
        ? mascotScreenLine('agenda')
        : mascotScreenLine('piso');

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
          helpTitle="Inicio"
          helpMessage="Pulso = estado del piso. Agenda = calendario. Piso = Wi‑Fi y reglas. La campanita concentra avisos urgentes."
          onAlertsPress={() => setAlertsOpen(true)}
          alertsCount={alerts.length}
          urgentAlertsCount={urgentAlertsCount}
          onMenuPress={() => setMenuOpen(true)}
        />

        <HomeSectionBar section={section} onSectionChange={setSection} />

        {section === 'FEED' ? (
          <Animated.View key="pulso" entering={FadeIn.duration(240)} className="flex-1">
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces
            overScrollMode="auto"
            contentInsetAdjustmentBehavior="never"
            refreshControl={
              <RefreshControl
                refreshing={pulsoRefreshing}
                onRefresh={() => void refreshPulso()}
                tintColor="#0f766e"
                colors={['#0f766e']}
              />
            }
            contentContainerClassName="gap-4 pb-8">
            <View className="flex-row items-center justify-between">
              <FeedSectionHeader title="Estado" subtitle="Cumplimiento de esta semana" />
              <HelpTip
                title="Estado del piso"
                message="La barra resume si el piso va bien. Pendientes, entregadas (foto en revisión) y hechas. Los avisos urgentes están en la campanita de arriba."
              />
            </View>
            {isLoading ? <MascotLoading /> : <HealthMeter summary={healthSummary} />}
            {!isLoading ? (
              <MetricsBar
                pending={healthSummary.pending}
                submitted={healthSummary.submitted}
                completed={healthSummary.completed}
              />
            ) : null}

            <View className="flex-row items-center justify-between">
              <FeedSectionHeader title="Clasificación" subtitle="Puntos de reputación esta semana" />
              <HelpTip
                title="Clasificación"
                message="Empiezas con 100 pts. Cumplir tareas suma; fallar resta. El chip «tú» te marca en el ranking."
              />
            </View>
            {leaderboardLoading ? (
              <MascotLoading label="Ordenando el ranking…" />
            ) : leaderboardError ? (
              <View className="gap-2 rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                <Text className="text-sm font-semibold text-amber-950">
                  No se pudo cargar la clasificación
                </Text>
                <Text className="text-sm leading-5 text-amber-900/80">{leaderboardError}</Text>
                <Button
                  label="Reintentar"
                  variant="secondary"
                  onPress={() => void refreshLeaderboard()}
                />
              </View>
            ) : (
              <HomeLeaderboard rows={leaderboard} currentUserId={user?.id} />
            )}

            <View className="flex-row items-center justify-between">
              <FeedSectionHeader title="Cuentas" subtitle="Quién debe a quién" />
              <HelpTip
                title="Cuentas"
                message="Resumen rápido de deudas entre compañeros. El detalle y saldar están en la pestaña Gastos."
              />
            </View>
            {expensesLoading ? (
              <MascotLoading label="Sumando quién debe a quién…" />
            ) : (
              <BalanceSummary balances={balances} members={members} currentUserId={user?.id} />
            )}
          </ScrollView>
          </Animated.View>
        ) : null}

        {section === 'AGENDA' ? (
          <Animated.View key="agenda" entering={FadeIn.duration(240)} className="flex-1">
          <HomeAgenda
            tasks={agendaTasks}
            expenses={agendaExpenses}
            members={agendaMembers}
            absences={absences}
            examPeriods={examPeriods}
            calendarNotices={calendarNotices}
            currentUserId={user?.id}
            isAdmin={isAdmin}
            onRefresh={async () => {
              await Promise.all([refreshTasks(), refreshExpenses()]);
            }}
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
          </Animated.View>
        ) : null}

        {section === 'PISO' ? (
          <Animated.View key="piso" entering={FadeIn.duration(240)} className="flex-1">
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces
            overScrollMode="auto"
            contentInsetAdjustmentBehavior="never"
            contentContainerClassName="gap-4 pb-8">
            <View className="flex-row items-center justify-between">
              <FeedSectionHeader
                title="Info práctica"
                subtitle="Wi‑Fi, portal, basura y notas"
              />
              <HelpTip
                title="Info del piso"
                message="Datos que todos necesitan: red Wi‑Fi, código del portal, día de basura. Edítalos desde la tarjeta."
              />
            </View>
            <HomeInfoCard
              home={activeHome}
              onSave={async (input) => {
                await updateHomePracticalInfo(input);
              }}
            />

            <View className="flex-row items-center justify-between">
              <FeedSectionHeader title="Convivencia" subtitle="Reglas y quejas del piso" />
              <HelpTip
                title="Reglas y quejas"
                message="Acuerdos visibles para todos. Las quejas pueden ser anónimas — sin chat de WhatsApp interminable."
              />
            </View>
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
          </ScrollView>
          </Animated.View>
        ) : null}
      </View>

      <OverflowMenu
        visible={menuOpen}
        title="Más opciones"
        onClose={() => setMenuOpen(false)}
        actions={[
          {
            key: 'alerts',
            label: alerts.length > 0 ? `Avisos (${alerts.length})` : 'Avisos (campanita)',
            onPress: () => setAlertsOpen(true),
          },
          {
            key: 'absences',
            label: 'Ausencias del calendario',
            onPress: () => setLifeSheet('absences'),
          },
          {
            key: 'exams',
            label: 'Modo silencio / exámenes',
            onPress: () => setLifeSheet('exams'),
          },
          {
            key: 'visits',
            label: 'Visitas y eventos del piso',
            onPress: () => setLifeSheet('visits'),
          },
          {
            key: 'icons',
            label: 'Packs de iconos',
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
