import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { InfoTip } from '@/components/ui/InfoTip';
import { MascotLoading } from '@/components/ui/MascotLoading';
import { SafePressable } from '@/components/ui/SafePressable';
import { TextField } from '@/components/ui/TextField';
import type { HomeMemberWithProfile } from '@/features/home/api/homes-api';
import {
  buildPeriodMarks,
  PeriodRangeCalendar,
} from '@/features/home/components/PeriodRangeCalendar';
import { startOfMonth } from '@/features/home/lib/month-calendar';
import { applyPeriodRangeSelection } from '@/features/home/lib/period-range-calendar';
import {
  formatExamDateKey,
  formatSilenceModeBanner,
  toExamDateKey,
} from '@/lib/exam-periods';
import { useConfirmDialog } from '@/providers/ConfirmProvider';
import type { MemberExamPeriod } from '@/schemas/exam-period.schema';

type ExamPeriodsPanelProps = {
  examPeriods: MemberExamPeriod[];
  members: HomeMemberWithProfile[];
  currentUserId?: string | null;
  isLoading?: boolean;
  busy?: boolean;
  onAdd: (input: { start_date: string; end_date: string; label: string }) => Promise<void>;
  onRemove: (periodId: string) => Promise<void>;
};

const INFO_MESSAGE =
  'Marca épocas de estudio: el calendario lo muestra y el piso entiende que hay menos margen para disputas.';

/**
 * Collapsible silence-mode section with optional registration form.
 */
export function ExamPeriodsPanel({
  examPeriods,
  members,
  currentUserId,
  isLoading = false,
  busy = false,
  onAdd,
  onRemove,
}: ExamPeriodsPanelProps) {
  const confirm = useConfirmDialog();
  const [formOpen, setFormOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [label, setLabel] = useState('Finales');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const marks = useMemo(
    () => buildPeriodMarks(examPeriods, currentUserId, 'silence'),
    [examPeriods, currentUserId],
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
    const start = toExamDateKey(rangeStart);
    const end = toExamDateKey(rangeEnd ?? rangeStart);
    const trimmed = label.trim();
    if (!trimmed) {
      setError('Indica un motivo (ej. Finales).');
      return;
    }
    setSaving(true);
    try {
      await onAdd({ start_date: start, end_date: end, label: trimmed });
      setFormOpen(false);
      setLabel('Finales');
      setRangeStart(null);
      setRangeEnd(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el periodo');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(period: MemberExamPeriod) {
    const ok = await confirm({
      title: 'Eliminar modo silencio',
      message: '¿Quitar este periodo del calendario?',
      confirmLabel: 'Eliminar',
    });
    if (!ok) {
      return;
    }
    await onRemove(period.id);
  }

  const mine = examPeriods.filter((row) => row.user_id === currentUserId);
  const others = examPeriods.filter((row) => row.user_id !== currentUserId);

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-2">
        <Text className="flex-1 text-sm font-semibold text-violet-950">Gestionar modo silencio</Text>
        <InfoTip title="Modo silencio" message={INFO_MESSAGE} tone="violet" />
      </View>
      {isLoading ? (
        <MascotLoading />
      ) : examPeriods.length === 0 ? (
        <View className="gap-1 rounded-xl border border-dashed border-violet-200 bg-violet-50/40 px-3 py-4">
          <Text className="text-sm font-semibold text-violet-950">Sin modo silencio</Text>
          <Text className="text-sm leading-5 text-violet-800/70">
            Actívalo en época de exámenes para bajar el ruido del piso.
          </Text>
        </View>
      ) : (
        <View className="gap-2">
          {mine.map((period) => (
            <SilenceModeRow
              key={period.id}
              banner={formatSilenceModeBanner(period.label, 'Tú')}
              period={period}
              canRemove
              busy={busy}
              onRemove={() => void handleRemove(period)}
            />
          ))}
          {others.map((period) => (
            <SilenceModeRow
              key={period.id}
              banner={formatSilenceModeBanner(period.label, memberName(period.user_id))}
              period={period}
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
          borderColor: '#c4b5fd',
          backgroundColor: '#ffffff',
          paddingHorizontal: 12,
          paddingVertical: 6,
        }}>
        <Text className="text-xs font-semibold text-violet-800">
          {formOpen ? 'Cerrar registro' : '+ Registrar periodo'}
        </Text>
      </SafePressable>

      {formOpen ? (
        <View className="gap-3 rounded-xl border border-violet-100 bg-white p-3">
          <TextField
            label="Motivo del periodo"
            value={label}
            onChangeText={setLabel}
            placeholder="Finales, entrega TFG…"
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
            Los días morados oscuros ya están registrados. Toca inicio y fin en días libres.
          </Text>
          {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
          <Button label="Guardar periodo" loading={saving || busy} onPress={() => void handleSave()} />
        </View>
      ) : null}
    </View>
  );
}

function SilenceModeRow({
  banner,
  period,
  canRemove = false,
  busy = false,
  onRemove,
}: {
  banner: string;
  period: MemberExamPeriod;
  canRemove?: boolean;
  busy?: boolean;
  onRemove?: () => void;
}) {
  return (
    <View className="gap-0.5 rounded-xl border border-violet-200 bg-violet-100/60 px-3 py-2">
      <View className="flex-row items-start justify-between gap-2">
        <Text className="flex-1 text-sm font-medium text-violet-950">{banner}</Text>
        {canRemove && onRemove ? (
          <SafePressable onPress={onRemove} disabled={busy} hitSlop={8}>
            <Text className="text-sm font-semibold text-red-600">Eliminar</Text>
          </SafePressable>
        ) : null}
      </View>
      <Text className="text-xs text-violet-800/80">
        {formatExamDateKey(period.start_date)} – {formatExamDateKey(period.end_date)}
      </Text>
    </View>
  );
}

