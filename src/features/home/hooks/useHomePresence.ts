import { useCallback, useEffect, useState } from 'react';

import {
  addPresenceMonth,
  addPresencePeriod,
  createSystemLeave,
  deleteSystemLeave,
  listPresencePeriodsByHome,
  listSystemLeavesByHome,
  removePresenceMonth,
  removePresencePeriod,
} from '@/features/home/api/presence-api';
import { useAuth } from '@/providers/AuthProvider';
import { useHome } from '@/providers/HomeProvider';
import type {
  MemberPresencePeriod,
  MemberSystemLeave,
  UpsertSystemLeaveInput,
} from '@/schemas/presence.schema';

type UseHomePresenceResult = {
  presencePeriods: MemberPresencePeriod[];
  systemLeaves: MemberSystemLeave[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  togglePresenceMonth: (yearMonth: string, enabled: boolean) => Promise<void>;
  addPresenceRange: (startDate: string, endDate: string) => Promise<void>;
  removePresenceRange: (periodId: string) => Promise<void>;
  addSystemLeave: (input: Omit<UpsertSystemLeaveInput, 'home_id'>) => Promise<void>;
  removeSystemLeave: (leaveId: string) => Promise<void>;
};

/**
 * Stay periods + system leaves for the active home.
 */
export function useHomePresence(): UseHomePresenceResult {
  const { user } = useAuth();
  const { activeHomeId } = useHome();
  const [presencePeriods, setPresencePeriods] = useState<MemberPresencePeriod[]>([]);
  const [systemLeaves, setSystemLeaves] = useState<MemberSystemLeave[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!activeHomeId) {
      setPresencePeriods([]);
      setSystemLeaves([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [periods, leaves] = await Promise.all([
        listPresencePeriodsByHome(activeHomeId),
        listSystemLeavesByHome(activeHomeId),
      ]);
      setPresencePeriods(periods);
      setSystemLeaves(leaves);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la estancia');
    } finally {
      setIsLoading(false);
    }
  }, [activeHomeId]);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  const togglePresenceMonth = useCallback(
    async (yearMonth: string, enabled: boolean) => {
      if (!activeHomeId || !user) {
        throw new Error('home_id is required');
      }
      if (enabled) {
        await addPresenceMonth({ homeId: activeHomeId, yearMonth });
      } else {
        await removePresenceMonth({
          homeId: activeHomeId,
          yearMonth,
          userId: user.id,
        });
      }
      await refresh();
    },
    [activeHomeId, refresh, user],
  );

  const addPresenceRange = useCallback(
    async (startDate: string, endDate: string) => {
      if (!activeHomeId) {
        throw new Error('home_id is required');
      }
      await addPresencePeriod({ homeId: activeHomeId, startDate, endDate });
      await refresh();
    },
    [activeHomeId, refresh],
  );

  const removePresenceRange = useCallback(
    async (periodId: string) => {
      if (!activeHomeId) {
        throw new Error('home_id is required');
      }
      await removePresencePeriod({ homeId: activeHomeId, periodId });
      await refresh();
    },
    [activeHomeId, refresh],
  );

  const addSystemLeave = useCallback(
    async (input: Omit<UpsertSystemLeaveInput, 'home_id'>) => {
      if (!activeHomeId) {
        throw new Error('home_id is required');
      }
      await createSystemLeave({ ...input, home_id: activeHomeId });
      await refresh();
    },
    [activeHomeId, refresh],
  );

  const removeSystemLeave = useCallback(
    async (leaveId: string) => {
      if (!activeHomeId) {
        throw new Error('home_id is required');
      }
      await deleteSystemLeave(activeHomeId, leaveId);
      await refresh();
    },
    [activeHomeId, refresh],
  );

  return {
    presencePeriods,
    systemLeaves,
    isLoading,
    error,
    refresh,
    togglePresenceMonth,
    addPresenceRange,
    removePresenceRange,
    addSystemLeave,
    removeSystemLeave,
  };
}
