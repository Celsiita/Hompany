import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { CollapsibleSection } from '@/components/ui/CollapsibleFilterPanel';
import { SafePressable } from '@/components/ui/SafePressable';
import { TextField } from '@/components/ui/TextField';
import {
  buildPeriodMarks,
  PeriodRangeCalendar,
} from '@/features/home/components/PeriodRangeCalendar';
import { startOfMonth } from '@/features/home/lib/month-calendar';
import { applyPeriodRangeSelection } from '@/features/home/lib/period-range-calendar';
import { formatDateKey, toDateKey } from '@/lib/absences';
import {
  CALENDAR_NOTICE_GLYPH,
  CALENDAR_NOTICE_LABEL,
} from '@/lib/home-notices';
import { interactive, mergeStyles } from '@/lib/interactive-styles';
import { useConfirmDialog } from '@/providers/ConfirmProvider';
import type { CalendarNoticeKind, HomeNotice } from '@/schemas/home-notice.schema';

type CalendarNoticesPanelProps = {
  notices: HomeNotice[];
  isLoading?: boolean;
  busy?: boolean;
  currentUserId?: string | null;
  isAdmin?: boolean;
  onAdd: (input: {
    kind: CalendarNoticeKind;
    title: string;
    starts_on: string;
    ends_on: string;
  }) => Promise<void>;
  onRemove: (noticeId: string) => Promise<void>;
};

const KIND_OPTIONS: CalendarNoticeKind[] = ['VISIT', 'REPAIR', 'EVENT'];

/**
 * Agenda section to create visit / repair / event calendar notices.
 */
export function CalendarNoticesPanel({
  notices,
  isLoading = false,
  busy = false,
  currentUserId,
  isAdmin = false,
  onAdd,
  onRemove,
}: CalendarNoticesPanelProps) {
  const confirm = useConfirmDialog();
  const [formOpen, setFormOpen] = useState(false);
  const [kind, setKind] = useState<CalendarNoticeKind>('VISIT');
  const [title, setTitle] = useState('');
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const marks = useMemo(
    () =>
      notices
        .filter((row) => row.starts_on && row.ends_on)
        .map((row) => ({
          start_date: row.starts_on as string,
          end_date: row.ends_on as string,
          user_id: row.author_id ?? 'notice',
        })),
    [notices],
  );

  const periodMarks = useMemo(
    () => buildPeriodMarks(marks, currentUserId, 'absence'),
    [marks, currentUserId],
  );

  function handleSelectDate(date: Date) {
    const next = applyPeriodRangeSelection({
      date,
      rangeStart,
      rangeEnd,
      marks: periodMarks,
    });
    setRangeStart(next.rangeStart);
    setRangeEnd(next.rangeEnd);
    setError(next.error);
  }

  async function handleSave() {
    setError(null);
    if (!title.trim()) {
      setError('Escribe un título');
      return;
    }
    if (!rangeStart) {
      setError('Elige al menos un día en el calendario');
      return;
    }
    setSaving(true);
    try {
      await onAdd({
        kind,
        title: title.trim(),
        starts_on: toDateKey(rangeStart),
        ends_on: toDateKey(rangeEnd ?? rangeStart),
      });
      setFormOpen(false);
      setTitle('');
      setRangeStart(null);
      setRangeEnd(null);
      setKind('VISIT');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(notice: HomeNotice) {
    const ok = await confirm({
      title: 'Eliminar aviso',
      message: `¿Borrar «${notice.title}»?`,
      confirmLabel: 'Eliminar',
    });
    if (!ok) {
      return;
    }
    await onRemove(notice.id);
  }

  return (
    <CollapsibleSection title="Visitas y eventos" defaultExpanded={false}>
      <View className="gap-3">
        <Text className="text-xs text-gray-500">
          Visitas, reparaciones o eventos del piso en el calendario.
        </Text>

        {isLoading ? (
          <ActivityIndicator color="#2563eb" />
        ) : notices.length === 0 ? (
          <Text className="text-sm text-gray-500">No hay avisos de calendario.</Text>
        ) : (
          <View className="gap-2">
            {notices.map((notice) => {
              const canDelete =
                isAdmin || (Boolean(currentUserId) && notice.author_id === currentUserId);
              const glyph =
                notice.kind === 'VISIT' || notice.kind === 'REPAIR' || notice.kind === 'EVENT'
                  ? CALENDAR_NOTICE_GLYPH[notice.kind]
                  : '📌';
              const label =
                notice.kind === 'VISIT' || notice.kind === 'REPAIR' || notice.kind === 'EVENT'
                  ? CALENDAR_NOTICE_LABEL[notice.kind]
                  : notice.kind;
              return (
                <View
                  key={notice.id}
                  className="flex-row items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                  <Text className="text-base">{glyph}</Text>
                  <View className="flex-1 gap-0.5">
                    <Text className="text-sm font-semibold text-gray-900">{notice.title}</Text>
                    <Text className="text-xs text-gray-500">
                      {label}
                      {notice.starts_on && notice.ends_on
                        ? ` · ${formatDateKey(notice.starts_on)} – ${formatDateKey(notice.ends_on)}`
                        : ''}
                    </Text>
                  </View>
                  {canDelete ? (
                    <Pressable
                      onPress={() => void handleRemove(notice)}
                      disabled={busy}
                      hitSlop={8}>
                      <Text className="text-xs font-semibold text-red-600">Borrar</Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}

        {!formOpen ? (
          <Button
            label="Añadir aviso"
            variant="secondary"
            disabled={busy}
            onPress={() => setFormOpen(true)}
          />
        ) : (
          <View className="gap-3">
            <View className="flex-row gap-2">
              {KIND_OPTIONS.map((option) => {
                const active = kind === option;
                return (
                  <SafePressable
                    key={option}
                    onPress={() => setKind(option)}
                    style={{ flex: 1 }}
                    contentStyle={mergeStyles(
                      interactive.roundedXl,
                      {
                        borderWidth: 1,
                        paddingVertical: 8,
                      },
                      active
                        ? { borderColor: '#60a5fa', backgroundColor: '#eff6ff' }
                        : { borderColor: '#e5e7eb', backgroundColor: '#f9fafb' },
                    )}>
                    <Text className="text-center text-xs font-semibold text-gray-800">
                      {CALENDAR_NOTICE_GLYPH[option]} {CALENDAR_NOTICE_LABEL[option]}
                    </Text>
                  </SafePressable>
                );
              })}
            </View>
            <TextField label="Título" value={title} onChangeText={setTitle} />
            <PeriodRangeCalendar
              visibleMonth={visibleMonth}
              onMonthChange={setVisibleMonth}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              marks={periodMarks}
              onSelectDate={handleSelectDate}
            />
            {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
            <Button label="Guardar" loading={saving} onPress={() => void handleSave()} />
            <Button
              label="Cancelar"
              variant="secondary"
              disabled={saving}
              onPress={() => {
                setFormOpen(false);
                setError(null);
              }}
            />
          </View>
        )}
      </View>
    </CollapsibleSection>
  );
}
