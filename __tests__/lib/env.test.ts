import Constants from 'expo-constants';

import { getEnv } from '@/lib/env';

const defaultExtra = {
  supabaseUrl: 'http://127.0.0.1:54321',
  supabaseAnonKey: 'test-anon-key',
};

describe('getEnv', () => {
  afterEach(() => {
    if (Constants.expoConfig) {
      Constants.expoConfig.extra = { ...defaultExtra };
    }
  });

  it('validates required Supabase environment variables with Zod', () => {
    const env = getEnv();

    expect(env.EXPO_PUBLIC_SUPABASE_URL).toBe('http://127.0.0.1:54321');
    expect(env.EXPO_PUBLIC_SUPABASE_ANON_KEY).toBe('test-anon-key');
  });

  it('throws when Supabase URL is missing', () => {
    if (Constants.expoConfig) {
      Constants.expoConfig.extra = {
        supabaseUrl: '',
        supabaseAnonKey: 'test-anon-key',
      };
    }

    expect(() => getEnv()).toThrow();
  });
});
