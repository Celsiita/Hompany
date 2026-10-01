import { getAppLocale } from '@/lib/i18n/locale-store';
import { translate } from '@/lib/i18n/strings';

/**
 * Home membership roles. `owner` and `admin` share elevated permissions.
 */
export type HomeMemberRole = 'owner' | 'admin' | 'member';

/**
 * Returns whether the role can perform admin-only mutations.
 */
export function isHomeAdminRole(role: HomeMemberRole | null | undefined): boolean {
  return role === 'owner' || role === 'admin';
}

/**
 * Human-readable role badge for settings and history (active app locale).
 */
export function homeRoleLabel(role: HomeMemberRole): string {
  const locale = getAppLocale();
  if (role === 'owner') {
    return translate(locale, 'role.owner');
  }
  if (role === 'admin') {
    return translate(locale, 'role.admin');
  }
  return translate(locale, 'role.member');
}
