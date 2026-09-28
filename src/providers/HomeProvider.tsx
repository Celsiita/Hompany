import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  createHome as createHomeRpc,
  joinHomeByInviteCode,
  listMyHomes,
  updateHomePracticalInfo as updateHomePracticalInfoApi,
  updateHomeProofSettings as updateHomeProofSettingsApi,
} from '@/features/home/api/homes-api';
import { parseInviteCodeFromUrl } from '@/lib/home-invite';
import { ACTIVE_HOME_ID_KEY } from '@/lib/home/storage';
import { requireHomeId } from '@/lib/home/require-home-id';
import { useAuth } from '@/providers/AuthProvider';
import type { CreateHomeInput, JoinHomeInput } from '@/schemas/onboarding.schema';
import { createHomeInputSchema, joinHomeInputSchema } from '@/schemas/onboarding.schema';
import type {
  UpdateHomePracticalInfoInput,
  UpdateHomeProofSettingsInput,
} from '@/schemas/home.schema';
import type { Home } from '@/types/database.types';

type HomeContextValue = {
  homes: Home[];
  activeHomeId: string | null;
  activeHome: Home | null;
  isLoading: boolean;
  setActiveHomeId: (homeId: string) => Promise<void>;
  refreshHomes: () => Promise<Home[]>;
  createHome: (input: CreateHomeInput) => Promise<Home>;
  joinHome: (input: JoinHomeInput) => Promise<Home>;
  clearActiveHome: () => Promise<void>;
  updateHomePracticalInfo: (input: UpdateHomePracticalInfoInput) => Promise<Home>;
  updateHomeProofSettings: (input: UpdateHomeProofSettingsInput) => Promise<Home>;
};

const HomeContext = createContext<HomeContextValue | null>(null);

/**
 * Picks the best active home id from memberships + stored preference.
 */
export function resolveActiveHomeId(
  homes: Home[],
  storedHomeId: string | null,
): string | null {
  if (homes.length === 0) {
    return null;
  }

  if (storedHomeId && homes.some((home) => home.id === storedHomeId)) {
    return storedHomeId;
  }

  return homes[0].id;
}

/**
 * Provides active home tenant context (`home_id`) for multi-tenant data access.
 */
export function HomeProvider({ children }: PropsWithChildren) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [homes, setHomes] = useState<Home[]>([]);
  const [activeHomeId, setActiveHomeIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshHomes = useCallback(async () => {
    if (!user) {
      setHomes([]);
      return [];
    }

    const nextHomes = await listMyHomes();
    setHomes(nextHomes);
    return nextHomes;
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (isAuthLoading) {
        return;
      }

      if (!user) {
        setHomes([]);
        setActiveHomeIdState(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const [nextHomes, storedHomeId] = await Promise.all([
          listMyHomes(),
          AsyncStorage.getItem(ACTIVE_HOME_ID_KEY),
        ]);

        if (cancelled) {
          return;
        }

        setHomes(nextHomes);

        const nextActiveId = resolveActiveHomeId(nextHomes, storedHomeId);
        setActiveHomeIdState(nextActiveId);

        if (nextActiveId) {
          await AsyncStorage.setItem(ACTIVE_HOME_ID_KEY, nextActiveId);
        } else if (storedHomeId) {
          await AsyncStorage.removeItem(ACTIVE_HOME_ID_KEY);
        }
      } catch {
        if (!cancelled) {
          setHomes([]);
          setActiveHomeIdState(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [user, isAuthLoading]);

  const setActiveHomeId = useCallback(async (homeId: string) => {
    const scoped = requireHomeId(homeId);
    await AsyncStorage.setItem(ACTIVE_HOME_ID_KEY, scoped);
    setActiveHomeIdState(scoped);
  }, []);

  const clearActiveHome = useCallback(async () => {
    await AsyncStorage.removeItem(ACTIVE_HOME_ID_KEY);
    setActiveHomeIdState(null);
  }, []);

  const createHome = useCallback(
    async (input: CreateHomeInput) => {
      const parsed = createHomeInputSchema.parse(input);
      const home = await createHomeRpc(parsed.name);
      await setActiveHomeId(home.id);
      try {
        await refreshHomes();
      } catch {
        setHomes((current) => {
          if (current.some((item) => item.id === home.id)) {
            return current;
          }
          return [...current, home];
        });
      }
      return home;
    },
    [refreshHomes, setActiveHomeId],
  );

  const joinHome = useCallback(
    async (input: JoinHomeInput) => {
      const parsed = joinHomeInputSchema.parse(input);
      const home = await joinHomeByInviteCode(parsed.inviteCode);
      await setActiveHomeId(home.id);
      try {
        await refreshHomes();
      } catch {
        setHomes((current) => {
          if (current.some((item) => item.id === home.id)) {
            return current;
          }
          return [...current, home];
        });
      }
      return home;
    },
    [refreshHomes, setActiveHomeId],
  );

  const updateHomePracticalInfo = useCallback(
    async (input: UpdateHomePracticalInfoInput) => {
      const homeId = requireHomeId(activeHomeId);
      const home = await updateHomePracticalInfoApi(homeId, input);
      setHomes((current) =>
        current.map((item) => (item.id === home.id ? { ...item, ...home } : item)),
      );
      return home;
    },
    [activeHomeId],
  );

  const updateHomeProofSettings = useCallback(
    async (input: UpdateHomeProofSettingsInput) => {
      const homeId = requireHomeId(activeHomeId);
      const home = await updateHomeProofSettingsApi(homeId, input);
      setHomes((current) =>
        current.map((item) => (item.id === home.id ? { ...item, ...home } : item)),
      );
      return home;
    },
    [activeHomeId],
  );

  useEffect(() => {
    if (!user || isAuthLoading) {
      return;
    }

    async function handleUrl(url: string | null) {
      if (!url) {
        return;
      }
      const code = parseInviteCodeFromUrl(url);
      if (!code) {
        return;
      }
      try {
        await joinHome({ inviteCode: code });
      } catch {
        // Ignore invalid/expired invite links; user can still join manually.
      }
    }

    void Linking.getInitialURL().then((url) => void handleUrl(url));
    const subscription = Linking.addEventListener('url', (event) => {
      void handleUrl(event.url);
    });
    return () => subscription.remove();
  }, [user, isAuthLoading, joinHome]);

  const activeHome = useMemo(
    () => homes.find((home) => home.id === activeHomeId) ?? null,
    [homes, activeHomeId],
  );

  const value = useMemo<HomeContextValue>(
    () => ({
      homes,
      activeHomeId,
      activeHome,
      isLoading: isAuthLoading || isLoading,
      setActiveHomeId,
      refreshHomes,
      createHome,
      joinHome,
      clearActiveHome,
      updateHomePracticalInfo,
      updateHomeProofSettings,
    }),
    [
      homes,
      activeHomeId,
      activeHome,
      isAuthLoading,
      isLoading,
      setActiveHomeId,
      refreshHomes,
      createHome,
      joinHome,
      clearActiveHome,
      updateHomePracticalInfo,
      updateHomeProofSettings,
    ],
  );

  return <HomeContext.Provider value={value}>{children}</HomeContext.Provider>;
}

/**
 * Access active home context. Must be used within HomeProvider.
 */
export function useHome(): HomeContextValue {
  const context = useContext(HomeContext);
  if (!context) {
    throw new Error('useHome must be used within HomeProvider');
  }
  return context;
}

/**
 * Returns the validated active home_id or throws if missing.
 */
export function useRequiredHomeId(): string {
  const { activeHomeId } = useHome();
  return requireHomeId(activeHomeId);
}
