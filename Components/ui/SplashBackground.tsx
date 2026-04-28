import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, StyleSheet, View, useWindowDimensions } from 'react-native';
import SplashAvatars from './SplashAvatars';

const { width } = Dimensions.get('window');

export default function SplashBackground({
  children,
  gradientColors = ['#000000', '#621487'],
  className,
  showAvatars = true,
}: {
  children?: React.ReactNode;
  gradientColors?: readonly [string, string, ...string[]];
  className?: string;
  showAvatars?: boolean;
}) {
  const { height: screenH } = useWindowDimensions();
  const isSmall = screenH < 750;

  // 1.2x screen width to ensure circles wrap nicely and scale proportionally
  // On small screens, reduce the BASE size to ensure circles don't reach the text area
  const BASE = isSmall ? width * 0.85 : width * 1;
  const TOP_OFFSET = isSmall ? 25 : 45;

  return (
    <View className={`flex-1 overflow-hidden bg-black ${className}`}>
      <LinearGradient
        colors={gradientColors}
        locations={[0.37, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Concentric Circles Background - Moved higher to avoid text overlap */}
      <View
        style={{ width: BASE, height: BASE, top: TOP_OFFSET }}
        className="absolute self-center items-center justify-center"
      >
        <View
          style={{ width: BASE, height: BASE, borderRadius: BASE / 2, borderWidth: BASE * 0.12 }}
          className="absolute border-white/[0.07]"
        />
        <View
          style={{ width: BASE * 0.65, height: BASE * 0.65, borderRadius: (BASE * 0.65) / 2, borderWidth: BASE * 0.10 }}
          className="absolute border-white/[0.07]"
        />
        <View
          style={{ width: BASE * 0.35, height: BASE * 0.35, borderRadius: (BASE * 0.35) / 2, borderWidth: BASE * 0.08 }}
          className="absolute border-white/[0.07]"
        />
      </View>

      {showAvatars && <SplashAvatars />}

      {children}
    </View>
  );
}
