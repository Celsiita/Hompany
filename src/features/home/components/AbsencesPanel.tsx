import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FilterTogglePair } from '@/components/ui/FilterTogglePair';
import { InfoTip } from '@/components/ui/InfoTip';
import { MascotLoading } from '@/components/ui/MascotLoading';
import { SafePressable } from '@/components/ui/SafePressable';
import { TextField } from '@/components/ui/TextField';
import type { HomeMemberWithProfile } from '@/features/home/api/homes-api';
import {
  buildPeriodMarks,
  PeriodRangeCalendar,
} from '@/features/home/components/PeriodRangeCalendar';
import { SystemLeavePanel } from '@/features/home/components/SystemLeavePanel';
import { startOfMonth } from '@/features/home/lib/month-calendar';
import { applyPeriodRangeSelection } from '@/features/home/lib/period-range-calendar';
import { formatDateKey, toDateKey, isPeriodActiveOrUpcoming } from '@/lib/absences';
import { punctualAbsenceTaskWarning } from '@/lib/presence';
import { useConfirmDialog } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import type { MemberAbsence } from '@/schemas/absence.schema';
import type { MemberSystemLeave, SystemLeaveKind } from '@/schemas/presence.schema';
import { useLocale } from '@/providers/LocaleProvider';

type AbsencesPanelProps = {
  absences: MemberAbsence[];
  systemLeaves?: MemberSystemLeave[];
  members: HomeMemberWithProfile[];
  currentUserId?: string | null;
  isLoading?: boolean;
  systemLeavesLoading?: boolean;
  busy?: boolean;
  /** When true, manage only yours and show peers' active/upcoming separately. */
  mineOnly?: boolean;
  /** Open tasks assigned to the viewer that fall in the selected range. */
  countTasksInRange?: (startDate: string, endDate: string) => number;
  onAdd: (input: { start_date: string; end_date: string; reason?: string }) => Promise<void>;
  onRemove: (absenceId: string) => Promise<void>;
  onAddSystemLeave?: (input: {
    kind: SystemLeaveKind;
    start_date: string;
    end_date?: string | null;
    reason?: string;
  }) => Promise<void>;
  onRemoveSystemLeave?: (leaveId: string) => Promise<void>;
};

const TYPE_OPTIONS = [
  { value: 'PUNCTUAL' as const, label: 'Corta' },
  { value: 'SYSTEM' as const, label: 'Larga / baja' },
] as const;

/**
 * Unified absences section: punctual (tasks) or system leave (full freeze).
 */
