import { PropsWithChildren } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/providers/AuthProvider';
import { ConfirmProvider } from '@/providers/ConfirmProvider';
import { HomeProvider } from '@/providers/HomeProvider';
import { IconPackProvider } from '@/providers/IconPackProvider';

/**
 * Global application providers wrapper (safe area, auth session, active home).
 */
export function AppProviders({ children }: PropsWithChildren) {
  return (
    <SafeAreaProvider>
      <ConfirmProvider>
        <AuthProvider>
          <HomeProvider>
            <IconPackProvider>{children}</IconPackProvider>
          </HomeProvider>
        </AuthProvider>
      </ConfirmProvider>
    </SafeAreaProvider>
  );
}
