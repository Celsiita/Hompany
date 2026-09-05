import { useEffect, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import { Button } from '@/components/ui/Button';
import { SafePressable } from '@/components/ui/SafePressable';
import { ItemTypePicker } from '@/components/ui/ItemTypePicker';
import { ScheduleEditor } from '@/components/ui/ScheduleEditor';
import { TextField } from '@/components/ui/TextField';
import type { ExpenseFormSubmitInput } from '@/features/expenses/hooks/useHomeExpenses';
import { pickCompressedProofImage } from '@/features/expenses/api/receipt-upload';
import type { HomeMemberWithProfile } from '@/features/home/api/homes-api';
import {
  defaultScheduleWindow,
  ensureRecurrenceConfigDefaults,
  monthlyDays,
  parseRecurrenceConfig,
  startOfLocalDay,
  stripCycleSuffix,
  validateScheduleRangeAgainstRecurrence,
  weeklyDays,
  yearlyMonths,
  type RecurrenceConfig,
  type RecurrenceKind,
} from '@/lib/recurrence';
import type { HomeItemType } from '@/schemas/item-type.schema';
import type { ExpenseSplitMode } from '@/schemas/expense.schema';
import { EXPENSE_KIND, EXPENSE_KIND_LABEL, type ExpenseKind } from '@/types/expense';
import { formatAppError } from '@/lib/error-message';
import { interactive, mergeStyles } from '@/lib/interactive-styles';
import { buildExpenseParticipantIds } from '@/features/expenses/lib/expense-filters';
import {
  amountsSumToTotal,
  percentsSumToHundred,
} from '@/features/expenses/lib/expense-balances';
import type { ExpenseWithRelations } from '@/types/database.types';

type ExpenseFormModalProps = {
  visible: boolean;
  members: HomeMemberWithProfile[];
  currentUserId?: string | null;
  initialExpense?: ExpenseWithRelations | null;
  customTypes?: HomeItemType[];
  onCreateType?: (name: string) => Promise<HomeItemType | void>;
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
  customTypes = [],
  onCreateType,
  mode = 'create',
  onClose,
  onSubmit,
  onDelete,
}: ExpenseFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [kind, setKind] = useState<ExpenseKind>('GROCERY');
  const [itemTypeId, setItemTypeId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(currentUserId ?? '');
  const [debtorIds, setDebtorIds] = useState<string[]>([]);
  const [includePayer, setIncludePayer] = useState(true);
  const [splitMode, setSplitMode] = useState<ExpenseSplitMode>('EQUAL');
  const [shareDrafts, setShareDrafts] = useState<Record<string, string>>({});
  const [recurrence, setRecurrence] = useState<RecurrenceKind>('ONCE');
  const [recurrenceConfig, setRecurrenceConfig] = useState<RecurrenceConfig>({});
  const [startsAt, setStartsAt] = useState(() => defaultScheduleWindow().startsAt);
  const [dueAt, setDueAt] = useState(() => defaultScheduleWindow().dueAt);
  const [allDay, setAllDay] = useState(true);
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
      setItemTypeId(initialExpense.item_type_id ?? null);
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
      setSplitMode(initialExpense.split_mode ?? 'EQUAL');
      const drafts: Record<string, string> = {};
      for (const share of initialExpense.expense_shares) {
        if ((initialExpense.split_mode ?? 'EQUAL') === 'PERCENT') {
          drafts[share.user_id] = share.share_percent != null ? String(share.share_percent) : '';
        } else if ((initialExpense.split_mode ?? 'EQUAL') === 'AMOUNT') {
          drafts[share.user_id] = String(share.share_amount);
        }
      }
      setShareDrafts(drafts);
      setRecurrence(initialExpense.recurrence);
      setRecurrenceConfig(parseRecurrenceConfig(initialExpense.recurrence_config));
      if (initialExpense.due_at) {
        setDueAt(new Date(initialExpense.due_at));
        setStartsAt(
          initialExpense.starts_at
            ? new Date(initialExpense.starts_at)
            : startOfLocalDay(new Date(initialExpense.due_at)),
        );
      } else {
        const window = defaultScheduleWindow();
        setStartsAt(window.startsAt);
        setDueAt(window.dueAt);
      }
      setAllDay(Boolean(initialExpense.all_day));
      setReceiptUrl(initialExpense.receipt_image_url);
      setReceiptLocalUri(null);
    } else {
      setTitle('');
      setDescription('');
      setKind('PEER');
      setItemTypeId(null);
      setAmount('');
      setPaidBy(defaultPayer);
      setDebtorIds(otherMemberIds(members, defaultPayer));
      setIncludePayer(false);
      setSplitMode('EQUAL');
      setShareDrafts({});
      setRecurrence('ONCE');
      setRecurrenceConfig({});
      const window = defaultScheduleWindow();
      setStartsAt(window.startsAt);
      setDueAt(window.dueAt);
      setAllDay(true);
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
    setItemTypeId(null);
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

    const participantIds = buildExpenseParticipantIds({
      paidBy,
      debtorIds,
      includePayerInSplit: includePayer,
    });
    let shareInputs: { user_id: string; share_percent?: number; share_amount?: number }[] | undefined;
    if (splitMode === 'PERCENT') {
      const values = participantIds.map((userId) => Number(shareDrafts[userId] ?? '0'));
      if (!percentsSumToHundred(values)) {
        setError('Los porcentajes deben sumar exactamente 100');
        return;
      }
      shareInputs = participantIds.map((userId, index) => ({
        user_id: userId,
        share_percent: values[index],
      }));
    } else if (splitMode === 'AMOUNT') {
      const values = participantIds.map((userId) => Number(String(shareDrafts[userId] ?? '0').replace(',', '.')));
      if (!amountsSumToTotal(values, parsedAmount)) {
        setError('Las cantidades deben sumar el total del gasto');
        return;
      }
      shareInputs = participantIds.map((userId, index) => ({
        user_id: userId,
        share_amount: values[index],
      }));
    }

    if (recurrence === 'WEEKLY' && weeklyDays(recurrenceConfig).length === 0) {
      setError('Elige al menos un día de la semana');
      return;
    }
    if (
      recurrence === 'MONTHLY' &&
      (recurrenceConfig.due_day_type ?? 'SPECIFIC_DAY') === 'SPECIFIC_DAY' &&
      monthlyDays(recurrenceConfig).length === 0
    ) {
      setError('Elige al menos un día del mes');
      return;
    }
    if (recurrence === 'YEARLY' && yearlyMonths(recurrenceConfig, startsAt).length === 0) {
      setError('Elige al menos un mes');
      return;
    }
    const rangeError = validateScheduleRangeAgainstRecurrence({
      startsAt,
      dueAt,
      recurrence,
      recurrenceConfig,
    });
    if (rangeError) {
      setError(rangeError);
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        kind,
        item_type_id: itemTypeId,
        amount: parsedAmount,
        paid_by: paidBy,
        debtor_ids: debtorIds,
        include_payer_in_split: includePayer,
        split_mode: splitMode,
        share_inputs: shareInputs,
        receipt_image_url: receiptUrl,
        receiptLocalUri,
        recurrence,
        recurrence_config: recurrenceConfig,
        starts_at: startsAt.toISOString(),
        due_at: dueAt.toISOString(),
        due_mode: 'DEADLINE',
        all_day: allDay,
      });
      onClose();
    } catch (err) {
      setError(formatAppError(err, 'No se pudo guardar'));
    } finally {
      setLoading(false);
    }
  }

  function applyExpenseRecurrence(next: RecurrenceKind) {
    setRecurrence(next);
    if (next === 'ONCE') {
      return;
    }
    const seeded = ensureRecurrenceConfigDefaults(next, recurrenceConfig, startsAt);
    setRecurrenceConfig(seeded);
  }

  function applyExpenseConfig(next: RecurrenceConfig) {
    const seeded =
      recurrence === 'ONCE'
        ? next
        : ensureRecurrenceConfigDefaults(recurrence, next, startsAt);
    setRecurrenceConfig(seeded);
  }

  function handleExpenseDueAtChange(next: Date) {
    setDueAt(next);
  }

  const debtorCandidates = members.filter((member) => member.user_id !== paidBy);
  const previewUri = receiptLocalUri ?? receiptUrl;

  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
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
              <ItemTypePicker
                builtin={[
                  { key: EXPENSE_KIND.GROCERY, label: EXPENSE_KIND_LABEL.GROCERY },
                  { key: EXPENSE_KIND.HOUSE, label: EXPENSE_KIND_LABEL.HOUSE },
                  { key: EXPENSE_KIND.PEER, label: EXPENSE_KIND_LABEL.PEER },
                ]}
                customTypes={customTypes}
                value={itemTypeId ?? kind}
                onChange={(next) => {
                  if (
                    next === EXPENSE_KIND.GROCERY ||
                    next === EXPENSE_KIND.HOUSE ||
                    next === EXPENSE_KIND.PEER
                  ) {
                    applyKind(next);
                    return;
                  }
                  setItemTypeId(next);
                  setKind('HOUSE');
                  setIncludePayer(true);
                }}
                onCreate={async (name) => {
                  if (!onCreateType) {
                    return;
                  }
                  return onCreateType(name);
                }}
              />

              <Text className="text-sm font-medium text-gray-700">Cómo se reparte</Text>
              <View className="flex-row flex-wrap gap-2">
                {(
                  [
                    { key: 'EQUAL' as const, label: 'Igualitario' },
                    { key: 'PERCENT' as const, label: 'Porcentajes' },
                    { key: 'AMOUNT' as const, label: 'Cantidades fijas' },
                  ] as const
                ).map((option) => {
                  const active = splitMode === option.key;
                  return (
                    <SafePressable
                      key={option.key}
                      onPress={() => setSplitMode(option.key)}
                      contentStyle={mergeStyles(
                        interactive.chip,
                        active ? interactive.chipActive : interactive.chipInactive,
                      )}>
                      <Text
                        className={`text-xs font-semibold ${active ? 'text-white' : 'text-gray-700'}`}>
                        {option.label}
                      </Text>
                    </SafePressable>
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
                      <SafePressable
                        key={`debtor-${member.id}`}
                        onPress={() => toggleDebtor(member.user_id)}
                        hitSlop={4}
                        contentStyle={mergeStyles(
                          interactive.borderedCard,
                          interactive.rowBetween,
                          selected ? interactive.borderedCardActive : undefined,
                        )}>
                        <Text className="text-sm font-medium text-gray-900">{name}</Text>
                        <Text className="text-sm text-blue-700">
                          {selected ? '✓ Te debe' : 'Tocar'}
                        </Text>
                      </SafePressable>
                    );
                  })}
                </View>
              )}

              <SafePressable
                onPress={() => setIncludePayer((value) => !value)}
                hitSlop={6}
                contentStyle={mergeStyles(
                  interactive.borderedCard,
                  includePayer ? interactive.borderedCardActive : undefined,
                )}>
                <Text className="text-sm font-medium text-gray-900">
                  {includePayer ? '✓ ' : ''}Dividir entre todos
                </Text>
                <Text className="mt-1 text-xs text-gray-500">
                  Activado: el total se reparte entre deudores y quien pagó. Desactivado: solo entre
                  deudores (te deben el total).
                </Text>
              </SafePressable>

              {splitMode !== 'EQUAL' ? (
                <View className="gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <Text className="text-xs text-gray-600">
                    {splitMode === 'PERCENT'
                      ? 'Escribe el % de cada participante. Debe sumar 100.'
                      : 'Escribe la cantidad de cada uno. Debe sumar el total.'}
                  </Text>
                  {buildExpenseParticipantIds({
                    paidBy,
                    debtorIds,
                    includePayerInSplit: includePayer,
                  }).map((userId) => {
                    const member = members.find((row) => row.user_id === userId);
                    const name =
                      userId === paidBy
                        ? `${member?.profiles?.display_name ?? 'Pagador'} (pagó)`
                        : (member?.profiles?.display_name ?? userId.slice(0, 6));
                    return (
                      <TextField
                        key={`share-${userId}`}
                        label={name}
                        keyboardType="decimal-pad"
                        value={shareDrafts[userId] ?? ''}
                        onChangeText={(next) =>
                          setShareDrafts((current) => ({ ...current, [userId]: next }))
                        }
                        placeholder={splitMode === 'PERCENT' ? '%' : '€'}
                      />
                    );
                  })}
                </View>
              ) : null}

              <Text className="text-sm font-medium text-gray-700">¿Quién pagó / adelantó?</Text>
              <View className="gap-2">
                {members.map((member) => {
                  const selected = paidBy === member.user_id;
                  const name = member.profiles?.display_name ?? member.user_id.slice(0, 6);
                  return (
                    <SafePressable
                      key={`payer-${member.id}`}
                      onPress={() => applyPayer(member.user_id)}
                      hitSlop={4}
                      contentStyle={mergeStyles(
                        interactive.borderedCard,
                        interactive.rowBetween,
                        selected ? interactive.borderedCardActive : undefined,
                      )}>
                      <Text className="text-sm font-medium text-gray-900">{name}</Text>
                      <Text className="text-sm text-blue-700">{selected ? '✓' : ''}</Text>
                    </SafePressable>
                  );
                })}
              </View>

              <ScheduleEditor
                startsAt={startsAt}
                dueAt={dueAt}
                allDay={allDay}
                onStartsAtChange={setStartsAt}
                onDueAtChange={handleExpenseDueAtChange}
                onAllDayChange={setAllDay}
                recurrence={recurrence}
                recurrenceConfig={recurrenceConfig}
                onRecurrenceChange={applyExpenseRecurrence}
                onConfigChange={applyExpenseConfig}
              />

              <TextField
                label="Descripción"
                value={description}
                onChangeText={setDescription}
              />

              <Text className="text-sm font-medium text-gray-700">Ticket / recibo</Text>
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
    </BottomSheetModal>
  );
}