export function AbsencesPanel({
  absences,
  systemLeaves = [],
  members,
  currentUserId,
  isLoading = false,
  systemLeavesLoading = false,
  busy = false,
  mineOnly = false,
  countTasksInRange,
  onAdd,
  onRemove,
  onAddSystemLeave,
  onRemoveSystemLeave,
}: AbsencesPanelProps) {
  const { t } = useLocale();
  const confirm = useConfirmDialog();
  const showToast = useToast();
  const [absenceType, setAbsenceType] = useState<'PUNCTUAL' | 'SYSTEM' | 'ALL'>('PUNCTUAL');
  const [formOpen, setFormOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const marks = useMemo(
    () => buildPeriodMarks(absences, currentUserId, 'absence'),
    [absences, currentUserId],
  );

  const memberName = (userId: string) =>
    members.find((member) => member.user_id === userId)?.profiles?.display_name ?? t('common.roommate');

  function handleSelectDate(date: Date) {
    const next = applyPeriodRangeSelection({ date, rangeStart, rangeEnd, marks });
    setRangeStart(next.rangeStart);
    setRangeEnd(next.rangeEnd);
    setError(next.error);
  }

  async function handleSave() {
    setError(null);
    if (!rangeStart) {
      setError(t('form.needFreeDay'));
      return;
    }
    const start = toDateKey(rangeStart);
    const end = toDateKey(rangeEnd ?? rangeStart);
    const taskCount = countTasksInRange?.(start, end) ?? 0;
    const warning = punctualAbsenceTaskWarning(taskCount);
    if (warning) {
      const ok = await confirm({
        title: 'Tareas en el periodo',
        message: warning,
        confirmLabel: 'Continuar',
      });
      if (!ok) {
        return;
      }
    }
    setSaving(true);
    try {
      await onAdd({ start_date: start, end_date: end, reason: reason.trim() || undefined });
      showToast({ message: t('toast.absenceSaved'), tone: 'success' });
      setFormOpen(false);
      setReason('');
      setRangeStart(null);
      setRangeEnd(null);
    } catch (err) {
      showToast({ message: err instanceof Error ? err.message : t('toast.absenceFail'), tone: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(absence: MemberAbsence) {
    const ok = await confirm({
      title: t('confirm.deleteAbsence'),
      message: t('confirm.deleteAbsenceBody'),
      confirmLabel: t('common.delete'),
    });
    if (!ok) {
      return;
    }
    await onRemove(absence.id);
    showToast({ message: t('toast.absenceDeleted'), tone: 'success' });
  }

  const mine = absences.filter((row) => row.user_id === currentUserId);
  const others = mineOnly
    ? absences.filter(
        (row) => row.user_id !== currentUserId && isPeriodActiveOrUpcoming(row.end_date),
      )
    : absences.filter((row) => row.user_id !== currentUserId);
  const showSystem = Boolean(onAddSystemLeave && onRemoveSystemLeave);
  const hasAny = mine.length > 0 || others.length > 0;

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-2">
        <Text className="flex-1 text-sm font-semibold text-amber-950">Gestionar ausencias</Text>
        <InfoTip title={t('filters.absences')} message={t('absence.info')} tone="amber" />
      </View>
      {showSystem ? (
        <FilterTogglePair
          value={absenceType}
          options={TYPE_OPTIONS}
          clearable={false}
          onChange={(next) => {
            if (next === 'ALL') {
              return;
            }
            setAbsenceType(next);
            setError(null);
          }}
        />
      ) : null}

      {absenceType === 'SYSTEM' && showSystem ? (
        <SystemLeavePanel
          embedded
          systemLeaves={systemLeaves}
          members={members}
          currentUserId={currentUserId}
          isLoading={systemLeavesLoading}
          busy={busy}
          mineOnly={mineOnly}
          onAdd={onAddSystemLeave!}
          onRemove={onRemoveSystemLeave!}
        />
      ) : isLoading ? (
        <MascotLoading />
      ) : (
        <View className="gap-3">
          {!hasAny ? (
            <View className="gap-1 rounded-xl border border-dashed border-amber-200 bg-amber-50/40 px-3 py-4">
              <Text className="text-sm font-semibold text-amber-950">Sin ausencias cortas</Text>
              <Text className="text-sm leading-5 text-amber-900/70">
                Añade una si te vas un fin de semana; el calendario lo muestra al resto.
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {mine.length > 0 ? (
                <View className="gap-2">
                  {mineOnly ? (
                    <Text className="text-[11px] font-semibold uppercase tracking-wide text-amber-800/80">
                      Lo mío
                    </Text>
                  ) : null}
                  {mine.map((absence) => (
                    <AbsenceRow
                      key={absence.id}
                      label={t('form.you')}
                      absence={absence}
                      canRemove
                      busy={busy}
                      onRemove={() => void handleRemove(absence)}
                    />
                  ))}
                </View>
              ) : null}
              {others.length > 0 ? (
                <View className="gap-2">
                  {mineOnly ? (
                    <Text className="text-[11px] font-semibold uppercase tracking-wide text-amber-800/80">
                      Compañeros
                    </Text>
                  ) : null}
                  {others.map((absence) => (
                    <AbsenceRow
                      key={absence.id}
                      label={memberName(absence.user_id)}
                      absence={absence}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          )}

          <SafePressable
            onPress={() => {
              setFormOpen((open) => !open);
              setError(null);
            }}
            contentStyle={{
              alignSelf: 'flex-start',
              borderRadius: 9999,
              borderWidth: 1,
              borderColor: '#fcd34d',
              backgroundColor: '#ffffff',
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}>
            <Text className="text-xs font-semibold text-amber-900">
              {formOpen ? t('form.closeRegister') : t('form.addAbsence')}
            </Text>
          </SafePressable>

          {formOpen ? (
            <View className="gap-3 rounded-xl border border-amber-100 bg-white p-3">
              <TextField
                label={t('form.reasonOptional')}
                value={reason}
                onChangeText={setReason}
                placeholder="Vacaciones, viaje…"
              />
              <PeriodRangeCalendar
                visibleMonth={visibleMonth}
                onMonthChange={setVisibleMonth}
                marks={marks}
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                onSelectDate={handleSelectDate}
              />
              <Text className="text-xs text-stone-500">
                Los días ámbar oscuros ya están registrados. Toca inicio y fin en días libres.
              </Text>
              {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
              <Button label={t('form.saveAbsence')} loading={saving || busy} onPress={() => void handleSave()} />
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

function AbsenceRow({
  label,
  absence,
  canRemove = false,
  busy = false,
  onRemove,
}: {
  label: string;
  absence: MemberAbsence;
  canRemove?: boolean;
  busy?: boolean;
  onRemove?: () => void;
}) {
  const { t } = useLocale();
  return (
    <View className="gap-0.5 rounded-xl border border-amber-200 bg-amber-100/60 px-3 py-2">
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text className="text-sm font-medium text-amber-950">{label}</Text>
          <Text className="text-xs text-amber-900/80">
            {formatDateKey(absence.start_date)} – {formatDateKey(absence.end_date)}
            {absence.reason ? ` · ${absence.reason}` : ''}
          </Text>
        </View>
        {canRemove && onRemove ? (
          <SafePressable disabled={busy} onPress={onRemove}>
            <Text className="text-xs font-semibold text-red-700">{t('common.delete')}</Text>
          </SafePressable>
        ) : null}
      </View>
    </View>
  );
}
