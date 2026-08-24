import { PropsWithChildren } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

type ScreenProps = PropsWithChildren<{
  className?: string;
}>;

/**
 * Screen wrapper. Top inset only — the tab bar already owns the bottom safe area.
 */
export function Screen({ children, className }: ScreenProps) {
  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      className={`flex-1 bg-white px-4 ${className ?? ''}`}>
      {children}
    </SafeAreaView>
  );
}
