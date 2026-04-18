import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import SplashAvatars from './SplashAvatars';

const { width } = Dimensions.get('window');

// 1.2x screen width to ensure circles wrap nicely and scale proportionally
const BASE = width * 1;

export default function SplashBackground({
  children,
  gradientColors = ['#000000', '#621487'],
  className
}: {
  children?: React.ReactNode;
  gradientColors?: readonly [string, string, ...string[]];
  className?: string;
}) {
  return (
    <View className={`flex-1 overflow-hidden bg-black ${className}`}>
      <LinearGradient
        colors={gradientColors}
        locations={[0.37, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Concentric Circles Background */}
      <View
        style={{ width: BASE, height: BASE }}
        className="absolute top-[60px] self-center items-center justify-center"
      >
        <View
          style={{ width: BASE, height: BASE, borderRadius: BASE / 2, borderWidth: BASE * 0.12 }}
          className="absolute border-white/[0.12]"
        />
        <View
          style={{ width: BASE * 0.65, height: BASE * 0.65, borderRadius: (BASE * 0.65) / 2, borderWidth: BASE * 0.10 }}
          className="absolute border-white/[0.15]"
        />
        <View
          style={{ width: BASE * 0.35, height: BASE * 0.35, borderRadius: (BASE * 0.35) / 2, borderWidth: BASE * 0.08 }}
          className="absolute border-white/[0.18]"
        />
      </View>

      <SplashAvatars />

      {children}
    </View>
  );
}
