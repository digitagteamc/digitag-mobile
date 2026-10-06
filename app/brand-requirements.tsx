import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, BG, Card, EmptyState, ErrorState, Pill, ScreenHeader, inputStyle, timeAgo } from '../Components/brand/ui';
import { useAuth } from '../context/AuthContext';
import { useProfileGate } from '../context/ProfileGateContext';
import { listBrandRequirements } from '../services/brandService';
import { openConversationWith, sendCollaboration } from '../services/userService';
import { fonts, palette } from '../theme/colors';
import { useRoleTheme } from '../theme/useRoleTheme';

/** Creator / Freelancer view of brand requirement posts. Creators see every
 *  brand post; freelancers only those marked "freelancer required". "Collab"
 *  sends a request the brand reviews; once accepted, chat opens. */
export default function BrandRequirementsScreen() {
    const router = useRouter();
    const theme = useRoleTheme();
    const { token, userRole } = useAuth();
    const { requireProfile } = useProfileGate();
    const [items, setItems] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    // Debounced copy of `search` — the one load() actually uses.
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [composer, setComposer] = useState<any | null>(null);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    const load = useCallback(async () => {
        if (!token) return;
        const res = await listBrandRequirements(token, { search: query || undefined });
        if (res.success) { setItems(res.data.items); setError(null); } else setError(res.error);
        setLoading(false);
    }, [token, query]);

    useFocusEffect(useCallback(() => { load(); }, [load]));
    useEffect(() => {
        const t = setTimeout(() => setQuery(search.trim()), 300);
        return () => clearTimeout(t);
    }, [search]);

    const startCollab = (post: any) => {
        if (!requireProfile('send a collab request')) return;
        setMessage('');
        setComposer(post);
    };

    const sendCollab = async () => {
        if (!token || !composer) return;
        setSending(true);
        const res = await sendCollaboration(token, { receiverId: composer.owner.id, postId: composer.id, message: message.trim() || undefined });
        setSending(false);
        if (!res.success) { Alert.alert('Could not send', res.error || 'Try again.'); return; }
        setItems((prev) => prev.map((p) => (p.id === composer.id ? { ...p, myCollaboration: { id: res.data?.id, status: 'PENDING', conversationId: null } } : p)));
        setComposer(null);
        Alert.alert('Collab request sent', `${composer.owner?.name || 'The brand'} will review your profile. You'll be notified when they respond.`);
    };

    const openChat = async (post: any) => {
        const convId = post.myCollaboration?.conversationId;
        if (convId) { router.push({ pathname: '/chat/[id]', params: { id: convId } } as any); return; }
        const res = await openConversationWith(token!, post.owner.id);
        if (res.success && res.data?.id) router.push({ pathname: '/chat/[id]', params: { id: res.data.id } } as any);
        else Alert.alert('Chat unavailable', res.error || 'Try again.');
    };

    const action = (post: any) => {
        const st = post.myCollaboration?.status;
        if (st === 'PENDING') return { label: 'Requested', icon: 'time-outline' as const, disabled: true, solid: false };
        if (st === 'ACCEPTED' || st === 'COMPLETED') return { label: 'Chat', icon: 'chatbubble-ellipses-outline' as const, onPress: () => openChat(post), solid: true };
        if (post.status === 'COMPLETED') return { label: 'Filled', icon: 'checkmark-done' as const, disabled: true, solid: false };
        if (st === 'DECLINED') return { label: 'Declined', icon: 'close-circle-outline' as const, disabled: true, solid: false };
        return { label: 'Collab', icon: 'flash-outline' as const, onPress: () => startCollab(post), solid: true };
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={['top', 'bottom']}>
            <ScreenHeader title="Brand Requirements" subtitle={userRole === 'FREELANCER' ? 'Brands looking for freelancers' : 'Brands looking for creators'} />
            <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', ...inputStyle, paddingVertical: 0 }}>
                    <Ionicons name="search" size={18} color={palette.textMuted} />
                    <TextInput value={search} onChangeText={setSearch} placeholder="Search brands or requirements" placeholderTextColor="#666"
                        style={{ flex: 1, color: '#fff', paddingVertical: 12, marginLeft: 8, fontFamily: fonts.regular }} />
                </View>
            </View>

            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color={theme.primary} /></View>
            ) : error && !items.length ? <ErrorState message={error} onRetry={load} /> : (
                <FlatList
                    data={items}
                    keyExtractor={(p) => p.id}
                    contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={theme.primary} />}
                    ListEmptyComponent={<EmptyState icon="business-outline" title="No brand requirements right now" message="New requirements from brands show up here — we'll notify you too." />}
                    renderItem={({ item: p }) => {
                        const a = action(p);
                        const open = expanded === p.id;
                        return (
                            <Card style={{ marginBottom: 12 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Avatar uri={p.owner?.profilePicture} name={p.owner?.name} size={44} rounded={false} color="#7352DD" />
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text numberOfLines={1} style={{ color: '#fff', fontSize: 14, fontFamily: fonts.semibold }}>{p.owner?.name || 'Brand'}</Text>
                                        <Text numberOfLines={1} style={{ color: palette.textMuted, fontSize: 12, fontFamily: fonts.regular }}>
                                            {[p.owner?.industry, p.owner?.location, timeAgo(p.createdAt)].filter(Boolean).join(' · ')}
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity activeOpacity={0.8} onPress={() => setExpanded(open ? null : p.id)}>
                                    {!!p.title && <Text style={{ color: '#fff', fontSize: 16, fontFamily: fonts.bold, marginTop: 12 }}>{p.title}</Text>}
                                    <Text numberOfLines={open ? undefined : 3} style={{ color: palette.textSecondary, fontSize: 13, fontFamily: fonts.regular, marginTop: 6, lineHeight: 19 }}>
                                        {p.description}
                                    </Text>
                                    {!open && (p.description?.length || 0) > 140 && (
                                        <Text style={{ color: theme.primary, fontSize: 12, fontFamily: fonts.semibold, marginTop: 4 }}>Read more</Text>
                                    )}
                                </TouchableOpacity>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                                    <Pill label={p.collaborationType === 'PAID' ? 'Paid' : 'Barter / Unpaid'} color={p.collaborationType === 'PAID' ? '#22C55E' : '#8A8A99'} />
                                    {!!p.budget && <Pill label={p.budget} color="#F59E0B" />}
                                    {!!p.category && <Pill label={p.category} color="#7352DD" />}
                                    {!!p.location && <Pill label={p.location} color="#60A5FA" />}
                                </View>
                                <TouchableOpacity
                                    onPress={a.onPress}
                                    disabled={a.disabled}
                                    activeOpacity={0.85}
                                    style={{
                                        marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12,
                                        backgroundColor: a.solid ? theme.primary : 'transparent', borderWidth: 1, borderColor: a.solid ? theme.primary : 'rgba(255,255,255,0.15)',
                                    }}
                                >
                                    <Ionicons name={a.icon} size={16} color={a.solid ? '#fff' : palette.textMuted} />
                                    <Text style={{ color: a.solid ? '#fff' : palette.textMuted, fontSize: 14, fontFamily: fonts.semibold, marginLeft: 6 }}>{a.label}</Text>
                                </TouchableOpacity>
                            </Card>
                        );
                    }}
                />
            )}

            <Modal visible={!!composer} transparent animationType="slide" onRequestClose={() => setComposer(null)}>
                <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
                    <View style={{ backgroundColor: '#121218', padding: 20, paddingBottom: 34, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
                        <Text style={{ color: '#fff', fontSize: 18, fontFamily: fonts.bold }}>Collab with {composer?.owner?.name || 'this brand'}</Text>
                        <Text style={{ color: palette.textMuted, fontSize: 13, fontFamily: fonts.regular, marginTop: 4 }}>
                            The brand will see your profile and this note. Chat opens once they accept.
                        </Text>
                        <TextInput
                            value={message}
                            onChangeText={setMessage}
                            placeholder="Why you're a great fit (optional)"
                            placeholderTextColor="#555"
                            multiline
                            maxLength={1000}
                            style={{ ...inputStyle, minHeight: 100, textAlignVertical: 'top', marginTop: 16 }}
                        />
                        <View style={{ flexDirection: 'row', marginTop: 16, gap: 10 }}>
                            <TouchableOpacity onPress={() => setComposer(null)} style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}>
                                <Text style={{ color: '#cfcfd8', fontFamily: fonts.semibold }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={sendCollab} disabled={sending} style={{ flex: 2, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: theme.primary, opacity: sending ? 0.6 : 1 }}>
                                {sending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontFamily: fonts.semibold }}>Send collab request</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
