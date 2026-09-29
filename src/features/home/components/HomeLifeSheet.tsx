import { Text, View } from 'react-native';

import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
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

export type HomeLifeSheetKind = 'absences' | 'exams' | 'visits';

type HomeLifeSheetProps = {
  kind: HomeLifeSheetKind | null;
  onClose: () => void;
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

const TITLES: Record<HomeLifeSheetKind, { title: string; subtitle: string }> = {
  absences: {
    title: 'Ausencias',
    subtitle: 'Puntuales o dejar el piso un tiempo. La agenda y las rotaciones se adaptan.',
  },
  exams: {
    title: 'Modo silencio',
    subtitle: 'Periodos de exámenes o estudio. Baja la presión al impugnar y marca el calendario.',
  },
  visits: {
    title: 'Visitas y avisos',
    subtitle: 'Reparaciones, visitas o eventos del piso en el calendario.',
  },
};

/**
 * Home ⋮ sheets for life management that used to clutter the Agenda scroll.
 */
export function HomeLifeSheet({
  kind,
  onClose,
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
}: HomeLifeSheetProps) {
  const meta = kind ? TITLES[kind] : null;

  return (
    <BottomSheetModal visible={kind !== null} onClose={onClose} maxHeightClassName="max-h-[85%]">
      {meta ? (
        <View className="gap-3">
          <View className="gap-1">
            <Text className="text-lg font-bold text-stone-900">{meta.title}</Text>
            <Text className="text-sm text-stone-500">{meta.subtitle}</Text>
          </View>
          {kind === 'absences' ? (
            <AbsencesPanel
              absences={absences}
              systemLeaves={systemLeaves}
              members={members}
              currentUserId={currentUserId}
              isLoading={absencesLoading}
              systemLeavesLoading={systemLeavesLoading}
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
          {kind === 'exams' ? (
            <ExamPeriodsPanel
              examPeriods={examPeriods}
              members={members}
              currentUserId={currentUserId}
              isLoading={examPeriodsLoading}
              onAdd={onAddExamPeriod}
              onRemove={onRemoveExamPeriod}
            />
          ) : null}
          {kind === 'visits' ? (
            <CalendarNoticesPanel
              notices={calendarNotices}
              isLoading={calendarNoticesLoading}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onAdd={onAddCalendarNotice}
              onRemove={onRemoveCalendarNotice}
            />
          ) : null}
        </View>
      ) : null}
    </BottomSheetModal>
  );
}
