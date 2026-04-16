import GradientButton from '@/Components/ui/GradientButton';
import SplashBackground from '@/Components/ui/SplashBackground';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const splashBubble = require('../../assets/images/splash_bubble.png');
const splashHeart = require('../../assets/images/splash_heart.png');

export default function Splash4() {
  const router = useRouter();

  return (
    <SplashBackground gradientColors={['#000000', '#B33E1A']}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/login')}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.textWrapper}>
            <Image source={splashBubble} style={styles.bubbleImage} resizeMode="contain" />
            <Image source={splashHeart} style={styles.heartImage} resizeMode="contain" />

            <View style={styles.progressRow}>
              <View style={styles.dotsContainer}>
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={[styles.dot, styles.activeDot]} />
                <View style={styles.dot} />
              </View>
              <View style={styles.stepPill}>
                <Text style={styles.stepText}>Step 3 of 4</Text>
              </View>
            </View>

            <View style={styles.titleContainer}>
              <Text style={styles.title}>Grow & Earn</Text>
              <Text style={styles.title}>Together</Text>
            </View>
            <Text style={styles.subtitle}>
              Launch campaigns, track {"\n"}performance, and turn your {"\n"}creativity into a thriving business.
            </Text>
          </View>

          <GradientButton
            title="Next"
            onPress={() => router.push('/onboarding/splash5')}
            containerStyle={styles.buttonContainer}
          />
        </View>
      </SafeAreaView>
    </SplashBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 10, zIndex: 20 },
  skipText: { fontFamily: 'Poppins-Regular', color: '#fff', fontSize: 16 },
  content: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 40, paddingHorizontal: 20, zIndex: 20 },
  textWrapper: { width: '100%', alignItems: 'center', marginBottom: 40, position: 'relative' },
  bubbleImage: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 80,
    height: 90,
    zIndex: 10,
    transform: [{ rotate: '14.75deg' }],
  },
  heartImage: {
    position: 'absolute',
    top: 50,
    right: -45,
    width: 80,
    height: 80,
    zIndex: 10,
  },
  progressRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, paddingHorizontal: 16 },
  dotsContainer: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  activeDot: { width: 24, backgroundColor: '#FF6B35' },
  stepPill: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  stepText: { fontFamily: 'Inter-Medium', color: '#fff', fontSize: 12, fontWeight: '600' },
  titleContainer: { alignItems: 'center', marginBottom: 12, paddingHorizontal: 16 },
  title: { fontFamily: 'Poppins-Bold', fontSize: 32, color: '#fff', textAlign: 'center', lineHeight: 40 },
  subtitle: { fontFamily: 'Poppins-Regular', fontSize: 16, color: '#E0E0E0', textAlign: 'center', paddingHorizontal: 10, lineHeight: 24 },
  buttonContainer: { width: '100%', zIndex: 20 }
});
