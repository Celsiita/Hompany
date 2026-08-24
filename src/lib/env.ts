import Constants from 'expo-constants';
import { z } from 'zod';

import { resolveSupabaseUrl } from '@/lib/supabase/resolve-url';

const envSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.string().url(),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Reads and validates required environment variables for the app.
 * Values are sourced from Expo config extra (build time) with process.env fallback (tests).
 * Local Supabase URLs are rewritten per platform so Expo Go / web can reach Docker.
 *
 * @returns Validated environment configuration.
 * @throws {z.ZodError} When required variables are missing or invalid.
 */
export function getEnv(): Env {
  const extra = Constants.expoConfig?.extra ?? {};

  const parsed = envSchema.parse({
    EXPO_PUBLIC_SUPABASE_URL:
      extra.supabaseUrl ?? process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY:
      extra.supabaseAnonKey ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  });

  return {
    ...parsed,
    EXPO_PUBLIC_SUPABASE_URL: resolveSupabaseUrl(parsed.EXPO_PUBLIC_SUPABASE_URL),
  };
}
