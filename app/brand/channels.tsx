import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, BG, BRAND, Card, Chip, EmptyState, ErrorState, Loading, ScreenHeader, inputStyle } from '../../Components/brand/ui';
import { useAuth } from '../../context/AuthContext';
import { AdTypeItem, Channel, ChannelType, formatCount, formatMoney, listAdTypes, listChannels } from '../../services/brandService';
import { fonts, palette } from '../../theme/colors';

const TYPE_FILTERS: { label: string; value?: ChannelType }[] = [
    { label: 'All' },
    { label: 'YouTube', value: 'YOUTUBE' },
    { label: 'TV', value: 'TV' },
    { label: 'Radio', value: 'RADIO' },
    { label: 'OTT', value: 'OTT' },
    { label: 'Digital', value: 'DIGITAL' },
];

const TYPE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
    YOUTUBE: 'logo-youtube', TV: 'tv-outline', RADIO: 'radio-outline', OTT: 'play-circle-outline',
    PRINT: 'newspaper-outline', DIGITAL: 'globe-outline', OTHER: 'albums-outline',
};

/** Step 1 of advertising: pick a channel (optionally pre-filtered by type or
 *  by the ad type tapped on Brand Home). */
export default function ChannelsScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const params = useLocalSearchParams<{ type?: ChannelType; adTypeId?: string }>();
    const [type, setType] = useState<ChannelType | undefined>(params.type);
    const [adTypeId, setAdTypeId] = useState<string | undefined>(params.adTypeId);
    const [adTypes, setAdTypes] = useState<AdTypeItem[]>([]);
    const [search, setSearch] = useState('');
    const [items, setItems] = useState<Channel[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (token) listAdTypes(token).then((r) => r.success && setAdTypes(r.data));
    }, [token]);

    const load = useCallback(async () => {
        if (!token) return;
        const res = await listChannels(token, { type, adTypeId, search: search.trim() || undefined });
        if (res.success) { setItems(res.data.items); setError(null); } else setError(res.error);
        setLoading(false);
    }, [token, type, adTypeId, search]);

    // Debounce search typing; filters apply immediately.
    useEffect(() => {
        const t = setTimeout(load, search ? 300 : 0);
        return () => clearTimeout(t);
    }, [load, search]);

    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={['top', 'bottom']}>
            <ScreenHeader title="Advertise" subtitle="Choose a channel to see its ad catalog" />

            <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', ...inputStyle, paddingVertical: 0 }}>
                    <Ionicons name="search" size={18} color={palette.textMuted} />
                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Search channels"
                        placeholderTextColor="#666"
                        style={{ flex: 1, color: '#fff', paddingVertical: 12, marginLeft: 8, fontFamily: fonts.regular }}
                    />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                    {TYPE_FILTERS.map((f) => (
                        <Chip key={f.label} label={f.label} active={type === f.value} onPress={() => setType(f.value)} />
                    ))}
                </ScrollView>
                {!!adTypes.length && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                        <Chip label="Any ad type" active={!adTypeId} onPress={() => setAdTypeId(undefined)} color="#444" />
                        {adTypes.map((t) => (
                            <Chip key={t.id} label={t.name} active={adTypeId === t.id} onPress={() => setAdTypeId(t.id)} color={t.accentColor || BRAND.primary} />
                        ))}
                    </ScrollView>
                )}
            </View>

            {loading ? <Loading /> : error && !items.length ? <ErrorState message={error} onRetry={load} /> : (
                <FlatList
                    data={items}
                    keyExtractor={(c) => c.id}
                    contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.primary} />}
                    ListEmptyComponent={
                        <EmptyState icon="tv-outline" title="No channels found" message="Try a different filter — new channels are added regularly." />
                    }
                    renderItem={({ item }) => (
                        <Card
                            style={{ marginBottom: 12 }}
                            onPress={() => router.push({ pathname: '/brand/channel/[id]', params: { id: item.id, adTypeId: adTypeId || '' } } as any)}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Avatar uri={item.logoUrl} name={item.name} size={52} rounded={false} />
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text numberOfLines={1} style={{ color: '#fff', fontSize: 15, fontFamily: fonts.semibold, flexShrink: 1 }}>{item.name}</Text>
                                        {item.isVerified && <Ionicons name="checkmark-circle" size={14} color="#60A5FA" style={{ marginLeft: 4 }} />}
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                                        <Ionicons name={TYPE_ICON[item.type] || 'albums-outline'} size={13} color={item.type === 'YOUTUBE' ? '#FF3B30' : BRAND.light} />
                                        <Text style={{ color: palette.textMuted, fontSize: 12, fontFamily: fonts.regular, marginLeft: 5 }}>
                                            {[item.type === 'YOUTUBE' ? 'YouTube' : item.type, item.subscriberCount ? `${formatCount(item.subscriberCount)} reach` : null, item.category]
                                                .filter(Boolean).join(' · ')}
                                        </Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color={palette.textMuted} />
                            </View>
                            {(item.adTypes?.length || 0) > 0 ? (
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}>
                                    {item.adTypes!.slice(0, 4).map((a) => (
                                        <View key={a.id} style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: BRAND.soft, marginRight: 6, marginBottom: 6 }}>
                                            <Text style={{ color: BRAND.light, fontSize: 11, fontFamily: fonts.semibold }}>{a.name}</Text>
                                        </View>
                                    ))}
                                    {!!item.startingPrice && (
                                        <Text style={{ color: '#fff', fontSize: 12, fontFamily: fonts.semibold, marginLeft: 'auto' }}>
                                            from {formatMoney(item.startingPrice)}
                                        </Text>
                                    )}
                                </View>
                            ) : (
                                <Text style={{ color: palette.textSubtle, fontSize: 12, fontFamily: fonts.regular, marginTop: 10 }}>Catalog coming soon</Text>
                            )}
                        </Card>
                    )}
                />
            )}
        </SafeAreaView>
    );
}
