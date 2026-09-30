import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import '../global.css';

import { MascotLoading } from '@/components/ui/MascotLoading';
import { palette } from '@/lib/interactive-styles';
import { useAppGate } from '@/lib/navigation/app-gate';
import { AppProviders } from '@/providers/AppProviders';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

/**
 * Inner root navigator that redirects based on auth + active home gate.
 */
function RootNavigator() {
  const gate = useAppGate();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (gate === 'loading') {
      return;
    }

    SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';

    if (gate === 'unauthenticated' && !inAuthGroup) {
      router.replace('/(auth)/login');
      return;
    }

    if (gate === 'needs_home' && !inOnboardingGroup) {
      router.replace('/(onboarding)/setup-home');
      return;
    }

    if (gate === 'ready' && (inAuthGroup || inOnboardingGroup)) {
      router.replace('/(tabs)');
    }
  }, [gate, segments, router]);

  if (gate === 'loading') {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: palette.cream }}>
        <MascotLoading />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

/**
 * Root layout — global providers, theme and navigation stack.
 */
export default function RootLayout() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
