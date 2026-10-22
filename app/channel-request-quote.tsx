import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Linking,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { createAdRequest, getChannelById, getChannelCatalog } from '../services/userService';
import { fonts } from '../theme/colors';

const BLUE = '#1A8CFF';
const PURPLE = '#6633E5';
const CARD = '#0F0F0F';
const BORDER = 'rgba(255,255,255,0.08)';

function rupees(n: number): string {
    return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

/** "2026-11-01" → ISO string, or null for blank; undefined when malformed. */
function parseDate(value: string): string | null | undefined {
    const v = value.trim();
    if (!v) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined;
    const d = new Date(`${v}T00:00:00`);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
}

/**
 * Brand → channel "Collab": pick the ad types / slots wanted from the
 * channel's rate card, set quantities and campaign details, and send it as a
 * quotation request (POST /ad-requests). The channel works it from its
 * portal — calls the brand, then marks it converted or not — and every status
 * change shows up in My Ad Requests.
 */
export default function ChannelRequestQuoteScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const { channelId, adTypeId } = useLocalSearchParams<{ channelId: string; adTypeId?: string }>();

    const [channel, setChannel] = useState<any>(null);
    const [catalog, setCatalog] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>(adTypeId || 'ALL');
    // catalogItemId → quantity
    const [selected, setSelected] = useState<Record<string, number>>({});

    const [campaignName, setCampaignName] = useState('');
    const [brief, setBrief] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [budget, setBudget] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (!token || !channelId) { setLoading(false); return; }
        Promise.all([getChannelById(token, channelId), getChannelCatalog(token, channelId)]).then(([chRes, catRes]) => {
            if (chRes.success) setChannel(chRes.data);
            if (catRes.success) setCatalog(catRes.data);
            setLoading(false);
        });
    }, [token, channelId]);

    const adTypes = useMemo(() => {
        const seen = new Map<string, string>();
        for (const item of catalog) if (item.adType && !seen.has(item.adType.id)) seen.set(item.adType.id, item.adType.name);
        return [...seen.entries()].map(([id, name]) => ({ id, name }));
    }, [catalog]);

    const visibleItems = filter === 'ALL' ? catalog : catalog.filter((i) => i.adType?.id === filter);
    const selectedItems = catalog.filter((i) => selected[i.id]);
    const estimate = selectedItems.reduce((sum, i) => sum + Number(i.price) * selected[i.id], 0);

    const toggle = (item: any) => {
        setSelected((prev) => {
            const next = { ...prev };
            if (next[item.id]) delete next[item.id];
            else next[item.id] = item.minQuantity || 1;
            return next;
        });
    };

    const changeQty = (item: any, delta: number) => {
        setSelected((prev) => {
            const min = item.minQuantity || 1;
            const qty = Math.max(min, (prev[item.id] || min) + delta);
            return { ...prev, [item.id]: qty };
        });
    };

    const selectAllVisible = () => {
        setSelected((prev) => {
            const next = { ...prev };
            for (const item of visibleItems) if (!next[item.id]) next[item.id] = item.minQuantity || 1;
            return next;
        });
    };

    const handleSend = async () => {
        if (!token || !channelId || sending) return;
        if (selectedItems.length === 0) {
            Alert.alert('Pick an ad', 'Select at least one ad you want from this channel.');
            return;
        }
        const start = parseDate(startDate);
        const end = parseDate(endDate);
        if (start === undefined || end === undefined) {
            Alert.alert('Check the dates', 'Use the format YYYY-MM-DD, e.g. 2026-11-01.');
            return;
        }
        if (start && end && end < start) {
            Alert.alert('Check the dates', 'The end date is before the start date.');
            return;
        }
        const budgetNum = budget.trim() ? Number(budget.replace(/[^\d.]/g, '')) : null;
        if (budgetNum !== null && !Number.isFinite(budgetNum)) {
            Alert.alert('Check the budget', 'Enter the budget as a number, e.g. 50000.');
            return;
        }

        setSending(true);
        const res = await createAdRequest(token, {
            channelId,
            campaignName: campaignName.trim() || undefined,
            brief: brief.trim() || undefined,
            startDate: start,
            endDate: end,
            budget: budgetNum,
            items: selectedItems.map((i) => ({ catalogItemId: i.id, quantity: selected[i.id] })),
        });
        setSending(false);
        if (!res.success) {
            Alert.alert('Could not send request', res.error || 'Please try again.');
            return;
        }
        Alert.alert(
            'Quotation requested',
            `${channel?.name || 'The channel'} will review your request and contact you. Track it in My Ad Requests.`,
            [{ text: 'OK', onPress: () => router.replace('/my-ad-requests' as any) }],
        );
    };

    const input = {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: fonts.regular,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(64,64,64,0.5)',
        paddingHorizontal: 14,
        paddingVertical: 12,
    } as const;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#060606' }} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor="#060606" />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 }}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' }}
                >
                    <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={{ color: '#FFFFFF', fontSize: 18, fontFamily: fonts.semibold }}>Request a Quote</Text>
                <View style={{ width: 36 }} />
            </View>

            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator color={BLUE} size="large" />
                </View>
            ) : (
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
                        <Text style={{ color: '#A1A2A4', fontSize: 12, fontFamily: fonts.regular }}>Collab with</Text>
                        <Text style={{ color: '#FFFFFF', fontSize: 22, fontFamily: fonts.semibold }}>{channel?.name || 'Channel'}</Text>

                        {/* Step 1 — ads */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22 }}>
                            <Text style={{ color: '#FFFFFF', fontSize: 16, fontFamily: fonts.semibold }}>1. Choose the ads you want</Text>
                            {visibleItems.length > 1 && (
                                <TouchableOpacity onPress={selectAllVisible}>
                                    <Text style={{ color: BLUE, fontSize: 12, fontFamily: fonts.medium }}>Select all</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {adTypes.length > 1 && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ gap: 8 }}>
                                {[{ id: 'ALL', name: 'All' }, ...adTypes].map((t) => {
                                    const active = filter === t.id;
                                    return (
                                        <TouchableOpacity
                                            key={t.id}
                                            onPress={() => setFilter(t.id)}
                                            style={{
                                                paddingHorizontal: 16,
                                                paddingVertical: 7,
                                                borderRadius: 16,
                                                borderWidth: 1,
                                                borderColor: active ? BLUE : '#404052',
                                                backgroundColor: active ? BLUE : 'transparent',
                                            }}
                                        >
                                            <Text style={{ color: '#FFFFFF', fontSize: 12, fontFamily: fonts.medium }}>{t.name}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        )}

                        {catalog.length === 0 ? (
                            <View style={{ backgroundColor: CARD, borderRadius: 14, padding: 16, marginTop: 12, borderWidth: 1, borderColor: BORDER }}>
                                <Text style={{ color: '#D1D2D4', fontSize: 13, fontFamily: fonts.regular, lineHeight: 19 }}>
                                    This channel hasn&apos;t published its ad rates on Digitag yet, so a quote can&apos;t be requested here.
                                    {channel?.contactEmail ? ` You can reach them at ${channel.contactEmail}.` : ''}
                                </Text>
                            </View>
                        ) : (
                            <View style={{ marginTop: 12, gap: 10 }}>
                                {visibleItems.map((item) => {
                                    const qty = selected[item.id];
                                    const isOn = !!qty;
                                    return (
                                        <View
                                            key={item.id}
                                            style={{
                                                backgroundColor: CARD,
                                                borderRadius: 14,
                                                padding: 14,
                                                borderWidth: 1.5,
                                                borderColor: isOn ? BLUE : BORDER,
                                            }}
                                        >
                                            <TouchableOpacity onPress={() => toggle(item)} activeOpacity={0.8} style={{ flexDirection: 'row', gap: 12 }}>
                                                <View
                                                    style={{
                                                        width: 22,
                                                        height: 22,
                                                        borderRadius: 6,
                                                        marginTop: 2,
                                                        borderWidth: 1.5,
                                                        borderColor: isOn ? BLUE : 'rgba(255,255,255,0.4)',
                                                        backgroundColor: isOn ? BLUE : 'transparent',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    {isOn && <Ionicons name="checkmark" size={15} color="#FFFFFF" />}
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ color: '#A1A2A4', fontSize: 11, fontFamily: fonts.medium }}>{item.adType?.name}</Text>
                                                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontFamily: fonts.semibold, marginTop: 1 }}>{item.name}</Text>
                                                    {!!item.description && (
                                                        <Text style={{ color: '#A1A2A4', fontSize: 12, fontFamily: fonts.regular, marginTop: 4, lineHeight: 17 }} numberOfLines={3}>
                                                            {item.description}
                                                        </Text>
                                                    )}
                                                    <Text style={{ color: '#00E5C3', fontSize: 13, fontFamily: fonts.semibold, marginTop: 6 }}>
                                                        Starts at {rupees(Number(item.price))} <Text style={{ color: '#A1A2A4', fontFamily: fonts.regular }}>/ {item.unit}</Text>
                                                    </Text>
                                                    {!!(item.slot || item.durationSeconds) && (
                                                        <Text style={{ color: '#A1A2A4', fontSize: 11, fontFamily: fonts.regular, marginTop: 2 }}>
                                                            {[item.slot, item.durationSeconds ? `${item.durationSeconds}s` : null].filter(Boolean).join(' · ')}
                                                        </Text>
                                                    )}
                                                </View>
                                            </TouchableOpacity>

                                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, marginLeft: 34 }}>
                                                {item.mediaUrl ? (
                                                    <TouchableOpacity onPress={() => Linking.openURL(item.mediaUrl)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                        <Ionicons name="play-circle-outline" size={16} color={BLUE} />
                                                        <Text style={{ color: BLUE, fontSize: 12, fontFamily: fonts.medium }}>Watch demo ad</Text>
                                                    </TouchableOpacity>
                                                ) : <View />}
                                                {isOn && (
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                                        <TouchableOpacity onPress={() => changeQty(item, -1)} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#24242E', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Ionicons name="remove" size={16} color="#FFFFFF" />
                                                        </TouchableOpacity>
                                                        <Text style={{ color: '#FFFFFF', fontSize: 14, fontFamily: fonts.semibold, minWidth: 22, textAlign: 'center' }}>{qty}</Text>
                                                        <TouchableOpacity onPress={() => changeQty(item, 1)} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#24242E', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Ionicons name="add" size={16} color="#FFFFFF" />
                                                        </TouchableOpacity>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        )}

                        {/* Step 2 — campaign details */}
                        {catalog.length > 0 && (
                            <>
                                <Text style={{ color: '#FFFFFF', fontSize: 16, fontFamily: fonts.semibold, marginTop: 26 }}>2. Campaign details</Text>
                                <View style={{ gap: 12, marginTop: 12 }}>
                                    <TextInput value={campaignName} onChangeText={setCampaignName} placeholder="Campaign name (e.g. Diwali launch)" placeholderTextColor="#6E7180" style={input} maxLength={150} />
                                    <TextInput
                                        value={brief}
                                        onChangeText={setBrief}
                                        placeholder="Requirements — product, target audience, preferred time slots, languages…"
                                        placeholderTextColor="#6E7180"
                                        style={[input, { minHeight: 100, textAlignVertical: 'top' }]}
                                        multiline
                                        maxLength={3000}
                                    />
                                    <View style={{ flexDirection: 'row', gap: 10 }}>
                                        <TextInput value={startDate} onChangeText={setStartDate} placeholder="Start (YYYY-MM-DD)" placeholderTextColor="#6E7180" style={[input, { flex: 1 }]} maxLength={10} />
                                        <TextInput value={endDate} onChangeText={setEndDate} placeholder="End (YYYY-MM-DD)" placeholderTextColor="#6E7180" style={[input, { flex: 1 }]} maxLength={10} />
                                    </View>
                                    <TextInput value={budget} onChangeText={setBudget} placeholder="Your budget in ₹ (optional)" placeholderTextColor="#6E7180" style={input} keyboardType="numeric" />
                                </View>
                            </>
                        )}
                    </ScrollView>

                    {catalog.length > 0 && (
                        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, paddingBottom: 24, backgroundColor: '#060606', borderTopWidth: 1, borderTopColor: BORDER }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                                <Text style={{ color: '#A1A2A4', fontSize: 12, fontFamily: fonts.regular }}>
                                    {selectedItems.length} ad{selectedItems.length === 1 ? '' : 's'} selected · estimate at listed rates
                                </Text>
                                <Text style={{ color: '#FFFFFF', fontSize: 14, fontFamily: fonts.semibold }}>{rupees(estimate)}</Text>
                            </View>
                            <TouchableOpacity onPress={handleSend} disabled={sending} activeOpacity={0.85} style={{ height: 52, borderRadius: 26, overflow: 'hidden' }}>
                                <LinearGradient colors={[BLUE, PURPLE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                    {sending
                                        ? <ActivityIndicator color="#FFFFFF" />
                                        : <Text style={{ color: '#FFFFFF', fontSize: 16, fontFamily: fonts.semibold }}>Request Quotation</Text>}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    )}
                </KeyboardAvoidingView>
            )}
        </SafeAreaView>
    );
}
