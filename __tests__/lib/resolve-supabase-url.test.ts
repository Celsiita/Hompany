import {
  getMetroHost,
  isLoopbackHost,
  isPrivateLanHost,
  resolveSupabaseUrl,
} from '@/lib/supabase/resolve-url';

describe('resolveSupabaseUrl', () => {
  it('detects loopback and private LAN hosts', () => {
    expect(isLoopbackHost('127.0.0.1')).toBe(true);
    expect(isLoopbackHost('localhost')).toBe(true);
    expect(isPrivateLanHost('192.168.1.47')).toBe(true);
    expect(isPrivateLanHost('10.0.0.5')).toBe(true);
    expect(isPrivateLanHost('db.xxxxx.supabase.co')).toBe(false);
  });

  it('extracts Metro LAN host from hostUri', () => {
    expect(getMetroHost('192.168.1.48:8081')).toBe('192.168.1.48');
    expect(getMetroHost('127.0.0.1:8081')).toBeNull();
    expect(getMetroHost(undefined)).toBeNull();
  });

  it('leaves cloud Supabase URLs unchanged', () => {
    const cloud = 'https://abc.supabase.co';
    expect(resolveSupabaseUrl(cloud, { platform: 'web', hostUri: '192.168.1.48:8081' })).toBe(cloud);
    expect(resolveSupabaseUrl(cloud, { platform: 'android', hostUri: '192.168.1.48:8081' })).toBe(
      cloud,
    );
  });

  it('rewrites stale LAN URL to 127.0.0.1 on web', () => {
    expect(
      resolveSupabaseUrl('http://192.168.1.47:54321', {
        platform: 'web',
        hostUri: '192.168.1.48:8081',
      }),
    ).toBe('http://127.0.0.1:54321');
  });

  it('rewrites loopback/LAN URL to Metro host on native', () => {
    expect(
      resolveSupabaseUrl('http://127.0.0.1:54321', {
        platform: 'android',
        hostUri: '192.168.1.48:8081',
      }),
    ).toBe('http://192.168.1.48:54321');

    expect(
      resolveSupabaseUrl('http://192.168.1.47:54321', {
        platform: 'ios',
        hostUri: '192.168.1.48:8081',
      }),
    ).toBe('http://192.168.1.48:54321');
  });

  it('falls back to 10.0.2.2 for Android emulator on loopback Metro', () => {
    expect(
      resolveSupabaseUrl('http://127.0.0.1:54321', {
        platform: 'android',
        hostUri: null,
      }),
    ).toBe('http://10.0.2.2:54321');
  });
});
