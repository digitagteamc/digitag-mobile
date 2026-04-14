import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import GradientButton from '@/Components/ui/GradientButton';
import { StatusBar } from 'expo-status-bar';
import SplashBackground from '@/Components/ui/SplashBackground';

const splashBubble = require('../../assets/images/splash_bubble.png');
const splashHeart = require('../../assets/images/splash_heart.png');

export default function Splash1() {
  const router = useRouter();

  return (
    <SplashBackground>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      {/* Content */}
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <View style={styles.content}>
          {/* Text block wrapper to safely anchor floating images relative to the text */}
          <View style={styles.textWrapper}>
            {/* Floating 3D Elements */}
            <Image source={splashBubble} style={styles.bubbleImage} resizeMode="contain" />
            <Image source={splashHeart} style={styles.heartImage} resizeMode="contain" />

            <View style={styles.titleContainer}>
              <Text style={styles.title}>
                Your beauty × brand
              </Text>
              <Text style={styles.title}>
                collaboration platform.
              </Text>
            </View>
            <Text style={styles.subtitle}>DigiTag</Text>
          </View>

          <GradientButton 
            title="Get Started" 
            onPress={() => {
              router.push('/onboarding/splash2');
            }} 
            containerStyle={styles.buttonContainer}
          />

          <Text style={styles.termsText}>
            By Continuing. You accept our{' '}
            <Text style={styles.termsLink}>Terms and Privacy Policy</Text>
          </Text>
        </View>
      </SafeAreaView>
    </SplashBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 20,
    zIndex: 20,
  },
  textWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40, // Space before the button
    position: 'relative',
  },
  bubbleImage: {
    position: 'absolute',
    bottom: -60, // move down slightly
    left: -50, // move further left
    width: 100, // smaller
    height: 100,
    zIndex: 10,
    transform: [{ rotate: '14.75deg' }],
  },
  heartImage: {
    position: 'absolute',
    top: 0, // align parallel to title
    right: -45, // push off to right edge
    width: 80, // smaller
    height: 80,
    zIndex: 10,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 28,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 38,
  },
  subtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 22,
    color: '#fff',
    textAlign: 'center',
    marginTop: 10,
  },
  buttonContainer: {
    width: 250,
    marginBottom: 30,
    zIndex: 20,
  },
  termsText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#b4b4b4',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 10,
    zIndex: 20,
  },
  termsLink: {
    color: '#fff',
    textDecorationLine: 'underline',
  },
});
