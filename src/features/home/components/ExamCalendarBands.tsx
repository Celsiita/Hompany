import { Text, View } from 'react-native';

import type { HomeMemberWithProfile } from '@/features/home/api/homes-api';
import { examPeriodsOverlappingRange, formatExamPeriodBanner } from '@/lib/exam-periods';
import type { MemberExamPeriod } from '@/schemas/exam-period.schema';

type ExamCalendarBandsProps = {
  examPeriods: MemberExamPeriod[];
  members: HomeMemberWithProfile[];
  monthStart: Date;
  monthEnd: Date;
};

/**
 * Shaded bands above the month grid for exam periods overlapping the visible month.
 */
export function ExamCalendarBands({
  examPeriods,
  members,
  monthStart,
  monthEnd,
}: ExamCalendarBandsProps) {
  const overlapping = examPeriodsOverlappingRange(examPeriods, monthStart, monthEnd);
  if (overlapping.length === 0) {
    return null;
  }

  const memberName = (userId: string) =>
    members.find((member) => member.user_id === userId)?.profiles?.display_name ?? 'Compañero';

  return (
    <View className="gap-1.5">
      {overlapping.map((period) => (
        <View
          key={period.id}
          className="rounded-lg border border-sky-200 bg-sky-100/80 px-3 py-2">
          <Text className="text-xs font-semibold text-sky-950">
            {formatExamPeriodBanner(period.label, memberName(period.user_id))}
          </Text>
        </View>
      ))}
    </View>
  );
}
