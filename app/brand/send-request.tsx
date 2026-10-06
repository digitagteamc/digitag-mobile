import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BG, Card, Field, PrimaryButton, ScreenHeader, inputStyle } from '../../Components/brand/ui';
import { useAuth } from '../../context/AuthContext';
import { createAdRequest, formatMoney } from '../../services/brandService';
import { fonts, palette } from '../../theme/colors';

type Line = { catalogItemId: string; quantity: number; name: string; adTypeName: string; unit: string; price: string; currency: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Step 3: campaign details for the selected catalog items -> "Send request".
 *  The request lands in the channel's CRM inbox. */
export default function SendRequestScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const params = useLocalSearchParams<{ channelId: string; channelName?: string; items: string }>();
    const lines: Line[] = useMemo(() => {
        try { return JSON.parse(params.items || '[]'); } catch { return []; }
    }, [params.items]);

    const [campaignName, setCampaignName] = useState('');
    const [brief, setBrief] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [budget, setBudget] = useState('');
    const [notes, setNotes] = useState<Record<string, string>>({});
    const [sending, setSending] = useState(false);

    const total = lines.reduce((n, l) => n + Number(l.price) * l.quantity, 0);
    const currency = lines[0]?.currency || 'INR';

    const submit = async () => {
        if (!token) return;
        if (!brief.trim()) { Alert.alert('Add a brief', 'Tell the channel what you want to promote.'); return; }
        for (const [label, v] of [['Start date', startDate], ['End date', endDate]] as const) {
            if (v && !DATE_RE.test(v)) { Alert.alert(`Invalid ${label.toLowerCase()}`, 'Use the format YYYY-MM-DD, e.g. 2026-11-01.'); return; }
        }
        if (startDate && endDate && endDate < startDate) { Alert.alert('Check your dates', 'End date must be on or after the start date.'); return; }
        const budgetNum = budget.trim() ? Number(budget.replace(/[,\s₹]/g, '')) : null;
        if (budgetNum !== null && (!Number.isFinite(budgetNum) || budgetNum < 0)) { Alert.alert('Invalid budget', 'Enter the budget as a number.'); return; }

        setSending(true);
        const res = await createAdRequest(token, {
            channelId: params.channelId,
            campaignName: campaignName.trim() || undefined,
            brief: brief.trim(),
            startDate: startDate || null,
            endDate: endDate || null,
            budget: budgetNum,
            items: lines.map((l) => ({ catalogItemId: l.catalogItemId, quantity: l.quantity, notes: notes[l.catalogItemId]?.trim() || undefined })),
        });
        setSending(false);

        if (!res.success) {
            if (res.code?.startsWith('BRAND_')) {
                Alert.alert('Approval needed', res.error, [{ text: 'View status', onPress: () => router.push('/signup/pending?role=BRAND' as any) }, { text: 'OK' }]);
                return;
            }
            Alert.alert('Could not send request', res.error);
            return;
        }
        Alert.alert('Request sent', `${params.channelName || 'The channel'} will review it and reply here.`);
        router.replace({ pathname: '/brand/ad-request/[id]', params: { id: res.data.id } } as any);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={['top', 'bottom']}>
            <ScreenHeader title="Send request" subtitle={params.channelName} />
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
                    <Text style={{ color: '#fff', fontSize: 16, fontFamily: fonts.semibold, marginBottom: 10 }}>Selected ads</Text>
                    {lines.map((l) => (
                        <Card key={l.catalogItemId} style={{ marginBottom: 10 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: palette.textMuted, fontSize: 11, fontFamily: fonts.semibold }}>{l.adTypeName.toUpperCase()}</Text>
                                    <Text style={{ color: '#fff', fontSize: 14, fontFamily: fonts.semibold }}>{l.name}</Text>
                                    <Text style={{ color: palette.textMuted, fontSize: 12, fontFamily: fonts.regular }}>
                                        {l.quantity} × {formatMoney(l.price, l.currency)} {l.unit}
                                    </Text>
                                </View>
                                <Text style={{ color: '#fff', fontSize: 14, fontFamily: fonts.bold }}>{formatMoney(Number(l.price) * l.quantity, l.currency)}</Text>
                            </View>
                            <TextInput
                                value={notes[l.catalogItemId] || ''}
                                onChangeText={(v) => setNotes((n) => ({ ...n, [l.catalogItemId]: v }))}
                                placeholder="Notes for this item (optional) — e.g. preferred timing"
                                placeholderTextColor="#555"
                                style={{ ...inputStyle, marginTop: 10, fontSize: 13, paddingVertical: 10 }}
                            />
                        </Card>
                    ))}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, marginBottom: 12 }}>
                        <Text style={{ color: palette.textSecondary, fontFamily: fonts.semibold }}>Estimated total</Text>
                        <Text style={{ color: '#fff', fontFamily: fonts.bold, fontSize: 17 }}>{formatMoney(total, currency)}</Text>
                    </View>

                    <Text style={{ color: '#fff', fontSize: 16, fontFamily: fonts.semibold, marginBottom: 12 }}>Campaign details</Text>
                    <Field label="Campaign name">
                        <TextInput value={campaignName} onChangeText={setCampaignName} placeholder="Diwali launch" placeholderTextColor="#555" style={inputStyle} />
                    </Field>
                    <Field label="Brief *" hint="What you're promoting, target audience, creatives you'll provide.">
                        <TextInput
                            value={brief}
                            onChangeText={setBrief}
                            placeholder="Launching our new masala range across Telangana…"
                            placeholderTextColor="#555"
                            multiline
                            style={{ ...inputStyle, minHeight: 110, textAlignVertical: 'top' }}
                        />
                    </Field>
                    <View style={{ flexDirection: 'row' }}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <Field label="Start date">
                                <TextInput value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" placeholderTextColor="#555" keyboardType="numbers-and-punctuation" style={inputStyle} maxLength={10} />
                            </Field>
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                            <Field label="End date">
                                <TextInput value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" placeholderTextColor="#555" keyboardType="numbers-and-punctuation" style={inputStyle} maxLength={10} />
                            </Field>
                        </View>
                    </View>
                    <Field label="Your budget (₹)" hint="Optional — helps the channel tailor an offer.">
                        <TextInput value={budget} onChangeText={setBudget} placeholder="100000" placeholderTextColor="#555" keyboardType="numeric" style={inputStyle} />
                    </Field>

                    <PrimaryButton title="Send request" onPress={submit} loading={sending} style={{ marginTop: 8 }} />
                    <Text style={{ color: palette.textSubtle, fontSize: 11, fontFamily: fonts.regular, textAlign: 'center', marginTop: 10 }}>
                        Prices are the channel&apos;s listed rates. The final deal is confirmed by the channel.
                    </Text>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
