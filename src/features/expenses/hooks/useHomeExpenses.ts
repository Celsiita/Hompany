import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  cancelExpenseOccurrence,
  createExpense,
  deleteExpense,
  listExpensesByHome,
  patchExpenseReceipt,
  reassignExpenseOccurrence,
  setExpenseShareSettled,
  setExpenseStatus,
  settleAllExpenseShares,
  updateExpense,
} from '@/features/expenses/api/expenses-api';
import {
  pickCompressedProofImage,
  uploadExpenseReceipt,
} from '@/features/expenses/api/receipt-upload';
import { summarizeExpenseBalances } from '@/features/expenses/lib/expense-balances';
import {
  applyExpenseBoardFilters,
  filterExpensesByBoardStatus,
  filterExpensesByInvolvement,
  filterExpensesByKind,
  filterExpensesByRecurrence,
  isExpensePaused,
  isUserInvolvedInExpense,
  sortHistoryBoardExpenses,
  sortOpenBoardExpenses,
} from '@/features/expenses/lib/expense-filters';
import { listHomeActivity, logHomeActivity } from '@/features/home/api/activity-api';
import { listHomeMembers, type HomeMemberWithProfile } from '@/features/home/api/homes-api';
import { expensesBoardSync } from '@/lib/board-sync';
import { parseRecurrenceConfig } from '@/lib/recurrence';
import { isHomeAdminRole } from '@/lib/roles';
import type { RecurrenceFilter } from '@/components/ui/RecurrenceFilterChips';
import type { ExpenseBoardStatusFilter } from '@/components/ui/StatusFilterChips';
import { useAuth } from '@/providers/AuthProvider';
import { useHome } from '@/providers/HomeProvider';
import type {
  ExpenseInvolvementFilter,
  ExpenseKindFilter,
  UpsertExpenseInput,
} from '@/schemas/expense.schema';
import type { ExpenseWithRelations } from '@/types/database.types';

export type ExpenseFormSubmitInput = Omit<UpsertExpenseInput, 'home_id'> & {
  receiptLocalUri?: string | null;
};

