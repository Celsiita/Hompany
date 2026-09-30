/**
 * Ownership chip for task cards relative to the current viewer.
 */
export function taskOwnershipLabel(
  assigneeUserIds: string[],
  currentUserId: string | null | undefined,
): 'Tuya' | 'Compañero' | null {
  if (!currentUserId) {
    return null;
  }
  return assigneeUserIds.includes(currentUserId) ? 'Tuya' : 'Compañero';
}
