import { useCallback, useEffect, useRef, useState } from 'react';

import {
  createExamPeriod,
  deleteExamPeriod,
  listExamPeriodsByHome,
  updateExamPeriod,
} from '@/features/home/api/exam-periods-api';
import { examPeriodsBoardSync } from '@/lib/board-sync';
import { useHome } from '@/providers/HomeProvider';
import type { MemberExamPeriod, UpsertExamPeriodInput } from '@/schemas/exam-period.schema';

type UseHomeExamPeriodsResult = {
  examPeriods: MemberExamPeriod[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addExamPeriod: (input: Omit<UpsertExamPeriodInput, 'home_id'>) => Promise<MemberExamPeriod>;
  editExamPeriod: (
    periodId: string,
    input: Omit<UpsertExamPeriodInput, 'home_id'>,
  ) => Promise<MemberExamPeriod>;
  removeExamPeriod: (periodId: string) => Promise<void>;
};

/**
 * Home-scoped exam periods with cross-tab sync.
 */
export function useHomeExamPeriods(): UseHomeExamPeriodsResult {
  const { activeHomeId } = useHome();
  const [examPeriods, setExamPeriods] = useState<MemberExamPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const instanceId = useRef(Symbol('useHomeExamPeriods'));

  const load = useCallback(async () => {
    if (!activeHomeId) {
      setExamPeriods([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const rows = await listExamPeriodsByHome(activeHomeId);
      setExamPeriods(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los periodos de exámenes');
    } finally {
      setIsLoading(false);
    }
  }, [activeHomeId]);

  const refresh = useCallback(async () => {
    await load();
    examPeriodsBoardSync.notify(instanceId.current);
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    return examPeriodsBoardSync.subscribe((sourceId) => {
      if (sourceId === instanceId.current) {
        return;
      }
      void load();
    });
  }, [load]);

  const addExamPeriod = useCallback(
    async (input: Omit<UpsertExamPeriodInput, 'home_id'>) => {
      if (!activeHomeId) {
        throw new Error('home_id is required');
      }
      const created = await createExamPeriod({ ...input, home_id: activeHomeId });
      await refresh();
      return created;
    },
    [activeHomeId, refresh],
  );

  const editExamPeriod = useCallback(
    async (periodId: string, input: Omit<UpsertExamPeriodInput, 'home_id'>) => {
      if (!activeHomeId) {
        throw new Error('home_id is required');
      }
      const updated = await updateExamPeriod(periodId, { ...input, home_id: activeHomeId });
      await refresh();
      return updated;
    },
    [activeHomeId, refresh],
  );

  const removeExamPeriod = useCallback(
    async (periodId: string) => {
      if (!activeHomeId) {
        throw new Error('home_id is required');
      }
      await deleteExamPeriod(activeHomeId, periodId);
      await refresh();
    },
    [activeHomeId, refresh],
  );

  return {
    examPeriods,
    isLoading,
    error,
    refresh,
    addExamPeriod,
    editExamPeriod,
    removeExamPeriod,
  };
}
