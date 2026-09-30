import { useCallback, useEffect, useRef, useState } from 'react';

import {
  createAbsence,
  deleteAbsence,
  listAbsencesByHome,
  updateAbsence,
} from '@/features/home/api/absences-api';
import { absencesBoardSync } from '@/lib/board-sync';
import { useHome } from '@/providers/HomeProvider';
import type { MemberAbsence, UpsertAbsenceInput } from '@/schemas/absence.schema';

type UseHomeAbsencesResult = {
  absences: MemberAbsence[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addAbsence: (input: Omit<UpsertAbsenceInput, 'home_id'>) => Promise<MemberAbsence>;
  editAbsence: (
    absenceId: string,
    input: Omit<UpsertAbsenceInput, 'home_id'>,
  ) => Promise<MemberAbsence>;
  removeAbsence: (absenceId: string) => Promise<void>;
};

/**
 * Home-scoped absences with cross-tab sync (agenda + task rotation).
 */
export function useHomeAbsences(): UseHomeAbsencesResult {
  const { activeHomeId } = useHome();
  const [absences, setAbsences] = useState<MemberAbsence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const instanceId = useRef(Symbol('useHomeAbsences'));
  const absencesRef = useRef(absences);
  absencesRef.current = absences;

  const load = useCallback(async () => {
    if (!activeHomeId) {
      setAbsences([]);
      setIsLoading(false);
      return;
    }

    if (absencesRef.current.length === 0) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const rows = await listAbsencesByHome(activeHomeId);
      setAbsences(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las ausencias');
    } finally {
      setIsLoading(false);
    }
  }, [activeHomeId]);

  const refresh = useCallback(async () => {
    await load();
    absencesBoardSync.notify(instanceId.current);
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    return absencesBoardSync.subscribe((sourceId) => {
      if (sourceId === instanceId.current) {
        return;
      }
      void load();
    });
  }, [load]);

  const addAbsence = useCallback(
    async (input: Omit<UpsertAbsenceInput, 'home_id'>) => {
      if (!activeHomeId) {
        throw new Error('home_id is required');
      }
      const created = await createAbsence({ ...input, home_id: activeHomeId });
      await refresh();
      return created;
    },
    [activeHomeId, refresh],
  );

  const editAbsence = useCallback(
    async (absenceId: string, input: Omit<UpsertAbsenceInput, 'home_id'>) => {
      if (!activeHomeId) {
        throw new Error('home_id is required');
      }
      const updated = await updateAbsence(absenceId, { ...input, home_id: activeHomeId });
      await refresh();
      return updated;
    },
    [activeHomeId, refresh],
  );

  const removeAbsence = useCallback(
    async (absenceId: string) => {
      if (!activeHomeId) {
        throw new Error('home_id is required');
      }
      await deleteAbsence(activeHomeId, absenceId);
      await refresh();
    },
    [activeHomeId, refresh],
  );

  return {
    absences,
    isLoading,
    error,
    refresh,
    addAbsence,
    editAbsence,
    removeAbsence,
  };
}
