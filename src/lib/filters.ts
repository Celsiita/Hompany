/**
 * Toggles a chip filter: selecting the active value clears it (show all).
 */
export function toggleChipFilter<T extends string>(current: T | 'ALL', next: T): T | 'ALL' {
  return current === next ? 'ALL' : next;
}
