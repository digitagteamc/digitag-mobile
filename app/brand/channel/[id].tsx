import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, BG, BRAND, Card, Chip, EmptyState, ErrorState, Loading, PrimaryButton, ScreenHeader } from '../../../Components/brand/ui';
import { useAuth } from '../../../context/AuthContext';
import { CatalogItem, Channel, formatCount, formatMoney, getChannel, getChannelCatalog } from '../../../services/brandService';
import { fonts, palette } from '../../../theme/colors';

/** Step 2: pick an ad type, browse this channel's catalog and build a
 *  selection (item + quantity), then continue to send the request. */
export default function ChannelDetailScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const { id, adTypeId: initialAdType } = useLocalSearchParams<{ id: string; adTypeId?: string }>();
    const [channel, setChannel] = useState<Channel | null>(null);
    const [catalog, setCatalog] = useState<CatalogItem[]>([]);
    const [adTypeId, setAdTypeId] = useState<string | undefined>(initialAdType || undefined);
    const [cart, setCart] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!token || !id) return;
        setLoading(true);
        // Whole catalog in one go — the ad-type chips filter it client-side
        // so switching types doesn't drop what's already in the selection.
        const [c, cat] = await Promise.all([getChannel(token, id), getChannelCatalog(token, id)]);
        if (c.success) setChannel(c.data); else setError(c.error);
        if (cat.success) setCatalog(cat.data);
        setLoading(false);
    }, [token, id]);

    useEffect(() => { load(); }, [load]);

    const visible = useMemo(() => (adTypeId ? catalog.filter((i) => i.adType.id === adTypeId) : catalog), [catalog, adTypeId]);
    const selected = catalog.filter((i) => cart[i.id]);
    const total = selected.reduce((n, i) => n + Number(i.price) * cart[i.id], 0);

    const setQty = (item: CatalogItem, qty: number) =>
        setCart((prev) => {
            const next = { ...prev };
            if (qty <= 0) delete next[item.id]; else next[item.id] = qty;
            return next;
        });

    const proceed = () => {
        const payload = selected.map((i) => ({
            catalogItemId: i.id, quantity: cart[i.id], name: i.name, adTypeName: i.adType.name, unit: i.unit, price: i.price, currency: i.currency,
        }));
        router.push({ pathname: '/brand/send-request', params: { channelId: id, channelName: channel?.name || '', items: JSON.stringify(payload) } } as any);
    };

    if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: BG }}><ScreenHeader title="Channel" /><Loading /></SafeAreaView>;
    if (!channel) return <SafeAreaView style={{ flex: 1, backgroundColor: BG }}><ScreenHeader title="Channel" /><ErrorState message={error || 'Channel not found'} onRetry={load} /></SafeAreaView>;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={['top', 'bottom']}>
            <ScreenHeader title={channel.name} subtitle="Ad catalog" />
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
                <Card>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Avatar uri={channel.logoUrl} name={channel.name} size={64} rounded={false} />
                        <View style={{ flex: 1, marginLeft: 14 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={{ color: '#fff', fontSize: 18, fontFamily: fonts.bold, flexShrink: 1 }}>{channel.name}</Text>
                                {channel.isVerified && <Ionicons name="checkmark-circle" size={16} color="#60A5FA" style={{ marginLeft: 5 }} />}
                            </View>
                            <Text style={{ color: palette.textMuted, fontSize: 12, fontFamily: fonts.regular, marginTop: 3 }}>
                                {[channel.type === 'YOUTUBE' ? 'YouTube' : channel.type, channel.subscriberCount ? `${formatCount(channel.subscriberCount)} reach` : null, channel.category, channel.region]
                                    .filter(Boolean).join(' · ')}
                            </Text>
                            {!!channel.languages?.length && (
                                <Text style={{ color: palette.textSubtle, fontSize: 12, fontFamily: fonts.regular, marginTop: 2 }}>{channel.languages.join(', ')}</Text>
                            )}
                        </View>
                    </View>
                    {!!channel.description && (
                        <Text style={{ color: palette.textSecondary, fontSize: 13, fontFamily: fonts.regular, marginTop: 12, lineHeight: 19 }}>{channel.description}</Text>
                    )}
                </Card>

                <Text style={{ color: '#fff', fontSize: 16, fontFamily: fonts.semibold, marginTop: 22, marginBottom: 10 }}>Type of ad</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <Chip label="All" active={!adTypeId} onPress={() => setAdTypeId(undefined)} />
                    {(channel.adTypes || []).map((a) => (
                        <Chip key={a.id} label={`${a.name} (${a.itemCount})`} active={adTypeId === a.id} onPress={() => setAdTypeId(a.id)} />
                    ))}
                </ScrollView>

                <Text style={{ color: '#fff', fontSize: 16, fontFamily: fonts.semibold, marginTop: 22, marginBottom: 10 }}>Catalog</Text>
                {!visible.length ? (
                    <EmptyState icon="pricetags-outline" title="Nothing listed here yet" message={adTypeId ? 'This channel has no items for that ad type.' : 'This channel has not published its rate card yet.'} />
                ) : visible.map((item) => {
                    const qty = cart[item.id] || 0;
                    const accent = item.adType.accentColor || BRAND.primary;
                    return (
                        <Card key={item.id} style={{ marginBottom: 12, borderColor: qty ? BRAND.border : 'rgba(255,255,255,0.08)' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: accent, fontSize: 11, fontFamily: fonts.semibold, marginBottom: 2 }}>{item.adType.name.toUpperCase()}</Text>
                                    <Text style={{ color: '#fff', fontSize: 15, fontFamily: fonts.semibold }}>{item.name}</Text>
                                    {!!item.slot && <Text style={{ color: palette.textSecondary, fontSize: 12, fontFamily: fonts.regular, marginTop: 2 }}>{item.slot}</Text>}
                                    {!!item.description && <Text style={{ color: palette.textMuted, fontSize: 12, fontFamily: fonts.regular, marginTop: 4, lineHeight: 17 }}>{item.description}</Text>}
                                </View>
                                <View style={{ alignItems: 'flex-end', marginLeft: 10 }}>
                                    <Text style={{ color: '#fff', fontSize: 16, fontFamily: fonts.bold }}>{formatMoney(item.price, item.currency)}</Text>
                                    <Text style={{ color: palette.textMuted, fontSize: 11, fontFamily: fonts.regular }}>{item.unit}</Text>
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                                <Text style={{ color: palette.textSubtle, fontSize: 11, fontFamily: fonts.regular }}>
                                    {item.minQuantity > 1 ? `Min. ${item.minQuantity}` : ' '}
                                </Text>
                                {qty === 0 ? (
                                    <TouchableOpacity
                                        onPress={() => setQty(item, item.minQuantity)}
                                        style={{ paddingHorizontal: 18, paddingVertical: 8, borderRadius: 999, backgroundColor: BRAND.primary }}
                                    >
                                        <Text style={{ color: '#fff', fontSize: 13, fontFamily: fonts.semibold }}>Add</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 999, borderWidth: 1, borderColor: BRAND.border }}>
                                        <TouchableOpacity onPress={() => setQty(item, qty - 1 < item.minQuantity ? 0 : qty - 1)} style={{ padding: 8, paddingHorizontal: 12 }}>
                                            <Ionicons name={qty <= item.minQuantity ? 'trash-outline' : 'remove'} size={16} color="#fff" />
                                        </TouchableOpacity>
                                        <Text style={{ color: '#fff', fontSize: 14, fontFamily: fonts.semibold, minWidth: 26, textAlign: 'center' }}>{qty}</Text>
                                        <TouchableOpacity onPress={() => setQty(item, qty + 1)} style={{ padding: 8, paddingHorizontal: 12 }}>
                                            <Ionicons name="add" size={16} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </Card>
                    );
                })}
            </ScrollView>

            {selected.length > 0 && (
                <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, paddingBottom: 28, backgroundColor: '#0d0d12', borderTopWidth: 1, borderTopColor: '#1d1d24' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                        <Text style={{ color: palette.textSecondary, fontFamily: fonts.regular }}>{selected.length} item{selected.length > 1 ? 's' : ''} selected</Text>
                        <Text style={{ color: '#fff', fontFamily: fonts.bold, fontSize: 16 }}>{formatMoney(total, selected[0]?.currency)}</Text>
                    </View>
                    <PrimaryButton title="Continue" onPress={proceed} />
                </View>
            )}
        </SafeAreaView>
    );
}
