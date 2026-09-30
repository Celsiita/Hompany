import { useMemo, useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';

import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import { Button } from '@/components/ui/Button';
import { HelpTip } from '@/components/ui/HelpTip';
import { MascotLoading } from '@/components/ui/MascotLoading';
import { SafePressable } from '@/components/ui/SafePressable';
import { TextField } from '@/components/ui/TextField';
import { interactive, mergeStyles } from '@/lib/interactive-styles';
import { useConfirmDialog } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import type { FeedNoticeKind, HomeNotice } from '@/schemas/home-notice.schema';
import { useLocale } from '@/providers/LocaleProvider';

type HomeNoticesPanelProps = {
  notices: HomeNotice[];
  isLoading?: boolean;
  currentUserId?: string | null;
  isAdmin?: boolean;
  authorName?: (userId: string) => string;
  onAdd: (input: {
    kind: FeedNoticeKind;
    title: string;
    body?: string;
    is_anonymous?: boolean;
  }) => Promise<void>;
  onRemove: (noticeId: string) => Promise<void>;
};

const KIND_LABEL: Record<FeedNoticeKind, string> = {
  RULE: 'Regla',
  COMPLAINT: 'Queja',
};

/**
 * Piso card: house rules and complaints (optional anonymous).
 */
export function HomeNoticesPanel({
  notices,
  isLoading = false,
  currentUserId,
  isAdmin = false,
  authorName,
  onAdd,
  onRemove,
}: HomeNoticesPanelProps) {
  const { t } = useLocale();
  const confirm = useConfirmDialog();
  const showToast = useToast();
  const [editorOpen, setEditorOpen] = useState(false);
  const [kind, setKind] = useState<FeedNoticeKind>('RULE');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sorted = useMemo(
    () =>
      [...notices].sort((a, b) => {
        if (a.kind !== b.kind) {
          return a.kind === 'RULE' ? -1 : 1;
        }
        return b.created_at.localeCompare(a.created_at);
      }),
    [notices],
  );

  function resetForm() {
    setKind('RULE');
    setTitle('');
    setBody('');
    setIsAnonymous(false);
    setError(null);
  }

  async function handleSave() {
    setError(null);
    if (!title.trim()) {
      setError(t('form.needTitle'));
      return;
    }
    setSaving(true);
    try {
      await onAdd({
        kind,
        title: title.trim(),
        body: body.trim() || undefined,
        is_anonymous: kind === 'COMPLAINT' ? isAnonymous : false,
      });
      showToast({ message: t('toast.noticePublished'), tone: 'success' });
      setEditorOpen(false);
      resetForm();
    } catch (err) {
      showToast({ message: err instanceof Error ? err.message : t('toast.publishFail'), tone: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(notice: HomeNotice) {
    const ok = await confirm({
      title: t('confirm.deleteNotice'),
      message: t('confirm.deleteNoticeBody', { title: notice.title }),
      confirmLabel: t('common.delete'),
    });
    if (!ok) {
      return;
    }
    await onRemove(notice.id);
    showToast({ message: t('toast.noticeDeleted'), tone: 'success' });
  }

  return (
    <>
      <View className="rounded-2xl border border-stone-200 bg-white p-4 gap-3">
        <View className="flex-row items-start justify-between gap-2">
          <View className="flex-1 gap-0.5">
            <View className="flex-row items-center gap-1.5">
              <Text className="text-sm font-semibold text-stone-900">Reglas y quejas</Text>
              <HelpTip
                title="Reglas y quejas"
                message={t('rules.help')}
              />
            </View>
            <Text className="text-xs text-stone-500">
              Acuerdos del piso y avisos puntuales
            </Text>
          </View>
          <SafePressable
            onPress={() => {
              resetForm();
              setEditorOpen(true);
            }}
            contentStyle={mergeStyles(interactive.chip, interactive.chipInactive)}>
            <Text className="text-xs font-semibold text-teal-700">{t('info.add')}</Text>
          </SafePressable>
        </View>

        {isLoading ? (
          <MascotLoading />
        ) : sorted.length === 0 ? (
          <View className="items-center gap-1 rounded-2xl border border-stone-200 bg-white/80 px-4 py-6">
            <Text className="text-center text-sm font-semibold text-stone-800">
              Sin reglas ni quejas
            </Text>
            <Text className="text-center text-sm leading-5 text-stone-500">
              Publica la primera desde Añadir para que todo el piso la vea.
            </Text>
          </View>
        ) : (
          <View className="gap-2">
            {sorted.map((notice) => {
              const authorLabel =
                notice.is_anonymous || !notice.author_id
                  ? 'Anónimo'
                  : (authorName?.(notice.author_id) ?? 'Compañero');
              return (
                <View
                  key={notice.id}
                  className="gap-1 rounded-xl border border-stone-100 bg-stone-50 px-3 py-2.5">
                  <View className="flex-row items-center justify-between gap-2">
                    <Text className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                      {KIND_LABEL[notice.kind as FeedNoticeKind] ?? notice.kind}
                    </Text>
                    {isAdmin || notice.author_id === currentUserId ? (
                      <Pressable onPress={() => void handleRemove(notice)} hitSlop={8}>
                        <Text className="text-xs font-semibold text-red-600">Borrar</Text>
                      </Pressable>
                    ) : null}
                  </View>
                  <Text className="text-sm font-semibold text-stone-900">{notice.title}</Text>
                  {notice.body ? (
                    <Text className="text-sm text-stone-600">{notice.body}</Text>
                  ) : null}
                  <Text className="text-xs text-stone-500">{authorLabel}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <BottomSheetModal visible={editorOpen} onClose={() => setEditorOpen(false)}>
        <Text className="mb-1 text-lg font-bold text-stone-900">Nuevo aviso</Text>
        <Text className="mb-3 text-sm text-stone-500">
          Regla del piso o queja puntual (puedes publicar sin nombre).
        </Text>
        <View className="gap-3">
          <View className="flex-row gap-2">
            {(['RULE', 'COMPLAINT'] as const).map((option) => {
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
                      paddingVertical: 10,
                    },
                    active
                      ? { borderColor: '#60a5fa', backgroundColor: '#eff6ff' }
                      : { borderColor: '#e5e7eb', backgroundColor: '#f9fafb' },
                  )}>
                  <Text className="text-center text-sm font-semibold text-stone-800">
                    {KIND_LABEL[option]}
                  </Text>
                </SafePressable>
              );
            })}
          </View>
          <TextField label={t('common.title')} value={title} onChangeText={setTitle} />
          <TextField
            label="Detalle (opcional)"
            value={body}
            onChangeText={setBody}
            multiline
            className="min-h-[72px]"
          />
          {kind === 'COMPLAINT' ? (
            <View className="flex-row items-center justify-between gap-3 rounded-xl bg-stone-50 px-3 py-2">
              <Text className="flex-1 text-sm text-stone-700">Publicar de forma anónima</Text>
              <Switch value={isAnonymous} onValueChange={setIsAnonymous} />
            </View>
          ) : null}
          {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
          <Button label="Publicar" loading={saving} onPress={() => void handleSave()} />
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
