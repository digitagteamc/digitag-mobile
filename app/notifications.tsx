import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import IconButton from '../Components/ui/IconButton';
import NotificationItem from '../Components/ui/NotificationItem';
import { useAuth } from '../context/AuthContext';
import { useNotificationCount } from '../context/NotificationCountContext';
import { fonts, palette, spacing } from '../theme/colors';
import { useRoleTheme } from '../theme/useRoleTheme';
import { routeNotificationData } from '../services/notificationRouting';
import {
    AppNotification,
    followUser,
    getFollowStatus,
    getFollowSuggestions,
    getNotifications,
    listCollaborations,
    markAllNotificationsRead,
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

function formatRelative(dateStr: string | null | undefined) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
}

function iconForType(type: string): keyof typeof Ionicons.glyphMap {
    switch (type) {
        case 'NEW_MESSAGE': return 'chatbubble-ellipses-outline';
        case 'COLLAB_REQUEST': return 'people-outline';
        case 'COLLAB_ACCEPTED': return 'checkmark-circle-outline';
        case 'COLLAB_DECLINED': return 'close-circle-outline';
        case 'NEW_POST': return 'image-outline';
        default: return 'notifications-outline';
    }
}

type Tab = 'requests' | 'notifications';

export default function NotificationsScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const theme = useRoleTheme(); // viewer's role theme

    const [tab, setTab] = useState<Tab>('requests');
    const { clearUnreadCount } = useNotificationCount();

    // ── Requests tab state ──
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // ── Notifications tab state ──
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [notifLoading, setNotifLoading] = useState(true);
    const [notifRefreshing, setNotifRefreshing] = useState(false);
    const [notifNextCursor, setNotifNextCursor] = useState<string | null>(null);
    const [notifLoadingMore, setNotifLoadingMore] = useState(false);

    // ── Suggestions (shown at the bottom of the Notifications tab) ──
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

    const loadRequests = useCallback(async () => {
        if (!token) {
            setErrorMsg('You need to sign in to see notifications');
            setLoading(false);
            return;
        }
        setErrorMsg(null);
        const reqRes = await listCollaborations(token, { direction: 'incoming' });
        setRequests(reqRes.success ? (reqRes.data || []) : []);
        if (!reqRes.success) setErrorMsg('Could not load requests. Pull to try again.');
        setLoading(false);
    }, [token]);

    const loadNotifications = useCallback(async () => {
        if (!token) { setNotifLoading(false); return; }
        const [notifRes, sugRes] = await Promise.all([
            getNotifications(token, { limit: 30 }),
            getFollowSuggestions(token, 20),
        ]);
        setNotifications(notifRes.success ? notifRes.data : []);
        setNotifNextCursor(notifRes.success ? notifRes.nextCursor : null);

        const sugs = sugRes.success ? (sugRes.data || []) : [];
        setSuggestions(sugs);
        if (sugs.length > 0) {
            const followChecks = await Promise.all(
                sugs.map((s: any) => getFollowStatus(token, s.id).then((r) => ({
                    id: s.id,
                    following: r.success ? Boolean(r.data?.isFollowing) : false,
                }))),
            );
            setFollowingIds(new Set(followChecks.filter((f) => f.following).map((f) => f.id)));
        }
        setNotifLoading(false);
    }, [token]);

    useEffect(() => { loadRequests(); }, [loadRequests]);
    useEffect(() => { loadNotifications(); }, [loadNotifications]);

    // Mark unread notifications read once the user actually looks at that tab
    // (not on prefetch — the unread highlight should survive until they do).
    useEffect(() => {
        if (tab !== 'notifications' || !token) return;
        const hasUnread = notifications.some((n) => !n.isRead);
        if (!hasUnread) return;
        markAllNotificationsRead(token).then((res) => {
            if (res.success) {
                setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
                clearUnreadCount();
            }
        });
    }, [tab, token, notifications]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadRequests();
        setRefreshing(false);
    };

    const onRefreshNotifications = async () => {
        setNotifRefreshing(true);
        await loadNotifications();
        setNotifRefreshing(false);
    };

    const loadMoreNotifications = async () => {
        if (!token || !notifNextCursor || notifLoadingMore) return;
        setNotifLoadingMore(true);
        const res = await getNotifications(token, { cursor: notifNextCursor, limit: 30 });
        if (res.success) {
            setNotifications((prev) => [...prev, ...res.data]);
            setNotifNextCursor(res.nextCursor);
        }
        setNotifLoadingMore(false);
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

    const handleNotificationPress = (n: AppNotification) => {
        routeNotificationData(router, (n.data || undefined) as Record<string, string> | undefined);
    };

    const pending = requests.filter((r) => r.status === 'PENDING');
    const today = pending.filter((r) => isToday(r.createdAt));
    const yesterday = pending.filter((r) => isYesterday(r.createdAt));
    const older = pending.filter((r) => !isToday(r.createdAt) && !isYesterday(r.createdAt));

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
            <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />
            <View style={styles.header}>
                <IconButton onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}>
                    <Ionicons name="chevron-back" size={20} color="#fff" />
                </IconButton>
                <Text style={styles.headerTitle}>Notification</Text>
                <Text style={[styles.requestCount, { color: theme.primary }]}>
                    {pending.length} {pending.length === 1 ? 'Request' : 'Requests'}
                </Text>
            </View>

            {/* ── Tabs ── */}
            <View style={styles.tabRow}>
                <TouchableOpacity style={styles.tabBtn} onPress={() => setTab('requests')} activeOpacity={0.75}>
                    <Text style={[styles.tabLabel, tab === 'requests' && { color: theme.primary }]}>Requests</Text>
                    {tab === 'requests' && <View style={[styles.tabIndicator, { backgroundColor: theme.primary }]} />}
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabBtn} onPress={() => setTab('notifications')} activeOpacity={0.75}>
                    <Text style={[styles.tabLabel, tab === 'notifications' && { color: theme.primary }]}>Notifications</Text>
                    {tab === 'notifications' && <View style={[styles.tabIndicator, { backgroundColor: theme.primary }]} />}
                </TouchableOpacity>
            </View>

            {tab === 'requests' ? (
                loading ? (
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
                            </View>
                        }
                    />
                )
            ) : notifLoading ? (
                <View style={styles.centerWrap}>
                    <ActivityIndicator color={theme.primary} size="large" />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(n) => n.id}
                    refreshControl={<RefreshControl refreshing={notifRefreshing} onRefresh={onRefreshNotifications} tintColor={theme.primary} />}
                    contentContainerStyle={{ paddingBottom: 140 }}
                    onEndReachedThreshold={0.4}
                    onEndReached={loadMoreNotifications}
                    renderItem={({ item }) => (
                        <NotificationItem
                            name={item.title}
                            subtitle={`${item.body} · ${formatRelative(item.createdAt)}`}
                            icon={iconForType(item.type)}
                            variant="info"
                            unread={!item.isRead}
                            onPress={() => handleNotificationPress(item)}
                        />
                    )}
                    ListHeaderComponent={
                        notifications.length === 0 ? (
                            <View style={styles.emptyBox}>
                                <Ionicons name="notifications-outline" size={40} color={palette.borderStrong} />
                                <Text style={styles.emptyText}>No notifications yet</Text>
                            </View>
                        ) : null
                    }
                    ListFooterComponent={
                        <View>
                            {notifLoadingMore ? (
                                <View style={{ paddingVertical: 16 }}>
                                    <ActivityIndicator color={theme.primary} />
                                </View>
                            ) : null}

                            {suggestions.length > 0 ? (
                                <>
                                    <View style={styles.sectionHeaderRow}>
                                        <Text style={styles.sectionTitle}>Suggested for you</Text>
                                        <TouchableOpacity onPress={() => router.push('/suggestions')}>
                                            <Text style={[styles.seeAll, { color: theme.primary }]}>See all</Text>
                                        </TouchableOpacity>
                                    </View>
                                    {suggestions.slice(0, 10).map((s) => (
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

    tabRow: {
        flexDirection: 'row',
        paddingHorizontal: spacing.xl,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: palette.borderStrong,
        marginBottom: 4,
    },
    tabBtn: { paddingVertical: 12, marginRight: 28 },
    tabLabel: { color: palette.textMuted, fontFamily: fonts.semibold, fontSize: 14 },
    tabIndicator: { height: 2, borderRadius: 1, marginTop: 8 },

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
