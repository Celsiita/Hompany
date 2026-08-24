import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { HealthMeter, MetricsBar } from '@/components/ui/HealthMeter';
import { HomeSectionBar, type HomeSection } from '@/components/ui/HomeSectionBar';
import { OverflowMenu } from '@/components/ui/OverflowMenu';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { AlertsModal } from '@/features/home/components/AlertsModal';
import { HomeLeaderboard } from '@/features/home/components/HomeLeaderboard';
import { MonthCalendar } from '@/features/home/components/MonthCalendar';
import { WeekAgenda } from '@/features/home/components/WeekAgenda';
import { BalanceSummary } from '@/features/expenses/components/BalanceSummary';
import { useHomeExpenses } from '@/features/expenses/hooks/useHomeExpenses';
import { useHomeLeaderboard } from '@/features/home/hooks/useHomeLeaderboard';
import { buildHomeAlerts } from '@/features/home/lib/alerts';
import { useHomeTasks } from '@/features/tasks/hooks/useHomeTasks';
import { useAuth } from '@/providers/AuthProvider';
import { useHome } from '@/providers/HomeProvider';
import { useIconPack } from '@/providers/IconPackProvider';

/**
 * Home — Feed (health, ranking, balances) and Agenda (7-day + monthly calendar).
 */
export function HomeScreen() {
  const { user } = useAuth();
  const { activeHome } = useHome();
  const { summary, tasks, isLoading } = useHomeTasks();
  const { balances, members, expenses, isLoading: expensesLoading } = useHomeExpenses();
  const {
    rows: leaderboard,
    isLoading: leaderboardLoading,
    error: leaderboardError,
  } = useHomeLeaderboard();
  const { packId, setPackId, packs } = useIconPack();
  const [section, setSection] = useState<HomeSection>('FEED');
  const [menuOpen, setMenuOpen] = useState(false);
  const [packOpen, setPackOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);

  const alerts = useMemo(
    () => buildHomeAlerts({ tasks, expenses, currentUserId: user?.id }),
    [tasks, expenses, user?.id],
  );

  const subtitle =
    section === 'FEED'
      ? 'Salud, clasificación y cuentas del piso'
      : 'Agenda de 7 días y calendario del mes';

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        contentInsetAdjustmentBehavior="never"
        contentContainerClassName="gap-4 pb-8 pt-2">
        <ScreenHeader
          title={activeHome?.name ?? 'El piso'}
          subtitle={subtitle}
          onMenuPress={() => setMenuOpen(true)}
        />

        <HomeSectionBar section={section} onSectionChange={setSection} />

        {section === 'FEED' ? (
          <>
            {isLoading ? <ActivityIndicator color="#2563eb" /> : <HealthMeter summary={summary} />}

            {!isLoading ? (
              <MetricsBar
                pending={summary.pending}
                submitted={summary.submitted}
                completed={summary.completed}
              />
            ) : null}

            {leaderboardLoading ? (
              <ActivityIndicator color="#2563eb" />
            ) : leaderboardError ? (
              <Text className="text-sm text-red-600">{leaderboardError}</Text>
            ) : (
              <HomeLeaderboard rows={leaderboard} currentUserId={user?.id} />
            )}

            {expensesLoading ? (
              <ActivityIndicator color="#2563eb" />
            ) : (
              <BalanceSummary balances={balances} members={members} currentUserId={user?.id} />
            )}

            {alerts.length > 0 ? (
              <Text className="text-xs text-gray-500">
                Tienes {alerts.length} aviso{alerts.length === 1 ? '' : 's'}. Ábrelos desde el menú ⋮.
              </Text>
            ) : null}
          </>
        ) : (
          <>
            <WeekAgenda tasks={tasks} expenses={expenses} currentUserId={user?.id} />
            <MonthCalendar tasks={tasks} expenses={expenses} currentUserId={user?.id} />
          </>
        )}
      </ScrollView>

      <OverflowMenu
        visible={menuOpen}
        title="Más opciones"
        onClose={() => setMenuOpen(false)}
        actions={[
          {
            key: 'alerts',
            label: alerts.length > 0 ? `Avisos / Notificaciones (${alerts.length})` : 'Avisos / Notificaciones',
            onPress: () => setAlertsOpen(true),
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
          label: `${item.name}${packId === item.id ? ' · activo' : ''}`,
          onPress: () => {
            void setPackId(item.id);
          },
        }))}
      />

      <AlertsModal visible={alertsOpen} alerts={alerts} onClose={() => setAlertsOpen(false)} />
    </Screen>
  );
}
