import { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { DueDateFields } from '@/components/ui/DueDateFields';
import { RecurrenceEditor } from '@/components/ui/RecurrenceEditor';
import { TextField } from '@/components/ui/TextField';
import type { ExpenseFormSubmitInput } from '@/features/expenses/hooks/useHomeExpenses';
import { pickCompressedProofImage } from '@/features/expenses/api/receipt-upload';
import type { HomeMemberWithProfile } from '@/features/home/api/homes-api';
import {
  computeInitialDueAt,
  defaultDueAtForMode,
  ensureRecurrenceConfigDefaults,
  parseRecurrenceConfig,
  stripCycleSuffix,
  syncRecurrenceConfigFromDate,
  type DueMode,
  type RecurrenceConfig,
  type RecurrenceKind,
} from '@/lib/recurrence';
import { EXPENSE_KIND, EXPENSE_KIND_LABEL, type ExpenseKind } from '@/types/expense';
import type { ExpenseWithRelations } from '@/types/database.types';

type ExpenseFormModalProps = {
  visible: boolean;
  members: HomeMemberWithProfile[];
  currentUserId?: string | null;
  initialExpense?: ExpenseWithRelations | null;
  mode?: 'create' | 'edit' | 'repeat';
  onClose: () => void;
  onSubmit: (input: ExpenseFormSubmitInput) => Promise<void>;
  onDelete?: () => Promise<void>;
};

function parseAmount(raw: string): number {
  const normalized = raw.replace(',', '.').trim();
  if (normalized.length === 0) {
    return 0;
  }
  const value = Number(normalized);
  return Number.isFinite(value) ? value : Number.NaN;
}

function otherMemberIds(members: HomeMemberWithProfile[], paidBy: string): string[] {
  return members.filter((member) => member.user_id !== paidBy).map((member) => member.user_id);
}

/**
 * Modal form to create or edit a shared expense, including who owes it.
 */
export function ExpenseFormModal({
  visible,
  members,
  currentUserId,
  initialExpense,
  mode = 'create',
  onClose,
  onSubmit,
  onDelete,
}: ExpenseFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [kind, setKind] = useState<ExpenseKind>('GROCERY');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(currentUserId ?? '');
  const [debtorIds, setDebtorIds] = useState<string[]>([]);
  const [includePayer, setIncludePayer] = useState(true);
  const [recurrence, setRecurrence] = useState<RecurrenceKind>('ONCE');
  const [recurrenceConfig, setRecurrenceConfig] = useState<RecurrenceConfig>({});
  const [dueMode, setDueMode] = useState<DueMode>('DEADLINE');
  const [dueAt, setDueAt] = useState(() => defaultDueAtForMode('DEADLINE'));
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptLocalUri, setReceiptLocalUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pickingReceipt, setPickingReceipt] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }
    const defaultPayer = currentUserId ?? members[0]?.user_id ?? '';
    if (initialExpense) {
      setTitle(stripCycleSuffix(initialExpense.base_title ?? initialExpense.title));
      setDescription(initialExpense.description ?? '');
      setKind(initialExpense.kind);
      setAmount(initialExpense.amount > 0 ? String(initialExpense.amount) : '');
      setPaidBy(initialExpense.paid_by);
      setDebtorIds(
        initialExpense.expense_shares
          .map((share) => share.user_id)
          .filter((id) => id !== initialExpense.paid_by),
      );
      setIncludePayer(
        initialExpense.expense_shares.some((share) => share.user_id === initialExpense.paid_by),
      );
      setRecurrence(initialExpense.recurrence);
      setRecurrenceConfig(parseRecurrenceConfig(initialExpense.recurrence_config));
      setDueMode(initialExpense.due_mode ?? 'DEADLINE');
      if (initialExpense.due_at) {
        setDueAt(new Date(initialExpense.due_at));
      } else {
        setDueAt(defaultDueAtForMode(initialExpense.due_mode ?? 'DEADLINE'));
      }
      setReceiptUrl(initialExpense.receipt_image_url);
      setReceiptLocalUri(null);
    } else {
      setTitle('');
      setDescription('');
      setKind('PEER');
      setAmount('');
      setPaidBy(defaultPayer);
      setDebtorIds(otherMemberIds(members, defaultPayer));
      setIncludePayer(false);
      setRecurrence('ONCE');
      setRecurrenceConfig({});
      setDueMode('DEADLINE');
      setDueAt(defaultDueAtForMode('DEADLINE'));
      setReceiptUrl(null);
      setReceiptLocalUri(null);
    }
    setError(null);
  }, [visible, initialExpense, currentUserId, members]);

  function toggleDebtor(userId: string) {
    setDebtorIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    );
  }

  function applyKind(nextKind: ExpenseKind) {
    setKind(nextKind);
    const splitWithPayer = nextKind !== 'PEER';
    setIncludePayer(splitWithPayer);
    setDebtorIds(otherMemberIds(members, paidBy));
  }

  function applyPayer(nextPayer: string) {
    setPaidBy(nextPayer);
    setDebtorIds((current) => {
      const withoutPayer = current.filter((id) => id !== nextPayer);
      if (withoutPayer.length > 0) {
        return withoutPayer;
      }
      return otherMemberIds(members, nextPayer);
    });
  }

  async function handlePickReceipt(source: 'camera' | 'library') {
    setError(null);
    setPickingReceipt(true);
    try {
      const picked = await pickCompressedProofImage(source);
      if (picked) {
        setReceiptLocalUri(picked.uri);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo elegir la foto');
    } finally {
      setPickingReceipt(false);
    }
  }

  async function handleSubmit() {
    setError(null);
    if (!title.trim()) {
      setError('El título es obligatorio');
      return;
    }
    const parsedAmount = parseAmount(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      setError('Importe no válido');
      return;
    }
    if (!paidBy) {
      setError('Elige quién pagó');
      return;
    }
    if (debtorIds.length === 0) {
      setError('Elige quién te debe (toca el nombre del compañero)');
      return;
    }
    if (recurrence === 'WEEKLY' && !recurrenceConfig.day_of_week) {
      setError('Elige el día de la semana');
      return;
    }
    if (
      recurrence === 'MONTHLY' &&
      (recurrenceConfig.due_day_type ?? 'SPECIFIC_DAY') === 'SPECIFIC_DAY' &&
      !recurrenceConfig.day_of_month
    ) {
      setError('Elige el día del mes');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        kind,
        amount: parsedAmount,
        paid_by: paidBy,
        debtor_ids: debtorIds,
        include_payer_in_split: includePayer,
        receipt_image_url: receiptUrl,
        receiptLocalUri,
        recurrence,
        recurrence_config: recurrenceConfig,
        due_at: dueAt.toISOString(),
        due_mode: dueMode,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setLoading(false);
    }
  }

  function applyExpenseDueMode(next: DueMode) {
    setDueMode(next);
    if (recurrence !== 'ONCE') {
      setDueAt(computeInitialDueAt(recurrence, recurrenceConfig, new Date(), next));
    }
  }

  function applyExpenseRecurrence(next: RecurrenceKind) {
    setRecurrence(next);
    if (next === 'ONCE') {
      return;
    }
    const seeded = ensureRecurrenceConfigDefaults(next, recurrenceConfig, dueAt);
    setRecurrenceConfig(seeded);
    setDueAt(computeInitialDueAt(next, seeded, new Date(), dueMode));
  }

  function applyExpenseConfig(next: RecurrenceConfig) {
    const seeded =
      recurrence === 'ONCE' ? next : ensureRecurrenceConfigDefaults(recurrence, next, dueAt);
    setRecurrenceConfig(seeded);
    if (recurrence !== 'ONCE') {
      setDueAt(computeInitialDueAt(recurrence, seeded, new Date(), dueMode));
    }
  }

  function handleExpenseDueAtChange(next: Date) {
    if (recurrence === 'ONCE') {
      setDueAt(next);
      return;
    }
    const synced = syncRecurrenceConfigFromDate(recurrence, next, recurrenceConfig);
    setRecurrenceConfig(synced);
    setDueAt(next);
  }

  const debtorCandidates = members.filter((member) => member.user_id !== paidBy);
  const previewUri = receiptLocalUri ?? receiptUrl;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable
          className="max-h-[90%] w-full rounded-t-3xl bg-white p-4"
          onPress={(event) => event.stopPropagation()}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}>
            <Text className="mb-3 text-xl font-bold text-gray-900">
              {mode === 'edit' ? 'Editar gasto' : mode === 'repeat' ? 'Repetir gasto' : 'Nuevo gasto'}
            </Text>

            <View className="gap-3">
              <TextField label="Título" value={title} onChangeText={setTitle} />
              <TextField
                label="Importe (€)"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                placeholder="0 = recordatorio, sin deuda"
              />

              <Text className="text-sm font-medium text-gray-700">Tipo</Text>
              <View className="flex-row flex-wrap gap-2">
                {(Object.keys(EXPENSE_KIND) as Array<keyof typeof EXPENSE_KIND>).map((key) => {
                  const value = EXPENSE_KIND[key];
                  const active = kind === value;
                  return (
                    <Pressable
                      key={value}
                      onPress={() => applyKind(value)}
                      hitSlop={6}
                      className={`rounded-full px-3 py-2 ${active ? 'bg-blue-600' : 'bg-gray-100'}`}>
                      <Text
                        className={
                          active
                            ? 'text-xs font-semibold text-white'
                            : 'text-xs font-semibold text-gray-700'
                        }>
                        {EXPENSE_KIND_LABEL[value]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text className="text-sm font-medium text-gray-700">¿Quiénes te deben?</Text>
              <Text className="text-xs text-gray-500">
                Toca para marcar o desmarcar. Si no ves a nadie, invita a un compañero al piso.
              </Text>
              {debtorCandidates.length === 0 ? (
                <Text className="text-sm text-amber-700">
                  Solo estás tú en el piso. Añade compañeros para poder repartir.
                </Text>
              ) : (
                <View className="gap-2">
                  {debtorCandidates.map((member) => {
                    const selected = debtorIds.includes(member.user_id);
                    const name = member.profiles?.display_name ?? member.user_id.slice(0, 6);
                    return (
                      <Pressable
                        key={`debtor-${member.id}`}
                        onPress={() => toggleDebtor(member.user_id)}
                        hitSlop={4}
                        className={`flex-row items-center justify-between rounded-xl border px-3 py-3 ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                        <Text className="text-sm font-medium text-gray-900">{name}</Text>
                        <Text className="text-sm text-blue-700">
                          {selected ? '✓ Te debe' : 'Tocar'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              <Pressable
                onPress={() => setIncludePayer((value) => !value)}
                hitSlop={6}
                className={`rounded-xl border px-3 py-3 ${includePayer ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                <Text className="text-sm font-medium text-gray-900">
                  {includePayer ? '✓ ' : ''}También se reparte la parte de quien pagó
                </Text>
                <Text className="mt-1 text-xs text-gray-500">
                  Actívalo en alquiler o súper. Déjalo apagado si te deben el total.
                </Text>
              </Pressable>

              <Text className="text-sm font-medium text-gray-700">¿Quién pagó / adelantó?</Text>
              <View className="gap-2">
                {members.map((member) => {
                  const selected = paidBy === member.user_id;
                  const name = member.profiles?.display_name ?? member.user_id.slice(0, 6);
                  return (
                    <Pressable
                      key={`payer-${member.id}`}
                      onPress={() => applyPayer(member.user_id)}
                      hitSlop={4}
                      className={`flex-row items-center justify-between rounded-xl border px-3 py-3 ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                      <Text className="text-sm font-medium text-gray-900">{name}</Text>
                      <Text className="text-sm text-blue-700">{selected ? '✓' : ''}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <RecurrenceEditor
                recurrence={recurrence}
                config={recurrenceConfig}
                onRecurrenceChange={applyExpenseRecurrence}
                onConfigChange={applyExpenseConfig}
              />

              <DueDateFields
                dueMode={dueMode}
                dueAt={dueAt}
                recurrence={recurrence}
                recurrenceConfig={recurrenceConfig}
                onDueModeChange={applyExpenseDueMode}
                onDueAtChange={handleExpenseDueAtChange}
              />

              <TextField
                label="Descripción"
                value={description}
                onChangeText={setDescription}
              />

              <Text className="text-sm font-medium text-gray-700">Ticket / recibo (opcional)</Text>
              <Text className="text-xs text-gray-500">
                Puedes guardar el gasto sin adjunto y añadirlo más tarde al editar.
              </Text>
              {previewUri ? (
                <Image
                  source={{ uri: previewUri }}
                  className="h-36 w-full rounded-xl bg-gray-100"
                  resizeMode="cover"
                />
              ) : null}
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Button
                    label="Cámara"
                    variant="secondary"
                    loading={pickingReceipt}
                    onPress={() => void handlePickReceipt('camera')}
                  />
                </View>
                <View className="flex-1">
                  <Button
                    label="Galería"
                    variant="secondary"
                    loading={pickingReceipt}
                    onPress={() => void handlePickReceipt('library')}
                  />
                </View>
              </View>

              {error ? <Text className="text-sm text-red-600">{error}</Text> : null}

              <View className="mb-4 flex-row gap-2">
                <View className="flex-1">
                  <Button label="Cancelar" variant="secondary" onPress={onClose} />
                </View>
                <View className="flex-1">
                  <Button label="Guardar" loading={loading} onPress={() => void handleSubmit()} />
                </View>
              </View>
              {mode === 'edit' && onDelete ? (
                <Pressable
                  onPress={() => void onDelete()}
                  className="mb-6 rounded-xl border border-red-200 py-3">
                  <Text className="text-center text-sm font-semibold text-red-600">Eliminar gasto</Text>
                </Pressable>
              ) : null}
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
