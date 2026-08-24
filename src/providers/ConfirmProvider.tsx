import { createContext, PropsWithChildren, useCallback, useContext, useMemo, useState } from 'react';

import { ConfirmModal, type ConfirmTone } from '@/components/ui/ConfirmModal';

export type ConfirmRequest = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
};

type ConfirmContextValue = {
  confirm: (request: ConfirmRequest) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

/**
 * Promise-based confirmation dialog used for every destructive action.
 */
export function ConfirmProvider({ children }: PropsWithChildren) {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const [resolveFn, setResolveFn] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((next: ConfirmRequest) => {
    return new Promise<boolean>((resolve) => {
      setRequest(next);
      setResolveFn(() => resolve);
    });
  }, []);

  function finish(value: boolean) {
    resolveFn?.(value);
    setResolveFn(null);
    setRequest(null);
  }

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <ConfirmModal
        visible={request !== null}
        title={request?.title ?? ''}
        message={request?.message ?? ''}
        confirmLabel={request?.confirmLabel}
        cancelLabel={request?.cancelLabel}
        tone={request?.tone ?? 'danger'}
        onCancel={() => finish(false)}
        onConfirm={() => finish(true)}
      />
    </ConfirmContext.Provider>
  );
}

/**
 * Opens a blocking confirmation modal. Must be used within ConfirmProvider.
 */
export function useConfirmDialog(): ConfirmContextValue['confirm'] {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirmDialog must be used within ConfirmProvider');
  }
  return context.confirm;
}
