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
import { OverflowMenu } from '@/components/ui/OverflowMenu';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ExpenseCard } from '@/features/expenses/components/ExpenseCard';
import { ExpenseFilterBar } from '@/features/expenses/components/ExpenseFilterBar';
import { ExpenseFormModal } from '@/features/expenses/components/ExpenseFormModal';
import { useHomeExpenses } from '@/features/expenses/hooks/useHomeExpenses';
import { useBoardItemFocus } from '@/hooks/useBoardItemFocus';
import { parseFocusId } from '@/lib/navigation/board-focus';
import { useAuth } from '@/providers/AuthProvider';
import { useConfirmDialog } from '@/providers/ConfirmProvider';
import { useHome } from '@/providers/HomeProvider';
import { formatHistoryDate } from '@/lib/recurrence';
import type { ExpenseWithRelations } from '@/types/database.types';

/**
 * Expenses screen — supermarket, house bills and roommate IOUs.
 */
export function ExpensesScreen() {
  const { user } = useAuth();
  const { activeHome } = useHome();
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
    reopenExpense,
    repeatExpense,
    settleShare,
    kindFilter,
    setKindFilter,
    involvementFilter,
    setInvolvementFilter,
    recurrenceFilter,
    setRecurrenceFilter,
    isAdmin,
    activityEvents,
  } = useHomeExpenses();

  const [section, setSection] = useState<BoardSection>('ACTIVE');
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<ExpenseWithRelations | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'repeat'>('create');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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
      setFormVisible(false);
      setEditing(null);
      setFormMode('create');
    },
    [setKindFilter, setInvolvementFilter, setRecurrenceFilter],
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

  const emptyHint = isHistory
    ? 'Aún no hay gastos en el historial.'
    : involvementFilter === 'I_OWE'
      ? 'No debes nada ahora mismo.'
      : involvementFilter === 'THEY_OWE_ME'
        ? 'Nadie te debe nada ahora mismo.'
        : 'No hay gastos abiertos.';

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
              subtitle={`${activeHome?.name ?? 'Piso'} · súper, casa y ocio`}
              onMenuPress={() => setMenuOpen(true)}
            />

            <BoardSectionBar
              section={section}
              onSectionChange={setSection}
              activeLabel="En curso"
            />

            <ExpenseFilterBar
              involvement={involvementFilter}
              onInvolvementChange={setInvolvementFilter}
              kind={kindFilter}
              onKindChange={setKindFilter}
              recurrence={recurrenceFilter}
              onRecurrenceChange={setRecurrenceFilter}
            />

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
            <Text className="text-center text-gray-500 py-8">{emptyHint}</Text>
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
              onReopen={
                isHistory
                  ? (expense) => void runAction(expense.id, () => reopenExpense(expense.id))
                  : undefined
              }
            />
          </View>
        )}
        contentContainerClassName="pb-8"
      />

      <OverflowMenu
        visible={menuOpen}
        title="Gastos"
        onClose={() => setMenuOpen(false)}
        actions={[
          {
            key: 'create',
            label: 'Nuevo gasto',
            onPress: () => {
              setEditing(null);
              setFormMode('create');
              setFormVisible(true);
            },
          },
          {
            key: 'paused',
            label: 'Ver pausados y archivados',
            onPress: () => setSection('HISTORY'),
          },
        ]}
      />

      <ExpenseFormModal
        visible={formVisible}
        members={members}
        currentUserId={user?.id}
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
