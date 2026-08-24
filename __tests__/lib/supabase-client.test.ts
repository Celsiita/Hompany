import { getSupabaseClient, resetSupabaseClient } from '@/lib/supabase/client';

describe('getSupabaseClient', () => {
  beforeEach(() => {
    resetSupabaseClient();
  });

  afterEach(() => {
    resetSupabaseClient();
  });

  it('creates a Supabase client with mocked environment variables', () => {
    const client = getSupabaseClient();

    expect(client).toBeDefined();
    expect(typeof client.from).toBe('function');
  });

  it('returns the same singleton instance on subsequent calls', () => {
    const first = getSupabaseClient();
    const second = getSupabaseClient();

    expect(first).toBe(second);
  });
});
