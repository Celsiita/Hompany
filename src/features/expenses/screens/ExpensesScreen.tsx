import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  type FlatList as FlatListType,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { BoardSectionBar, type BoardSection } from '@/components/ui/BoardSectionBar';
import { CollapsibleFilterPanel } from '@/components/ui/CollapsibleFilterPanel';
import { MascotEmpty } from '@/components/ui/MascotEmpty';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useHomeItemTypes } from '@/features/home/hooks/useHomeItemTypes';
import { ExpenseCard } from '@/features/expenses/components/ExpenseCard';
import { ExpenseFilterBar } from '@/features/expenses/components/ExpenseFilterBar';
import { ExpenseFormModal } from '@/features/expenses/components/ExpenseFormModal';
import { useHomeExpenses } from '@/features/expenses/hooks/useHomeExpenses';
import { useBoardItemFocus } from '@/hooks/useBoardItemFocus';
import { parseFocusId } from '@/lib/navigation/board-focus';
import { useAuth } from '@/providers/AuthProvider';
import { useConfirmDialog } from '@/providers/ConfirmProvider';
import { formatHistoryDate } from '@/lib/recurrence';
import type { ExpenseWithRelations } from '@/types/database.types';

/**
 * Expenses screen — supermarket, house bills and roommate IOUs.
 */
