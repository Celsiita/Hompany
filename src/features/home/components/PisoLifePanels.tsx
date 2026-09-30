import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import { AbsencesPanel } from '@/features/home/components/AbsencesPanel';
import { CalendarNoticesPanel } from '@/features/home/components/CalendarNoticesPanel';
import { ExamPeriodsPanel } from '@/features/home/components/ExamPeriodsPanel';
import type { HomeMemberWithProfile } from '@/features/home/api/homes-api';
import { countOpenTasksInDateRange } from '@/features/tasks/lib/punctual-absence-reassign';
import { isPeriodActiveOrUpcoming } from '@/lib/absences';
import type { MemberAbsence } from '@/schemas/absence.schema';
import type { MemberExamPeriod } from '@/schemas/exam-period.schema';
import type { CalendarNoticeKind, HomeNotice } from '@/schemas/home-notice.schema';
import type { MemberSystemLeave, SystemLeaveKind } from '@/schemas/presence.schema';
import type { TaskWithRelations } from '@/types/database.types';
import { useLocale } from '@/providers/LocaleProvider';

type PisoLifePanelsProps = {
  members: HomeMemberWithProfile[];
  currentUserId?: string | null;
  isAdmin?: boolean;
  tasks: TaskWithRelations[];
  absences: MemberAbsence[];
  absencesLoading?: boolean;
  systemLeaves: MemberSystemLeave[];
  systemLeavesLoading?: boolean;
  examPeriods: MemberExamPeriod[];
  examPeriodsLoading?: boolean;
  calendarNotices: HomeNotice[];
  calendarNoticesLoading?: boolean;
  onAddAbsence: (input: { start_date: string; end_date: string; reason?: string }) => Promise<void>;
  onRemoveAbsence: (absenceId: string) => Promise<void>;
  onAddSystemLeave: (input: {
    kind: SystemLeaveKind;
    start_date: string;
    end_date?: string | null;
    reason?: string;
  }) => Promise<void>;
  onRemoveSystemLeave: (leaveId: string) => Promise<void>;
  onAddExamPeriod: (input: { start_date: string; end_date: string; label: string }) => Promise<void>;
  onRemoveExamPeriod: (periodId: string) => Promise<void>;
  onAddCalendarNotice: (input: {
    kind: CalendarNoticeKind;
    title: string;
    starts_on: string;
    ends_on: string;
  }) => Promise<void>;
  onRemoveCalendarNotice: (noticeId: string) => Promise<void>;
};

type LifeModalKind = 'absences' | 'silence' | 'visits' | null;

type SnapshotTileProps = {
  glyph: string;
  label: string;
  count: number;
  hint: string;
  tone: 'amber' | 'violet' | 'teal';
  onPress: () => void;
};

const TILE: Record<
  SnapshotTileProps['tone'],
  { border: string; bg: string; count: string; chevron: string }
> = {
  amber: {
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    count: 'text-amber-950',
    chevron: 'text-amber-700',
  },
  violet: {
    border: 'border-violet-200',
    bg: 'bg-violet-50',
    count: 'text-violet-950',
    chevron: 'text-violet-700',
  },
  teal: {
    border: 'border-teal-200',
    bg: 'bg-teal-50',
    count: 'text-teal-950',
    chevron: 'text-teal-700',
  },
};

const MODAL_META: Record<
  Exclude<LifeModalKind, null>,
  { title: string; subtitle: string }
> = {
  absences: {
    title: '🧳 Ausencias',
    subtitle: 'Lo mío y lo próximo de tus compañeros.',
  },
  silence: {
    title: '🔇 Modo silencio',
    subtitle: 'Periodos de estudio. Sin pedir permiso.',
  },
  visits: {
    title: '🚪 Visitas y eventos',
    subtitle: 'Visitas, reparaciones y avisos del calendario.',
  },
};

/**
 * Tappable life summary tile — opens a management sheet.
 */
