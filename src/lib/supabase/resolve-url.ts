import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * True when the hostname is loopback (local machine).
 */
export function isLoopbackHost(hostname: string): boolean {
  return hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '::1';
}

/**
 * True when the hostname looks like a private LAN address (RFC1918).
 */
export function isPrivateLanHost(hostname: string): boolean {
  return /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(hostname);
}

/**
 * Metro packager host (LAN IP) when Expo is serving over the network.
 */
export function getMetroHost(hostUri = Constants.expoConfig?.hostUri): string | null {
  if (!hostUri) {
    return null;
  }
  const host = hostUri.split(':')[0]?.trim();
  if (!host || isLoopbackHost(host)) {
    return null;
  }
  return host;
}

/**
 * Rewrites a local Supabase URL so each platform can reach Docker on the host.
 *
 * - Cloud URLs are left unchanged.
 * - Web always uses `127.0.0.1` for local/LAN targets (browser on the same PC).
 * - Native uses the current Metro LAN IP (avoids stale IPs in `.env.local`).
 * - Android emulator falls back to `10.0.2.2` when Metro itself is on loopback.
 *
 * @param configuredUrl - Value from `EXPO_PUBLIC_SUPABASE_URL`.
 * @returns URL origin safe for the current runtime.
 */
export function resolveSupabaseUrl(
  configuredUrl: string,
  options?: {
    platform?: typeof Platform.OS;
    hostUri?: string | null;
  },
): string {
  const parsed = new URL(configuredUrl);
  const hostname = parsed.hostname;
  const localTarget = isLoopbackHost(hostname) || isPrivateLanHost(hostname);

  if (!localTarget) {
    return configuredUrl.replace(/\/$/, '');
  }

  const platform = options?.platform ?? Platform.OS;
  const metroHost =
    options?.hostUri === null
      ? null
      : getMetroHost(options?.hostUri ?? Constants.expoConfig?.hostUri);

  if (platform === 'web') {
    parsed.hostname = '127.0.0.1';
    return parsed.origin;
  }

  if (metroHost) {
    parsed.hostname = metroHost;
    return parsed.origin;
  }

  if (platform === 'android' && isLoopbackHost(hostname)) {
    parsed.hostname = '10.0.2.2';
    return parsed.origin;
  }

  return configuredUrl.replace(/\/$/, '');
}
