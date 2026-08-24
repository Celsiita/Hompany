import { useAuth } from '@/providers/AuthProvider';
import { useHome } from '@/providers/HomeProvider';

export type AppGateState = 'loading' | 'unauthenticated' | 'needs_home' | 'ready';

/**
 * Derives the navigation gate state from auth and home context.
 */
export function getAppGateState(input: {
  isAuthLoading: boolean;
  isHomeLoading: boolean;
  hasSession: boolean;
  activeHomeId: string | null;
  homesCount: number;
}): AppGateState {
  if (input.isAuthLoading || input.isHomeLoading) {
    return 'loading';
  }

  if (!input.hasSession) {
    return 'unauthenticated';
  }

  if (!input.activeHomeId && input.homesCount === 0) {
    return 'needs_home';
  }

  if (!input.activeHomeId && input.homesCount > 0) {
    return 'needs_home';
  }

  return 'ready';
}

/**
 * Hook that exposes the current app gate state for root navigation.
 */
export function useAppGate(): AppGateState {
  const { session, isLoading: isAuthLoading } = useAuth();
  const { activeHomeId, homes, isLoading: isHomeLoading } = useHome();

  return getAppGateState({
    isAuthLoading,
    isHomeLoading,
    hasSession: Boolean(session),
    activeHomeId,
    homesCount: homes.length,
  });
}
