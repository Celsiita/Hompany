import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  createHomeNotice,
  deleteHomeNotice,
  listHomeNotices,
} from '@/features/home/api/notices-api';
import { noticesBoardSync } from '@/lib/board-sync';
import { useHome } from '@/providers/HomeProvider';
import {
  CALENDAR_NOTICE_KINDS,
  FEED_NOTICE_KINDS,
  type CreateHomeNoticeInput,
  type HomeNotice,
} from '@/schemas/home-notice.schema';

type UseHomeNoticesResult = {
  notices: HomeNotice[];
  feedNotices: HomeNotice[];
  calendarNotices: HomeNotice[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addNotice: (input: Omit<CreateHomeNoticeInput, 'home_id'>) => Promise<HomeNotice>;
  removeNotice: (noticeId: string) => Promise<void>;
};

/**
 * Home-scoped notices (feed rules/complaints + calendar visits/repairs/events).
 */
export function useHomeNotices(): UseHomeNoticesResult {
  const { activeHomeId } = useHome();
  const [notices, setNotices] = useState<HomeNotice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const instanceId = useRef(Symbol('useHomeNotices'));
  const noticesRef = useRef(notices);
  noticesRef.current = notices;

  const load = useCallback(async () => {
    if (!activeHomeId) {
      setNotices([]);
      setIsLoading(false);
      return;
    }

    if (noticesRef.current.length === 0) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const rows = await listHomeNotices(activeHomeId);
      setNotices(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los avisos');
    } finally {
      setIsLoading(false);
    }
  }, [activeHomeId]);

  const refresh = useCallback(async () => {
    await load();
    noticesBoardSync.notify(instanceId.current);
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    return noticesBoardSync.subscribe((sourceId) => {
      if (sourceId === instanceId.current) {
        return;
      }
      void load();
    });
  }, [load]);

  const addNotice = useCallback(
    async (input: Omit<CreateHomeNoticeInput, 'home_id'>) => {
      if (!activeHomeId) {
        throw new Error('home_id is required');
      }
      const created = await createHomeNotice({ ...input, home_id: activeHomeId });
      await refresh();
      return created;
    },
    [activeHomeId, refresh],
  );

  const removeNotice = useCallback(
    async (noticeId: string) => {
      if (!activeHomeId) {
        throw new Error('home_id is required');
      }
      await deleteHomeNotice(activeHomeId, noticeId);
      await refresh();
    },
    [activeHomeId, refresh],
  );

  const feedNotices = useMemo(
    () => notices.filter((row) => (FEED_NOTICE_KINDS as readonly string[]).includes(row.kind)),
    [notices],
  );

  const calendarNotices = useMemo(
    () =>
      notices.filter((row) => (CALENDAR_NOTICE_KINDS as readonly string[]).includes(row.kind)),
    [notices],
  );

  return {
    notices,
    feedNotices,
    calendarNotices,
    isLoading,
    error,
    refresh,
    addNotice,
    removeNotice,
  };
}
