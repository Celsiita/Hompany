import type { Href } from 'expo-router';

/**
 * Reads a single focus id from Expo Router search params.
 */
export function parseFocusId(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value || undefined;
}

/**
 * Route to the Tasks tab focused on a board item (list highlight, not edit modal).
 */
export function taskFocusHref(taskId: string): Href {
  return {
    pathname: '/(tabs)/tasks',
    params: { focusId: taskId },
  };
}

/**
 * Route to the Expenses tab focused on a board item (list highlight, not edit modal).
 */
export function expenseFocusHref(expenseId: string): Href {
  return {
    pathname: '/(tabs)/expenses',
    params: { focusId: expenseId },
  };
}
