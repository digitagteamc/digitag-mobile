import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import IconButton from '../Components/ui/IconButton';
import NotificationItem from '../Components/ui/NotificationItem';
import { useAuth } from '../context/AuthContext';
import { fonts, palette, spacing } from '../theme/colors';
import { useRoleTheme } from '../theme/useRoleTheme';
import {
    followUser,
    getFollowStatus,
    getFollowSuggestions,
    listCollaborations,
    openConversationWith,
    respondCollaboration,
    unfollowUser,
} from '../services/userService';

function getSenderName(sender: any) {
    if (!sender) return 'Someone';
    const profile = sender.creatorProfile || sender.freelancerProfile;
    if (profile?.name) return profile.name;
    return sender.role === 'FREELANCER' ? 'Freelancer' : 'Creator';
}

function getSenderPic(sender: any) {
    const profile = sender?.creatorProfile || sender?.freelancerProfile;
    return profile?.profilePicture || null;
}

function isToday(dateStr: string | null | undefined) {
    if (!dateStr) return false;
    return new Date(dateStr).toDateString() === new Date().toDateString();
}

function isYesterday(dateStr: string | null | undefined) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return d.toDateString() === y.toDateString();
}

export default function NotificationsScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const theme = useRoleTheme(); // viewer's role theme

    const [requests, setRequests] = useState<any[]>([]);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!token) {
            setErrorMsg('You need to sign in to see notifications');
            setLoading(false);
            return;
        }
        setErrorMsg(null);
        const [reqRes, sugRes] = await Promise.all([
            listCollaborations(token, { direction: 'incoming' }),
            getFollowSuggestions(token, 20),
        ]);

        const reqs = reqRes.success ? (reqRes.data || []) : [];
        const sugs = sugRes.success ? (sugRes.data || []) : [];
        setRequests(reqs);
        setSuggestions(sugs);

        // Hydrate follow state for all suggestions so the button label is correct.
        if (sugs.length > 0) {
            const followChecks = await Promise.all(
                sugs.map((s: any) => getFollowStatus(token, s.id).then((r) => ({
                    id: s.id,
                    following: r.success ? Boolean(r.data?.isFollowing) : false,
                }))),
            );
            setFollowingIds(new Set(followChecks.filter((f) => f.following).map((f) => f.id)));
        }

        if (!reqRes.success && !sugRes.success) {
            setErrorMsg('Could not load notifications. Pull to try again.');
        }
        setLoading(false);
    }, [token]);

    useEffect(() => { load(); }, [load]);

    const onRefresh = async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    };

    const handleRespond = async (id: string, action: 'ACCEPT' | 'DECLINE') => {
        if (!token) return;
        setBusyId(id);
        try {
            const res = await respondCollaboration(token, id, action);
            if (!res.success) {
                setErrorMsg(res.error || 'Could not respond');
                return;
            }
            const updated = res.data;
            setRequests((prev) => prev.filter((r) => r.id !== id));
            if (action === 'ACCEPT' && updated) {
                const openRes = await openConversationWith(token, updated.senderId);
                if (openRes.success && openRes.data?.id) {
                    router.push({ pathname: '/chat/[id]', params: { id: openRes.data.id } } as any);
                }
            }
        } finally {
            setBusyId(null);
        }
    };

    const handleToggleFollow = async (userId: string) => {
        if (!token) return;
        setBusyId(userId);
        const alreadyFollowing = followingIds.has(userId);
        try {
            const res = alreadyFollowing
                ? await unfollowUser(token, userId)
                : await followUser(token, userId);
            if (res.success) {
                setFollowingIds((prev) => {
                    const next = new Set(prev);
                    if (alreadyFollowing) next.delete(userId);
                    else next.add(userId);
                    return next;
                });
            }
        } finally {
            setBusyId(null);
        }
    };

    const handleDismissSuggestion = (userId: string) => {
        setSuggestions((prev) => prev.filter((s) => s.id !== userId));
    };

    const pending = requests.filter((r) => r.status === 'PENDING');
    const today = pending.filter((r) => isToday(r.createdAt));
    const yesterday = pending.filter((r) => isYesterday(r.createdAt));
    const older = pending.filter((r) => !isToday(r.createdAt) && !isYesterday(r.createdAt));

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <IconButton onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}>
                    <Ionicons name="chevron-back" size={20} color="#fff" />
                </IconButton>
                <Text style={styles.headerTitle}>Notification</Text>
                <Text style={[styles.requestCount, { color: theme.primary }]}>
                    {pending.length} {pending.length === 1 ? 'Request' : 'Requests'}
                </Text>
            </View>

            {loading ? (
                <View style={styles.centerWrap}>
                    <ActivityIndicator color={theme.primary} size="large" />
                </View>
            ) : (
                <FlatList
                    data={[] as any[]}
                    keyExtractor={() => ''}
                    renderItem={() => null}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
                    contentContainerStyle={{ paddingBottom: 140 }}
                    ListHeaderComponent={
                        <View>
                            {errorMsg ? (
                                <View style={styles.errorBanner}>
                                    <Ionicons name="warning-outline" size={16} color={palette.warning} />
                                    <Text style={styles.errorText}>{errorMsg}</Text>
                                </View>
                            ) : null}

                            {today.length > 0 ? <Text style={styles.sectionTitle}>Today</Text> : null}
                            {today.map((r) => (
                                <NotificationItem
                                    key={r.id}
                                    name={getSenderName(r.sender)}
                                    subtitle="Sent a Collab Request"
                                    avatarUri={getSenderPic(r.sender)}
                                    role={r.sender?.role}
                                    variant="request"
                                    busy={busyId === r.id}
                                    onAccept={() => handleRespond(r.id, 'ACCEPT')}
                                    onReject={() => handleRespond(r.id, 'DECLINE')}
                                    onNamePress={r.sender?.id ? () => router.push({ pathname: '/creator-details', params: { userId: r.sender.id } } as any) : undefined}
                                />
                            ))}

                            {yesterday.length > 0 ? <Text style={styles.sectionTitle}>Yesterday</Text> : null}
                            {yesterday.map((r) => (
                                <NotificationItem
                                    key={r.id}
                                    name={getSenderName(r.sender)}
                                    subtitle="Sent a Collab Request"
                                    avatarUri={getSenderPic(r.sender)}
                                    role={r.sender?.role}
                                    variant="request"
                                    busy={busyId === r.id}
                                    onAccept={() => handleRespond(r.id, 'ACCEPT')}
                                    onReject={() => handleRespond(r.id, 'DECLINE')}
                                    onNamePress={r.sender?.id ? () => router.push({ pathname: '/creator-details', params: { userId: r.sender.id } } as any) : undefined}
                                />
                            ))}

                            {older.length > 0 ? <Text style={styles.sectionTitle}>Earlier</Text> : null}
                            {older.map((r) => (
                                <NotificationItem
                                    key={r.id}
                                    name={getSenderName(r.sender)}
                                    subtitle="Sent a Collab Request"
                                    avatarUri={getSenderPic(r.sender)}
                                    role={r.sender?.role}
                                    variant="request"
                                    busy={busyId === r.id}
                                    onAccept={() => handleRespond(r.id, 'ACCEPT')}
                                    onReject={() => handleRespond(r.id, 'DECLINE')}
                                    onNamePress={r.sender?.id ? () => router.push({ pathname: '/creator-details', params: { userId: r.sender.id } } as any) : undefined}
                                />
                            ))}

                            {pending.length === 0 && !errorMsg ? (
                                <View style={styles.emptyBox}>
                                    <Ionicons name="notifications-outline" size={40} color={palette.borderStrong} />
                                    <Text style={styles.emptyText}>No pending requests right now</Text>
                                </View>
                            ) : null}

                            {suggestions.length > 0 ? (
                                <>
                                    <View style={styles.sectionHeaderRow}>
                                        <Text style={styles.sectionTitle}>Suggested for you</Text>
                                        <Text style={[styles.seeAll, { color: theme.primary }]}>See all</Text>
                                    </View>
                                    {suggestions.map((s) => (
                                        <NotificationItem
                                            key={s.id}
                                            name={s.name || (s.role === 'FREELANCER' ? 'Freelancer' : 'Creator')}
                                            subtitle="Suggested for you"
                                            avatarUri={s.profilePicture || null}
                                            role={s.role}
                                            variant="suggestion"
                                            busy={busyId === s.id}
                                            following={followingIds.has(s.id)}
                                            onToggleFollow={() => handleToggleFollow(s.id)}
                                            onDismiss={() => handleDismissSuggestion(s.id)}
                                            onNamePress={() => router.push({ pathname: '/creator-details', params: { userId: s.id } } as any)}
                                        />
                                    ))}
                                </>
                            ) : null}
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: palette.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        gap: 10,
    },
    headerTitle: { color: palette.textPrimary, fontSize: 17, fontFamily: fonts.semibold, flex: 1, textAlign: 'center' },
    requestCount: { fontSize: 13, fontFamily: fonts.semibold },

    centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    errorBanner: {
        marginHorizontal: 20,
        marginTop: 12,
        padding: 12,
        backgroundColor: 'rgba(245,158,11,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(245,158,11,0.4)',
        borderRadius: 10,
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    errorText: { color: palette.textSecondary, fontFamily: fonts.regular, fontSize: 13, flex: 1 },

    sectionTitle: {
        color: palette.textPrimary,
        fontSize: 17,
        fontFamily: fonts.semibold,
        marginTop: 18,
        marginBottom: 10,
        paddingHorizontal: spacing.xl,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        marginTop: 22,
    },
    seeAll: { fontSize: 13, fontFamily: fonts.semibold },

    emptyBox: { alignItems: 'center', paddingVertical: 30, gap: 6 },
    emptyText: { color: palette.textMuted, fontSize: 13, fontFamily: fonts.regular },
});
