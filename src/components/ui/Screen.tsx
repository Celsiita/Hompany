import { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/lib/interactive-styles';

type ScreenProps = PropsWithChildren<{
  className?: string;
  /** Skip the warm gradient (e.g. nested layouts). */
  plain?: boolean;
}>;

/**
 * Screen wrapper with warm cream → soft teal wash. Top inset only —
 * the tab bar already owns the bottom safe area.
 */
export function Screen({ children, className, plain = false }: ScreenProps) {
  return (
    <View className="flex-1" style={{ backgroundColor: palette.cream }}>
      {plain ? null : (
        <LinearGradient
          colors={[palette.cream, '#e8f7f4', palette.creamDeep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        />
      )}
      <SafeAreaView
        edges={['top', 'left', 'right']}
        className={`flex-1 px-4 ${className ?? ''}`}>
        {children}
      </SafeAreaView>
    </View>
  );
}
