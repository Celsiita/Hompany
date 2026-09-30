import { Image, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { SafePressable } from '@/components/ui/SafePressable';
import { interactive, mergeStyles, palette } from '@/lib/interactive-styles';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatEuro } from '@/features/expenses/lib/expense-balances';
import { isExpenseOverdue, isExpensePaused, isExpenseSettledLate, isExpenseSettlementRequested } from '@/features/expenses/lib/expense-filters';
import { expenseOwnershipLabel } from '@/features/expenses/lib/expense-ownership';
import { isShareSettled } from '@/features/expenses/lib/expense-settlement';
import { formatDueSummary } from '@/features/tasks/lib/countdown';
import { glyphForExpenseKind } from '@/lib/icons/packs';
import { expenseStatusBadge } from '@/lib/status-badges';
import { formatHistoryDateTime, recurrenceLabel } from '@/lib/recurrence';
import { useIconPack } from '@/providers/IconPackProvider';
import type { ExpenseShareWithProfile, ExpenseWithRelations } from '@/types/database.types';
import { EXPENSE_KIND_LABEL } from '@/types/expense';

type ExpenseCardProps = {
  expense: ExpenseWithRelations;
  currentUserId?: string | null;
  busy?: boolean;
  /** Temporary visual focus from calendar / create redirect. */
  highlighted?: boolean;
  /** Tap the card body to edit (when allowed). */
  onEdit?: (expense: ExpenseWithRelations) => void;
  onSettle?: (expense: ExpenseWithRelations) => void;
  onRepeat?: (expense: ExpenseWithRelations) => void;
  showDate?: boolean;
  canEdit?: boolean;
  /** Creditor: classic per-user Saldar / Deshacer. */
  onSettleShare?: (
    expense: ExpenseWithRelations,
    share: ExpenseShareWithProfile,
    isSettled: boolean,
  ) => void;
};

/**
 * Interactive expense card with payer, debtor requests and creditor settle actions.
 * Tap the card (outside action buttons) to edit when `onEdit` is set.
 */
