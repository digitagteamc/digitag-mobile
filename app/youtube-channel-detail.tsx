import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    FlatList,
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import PreviewAdSheet from './brands/PreviewAdSheet';
import { fonts } from '../theme/colors';

const DUMMY_AD_TYPES = [
    { id: 'ad-1', name: 'Strip Ad', accentColor: '#15112E' },
    { id: 'ad-2', name: 'Banner Ad', accentColor: '#DADAFF' },
    { id: 'ad-3', name: 'Corner Ads', accentColor: '#F1CEFF' },
    { id: 'ad-4', name: 'L - Shape Ads', accentColor: '#F5C344' },
];

function formatNumber(val: any): string {
    if (!val) return '0';
    if (typeof val === 'string') return val;
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
    return String(val);
}

export default function YoutubeChannelDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        channelId?: string;
        name?: string;
        handle?: string;
        subscriberCount?: string;
        category?: string;
        logoUrl?: string;
        videoCount?: string;
        viewCount?: string;
        description?: string;
        location?: string;
        joinedDate?: string;
    }>();

    const channelName = params.name || 'TechTalks';
    const channelCategory = params.category || 'Tech';
    const rawSubs = params.subscriberCount || '4.2M';
    const formattedSubs = isNaN(Number(rawSubs)) ? rawSubs : formatNumber(Number(rawSubs));
    const channelHandle = params.handle || `@${channelName.toLowerCase().replace(/\s+/g, '')}_official`;
    const videoCount = params.videoCount || '1.8K';
    const viewCount = params.viewCount || '320M';
    const description = params.description || `We cover the latest in tech, gadgets, AI & software. From in-depth reviews to beginner tutorials, ${channelName} is your go-to tech hub.`;
    const location = params.location || 'Mumbai, India';
    const joinedDate = params.joinedDate || 'Joined Jan 2018';
    const logoUrl = params.logoUrl || null;

    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isNotified, setIsNotified] = useState(false);
    const [selectedAdType, setSelectedAdType] = useState<string>(DUMMY_AD_TYPES[0].id);
    const [adSheetVisible, setAdSheetVisible] = useState(false);
    const [adSheetItem, setAdSheetItem] = useState<any | null>(null);

    // Initial letters fallback avatar
    const initials = channelName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'YT';

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#060606' }}>
            <StatusBar barStyle="light-content" backgroundColor="#060606" />

            {/* Top Navigation Bar */}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    backgroundColor: '#060606',
                    zIndex: 10,
                }}
            >
                <TouchableOpacity
                    onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as any))}
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                </TouchableOpacity>

                <Text style={{ color: '#FFFFFF', fontSize: 18, fontFamily: fonts.semibold }}>
                    Channel Profile
                </Text>

                <TouchableOpacity
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    activeOpacity={0.7}
                >
                    <Ionicons name="ellipsis-vertical" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {/* Banner with Gradient & Category Pill */}
                <View style={{ height: 140, width: '100%', position: 'relative' }}>
                    <LinearGradient
                        colors={['#6C47FF', '#49D2CF', '#00E5C3']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ width: '100%', height: '100%' }}
                    />
                    <View
                        style={{
                            position: 'absolute',
                            top: 14,
                            left: 16,
                            backgroundColor: 'rgba(0,0,0,0.3)',
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 12,
                        }}
                    >
                        <Text style={{ color: '#FFFFFF', fontSize: 10, fontFamily: fonts.medium }}>
                            ● {channelCategory}
                        </Text>
                    </View>
                </View>

                {/* Profile Header Avatar, Name & Handle */}
                <View style={{ alignItems: 'center', marginTop: -44 }}>
                    <LinearGradient
                        colors={['#6C47FF', '#00E5C3']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{
                            width: 88,
                            height: 88,
                            borderRadius: 44,
                            padding: 3,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <View
                            style={{
                                width: 82,
                                height: 82,
                                borderRadius: 41,
                                backgroundColor: '#12122A',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                            }}
                        >
                            {logoUrl ? (
                                <Image
                                    source={{ uri: logoUrl }}
                                    style={{ width: '100%', height: '100%' }}
                                />
                            ) : (
                                <Text
                                    style={{
                                        color: '#FFFFFF',
                                        fontSize: 26,
                                        fontFamily: fonts.bold,
                                        letterSpacing: 1,
                                    }}
                                >
                                    {initials}
                                </Text>
                            )}
                        </View>
                        {/* Verified Check Badge */}
                        <View
                            style={{
                                position: 'absolute',
                                bottom: 2,
                                right: 2,
                                backgroundColor: '#6C47FF',
                                borderRadius: 10,
                                width: 20,
                                height: 20,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: 2,
                                borderColor: '#060606',
                            }}
                        >
                            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                        </View>
                    </LinearGradient>

                    <Text
                        style={{
                            color: '#FFFFFF',
                            fontSize: 22,
                            fontFamily: fonts.semibold,
                            marginTop: 12,
                            textAlign: 'center',
                        }}
                    >
                        {channelName}
                    </Text>

                    <Text
                        style={{
                            color: '#A1A2A4',
                            fontSize: 13,
                            fontFamily: fonts.regular,
                            marginTop: 3,
                        }}
                    >
                        {channelHandle}
                    </Text>
                </View>

                {/* Channel Quick Stats Card */}
                <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
                    <View
                        style={{
                            backgroundColor: '#0F0F0F',
                            borderRadius: 16,
                            paddingVertical: 14,
                            paddingHorizontal: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-around',
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.05)',
                        }}
                    >
                        <View style={{ alignItems: 'center', flex: 1 }}>
                            <Text style={{ color: '#FFFFFF', fontSize: 18, fontFamily: fonts.bold }}>
                                {formattedSubs}
                            </Text>
                            <Text style={{ color: '#A1A2A4', fontSize: 11, fontFamily: fonts.regular, marginTop: 2 }}>
                                Subscribers
                            </Text>
                        </View>

                        <View style={{ width: 1, height: 32, backgroundColor: '#323232' }} />

                        <View style={{ alignItems: 'center', flex: 1 }}>
                            <Text style={{ color: '#FFFFFF', fontSize: 18, fontFamily: fonts.bold }}>
                                {videoCount}
                            </Text>
                            <Text style={{ color: '#A1A2A4', fontSize: 11, fontFamily: fonts.regular, marginTop: 2 }}>
                                Videos
                            </Text>
                        </View>

                        <View style={{ width: 1, height: 32, backgroundColor: '#323232' }} />

                        <View style={{ alignItems: 'center', flex: 1 }}>
                            <Text style={{ color: '#FFFFFF', fontSize: 18, fontFamily: fonts.bold }}>
                                {viewCount}
                            </Text>
                            <Text style={{ color: '#A1A2A4', fontSize: 11, fontFamily: fonts.regular, marginTop: 2 }}>
                                Views
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Subscribe & Notify Action Buttons */}
                <View
                    style={{
                        flexDirection: 'row',
                        paddingHorizontal: 16,
                        marginTop: 20,
                        gap: 12,
                    }}
                >
                    <TouchableOpacity
                        onPress={() => setIsSubscribed(!isSubscribed)}
                        style={{ flex: 2, height: 48, borderRadius: 24, overflow: 'hidden' }}
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={
                                isSubscribed
                                    ? ['#262631', '#1C1C24']
                                    : ['#1A8CFF', '#6633E5']
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{
                                flex: 1,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                borderRadius: 24,
                            }}
                        >
                            <Text style={{ color: '#FFFFFF', fontSize: 14, fontFamily: fonts.semibold }}>
                                {isSubscribed ? 'Subscribed' : 'Subscribe'}
                            </Text>
                            <Ionicons
                                name={isSubscribed ? 'checkmark-circle' : 'sparkles'}
                                size={16}
                                color="#FFFFFF"
                            />
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setIsNotified(!isNotified)}
                        style={{
                            width: 120,
                            height: 48,
                            borderRadius: 24,
                            backgroundColor: isNotified ? 'rgba(26,140,255,0.15)' : '#0F0F0F',
                            borderWidth: 1.5,
                            borderColor: '#1A8CFF',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                        }}
                        activeOpacity={0.85}
                    >
                        <Ionicons
                            name={isNotified ? 'notifications' : 'notifications-outline'}
                            size={18}
                            color="#FFFFFF"
                        />
                        <Text style={{ color: '#FFFFFF', fontSize: 13, fontFamily: fonts.semibold }}>
                            {isNotified ? 'Active' : 'Notify'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* About Section */}
                <View style={{ paddingHorizontal: 16, marginTop: 28 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 16, fontFamily: fonts.semibold }}>
                        About
                    </Text>

                    <View
                        style={{
                            backgroundColor: '#0F0F0F',
                            borderRadius: 14,
                            padding: 16,
                            marginTop: 12,
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.05)',
                        }}
                    >
                        <Text
                            style={{
                                color: '#A1A2A4',
                                fontSize: 12,
                                fontFamily: fonts.regular,
                                lineHeight: 18,
                            }}
                        >
                            {description}
                        </Text>
                    </View>

                    {/* Metadata Pills */}
                    <View style={{ flexDirection: 'row', marginTop: 12, gap: 10 }}>
                        <View
                            style={{
                                flex: 1,
                                backgroundColor: '#0F0F0F',
                                borderRadius: 16,
                                paddingVertical: 8,
                                paddingHorizontal: 12,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                            }}
                        >
                            <Ionicons name="location-outline" size={14} color="#A1A2A4" />
                            <Text
                                style={{ color: '#A1A2A4', fontSize: 11, fontFamily: fonts.regular }}
                                numberOfLines={1}
                            >
                                {location}
                            </Text>
                        </View>

                        <View
                            style={{
                                flex: 1,
                                backgroundColor: '#0F0F0F',
                                borderRadius: 16,
                                paddingVertical: 8,
                                paddingHorizontal: 12,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                            }}
                        >
                            <Ionicons name="calendar-outline" size={14} color="#A1A2A4" />
                            <Text
                                style={{ color: '#A1A2A4', fontSize: 11, fontFamily: fonts.regular }}
                                numberOfLines={1}
                            >
                                {joinedDate}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Ad Types Section */}
                <View style={{ paddingHorizontal: 16, marginTop: 28 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 16, fontFamily: fonts.semibold }}>
                        Ad Types
                    </Text>

                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={DUMMY_AD_TYPES}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ paddingTop: 12, gap: 10 }}
                        renderItem={({ item }) => {
                            const accent = item.accentColor || '#4F46E5';
                            const isActive = selectedAdType === item.id;
                            return (
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={() => {
                                        setSelectedAdType(item.id);
                                        setAdSheetItem(item);
                                        setAdSheetVisible(true);
                                    }}
                                    style={[
                                        {
                                            width: 118,
                                            borderRadius: 18,
                                            overflow: 'hidden',
                                            backgroundColor: accent,
                                            borderWidth: 1.5,
                                            borderColor: isActive ? '#6C47FF' : accent + '44',
                                        },
                                        isActive && {
                                            shadowColor: '#3B82F6',
                                            shadowOffset: { width: 0, height: 0 },
                                            shadowOpacity: 0.7,
                                            shadowRadius: 8,
                                            elevation: 6,
                                        },
                                    ]}
                                >
                                    {/* Thumbnail area */}
                                    <View
                                        style={{
                                            marginHorizontal: 10,
                                            marginTop: 10,
                                            height: 68,
                                            borderRadius: 14,
                                            backgroundColor: '#08080F',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {/* Play button */}
                                        <View
                                            style={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: 16,
                                                backgroundColor: isActive ? '#3B82F6' : '#1E1E2E',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Ionicons name="play" size={13} color="#fff" style={{ marginLeft: 2 }} />
                                        </View>
                                    </View>
                                    {/* Label */}
                                    <Text
                                        style={{
                                            fontSize: 11,
                                            fontFamily: fonts.semibold,
                                            color: isActive ? '#6C47FF' : '#000',
                                            textAlign: 'center',
                                            marginTop: 6,
                                            marginBottom: 8,
                                            paddingHorizontal: 4,
                                        }}
                                        numberOfLines={1}
                                    >
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>

                {/* Recent Videos Section */}
                <View style={{ paddingHorizontal: 16, marginTop: 28 }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <Text style={{ color: '#FFFFFF', fontSize: 16, fontFamily: fonts.semibold }}>
                            Recent Videos
                        </Text>
                        <TouchableOpacity activeOpacity={0.7}>
                            <Text style={{ color: '#6C47FF', fontSize: 12, fontFamily: fonts.medium }}>
                                See all →
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ marginTop: 12, gap: 12 }}>
                        {/* Video Card 1 */}
                        <TouchableOpacity
                            activeOpacity={0.85}
                            style={{
                                backgroundColor: '#0F0F0F',
                                borderRadius: 14,
                                height: 80,
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingHorizontal: 10,
                                gap: 12,
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.05)',
                            }}
                        >
                            <View
                                style={{
                                    width: 100,
                                    height: 60,
                                    borderRadius: 8,
                                    overflow: 'hidden',
                                    position: 'relative',
                                }}
                            >
                                <LinearGradient
                                    colors={['#1E1B4B', '#312E81']}
                                    style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <View
                                        style={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: 14,
                                            backgroundColor: 'rgba(255,255,255,0.2)',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Ionicons name="play" size={14} color="#FFFFFF" style={{ marginLeft: 2 }} />
                                    </View>
                                </LinearGradient>
                                <View
                                    style={{
                                        position: 'absolute',
                                        bottom: 4,
                                        right: 4,
                                        backgroundColor: 'rgba(0,0,0,0.75)',
                                        paddingHorizontal: 6,
                                        paddingVertical: 2,
                                        borderRadius: 4,
                                    }}
                                >
                                    <Text style={{ color: '#FFFFFF', fontSize: 9, fontFamily: fonts.medium }}>
                                        12:34
                                    </Text>
                                </View>
                            </View>

                            <View style={{ flex: 1, justifyContent: 'center' }}>
                                <Text
                                    style={{ color: '#FFFFFF', fontSize: 13, fontFamily: fonts.medium }}
                                    numberOfLines={1}
                                >
                                    Top 10 AI Tools in 2025
                                </Text>
                                <Text
                                    style={{ color: '#A1A2A4', fontSize: 11, fontFamily: fonts.regular, marginTop: 4 }}
                                >
                                    1.2M views • {channelCategory}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {/* Video Card 2 */}
                        <TouchableOpacity
                            activeOpacity={0.85}
                            style={{
                                backgroundColor: '#0F0F0F',
                                borderRadius: 14,
                                height: 80,
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingHorizontal: 10,
                                gap: 12,
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.05)',
                            }}
                        >
                            <View
                                style={{
                                    width: 100,
                                    height: 60,
                                    borderRadius: 8,
                                    overflow: 'hidden',
                                    position: 'relative',
                                }}
                            >
                                <LinearGradient
                                    colors={['#0F766E', '#115E59']}
                                    style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <View
                                        style={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: 14,
                                            backgroundColor: 'rgba(255,255,255,0.2)',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Ionicons name="play" size={14} color="#FFFFFF" style={{ marginLeft: 2 }} />
                                    </View>
                                </LinearGradient>
                                <View
                                    style={{
                                        position: 'absolute',
                                        bottom: 4,
                                        right: 4,
                                        backgroundColor: 'rgba(0,0,0,0.75)',
                                        paddingHorizontal: 6,
                                        paddingVertical: 2,
                                        borderRadius: 4,
                                    }}
                                >
                                    <Text style={{ color: '#FFFFFF', fontSize: 9, fontFamily: fonts.medium }}>
                                        18:02
                                    </Text>
                                </View>
                            </View>

                            <View style={{ flex: 1, justifyContent: 'center' }}>
                                <Text
                                    style={{ color: '#FFFFFF', fontSize: 13, fontFamily: fonts.medium }}
                                    numberOfLines={1}
                                >
                                    iPhone 17 Pro Full Review
                                </Text>
                                <Text
                                    style={{ color: '#A1A2A4', fontSize: 11, fontFamily: fonts.regular, marginTop: 4 }}
                                >
                                    890K views • {channelCategory}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Top Podcasts Section */}
                <View style={{ paddingHorizontal: 16, marginTop: 28 }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={{ fontSize: 16 }}>🎙️</Text>
                            <Text style={{ color: '#FFFFFF', fontSize: 16, fontFamily: fonts.semibold }}>
                                Top Podcasts
                            </Text>
                        </View>
                        <TouchableOpacity activeOpacity={0.7}>
                            <Text style={{ color: '#6C47FF', fontSize: 12, fontFamily: fonts.medium }}>
                                See all →
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 12, marginTop: 12 }}
                    >
                        {/* Podcast Card 1 */}
                        <View
                            style={{
                                width: 130,
                                height: 160,
                                backgroundColor: '#0F0F0F',
                                borderRadius: 16,
                                overflow: 'hidden',
                                position: 'relative',
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.05)',
                            }}
                        >
                            <LinearGradient
                                colors={['rgba(108,71,255,0.9)', 'rgba(108,71,255,0.3)']}
                                style={{ width: '100%', height: 80, padding: 8 }}
                            />
                            <View
                                style={{
                                    position: 'absolute',
                                    top: 64,
                                    left: 51,
                                    width: 28,
                                    height: 28,
                                    borderRadius: 14,
                                    backgroundColor: '#6C47FF',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Ionicons name="play" size={12} color="#FFFFFF" style={{ marginLeft: 2 }} />
                            </View>
                            <View style={{ padding: 10, marginTop: 14 }}>
                                <Text
                                    style={{ color: '#FFFFFF', fontSize: 11, fontFamily: fonts.semibold }}
                                    numberOfLines={1}
                                >
                                    AI & The Future
                                </Text>
                                <Text style={{ color: '#A1A2A4', fontSize: 10, fontFamily: fonts.regular, marginTop: 4 }}>
                                    Ep. 48 • 42 min
                                </Text>
                            </View>
                        </View>

                        {/* Podcast Card 2 */}
                        <View
                            style={{
                                width: 130,
                                height: 160,
                                backgroundColor: '#0F0F0F',
                                borderRadius: 16,
                                overflow: 'hidden',
                                position: 'relative',
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.05)',
                            }}
                        >
                            <LinearGradient
                                colors={['rgba(0,229,195,0.9)', 'rgba(0,229,195,0.3)']}
                                style={{ width: '100%', height: 80, padding: 8 }}
                            />
                            <View
                                style={{
                                    position: 'absolute',
                                    top: 64,
                                    left: 51,
                                    width: 28,
                                    height: 28,
                                    borderRadius: 14,
                                    backgroundColor: '#00E5C3',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Ionicons name="play" size={12} color="#000000" style={{ marginLeft: 2 }} />
                            </View>
                            <View style={{ padding: 10, marginTop: 14 }}>
                                <Text
                                    style={{ color: '#FFFFFF', fontSize: 11, fontFamily: fonts.semibold }}
                                    numberOfLines={1}
                                >
                                    Code & Coffee
                                </Text>
                                <Text style={{ color: '#A1A2A4', fontSize: 10, fontFamily: fonts.regular, marginTop: 4 }}>
                                    Ep. 32 • 36 min
                                </Text>
                            </View>
                        </View>

                        {/* Podcast Card 3 */}
                        <View
                            style={{
                                width: 130,
                                height: 160,
                                backgroundColor: '#0F0F0F',
                                borderRadius: 16,
                                overflow: 'hidden',
                                position: 'relative',
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.05)',
                            }}
                        >
                            <LinearGradient
                                colors={['rgba(255,64,129,0.9)', 'rgba(255,64,129,0.3)']}
                                style={{ width: '100%', height: 80, padding: 8 }}
                            />
                            <View
                                style={{
                                    position: 'absolute',
                                    top: 64,
                                    left: 51,
                                    width: 28,
                                    height: 28,
                                    borderRadius: 14,
                                    backgroundColor: '#FF4081',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Ionicons name="play" size={12} color="#FFFFFF" style={{ marginLeft: 2 }} />
                            </View>
                            <View style={{ padding: 10, marginTop: 14 }}>
                                <Text
                                    style={{ color: '#FFFFFF', fontSize: 11, fontFamily: fonts.semibold }}
                                    numberOfLines={1}
                                >
                                    Startup Grind
                                </Text>
                                <Text style={{ color: '#A1A2A4', fontSize: 10, fontFamily: fonts.regular, marginTop: 4 }}>
                                    Ep. 19 • 55 min
                                </Text>
                            </View>
                        </View>
                    </ScrollView>
                </View>

                {/* High Views Section */}
                <View style={{ paddingHorizontal: 16, marginTop: 28 }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={{ fontSize: 16 }}>🔥</Text>
                            <Text style={{ color: '#FFFFFF', fontSize: 16, fontFamily: fonts.semibold }}>
                                High Views
                            </Text>
                        </View>
                        <TouchableOpacity activeOpacity={0.7}>
                            <Text style={{ color: '#6C47FF', fontSize: 12, fontFamily: fonts.medium }}>
                                See all →
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ marginTop: 12, gap: 8 }}>
                        {/* Rank 1 */}
                        <View
                            style={{
                                backgroundColor: '#0F0F0F',
                                borderRadius: 12,
                                height: 60,
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingHorizontal: 14,
                                gap: 12,
                            }}
                        >
                            <Text style={{ fontSize: 16 }}>🥇</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: '#FFFFFF', fontSize: 12, fontFamily: fonts.medium }} numberOfLines={1}>
                                    ChatGPT vs Gemini vs Claude
                                </Text>
                                <View
                                    style={{
                                        height: 4,
                                        width: '100%',
                                        backgroundColor: '#282828',
                                        borderRadius: 2,
                                        marginTop: 8,
                                        overflow: 'hidden',
                                    }}
                                >
                                    <LinearGradient
                                        colors={['#6C47FF', '#00E5C3']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={{ height: '100%', width: '90%', borderRadius: 2 }}
                                    />
                                </View>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{ color: '#00E5C3', fontSize: 13, fontFamily: fonts.semibold }}>
                                    8.4M
                                </Text>
                                <Text style={{ color: '#A1A2A4', fontSize: 9, fontFamily: fonts.regular }}>
                                    views
                                </Text>
                            </View>
                        </View>

                        {/* Rank 2 */}
                        <View
                            style={{
                                backgroundColor: '#0F0F0F',
                                borderRadius: 12,
                                height: 60,
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingHorizontal: 14,
                                gap: 12,
                            }}
                        >
                            <Text style={{ fontSize: 16 }}>🥈</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: '#FFFFFF', fontSize: 12, fontFamily: fonts.medium }} numberOfLines={1}>
                                    iPhone 17 Pro Max Unboxing
                                </Text>
                                <View
                                    style={{
                                        height: 4,
                                        width: '100%',
                                        backgroundColor: '#282828',
                                        borderRadius: 2,
                                        marginTop: 8,
                                        overflow: 'hidden',
                                    }}
                                >
                                    <LinearGradient
                                        colors={['#6C47FF', '#00E5C3']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={{ height: '100%', width: '70%', borderRadius: 2 }}
                                    />
                                </View>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{ color: '#00E5C3', fontSize: 13, fontFamily: fonts.semibold }}>
                                    6.1M
                                </Text>
                                <Text style={{ color: '#A1A2A4', fontSize: 9, fontFamily: fonts.regular }}>
                                    views
                                </Text>
                            </View>
                        </View>

                        {/* Rank 3 */}
                        <View
                            style={{
                                backgroundColor: '#0F0F0F',
                                borderRadius: 12,
                                height: 60,
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingHorizontal: 14,
                                gap: 12,
                            }}
                        >
                            <Text style={{ fontSize: 16 }}>🥉</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: '#FFFFFF', fontSize: 12, fontFamily: fonts.medium }} numberOfLines={1}>
                                    Top 10 VS Code Extensions
                                </Text>
                                <View
                                    style={{
                                        height: 4,
                                        width: '100%',
                                        backgroundColor: '#282828',
                                        borderRadius: 2,
                                        marginTop: 8,
                                        overflow: 'hidden',
                                    }}
                                >
                                    <LinearGradient
                                        colors={['#6C47FF', '#00E5C3']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={{ height: '100%', width: '55%', borderRadius: 2 }}
                                    />
                                </View>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{ color: '#00E5C3', fontSize: 13, fontFamily: fonts.semibold }}>
                                    4.8M
                                </Text>
                                <Text style={{ color: '#A1A2A4', fontSize: 9, fontFamily: fonts.regular }}>
                                    views
                                </Text>
                            </View>
                        </View>

                        {/* Rank 4 */}
                        <View
                            style={{
                                backgroundColor: '#0F0F0F',
                                borderRadius: 12,
                                height: 60,
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingHorizontal: 14,
                                gap: 12,
                            }}
                        >
                            <Text style={{ color: '#A1A2A4', fontSize: 14, fontFamily: fonts.bold, width: 20 }}>
                                4
                            </Text>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: '#FFFFFF', fontSize: 12, fontFamily: fonts.medium }} numberOfLines={1}>
                                    Build an App with AI in 1hr
                                </Text>
                                <View
                                    style={{
                                        height: 4,
                                        width: '100%',
                                        backgroundColor: '#282828',
                                        borderRadius: 2,
                                        marginTop: 8,
                                        overflow: 'hidden',
                                    }}
                                >
                                    <LinearGradient
                                        colors={['#6C47FF', '#00E5C3']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={{ height: '100%', width: '40%', borderRadius: 2 }}
                                    />
                                </View>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{ color: '#00E5C3', fontSize: 13, fontFamily: fonts.semibold }}>
                                    3.2M
                                </Text>
                                <Text style={{ color: '#A1A2A4', fontSize: 9, fontFamily: fonts.regular }}>
                                    views
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Analytics Section */}
                <View style={{ paddingHorizontal: 16, marginTop: 28 }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={{ fontSize: 16 }}>📊</Text>
                            <Text style={{ color: '#FFFFFF', fontSize: 16, fontFamily: fonts.semibold }}>
                                Analytics
                            </Text>
                        </View>
                        <TouchableOpacity activeOpacity={0.7}>
                            <Text style={{ color: '#6C47FF', fontSize: 12, fontFamily: fonts.medium }}>
                                Details →
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* 2x2 Grid */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
                        {/* Metric 1 */}
                        <View
                            style={{
                                width: '48%',
                                backgroundColor: '#0F0F0F',
                                borderRadius: 14,
                                padding: 14,
                                borderWidth: 1,
                                borderColor: 'rgba(108, 71, 255, 0.25)',
                            }}
                        >
                            <Ionicons name="eye-outline" size={20} color="#6C47FF" />
                            <Text style={{ color: '#6C47FF', fontSize: 16, fontFamily: fonts.bold, marginTop: 8 }}>
                                182K
                            </Text>
                            <Text style={{ color: '#A1A2A4', fontSize: 10, fontFamily: fonts.regular, marginTop: 2 }}>
                                Avg Views/Video
                            </Text>
                        </View>

                        {/* Metric 2 */}
                        <View
                            style={{
                                width: '48%',
                                backgroundColor: '#0F0F0F',
                                borderRadius: 14,
                                padding: 14,
                                borderWidth: 1,
                                borderColor: 'rgba(0, 229, 195, 0.25)',
                            }}
                        >
                            <Ionicons name="time-outline" size={20} color="#00E5C3" />
                            <Text style={{ color: '#00E5C3', fontSize: 16, fontFamily: fonts.bold, marginTop: 8 }}>
                                2.1B min
                            </Text>
                            <Text style={{ color: '#A1A2A4', fontSize: 10, fontFamily: fonts.regular, marginTop: 2 }}>
                                Watch Time
                            </Text>
                        </View>

                        {/* Metric 3 */}
                        <View
                            style={{
                                width: '48%',
                                backgroundColor: '#0F0F0F',
                                borderRadius: 14,
                                padding: 14,
                                borderWidth: 1,
                                borderColor: 'rgba(60, 156, 0, 0.25)',
                            }}
                        >
                            <Ionicons name="trending-up-outline" size={20} color="#3C9C00" />
                            <Text style={{ color: '#3C9C00', fontSize: 16, fontFamily: fonts.bold, marginTop: 8 }}>
                                +12.4%
                            </Text>
                            <Text style={{ color: '#A1A2A4', fontSize: 10, fontFamily: fonts.regular, marginTop: 2 }}>
                                Growth Rate
                            </Text>
                        </View>

                        {/* Metric 4 */}
                        <View
                            style={{
                                width: '48%',
                                backgroundColor: '#0F0F0F',
                                borderRadius: 14,
                                padding: 14,
                                borderWidth: 1,
                                borderColor: 'rgba(255, 140, 0, 0.25)',
                            }}
                        >
                            <Ionicons name="chatbubble-outline" size={20} color="#FF8C00" />
                            <Text style={{ color: '#FF8C00', fontSize: 16, fontFamily: fonts.bold, marginTop: 8 }}>
                                8.6%
                            </Text>
                            <Text style={{ color: '#A1A2A4', fontSize: 10, fontFamily: fonts.regular, marginTop: 2 }}>
                                Eng. Rate
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Subscriber Growth Chart (Last 6 Months) */}
                <View style={{ paddingHorizontal: 16, marginTop: 28 }}>
                    <View
                        style={{
                            backgroundColor: '#0F0F0F',
                            borderRadius: 16,
                            padding: 16,
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.05)',
                        }}
                    >
                        <Text style={{ color: '#FFFFFF', fontSize: 15, fontFamily: fonts.semibold }}>
                            Subscriber Growth (Last 6 Months)
                        </Text>

                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'flex-end',
                                justifyContent: 'space-between',
                                height: 100,
                                marginTop: 20,
                                paddingHorizontal: 10,
                            }}
                        >
                            {[
                                { month: 'Jan', height: 32 },
                                { month: 'Feb', height: 44 },
                                { month: 'Mar', height: 40 },
                                { month: 'Apr', height: 58 },
                                { month: 'May', height: 68 },
                                { month: 'Jun', height: 80 },
                            ].map((bar, idx) => (
                                <View key={idx} style={{ alignItems: 'center', gap: 8 }}>
                                    <LinearGradient
                                        colors={['#6C47FF', '#00E5C3']}
                                        style={{
                                            width: 32,
                                            height: bar.height,
                                            borderRadius: 6,
                                        }}
                                    />
                                    <Text style={{ color: '#A1A2A4', fontSize: 10, fontFamily: fonts.regular }}>
                                        {bar.month}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Top Performing Categories */}
                <View style={{ paddingHorizontal: 16, marginTop: 28 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 16, fontFamily: fonts.semibold }}>
                        Top Performing Categories
                    </Text>

                    <View style={{ marginTop: 12, gap: 8 }}>
                        {[
                            { name: 'AI & Tech', pct: '38%', width: '38%', color: '#6C47FF' },
                            { name: 'Reviews', pct: '27%', width: '27%', color: '#00E5C3' },
                            { name: 'Tutorials', pct: '21%', width: '21%', color: '#FF8C00' },
                            { name: 'Shorts', pct: '14%', width: '14%', color: '#FF4081' },
                        ].map((cat, idx) => (
                            <View
                                key={idx}
                                style={{
                                    backgroundColor: '#0F0F0F',
                                    borderRadius: 10,
                                    height: 44,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingHorizontal: 14,
                                    borderWidth: 1,
                                    borderColor: 'rgba(255,255,255,0.04)',
                                }}
                            >
                                <View
                                    style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: 5,
                                        backgroundColor: cat.color,
                                        marginRight: 8,
                                    }}
                                />
                                <Text
                                    style={{ color: '#FFFFFF', fontSize: 12, fontFamily: fonts.medium, width: 90 }}
                                    numberOfLines={1}
                                >
                                    {cat.name}
                                </Text>

                                <View
                                    style={{
                                        flex: 1,
                                        height: 6,
                                        backgroundColor: '#282828',
                                        borderRadius: 3,
                                        marginHorizontal: 12,
                                        overflow: 'hidden',
                                    }}
                                >
                                    <View
                                        style={{
                                            height: '100%',
                                            width: cat.width as any,
                                            backgroundColor: cat.color,
                                            borderRadius: 3,
                                        }}
                                    />
                                </View>

                                <Text
                                    style={{
                                        color: cat.color,
                                        fontSize: 12,
                                        fontFamily: fonts.semibold,
                                        width: 36,
                                        textAlign: 'right',
                                    }}
                                >
                                    {cat.pct}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>

            <PreviewAdSheet
                visible={adSheetVisible}
                adItem={adSheetItem}
                onClose={() => setAdSheetVisible(false)}
            />
        </SafeAreaView>
    );
}
