import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import GradientButton from '@/Components/ui/GradientButton';
import { StatusBar } from 'expo-status-bar';
import SplashBackground from '@/Components/ui/SplashBackground';

const splashBubble = require('../../assets/images/splash_bubble.png');
const splashHeart = require('../../assets/images/splash_heart.png');

export default function Splash5() {
  const router = useRouter();

  return (
    <SplashBackground gradientColors={['#000000', '#566B00']}>
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
                  <View style={styles.dot} />
                  <View style={[styles.dot, styles.activeDot]} />
              </View>
              <View style={styles.stepPill}>
                  <Text style={styles.stepText}>Step 4 of 4</Text>
              </View>
            </View>

            <View style={styles.titleContainer}>
              <Text style={styles.title}>Scale Your</Text>
              <Text style={styles.title}>Agency Faster</Text>
            </View>
            <Text style={styles.subtitle}>
              Handle clients, campaigns, and {'\n'}analytics—all in one powerful {"\n"} platform.
            </Text>
          </View>

          <GradientButton 
            title="Get Started" 
            onPress={() => router.replace('/login')} 
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
  activeDot: { width: 24, backgroundColor: '#C1E300' },
  stepPill: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  stepText: { fontFamily: 'Inter-Medium', color: '#fff', fontSize: 12, fontWeight: '600' },
  titleContainer: { alignItems: 'center', marginBottom: 12, paddingHorizontal: 16 },
  title: { fontFamily: 'Poppins-Bold', fontSize: 32, color: '#fff', textAlign: 'center', lineHeight: 40 },
  subtitle: { fontFamily: 'Poppins-Regular', fontSize: 16, color: '#E0E0E0', textAlign: 'center', paddingHorizontal: 10, lineHeight: 24 },
  buttonContainer: { width: '100%', zIndex: 20 }
});
