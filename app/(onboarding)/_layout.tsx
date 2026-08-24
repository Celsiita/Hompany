import { Stack } from 'expo-router';

/**
 * Onboarding route group layout (create / join home).
 */
export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="setup-home" />
    </Stack>
  );
}
