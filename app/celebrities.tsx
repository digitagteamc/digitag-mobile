import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getCelebrities } from '../services/userService';
import { fonts, palette } from '../theme/colors';

const imgDefaultAvatar = require('../assets/defaultavatar.png');

// Same accent as BrandHome / youtube-channels — kept local since it's
// specific to the Brand screens' own palette.
const BRAND_PRIMARY = '#4F46E5';

function formatCount(n?: number | null) {
    if (!n) return '0';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

/**
 * Full "Celebrities" browse screen — opened from Brand Home's Celebrities
 * section "View all" button. Re-fetches its own data (same getCelebrities
 * call BrandHome makes) rather than taking it via route params, since Expo
 * Router params can't carry arrays cleanly — same approach as
 * youtube-channels.tsx.
 */
export default function CelebritiesScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const { width: screenWidth } = useWindowDimensions();

    const [celebrities, setCelebrities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [query, setQuery] = useState('');

    const load = useCallback(async () => {
        if (!token) { setLoading(false); return; }
        const res = await getCelebrities(token);
        if (res.success) setCelebrities(res.data || []);
        setLoading(false);
    }, [token]);

    useEffect(() => { load(); }, [load]);

    // Filter chips come from the roles actually present in the data (Actor,
    // Singer, …) rather than a fixed list, since the API decides the roles.
    const roleChips = useMemo(() => {
        const roles = Array.from(new Set(celebrities.map((c) => c.role).filter(Boolean)));
        return ['All', ...roles];
    }, [celebrities]);

    const filteredCelebrities = useMemo(() => {
        let list = filter === 'All' ? celebrities : celebrities.filter((c) => c.role === filter);
        if (query.trim()) {
            const q = query.trim().toLowerCase();
            list = list.filter((c) => (c.name || '').toLowerCase().includes(q));
        }
        return list;
    }, [celebrities, filter, query]);

    // Same card width as BrandHome's Celebrities grid: 3 columns, 16px side
    // padding, 8px gaps.
    const cardWidth = Math.floor((screenWidth - 32 - 16) / 3);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }} edges={['top']}>
            {/* Header */}
            <View className="flex-row items-center px-4 pt-2 pb-4" style={{ gap: 14 }}>
                <TouchableOpacity
                    onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as any))}
                    style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}
                >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={{ color: '#fff', fontSize: 24, fontFamily: fonts.bold }}>Celebrities</Text>
            </View>

            <FlatList
                data={filteredCelebrities}
                keyExtractor={(item) => String(item.id)}
                numColumns={3}
                columnWrapperStyle={{ gap: 8 }}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <View style={{ marginBottom: 4 }}>
                        {/* Search bar */}
                        <View
                            className="flex-row items-center rounded-2xl px-4"
                            style={{ height: 52, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: palette.borderSoft, gap: 10 }}
                        >
                            <Ionicons name="search" size={18} color={palette.textMuted} />
                            <TextInput
                                value={query}
                                onChangeText={setQuery}
                                placeholder="Search celebrities"
                                placeholderTextColor={palette.textMuted}
                                style={{ flex: 1, color: '#fff', fontFamily: fonts.regular, fontSize: 14 }}
                            />
                        </View>

                        {/* Role filter chips */}
                        <FlatList
                            horizontal
                            data={roleChips}
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
                                        <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: active ? '#fff' : BRAND_PRIMARY }}>
                                            {chip}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            }}
                        />

                        <Text style={{ color: '#fff', fontSize: 20, fontFamily: fonts.bold, marginTop: 20 }}>
                            All Celebrities
                        </Text>
                        <Text style={{ color: '#94A3B8', fontSize: 11, fontFamily: fonts.regular, marginTop: 2 }}>
                            Handpicked icons trending this week
                        </Text>
                    </View>
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={{ alignItems: 'center', marginTop: 60, gap: 10 }}>
                            <Ionicons name="star-outline" size={40} color={palette.borderStrong} />
                            <Text style={{ color: palette.textMuted, fontSize: 14, fontFamily: fonts.regular }}>
                                No celebrities found
                            </Text>
                        </View>
                    ) : (
                        <View style={{ alignItems: 'center', marginTop: 60 }}>
                            <ActivityIndicator color={BRAND_PRIMARY} size="large" />
                        </View>
                    )
                }
                renderItem={({ item: c }) => (
                    // Same card as BrandHome's Celebrities section.
                    <View className="items-center" style={{ width: cardWidth, marginTop: 28 }}>
                        {/* Glowing avatar protruding above the card */}
                        <View style={{ position: 'absolute', top: -24, zIndex: 10, alignItems: 'center', justifyContent: 'center' }}>
                            <View
                                style={{
                                    width: 58,
                                    height: 58,
                                    borderRadius: 29,
                                    borderWidth: 2,
                                    borderColor: '#1A8CFF',
                                    backgroundColor: '#0B0F19',
                                    padding: 1.5,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    shadowColor: '#84CC16',
                                    shadowOffset: { width: 0, height: 0 },
                                    shadowOpacity: 0.8,
                                    shadowRadius: 6,
                                    elevation: 5,
                                }}
                            >
                                <Image
                                    source={c.photoUrl ? { uri: c.photoUrl } : imgDefaultAvatar}
                                    style={{ width: '100%', height: '100%', borderRadius: 27, backgroundColor: palette.surfaceAlt }}
                                />
                            </View>
                            {c.isVerified !== false && (
                                <View
                                    style={{
                                        position: 'absolute',
                                        right: 0,
                                        bottom: 0,
                                        width: 16,
                                        height: 16,
                                        borderRadius: 8,
                                        backgroundColor: '#84CC16',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderWidth: 1.5,
                                        borderColor: '#0B0F19',
                                    }}
                                >
                                    <Ionicons name="checkmark-sharp" size={9} color="#000" />
                                </View>
                            )}
                        </View>

                        {/* Dark card */}
                        <View
                            style={{
                                width: '100%',
                                backgroundColor: '#0F1626',
                                borderRadius: 20,
                                borderWidth: 1,
                                borderColor: 'rgba(59, 130, 246, 0.3)',
                                alignItems: 'center',
                                paddingTop: 38,
                                paddingBottom: 12,
                                paddingHorizontal: 4,
                            }}
                        >
                            <Text className="text-white font-poppins-semibold text-center" style={{ fontSize: 12 }} numberOfLines={1}>
                                {c.name}
                            </Text>
                            {!!c.role && (
                                <View
                                    style={{
                                        backgroundColor: 'rgba(30, 58, 138, 0.45)',
                                        paddingHorizontal: 8,
                                        paddingVertical: 2,
                                        borderRadius: 10,
                                        marginTop: 4,
                                    }}
                                >
                                    <Text style={{ color: '#38BDF8', fontSize: 10, fontFamily: 'Poppins_500Medium' }}>
                                        {c.role}
                                    </Text>
                                </View>
                            )}
                            <Text style={{ color: '#94A3B8', fontSize: 10, fontFamily: 'Poppins_500Medium', marginTop: 6, marginBottom: 10 }}>
                                {formatCount(c.followerCount)} Followers
                            </Text>
                            <LinearGradient
                                colors={['rgba(26, 140, 255, 1)', 'rgba(108, 71, 255, 1)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{ width: '90%', borderRadius: 99, overflow: 'hidden' }}
                            >
                                <TouchableOpacity
                                    style={{ paddingVertical: 7, alignItems: 'center', justifyContent: 'center' }}
                                    activeOpacity={0.8}
                                    onPress={() => router.push({
                                        pathname: '/celebrity-profile',
                                        params: {
                                            name: c.name,
                                            role: c.role,
                                            followerCount: String(c.followerCount ?? 0),
                                            photoUrl: c.photoUrl ?? '',
                                            isVerified: c.isVerified !== false ? 'true' : 'false',
                                            instagramHandle: c.instagramHandle ?? '',
                                            instagramFollowers: String(c.instagramFollowers ?? 0),
                                            youtubeUrl: c.youtubeUrl ?? '',
                                            youtubeSubscribers: String(c.youtubeSubscribers ?? 0),
                                        },
                                    } as any)}
                                >
                                    <Text className="text-white font-poppins-semibold" style={{ fontSize: 10 }}>
                                        View Profile
                                    </Text>
                                </TouchableOpacity>
                            </LinearGradient>
                        </View>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}
