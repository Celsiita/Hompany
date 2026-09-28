import { useCallback, useEffect, useState } from 'react';

import {
  addShoppingListItem,
  createShoppingList,
  deleteShoppingListItem,
  ensureShoppingListExpense,
  listShoppingListsByHome,
  setShoppingItemNeeded,
  setShoppingListMembers,
  updateShoppingListRotation,
} from '@/features/expenses/api/shopping-lists-api';
import { useAuth } from '@/providers/AuthProvider';
import { useHome } from '@/providers/HomeProvider';
import type { ShoppingListWithItems } from '@/schemas/shopping-list.schema';

type UseHomeShoppingListsResult = {
  lists: ShoppingListWithItems[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addList: (input: { name: string; memberIds: string[]; amount?: number }) => Promise<void>;
  addItem: (listId: string, title: string) => Promise<void>;
  toggleNeeded: (itemId: string, needed: boolean) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  setRotation: (listId: string, enabled: boolean, buyerUserId?: string | null) => Promise<void>;
  setMembers: (listId: string, memberIds: string[]) => Promise<void>;
  ensureExpense: (listId: string, amount?: number) => Promise<string>;
};

/**
 * Shopping / shared supply lists for the active home.
 */
export function useHomeShoppingLists(): UseHomeShoppingListsResult {
  const { user } = useAuth();
  const { activeHomeId } = useHome();
  const [lists, setLists] = useState<ShoppingListWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!activeHomeId) {
      setLists([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      setLists(await listShoppingListsByHome(activeHomeId, user?.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las listas');
    } finally {
      setIsLoading(false);
    }
  }, [activeHomeId, user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addList = useCallback(
    async (input: { name: string; memberIds: string[]; amount?: number }) => {
      if (!activeHomeId || !user?.id) {
        return;
      }
      await createShoppingList({
        homeId: activeHomeId,
        name: input.name,
        memberIds: input.memberIds,
        paidBy: user.id,
        amount: input.amount,
        createdBy: user.id,
      });
      await refresh();
    },
    [activeHomeId, refresh, user?.id],
  );

  const addItem = useCallback(
    async (listId: string, title: string) => {
      if (!activeHomeId) {
        return;
      }
      await addShoppingListItem({
        homeId: activeHomeId,
        listId,
        title,
        createdBy: user?.id,
      });
      await refresh();
    },
    [activeHomeId, refresh, user?.id],
  );

  const toggleNeeded = useCallback(
    async (itemId: string, needed: boolean) => {
      if (!activeHomeId) {
        return;
      }
      await setShoppingItemNeeded({ homeId: activeHomeId, itemId, needed });
      await refresh();
    },
    [activeHomeId, refresh],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      if (!activeHomeId) {
        return;
      }
      await deleteShoppingListItem({ homeId: activeHomeId, itemId });
      await refresh();
    },
    [activeHomeId, refresh],
  );

  const setRotation = useCallback(
    async (listId: string, enabled: boolean, buyerUserId?: string | null) => {
      if (!activeHomeId) {
        return;
      }
      await updateShoppingListRotation({
        homeId: activeHomeId,
        listId,
        rotationEnabled: enabled,
        currentBuyerUserId: buyerUserId,
      });
      await refresh();
    },
    [activeHomeId, refresh],
  );

  const setMembers = useCallback(
    async (listId: string, memberIds: string[]) => {
      if (!activeHomeId) {
        return;
      }
      await setShoppingListMembers({ homeId: activeHomeId, listId, memberIds });
      await refresh();
    },
    [activeHomeId, refresh],
  );

  const ensureExpense = useCallback(
    async (listId: string, amount?: number) => {
      if (!activeHomeId || !user?.id) {
        throw new Error('Necesitas un piso activo e iniciar sesión');
      }
      let list = lists.find((row) => row.id === listId);
      if (!list) {
        const fresh = await listShoppingListsByHome(activeHomeId, user.id);
        list = fresh.find((row) => row.id === listId);
      }
      if (!list) {
        throw new Error('No se encontró la lista');
      }
      if (list.expense_id) {
        return list.expense_id;
      }
      const updated = await ensureShoppingListExpense({
        homeId: activeHomeId,
        list,
        paidBy: user.id,
        amount,
      });
      await refresh();
      if (!updated.expense_id) {
        throw new Error('El gasto se creó pero no quedó vinculado a la lista');
      }
      return updated.expense_id;
    },
    [activeHomeId, lists, refresh, user?.id],
  );

  return {
    lists,
    isLoading,
    error,
    refresh,
    addList,
    addItem,
    toggleNeeded,
    removeItem,
    setRotation,
    setMembers,
    ensureExpense,
  };
}
