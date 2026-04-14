import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// 1.2x screen width to ensure circles wrap nicely and scale proportionally
const BASE = width * 1; 

export default function SplashBackground({ 
  children,
  gradientColors = ['#000000', '#621487']
}: { 
  children?: React.ReactNode;
  gradientColors?: readonly [string, string, ...string[]];
}) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradientColors}
        locations={[0.37, 1]}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Concentric Circles Background */}
      <View style={styles.circlesCenter}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />
        <View style={styles.circle4} />
      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  circlesCenter: {
    position: 'absolute',
    top: 90, // Fixed top offset matching Figma
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    width: BASE,
    height: BASE,
  },
  circle1: { 
    position: 'absolute', 
    width: BASE, 
    height: BASE, 
    borderRadius: BASE / 2, 
    borderWidth: BASE * 0.12,  // 12% 
    borderColor: 'rgba(25, 25, 25, 0.4)' 
  },
  circle2: { 
    position: 'absolute', 
    width: BASE * 0.70, // Leaves a 6% diameter gap (3% radius) between ring 1 and 2
    height: BASE * 0.70, 
    borderRadius: (BASE * 0.70) / 2, 
    borderWidth: BASE * 0.10, // 10%
    borderColor: 'rgba(20, 20, 20, 0.5)' 
  },
  circle3: { 
    position: 'absolute', 
    width: BASE * 0.44, // Leaves a 6% diameter gap (3% radius) between ring 2 and 3
    height: BASE * 0.44, 
    borderRadius: (BASE * 0.44) / 2, 
    borderWidth: BASE * 0.08, // 8%
    borderColor: 'rgba(15, 15, 15, 0.6)' 
  },
  circle4: { 
    position: 'absolute', 
    width: BASE * 0.22, // Leaves a 6% diameter gap (3% radius) between ring 3 and 4
    height: BASE * 0.22, 
    borderRadius: (BASE * 0.22) / 2, 
    borderWidth: BASE * 0.07, // 7%
    borderColor: 'rgba(10, 10, 10, 0.7)' 
  },
});
