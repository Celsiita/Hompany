import { useState } from 'react';
import { Text, View } from 'react-native';

import { SafePressable } from '@/components/ui/SafePressable';
import { TextField } from '@/components/ui/TextField';
import { ToggleChipRow } from '@/components/ui/ToggleChipRow';
import { interactive, mergeStyles } from '@/lib/interactive-styles';
import { useLocale } from '@/providers/LocaleProvider';
import type { HomeItemType } from '@/schemas/item-type.schema';

type ItemTypePickerProps = {
  builtin: { key: string; label: string }[];
  customTypes: HomeItemType[];
  value: string;
  onChange: (value: string) => void;
  onCreate: (name: string) => Promise<HomeItemType | void>;
  addLabel?: string;
};

/**
 * Built-in type chips plus custom types and an inline "add type" field.
 */
export function ItemTypePicker({
  builtin,
  customTypes,
  value,
  onChange,
  onCreate,
  addLabel = '+ Tipo',
}: ItemTypePickerProps) {
  const { t } = useLocale();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const chips = [
    ...builtin,
    ...customTypes.map((type) => ({ key: type.id, label: type.name })),
  ];

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Pon un nombre');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await onCreate(trimmed);
      setName('');
      setAdding(false);
      if (created) {
        onChange(created.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('toast.actionFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View className="gap-2">
      <ToggleChipRow
        value={value}
        chips={chips}
        onChange={(next) => onChange(next === 'ALL' ? builtin[0]?.key ?? 'QUICK' : next)}
      />
      {!adding ? (
        <SafePressable
          onPress={() => setAdding(true)}
          contentStyle={mergeStyles(interactive.ghostButton, { alignSelf: 'flex-start', paddingVertical: 4 })}>
          <Text className="text-xs font-semibold text-teal-700">{addLabel}</Text>
        </SafePressable>
      ) : (
        <View className="gap-2">
          <TextField
            label={t('type.new')}
            value={name}
            onChangeText={setName}
            placeholder={t('common.name')}
          />
          {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
          <View className="flex-row gap-2">
            <SafePressable
              onPress={() => {
                setAdding(false);
                setError(null);
              }}
              contentStyle={interactive.secondaryButton}>
              <Text className="text-xs font-semibold text-stone-800">{t('common.cancel')}</Text>
            </SafePressable>
            <SafePressable
              disabled={saving}
              onPress={() => void handleCreate()}
              contentStyle={mergeStyles(interactive.primaryButton, saving ? interactive.disabled : undefined)}>
              <Text className="text-xs font-semibold text-white">{t('common.add')}</Text>
            </SafePressable>
          </View>
        </View>
      )}
    </View>
  );
}
