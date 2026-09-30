import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  type FlatList as FlatListType,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { BoardSectionBar, type BoardSection } from '@/components/ui/BoardSectionBar';
import { Button } from '@/components/ui/Button';
import { CollapsibleFilterPanel } from '@/components/ui/CollapsibleFilterPanel';
import { MascotEmpty } from '@/components/ui/MascotEmpty';
import { MascotLoading } from '@/components/ui/MascotLoading';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import {
  SCROLL_TO_TOP_THRESHOLD,
  ScrollToTopButton,
} from '@/components/ui/ScrollToTopButton';
import { useHomeItemTypes } from '@/features/home/hooks/useHomeItemTypes';
import { ExpenseCard } from '@/features/expenses/components/ExpenseCard';
import { ExpenseFilterBar } from '@/features/expenses/components/ExpenseFilterBar';
import { ExpenseFormModal } from '@/features/expenses/components/ExpenseFormModal';
import { useHomeExpenses } from '@/features/expenses/hooks/useHomeExpenses';
import { useBoardItemFocus } from '@/hooks/useBoardItemFocus';
import { parseFocusId } from '@/lib/navigation/board-focus';
import { useAuth } from '@/providers/AuthProvider';
import { useConfirmDialog } from '@/providers/ConfirmProvider';
import { useLocale } from '@/providers/LocaleProvider';
import { useToast } from '@/providers/ToastProvider';
import { formatHistoryDate } from '@/lib/recurrence';
import type { ExpenseWithRelations } from '@/types/database.types';

/**
 * Expenses screen — supermarket, house bills and roommate IOUs.
 */
export function ExpensesScreen() {
  const { user } = useAuth();
  const { t } = useLocale();
  const confirm = useConfirmDialog();
  const showToast = useToast();
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
  const [boardRefreshing, setBoardRefreshing] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

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

  async function runAction(id: string, action: () => Promise<void>, successMessage?: string) {
    setBusyId(id);
    try {
      await action();
      if (successMessage) {
        showToast({ message: successMessage, tone: 'success' });
      }
    } catch (err) {
      showToast({
        message: err instanceof Error ? err.message : 'No se pudo completar la acción',
        tone: 'error',
      });
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
    await runAction(expense.id, () => removeExpense(expense.id), 'Gasto eliminado');
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
      <Animated.View entering={FadeIn.duration(240)} className="flex-1">
      <FlatList
        ref={listRef}
        data={listData}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        bounces
        overScrollMode="auto"
        contentInsetAdjustmentBehavior="never"
        scrollEventThrottle={16}
        onScroll={(event) => {
          setShowScrollTop(event.nativeEvent.contentOffset.y > SCROLL_TO_TOP_THRESHOLD);
        }}
        onScrollToIndexFailed={({ index }) => {
          setTimeout(() => {
            listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.15 });
          }, 250);
        }}
        refreshControl={
          <RefreshControl
            refreshing={boardRefreshing}
            tintColor="#0f766e"
            colors={['#0f766e']}
            onRefresh={() => {
              void (async () => {
                setBoardRefreshing(true);
                try {
                  await refresh();
                } finally {
                  setBoardRefreshing(false);
                }
              })();
            }}
          />
        }
        ListHeaderComponent={
          <View className="gap-4 mb-4 pt-2">
            <ScreenHeader
              title={t('tabs.expenses')}
              subtitle={t('screen.expenses')}
              helpTitle={t('tabs.expenses')}
              helpMessage="Reparte a partes iguales, por % o cantidades fijas. Chips Debes / Tú pagaste. Mis deudas / Mis cobros. Saldar cierra la deuda."
              createAccent="amber"
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
              activeLabel={`En curso (${filteredExpenses.length})`}
              historyLabel={`Historial (${filteredSettledExpenses.length})`}
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

            {error ? (
              <View className="gap-2 rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                <Text className="text-sm font-semibold text-amber-950">No se pudo cargar el tablero</Text>
                <Text className="text-sm leading-5 text-amber-900/80">{error}</Text>
                <Button label="Reintentar" variant="secondary" onPress={() => void refresh()} />
              </View>
            ) : null}

            {isHistory && activityEvents.length > 0 ? (
              <View className="gap-1">
                <Text className="text-sm font-semibold text-stone-500">Movimientos</Text>
                {activityEvents.slice(0, 8).map((event) => (
                  <Text key={event.id} className="text-xs text-stone-600">
                    {formatHistoryDate(event.created_at)} · {event.summary}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <MascotLoading />
          ) : (
            <MascotEmpty kind={emptyKind} />
          )
        }
        renderItem={({ item }) => (
          <View className="mb-3">
            <ExpenseCard
              expense={item}
              itemTypes={expenseTypes}
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
                  : (expense) =>
                      void runAction(expense.id, () => settleExpense(expense.id), 'Gasto saldado')
              }
              onSettleShare={
                isHistory
                  ? undefined
                  : (expense, share, isSettled) =>
                      void runAction(
                        expense.id,
                        () => settleShare(expense.id, share.id, isSettled),
                        isSettled ? 'Cobro deshecho' : 'Parte saldada',
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
      <ScrollToTopButton
        visible={showScrollTop}
        onPress={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })}
      />
      </Animated.View>

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
            showToast({ message: 'Gasto actualizado', tone: 'success' });
            return;
          }
          if (formMode === 'repeat' && editing) {
            await repeatExpense(editing, input);
            showToast({ message: 'Gasto repetido', tone: 'success' });
            return;
          }
          const created = await addExpense(input);
          requestFocus(created.id);
          showToast({ message: 'Gasto creado', tone: 'success' });
        }}
      />
    </Screen>
  );
}
