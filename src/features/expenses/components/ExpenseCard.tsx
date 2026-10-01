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
import { displayExpenseOwnership } from '@/lib/i18n/display';
import { formatHistoryDateTime, parseRecurrenceConfig, recurrenceLabel } from '@/lib/recurrence';
import { resolveExpenseTypeLabel } from '@/lib/item-type-labels';
import { useIconPack } from '@/providers/IconPackProvider';
import { useLocale } from '@/providers/LocaleProvider';
import type { HomeItemType } from '@/schemas/item-type.schema';
import type { ExpenseShareWithProfile, ExpenseWithRelations } from '@/types/database.types';
import type { ExpenseKind } from '@/types/expense';

type ExpenseCardProps = {
  expense: ExpenseWithRelations;
  /** Custom home item types so cards show the created type name. */
  itemTypes?: readonly HomeItemType[];
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
  itemTypes = [],
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
  const { t } = useLocale();
  const isOpen = expense.status === 'OPEN';
  const noAmount = expense.amount <= 0;
  const debtors = expense.expense_shares.filter((share) => share.user_id !== expense.paid_by);
  const countdown = expense.due_at
    ? formatDueSummary(expense.due_at, expense.due_mode ?? 'DEADLINE')
    : null;
  const typeLabel = resolveExpenseTypeLabel({
    kind: expense.kind as ExpenseKind,
    itemTypeId: expense.item_type_id,
    itemTypes,
  });
  const periodLabel = recurrenceLabel(
    expense.recurrence,
    parseRecurrenceConfig(expense.recurrence_config),
  );
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
  const ownershipDisplay = displayExpenseOwnership(ownershipLabel, t);
  const iOwe = ownershipLabel === 'Debes';
  const editable = Boolean(canEdit && onEdit);

  return (
    <SafePressable
      disabled={!editable}
      onPress={() => onEdit?.(expense)}
      accessibilityRole={editable ? 'button' : undefined}
      accessibilityHint={editable ? t('expense.edit') : undefined}
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
          : isCreditor
            ? { borderColor: palette.amber200 }
            : iOwe
              ? { borderColor: palette.rose200 }
              : ownershipLabel
                ? { borderColor: palette.emerald200 }
                : { borderColor: palette.gray200 },
      )}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-row items-start gap-3 flex-1">
          <View className="h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
            <Text className="text-xl">{glyphForExpenseKind(pack, expense.kind)}</Text>
          </View>
          <View className="flex-1 gap-1">
            <View className="flex-row flex-wrap items-center gap-1.5">
              {ownershipDisplay ? (
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
                    {ownershipDisplay}
                  </Text>
                </View>
              ) : null}
              <Text className="text-xs font-semibold text-amber-900">
                {typeLabel} · {periodLabel}
              </Text>
            </View>
            <Text className="text-lg font-semibold text-stone-900">{expense.title}</Text>
            {expense.description ? (
              <Text className="text-sm text-stone-600">{expense.description}</Text>
            ) : null}
          </View>
        </View>
        <StatusBadge tone={badge} />
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-stone-600">
          {isCreditor
            ? t('money.paidByYou')
            : t('money.paidBy', { name: expense.payer?.display_name ?? t('common.roommate') })}
        </Text>
        <Text className="text-lg font-bold text-stone-900">
          {noAmount ? '—' : formatEuro(expense.amount)}
        </Text>
      </View>

      {showDate ? (
        <View className="gap-0.5">
          <Text className="text-sm text-stone-600">
            {t('agenda.scheduled')}:{' '}
            {expense.due_at ? formatHistoryDateTime(expense.due_at) : t('common.noDate')}
          </Text>
          <Text className="text-sm text-stone-600">
            {t('expense.completedAt')}{' '}
            {completedAt ? formatHistoryDateTime(completedAt) : '—'}
          </Text>
        </View>
      ) : (
        <Text
          className={`text-sm font-medium ${
            countdown?.isOverdue ? 'text-red-600' : 'text-stone-700'
          }`}>
          {countdown?.label ??
            (expense.due_at ? formatHistoryDateTime(expense.due_at) : t('expense.dueRequired'))}
        </Text>
      )}

      {expense.receipt_image_url ? (
        <Image
          source={{ uri: expense.receipt_image_url }}
          className="h-36 w-full rounded-xl bg-stone-100"
          resizeMode="cover"
        />
      ) : null}

      {debtors.length === 0 ? (
        <Text className="text-xs text-stone-500">{t('money.nobodyOwes')}</Text>
      ) : (
        <View className="gap-2">
          {debtors.map((share) => {
            const name = share.profiles?.display_name ?? t('common.roommate');
            const settled = isShareSettled(share);
            const isDebtor = Boolean(currentUserId && currentUserId === share.user_id);
            const showActions = isOpen && !noAmount && Boolean(currentUserId);

            return (
              <View
                key={share.id}
                className="flex-row items-center justify-between rounded-xl bg-stone-50 px-3 py-2 gap-2">
                <Text className="flex-1 text-sm text-stone-800">
                  {name}
                  {settled ? t('money.paidSuffix') : ` · ${formatEuro(share.share_amount)}`}
                  {isDebtor && !settled ? t('money.yourTurn') : ''}
                </Text>

                {showActions && isCreditor && onSettleShare ? (
                  <Pressable
                    onPress={() => onSettleShare(expense, share, !settled)}
                    disabled={busy}
                    hitSlop={8}>
                    <Text className="text-sm font-semibold text-amber-800">
                      {settled ? t('money.undo') : t('money.settle')}
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
          label={noAmount ? t('money.completeAmount') : t('money.settleAll')}
          loading={busy}
          onPress={() => (noAmount ? onEdit?.(expense) : onSettle(expense))}
        />
      ) : null}

      {onRepeat ? (
        <Button
          label={t('common.repeat')}
          variant="secondary"
          loading={busy}
          onPress={() => onRepeat(expense)}
        />
      ) : null}
    </SafePressable>
  );
}
