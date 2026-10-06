import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, BG, BRAND, Card, ErrorState, GhostButton, Loading, ScreenHeader, StatusPill, formatDate, inputStyle, timeAgo } from '../../../Components/brand/ui';
import { useAuth } from '../../../context/AuthContext';
import { AD_REQUEST_STATUS_LABEL, AdRequest, addAdRequestNote, cancelAdRequest, formatMoney, getAdRequest } from '../../../services/brandService';
import { fonts, palette } from '../../../theme/colors';

const CANCELLABLE = ['PENDING', 'UNDER_REVIEW'];

/** One ad request: what was asked for, the channel's response and the full
 *  back-and-forth timeline (same events the channel sees in its CRM). */
export default function AdRequestDetailScreen() {
    const { token } = useAuth();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [req, setReq] = useState<AdRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        if (!token || !id) return;
        const res = await getAdRequest(token, id);
        if (res.success) { setReq(res.data); setError(null); } else setError(res.error);
        setLoading(false);
    }, [token, id]);

    useEffect(() => { load(); }, [load]);

    const sendNote = async () => {
        if (!token || !note.trim()) return;
        setBusy(true);
        const res = await addAdRequestNote(token, id, note.trim());
        setBusy(false);
        if (res.success) { setReq(res.data); setNote(''); } else Alert.alert('Could not send', res.error);
    };

    const cancel = () => {
        Alert.alert('Cancel this request?', 'The channel will see it as cancelled. This cannot be undone.', [
            { text: 'Keep it', style: 'cancel' },
            {
                text: 'Cancel request', style: 'destructive', onPress: async () => {
                    setBusy(true);
                    const res = await cancelAdRequest(token!, id);
                    setBusy(false);
                    if (res.success) setReq(res.data); else Alert.alert('Could not cancel', res.error);
                },
            },
        ]);
    };

    if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: BG }}><ScreenHeader title="Ad request" /><Loading /></SafeAreaView>;
    if (!req) return <SafeAreaView style={{ flex: 1, backgroundColor: BG }}><ScreenHeader title="Ad request" /><ErrorState message={error || 'Not found'} onRetry={load} /></SafeAreaView>;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={['top', 'bottom']}>
            <ScreenHeader title={req.campaignName || 'Ad request'} subtitle={req.channel.name} />
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView
                    contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
                    keyboardShouldPersistTaps="handled"
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={BRAND.primary} />}
                >
                    <Card>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Avatar uri={req.channel.logoUrl} name={req.channel.name} size={48} rounded={false} />
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={{ color: '#fff', fontSize: 15, fontFamily: fonts.semibold }}>{req.channel.name}</Text>
                                <Text style={{ color: palette.textMuted, fontSize: 12, fontFamily: fonts.regular }}>Sent {timeAgo(req.createdAt)}</Text>
                            </View>
                            <StatusPill status={req.status} />
                        </View>
                        {!!req.channelNote && (
                            <View style={{ marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: BRAND.soft }}>
                                <Text style={{ color: BRAND.light, fontSize: 11, fontFamily: fonts.semibold, marginBottom: 2 }}>LATEST FROM THE CHANNEL</Text>
                                <Text style={{ color: '#fff', fontSize: 13, fontFamily: fonts.regular, lineHeight: 19 }}>{req.channelNote}</Text>
                            </View>
                        )}
                    </Card>

                    <Text style={{ color: '#fff', fontSize: 16, fontFamily: fonts.semibold, marginTop: 20, marginBottom: 10 }}>Ads requested</Text>
                    <Card>
                        {(req.items || []).map((i, idx) => (
                            <View key={i.id} style={{ paddingVertical: 10, borderTopWidth: idx ? 1 : 0, borderTopColor: 'rgba(255,255,255,0.06)' }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: palette.textMuted, fontSize: 11, fontFamily: fonts.semibold }}>{i.adTypeName.toUpperCase()}</Text>
                                        <Text style={{ color: '#fff', fontSize: 14, fontFamily: fonts.semibold }}>{i.itemName}</Text>
                                        <Text style={{ color: palette.textMuted, fontSize: 12, fontFamily: fonts.regular }}>{i.quantity} × {formatMoney(i.unitPrice, req.currency)} {i.unit}</Text>
                                        {!!i.notes && <Text style={{ color: palette.textSecondary, fontSize: 12, fontFamily: fonts.regular, marginTop: 2 }}>Note: {i.notes}</Text>}
                                    </View>
                                    <Text style={{ color: '#fff', fontSize: 14, fontFamily: fonts.bold }}>{formatMoney(i.lineTotal, req.currency)}</Text>
                                </View>
                            </View>
                        ))}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}>
                            <Text style={{ color: palette.textSecondary, fontFamily: fonts.semibold }}>Total</Text>
                            <Text style={{ color: '#fff', fontFamily: fonts.bold, fontSize: 17 }}>{formatMoney(req.totalAmount, req.currency)}</Text>
                        </View>
                    </Card>

                    <Text style={{ color: '#fff', fontSize: 16, fontFamily: fonts.semibold, marginTop: 20, marginBottom: 10 }}>Campaign</Text>
                    <Card>
                        <Row label="Dates" value={req.startDate || req.endDate ? `${formatDate(req.startDate)} → ${formatDate(req.endDate)}` : 'Flexible'} />
                        <Row label="Budget" value={req.budget ? formatMoney(req.budget, req.currency) : '—'} />
                        {!!req.brief && <Text style={{ color: palette.textSecondary, fontSize: 13, fontFamily: fonts.regular, marginTop: 8, lineHeight: 19 }}>{req.brief}</Text>}
                    </Card>

                    <Text style={{ color: '#fff', fontSize: 16, fontFamily: fonts.semibold, marginTop: 20, marginBottom: 10 }}>Timeline</Text>
                    {(req.events || []).slice().reverse().map((e) => {
                        const mine = e.actor === 'BRAND';
                        return (
                            <View key={e.id} style={{ flexDirection: 'row', marginBottom: 12 }}>
                                <View style={{ width: 28, alignItems: 'center' }}>
                                    <View style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: mine ? BRAND.soft : 'rgba(96,165,250,0.15)' }}>
                                        <Ionicons name={e.toStatus ? 'swap-horizontal' : 'chatbubble-ellipses-outline'} size={12} color={mine ? BRAND.primary : '#60A5FA'} />
                                    </View>
                                </View>
                                <View style={{ flex: 1, marginLeft: 8 }}>
                                    <Text style={{ color: '#fff', fontSize: 13, fontFamily: fonts.semibold }}>
                                        {mine ? 'You' : e.actorName || 'Channel'}
                                        {e.toStatus ? <Text style={{ color: palette.textMuted, fontFamily: fonts.regular }}> · {e.fromStatus ? 'moved to ' : ''}{AD_REQUEST_STATUS_LABEL[e.toStatus]}</Text> : null}
                                    </Text>
                                    {!!e.note && <Text style={{ color: palette.textSecondary, fontSize: 13, fontFamily: fonts.regular, marginTop: 2, lineHeight: 18 }}>{e.note}</Text>}
                                    <Text style={{ color: palette.textSubtle, fontSize: 11, fontFamily: fonts.regular, marginTop: 2 }}>{timeAgo(e.createdAt)}</Text>
                                </View>
                            </View>
                        );
                    })}

                    {!['CANCELLED', 'REJECTED', 'COMPLETED'].includes(req.status) && (
                        <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 6 }}>
                            <TextInput
                                value={note}
                                onChangeText={setNote}
                                placeholder="Message the channel…"
                                placeholderTextColor="#555"
                                multiline
                                style={{ ...inputStyle, flex: 1, maxHeight: 110 }}
                            />
                            <TouchableOpacity
                                onPress={sendNote}
                                disabled={busy || !note.trim()}
                                style={{ marginLeft: 8, width: 46, height: 46, borderRadius: 23, backgroundColor: BRAND.primary, alignItems: 'center', justifyContent: 'center', opacity: busy || !note.trim() ? 0.5 : 1 }}
                            >
                                <Ionicons name="send" size={18} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {CANCELLABLE.includes(req.status) && (
                        <GhostButton title="Cancel request" color="#EF4444" onPress={cancel} style={{ marginTop: 20 }} />
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
            <Text style={{ color: palette.textMuted, fontSize: 13, fontFamily: fonts.regular }}>{label}</Text>
            <Text style={{ color: '#fff', fontSize: 13, fontFamily: fonts.semibold }}>{value}</Text>
        </View>
    );
}