type UseHomeExpensesResult = {
  expenses: ExpenseWithRelations[];
  filteredExpenses: ExpenseWithRelations[];
  filteredSettledExpenses: ExpenseWithRelations[];
  settledExpenses: ExpenseWithRelations[];
  members: HomeMemberWithProfile[];
  balances: ReturnType<typeof summarizeExpenseBalances>;
  kindFilter: ExpenseKindFilter;
  setKindFilter: (value: ExpenseKindFilter) => void;
  involvementFilter: ExpenseInvolvementFilter;
  setInvolvementFilter: (value: ExpenseInvolvementFilter) => void;
  recurrenceFilter: RecurrenceFilter;
  setRecurrenceFilter: (value: RecurrenceFilter) => void;
  statusFilter: ExpenseBoardStatusFilter;
  setStatusFilter: (value: ExpenseBoardStatusFilter) => void;
  isAdmin: boolean;
  activityEvents: import('@/types/database.types').HomeActivityEventWithActor[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addExpense: (input: ExpenseFormSubmitInput) => Promise<ExpenseWithRelations>;
  editExpense: (expenseId: string, input: ExpenseFormSubmitInput) => Promise<ExpenseWithRelations>;
  removeExpense: (expenseId: string) => Promise<void>;
  settleExpense: (expenseId: string) => Promise<void>;
  reopenExpense: (expenseId: string) => Promise<void>;
  repeatExpense: (expense: ExpenseWithRelations, input: ExpenseFormSubmitInput) => Promise<void>;
  /** Creditor: Saldar / Deshacer per share. */
  settleShare: (expenseId: string, shareId: string, isSettled: boolean) => Promise<void>;
  cancelOccurrence: (expenseId: string, scheduledDueAt?: string) => Promise<void>;
  reassignOccurrence: (
    expenseId: string,
    payerId: string,
    scheduledDueAt?: string,
  ) => Promise<void>;
};

/**
 * Loads and mutates expenses for the active home.
 */
export function useHomeExpenses(): UseHomeExpensesResult {
  const { user } = useAuth();
  const { activeHomeId } = useHome();
  const [expenses, setExpenses] = useState<ExpenseWithRelations[]>([]);
  const [members, setMembers] = useState<HomeMemberWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kindFilter, setKindFilter] = useState<ExpenseKindFilter>('ALL');
  const [involvementFilter, setInvolvementFilter] =
    useState<ExpenseInvolvementFilter>('ALL');
  const [recurrenceFilter, setRecurrenceFilter] = useState<RecurrenceFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<ExpenseBoardStatusFilter>('ALL');
  const [activityEvents, setActivityEvents] = useState<
    import('@/types/database.types').HomeActivityEventWithActor[]
  >([]);
  const instanceId = useRef(Symbol('useHomeExpenses'));

  const load = useCallback(async () => {
    if (!activeHomeId) {
      setExpenses([]);
      setMembers([]);
      setActivityEvents([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [nextExpenses, nextMembers, nextActivity] = await Promise.all([
        listExpensesByHome(activeHomeId),
        listHomeMembers(activeHomeId),
        listHomeActivity(activeHomeId),
      ]);
      setExpenses(nextExpenses);
      setMembers(nextMembers);
      setActivityEvents(
        nextActivity.filter((event) => event.entity_type === 'expense' || event.action.startsWith('ADMIN_')),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los gastos');
    } finally {
      setIsLoading(false);
    }
  }, [activeHomeId]);

  /** Reloads this screen and notifies other tab instances (agenda, etc.). */
  const refresh = useCallback(async () => {
    await load();
    expensesBoardSync.notify(instanceId.current);
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    return expensesBoardSync.subscribe((sourceId) => {
      if (sourceId === instanceId.current) {
        return;
      }
      void load();
    });
  }, [load]);

  const isAdmin = members.some(
    (member) => member.user_id === user?.id && isHomeAdminRole(member.role),
  );

  const attachReceipt = useCallback(
    async (expenseId: string, localUri: string) => {
      if (!activeHomeId || !user) {
        return;
      }
      const url = await uploadExpenseReceipt({
        homeId: activeHomeId,
        expenseId,
        userId: user.id,
        localUri,
      });
      await patchExpenseReceipt({
        homeId: activeHomeId,
        expenseId,
        receiptImageUrl: url,
      });
    },
    [activeHomeId, user],
  );

  const addExpense = useCallback(
    async (input: ExpenseFormSubmitInput) => {
      if (!activeHomeId) {
        throw new Error('home_id is required');
      }
      const { receiptLocalUri, ...payload } = input;
      const created = await createExpense({ ...payload, home_id: activeHomeId });
      if (receiptLocalUri) {
        await attachReceipt(created.id, receiptLocalUri);
      }
      await refresh();
      return created;
    },
    [activeHomeId, attachReceipt, refresh],
  );

  const editExpense = useCallback(
    async (expenseId: string, input: ExpenseFormSubmitInput) => {
      if (!activeHomeId) {
        throw new Error('home_id is required');
      }
      const { receiptLocalUri, ...payload } = input;
      const current = expenses.find((item) => item.id === expenseId);
      const ownsExpense = Boolean(
        current &&
          (current.paid_by === user?.id ||
            current.expense_shares.some((share) => share.user_id === user?.id)),
      );
      const updated = await updateExpense(expenseId, { ...payload, home_id: activeHomeId });
      if (receiptLocalUri) {
        await attachReceipt(expenseId, receiptLocalUri);
      }
      if (isAdmin && user && !ownsExpense) {
        await logHomeActivity({
          homeId: activeHomeId,
          actorId: user.id,
          action: 'ADMIN_EDIT_EXPENSE',
          entityType: 'expense',
          entityId: expenseId,
          summary: `Editó el gasto «${payload.title}»`,
        });
      }
      if (
        isAdmin &&
        user &&
        payload.recurrence_config?.is_paused &&
        !parseRecurrenceConfig(current?.recurrence_config).is_paused
      ) {
        await logHomeActivity({
          homeId: activeHomeId,
          actorId: user.id,
          action: 'ADMIN_PAUSE_RECURRENCE',
          entityType: 'recurrence',
          entityId: expenseId,
          summary: `Pausó la recurrencia de «${payload.title}»`,
        });
      }
      await refresh();
      return updated;
    },
    [activeHomeId, attachReceipt, expenses, isAdmin, refresh, user],
  );

  const removeExpense = useCallback(
    async (expenseId: string) => {
      if (!activeHomeId) {
        throw new Error('home_id is required');
      }
      const current = expenses.find((item) => item.id === expenseId);
      await deleteExpense(activeHomeId, expenseId);
      if (isAdmin && user && current) {
        await logHomeActivity({
          homeId: activeHomeId,
          actorId: user.id,
          action: 'ADMIN_DELETE_EXPENSE',
          entityType: 'expense',
          entityId: expenseId,
          summary: `Eliminó el gasto «${current.title}»`,
        });
      }
      await refresh();
    },
    [activeHomeId, expenses, isAdmin, refresh, user],
  );

  const settleExpense = useCallback(
    async (expenseId: string) => {
      if (!activeHomeId || !user) {
        throw new Error('home_id is required');
      }
      await settleAllExpenseShares({
        homeId: activeHomeId,
        expenseId,
        actorId: user.id,
      });
      await refresh();
    },
    [activeHomeId, refresh, user],
  );

  const reopenExpense = useCallback(
    async (expenseId: string) => {
      if (!activeHomeId || !user) {
        throw new Error('home_id is required');
      }
      const current = expenses.find((item) => item.id === expenseId);
      await setExpenseStatus({ homeId: activeHomeId, expenseId, status: 'OPEN' });
      await logHomeActivity({
        homeId: activeHomeId,
        actorId: user.id,
        action: 'EXPENSE_REOPEN',
        entityType: 'expense',
        entityId: expenseId,
        summary: `Reabrió «${current?.title ?? 'un gasto'}»`,
      });
      await refresh();
    },
    [activeHomeId, expenses, refresh, user],
  );

  const repeatExpense = useCallback(
    async (_expense: ExpenseWithRelations, input: ExpenseFormSubmitInput) => {
      if (!activeHomeId || !user) {
        throw new Error('home_id is required');
      }
      await addExpense(input);
    },
    [activeHomeId, addExpense, user],
  );

  const settleShare = useCallback(
    async (expenseId: string, shareId: string, isSettled: boolean) => {
      if (!activeHomeId || !user) {
        throw new Error('home_id is required');
      }
      await setExpenseShareSettled({
        homeId: activeHomeId,
        expenseId,
        shareId,
        isSettled,
        actorId: user.id,
      });
      await refresh();
    },
    [activeHomeId, refresh, user],
  );

  const cancelOccurrence = useCallback(
    async (expenseId: string, scheduledDueAt?: string) => {
      if (!activeHomeId || !user) {
        throw new Error('home_id is required');
      }
      await cancelExpenseOccurrence({
        homeId: activeHomeId,
        expenseId,
        actorId: user.id,
        scheduledDueAt,
      });
      await refresh();
    },
    [activeHomeId, refresh, user],
  );

  const reassignOccurrence = useCallback(
    async (expenseId: string, payerId: string, scheduledDueAt?: string) => {
      if (!activeHomeId || !user) {
        throw new Error('home_id is required');
      }
      await reassignExpenseOccurrence({
        homeId: activeHomeId,
        expenseId,
        actorId: user.id,
        payerId,
        scheduledDueAt,
      });
      await refresh();
    },
    [activeHomeId, refresh, user],
  );

  const filteredExpenses = useMemo(
    () =>
      sortOpenBoardExpenses(
        applyExpenseBoardFilters({
          expenses,
          kind: kindFilter,
          status: 'OPEN',
          boardStatus: statusFilter,
          involvement: involvementFilter,
          userId: user?.id,
          recurrence: recurrenceFilter,
        }),
      ),
    [expenses, kindFilter, statusFilter, involvementFilter, recurrenceFilter, user?.id],
  );

  const settledExpenses = useMemo(
    () =>
      expenses.filter(
        (expense) =>
          (expense.status === 'SETTLED' || expense.status === 'SKIPPED') &&
          isUserInvolvedInExpense(expense, user?.id),
      ),
    [expenses, user?.id],
  );

  const filteredSettledExpenses = useMemo(() => {
    const historyPool = expenses.filter(
      (expense) => expense.status === 'SETTLED' || expense.status === 'SKIPPED',
    );
    return sortHistoryBoardExpenses(
      filterExpensesByBoardStatus(
        filterExpensesByRecurrence(
          filterExpensesByKind(
            filterExpensesByInvolvement(historyPool, involvementFilter, user?.id),
            kindFilter,
          ),
          recurrenceFilter,
        ),
        statusFilter,
      ),
    );
  }, [expenses, kindFilter, statusFilter, involvementFilter, recurrenceFilter, user?.id]);

  const balances = useMemo(
    () => summarizeExpenseBalances(expenses, user?.id),
    [expenses, user?.id],
  );

  return {
    expenses,
    filteredExpenses,
    filteredSettledExpenses,
    settledExpenses,
    members,
    balances,
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
    cancelOccurrence,
    reassignOccurrence,
  };
}
