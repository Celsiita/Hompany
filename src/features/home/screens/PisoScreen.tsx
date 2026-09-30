import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { FeedSectionHeader } from '@/components/ui/FeedSectionHeader';
import { HelpTip } from '@/components/ui/HelpTip';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { HomeInfoCard } from '@/features/home/components/HomeInfoCard';
import { HomeNoticesPanel } from '@/features/home/components/HomeNoticesPanel';
import { MatchingSoonButton } from '@/features/home/components/MatchingPreviewCard';
import { PisoLifePanels } from '@/features/home/components/PisoLifePanels';
import { QuietNowCard } from '@/features/home/components/QuietNowCard';
import { useHomeAbsences } from '@/features/home/hooks/useHomeAbsences';
import { useHomeExamPeriods } from '@/features/home/hooks/useHomeExamPeriods';
import { useHomeNotices } from '@/features/home/hooks/useHomeNotices';
import { useHomePresence } from '@/features/home/hooks/useHomePresence';
import { useHomeExpenses } from '@/features/expenses/hooks/useHomeExpenses';
import { reassignRotatingTasksForPunctualAbsence } from '@/features/tasks/api/tasks-api';
import { useHomeTasks } from '@/features/tasks/hooks/useHomeTasks';
import { useAuth } from '@/providers/AuthProvider';
import { useHome } from '@/providers/HomeProvider';
import { useLocale } from '@/providers/LocaleProvider';

/**
 * Piso tab — life of the flat: quiet claim, my absences/silence/visits, Wi‑Fi, rules.
 */
export function PisoScreen() {
  const { user } = useAuth();
  const { activeHome, updateHomePracticalInfo } = useHome();
  const { t } = useLocale();
  const { tasks, isAdmin, members: taskMembers } = useHomeTasks();
  const { members } = useHomeExpenses();
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
  const [quietBusy, setQuietBusy] = useState(false);

  const agendaMembers = members.length > 0 ? members : taskMembers;
  const memberDisplayName = (userId: string) =>
    agendaMembers.find((member) => member.user_id === userId)?.profiles?.display_name ??
    t('common.roommate');
  const myName =
    agendaMembers.find((member) => member.user_id === user?.id)?.profiles?.display_name ?? 'Yo';

  return (
    <Screen>
      <Animated.View entering={FadeIn.duration(240)} className="flex-1">
        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces
          overScrollMode="auto"
          contentInsetAdjustmentBehavior="never"
          contentContainerClassName="gap-4 pb-8 pt-2">
          <ScreenHeader
            title={t('tabs.piso')}
            subtitle={t('screen.piso')}
            helpTitle={t('tabs.piso')}
            helpMessage={t('piso.help')}
            headerEnd={<MatchingSoonButton />}
          />

          <View className="flex-row items-center justify-between">
            <FeedSectionHeader
              title={t('piso.life')}
              subtitle={t('piso.life.sub')}
            />
            <HelpTip
              title={t('piso.life')}
              message={t('piso.help')}
            />
          </View>

          <QuietNowCard
            authorName={myName}
            busy={quietBusy}
            onRequest={async (input) => {
              setQuietBusy(true);
              try {
                await addNotice(input);
              } finally {
                setQuietBusy(false);
              }
            }}
          />

          <PisoLifePanels
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

          <View className="flex-row items-center justify-between">
            <FeedSectionHeader title={t('piso.info')} subtitle={t('piso.info.sub')} />
            <HelpTip
              title={t('piso.info')}
              message={t('piso.info.sub')}
            />
          </View>
          <HomeInfoCard
            home={activeHome}
            onSave={async (input) => {
              await updateHomePracticalInfo(input);
            }}
          />

          <View className="flex-row items-center justify-between">
            <FeedSectionHeader title={t('piso.rules')} subtitle={t('piso.rules.sub')} />
            <HelpTip
              title={t('piso.rules')}
              message={t('piso.rules.sub')}
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
    </Screen>
  );
}
