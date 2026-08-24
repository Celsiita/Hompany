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
 * Human-readable role badge for settings and history.
 */
export function homeRoleLabel(role: HomeMemberRole): string {
  if (role === 'owner') {
    return 'Admin (creador)';
  }
  if (role === 'admin') {
    return 'Admin';
  }
  return 'Miembro';
}