function SnapshotTile({ glyph, label, count, hint, tone, onPress }: SnapshotTileProps) {
  const style = TILE[tone];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${count}`}
      className={`min-w-[30%] flex-1 rounded-2xl border px-2.5 py-3 ${style.border} ${style.bg}`}>
      <View className="items-center gap-0.5">
        <Text className="text-2xl">{glyph}</Text>
        <Text className={`text-xl font-black ${style.count}`}>{count}</Text>
        <Text className="text-[11px] font-bold text-stone-800">{label}</Text>
        <Text className={`text-[10px] font-semibold ${style.chevron}`}>{hint} ›</Text>
      </View>
    </Pressable>
  );
}

/**
 * Piso life hub: three tiles open modals for absences, silence and visits.
 */
export function PisoLifePanels({
  members,
  currentUserId,
  isAdmin = false,
  tasks,
  absences,
  absencesLoading = false,
  systemLeaves,
  systemLeavesLoading = false,
  examPeriods,
  examPeriodsLoading = false,
  calendarNotices,
  calendarNoticesLoading = false,
  onAddAbsence,
  onRemoveAbsence,
  onAddSystemLeave,
  onRemoveSystemLeave,
  onAddExamPeriod,
  onRemoveExamPeriod,
  onAddCalendarNotice,
  onRemoveCalendarNotice,
}: PisoLifePanelsProps) {
  const { t } = useLocale();
  const [modal, setModal] = useState<LifeModalKind>(null);

  const absenceCount =
    absences.filter(
      (row) =>
        row.user_id === currentUserId ||
        (row.user_id !== currentUserId && isPeriodActiveOrUpcoming(row.end_date)),
    ).length +
    systemLeaves.filter(
      (row) =>
        row.user_id === currentUserId ||
        (row.user_id !== currentUserId && isPeriodActiveOrUpcoming(row.end_date)),
    ).length;
  const silenceCount = examPeriods.filter(
    (row) =>
      row.user_id === currentUserId ||
      (row.user_id !== currentUserId && isPeriodActiveOrUpcoming(row.end_date)),
  ).length;
  const visitCount = calendarNotices.filter(
    (row) =>
      row.author_id === currentUserId ||
      (row.author_id !== currentUserId && isPeriodActiveOrUpcoming(row.ends_on)),
  ).length;

  const meta = modal ? MODAL_META[modal] : null;

  return (
    <View className="gap-3">
      <View className="flex-row gap-2">
        <SnapshotTile
          glyph="🧳"
          label={t('filters.absences')}
          count={absenceCount}
          hint={t('common.open')}
          tone="amber"
          onPress={() => setModal('absences')}
        />
        <SnapshotTile
          glyph="🔇"
          label={t('filters.silence')}
          count={silenceCount}
          hint={t('common.open')}
          tone="violet"
          onPress={() => setModal('silence')}
        />
        <SnapshotTile
          glyph="🚪"
          label={t('filters.visits')}
          count={visitCount}
          hint={t('common.open')}
          tone="teal"
          onPress={() => setModal('visits')}
        />
      </View>

      <BottomSheetModal
        visible={modal !== null}
        onClose={() => setModal(null)}
        maxHeightClassName="max-h-[85%]">
        {meta ? (
          <View className="gap-3">
            <View className="gap-1">
              <Text className="text-lg font-bold text-stone-900">{meta.title}</Text>
              <Text className="text-sm text-stone-500">{meta.subtitle}</Text>
            </View>
            {modal === 'absences' ? (
              <AbsencesPanel
                absences={absences}
                systemLeaves={systemLeaves}
                members={members}
                currentUserId={currentUserId}
                isLoading={absencesLoading}
                systemLeavesLoading={systemLeavesLoading}
                mineOnly
                countTasksInRange={(startDate, endDate) =>
                  countOpenTasksInDateRange({
                    tasks,
                    userId: currentUserId,
                    startDate,
                    endDate,
                  })
                }
                onAdd={onAddAbsence}
                onRemove={onRemoveAbsence}
                onAddSystemLeave={onAddSystemLeave}
                onRemoveSystemLeave={onRemoveSystemLeave}
              />
            ) : null}
            {modal === 'silence' ? (
              <ExamPeriodsPanel
                examPeriods={examPeriods}
                members={members}
                currentUserId={currentUserId}
                isLoading={examPeriodsLoading}
                mineOnly
                onAdd={onAddExamPeriod}
                onRemove={onRemoveExamPeriod}
              />
            ) : null}
            {modal === 'visits' ? (
              <CalendarNoticesPanel
                notices={calendarNotices}
                isLoading={calendarNoticesLoading}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                mineOnly
                onAdd={onAddCalendarNotice}
                onRemove={onRemoveCalendarNotice}
              />
            ) : null}
          </View>
        ) : null}
      </BottomSheetModal>
    </View>
  );
}
