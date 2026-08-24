import { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * Expo application configuration.
 * Reads Supabase credentials from environment variables at build time.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'HOMPANY',
  slug: 'hompany',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'hompany',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'HOMPANY necesita acceso a tus fotos para subir la prueba de las tareas.',
        cameraPermission:
          'HOMPANY necesita la cámara para fotografiar la prueba de las tareas.',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
});
