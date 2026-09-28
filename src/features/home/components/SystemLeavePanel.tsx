import { useMemo, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { CollapsibleSection } from '@/components/ui/CollapsibleFilterPanel';
import { FilterTogglePair } from '@/components/ui/FilterTogglePair';
import { InfoTip } from '@/components/ui/InfoTip';
import { SafePressable } from '@/components/ui/SafePressable';
import { TextField } from '@/components/ui/TextField';
import type { HomeMemberWithProfile } from '@/features/home/api/homes-api';
import {
  buildPeriodMarks,
  PeriodRangeCalendar,
} from '@/features/home/components/PeriodRangeCalendar';
import { startOfMonth } from '@/features/home/lib/month-calendar';
import { applyPeriodRangeSelection } from '@/features/home/lib/period-range-calendar';
import { formatDateKey, toDateKey } from '@/lib/absences';
import { interactive, mergeStyles, palette } from '@/lib/interactive-styles';
import { useConfirmDialog } from '@/providers/ConfirmProvider';
import type { MemberSystemLeave, SystemLeaveKind } from '@/schemas/presence.schema';

type SystemLeavePanelProps = {
  systemLeaves: MemberSystemLeave[];
  members: HomeMemberWithProfile[];
  currentUserId?: string | null;
  isLoading?: boolean;
  busy?: boolean;
  defaultExpanded?: boolean;
  /** When true, render body only (used inside unified Ausencias panel). */
  embedded?: boolean;
  onAdd: (input: {
    kind: SystemLeaveKind;
    start_date: string;
    end_date?: string | null;
    reason?: string;
  }) => Promise<void>;
  onRemove: (leaveId: string) => Promise<void>;
};

const INFO_MESSAGE =
  'Congela toda la app para ti: sin tareas, sin gastos y sin avisos (excepto gastos atrasados). Distinta de las ausencias puntuales, que solo afectan a tareas.';

const KIND_OPTIONS = [
  { value: 'INDEFINITE' as const, label: 'Indefinida' },
  { value: 'PLANNED' as const, label: 'Planificada' },
] as const;

/**
 * Collapsible system leave section (indefinite or planned).
 */
export function SystemLeavePanel({
  systemLeaves,
  members,
  currentUserId,
  isLoading = false,
  busy = false,
  defaultExpanded = false,
  embedded = false,
  onAdd,
  onRemove,
}: SystemLeavePanelProps) {
  const confirm = useConfirmDialog();
  const [formOpen, setFormOpen] = useState(false);
  const [kind, setKind] = useState<SystemLeaveKind | 'ALL'>('INDEFINITE');
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const marks = useMemo(
    () =>
      buildPeriodMarks(
        systemLeaves.map((leave) => ({
          id: leave.id,
          user_id: leave.user_id,
          start_date: leave.start_date,
          end_date: leave.end_date ?? leave.start_date,
        })),
        currentUserId,
        'absence',
      ),
    [systemLeaves, currentUserId],
  );

  const memberName = (userId: string) =>
    members.find((member) => member.user_id === userId)?.profiles?.display_name ?? 'Compañero';

  const mine = systemLeaves.filter((row) => row.user_id === currentUserId);
  const others = systemLeaves.filter((row) => row.user_id !== currentUserId);

  function handleSelectDate(date: Date) {
    if (kind === 'INDEFINITE') {
      setRangeStart(date);
      setRangeEnd(null);
      setError(null);
      return;
    }
    const next = applyPeriodRangeSelection({ date, rangeStart, rangeEnd, marks });
    setRangeStart(next.rangeStart);
    setRangeEnd(next.rangeEnd);
    setError(next.error);
  }

  async function handleSave() {
    setError(null);
    if (kind === 'ALL' || !kind) {
      setError('Elige indefinida o planificada');
      return;
    }
    if (!rangeStart) {
      setError(kind === 'INDEFINITE' ? 'Elige la fecha de inicio' : 'Elige el rango de fechas');
      return;
    }
    if (kind === 'PLANNED' && !rangeEnd) {
      setError('Elige la fecha de fin');
      return;
    }
    setSaving(true);
    try {
      await onAdd({
        kind,
        start_date: toDateKey(rangeStart),
        end_date: kind === 'PLANNED' && rangeEnd ? toDateKey(rangeEnd) : null,
        reason: reason.trim() || undefined,
      });
      setFormOpen(false);
      setRangeStart(null);
      setRangeEnd(null);
      setReason('');
      setKind('INDEFINITE');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(leave: MemberSystemLeave) {
    const ok = await confirm({
      title: 'Quitar ausencia de sistema',
      message: '¿Reactivar tareas, gastos y avisos para este periodo?',
      confirmLabel: 'Quitar',
    });
    if (!ok) {
      return;
    }
    await onRemove(leave.id);
  }

  const body = (
    <View className="gap-3">
      {isLoading ? (
        <ActivityIndicator color="#d97706" />
      ) : systemLeaves.length === 0 ? (
        <Text className="text-sm text-amber-900/70">Nadie tiene ausencia indefinida o planificada.</Text>
      ) : (
        <View className="gap-2">
          {mine.map((leave) => (
            <LeaveRow
              key={leave.id}
              label="Tú"
              leave={leave}
              canRemove
              busy={busy}
              onRemove={() => void handleRemove(leave)}
            />
          ))}
          {others.map((leave) => (
            <LeaveRow key={leave.id} label={memberName(leave.user_id)} leave={leave} />
          ))}
        </View>
      )}

      {!formOpen ? (
        <SafePressable
          onPress={() => setFormOpen(true)}
          contentStyle={mergeStyles(interactive.secondaryButton, { marginTop: 4 })}>
          <Text className="text-sm font-semibold text-gray-800">+ Registrar</Text>
        </SafePressable>
      ) : (
        <View className="gap-3">
          <FilterTogglePair
            value={kind}
            options={KIND_OPTIONS}
            clearable={false}
            onChange={(next) => {
              if (next === 'ALL') {
                return;
              }
              setKind(next);
              setRangeEnd(null);
              setError(null);
            }}
          />
          <Text className="text-xs text-amber-900/70">
            {kind === 'INDEFINITE'
              ? 'Toca el día en que empieza. No tiene fin hasta que la quites.'
              : 'Toca inicio y fin en el calendario.'}
          </Text>
          <PeriodRangeCalendar
            visibleMonth={visibleMonth}
            onMonthChange={setVisibleMonth}
            rangeStart={rangeStart}
            rangeEnd={kind === 'INDEFINITE' ? rangeStart : rangeEnd}
            marks={marks}
            onSelectDate={handleSelectDate}
          />
          <TextField
            label="Motivo (opcional)"
            value={reason}
            onChangeText={setReason}
            placeholder="Viaje, mudanza…"
          />
          {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button
                label="Cancelar"
                variant="secondary"
                onPress={() => {
                  setFormOpen(false);
                  setError(null);
                }}
              />
            </View>
            <View className="flex-1">
              <Button label="Guardar" loading={saving || busy} onPress={() => void handleSave()} />
            </View>
          </View>
        </View>
      )}
    </View>
  );

  if (embedded) {
    return body;
  }

  return (
    <CollapsibleSection
      title="Ausencia indefinida o planificada"
      accent="amber"
      defaultExpanded={defaultExpanded}
      info={<InfoTip title="Ausencia de sistema" message={INFO_MESSAGE} tone="amber" />}>
      {body}
    </CollapsibleSection>
  );
}

function LeaveRow({
  label,
  leave,
  canRemove,
  busy,
  onRemove,
}: {
  label: string;
  leave: MemberSystemLeave;
  canRemove?: boolean;
  busy?: boolean;
  onRemove?: () => void;
}) {
  const kindLabel = leave.kind === 'INDEFINITE' ? 'Indefinida' : 'Planificada';
  const range =
    leave.kind === 'INDEFINITE'
      ? `desde ${formatDateKey(leave.start_date)}`
      : `${formatDateKey(leave.start_date)} → ${formatDateKey(leave.end_date!)}`;

  return (
    <View
      style={mergeStyles(interactive.borderedCard, {
        borderColor: palette.amber200,
        backgroundColor: palette.amber100,
      })}>
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1 gap-0.5">
          <Text className="text-sm font-semibold text-amber-950">
            {label} · {kindLabel}
          </Text>
          <Text className="text-xs text-amber-900/80">{range}</Text>
          {leave.reason ? (
            <Text className="text-xs text-amber-900/70">{leave.reason}</Text>
          ) : null}
        </View>
        {canRemove && onRemove ? (
          <SafePressable
            disabled={busy}
            onPress={onRemove}
            contentStyle={mergeStyles(interactive.ghostButton, { paddingVertical: 4 })}>
            <Text className="text-xs font-semibold text-red-600">Quitar</Text>
          </SafePressable>
        ) : null}
      </View>
    </View>
  );
}
