import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { SafePressable } from '@/components/ui/SafePressable';
import { TextField } from '@/components/ui/TextField';
import { interactive, mergeStyles, palette } from '@/lib/interactive-styles';
import {
  MONTH_LABELS,
  RECURRENCE_FREQUENCY_UNIT_LABEL,
  WEEKDAY_CHIPS,
  isoWeekday,
  monthlyDays,
  recurrenceInterval,
  type RecurrenceConfig,
  type RecurrenceFrequencyUnit,
  type RecurrenceKind,
  weeklyDays,
  yearlyMonths,
} from '@/lib/recurrence';

const UNITS: RecurrenceFrequencyUnit[] = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
const MONTH_DAY_OPTIONS = Array.from({ length: 31 }, (_, index) => index + 1);

type RecurrenceEditorProps = {
  recurrence: RecurrenceKind;
  config: RecurrenceConfig;
  onRecurrenceChange: (value: RecurrenceKind) => void;
  onConfigChange: (value: RecurrenceConfig) => void;
  compact?: boolean;
  /** Seeds weekday / day-of-month / month when enabling a unit. */
  seedFrom?: Date;
};

function chipStyle(active: boolean) {
  return mergeStyles(interactive.chip, active ? interactive.chipActive : interactive.chipInactive);
}

function borderedOption(active: boolean) {
  return mergeStyles(
    interactive.borderedCard,
    active ? interactive.borderedCardActive : undefined,
  );
}

/**
 * Interval + unit recurrence controls (after first-occurrence dates).
 */
