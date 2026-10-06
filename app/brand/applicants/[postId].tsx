import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, BG, BRAND, Card, Chip, EmptyState, ErrorState, Loading, Pill, ScreenHeader, timeAgo } from '../../../Components/brand/ui';
import { useAuth } from '../../../context/AuthContext';
import { formatCount, listApplicants } from '../../../services/brandService';
import { completeCollab, openConversationWith, respondCollaboration } from '../../../services/userService';
import { fonts, palette } from '../../../theme/colors';

const FILTERS = [
    { label: 'All', value: undefined },
    { label: 'New', value: 'PENDING' },
    { label: 'Accepted', value: 'ACCEPTED' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Declined', value: 'DECLINED' },
] as const;

const STATUS_COLOR: Record<string, string> = { PENDING: '#F59E0B', ACCEPTED: '#22C55E', COMPLETED: '#60A5FA', DECLINED: '#EF4444', CANCELLED: '#8A8A99' };
const ROLE_COLOR: Record<string, string> = { CREATOR: '#ED2A91', FREELANCER: '#F26930' };

/** Everyone who tapped "Collab" on one requirement post. Tap the avatar to
 *  see their full profile & portfolio; Accept unlocks chat for both sides. */
export default function ApplicantsScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const { postId, title } = useLocalSearchParams<{ postId: string; title?: string }>();
    const [items, setItems] = useState<any[]>([]);
    const [filter, setFilter] = useState<string | undefined>();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!token || !postId) return;
        const res = await listApplicants(token, postId);
        if (res.success) { setItems(res.data); setError(null); } else setError(res.error);
        setLoading(false);
    }, [token, postId]);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    const visible = filter ? items.filter((i) => i.status === filter) : items;

    const openProfile = (a: any) => router.push({ pathname: '/creator-details', params: { userId: a.applicant.id } } as any);

    const openChat = async (a: any) => {
        if (a.conversationId) { router.push({ pathname: '/chat/[id]', params: { id: a.conversationId } } as any); return; }
        const res = await openConversationWith(token!, a.applicant.id);
        if (res.success && res.data?.id) router.push({ pathname: '/chat/[id]', params: { id: res.data.id } } as any);
        else Alert.alert('Chat unavailable', res.error || 'Accept the request first to start chatting.');
    };

    const respond = async (a: any, action: 'ACCEPT' | 'DECLINE') => {
        setBusy(a.collaborationId);
        const res = await respondCollaboration(token!, a.collaborationId, action);
        setBusy(null);
        if (!res.success) {
            Alert.alert('Could not update', res.error || 'Try again.');
            return;
        }
        await load();
        if (action === 'ACCEPT') {
            Alert.alert('Collaboration accepted', `You can now chat with ${a.applicant.name || 'them'}.`, [
                { text: 'Later', style: 'cancel' },
                { text: 'Open chat', onPress: () => openChat({ ...a, conversationId: null }) },
            ]);
        }
    };

    const confirmDecline = (a: any) =>
        Alert.alert('Decline request?', `${a.applicant.name || 'This applicant'} will be notified.`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Decline', style: 'destructive', onPress: () => respond(a, 'DECLINE') },
        ]);

    const complete = (a: any) =>
        Alert.alert('Mark as completed?', 'This closes the collaboration — chat becomes read-only.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Mark complete', onPress: async () => {
                    setBusy(a.collaborationId);
                    const res = await completeCollab(token!, a.collaborationId);
                    setBusy(null);
                    if (res.success) load(); else Alert.alert('Could not complete', res.error || 'Try again.');
                },
            },
        ]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={['top', 'bottom']}>
            <ScreenHeader title="Applicants" subtitle={title || 'Requirement'} />
            <View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 4 }}>
                    {FILTERS.map((f) => {
                        const count = f.value ? items.filter((i) => i.status === f.value).length : items.length;
                        return <Chip key={f.label} label={`${f.label} ${count}`} active={filter === f.value} onPress={() => setFilter(f.value)} />;
                    })}
                </ScrollView>
            </View>
            {loading ? <Loading /> : error && !items.length ? <ErrorState message={error} onRetry={load} /> : (
                <FlatList
                    data={visible}
                    keyExtractor={(a) => a.collaborationId}
                    contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={BRAND.primary} />}
                    ListEmptyComponent={<EmptyState icon="people-outline" title="No applicants yet" message="When creators tap Collab on this post, they'll show up here." />}
                    renderItem={({ item: a }) => {
                        const p = a.applicant;
                        const roleColor = ROLE_COLOR[p.role] || BRAND.primary;
                        const followers = p.instagramFollowers || p.youtubeFollowers;
                        const isBusy = busy === a.collaborationId;
                        return (
                            <Card style={{ marginBottom: 12 }}>
                                <TouchableOpacity activeOpacity={0.8} onPress={() => openProfile(a)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Avatar uri={p.profilePicture} name={p.name} size={52} color={roleColor} />
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text numberOfLines={1} style={{ color: '#fff', fontSize: 15, fontFamily: fonts.semibold }}>{p.name || 'DigiTag user'}</Text>
                                        <Text numberOfLines={1} style={{ color: palette.textMuted, fontSize: 12, fontFamily: fonts.regular }}>
                                            {[p.role === 'FREELANCER' ? 'Freelancer' : 'Creator', p.categoryNames?.[0], p.location].filter(Boolean).join(' · ')}
                                        </Text>
                                        {!!followers && (
                                            <Text style={{ color: BRAND.light, fontSize: 11, fontFamily: fonts.semibold, marginTop: 2 }}>
                                                {formatCount(followers)} followers{p.instagramHandle ? ` · @${String(p.instagramHandle).replace(/^@/, '')}` : ''}
                                            </Text>
                                        )}
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Pill label={a.status === 'PENDING' ? 'New' : a.status.charAt(0) + a.status.slice(1).toLowerCase()} color={STATUS_COLOR[a.status] || '#8A8A99'} />
                                        <Text style={{ color: palette.textSubtle, fontSize: 10, fontFamily: fonts.regular, marginTop: 4 }}>{timeAgo(a.createdAt)}</Text>
                                    </View>
                                </TouchableOpacity>

                                {!!a.message && (
                                    <Text style={{ color: palette.textSecondary, fontSize: 13, fontFamily: fonts.regular, marginTop: 10, lineHeight: 19 }}>“{a.message}”</Text>
                                )}

                                <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
                                    <ActionBtn icon="person-circle-outline" label="Profile" onPress={() => openProfile(a)} />
                                    {a.status === 'PENDING' && (
                                        <>
                                            <ActionBtn icon="close" label="Decline" color="#EF4444" onPress={() => confirmDecline(a)} disabled={isBusy} />
                                            <ActionBtn icon="checkmark" label="Accept" color="#22C55E" solid onPress={() => respond(a, 'ACCEPT')} disabled={isBusy} />
                                        </>
                                    )}
                                    {(a.status === 'ACCEPTED' || a.status === 'COMPLETED') && (
                                        <ActionBtn icon="chatbubble-ellipses-outline" label="Chat" color={BRAND.primary} solid onPress={() => openChat(a)} />
                                    )}
                                    {a.status === 'ACCEPTED' && (
                                        <ActionBtn icon="flag-outline" label="Complete" color="#60A5FA" onPress={() => complete(a)} disabled={isBusy} />
                                    )}
                                </View>
                            </Card>
                        );
                    }}
                />
            )}
        </SafeAreaView>
    );
}

function ActionBtn({ icon, label, onPress, color = '#cfcfd8', solid, disabled }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; color?: string; solid?: boolean; disabled?: boolean }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.85}
            style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12,
                backgroundColor: solid ? color : 'transparent', borderWidth: 1, borderColor: solid ? color : color + '55', opacity: disabled ? 0.5 : 1,
            }}
        >
            <Ionicons name={icon} size={15} color={solid ? '#fff' : color} />
            <Text style={{ color: solid ? '#fff' : color, fontSize: 12, fontFamily: fonts.semibold, marginLeft: 5 }}>{label}</Text>
        </TouchableOpacity>
    );
}
