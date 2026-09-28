import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useState,
} from 'react';

import { TutorialHost } from '@/features/onboarding/components/TutorialHost';

type TutorialContextValue = {
  /** Opens the Mico tutorial again (e.g. from Settings). */
  openTutorial: () => void;
};

const TutorialContext = createContext<TutorialContextValue | null>(null);

/**
 * Hosts the first-run tutorial and exposes replay from Settings.
 */
export function TutorialProvider({ children }: PropsWithChildren) {
  const [forceOpen, setForceOpen] = useState(false);

  const openTutorial = useCallback(() => {
    setForceOpen(true);
  }, []);

  return (
    <TutorialContext.Provider value={{ openTutorial }}>
      {children}
      <TutorialHost
        forceOpen={forceOpen}
        onForceOpenHandled={() => setForceOpen(false)}
      />
    </TutorialContext.Provider>
  );
}

/**
 * Access tutorial replay controls.
 */
export function useTutorial(): TutorialContextValue {
  const ctx = useContext(TutorialContext);
  if (!ctx) {
    throw new Error('useTutorial must be used within TutorialProvider');
  }
  return ctx;
}
