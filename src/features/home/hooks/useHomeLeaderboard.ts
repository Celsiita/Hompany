import { useCallback, useEffect, useState } from 'react';

import { listHomeLeaderboard } from '@/features/home/api/leaderboard-api';
import type { HomeLeaderboardRow } from '@/features/home/lib/leaderboard';
import { useHome } from '@/providers/HomeProvider';

type UseHomeLeaderboardResult = {
  rows: HomeLeaderboardRow[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

/**
 * Fetches the active-home leaderboard for the Pulso ranking card.
 */
export function useHomeLeaderboard(): UseHomeLeaderboardResult {
  const { activeHomeId } = useHome();
  const [rows, setRows] = useState<HomeLeaderboardRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!activeHomeId) {
      setRows([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const next = await listHomeLeaderboard(activeHomeId);
      setRows(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la clasificación');
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeHomeId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { rows, isLoading, error, refresh };
}
