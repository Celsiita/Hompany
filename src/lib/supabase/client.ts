import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { getEnv } from '@/lib/env';
import { Database } from '@/types/database.types';

let supabaseClient: SupabaseClient<Database> | null = null;

/**
 * Returns the singleton Supabase client configured for the current environment.
 *
 * Multi-tenancy rule: every query or mutation on home-scoped tables MUST filter
 * explicitly by the active `home_id`. Never fetch home data without that filter.
 *
 * Session is persisted with AsyncStorage for Expo / React Native.
 *
 * @returns Typed Supabase client instance.
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseClient) {
    const env = getEnv();
    supabaseClient = createClient<Database>(
      env.EXPO_PUBLIC_SUPABASE_URL,
      env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      },
    );
  }

  return supabaseClient;
}

/**
 * Resets the cached client instance. Intended for testing only.
 */
export function resetSupabaseClient(): void {
  supabaseClient = null;
}

/** Singleton Supabase client for application use. */
export const supabase = {
  get client() {
    return getSupabaseClient();
  },
};
