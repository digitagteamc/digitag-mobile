import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Circle, Defs, RadialGradient, Stop, Svg } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { getYoutubeChannels } from '../services/userService';
import { fonts, palette } from '../theme/colors';

const imgDefaultAvatar = require('../assets/defaultavatar.png');

// Same accent as BrandHome — kept local rather than exported since it's
// specific to the Brand screens' own palette, not theme/colors.ts's
// CREATOR|FREELANCER rolePalettes.
const BRAND_PRIMARY = '#4F46E5';

const YT_FILTER_CHIPS = ['All', 'Podcast', 'Tech', 'Education', 'Others'];

const DUMMY_YOUTUBE_CHANNELS = [
    { id: 'yt-1', name: 'Suman Tv', subscriberCount: 4200000, category: 'News', logoUrl: null },
    { id: 'yt-2', name: 'TV 9', subscriberCount: 2200000, category: 'News', logoUrl: null },
    { id: 'yt-3', name: 'Aha', subscriberCount: 6200000, category: 'Entertainment', logoUrl: null },
];

function formatCount(n?: number | null) {
    if (!n) return '0';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

// Ambient glow — SVG radial gradient (not RN's shadow* props) so it renders
// identically on iOS and Android, same technique used across the app's
// other screens (Home, post-detail, creator-details).
const GlowCircle = ({ size, color, opacity = 1, style }: { size: number; color: string; opacity?: number; style?: any }) => {
    const gradId = React.useMemo(() => `glow_${Math.random().toString(36).slice(2, 10)}`, []);
    return (
        <View pointerEvents="none" style={[{ width: size, height: size }, style]}>
            <Svg width={size} height={size}>
                <Defs>
                    <RadialGradient id={gradId} cx="50%" cy="50%" r="50%">
                        <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
                        <Stop offset="55%" stopColor={color} stopOpacity={opacity * 0.45} />
                        <Stop offset="100%" stopColor={color} stopOpacity={0} />
                    </RadialGradient>
                </Defs>
                <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${gradId})`} />
            </Svg>
        </View>
    );
};

/**
 * Full "Youtube channels" browse screen — opened from Brand Home's
 * "Top youtube channels" section View all button. Re-fetches its own data
 * (same getYoutubeChannels call BrandHome already makes) rather than taking
 * it via route params, since Expo Router params can't carry arrays cleanly.
 */
export default function YoutubeChannelsScreen() {
    const router = useRouter();
    const { token } = useAuth();

    const [channels, setChannels] = useState<any[]>(DUMMY_YOUTUBE_CHANNELS);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [query, setQuery] = useState('');

    const load = useCallback(async () => {
        if (!token) { setLoading(false); return; }
        const res = await getYoutubeChannels(token);
        if (res.success && res.data && res.data.length > 0) {
            setChannels(res.data);
        } else {
            setChannels(DUMMY_YOUTUBE_CHANNELS);
        }
        setLoading(false);
    }, [token]);

    useEffect(() => { load(); }, [load]);

    const filteredChannels = useMemo(() => {
        let list = filter === 'All'
            ? channels
            : channels.filter((c) => (c.category || '').toLowerCase() === filter.toLowerCase());
        if (query.trim()) {
            const q = query.trim().toLowerCase();
            list = list.filter((c) => (c.name || '').toLowerCase().includes(q));
        }
        return list;
    }, [channels, filter, query]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }} edges={['top']}>
            <GlowCircle
                size={420}
                color={BRAND_PRIMARY}
                opacity={0.4}
                style={{ position: 'absolute', top: -160, left: -140 }}
            />
            <GlowCircle
                size={380}
                color="#0F5132"
                opacity={0.4}
                style={{ position: 'absolute', bottom: -120, right: -160 }}
            />

            {/* Header */}
            <View className="flex-row items-center px-4 pt-2 pb-4" style={{ gap: 14 }}>
                <TouchableOpacity
                    onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as any))}
                    style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}
                >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={{ color: '#fff', fontSize: 24, fontFamily: fonts.bold }}>Youtube channels</Text>
            </View>

            <FlatList
                data={filteredChannels}
                keyExtractor={(item) => item.id}
                numColumns={3}
                columnWrapperStyle={{ gap: 12 }}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 12 }}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <View style={{ marginBottom: 16 }}>
                        {/* Search bar */}
                        <View
                            className="flex-row items-center rounded-2xl px-4"
                            style={{ height: 52, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: palette.borderSoft, gap: 10 }}
                        >
                            <Ionicons name="search" size={18} color={palette.textMuted} />
                            <TextInput
                                value={query}
                                onChangeText={setQuery}
                                placeholder="Search here for Channels"
                                placeholderTextColor={palette.textMuted}
                                style={{ flex: 1, color: '#fff', fontFamily: fonts.regular, fontSize: 14 }}
                            />
                            <Ionicons name="mic-outline" size={18} color={palette.textMuted} />
                        </View>

                        {/* Filter chips */}
                        <FlatList
                            horizontal
                            data={YT_FILTER_CHIPS}
                            keyExtractor={(c) => c}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ gap: 10, marginTop: 16 }}
                            renderItem={({ item: chip }) => {
                                const active = filter === chip;
                                return (
                                    <TouchableOpacity
                                        onPress={() => setFilter(chip)}
                                        className="rounded-full border"
                                        style={{
                                            paddingHorizontal: 20,
                                            paddingVertical: 10,
                                            borderColor: BRAND_PRIMARY,
                                            backgroundColor: active ? BRAND_PRIMARY : 'transparent',
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontFamily: fonts.semibold,
                                                fontSize: 13,
                                                color: active ? '#fff' : BRAND_PRIMARY,
                                            }}
                                        >
                                            {chip}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            }}
                        />

                        <Text style={{ color: '#fff', fontSize: 20, fontFamily: fonts.bold, marginTop: 20 }}>
                            All Channels
                        </Text>
                    </View>
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={{ alignItems: 'center', marginTop: 60, gap: 10 }}>
                            <Ionicons name="logo-youtube" size={40} color={palette.borderStrong} />
                            <Text style={{ color: palette.textMuted, fontSize: 14, fontFamily: fonts.regular }}>
                                No channels found
                            </Text>
                        </View>
                    ) : (
                        <View style={{ alignItems: 'center', marginTop: 60 }}>
                            <ActivityIndicator color={BRAND_PRIMARY} size="large" />
                        </View>
                    )
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() =>
                            router.push({
                                pathname: '/youtube-channel-detail',
                                params: {
                                    channelId: item.id,
                                    name: item.name,
                                    subscriberCount: item.subscriberCount,
                                    category: item.category,
                                    logoUrl: item.logoUrl,
                                },
                            } as any)
                        }
                        style={{
                            flex: 1,
                            alignItems: 'center',
                            borderRadius: 20,
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.1)',
                            backgroundColor: 'rgba(255,255,255,0.03)',
                            paddingVertical: 20,
                            paddingHorizontal: 8,
                        }}
                    >
                        <View
                            style={{
                                width: 56,
                                height: 56,
                                borderRadius: 28,
                                borderWidth: 2,
                                borderColor: 'rgba(255,255,255,0.15)',
                                overflow: 'hidden',
                            }}
                        >
                            <Image
                                source={item.logoUrl ? { uri: item.logoUrl } : imgDefaultAvatar}
                                style={{ width: '100%', height: '100%' }}
                            />
                        </View>
                        <Text
                            style={{ color: '#fff', fontSize: 15, fontFamily: fonts.semibold, marginTop: 10, textAlign: 'center' }}
                            numberOfLines={1}
                        >
                            {item.name}
                        </Text>
                        <Text style={{ color: palette.textMuted, fontSize: 12, fontFamily: fonts.regular, marginTop: 2 }}>
                            {formatCount(item.subscriberCount)} Subs
                        </Text>
                        {!!item.category && (
                            <View className="flex-row items-center mt-1.5" style={{ gap: 4 }}>
                                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: palette.success }} />
                                <Text style={{ color: palette.textMuted, fontSize: 11, fontFamily: fonts.regular }}>
                                    {item.category}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                )}
            />
        </SafeAreaView>
    );
}