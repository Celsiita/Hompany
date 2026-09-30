import { useMemo, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FilterTogglePair } from '@/components/ui/FilterTogglePair';
import { InfoTip } from '@/components/ui/InfoTip';
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
import { formatDateKey, toDateKey } from '@/lib/absences';
import { punctualAbsenceTaskWarning } from '@/lib/presence';
import { useConfirmDialog } from '@/providers/ConfirmProvider';
import type { MemberAbsence } from '@/schemas/absence.schema';
import type { MemberSystemLeave, SystemLeaveKind } from '@/schemas/presence.schema';

type AbsencesPanelProps = {
  absences: MemberAbsence[];
  systemLeaves?: MemberSystemLeave[];
  members: HomeMemberWithProfile[];
  currentUserId?: string | null;
  isLoading?: boolean;
  systemLeavesLoading?: boolean;
  busy?: boolean;
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

const INFO_MESSAGE =
  'Corta (finde/viaje): se reasignan tus tareas rotativas. Larga: la app se pausa para ti (excepto gastos vencidos).';

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
  countTasksInRange,
  onAdd,
  onRemove,
  onAddSystemLeave,
  onRemoveSystemLeave,
}: AbsencesPanelProps) {
  const confirm = useConfirmDialog();
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
    members.find((member) => member.user_id === userId)?.profiles?.display_name ?? 'Compañero';

  function handleSelectDate(date: Date) {
    const next = applyPeriodRangeSelection({ date, rangeStart, rangeEnd, marks });
    setRangeStart(next.rangeStart);
    setRangeEnd(next.rangeEnd);
    setError(next.error);
  }

  async function handleSave() {
    setError(null);
    if (!rangeStart) {
      setError('Elige al menos un día libre en el calendario.');
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
      setFormOpen(false);
      setReason('');
      setRangeStart(null);
      setRangeEnd(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la ausencia');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(absence: MemberAbsence) {
    const ok = await confirm({
      title: 'Eliminar ausencia',
      message: '¿Quitar este periodo de ausencia?',
      confirmLabel: 'Eliminar',
    });
    if (!ok) {
      return;
    }
    await onRemove(absence.id);
  }

  const mine = absences.filter((row) => row.user_id === currentUserId);
  const others = absences.filter((row) => row.user_id !== currentUserId);
  const showSystem = Boolean(onAddSystemLeave && onRemoveSystemLeave);

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-2">
        <Text className="flex-1 text-sm font-semibold text-amber-950">Gestionar ausencias</Text>
        <InfoTip title="Ausencias" message={INFO_MESSAGE} tone="amber" />
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
          onAdd={onAddSystemLeave!}
          onRemove={onRemoveSystemLeave!}
        />
      ) : isLoading ? (
        <ActivityIndicator color="#d97706" />
      ) : (
        <View className="gap-3">
          {absences.length === 0 ? (
            <Text className="text-sm text-amber-900/70">
              Sin ausencias cortas. Añade una si te vas un fin de semana.
            </Text>
          ) : (
            <View className="gap-2">
              {mine.map((absence) => (
                <AbsenceRow
                  key={absence.id}
                  label="Tú"
                  absence={absence}
                  canRemove
                  busy={busy}
                  onRemove={() => void handleRemove(absence)}
                />
              ))}
              {others.map((absence) => (
                <AbsenceRow
                  key={absence.id}
                  label={memberName(absence.user_id)}
                  absence={absence}
                />
              ))}
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
              {formOpen ? 'Cerrar registro' : '+ Registrar ausencia puntual'}
            </Text>
          </SafePressable>

          {formOpen ? (
            <View className="gap-3 rounded-xl border border-amber-100 bg-white p-3">
              <TextField
                label="Motivo (opcional)"
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
              <Text className="text-xs text-gray-500">
                Los días ámbar oscuros ya están registrados. Toca inicio y fin en días libres.
              </Text>
              {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
              <Button label="Guardar ausencia" loading={saving || busy} onPress={() => void handleSave()} />
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
            <Text className="text-xs font-semibold text-red-700">Eliminar</Text>
          </SafePressable>
        ) : null}
      </View>
    </View>
  );
}
