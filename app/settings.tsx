import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface AccountItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { userRole } = useAuth();
  const insets = useSafeAreaInsets();
  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Custom Animated Switch Component
  const CustomSwitch = ({ value, onValueChange }: { value: boolean, onValueChange: (v: boolean) => void }) => {
    const thumbStyle = useAnimatedStyle(() => {
      return {
        transform: [{ translateX: withSpring(value ? 18 : 0, { damping: 15, stiffness: 120 }) }],
        backgroundColor: withTiming(value ? '#FFFFFF' : '#6232FF', { duration: 200 }),
      };
    });

    const trackStyle = useAnimatedStyle(() => {
      return {
        backgroundColor: withTiming(value ? '#6232FF' : 'transparent', { duration: 200 }),
        borderColor: '#6232FF',
      };
    });

    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => onValueChange(!value)}
      >
        <Animated.View
          style={trackStyle}
          className="w-12 h-6 rounded-full border-[1.5px] px-[3px] justify-center"
        >
          <Animated.View
            style={thumbStyle}
            className="w-[16px] h-[16px] rounded-full"
          />
        </Animated.View>
      </TouchableOpacity>
    );
  };
  const navigatingRef = useRef(false);

  const safeNavigate = (action: () => void) => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    action();
    setTimeout(() => { navigatingRef.current = false; }, 800);
  };

  const ACCOUNT_ITEMS: AccountItem[] = [
    {
      id: 'edit-profile',
      icon: 'person-outline',
      label: 'Edit Profile',
      onPress: () => safeNavigate(() => {
        const editPath = userRole?.toUpperCase() === 'FREELANCER' ? '/signup/freelancer' : '/signup/creator';
        router.navigate(editPath as any);
      }),
    },
    {
      id: 'privacy',
      icon: 'shield-checkmark-outline',
      label: 'Privacy Settings',
      onPress: () => safeNavigate(() => router.navigate('/privacysettings' as any)),
    },
    {
      id: 'terms',
      icon: 'document-text-outline',
      label: 'Terms & Conditions',
      onPress: () => Linking.openURL('https://digitag.in/terms').catch(() => { }),
    },
    {
      id: 'privacy-policy',
      icon: 'reader-outline',
      label: 'Privacy Policy',
      onPress: () => Linking.openURL('https://digitag.in/privacy-policy').catch(() => { }),
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
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 20, paddingTop: Math.max(insets.top, statusBarHeight) + 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── HEADER ── */}
          <View className="flex-row items-center px-5 mb-8">
            <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text className="text-white text-[22px] font-poppins-semibold tracking-wide">Settings</Text>
          </View>

          {/* ── ACCOUNT SECTION ── */}
          <View className="px-5 mb-8">
            <Text className="text-white text-[17px] font-poppins-semibold mb-4">Account</Text>

            <View className="bg-[#121212] border border-[#2A2A2A] rounded-3xl px-2 py-2">
              {ACCOUNT_ITEMS.map((item, index) => (
                <React.Fragment key={item.id}>
                  <TouchableOpacity
                    className="flex-row items-center py-3.5 px-3"
                    activeOpacity={0.7}
                    onPress={item.onPress}
                  >
                    <View className="w-10 h-10 rounded-full bg-[#1A1A1A] items-center justify-center border border-[#F26930]/30 mr-4">
                      <Ionicons name={item.icon} size={20} color="#E0E0E0" />
                      {item.id === 'edit-profile' && (
                        <View className="absolute -bottom-1 -right-1 bg-[#6232FF] w-5 h-5 rounded-full items-center justify-center border border-[#121212]">
                          <Ionicons name="pencil" size={10} color="#fff" />
                        </View>
                      )}
                    </View>
                    <Text className="text-[#E0E0E0] text-[15px] flex-1 font-poppins-medium">{item.label}</Text>
                    <Ionicons name="chevron-forward" size={20} color="#E0E0E0" />
                  </TouchableOpacity>

                  {index < ACCOUNT_ITEMS.length - 1 && <View className="h-[1px] bg-[#2A2A2A] mx-3" />}
                </React.Fragment>
              ))}
            </View>
          </View>

          {/* ── PREFERENCES SECTION ── */}
          <View className="px-5">
            <Text className="text-white text-[17px] font-poppins-semibold mb-4">Preferences</Text>

            <View className="bg-[#121212] border border-[#2A2A2A] rounded-3xl px-2 py-2">
              {/* Notifications row */}
              <View className="flex-row items-center py-3.5 px-3">
                <View className="w-10 h-10 rounded-full bg-[#1A1A1A] items-center justify-center border border-[#F26930]/30 mr-4">
                  <Ionicons name="notifications-outline" size={20} color="#E0E0E0" />
                </View>
                <Text className="text-[#E0E0E0] text-[15px] flex-1 font-poppins-medium">Notifications</Text>
                <CustomSwitch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                />
              </View>
            </View>
          </View>

        </ScrollView>

        {/* ── APP VERSION FOOTER ── */}
        <View className="h-[60px] bg-[#1A1A1A] flex-row items-center justify-center border-t border-[#2A2A2A]">
          <Text className="text-[#E0E0E0] text-[14px] font-poppins-regular">App Version </Text>
          <Text className="text-white text-[14px] font-poppins-bold">1.0.0</Text>
        </View>
      </SafeAreaView>

    </View>
  );
}
