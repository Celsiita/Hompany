import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';

import type { LoginInput, RegisterInput } from '@/schemas/auth.schema';
import { loginSchema, registerSchema } from '@/schemas/auth.schema';
import { getSupabaseClient } from '@/lib/supabase/client';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (input: LoginInput) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Provides Supabase auth session state and auth actions to the tree.
 * Clears stale sessions after a local `db:reset` (invalid refresh token).
 */
export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseClient();
    let cancelled = false;

    async function hydrateSession() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (cancelled) {
          return;
        }

        if (error || !data.session) {
          setSession(null);
          return;
        }

        // Validate against Auth server — fails after db:reset with stale AsyncStorage.
        // Bound wait so a hung network never leaves the app gate stuck on loading.
        const userResult = await Promise.race([
          supabase.auth.getUser(),
          new Promise<{ data: { user: null }; error: Error }>((resolve) => {
            setTimeout(
              () =>
                resolve({
                  data: { user: null },
                  error: new Error('getUser timeout'),
                }),
              8_000,
            );
          }),
        ]);

        if (cancelled) {
          return;
        }

        if (userResult.error?.message === 'getUser timeout' && data.session) {
          // Trust persisted session if validation times out (common on slow web).
          setSession(data.session);
          return;
        }

        if (userResult.error || !userResult.data.user) {
          await supabase.auth.signOut();
          setSession(null);
          return;
        }

        setSession(data.session);
      } catch {
        if (!cancelled) {
          setSession(null);
        }
      } finally {
        setIsLoading(false);
      }
    }

    void hydrateSession();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setIsLoading(false);
      },
    );

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (input: LoginInput) => {
    const parsed = loginSchema.parse(input);
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword(parsed);
    if (error) {
      throw error;
    }
  }, []);

  const signUp = useCallback(async (input: RegisterInput) => {
    const parsed = registerSchema.parse(input);
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signUp({
      email: parsed.email,
      password: parsed.password,
      options: {
        data: { display_name: parsed.displayName },
      },
    });
    if (error) {
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();
    setSession(null);
    if (error) {
      await supabase.auth.signOut({ scope: 'local' });
      setSession(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      signIn,
      signUp,
      signOut,
    }),
    [session, isLoading, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Access auth session and actions. Must be used within AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
