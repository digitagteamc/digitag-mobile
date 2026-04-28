import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AboutDigitagScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

  const FEATURES = [
    {
      id: 1,
      icon: 'people-outline' as const,
      title: 'Connect with Professionals',
      description: 'Network with agencies, creators, and brands in the digital marketing space',
    },
    {
      id: 2,
      icon: 'document-text-outline' as const,
      title: 'Post Requirements',
      description: 'Create and share your collaboration needs with the right audience',
    },
    {
      id: 3,
      icon: 'notifications-outline' as const,
      title: 'Real-time Updates',
      description: 'Stay updated with instant notifications and live chat features',
    },
  ];

  return (
    <View className="flex-1 bg-[#0A0A0A]">
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      {/* Top purple glow gradient */}
      <LinearGradient
        colors={['rgba(98, 50, 255, 0.15)', 'transparent']}
        className="absolute top-0 left-0 right-0 h-[250px]"
      />

      <SafeAreaView className="flex-1" edges={['bottom', 'left', 'right']}>

        {/* ── STICKY HEADER ── */}
        <View
          className="px-5 mb-6"
          style={{ paddingTop: Math.max(insets.top, statusBarHeight) + 16 }}
        >
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text className="text-white text-[22px] font-poppins-semibold tracking-wide">About Digitag</Text>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── OUR MISSION ── */}
          <View className="px-5 mb-10">
            <Text className="text-white text-[17px] font-poppins-semibold mb-4 ml-1">Our Mission</Text>
            <Text className="text-[#8A8A8A] text-[14px] font-poppins-regular leading-6 mb-4">
              Digitag is a revolutionary platform designed to bridge the gap between agencies, content creators, and brands. We're building a community where collaboration happens seamlessly and opportunities are just a tap away.
            </Text>
            <Text className="text-[#8A8A8A] text-[14px] font-poppins-regular leading-6">
              Our vision is to create the most trusted and efficient marketplace for digital collaborations, empowering professionals to grow their network and business.
            </Text>
          </View>

          {/* ── KEY FEATURES ── */}
          <View className="px-5 mb-10">
            <Text className="text-white text-[17px] font-poppins-semibold mb-4 ml-1">Key Features</Text>
            <View className="bg-[#121212] border border-[#2A2A2A] rounded-3xl px-2 py-2">
              {FEATURES.map((feature, index) => (
                <React.Fragment key={feature.id}>
                  <View className="flex-row items-center py-4 px-3">
                    <View className="w-10 h-10 rounded-full bg-[#1A1A1A] items-center justify-center border border-[#F26930]/30 mr-4">
                      <Ionicons name={feature.icon} size={20} color="#E0E0E0" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[#E0E0E0] text-[15px] font-poppins-medium mb-0.5">{feature.title}</Text>
                      <Text className="text-[#8A8A8A] text-[12px] font-poppins-regular leading-5">{feature.description}</Text>
                    </View>
                  </View>
                  {index < FEATURES.length - 1 && (
                    <View className="h-[1px] bg-[#2A2A2A] mx-3" />
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>

          {/* ── LEGAL & PRIVACY ── */}
          <View className="px-5 mb-8">
            <Text className="text-white text-[17px] font-poppins-semibold mb-4 ml-1">Legal & Privacy</Text>
            <TouchableOpacity
              className="bg-[#121212] border border-[#2A2A2A] rounded-[20px] p-4 flex-row items-center justify-between"
              activeOpacity={0.8}
              onPress={() => router.push('/privacysettings')}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-[#1A1A1A] items-center justify-center border border-[#F26930]/30 mr-4">
                  <Ionicons name="shield-checkmark-outline" size={20} color="#E0E0E0" />
                </View>
                <Text className="text-[#E0E0E0] text-[15px] font-poppins-medium">Legal & Privacy</Text>
              </View>
              <Ionicons name="arrow-up-outline" size={24} color="#7352DD" style={{ transform: [{ rotate: '45deg' }] }} />
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