export function ExpensesScreen() {
  const { user } = useAuth();
  const confirm = useConfirmDialog();
  const router = useRouter();
  const params = useLocalSearchParams<{ focusId?: string | string[] }>();
  const routeFocusId = parseFocusId(params.focusId);
  const listRef = useRef<FlatListType<ExpenseWithRelations>>(null);
  const {
    expenses,
    filteredExpenses,
    filteredSettledExpenses,
    members,
    isLoading,
    error,
    refresh,
    addExpense,
    editExpense,
    removeExpense,
    settleExpense,
    repeatExpense,
    settleShare,
    kindFilter,
    setKindFilter,
    involvementFilter,
    setInvolvementFilter,
    recurrenceFilter,
    setRecurrenceFilter,
    statusFilter,
    setStatusFilter,
    isAdmin,
    activityEvents,
  } = useHomeExpenses();
  const { types: expenseTypes, addType: addExpenseType } = useHomeItemTypes('expense');

  const [section, setSection] = useState<BoardSection>('ACTIVE');
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<ExpenseWithRelations | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'repeat'>('create');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const findExpense = useCallback(
    (id: string) => expenses.find((expense) => expense.id === id),
    [expenses],
  );

  const onFocusExpense = useCallback(
    (expense: ExpenseWithRelations) => {
      setSection(expense.status === 'OPEN' ? 'ACTIVE' : 'HISTORY');
      setKindFilter('ALL');
      setInvolvementFilter('ALL');
      setRecurrenceFilter('ALL');
      setStatusFilter('ALL');
      setFormVisible(false);
      setEditing(null);
      setFormMode('create');
    },
    [setKindFilter, setInvolvementFilter, setRecurrenceFilter, setStatusFilter],
  );

  const clearRouteParam = useCallback(() => {
    router.setParams({ focusId: undefined });
  }, [router]);

  const { highlightedId, requestFocus } = useBoardItemFocus({
    routeFocusId,
    isLoading,
    findItem: findExpense,
    onFocus: onFocusExpense,
    clearRouteParam,
  });

  const isHistory = section === 'HISTORY';
  const listData = isHistory ? filteredSettledExpenses : filteredExpenses;

  useEffect(() => {
    if (!highlightedId) {
      return;
    }
    const index = listData.findIndex((item) => item.id === highlightedId);
    if (index < 0) {
      return;
    }
    const timer = setTimeout(() => {
      listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.15 });
    }, 120);
    return () => clearTimeout(timer);
  }, [highlightedId, listData]);

  async function runAction(id: string, action: () => Promise<void>) {
    setActionError(null);
    setBusyId(id);
    try {
      await action();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo completar la acción');
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete(expense: ExpenseWithRelations) {
    const ok = await confirm({
      title: 'Eliminar gasto',
      message: `¿Borrar «${expense.title}»? El historial de movimientos se conserva.`,
      confirmLabel: 'Eliminar',
    });
    if (!ok) {
      return;
    }
    await runAction(expense.id, () => removeExpense(expense.id));
  }

  const activeFilterCount = [
    involvementFilter !== 'ALL',
    kindFilter !== 'ALL',
    recurrenceFilter !== 'ALL',
    statusFilter !== 'ALL',
  ].filter(Boolean).length;
  const filterHint =
    activeFilterCount > 0
      ? `${activeFilterCount} activo${activeFilterCount === 1 ? '' : 's'}`
      : null;

  const emptyKind =
    isHistory
      ? activeFilterCount > 0
        ? 'expenses_filtered'
        : 'expenses_history'
      : involvementFilter === 'I_OWE'
        ? 'expenses_i_owe'
        : involvementFilter === 'THEY_OWE_ME'
          ? 'expenses_they_owe'
          : activeFilterCount > 0
            ? 'expenses_filtered'
            : 'expenses_open';

  return (
    <Screen>
      <FlatList
        ref={listRef}
        data={listData}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        overScrollMode="never"
        contentInsetAdjustmentBehavior="never"
        onScrollToIndexFailed={({ index }) => {
          setTimeout(() => {
            listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.15 });
          }, 250);
        }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => void refresh()} />
        }
        ListHeaderComponent={
          <View className="gap-4 mb-4 pt-2">
            <ScreenHeader
              title="Gastos"
              subtitle="Súper, casa y ocio"
              helpTitle="Gastos"
              helpMessage="Reparte en partes iguales, por porcentaje o cantidades fijas. Usa Mis deudas / Mis cobros. Saldar cierra la deuda."
              createAccessibilityLabel="Nuevo gasto"
              onCreatePress={() => {
                setEditing(null);
                setFormMode('create');
                setFormVisible(true);
              }}
            />

            <BoardSectionBar
              section={section}
              onSectionChange={setSection}
              activeLabel="En curso"
              accent="amber"
            />

            <CollapsibleFilterPanel activeHint={filterHint}>
              <ExpenseFilterBar
                involvement={involvementFilter}
                onInvolvementChange={setInvolvementFilter}
                kind={kindFilter}
                onKindChange={setKindFilter}
                customTypes={expenseTypes}
                recurrence={recurrenceFilter}
                onRecurrenceChange={setRecurrenceFilter}
                status={statusFilter}
                onStatusChange={setStatusFilter}
                history={isHistory}
              />
            </CollapsibleFilterPanel>

            {error || actionError ? (
              <Text className="text-sm text-red-600">{error ?? actionError}</Text>
            ) : null}

            {isHistory && activityEvents.length > 0 ? (
              <View className="gap-1">
                <Text className="text-sm font-semibold text-gray-500">Movimientos</Text>
                {activityEvents.slice(0, 8).map((event) => (
                  <Text key={event.id} className="text-xs text-gray-600">
                    {formatHistoryDate(event.created_at)} · {event.summary}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color="#2563eb" />
          ) : (
            <MascotEmpty kind={emptyKind} />
          )
        }
        renderItem={({ item }) => (
          <View className="mb-3">
            <ExpenseCard
              expense={item}
              currentUserId={user?.id}
              highlighted={highlightedId === item.id}
              busy={busyId === item.id}
              showDate={isHistory}
              canEdit={isAdmin || item.paid_by === user?.id}
              onEdit={
                isHistory
                  ? undefined
                  : (expense) => {
                      setEditing(expense);
                      setFormMode('edit');
                      setFormVisible(true);
                    }
              }
              onSettle={
                isHistory
                  ? undefined
                  : (expense) => void runAction(expense.id, () => settleExpense(expense.id))
              }
              onSettleShare={
                isHistory
                  ? undefined
                  : (expense, share, isSettled) =>
                      void runAction(expense.id, () =>
                        settleShare(expense.id, share.id, isSettled),
                      )
              }
              onRepeat={
                isHistory
                  ? (expense) => {
                      setEditing(expense);
                      setFormMode('repeat');
                      setFormVisible(true);
                    }
                  : undefined
              }
            />
          </View>
        )}
        contentContainerClassName="pb-8"
      />

      <ExpenseFormModal
        visible={formVisible}
        members={members}
        currentUserId={user?.id}
        customTypes={expenseTypes}
        onCreateType={addExpenseType}
        initialExpense={editing}
        mode={formMode}
        onClose={() => {
          setFormVisible(false);
          setEditing(null);
          setFormMode('create');
        }}
        onDelete={
          formMode === 'edit' && editing && isAdmin
            ? async () => {
                await confirmDelete(editing);
                setFormVisible(false);
              }
            : undefined
        }
        onSubmit={async (input) => {
          if (formMode === 'edit' && editing) {
            await editExpense(editing.id, input);
            return;
          }
          if (formMode === 'repeat' && editing) {
            await repeatExpense(editing, input);
            return;
          }
          const created = await addExpense(input);
          requestFocus(created.id);
        }}
      />
    </Screen>
  );
}
