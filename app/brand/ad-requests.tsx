import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, BG, BRAND, Card, Chip, EmptyState, ErrorState, Loading, ScreenHeader, StatusPill, timeAgo } from '../../Components/brand/ui';
import { useAuth } from '../../context/AuthContext';
import { AdRequest, AdRequestStatus, formatMoney, listAdRequests } from '../../services/brandService';
import { fonts, palette } from '../../theme/colors';

const FILTERS: { label: string; value?: AdRequestStatus }[] = [
    { label: 'All' },
    { label: 'Sent', value: 'PENDING' },
    { label: 'Under review', value: 'UNDER_REVIEW' },
    { label: 'Accepted', value: 'ACCEPTED' },
    { label: 'Live', value: 'IN_PROGRESS' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Declined', value: 'REJECTED' },
    { label: 'Cancelled', value: 'CANCELLED' },
];

export default function AdRequestsScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const [status, setStatus] = useState<AdRequestStatus | undefined>();
    const [items, setItems] = useState<AdRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!token) return;
        const res = await listAdRequests(token, { status });
        if (res.success) { setItems(res.data.items); setError(null); } else setError(res.error);
        setLoading(false);
    }, [token, status]);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={['top', 'bottom']}>
            <ScreenHeader title="Ad Requests" subtitle="Requests you've sent to channels" />
            <View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 4 }}>
                    {FILTERS.map((f) => <Chip key={f.label} label={f.label} active={status === f.value} onPress={() => { setLoading(true); setStatus(f.value); }} />)}
                </ScrollView>
            </View>
            {loading ? <Loading /> : error && !items.length ? <ErrorState message={error} onRetry={load} /> : (
                <FlatList
                    data={items}
                    keyExtractor={(r) => r.id}
                    contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={BRAND.primary} />}
                    ListEmptyComponent={
                        <EmptyState
                            icon="paper-plane-outline"
                            title={status ? 'Nothing here' : 'No ad requests yet'}
                            message="Pick a channel, choose ads from its catalog and send a request."
                            action={status ? undefined : 'Browse channels'}
                            onAction={() => router.push('/brand/channels' as any)}
                        />
                    }
                    renderItem={({ item }) => (
                        <Card style={{ marginBottom: 12 }} onPress={() => router.push({ pathname: '/brand/ad-request/[id]', params: { id: item.id } } as any)}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Avatar uri={item.channel.logoUrl} name={item.channel.name} size={44} rounded={false} />
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text numberOfLines={1} style={{ color: '#fff', fontSize: 15, fontFamily: fonts.semibold }}>{item.campaignName || item.channel.name}</Text>
                                    <Text numberOfLines={1} style={{ color: palette.textMuted, fontSize: 12, fontFamily: fonts.regular }}>
                                        {item.campaignName ? `${item.channel.name} · ` : ''}{item._count?.items ?? 0} item(s) · {timeAgo(item.createdAt)}
                                    </Text>
                                </View>
                                <StatusPill status={item.status} />
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                                <Text numberOfLines={1} style={{ color: palette.textSecondary, fontSize: 12, fontFamily: fonts.regular, flex: 1 }}>
                                    {item.channelNote ? `“${item.channelNote}”` : ' '}
                                </Text>
                                <Text style={{ color: '#fff', fontSize: 14, fontFamily: fonts.bold, marginLeft: 8 }}>{formatMoney(item.totalAmount, item.currency)}</Text>
                            </View>
                        </Card>
                    )}
                />
            )}
        </SafeAreaView>
    );
}
