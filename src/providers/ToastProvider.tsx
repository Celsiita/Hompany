import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastTone = 'success' | 'error' | 'info';

export type ToastRequest = {
  message: string;
  tone?: ToastTone;
  /** Auto-hide delay. Defaults to 3200 ms. */
  durationMs?: number;
};

type ToastContextValue = {
  showToast: (request: ToastRequest | string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_STYLES: Record<ToastTone, { border: string; bg: string; text: string }> = {
  success: {
    border: 'border-teal-300',
    bg: 'bg-teal-50',
    text: 'text-teal-950',
  },
  error: {
    border: 'border-rose-300',
    bg: 'bg-rose-50',
    text: 'text-rose-950',
  },
  info: {
    border: 'border-stone-300',
    bg: 'bg-white',
    text: 'text-stone-900',
  },
};

type ActiveToast = {
  id: number;
  message: string;
  tone: ToastTone;
  durationMs: number;
};

/**
 * Floating auto-dismiss toasts so feedback is visible regardless of scroll position.
 */
export function ToastProvider({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ActiveToast | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seqRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const showToast = useCallback(
    (request: ToastRequest | string) => {
      const next =
        typeof request === 'string'
          ? { message: request, tone: 'success' as const, durationMs: 3200 }
          : {
              message: request.message,
              tone: request.tone ?? 'success',
              durationMs: request.durationMs ?? 3200,
            };
      clearTimer();
      const id = ++seqRef.current;
      setToast({ id, ...next });
      timerRef.current = setTimeout(() => {
        setToast((current) => (current?.id === id ? null : current));
        timerRef.current = null;
      }, next.durationMs);
    },
    [clearTimer],
  );

  useEffect(() => () => clearTimer(), [clearTimer]);

  const value = useMemo(() => ({ showToast }), [showToast]);
  const tone = toast ? TONE_STYLES[toast.tone] : TONE_STYLES.info;

  return (
    <ToastContext.Provider value={value}>
      <View className="flex-1">
        {children}
        {toast ? (
          <View
            pointerEvents="none"
            className="absolute left-0 right-0 items-center px-4"
            style={{ top: Math.max(insets.top, 8) + 8, zIndex: 1000, elevation: 1000 }}>
            <View
              className={`w-full max-w-md rounded-2xl border px-4 py-3 shadow-lg ${tone.border} ${tone.bg}`}
              accessibilityLiveRegion="polite"
              accessibilityRole="alert">
              <Text className={`text-center text-sm font-semibold leading-5 ${tone.text}`}>
                {toast.message}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    </ToastContext.Provider>
  );
}

/**
 * Shows a floating toast. Must be used within ToastProvider.
 */
export function useToast(): ToastContextValue['showToast'] {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context.showToast;
}
