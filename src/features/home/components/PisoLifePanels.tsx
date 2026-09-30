import { Text, View } from 'react-native';

import { CollapsibleSection } from '@/components/ui/CollapsibleFilterPanel';
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

type SnapshotChipProps = {
  glyph: string;
  label: string;
  count: number;
  tone: 'amber' | 'violet' | 'teal';
};

const TONE: Record<SnapshotChipProps['tone'], string> = {
  amber: 'border-amber-200 bg-amber-50',
  violet: 'border-violet-200 bg-violet-50',
  teal: 'border-teal-200 bg-teal-50',
};

/**
 * Compact count chip for the Piso life snapshot row.
 */
function SnapshotChip({ glyph, label, count, tone }: SnapshotChipProps) {
  return (
    <View className={`min-w-[30%] flex-1 items-center gap-0.5 rounded-2xl border px-2 py-2.5 ${TONE[tone]}`}>
      <Text className="text-lg">{glyph}</Text>
      <Text className="text-base font-black text-stone-900">{count}</Text>
      <Text className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">{label}</Text>
    </View>
  );
}

/**
 * Piso tab: manage your life entries and see roommates' upcoming ones.
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

  return (
    <View className="gap-3">
      <View className="flex-row gap-2">
        <SnapshotChip glyph="🧳" label="Ausencias" count={absenceCount} tone="amber" />
        <SnapshotChip glyph="🔇" label="Silencio" count={silenceCount} tone="violet" />
        <SnapshotChip glyph="🚪" label="Visitas" count={visitCount} tone="teal" />
      </View>

      <CollapsibleSection title="🧳 Ausencias" accent="amber" defaultExpanded>
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
      </CollapsibleSection>

      <CollapsibleSection title="🔇 Modo silencio" accent="violet" defaultExpanded>
        <ExamPeriodsPanel
          examPeriods={examPeriods}
          members={members}
          currentUserId={currentUserId}
          isLoading={examPeriodsLoading}
          mineOnly
          onAdd={onAddExamPeriod}
          onRemove={onRemoveExamPeriod}
        />
      </CollapsibleSection>

      <CollapsibleSection title="🚪 Visitas y eventos" accent="teal">
        <CalendarNoticesPanel
          notices={calendarNotices}
          isLoading={calendarNoticesLoading}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          mineOnly
          onAdd={onAddCalendarNotice}
          onRemove={onRemoveCalendarNotice}
        />
      </CollapsibleSection>
    </View>
  );
}
