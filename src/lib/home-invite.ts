/**
 * Deep-link / share URL to join a home by invite code.
 */
export function homeInviteUrl(inviteCode: string): string {
  return `hompany://join?code=${encodeURIComponent(inviteCode.trim().toUpperCase())}`;
}

/**
 * Public QR image URL for the invite link (no extra native dependency).
 */
export function homeInviteQrImageUrl(inviteCode: string, size = 220): string {
  const data = encodeURIComponent(homeInviteUrl(inviteCode));
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${data}`;
}

/**
 * Extracts invite code from a join deep link if present.
 */
export function parseInviteCodeFromUrl(url: string): string | null {
  try {
    const normalized = url.replace('hompany://', 'https://hompany.local/');
    const parsed = new URL(normalized);
    if (!parsed.pathname.includes('join') && !parsed.host.includes('join')) {
      const code = parsed.searchParams.get('code');
      if (code) {
        return code.trim().toUpperCase();
      }
    }
    const code = parsed.searchParams.get('code');
    return code ? code.trim().toUpperCase() : null;
  } catch {
    const match = url.match(/[?&]code=([^&]+)/i);
    return match?.[1] ? decodeURIComponent(match[1]).trim().toUpperCase() : null;
  }
}
