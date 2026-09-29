import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';

import type { HomeSection } from '@/components/ui/HomeSectionBar';
import { TutorialHost } from '@/features/onboarding/components/TutorialHost';

type TutorialContextValue = {
  /** Opens the Mico tutorial again (e.g. from Settings). */
  openTutorial: () => void;
  /** Home registers its section setter so the tour can switch Feed/Agenda/Piso. */
  registerHomeSectionSetter: (setter: (section: HomeSection) => void) => void;
  /** Applies a Home section during the tour (no-op if Home is not mounted). */
  setHomeSection: (section: HomeSection) => void;
};

const TutorialContext = createContext<TutorialContextValue | null>(null);

/**
 * Hosts the first-run tutorial and exposes replay from Settings.
 */
export function TutorialProvider({ children }: PropsWithChildren) {
  const [forceOpen, setForceOpen] = useState(false);
  const sectionSetterRef = useRef<((section: HomeSection) => void) | null>(null);

  const openTutorial = useCallback(() => {
    setForceOpen(true);
  }, []);

  const registerHomeSectionSetter = useCallback((setter: (section: HomeSection) => void) => {
    sectionSetterRef.current = setter;
  }, []);

  const setHomeSection = useCallback((section: HomeSection) => {
    sectionSetterRef.current?.(section);
  }, []);

  return (
    <TutorialContext.Provider
      value={{ openTutorial, registerHomeSectionSetter, setHomeSection }}>
      {children}
      <TutorialHost
        forceOpen={forceOpen}
        onForceOpenHandled={() => setForceOpen(false)}
        setHomeSection={setHomeSection}
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
