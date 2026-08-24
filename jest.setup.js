jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      supabaseUrl: 'http://127.0.0.1:54321',
      supabaseAnonKey: 'test-anon-key',
    },
  },
}));

jest.mock('expo-router', () => ({
  Stack: Object.assign(
    ({ children }) => children,
    { Screen: () => null },
  ),
  Tabs: ({ children }) => children,
  Link: 'Link',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  useSegments: () => [],
  ErrorBoundary: ({ children }) => children,
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

/**
 * Lightweight Reanimated stub — avoid `react-native-reanimated/mock`, which
 * loads native worklets and crashes under Jest (loadUnpackers).
 */
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');

  const AnimatedView = React.forwardRef((props, ref) =>
    React.createElement(View, { ...props, ref }),
  );

  return {
    __esModule: true,
    default: {
      call: () => {},
      createAnimatedComponent: (Component) => Component,
      View: AnimatedView,
      Text: AnimatedView,
      ScrollView: AnimatedView,
      Image: AnimatedView,
      FlatList: AnimatedView,
    },
    View: AnimatedView,
    Text: AnimatedView,
    ScrollView: AnimatedView,
    Image: AnimatedView,
    FlatList: AnimatedView,
    FadeIn: {},
    FadeOut: {},
    Layout: {},
    Easing: { linear: (t) => t, ease: (t) => t },
    useSharedValue: (value) => ({ value }),
    useAnimatedStyle: () => ({}),
    useDerivedValue: (fn) => ({ value: fn() }),
    useAnimatedRef: () => ({ current: null }),
    withTiming: (value) => value,
    withSpring: (value) => value,
    withDelay: (_delay, value) => value,
    withSequence: (...values) => values[values.length - 1],
    withRepeat: (value) => value,
    cancelAnimation: jest.fn(),
    runOnJS: (fn) => fn,
    runOnUI: (fn) => fn,
    interpolate: () => 0,
    Extrapolation: { CLAMP: 'clamp' },
  };
});

jest.mock('react-native-worklets', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('expo-symbols', () => ({
  SymbolView: 'SymbolView',
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(async () => undefined),
}));

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(async () => ({ granted: true })),
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ granted: true })),
  launchCameraAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(async (uri) => ({ uri })),
  SaveFormat: { JPEG: 'jpeg' },
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      single: jest.fn(async () => ({ data: null, error: null })),
      then: undefined,
    })),
    rpc: jest.fn(async () => ({ data: null, error: null })),
    auth: {
      getSession: jest.fn(async () => ({ data: { session: null }, error: null })),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      signInWithPassword: jest.fn(async () => ({ data: { session: null }, error: null })),
      signUp: jest.fn(async () => ({ data: { session: null }, error: null })),
      signOut: jest.fn(async () => ({ error: null })),
    },
  })),
}));
