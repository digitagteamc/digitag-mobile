import GradientButton from '@/Components/ui/GradientButton';
import SplashBackground from '@/Components/ui/SplashBackground';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { BackHandler, Image, Platform, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const splashBubble = require('../../assets/images/splash_bubble.png');
const splashHeart = require('../../assets/images/splash_heart.png');

interface OnboardingStep {
  gradientColors: readonly [string, string, ...string[]];
  titles: string[];
  subtitle: string;
  buttonText: string;
  dotColor?: string;
  stepLabel?: string;
  activeIndex?: number;
  buttonColors?: readonly [string, string, ...string[]];
  buttonLocations?: readonly [number, number, ...number[]];
  buttonBorderColors?: readonly [string, string, ...string[]];
  buttonShadowColor?: string;
  buttonInsetTopColor?: string;
  buttonInsetBottomColor?: string;
  buttonTextColor?: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    gradientColors: ['#000000', '#621487'],
    titles: ["Your beauty × brand", "collaboration", "platform."],
    subtitle: "DigiTag",
    buttonText: "Get Started",
  },
  {
    gradientColors: ['#000000', '#1C265C'],
    titles: ["Discover Top", "Brands"],
    subtitle: "Connect with fashion labels, beauty \nbrands, and lifestyle companies ready to collaborate.",
    buttonText: "Next",
    dotColor: "#405BFF",
    stepLabel: "Step 1 of 4",
    activeIndex: 0,
    buttonColors: ['#253477', '#9198C6', '#253477'],
    buttonLocations: [0.1108, 0.4204, 0.959],
    buttonBorderColors: ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.08)'],
    buttonShadowColor: '#5C69AE',
    buttonInsetTopColor: '#5C69AE6E',
    buttonInsetBottomColor: '#253E9352',
  },
  {
    gradientColors: ['#000000', '#B01E68'],
    titles: ["Book Expert", "Creators"],
    subtitle: "Find makeup artists, hair stylists, photographers, editors & more for\nevery occasion.",
    buttonText: "Next",
    dotColor: "#E01E79",
    stepLabel: "Step 2 of 4",
    activeIndex: 1,
    buttonColors: ['#ED2A91', '#F15DAB', '#ED2A91'],
    buttonLocations: [0.1108, 0.4204, 0.959],
    buttonBorderColors: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.1)'],
    buttonShadowColor: '#ED2A91',
    buttonInsetTopColor: '#F15DAB6E',
    buttonInsetBottomColor: '#ED2A9152',
  },
  {
    gradientColors: ['#000000', '#B33E1A'],
    titles: ["Grow & Earn", "Together"],
    subtitle: "Launch campaigns, track\nperformance, and turn your\ncreativity into a thriving business.",
    buttonText: "Next",
    dotColor: "#FF6B35",
    stepLabel: "Step 3 of 4",
    activeIndex: 2,
    buttonColors: ['#B33E1A', '#FF6B35', '#B33E1A'],
    buttonLocations: [0.1108, 0.4204, 0.959],
    buttonBorderColors: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.1)'],
    buttonShadowColor: '#FF6B35',
    buttonInsetTopColor: '#FF6B356E',
    buttonInsetBottomColor: '#B33E1A52',
  },
  {
    gradientColors: ['#000000', '#566B00'],
    titles: ["Scale Your", "Agency Faster"],
    subtitle: "Handle clients, campaigns, and\nanalytics—all in one powerful\nplatform.",
    buttonText: "Get Started",
    dotColor: "#C1E300",
    stepLabel: "Step 4 of 4",
    activeIndex: 3,
    buttonColors: ['#566B00', '#C1E300', '#566B00'],
    buttonLocations: [0.1108, 0.4204, 0.959],
    buttonBorderColors: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.1)'],
    buttonShadowColor: '#C1E300',
    buttonInsetTopColor: '#C1E3006E',
    buttonInsetBottomColor: '#566B0052',
    buttonTextColor: '#000000',
  },
];

