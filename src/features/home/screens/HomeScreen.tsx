import { useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { FeedSectionHeader } from '@/components/ui/FeedSectionHeader';
import { HealthMeter } from '@/components/ui/HealthMeter';
import { HelpTip } from '@/components/ui/HelpTip';
import { HomeSectionBar, type HomeSection } from '@/components/ui/HomeSectionBar';
import { MascotLoading } from '@/components/ui/MascotLoading';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { AlertsModal } from '@/features/home/components/AlertsModal';
import { HomeAgenda } from '@/features/home/components/HomeAgenda';
import { HomeLeaderboard } from '@/features/home/components/HomeLeaderboard';
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
import { filterExpensesForViewer, type AgendaItem } from '@/features/home/lib/agenda-items';
import { useHomeTasks } from '@/features/tasks/hooks/useHomeTasks';
import { canRequestTaskSwap } from '@/features/tasks/lib/board-filters';
import { summarizeTasks } from '@/features/tasks/lib/task-summary';
import { isUserSystemFrozen } from '@/lib/presence';
import { useAuth } from '@/providers/AuthProvider';
import { useHome } from '@/providers/HomeProvider';
import { useLocale } from '@/providers/LocaleProvider';
import { useToast } from '@/providers/ToastProvider';
import { useTutorial } from '@/providers/TutorialProvider';

/**
 * Home — Feed (estado → ranking → insights Plus → cuentas) and Agenda.
 * Piso life management lives in the Piso tab.
 */
export function HomeScreen() {
  const { user } = useAuth();
  const { activeHome } = useHome();
  const { registerHomeSectionSetter } = useTutorial();
  const { t } = useLocale();
  const showToast = useToast();
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
  const { absences } = useHomeAbsences();
  const { examPeriods } = useHomeExamPeriods();
  const { systemLeaves } = useHomePresence();
  const { calendarNotices } = useHomeNotices();
  const {
    rows: leaderboard,
    isLoading: leaderboardLoading,
    error: leaderboardError,
    refresh: refreshLeaderboard,
  } = useHomeLeaderboard();
  const [section, setSection] = useState<HomeSection>('FEED');
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [feedRefreshing, setFeedRefreshing] = useState(false);

  useEffect(() => {
    registerHomeSectionSetter(setSection);
  }, [registerHomeSectionSetter]);

  async function refreshFeed() {
    setFeedRefreshing(true);
    try {
      await Promise.all([refreshTasks(), refreshExpenses(), refreshLeaderboard()]);
    } finally {
      setFeedRefreshing(false);
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

  const agendaTasks = useMemo(() => {
    if (systemFrozen) {
      return [];
    }
    return excludeAbsentAssigneeTasks(
      filterTasksForAbsentViewer(tasks, absences, user?.id),
      absences,
    );
  }, [tasks, absences, user?.id, systemFrozen]);

  const agendaExpenses = useMemo(() => {
    if (systemFrozen) {
      return [];
    }
    return visibleExpenses;
  }, [visibleExpenses, systemFrozen]);

  const healthSummary = useMemo(() => summarizeTasks(tasks), [tasks]);

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

  const subtitle =
    section === 'FEED' ? t('screen.feed') : t('screen.agenda');

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
          title={activeHome?.name ?? t('home.defaultTitle')}
          subtitle={subtitle}
          helpTitle={t('home.helpTitle')}
          helpMessage={t('home.help')}
          onAlertsPress={() => setAlertsOpen(true)}
          alertsCount={alerts.length}
          urgentAlertsCount={urgentAlertsCount}
        />

        <HomeSectionBar section={section} onSectionChange={setSection} />

        {section === 'FEED' ? (
          <Animated.View key="feed" entering={FadeIn.duration(240)} className="flex-1">
            <ScrollView
              showsVerticalScrollIndicator={false}
              bounces
              overScrollMode="auto"
              contentInsetAdjustmentBehavior="never"
              refreshControl={
                <RefreshControl
                  refreshing={feedRefreshing}
                  onRefresh={() => void refreshFeed()}
                  tintColor="#0f766e"
                  colors={['#0f766e']}
                />
              }
              contentContainerClassName="gap-5 pb-8">
              <View className="flex-row items-center justify-between">
                <FeedSectionHeader title={t('home.estado')} subtitle={t('home.estado.sub')} />
                <HelpTip
                  title={t('home.estado.helpTitle')}
                  message={t('home.estado.help')}
                />
              </View>
              {isLoading ? <MascotLoading /> : <HealthMeter summary={healthSummary} />}

              <View className="flex-row items-center justify-between">
                <FeedSectionHeader
                  title={t('home.ranking')}
                  subtitle={t('home.ranking.sub')}
                />
                <HelpTip
                  title={t('home.ranking')}
                  message={t('home.ranking.help')}
                />
              </View>
              {leaderboardLoading ? (
                <MascotLoading label={t('home.ranking.loading')} />
              ) : leaderboardError ? (
                <View className="gap-2 rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                  <Text className="text-sm font-semibold text-amber-950">
                    {t('home.ranking.error')}
                  </Text>
                  <Text className="text-sm leading-5 text-amber-900/80">{leaderboardError}</Text>
                  <Button
                    label={t('common.retry')}
                    variant="secondary"
                    onPress={() => void refreshLeaderboard()}
                  />
                </View>
              ) : (
                <HomeLeaderboard rows={leaderboard} currentUserId={user?.id} />
              )}

              <View className="flex-row items-center justify-between">
                <FeedSectionHeader title={t('home.cuentas')} subtitle={t('home.cuentas.sub')} />
                <HelpTip
                  title={t('home.cuentas')}
                  message={t('home.cuentas.help')}
                />
              </View>
              {expensesLoading ? (
                <MascotLoading label={t('home.cuentas.loading')} />
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
                  showToast({
                    message: 'No se puede proponer cambio en esta tarea',
                    tone: 'error',
                  });
                  return;
                }
                const other = agendaMembers.find((member) => member.user_id !== user?.id);
                if (!other) {
                  showToast({ message: 'No hay compañeros para intercambiar', tone: 'error' });
                  return;
                }
                void (async () => {
                  try {
                    await requestSwap(task, other.user_id);
                    showToast({
                      message: `Cambio propuesto a ${other.profiles?.display_name ?? 'compañero'}`,
                      tone: 'success',
                    });
                  } catch (err) {
                    showToast({
                      message: err instanceof Error ? err.message : 'No se pudo proponer el cambio',
                      tone: 'error',
                    });
                  }
                })();
              }}
            />
          </Animated.View>
        ) : null}
      </View>

      <AlertsModal visible={alertsOpen} alerts={alerts} onClose={() => setAlertsOpen(false)} />
    </Screen>
  );
}
