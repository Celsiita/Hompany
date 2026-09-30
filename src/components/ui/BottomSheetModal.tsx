import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type PanResponderGestureState,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useLocale } from '@/providers/LocaleProvider';

type BottomSheetModalProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Max height class for the sheet panel. */
  maxHeightClassName?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Fade vs slide enter animation. */
  animationType?: 'slide' | 'fade' | 'none';
};

/** Downward drag past this distance closes the sheet. */
const DISMISS_DY = 72;
/** Downward fling velocity that closes with a shorter drag. */
const DISMISS_VY = 0.85;

/**
 * Bottom sheet modal. Closes via Cancel / backdrop / Android back, or by
 * dragging down from the handle, or from the body when the inner scroll is at top.
 */
export function BottomSheetModal({
  visible,
  onClose,
  children,
  maxHeightClassName = 'max-h-[90%]',
  contentContainerStyle,
  animationType = 'slide',
}: BottomSheetModalProps) {
  const { t } = useLocale();
  const scrollOffsetRef = useRef(0);
  const closingRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const dragY = useRef(new Animated.Value(0)).current;
  const [scrollEnabled, setScrollEnabled] = useState(true);

  onCloseRef.current = onClose;

  function requestClose() {
    if (closingRef.current) {
      return;
    }
    closingRef.current = true;
    setScrollEnabled(true);
    dragY.setValue(0);
    onCloseRef.current();
  }

  const requestCloseRef = useRef(requestClose);
  requestCloseRef.current = requestClose;

  useEffect(() => {
    if (!visible) {
      closingRef.current = false;
      scrollOffsetRef.current = 0;
      dragY.setValue(0);
      setScrollEnabled(true);
    }
  }, [dragY, visible]);

  function isDownwardDismissGesture(gesture: PanResponderGestureState): boolean {
    if (closingRef.current) {
      return false;
    }
    const downward = gesture.dy > 8;
    const mostlyVertical = Math.abs(gesture.dy) > Math.abs(gesture.dx) * 1.15;
    return downward && mostlyVertical;
  }

  function finishDismissPan(gesture: PanResponderGestureState) {
    setScrollEnabled(true);
    if (gesture.dy >= DISMISS_DY || gesture.vy >= DISMISS_VY) {
      requestCloseRef.current();
      return;
    }
    Animated.spring(dragY, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  }

  function springBack() {
    setScrollEnabled(true);
    Animated.spring(dragY, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  }

  /** Handle: always drag-down to dismiss. */
  const handlePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !closingRef.current,
      onMoveShouldSetPanResponder: (_event, gesture) => isDownwardDismissGesture(gesture),
      onPanResponderGrant: () => {
        setScrollEnabled(false);
      },
      onPanResponderMove: (_event, gesture) => {
        if (gesture.dy > 0) {
          dragY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_event, gesture) => {
        finishDismissPan(gesture);
      },
      onPanResponderTerminate: () => {
        springBack();
      },
    }),
  ).current;

  /**
   * Sheet body: capture downward pans only when scroll is at the top,
   * so normal scrolling still works further down.
   */
  const sheetPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_event, gesture) => {
        if (!isDownwardDismissGesture(gesture)) {
          return false;
        }
        return scrollOffsetRef.current <= 4;
      },
      onMoveShouldSetPanResponderCapture: (_event, gesture) => {
        if (!isDownwardDismissGesture(gesture)) {
          return false;
        }
        return scrollOffsetRef.current <= 4;
      },
      onPanResponderGrant: () => {
        setScrollEnabled(false);
      },
      onPanResponderMove: (_event, gesture) => {
        if (gesture.dy > 0) {
          dragY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_event, gesture) => {
        finishDismissPan(gesture);
      },
      onPanResponderTerminate: () => {
        springBack();
      },
    }),
  ).current;

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    scrollOffsetRef.current = Math.max(0, event.nativeEvent.contentOffset.y);
  }

  function handleScrollEndDrag(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, velocity } = event.nativeEvent;
    const atTop = contentOffset.y <= 4;
    const overscrolled = contentOffset.y < -24;
    const flingDownPastTop = (velocity?.y ?? 0) > 0.85;
    if (atTop && (overscrolled || flingDownPastTop)) {
      requestClose();
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={requestClose}
      onShow={() => {
        closingRef.current = false;
        scrollOffsetRef.current = 0;
        dragY.setValue(0);
        setScrollEnabled(true);
      }}>
      <View className="flex-1 justify-end bg-black/40">
        <Pressable
          className="absolute inset-0"
          onPress={requestClose}
          accessibilityLabel={t('a11y.close')}
        />
        <Animated.View
          className={`w-full rounded-t-3xl bg-white p-4 ${maxHeightClassName}`}
          style={{ transform: [{ translateY: dragY }] }}
          {...sheetPan.panHandlers}>
          <View {...handlePan.panHandlers} className="mb-2 items-center py-2">
            <View className="h-1.5 w-10 rounded-full bg-stone-300" />
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            scrollEnabled={scrollEnabled}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            onScrollEndDrag={handleScrollEndDrag}
            scrollEventThrottle={16}
            bounces
            alwaysBounceVertical
            overScrollMode="always"
            contentContainerStyle={contentContainerStyle}>
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