export default function Splash1() {
  const router = useRouter();
  const { step } = useLocalSearchParams<{ step?: string }>();
  const { width: screenW, height: screenH } = useWindowDimensions();
  
  // Initialize with step from params if valid, otherwise start at 0
  const initialStep = step ? parseInt(step, 10) : 0;
  const [currentStep, setCurrentStep] = useState(isNaN(initialStep) ? 0 : Math.min(initialStep, ONBOARDING_STEPS.length - 1));
  
  const data = ONBOARDING_STEPS[currentStep];

  // Responsive decorative sizes: scale with screen width but cap for tablets,
  // and step down further on short phones so the 3D ornaments never crowd the
  // text/button stack at the bottom of the screen.
  const isCompact = screenH < 720;
  const bubbleSize = Math.round(Math.min(150, screenW * (isCompact ? 0.30 : 0.36)));
  const heartSize = Math.round(Math.min(130, screenW * (isCompact ? 0.26 : 0.32)));

  // Reserve a content zone at the bottom ~42% of the viewport for text + CTA
  // (or ~48% on short phones). Decorative ornaments sit outside that zone.
  const contentReserve = isCompact ? 0.48 : 0.42;
  const safeArea = screenH * (1 - contentReserve);

  // Bubble pinned near bottom-left, Heart near middle-right
  const bubbleBottom = isCompact ? 40 : 60;
  const heartBottom = isCompact ? 160 : 190;
  const titleFontSize = isCompact ? 26 : 32;
  const titleLineHeight = isCompact ? 32 : 38;
  const subtitleFontSize = currentStep === 0 ? (isCompact ? 20 : 24) : (isCompact ? 14 : 16);
  const subtitleLineHeight = currentStep === 0 ? (isCompact ? 26 : 30) : (isCompact ? 22 : 26);

  useEffect(() => {
    const handleBackPress = () => {
      if (currentStep > 0) {
        setCurrentStep((prev) => prev - 1);
        return true; // prevent default behavior
      }
      return false; // allow default behavior
    };

    const backHandlerSubscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => {
      backHandlerSubscription.remove();
    };
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.replace('/role-selection');
    }
  };

  const handleSkip = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.replace('/role-selection');
    }
  };

  return (
    <SplashBackground gradientColors={data.gradientColors}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      <SafeAreaView className="flex-1" edges={Platform.OS === 'ios' ? ['top', 'left', 'right'] : ['top', 'bottom', 'left', 'right']}>

        {/* Floating 3D decorations — positioned relative to screen height so
            they never overlap the text/button area on any device size. */}
        <Image
          source={splashBubble}
          style={{
            position: 'absolute',
            bottom: bubbleBottom,
            left: -Math.round(bubbleSize * 0.4),
            width: bubbleSize,
            height: bubbleSize,
            transform: [{ rotate: '12deg' }],
            zIndex: 10,
          }}
          resizeMode="contain"
        />
        <Image
          source={splashHeart}
          style={{
            position: 'absolute',
            bottom: heartBottom,
            right: -Math.round(heartSize * 0.4),
            width: heartSize,
            height: heartSize,
            zIndex: 10,
          }}
          resizeMode="contain"
        />

        {/* Header (Skip) - Only show for onboarding steps */}
        {currentStep > 0 && (
          <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            className="items-end px-5 pt-[10px] z-20"
          >
            <TouchableOpacity onPress={handleSkip}>
              <Text className="font-poppins-regular text-white text-base">Skip</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <View className={`flex-1 justify-end items-center ${Platform.OS === 'ios' ? 'pb-8' : 'pb-6'} px-5 z-20`}>
          <View className={`w-full items-center ${isCompact ? 'mb-6' : 'mb-10'} relative`}>
            {/* Text Content */}
            {currentStep > 0 && (
              <Animated.View
                key={`progress-${currentStep}`}
                entering={FadeIn}
                exiting={FadeOut}
                className={`flex-row w-full justify-between items-center ${isCompact ? 'mb-[20px]' : 'mb-[30px]'} px-4`}
              >
                <View className="flex-row gap-2 items-center">
                  {[0, 1, 2, 3].map((idx) => (
                    <View
                      key={idx}
                      style={{
                        backgroundColor: idx === data.activeIndex ? data.dotColor : 'rgba(255,255,255,0.2)'
                      }}
                      className={idx === data.activeIndex ? "w-6 h-1.5 rounded-full" : "w-1.5 h-1.5 rounded-full"}
                    />
                  ))}
                </View>
                <View className="bg-white/15 px-3 py-1.5 rounded-[20px]">
                  <Text className="font-inter-medium text-white text-[12px] font-semibold">{data.stepLabel}</Text>
                </View>
              </Animated.View>
            )}

            {/* Text Content */}
            <Animated.View
              key={`content-${currentStep}`}
              entering={FadeIn.duration(600)}
              exiting={FadeOut.duration(600)}
              className="w-full items-center"
            >
              <View className={`items-center ${isCompact ? 'mb-3' : 'mb-5'} px-4`}>
                {data.titles.map((title, i) => (
                  <Text
                    key={i}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    className="font-poppins-bold text-white text-center"
                    style={{ fontSize: titleFontSize, lineHeight: titleLineHeight }}
                  >
                    {title}
                  </Text>
                ))}
              </View>
              <View className="items-center px-4">
                <Text
                  className="font-poppins-regular text-[#E0E0E0] text-center px-2.5 pb-1"
                  style={{ fontSize: subtitleFontSize, lineHeight: subtitleLineHeight }}
                >
                  {data.subtitle}
                </Text>
              </View>
            </Animated.View>
          </View>

          <GradientButton
            title={data.buttonText}
            onPress={handleNext}
            colors={data.buttonColors}
            locations={data.buttonLocations}
            borderColors={data.buttonBorderColors}
            shadowColor={data.buttonShadowColor}
            insetTopColor={data.buttonInsetTopColor}
            insetBottomColor={data.buttonInsetBottomColor}
            textStyle={{ color: data.buttonTextColor || '#FFFFFF' }}
            className={`${currentStep === 0 ? "w-[250px]" : "w-[250px]"} ${isCompact ? 'mb-[20px]' : 'mb-[30px]'} z-20 py-2`}
          />

          {currentStep === 0 && (
            <Animated.Text
              entering={FadeIn}
              className={`font-poppins-extralight ${isCompact ? 'text-[15px] leading-[20px]' : 'text-[18px] leading-[24px]'} text-[#b4b4b4] text-center mt-[5px] z-20`}
            >
              By Continuing. You accept our{' '}
              <Text className="text-white underline">Terms and Privacy Policy</Text>
            </Animated.Text>
          )}
        </View>
      </SafeAreaView>
    </SplashBackground>
  );
}
