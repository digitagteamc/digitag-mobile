import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Image,
    Linking,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { getPrivacySettings, updatePrivacySettings } from '../services/userService';

export default function PrivacySettingsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
    const { token } = useAuth();

    // Deletion isn't self-serve — it's handled by support over email so a
    // human confirms it's really the account owner asking.
    const handleRequestAccountDeletion = () => {
        const subject = encodeURIComponent('Account Deletion Request');
        const body = encodeURIComponent('Please delete my DigiTag account.\n\nRegistered mobile number: ');
        Linking.openURL(`mailto:support@thedigitag.ai?subject=${subject}&body=${body}`).catch(() => {});
    };

    // Custom Animated Switch Component (same as in settings.tsx)
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

    const [profileVisibility, setProfileVisibility] = useState(true);
    const [locationTracking, setLocationTracking] = useState(true);
    const [onlineStatus, setOnlineStatus] = useState(true);

    useEffect(() => {
        if (!token) return;
        (async () => {
            const res = await getPrivacySettings(token);
            if (res.success && res.data) {
                setProfileVisibility(res.data.isDiscoverable);
                setOnlineStatus(res.data.showOnlineStatus);
            }
        })();
    }, [token]);

    // Auto-saves on every toggle — there is no separate "Save" step, so the
    // switch always reflects what's persisted server-side.
    const savePrivacy = (patch: Partial<{ isDiscoverable: boolean; showOnlineStatus: boolean }>) => {
        if (!token) return;
        updatePrivacySettings(token, patch);
    };

    return (
        <View className="flex-1 bg-[#0A0A0A]">
            <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

            {/* Top purple glow gradient */}
            <LinearGradient
                colors={['rgba(98, 50, 255, 0.15)', 'transparent']}
                className="absolute top-0 left-0 right-0 h-[400px]"
            />

            <SafeAreaView className="flex-1" edges={['bottom', 'left', 'right']}>
                {/* ── STICKY HEADER ── */}
                <View
                    className="px-5 mb-4"
                    style={{ paddingTop: Math.max(insets.top, statusBarHeight) + 16 }}
                >
                    <View className="flex-row items-center mb-2">
                        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text className="text-white text-[24px] font-poppins-medium tracking-wide">Privacy Settings</Text>
                    </View>
                    <Text className="text-[#E2E2E2] text-[12px] font-poppins-regular ml-2">Control who can see your information</Text>
                </View>

                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── VISIBILITY SECTION ── */}
                    <View className="px-5 mb-8">
                        <View className="bg-[#121212] border border-[#2A2A2A] rounded-3xl px-2 py-2">
                            {/* Profile Visibility */}
                            <View className="flex-row items-center py-3.5 px-3 border-b border-[#2A2A2A]">
                                <View className="w-10 h-10 items-center justify-center mr-4">
                                    <Image 
                                        source={require('../assets/profile-visibilty-icon.png')} 
                                        style={{ width: 36, height: 36 }} 
                                        resizeMode="contain" 
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-[#fff] text-[16px] font-poppins-regular">Profile Visibility</Text>
                                    <Text className="text-[#D6D6D6] text-[12px] font-poppins-regular">Show my profile in search results</Text>
                                </View>
                                <CustomSwitch
                                    value={profileVisibility}
                                    onValueChange={(v) => { setProfileVisibility(v); savePrivacy({ isDiscoverable: v }); }}
                                />
                            </View>

                            {/* Location Tracking */}
                            {/* <View className="flex-row items-center py-3.5 px-3 border-b border-[#2A2A2A]">
                                <View className="w-10 h-10 rounded-full bg-[#1A1A1A] items-center justify-center border border-[#F26930]/30 mr-4">
                                    <Ionicons name="location-outline" size={20} color="#E0E0E0" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-[#E0E0E0] text-[15px] font-poppins-medium">Location Tracking</Text>
                                    <Text className="text-[#8A8A8A] text-[12px] font-poppins-regular">Allow location tracking for personalized recommendations</Text>
                                </View>
                                <CustomSwitch value={locationTracking} onValueChange={setLocationTracking} />
                            </View> */}

                            {/* Online Status */}
                            <View className="flex-row items-center py-3.5 px-3">
                                <View className="w-10 h-10 items-center justify-center mr-4">
                                    <Image 
                                        source={require('../assets/show-online-icon.png')} 
                                        style={{ width: 36, height: 36 }} 
                                        resizeMode="contain" 
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-[#fff] text-[16px] font-poppins-regular">Show Online Status</Text>
                                    <Text className="text-[#D6D6D6] text-[12px] font-poppins-regular">Let others see when you're online</Text>
                                </View>
                                <CustomSwitch
                                    value={onlineStatus}
                                    onValueChange={(v) => { setOnlineStatus(v); savePrivacy({ showOnlineStatus: v }); }}
                                />
                            </View>
                        </View>
                    </View>

                    {/* ── SAVED ITEMS PRIVACY ── */}
                    {/* <View className="px-5 mb-8">
                        <Text className="text-white text-[17px] font-poppins-semibold mb-4">Saved Items Privacy</Text>

                        <View className="mb-4">
                            <Text className="text-[#E0E0E0] text-[14px] font-poppins-regular mb-2 ml-1">Who can see your saved posts?</Text>
                            <TouchableOpacity className="bg-[#1A1A1A] h-[56px] px-4 rounded-[16px] border border-[#2A2A2A] flex-row items-center justify-between">
                                <Text className="text-white font-poppins-regular text-[15px]">Only You</Text>
                                <Ionicons name="chevron-down" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <View className="mb-4">
                            <Text className="text-[#E0E0E0] text-[14px] font-poppins-regular mb-2 ml-1">Who can see your Requirements?</Text>
                            <TouchableOpacity className="bg-[#1A1A1A] h-[56px] px-4 rounded-[16px] border border-[#2A2A2A] flex-row items-center justify-between">
                                <Text className="text-white font-poppins-regular text-[15px]">Everyone</Text>
                                <Ionicons name="chevron-down" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View> */}

                    {/* ── ACCOUNT DELETION ── */}
                    <View className="px-5 mb-8">
                        <Text className="text-white text-[20px] font-poppins-medium mb-4">Account Deletion</Text>
                        <TouchableOpacity
                            className="bg-[#121212]/50 border border-[#2A2A2A] rounded-3xl p-4"
                            onPress={handleRequestAccountDeletion}
                            activeOpacity={0.75}
                        >
                            <Text className="text-[#E30000] text-[20px] font-poppins-medium mb-1">Request Account Deletion</Text>
                            <Text className="text-[#D6D6D6] text-[12px] font-poppins-regular">Email our support team to permanently delete your account and all data</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
