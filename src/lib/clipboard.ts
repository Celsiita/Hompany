import * as Clipboard from 'expo-clipboard';

/**
 * Copies text to the clipboard. Returns whether the write succeeded.
 */
export async function copyToClipboard(value: string): Promise<boolean> {
  try {
    await Clipboard.setStringAsync(value);
    return true;
  } catch {
    return false;
  }
}
