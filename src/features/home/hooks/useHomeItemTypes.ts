import { useCallback, useEffect, useState } from 'react';

import {
  createItemType,
  listItemTypesByHome,
} from '@/features/home/api/item-types-api';
import { useHome } from '@/providers/HomeProvider';
import type { HomeItemType, ItemTypeDomain } from '@/schemas/item-type.schema';

/**
 * Custom item types for the active home (tasks or expenses).
 */
export function useHomeItemTypes(domain: ItemTypeDomain) {
  const { activeHomeId } = useHome();
  const [types, setTypes] = useState<HomeItemType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!activeHomeId) {
      setTypes([]);
      return;
    }
    setIsLoading(true);
    try {
      setTypes(await listItemTypesByHome(activeHomeId, domain));
    } finally {
      setIsLoading(false);
    }
  }, [activeHomeId, domain]);

  useEffect(() => {
    void load();
  }, [load]);

  const addType = useCallback(
    async (name: string) => {
      if (!activeHomeId) {
        throw new Error('home_id is required');
      }
      const created = await createItemType({
        home_id: activeHomeId,
        domain,
        name,
      });
      setTypes((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name, 'es')));
      return created;
    },
    [activeHomeId, domain],
  );

  return { types, isLoading, addType, refresh: load };
}