export function RecurrenceEditor({
  recurrence,
  config,
  onRecurrenceChange,
  onConfigChange,
  compact = false,
  seedFrom = new Date(),
}: RecurrenceEditorProps) {
  const [pausePanelOpen, setPausePanelOpen] = useState(Boolean(config.is_paused));
  const [dayOfMonthDraft, setDayOfMonthDraft] = useState(() =>
    String(config.day_of_month ?? seedFrom.getDate()),
  );
  const repeats = recurrence !== 'ONCE';
  const interval = recurrenceInterval(config);
  const selectedWeekdays = weeklyDays(config, seedFrom);
  const selectedMonthDays = monthlyDays(config, seedFrom);
  const selectedMonths = yearlyMonths(config, seedFrom);

  useEffect(() => {
    if (config.day_of_month != null) {
      setDayOfMonthDraft(String(config.day_of_month));
    }
  }, [config.day_of_month]);

  function patch(partial: RecurrenceConfig) {
    onConfigChange({ ...config, ...partial });
  }

  function setRepeats(enabled: boolean) {
    if (!enabled) {
      onRecurrenceChange('ONCE');
      return;
    }
    if (recurrence === 'ONCE') {
      const weekday = isoWeekday(seedFrom);
      onRecurrenceChange('WEEKLY');
      patch({
        interval: 1,
        days_of_week: [weekday],
        day_of_week: weekday,
      });
    }
  }

  function setUnit(unit: RecurrenceFrequencyUnit) {
    onRecurrenceChange(unit);
    if (unit === 'WEEKLY') {
      const days =
        selectedWeekdays.length > 0 ? selectedWeekdays : [isoWeekday(seedFrom)];
      patch({ interval, days_of_week: days, day_of_week: days[0] });
      return;
    }
    if (unit === 'MONTHLY') {
      const days =
        selectedMonthDays.length > 0 ? selectedMonthDays : [seedFrom.getDate()];
      patch({
        interval,
        due_day_type: 'SPECIFIC_DAY',
        days_of_month: days,
        day_of_month: days[0],
      });
      return;
    }
    if (unit === 'YEARLY') {
      const months =
        selectedMonths.length > 0 ? selectedMonths : [seedFrom.getMonth() + 1];
      const day = config.day_of_month ?? seedFrom.getDate();
      patch({
        interval,
        active_months: months,
        day_of_month: day,
      });
      setDayOfMonthDraft(String(day));
      return;
    }
    patch({ interval });
  }

  function bumpInterval(delta: number) {
    patch({ interval: Math.min(365, Math.max(1, interval + delta)) });
  }

  function toggleWeekday(value: number) {
    const exists = selectedWeekdays.includes(value);
    const next = exists
      ? selectedWeekdays.filter((day) => day !== value)
      : [...selectedWeekdays, value].sort((a, b) => a - b);
    const days = next.length > 0 ? next : [value];
    patch({ days_of_week: days, day_of_week: days[0] });
  }

  function toggleMonthDay(value: number) {
    const exists = selectedMonthDays.includes(value);
    const next = exists
      ? selectedMonthDays.filter((day) => day !== value)
      : [...selectedMonthDays, value].sort((a, b) => a - b);
    const days = next.length > 0 ? next : [value];
    patch({
      due_day_type: 'SPECIFIC_DAY',
      days_of_month: days,
      day_of_month: days[0],
    });
  }

  function toggleMonth(value: number) {
    const exists = selectedMonths.includes(value);
    const next = exists
      ? selectedMonths.filter((month) => month !== value)
      : [...selectedMonths, value].sort((a, b) => a - b);
    const months = next.length > 0 ? next : [value];
    patch({ active_months: months });
  }

  function commitYearDay() {
    const parsed = Number(dayOfMonthDraft.trim());
    const day =
      Number.isFinite(parsed) && parsed >= 1 && parsed <= 31
        ? parsed
        : seedFrom.getDate();
    setDayOfMonthDraft(String(day));
    patch({ day_of_month: day });
  }

  return (
    <View className="gap-2">
      <View className="flex-row gap-2">
        <SafePressable onPress={() => setRepeats(false)} contentStyle={chipStyle(!repeats)}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: !repeats ? palette.white : palette.gray700,
            }}>
            No se repite
          </Text>
        </SafePressable>
        <SafePressable onPress={() => setRepeats(true)} contentStyle={chipStyle(repeats)}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: repeats ? palette.white : palette.gray700,
            }}>
            Se repite
          </Text>
        </SafePressable>
      </View>

      {repeats ? (
        <View className="gap-2">
          <Text className="text-xs text-gray-600">Cada</Text>
          <View className="flex-row items-center gap-2">
            <SafePressable
              onPress={() => bumpInterval(-1)}
              contentStyle={mergeStyles(interactive.secondaryButton, { minWidth: 44 })}>
              <Text className="text-center text-base font-bold text-gray-800">−</Text>
            </SafePressable>
            <View className="min-w-[48px] items-center rounded-xl border border-gray-200 bg-white px-3 py-2">
              <Text className="text-base font-semibold text-gray-900">{interval}</Text>
            </View>
            <SafePressable
              onPress={() => bumpInterval(1)}
              contentStyle={mergeStyles(interactive.secondaryButton, { minWidth: 44 })}>
              <Text className="text-center text-base font-bold text-gray-800">+</Text>
            </SafePressable>
          </View>

          <View className="flex-row flex-wrap gap-2">
            {UNITS.map((unit) => {
              const active = recurrence === unit;
              return (
                <SafePressable key={unit} onPress={() => setUnit(unit)} contentStyle={chipStyle(active)}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: active ? palette.white : palette.gray700,
                    }}>
                    {RECURRENCE_FREQUENCY_UNIT_LABEL[unit]}
                  </Text>
                </SafePressable>
              );
            })}
          </View>

          {recurrence === 'WEEKLY' ? (
            <View className="gap-2">
              <Text className="text-xs text-gray-600">Días de la semana (mín. 1)</Text>
              <View className="flex-row gap-1">
                {WEEKDAY_CHIPS.map((chip) => {
                  const active = selectedWeekdays.includes(chip.value);
                  return (
                    <SafePressable
                      key={chip.value}
                      onPress={() => toggleWeekday(chip.value)}
                      contentStyle={chipStyle(active)}>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '600',
                          color: active ? palette.white : palette.gray700,
                        }}>
                        {chip.label}
                      </Text>
                    </SafePressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {recurrence === 'MONTHLY' ? (
            <View className="gap-2">
              <Text className="text-xs text-gray-600">Días del mes (mín. 1)</Text>
              <View className="flex-row flex-wrap gap-1">
                {MONTH_DAY_OPTIONS.map((day) => {
                  const active = selectedMonthDays.includes(day);
                  return (
                    <SafePressable
                      key={day}
                      onPress={() => toggleMonthDay(day)}
                      contentStyle={mergeStyles(chipStyle(active), { minWidth: 36 })}>
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '600',
                          color: active ? palette.white : palette.gray700,
                          textAlign: 'center',
                        }}>
                        {day}
                      </Text>
                    </SafePressable>
                  );
                })}
              </View>
              <SafePressable
                onPress={() =>
                  patch({
                    due_day_type: 'LAST_DAY_OF_MONTH',
                    days_of_month: undefined,
                    day_of_month: undefined,
                  })
                }
                contentStyle={borderedOption(config.due_day_type === 'LAST_DAY_OF_MONTH')}>
                <Text className="text-sm text-gray-900">Último día del mes</Text>
              </SafePressable>
            </View>
          ) : null}

          {recurrence === 'YEARLY' ? (
            <View className="gap-2">
              <Text className="text-xs text-gray-600">Meses (mín. 1)</Text>
              <View className="flex-row flex-wrap gap-1">
                {MONTH_LABELS.map((label, index) => {
                  const value = index + 1;
                  const active = selectedMonths.includes(value);
                  return (
                    <SafePressable
                      key={label}
                      onPress={() => toggleMonth(value)}
                      contentStyle={chipStyle(active)}>
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '600',
                          color: active ? palette.white : palette.gray700,
                        }}>
                        {label.slice(0, 3)}
                      </Text>
                    </SafePressable>
                  );
                })}
              </View>
              <TextField
                label="Día del mes (1–31)"
                value={dayOfMonthDraft}
                onChangeText={setDayOfMonthDraft}
                onBlur={commitYearDay}
                keyboardType="number-pad"
              />
            </View>
          ) : null}

          {!compact ? (
            <View className="gap-2">
              <SafePressable
                onPress={() => {
                  const open = !pausePanelOpen;
                  setPausePanelOpen(open);
                  if (!open) {
                    patch({ is_paused: false });
                  }
                }}
                contentStyle={borderedOption(Boolean(config.is_paused))}>
                <Text className="text-sm font-semibold text-gray-900">Pausa indefinida</Text>
                <Text className="text-xs text-gray-500">
                  No genera nuevas instancias hasta que la reactives
                </Text>
              </SafePressable>
              {pausePanelOpen ? (
                <SafePressable
                  onPress={() => patch({ is_paused: !config.is_paused })}
                  contentStyle={borderedOption(Boolean(config.is_paused))}>
                  <Text className="text-sm text-gray-900">
                    {config.is_paused ? 'Pausada · tocar para reanudar' : 'Activa · tocar para pausar'}
                  </Text>
                </SafePressable>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
