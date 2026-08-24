import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import {
  WEEKDAY_CHIPS,
  type RecurrenceConfig,
  type RecurrenceKind,
  RECURRENCE_KIND_LABEL,
} from '@/lib/recurrence';
import { TextField } from '@/components/ui/TextField';

const KINDS: RecurrenceKind[] = ['ONCE', 'DAILY', 'WEEKLY', 'MONTHLY'];

type RecurrenceEditorProps = {
  recurrence: RecurrenceKind;
  config: RecurrenceConfig;
  onRecurrenceChange: (value: RecurrenceKind) => void;
  onConfigChange: (value: RecurrenceConfig) => void;
  compact?: boolean;
};

function defaultDayOfMonth(config: RecurrenceConfig): number {
  return config.day_of_month ?? new Date().getDate();
}

/**
 * Shared recurrence controls for task and expense forms.
 */
export function RecurrenceEditor({
  recurrence,
  config,
  onRecurrenceChange,
  onConfigChange,
  compact = false,
}: RecurrenceEditorProps) {
  const [pausePanelOpen, setPausePanelOpen] = useState(Boolean(config.is_paused));
  const [dayOfMonthDraft, setDayOfMonthDraft] = useState(() =>
    String(defaultDayOfMonth(config)),
  );

  useEffect(() => {
    if ((config.due_day_type ?? 'SPECIFIC_DAY') !== 'SPECIFIC_DAY') {
      return;
    }
    if (config.day_of_month != null) {
      setDayOfMonthDraft(String(config.day_of_month));
    }
  }, [config.day_of_month, config.due_day_type]);

  function patch(partial: RecurrenceConfig) {
    onConfigChange({ ...config, ...partial });
  }

  function commitDayOfMonthDraft() {
    const parsed = Number(dayOfMonthDraft.trim());
    const fallback = defaultDayOfMonth(config);
    const day =
      Number.isFinite(parsed) && parsed >= 1 && parsed <= 31 ? parsed : fallback;
    setDayOfMonthDraft(String(day));
    patch({ due_day_type: 'SPECIFIC_DAY', day_of_month: day });
  }

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-gray-700">Periodicidad</Text>
      <View className="flex-row flex-wrap gap-2">
        {KINDS.map((value) => {
          const active = recurrence === value;
          return (
            <Pressable
              key={value}
              onPress={() => onRecurrenceChange(value)}
              className={`rounded-xl px-3 py-2 ${active ? 'bg-blue-600' : 'bg-gray-100'}`}>
              <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-gray-700'}`}>
                {RECURRENCE_KIND_LABEL[value]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {recurrence === 'WEEKLY' ? (
        <View className="gap-2">
          <Text className="text-xs text-gray-600">Día de la semana (obligatorio)</Text>
          <View className="flex-row gap-1">
            {WEEKDAY_CHIPS.map((chip) => {
              const active = config.day_of_week === chip.value;
              return (
                <Pressable
                  key={chip.value}
                  onPress={() => patch({ day_of_week: chip.value })}
                  className={`flex-1 rounded-lg py-2 ${active ? 'bg-blue-600' : 'bg-gray-100'}`}>
                  <Text
                    className={`text-center text-xs font-bold ${active ? 'text-white' : 'text-gray-700'}`}>
                    {chip.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {recurrence === 'MONTHLY' ? (
        <View className="gap-2">
          <Pressable
            onPress={() => {
              const day = defaultDayOfMonth(config);
              setDayOfMonthDraft(String(day));
              patch({
                due_day_type: 'SPECIFIC_DAY',
                day_of_month: day,
              });
            }}
            className={`rounded-xl border px-3 py-3 ${(config.due_day_type ?? 'SPECIFIC_DAY') === 'SPECIFIC_DAY' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
            <Text className="text-sm font-medium text-gray-900">Día concreto del mes</Text>
          </Pressable>
          {(config.due_day_type ?? 'SPECIFIC_DAY') === 'SPECIFIC_DAY' ? (
            <View className="gap-1">
              <TextField
                label="Día del mes (1-31)"
                keyboardType="number-pad"
                value={dayOfMonthDraft}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^\d]/g, '').slice(0, 2);
                  setDayOfMonthDraft(cleaned);
                  if (cleaned.length === 0) {
                    return;
                  }
                  const day = Number(cleaned);
                  if (Number.isFinite(day) && day >= 1 && day <= 31) {
                    patch({ due_day_type: 'SPECIFIC_DAY', day_of_month: day });
                  }
                }}
                onBlur={commitDayOfMonthDraft}
              />
              {config.day_of_month === 31 ? (
                <Text className="text-xs text-amber-800">
                  En meses con menos de 31 días, vencerá el último día del mes (ej. día 30 o 28/29
                  en febrero).
                </Text>
              ) : null}
            </View>
          ) : null}
          <Pressable
            onPress={() => patch({ due_day_type: 'LAST_DAY_OF_MONTH', day_of_month: undefined })}
            className={`rounded-xl border px-3 py-3 ${config.due_day_type === 'LAST_DAY_OF_MONTH' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
            <Text className="text-sm font-medium text-gray-900">Último día del mes</Text>
          </Pressable>
        </View>
      ) : null}

      {recurrence !== 'ONCE' ? (
        <View className="gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
          <Pressable onPress={() => setPausePanelOpen((open) => !open)}>
            <Text className="text-sm font-semibold text-gray-800">
              {compact ? 'Pausa' : 'Configuración de pausa'}
              {pausePanelOpen ? ' ▴' : ' ▾'}
            </Text>
          </Pressable>
          {pausePanelOpen ? (
            <Pressable
              onPress={() => patch({ is_paused: !config.is_paused })}
              className={`rounded-xl border px-3 py-3 ${config.is_paused ? 'border-amber-500 bg-amber-50' : 'border-gray-200 bg-white'}`}>
              <Text className="text-sm font-medium text-gray-900">
                {config.is_paused ? '✓ Pausada indefinidamente' : 'Pausa indefinida'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