export function ExpenseCard({
  expense,
  currentUserId,
  busy = false,
  highlighted = false,
  onEdit,
  onSettle,
  onRepeat,
  showDate = false,
  canEdit = true,
  onSettleShare,
}: ExpenseCardProps) {
  const { pack } = useIconPack();
  const isOpen = expense.status === 'OPEN';
  const noAmount = expense.amount <= 0;
  const debtors = expense.expense_shares.filter((share) => share.user_id !== expense.paid_by);
  const countdown = expense.due_at
    ? formatDueSummary(expense.due_at, expense.due_mode ?? 'DEADLINE')
    : null;
  const badge = expenseStatusBadge({
    status: expense.status,
    paused: isExpensePaused(expense),
    noAmount: isOpen && noAmount,
    overdue: (isOpen && isExpenseOverdue(expense)) || isExpenseSettledLate(expense),
    requested: isOpen && isExpenseSettlementRequested(expense),
  });
  const completedAt =
    expense.completed_at ??
    (expense.status === 'SETTLED' ||
    expense.status === 'ARCHIVED' ||
    expense.status === 'SKIPPED'
      ? expense.updated_at
      : null);
  const isCreditor = Boolean(currentUserId && currentUserId === expense.paid_by);
  const ownershipLabel = expenseOwnershipLabel(expense, currentUserId);
  const iOwe = ownershipLabel === 'Debes';
  const editable = Boolean(canEdit && onEdit);

  return (
    <SafePressable
      disabled={!editable}
      onPress={() => onEdit?.(expense)}
      accessibilityRole={editable ? 'button' : undefined}
      accessibilityHint={editable ? 'Editar gasto' : undefined}
      contentStyle={mergeStyles(
        {
          gap: 12,
          borderRadius: 16,
          borderWidth: 1,
          backgroundColor: palette.white,
          padding: 16,
        },
        highlighted
          ? { borderColor: palette.amber500, backgroundColor: palette.amber50 }
          : { borderColor: palette.gray200 },
      )}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-row items-start gap-3 flex-1">
          <View className="h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
            <Text className="text-xl">{glyphForExpenseKind(pack, expense.kind)}</Text>
          </View>
          <View className="flex-1 gap-1">
            <View className="flex-row flex-wrap items-center gap-1.5">
              {ownershipLabel ? (
                <View
                  className={`rounded-md px-2 py-0.5 ${
                    isCreditor
                      ? 'bg-amber-200/80'
                      : iOwe
                        ? 'bg-rose-200/80'
                        : 'bg-emerald-200/80'
                  }`}>
                  <Text
                    className={`text-[10px] font-bold ${
                      isCreditor
                        ? 'text-amber-950'
                        : iOwe
                          ? 'text-rose-950'
                          : 'text-emerald-950'
                    }`}>
                    {ownershipLabel}
                  </Text>
                </View>
              ) : null}
              <Text className="text-xs font-medium text-amber-800">
                {EXPENSE_KIND_LABEL[expense.kind]} · {recurrenceLabel(expense.recurrence)}
              </Text>
            </View>
            <Text className="text-lg font-semibold text-gray-900">{expense.title}</Text>
            {expense.description ? (
              <Text className="text-sm text-gray-600">{expense.description}</Text>
            ) : null}
          </View>
        </View>
        <StatusBadge tone={badge} />
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-gray-600">
          Pagó {isCreditor ? 'tú' : (expense.payer?.display_name ?? 'alguien')}
        </Text>
        <Text className="text-lg font-bold text-gray-900">
          {noAmount ? '—' : formatEuro(expense.amount)}
        </Text>
      </View>

      {showDate ? (
        <View className="gap-0.5">
          <Text className="text-sm text-gray-600">
            Programada:{' '}
            {expense.due_at ? formatHistoryDateTime(expense.due_at) : 'Sin fecha'}
          </Text>
          <Text className="text-sm text-gray-600">
            Realización:{' '}
            {completedAt ? formatHistoryDateTime(completedAt) : '—'}
          </Text>
        </View>
      ) : (
        <Text
          className={`text-sm font-medium ${
            countdown?.isOverdue ? 'text-red-600' : 'text-gray-700'
          }`}>
          {countdown?.label ??
            (expense.due_at ? formatHistoryDateTime(expense.due_at) : 'Fecha obligatoria')}
        </Text>
      )}

      {expense.receipt_image_url ? (
        <Image
          source={{ uri: expense.receipt_image_url }}
          className="h-36 w-full rounded-xl bg-gray-100"
          resizeMode="cover"
        />
      ) : null}

      {debtors.length === 0 ? (
        <Text className="text-xs text-gray-500">Nadie más debe este gasto.</Text>
      ) : (
        <View className="gap-2">
          {debtors.map((share) => {
            const name = share.profiles?.display_name ?? 'Compañero';
            const settled = isShareSettled(share);
            const isDebtor = Boolean(currentUserId && currentUserId === share.user_id);
            const showActions = isOpen && !noAmount && Boolean(currentUserId);

            return (
              <View
                key={share.id}
                className="flex-row items-center justify-between rounded-xl bg-gray-50 px-3 py-2 gap-2">
                <Text className="flex-1 text-sm text-gray-800">
                  {name}
                  {settled ? ' · pagado' : ` · ${formatEuro(share.share_amount)}`}
                  {isDebtor && !settled ? ' · te toca' : ''}
                </Text>

                {showActions && isCreditor && onSettleShare ? (
                  <Pressable
                    onPress={() => onSettleShare(expense, share, !settled)}
                    disabled={busy}
                    hitSlop={8}>
                    <Text className="text-sm font-semibold text-amber-800">
                      {settled ? 'Deshacer' : 'Saldar'}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </View>
      )}

      {isOpen && onSettle && isCreditor ? (
        <Button
          label={noAmount ? 'Completar importe' : 'Saldar todo'}
          loading={busy}
          onPress={() => (noAmount ? onEdit?.(expense) : onSettle(expense))}
        />
      ) : null}

      {onRepeat ? (
        <Button label="↻ Repetir" variant="secondary" loading={busy} onPress={() => onRepeat(expense)} />
      ) : null}
    </SafePressable>
  );
}
