import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface AccountItem {
  id: string;
  icon: any;
  label: string;
  onPress: () => void;
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

  const ACCOUNT_ITEMS: AccountItem[] = [
    {
      id: 'privacy',
      icon: require('../assets/privacy-icon.png'),
      label: 'Privacy Settings',
      onPress: () => router.push('/privacysettings' as any),
    },
    {
      id: 'blocked',
      icon: require('../assets/privacy-icon.png'),
      label: 'Blocked Accounts',
      onPress: () => router.push('/blocked-users' as any),
    },
    {
      id: 'terms',
      icon: require('../assets/terms-icon.png'),
      label: 'Terms & Conditions',
      onPress: () => Linking.openURL('https://thedigitag.ai/terms-and-conditions').catch(() => { }),
    },
    {
      id: 'privacy policy',
      icon: require('../assets/privacy-icon.png'),
      label: 'Privacy Policy',
      onPress: () => Linking.openURL('https://thedigitag.ai/privacy-policy').catch(() => { }),
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
                    <View className="w-10 h-10  items-center justify-center   mr-4">
                      <Image
                        source={item.icon}
                        style={{ width: 36, height: 36 }}
                        resizeMode="contain"
                      />
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
        </ScrollView>

        {/* ── APP VERSION FOOTER ── */}
        <View className="h-[60px] bg-[#1A1A1A] flex-row items-center justify-center border-t border-[#2A2A2A]">
          <Text className="text-[#E0E0E0] text-[14px] font-poppins-regular">App Version </Text>
          <Text className="text-white text-[14px] font-poppins-bold">{Constants.expoConfig?.version ?? '1.0.2'}</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
