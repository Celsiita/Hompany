import { renderHook, act } from '@testing-library/react-native';
import { PropsWithChildren } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider, useToast } from '@/providers/ToastProvider';

function wrapper({ children }: PropsWithChildren) {
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}>
      <ToastProvider>{children}</ToastProvider>
    </SafeAreaProvider>
  );
}

describe('ToastProvider', () => {
  it('exposes showToast without throwing', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    act(() => {
      result.current({ message: 'Cambio propuesto', tone: 'success' });
    });
    expect(typeof result.current).toBe('function');
  });
});
