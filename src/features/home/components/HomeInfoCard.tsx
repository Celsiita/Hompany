import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import { Button } from '@/components/ui/Button';
import { SafePressable } from '@/components/ui/SafePressable';
import { useToast } from '@/providers/ToastProvider';
import { TextField } from '@/components/ui/TextField';
import { copyToClipboard } from '@/lib/clipboard';
import { interactive, mergeStyles } from '@/lib/interactive-styles';
import type { Home } from '@/types/database.types';
import type { UpdateHomePracticalInfoInput } from '@/schemas/home.schema';
import { useLocale } from '@/providers/LocaleProvider';

type HomeInfoCardProps = {
  home: Home | null;
  onSave: (input: UpdateHomePracticalInfoInput) => Promise<void>;
};

type InfoRow = {
  key: keyof UpdateHomePracticalInfoInput;
  label: string;
  value: string;
  secret?: boolean;
  copyable?: boolean;
};

/**
 * True when the home has at least one practical info field filled.
 */
export function homeHasPracticalInfo(home: Home | null | undefined): boolean {
  if (!home) {
    return false;
  }
  return Boolean(
    home.wifi_ssid?.trim() ||
      home.wifi_password?.trim() ||
      home.portal_code?.trim() ||
      home.bin_day?.trim() ||
      home.notes?.trim(),
  );
}

/**
 * Piso card: shared flat practical info (Wi‑Fi, portal, bins) with edit sheet.
 */
export function HomeInfoCard({ home, onSave }: HomeInfoCardProps) {
  const { t } = useLocale();
  const showToast = useToast();
  const [editorOpen, setEditorOpen] = useState(false);
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [portalCode, setPortalCode] = useState('');
  const [binDay, setBinDay] = useState('');
  const [notes, setNotes] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editorOpen || !home) {
      return;
    }
    setWifiSsid(home.wifi_ssid ?? '');
    setWifiPassword(home.wifi_password ?? '');
    setPortalCode(home.portal_code ?? '');
    setBinDay(home.bin_day ?? '');
    setNotes(home.notes ?? '');
    setError(null);
  }, [editorOpen, home]);

  const rows = useMemo((): InfoRow[] => {
    if (!home) {
      return [];
    }
    const candidates: InfoRow[] = [
      {
        key: 'wifi_ssid',
        label: 'Wi‑Fi',
        value: home.wifi_ssid?.trim() ?? '',
        copyable: true,
      },
      {
        key: 'wifi_password',
        label: t('info.wifiPass'),
        value: home.wifi_password?.trim() ?? '',
        secret: true,
        copyable: true,
      },
      {
        key: 'portal_code',
        label: 'Portal / portero',
        value: home.portal_code?.trim() ?? '',
        copyable: true,
      },
      {
        key: 'bin_day',
        label: 'Basura / reciclaje',
        value: home.bin_day?.trim() ?? '',
      },
      {
        key: 'notes',
        label: 'Notas',
        value: home.notes?.trim() ?? '',
      },
    ];
    return candidates.filter((row) => row.value.length > 0);
  }, [home, t]);

  async function handleCopy(row: InfoRow) {
    if (!row.value) {
      return;
    }
    const ok = await copyToClipboard(row.value);
    if (ok) {
      setCopiedKey(row.key);
      setTimeout(() => setCopiedKey(null), 1500);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await onSave({
        wifi_ssid: wifiSsid,
        wifi_password: wifiPassword,
        portal_code: portalCode,
        bin_day: binDay,
        notes,
      });
      showToast({ message: t('toast.saved'), tone: 'success' });
      setEditorOpen(false);
    } catch (err) {
      showToast({ message: err instanceof Error ? err.message : t('toast.saveFail'), tone: 'error' });
    } finally {
      setSaving(false);
    }
  }

  const filled = homeHasPracticalInfo(home);

  return (
    <>
      <View className="rounded-2xl border border-teal-200 bg-white p-4 gap-3">
        <View className="flex-row items-start justify-between gap-2">
          <View className="flex-1 gap-0.5">
            <Text className="text-sm font-semibold text-stone-900">Info del piso</Text>
            <Text className="text-xs text-stone-500">
              Wi‑Fi, portal, basura y notas compartidas
            </Text>
          </View>
          <SafePressable
            onPress={() => setEditorOpen(true)}
            contentStyle={mergeStyles(interactive.chip, interactive.chipInactive)}>
            <Text className="text-xs font-semibold text-teal-800">
              {filled ? t('common.edit') : t('info.add')}
            </Text>
          </SafePressable>
        </View>

        {!filled ? (
          <View className="gap-1 rounded-xl border border-dashed border-stone-200 bg-stone-50/80 px-3 py-4">
            <Text className="text-sm font-semibold text-stone-800">Sin datos del piso</Text>
            <Text className="text-sm leading-5 text-stone-500">
              Añade Wi‑Fi o el código del portal para que el resto del piso lo tenga a mano.
            </Text>
          </View>
        ) : (
          <View className="gap-2">
            {rows.map((row) => {
              const display =
                row.secret && !showPassword
                  ? '•'.repeat(Math.min(12, Math.max(4, row.value.length)))
                  : row.value;
              return (
                <View
                  key={row.key}
                  className="flex-row items-center gap-2 rounded-xl border border-stone-100 bg-stone-50 px-3 py-2.5">
                  <View className="flex-1 gap-0.5">
                    <Text className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                      {row.label}
                    </Text>
                    <Text className="text-sm font-medium text-stone-900" selectable>
                      {display}
                    </Text>
                  </View>
                  {row.secret ? (
                    <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                      <Text className="text-xs font-semibold text-teal-700">
                        {showPassword ? 'Ocultar' : 'Ver'}
                      </Text>
                    </Pressable>
                  ) : null}
                  {row.copyable ? (
                    <Pressable onPress={() => void handleCopy(row)} hitSlop={8}>
                      <Text className="text-xs font-semibold text-teal-700">
                        {copiedKey === row.key ? t('info.copied') : t('info.copy')}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </View>

      <BottomSheetModal visible={editorOpen} onClose={() => setEditorOpen(false)}>
        <Text className="mb-1 text-lg font-bold text-stone-900">Info del piso</Text>
        <Text className="mb-3 text-sm text-stone-500">
          Visible para todos los compañeros del piso.
        </Text>
        <View className="gap-3">
          <TextField label="Wi‑Fi (nombre de red)" value={wifiSsid} onChangeText={setWifiSsid} />
          <TextField
            label={t('info.wifiPass')}
            value={wifiPassword}
            onChangeText={setWifiPassword}
            secureTextEntry
          />
          <TextField
            label={t('info.doorCode')}
            value={portalCode}
            onChangeText={setPortalCode}
          />
          <TextField
            label="Basura / reciclaje"
            value={binDay}
            onChangeText={setBinDay}
            placeholder={t('info.trashPh')}
          />
          <TextField
            label="Notas"
            value={notes}
            onChangeText={setNotes}
            placeholder={t('info.notesPh')}
          />
          {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
          <Button label={t('common.save')} loading={saving} onPress={() => void handleSave()} />
          <Button
            label={t('common.cancel')}
            variant="secondary"
            disabled={saving}
            onPress={() => setEditorOpen(false)}
          />
        </View>
      </BottomSheetModal>
    </>
  );
}
