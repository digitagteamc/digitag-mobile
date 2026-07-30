import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

// iOS's RefreshControl reveals its spinner by literally dragging the whole
// ScrollView content down as the user pulls — there's no native way to show
// "just the spinner" without that shift. This hook keeps `bounces` doing its
// normal job (so we still get negative contentOffset events to react to),
// but cancels the resulting content movement with an equal-and-opposite
// translateY, and drives a small overlay spinner from the same value instead.
const PULL_THRESHOLD = -70;

export function usePullToRefresh(onRefresh: () => void, refreshing: boolean) {
  const scrollY = useRef(new Animated.Value(0)).current;
  const latest = useRef(0);
  const triggered = useRef(false);

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => { latest.current = value; });
    return () => scrollY.removeListener(id);
  }, [scrollY]);

  useEffect(() => {
    if (!refreshing) triggered.current = false;
  }, [refreshing]);

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true }
  );

  const onScrollEndDrag = () => {
    if (!refreshing && !triggered.current && latest.current <= PULL_THRESHOLD) {
      triggered.current = true;
      onRefresh();
    }
  };

  const contentStyle = {
    transform: [{
      translateY: scrollY.interpolate({
        inputRange: [-2000, 0],
        outputRange: [2000, 0],
        extrapolate: 'clamp' as const,
      }),
    }],
  };

  const indicatorStyle = {
    opacity: scrollY.interpolate({ inputRange: [-60, -15, 0], outputRange: [1, 0, 0], extrapolate: 'clamp' as const }),
    transform: [{
      scale: scrollY.interpolate({ inputRange: [-60, -15, 0], outputRange: [1, 0.5, 0.5], extrapolate: 'clamp' as const }),
    }],
  };

  return { onScroll, onScrollEndDrag, contentStyle, indicatorStyle };
}
