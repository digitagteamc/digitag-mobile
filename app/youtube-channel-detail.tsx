import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getChannelById } from '../services/userService';
import { fonts } from '../theme/colors';

const AD_TYPES = [
    { id: 'ad-1', name: 'Strip Ad', accentColor: '#15112E' },
    { id: 'ad-2', name: 'Banner Ad', accentColor: '#DADAFF' },
    { id: 'ad-3', name: 'Corner Ads', accentColor: '#F1CEFF' },
    { id: 'ad-4', name: 'L - Shape Ads', accentColor: '#FCEFB4' },
];

function formatPrice(val: any): string | null {
    const n = Number(val);
    if (val === null || val === undefined || !Number.isFinite(n)) return null;
    return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

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

    const { token } = useAuth();
    const insets = useSafeAreaInsets();
    // Live channel (TV / YouTube / …) from GET /channels/:id. Null while
    // loading or for the demo placeholder, which keeps the mock content.
    const [channel, setChannel] = useState<any>(null);
    const [channelLoading, setChannelLoading] = useState(!!params.channelId);
    // Why the live channel didn't load, shown when Collab is tapped.
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        if (!token || !params.channelId) { setChannelLoading(false); return; }
        let active = true;
        getChannelById(token, params.channelId).then((res) => {
            if (!active) return;
            if (res.success && res.data) setChannel(res.data);
            else setLoadError(res.error || null);
            setChannelLoading(false);
        });
        return () => { active = false; };
    }, [token, params.channelId]);

    const isTv = channel?.type === 'TV';
    const channelName = channel?.name || params.name || 'TechTalks';
    const channelCategory = channel?.category || params.category || 'Tech';
    const rawSubs = channel ? String(channel.subscriberCount ?? 0) : params.subscriberCount || '4.2M';
    const formattedSubs = isNaN(Number(rawSubs)) ? rawSubs : formatNumber(Number(rawSubs));
    const channelHandle = channel
        ? [isTv ? 'TV channel' : channel.type === 'YOUTUBE' ? 'YouTube channel' : 'Media channel', channel.isVerified ? 'Verified' : null, channel.category].filter(Boolean).join(' · ')
        : params.handle || `@${channelName.toLowerCase().replace(/\s+/g, '')}_official`;
    const videoCount = channel ? String(channel.adTypes?.length ?? 0) : params.videoCount || '1.8K';
    const viewCount = channel ? formatPrice(channel.startingPrice) || '—' : params.viewCount || '320M';
    const description = channel?.description || params.description || `We cover the latest in tech, gadgets, AI & software. From in-depth reviews to beginner tutorials, ${channelName} is your go-to tech hub.`;
    const location = channel ? channel.region || 'India' : params.location || 'Mumbai, India';
    const joinedDate = channel ? (channel.languages?.length ? channel.languages.join(', ') : 'All languages') : params.joinedDate || 'Joined Jan 2018';
    const logoUrl = channel?.logoUrl || params.logoUrl || null;

    const pastCollabs: any[] = channel?.pastCollaborations || [];
    // One card per brand; the first showcase supplies its logo, title and media.
    const brandCollabs = pastCollabs.reduce((list: any[], c) => {
        const existing = list.find((b) => b.brandName === c.brandName);
        if (existing) existing.count += 1;
        else list.push({ ...c, count: 1 });
        return list;
    }, []);

    const openQuote = (adTypeId?: string) => {
        if (!channel) {
            // Home falls back to built-in sample channels when the server has
            // none — those have no rate card to request a quote from.
            Alert.alert(
                'Channel not available yet',
                loadError && !/not found/i.test(loadError)
                    ? `Couldn't load this channel: ${loadError}`
                    : 'This is a sample channel. Collab works on channels added by the Digitag team — they will appear here once listed.',
            );
            return;
        }
        router.push({ pathname: '/channel-request-quote', params: { channelId: channel.id, adTypeId: adTypeId || '' } } as any);
    };

    const openAdTypes = (adType?: string) => {
        router.push({ pathname: '/select-ad-types', params: { channelId: channel?.id ?? '', channelName: channel?.name ?? '', adType: adType ?? '' } } as any);
    };

    if (channelLoading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#060606', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color="#6C47FF" size="large" />
            </SafeAreaView>
        );
    }

    // Initial letters fallback avatar
    const initials = channelName
        .split(' ')
        .map((w: string) => w[0])
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
                    gap: 10,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    backgroundColor: '#060606',
                    zIndex: 10,
                    marginTop: 25,
                }}
            >
                <TouchableOpacity
                    onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as any))}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                </TouchableOpacity>

                <Text style={{ color: '#FFFFFF', fontSize: 17, fontFamily: fonts.semibold }}>
                    Channel Profile
                </Text>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
            >
                {/* Banner */}
                <LinearGradient
                    colors={['#6C47FF', '#49D2CF', '#00E5C3']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ height: 105, width: '100%' }}
                />

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
                <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
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
                                {isTv ? 'Reach' : 'Subscribers'}
                            </Text>
                        </View>

                        <View style={{ width: 1, height: 32, backgroundColor: '#323232' }} />

                        <View style={{ alignItems: 'center', flex: 1 }}>
                            <Text style={{ color: '#FFFFFF', fontSize: 18, fontFamily: fonts.bold }}>
                                {videoCount}
                            </Text>
                            <Text style={{ color: '#A1A2A4', fontSize: 11, fontFamily: fonts.regular, marginTop: 2 }}>
                                {channel ? 'Ad Types' : 'Videos'}
                            </Text>
                        </View>

                        <View style={{ width: 1, height: 32, backgroundColor: '#323232' }} />

                        <View style={{ alignItems: 'center', flex: 1 }}>
                            <Text style={{ color: '#FFFFFF', fontSize: 18, fontFamily: fonts.bold }}>
                                {viewCount}
                            </Text>
                            <Text style={{ color: '#A1A2A4', fontSize: 11, fontFamily: fonts.regular, marginTop: 2 }}>
                                {channel ? 'Starts at' : 'Views'}
                            </Text>
                        </View>
                    </View>
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 20, fontFamily: fonts.bold }}>
                            Ad Types
                        </Text>
                        <TouchableOpacity
                            onPress={() => openAdTypes()}
                            activeOpacity={0.8}
                            style={{
                                paddingHorizontal: 16,
                                paddingVertical: 6,
                                borderRadius: 16,
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.35)',
                            }}
                        >
                            <Text style={{ color: '#FFFFFF', fontSize: 12, fontFamily: fonts.medium }}>View all</Text>
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={AD_TYPES}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ paddingTop: 12, gap: 10 }}
                        renderItem={({ item }) => {
                            const accent = item.accentColor;
                            const isActive = item.id === AD_TYPES[0].id;
                            return (
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={() => openAdTypes(item.id)}
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
                                                backgroundColor: isActive ? '#6C47FF' : '#1E1E2E',
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
                                            color: isActive ? '#8B6DFF' : '#000',
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

                {/* Brand Collaborations — managed by the channel in its portal */}
                {channel && (
                    <View style={{ marginTop: 28 }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 16, fontFamily: fonts.semibold, paddingHorizontal: 16 }}>
                            Brand Collaborations
                        </Text>
                        {brandCollabs.length === 0 ? (
                            <Text style={{ color: '#A1A2A4', fontSize: 12, fontFamily: fonts.regular, marginTop: 10, paddingHorizontal: 16 }}>
                                No collaborations showcased yet.
                            </Text>
                        ) : (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ gap: 10, paddingHorizontal: 16, paddingTop: 12 }}
                            >
                                {brandCollabs.map((b) => (
                                    <View
                                        key={b.brandName}
                                        style={{
                                            width: 148,
                                            backgroundColor: '#0F0F0F',
                                            borderRadius: 14,
                                            padding: 10,
                                            borderWidth: 1,
                                            borderColor: 'rgba(255,255,255,0.05)',
                                        }}
                                    >
                                        <View
                                            style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: 20,
                                                backgroundColor: '#1C1C24',
                                                overflow: 'hidden',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            {b.brandLogoUrl ? (
                                                <Image source={{ uri: b.brandLogoUrl }} style={{ width: '100%', height: '100%' }} />
                                            ) : (
                                                <Text style={{ color: '#FFFFFF', fontSize: 15, fontFamily: fonts.bold }}>
                                                    {(b.brandName || '?').slice(0, 1).toUpperCase()}
                                                </Text>
                                            )}
                                        </View>
                                        <Text style={{ color: '#FFFFFF', fontSize: 13, fontFamily: fonts.semibold, marginTop: 8 }} numberOfLines={1}>
                                            {b.brandName}
                                        </Text>
                                        <Text style={{ color: '#A1A2A4', fontSize: 10, fontFamily: fonts.regular, marginTop: 2 }} numberOfLines={1}>
                                            {b.title}
                                        </Text>
                                        <Text style={{ color: '#D1D2D4', fontSize: 10, fontFamily: fonts.regular, marginTop: 2 }}>
                                            {b.count} Collaboration{b.count === 1 ? '' : 's'}
                                        </Text>
                                        <View style={{ height: 58, borderRadius: 8, overflow: 'hidden', marginTop: 8 }}>
                                            <LinearGradient
                                                colors={['#1E1B4B', '#312E81']}
                                                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                                            />
                                            {!!b.mediaUrl && <Image source={{ uri: b.mediaUrl }} style={{ width: '100%', height: '100%' }} />}
                                        </View>
                                        {!!b.adTypeName && (
                                            <View
                                                style={{
                                                    alignSelf: 'flex-start',
                                                    marginTop: 6,
                                                    paddingHorizontal: 8,
                                                    paddingVertical: 2,
                                                    borderRadius: 8,
                                                    backgroundColor: 'rgba(108,71,255,0.25)',
                                                }}
                                            >
                                                <Text style={{ color: '#FFFFFF', fontSize: 9, fontFamily: fonts.medium }} numberOfLines={1}>
                                                    {b.adTypeName}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                )}

                {/* No backend data for these yet — shown only for the demo placeholder channel. */}
                {!channel && (
                <>
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

                </>
                )}
            </ScrollView>

            {/* Collaboration button */}
            <View style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 12 }}>
                <TouchableOpacity onPress={() => openQuote()} activeOpacity={0.85} style={{ borderRadius: 26, overflow: 'hidden' }}>
                    <LinearGradient
                        colors={['#1A8CFF', '#6633E5']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ height: 52, alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Text style={{ color: '#FFFFFF', fontSize: 15, fontFamily: fonts.semibold }}>
                            Send Collaboration
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
