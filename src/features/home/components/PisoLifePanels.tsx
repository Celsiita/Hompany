import { View } from 'react-native';

import { CollapsibleSection } from '@/components/ui/CollapsibleFilterPanel';
import { AbsencesPanel } from '@/features/home/components/AbsencesPanel';
import { CalendarNoticesPanel } from '@/features/home/components/CalendarNoticesPanel';
import { ExamPeriodsPanel } from '@/features/home/components/ExamPeriodsPanel';
import type { HomeMemberWithProfile } from '@/features/home/api/homes-api';
import { countOpenTasksInDateRange } from '@/features/tasks/lib/punctual-absence-reassign';
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

/**
 * Piso tab: manage only the current user's absences, silence and visits.
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
  return (
    <View className="gap-3">
      <CollapsibleSection title="Ausencias" accent="amber" defaultExpanded>
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

      <CollapsibleSection title="Modo silencio" accent="violet" defaultExpanded>
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

      <CollapsibleSection title="Visitas y eventos" accent="teal">
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
