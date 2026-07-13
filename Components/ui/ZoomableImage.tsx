import React from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const DOUBLE_TAP_SCALE = 2.5;

/** Full-screen image with pinch-to-zoom, pan-while-zoomed, and
 *  double-tap to zoom in/reset. Must be rendered inside a
 *  GestureHandlerRootView (react-native Modals on Android don't inherit
 *  the app root's one — wrap the modal content). */
export default function ZoomableImage({ uri }: { uri: string }) {
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const tx = useSharedValue(0);
    const ty = useSharedValue(0);
    const savedTx = useSharedValue(0);
    const savedTy = useSharedValue(0);

    const reset = (animated: boolean) => {
        'worklet';
        scale.value = animated ? withTiming(1) : 1;
        tx.value = animated ? withTiming(0) : 0;
        ty.value = animated ? withTiming(0) : 0;
        savedScale.value = 1;
        savedTx.value = 0;
        savedTy.value = 0;
    };

    const pinch = Gesture.Pinch()
        .onUpdate((e) => {
            scale.value = Math.min(Math.max(savedScale.value * e.scale, MIN_SCALE), MAX_SCALE);
        })
        .onEnd(() => {
            savedScale.value = scale.value;
            if (scale.value <= MIN_SCALE) reset(true);
        });

    const pan = Gesture.Pan()
        .averageTouches(true)
        .onUpdate((e) => {
            if (savedScale.value > 1) {
                tx.value = savedTx.value + e.translationX;
                ty.value = savedTy.value + e.translationY;
            }
        })
        .onEnd(() => {
            savedTx.value = tx.value;
            savedTy.value = ty.value;
        });

    const doubleTap = Gesture.Tap()
        .numberOfTaps(2)
        .onEnd(() => {
            if (scale.value > 1) {
                reset(true);
            } else {
                scale.value = withTiming(DOUBLE_TAP_SCALE);
                savedScale.value = DOUBLE_TAP_SCALE;
            }
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: tx.value },
            { translateY: ty.value },
            { scale: scale.value },
        ],
    }));

    return (
        <GestureDetector gesture={Gesture.Simultaneous(pinch, pan, doubleTap)}>
            <Animated.View style={{ flex: 1 }} collapsable={false}>
                <Animated.Image source={{ uri }} style={[{ flex: 1 }, animatedStyle]} resizeMode="contain" />
            </Animated.View>
        </GestureDetector>
    );
}
