import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { cancelAdRequest, getAdRequestById, listMyAdRequests } from '../services/userService';
import { fonts, palette } from '../theme/colors';

const BLUE = '#1A8CFF';

// How each AdRequestStatus reads to the brand. The channel moves requests
// through these from its portal after contacting the brand.
const STATUS: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'Sent · awaiting channel', color: '#F59E0B' },
    UNDER_REVIEW: { label: 'In discussion', color: '#60A5FA' },
    ACCEPTED: { label: 'Confirmed', color: '#00C853' },
    REJECTED: { label: 'Declined by channel', color: '#EF4444' },
    CANCELLED: { label: 'Cancelled', color: '#8A8A99' },
    IN_PROGRESS: { label: 'Live', color: '#00E5C3' },
    COMPLETED: { label: 'Completed', color: '#B8B8C6' },
};

const CANCELLABLE = ['PENDING', 'UNDER_REVIEW'];

function rupees(v: any): string {
    const n = Number(v);
    return Number.isFinite(n) ? `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—';
}

function fmtDate(v?: string | null): string {
    return v ? new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
}

/** Brand's quotation requests to TV / YouTube channels, with each one's status trail. */
export default function MyAdRequestsScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [openId, setOpenId] = useState<string | null>(null);
    const [details, setDetails] = useState<Record<string, any>>({});
    const [busyId, setBusyId] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!token) { setLoading(false); return; }
        const res = await listMyAdRequests(token);
        if (res.success) setItems(res.data);
        setLoading(false);
        setRefreshing(false);
    }, [token]);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    const toggle = async (id: string) => {
        if (openId === id) { setOpenId(null); return; }
        setOpenId(id);
        if (!token) return;
        const res = await getAdRequestById(token, id);
        if (res.success) setDetails((prev) => ({ ...prev, [id]: res.data }));
    };

    const cancel = (id: string) => {
        Alert.alert('Cancel this request?', 'The channel will be told you no longer need this quote.', [
            { text: 'Keep it', style: 'cancel' },
            {
                text: 'Cancel request',
                style: 'destructive',
                onPress: async () => {
                    if (!token) return;
                    setBusyId(id);
                    const res = await cancelAdRequest(token, id);
                    setBusyId(null);
                    if (!res.success) { Alert.alert('Could not cancel', res.error || 'Please try again.'); return; }
                    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'CANCELLED' } : r)));
                    const fresh = await getAdRequestById(token, id);
                    if (fresh.success) setDetails((prev) => ({ ...prev, [id]: fresh.data }));
                },
            },
        ]);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }} edges={['top']}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10 }}>
                <TouchableOpacity onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="chevron-back" size={20} color="#fff" />
                </TouchableOpacity>
                <Text style={{ color: '#fff', fontSize: 16, fontFamily: fonts.semibold, flex: 1, textAlign: 'center' }}>My Ad Requests</Text>
                <View style={{ width: 36 }} />
            </View>

            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator color={BLUE} size="large" />
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={BLUE} />}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 80, gap: 10, paddingHorizontal: 24 }}>
                            <Ionicons name="tv-outline" size={40} color={palette.borderStrong} />
                            <Text style={{ color: palette.textMuted, fontSize: 14, fontFamily: fonts.regular, textAlign: 'center' }}>
                                No ad requests yet. Open a TV or YouTube channel and tap Collab to request a quote.
                            </Text>
                        </View>
                    }
                    renderItem={({ item }) => {
                        const st = STATUS[item.status] || { label: item.status, color: '#fff' };
                        const d = details[item.id];
                        const isOpen = openId === item.id;
                        return (
                            <TouchableOpacity activeOpacity={0.85} onPress={() => toggle(item.id)} style={{ backgroundColor: '#1A1A1A', borderRadius: 16, padding: 14 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <Image
                                        source={item.channel?.logoUrl ? { uri: item.channel.logoUrl } : require('../assets/defaultavatar.png')}
                                        style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: palette.surfaceAlt }}
                                    />
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: '#fff', fontSize: 14, fontFamily: fonts.semibold }} numberOfLines={1}>{item.channel?.name || 'Channel'}</Text>
                                        <Text style={{ color: palette.textMuted, fontSize: 11, fontFamily: fonts.regular }} numberOfLines={1}>
                                            {item.campaignName || 'Ad request'} · {fmtDate(item.createdAt)}
                                        </Text>
                                    </View>
                                    <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.textMuted} />
                                </View>

                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#272728', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 }}>
                                        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: st.color }} />
                                        <Text style={{ color: '#fff', fontSize: 11, fontFamily: fonts.medium }}>{st.label}</Text>
                                    </View>
                                    <Text style={{ color: '#fff', fontSize: 13, fontFamily: fonts.semibold }}>{rupees(item.totalAmount)}</Text>
                                </View>

                                {isOpen && (
                                    !d ? (
                                        <ActivityIndicator color={BLUE} style={{ marginTop: 14 }} />
                                    ) : (
                                        <View style={{ marginTop: 14, gap: 12 }}>
                                            <View style={{ gap: 6 }}>
                                                {d.items?.map((it: any) => (
                                                    <View key={it.id} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                                                        <Text style={{ color: palette.textSecondary, fontSize: 12, fontFamily: fonts.regular, flex: 1 }}>
                                                            {it.adTypeName} · {it.itemName} × {it.quantity}
                                                        </Text>
                                                        <Text style={{ color: palette.textSecondary, fontSize: 12, fontFamily: fonts.regular }}>{rupees(it.lineTotal)}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                            {!!d.brief && <Text style={{ color: palette.textMuted, fontSize: 12, fontFamily: fonts.regular, lineHeight: 17 }}>{d.brief}</Text>}
                                            {!!d.channelNote && (
                                                <View style={{ backgroundColor: 'rgba(26,140,255,0.12)', borderRadius: 10, padding: 10 }}>
                                                    <Text style={{ color: '#9CC9FF', fontSize: 11, fontFamily: fonts.medium }}>Latest from the channel</Text>
                                                    <Text style={{ color: '#fff', fontSize: 12, fontFamily: fonts.regular, marginTop: 2 }}>{d.channelNote}</Text>
                                                </View>
                                            )}
                                            <View style={{ gap: 6 }}>
                                                {d.events?.filter((e: any) => e.toStatus).map((e: any) => (
                                                    <Text key={e.id} style={{ color: palette.textMuted, fontSize: 11, fontFamily: fonts.regular }}>
                                                        {fmtDate(e.createdAt)} — {STATUS[e.toStatus]?.label || e.toStatus}
                                                    </Text>
                                                ))}
                                            </View>
                                            {CANCELLABLE.includes(item.status) && (
                                                <TouchableOpacity
                                                    onPress={() => cancel(item.id)}
                                                    disabled={busyId === item.id}
                                                    style={{ alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(239,68,68,0.6)', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 7 }}
                                                >
                                                    {busyId === item.id
                                                        ? <ActivityIndicator size="small" color="#EF4444" />
                                                        : <Text style={{ color: '#EF4444', fontSize: 12, fontFamily: fonts.medium }}>Cancel request</Text>}
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    )
                                )}
                            </TouchableOpacity>
                        );
                    }}
                />
            )}
        </SafeAreaView>
    );
}
