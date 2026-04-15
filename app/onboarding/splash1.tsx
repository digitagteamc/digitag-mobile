import React, { useState } from 'react';
import { Text, View, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import GradientButton from '@/Components/ui/GradientButton';
import { StatusBar } from 'expo-status-bar';
import SplashBackground from '@/Components/ui/SplashBackground';
import Animated, { FadeIn, FadeOut, FadeInDown, FadeOutUp } from 'react-native-reanimated';

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
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    gradientColors: ['#000000', '#621487'],
    titles: ["Your beauty × brand", "collaboration platform."],
    subtitle: "DigiTag",
    buttonText: "Get Started",
  },
  {
    gradientColors: ['#000000', '#1C265C'],
    titles: ["Discover Top", "Brands"],
    subtitle: "Connect with fashion labels, beauty brands, and lifestyle companies ready to collaborate.",
    buttonText: "Next",
    dotColor: "#405BFF",
    stepLabel: "Step 1 of 4",
    activeIndex: 0,
  },
  {
    gradientColors: ['#000000', '#B01E68'],
    titles: ["Book Expert", "Creators"],
    subtitle: "Find makeup artists, hair stylists, photographers, editors & more for every occasion.",
    buttonText: "Next",
    dotColor: "#E01E79",
    stepLabel: "Step 2 of 4",
    activeIndex: 1,
  },
  {
    gradientColors: ['#000000', '#B33E1A'],
    titles: ["Grow & Earn", "Together"],
    subtitle: "Launch campaigns, track performance, and turn your creativity into a thriving business.",
    buttonText: "Next",
    dotColor: "#FF6B35",
    stepLabel: "Step 3 of 4",
    activeIndex: 2,
  },
  {
    gradientColors: ['#000000', '#566B00'],
    titles: ["Scale Your", "Agency Faster"],
    subtitle: "Handle clients, campaigns, and analytics—all in one powerful platform.",
    buttonText: "Get Started",
    dotColor: "#C1E300",
    stepLabel: "Step 4 of 4",
    activeIndex: 3,
  },
];

export default function Splash1() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const data = ONBOARDING_STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.replace('/login');
    }
  };

  const handleSkip = () => {
    router.replace('/login');
  };

  return (
    <SplashBackground gradientColors={data.gradientColors}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      <SafeAreaView className="flex-1" edges={['top', 'bottom', 'left', 'right']}>
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

        <View className="flex-1 justify-end items-center pb-10 px-5 z-20">
          <View className="w-full items-center mb-10 relative">
            {/* Floating 3D Elements */}
            <Image 
              source={splashBubble} 
              className="absolute -bottom-[50px] -left-[50px] w-[100px] h-[100px] z-10 rotate-[14.75deg]" 
              resizeMode="contain" 
            />
            <Image 
              source={splashHeart} 
              className="absolute top-0 -right-[45px] w-[80px] h-[80px] z-10" 
              resizeMode="contain" 
            />

            {/* Progress Row - Only show for onboarding steps */}
            {currentStep > 0 && (
              <Animated.View 
                key={`progress-${currentStep}`}
                entering={FadeIn}
                exiting={FadeOut}
                className="flex-row w-full justify-between items-center mb-[30px] px-4"
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
              <View className="items-center mb-3 px-4">
                {data.titles.map((title, i) => (
                  <Text 
                    key={i} 
                    className="font-poppins-bold text-[32px] text-white text-center leading-[40px]"
                  >
                    {title}
                  </Text>
                ))}
              </View>
              <Text className="font-poppins-regular text-base text-[#E0E0E0] text-center px-2.5 leading-6">
                {data.subtitle}
              </Text>
            </Animated.View>
          </View>

          <GradientButton 
            title={data.buttonText}
            onPress={handleNext} 
            className={`${currentStep === 0 ? "w-[250px]" : "w-full"} mb-[30px] z-20`}
          />

          {currentStep === 0 && (
            <Animated.Text 
              entering={FadeIn}
              className="font-poppins-regular text-sm text-[#b4b4b4] text-center leading-5 mt-[10px] z-20"
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
