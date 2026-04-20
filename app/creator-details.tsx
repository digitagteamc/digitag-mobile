import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../Components/ui/Button';
import CollabAction, { CollabState, deriveCollabState } from '../Components/ui/CollabAction';
import IconButton from '../Components/ui/IconButton';
import StatusBadge from '../Components/ui/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useProfileGate } from '../context/useProfileGate';
import { fonts, palette, spacing } from '../theme/colors';
import { useRoleTheme } from '../theme/useRoleTheme';
import {
    cancelCollaboration,
    followUser,
    getCollaborationWith,
    getFollowStatus,
    getPostById,
    getUserById,
    getUserPosts,
    getUserStats,
    openConversationWith,
    respondCollaboration,
    sendCollaboration,
    unfollowUser,
} from '../services/userService';

function getInitials(name: string | null | undefined) {
    if (!name) return 'U';
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

function pickProfile(user: any) {
    if (!user) return null;
    const role = (user.role || user.activeRole || '').toUpperCase();
    if (role === 'FREELANCER') return user.freelancerProfile || user.creatorProfile || null;
    return user.creatorProfile || user.freelancerProfile || null;
}

function timeAgo(dateStr: string | null | undefined) {
    if (!dateStr) return '';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.max(0, Math.round(diffMs / 60000));
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.round(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${Math.round(diffHrs / 24)}d ago`;
}

export default function CreatorDetails() {
    const router = useRouter();
    const { token, userId: myId, userRole, isProfileCompleted } = useAuth();
    const { requireProfile } = useProfileGate();

    const params = useLocalSearchParams<{ id?: string; userId?: string; postId?: string }>();
    const initialPostId = (params.postId || params.id) as string | undefined;
    const initialUserId = params.userId as string | undefined;

    const [resolvedUserId, setResolvedUserId] = useState<string | null>(initialUserId || null);
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState<{ followerCount: number; followingCount: number; collabCount: number } | null>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [collab, setCollab] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    const [collabOpen, setCollabOpen] = useState(false);
    const [collabMessage, setCollabMessage] = useState('');
    const [collabBusy, setCollabBusy] = useState(false);
    const [followBusy, setFollowBusy] = useState(false);

    // Theme always follows the LOGGED-IN user's role, not the profile being viewed.
    const theme = useRoleTheme();

    const load = useCallback(async () => {
        if (!token) { setLoading(false); return; }
        try {
            let uid = initialUserId || null;
            if (!uid && initialPostId) {
                const postRes = await getPostById(initialPostId, token);
                if (postRes.success && postRes.data) {
                    uid = postRes.data.owner?.id || postRes.data.userId || null;
                }
            }
            if (!uid) { setLoading(false); return; }

            setResolvedUserId(uid);

            const [userRes, postsRes, followRes, collabRes, statsRes] = await Promise.all([
                getUserById(uid, token),
                getUserPosts(uid, token, { limit: '10' }),
                getFollowStatus(token, uid),
                getCollaborationWith(token, uid),
                getUserStats(token, uid),
            ]);
            if (userRes.success) setProfile(userRes.data || null);
            if (postsRes.success) setPosts(Array.isArray(postsRes.data) ? postsRes.data : []);
            if (followRes.success) setIsFollowing(Boolean(followRes.data?.isFollowing));
            if (collabRes.success) setCollab(collabRes.data || null);
            if (statsRes.success && statsRes.data) setStats(statsRes.data);
        } finally {
            setLoading(false);
        }
    }, [token, initialUserId, initialPostId]);

    useEffect(() => { load(); }, [load]);

    const isSelf = !!(resolvedUserId && myId && resolvedUserId === myId);
    const collabState: CollabState = isSelf ? 'none' : deriveCollabState(collab, myId);

    const openCollab = () => {
        if (!requireProfile('send a collaboration request')) return;
        if (isSelf) return;
        setCollabOpen(true);
    };

    const submitCollab = async () => {
        if (!token || !resolvedUserId) return;
        setCollabBusy(true);
        try {
            const res = await sendCollaboration(token, {
                receiverId: resolvedUserId,
                postId: initialPostId,
                message: collabMessage.trim() || undefined,
            });
            if (!res.success) {
                Alert.alert('Could not send', res.error || 'Request failed');
                return;
            }
            setCollab(res.data || null);
            setCollabOpen(false);
            setCollabMessage('');
        } finally {
            setCollabBusy(false);
        }
    };

    const respondTo = async (action: 'ACCEPT' | 'DECLINE') => {
        if (!token || !collab?.id) return;
        setCollabBusy(true);
        try {
            const res = await respondCollaboration(token, collab.id, action);
            if (!res.success) {
                Alert.alert('Failed', res.error || 'Could not respond');
                return;
            }
            setCollab(res.data || null);
            if (action === 'ACCEPT' && resolvedUserId) {
                const opened = await openConversationWith(token, resolvedUserId);
                if (opened.success && opened.data?.id) {
                    router.push({ pathname: '/chat/[id]', params: { id: opened.data.id } } as any);
                }
            }
        } finally {
            setCollabBusy(false);
        }
    };

    const cancelMyRequest = async () => {
        if (!token || !collab?.id) return;
        setCollabBusy(true);
        try {
            const res = await cancelCollaboration(token, collab.id);
            if (res.success) setCollab(null);
        } finally {
            setCollabBusy(false);
        }
    };

    const openChat = async () => {
        if (!requireProfile('start a chat')) return;
        if (!token || !resolvedUserId || isSelf) return;
        const res = await openConversationWith(token, resolvedUserId);
        if (res.success && res.data?.id) {
            router.push({ pathname: '/chat/[id]', params: { id: res.data.id } } as any);
        } else {
            Alert.alert('Could not open chat', res.error || 'Please try again later.');
        }
    };

    const handleCall = () => {
        if (!requireProfile('call this profile')) return;
        if (!collab?.id || !resolvedUserId) return;
        const p = pickProfile(profile);
        const peerName = p?.name || (profile?.role === 'FREELANCER' ? 'Freelancer' : 'Creator');
        router.push({ pathname: '/call/[roomId]', params: { roomId: collab.id, peerName } } as any);
    };

    const handleFollow = async () => {
        if (!requireProfile(isFollowing ? 'unfollow this profile' : 'follow this profile')) return;
        if (!token || !resolvedUserId || isSelf) return;
        setFollowBusy(true);
        try {
            const res = isFollowing
                ? await unfollowUser(token, resolvedUserId)
                : await followUser(token, resolvedUserId);
            if (res.success) setIsFollowing(!isFollowing);
        } finally {
            setFollowBusy(false);
        }
    };

    const handleInstagram = (link: string) => {
        Linking.openURL(link).catch(() => Alert.alert('Cannot open link'));
    };

    if (loading) {
        return (
            <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    // Gate: viewer must have a completed profile to see anyone else's.
    if (!loading && !isProfileCompleted) {
        const signupPath = userRole?.toUpperCase() === 'FREELANCER' ? '/signup/freelancer' : '/signup/creator';
        return (
            <View style={[styles.loadingWrap, { paddingHorizontal: 32 }]}>
                <Ionicons name="lock-closed" size={48} color={theme.primary} />
                <Text style={[styles.loadingText, { fontSize: 18, fontWeight: '700', color: '#fff', marginTop: 8 }]}>
                    Profile Locked
                </Text>
                <Text style={[styles.loadingText, { textAlign: 'center', marginTop: 4 }]}>
                    Complete your own profile to view and connect with others.
                </Text>
                <TouchableOpacity
                    style={{ marginTop: 18, backgroundColor: theme.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 30 }}
                    onPress={() => router.push(signupPath as any)}
                >
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Complete Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ marginTop: 14 }} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}>
                    <Text style={[styles.loadingText, { textDecorationLine: 'underline' }]}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={styles.loadingWrap}>
                <Ionicons name="person-outline" size={48} color={palette.borderStrong} />
                <Text style={styles.loadingText}>Profile not found</Text>
            </View>
        );
    }

    const p = pickProfile(profile);
    const name = p?.name || (profile.role === 'FREELANCER' ? 'Freelancer' : 'Creator');
    const roleLabel = profile.role === 'FREELANCER' ? 'Freelancer' : 'Creator';
    const bio = p?.bio || '';
    const location = p?.location || '';
    const instagram = p?.instagramHandle ? `https://instagram.com/${p.instagramHandle}` : (p?.portfolioUrl || null);
    const joinedAt = profile.createdAt ? new Date(profile.createdAt) : null;
    const joinedLabel = joinedAt
        ? `Joined ${joinedAt.toLocaleString('en-US', { month: 'long', year: 'numeric' })}`
        : '';
    const specialization = profile.category?.name || '';
    const specTags = [specialization, p?.language && `${p.language} speaker`].filter(Boolean) as string[];

    // Gradient follows the logged-in user's theme, not the profile being viewed.
    const gradientTop = userRole?.toUpperCase() === 'FREELANCER' ? '#5B2A12' : '#3B1B60';
    const gradientMid = userRole?.toUpperCase() === 'FREELANCER' ? '#2A1208' : '#1A0E2E';

    return (
        <View style={{ flex: 1, backgroundColor: palette.background }}>
            <LinearGradient
                colors={[gradientTop, gradientMid, palette.background]}
                locations={[0, 0.4, 1]}
                style={styles.headerGradient}
            />

            <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
                <View style={styles.topBar}>
                    <IconButton tone="transparent" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}>
                        <Ionicons name="chevron-back" size={20} color="#fff" />
                    </IconButton>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <IconButton tone="transparent" onPress={() => router.push('/notifications' as any)}>
                            <Ionicons name="notifications-outline" size={18} color="#fff" />
                        </IconButton>
                        <IconButton tone="transparent" onPress={() => {}}>
                            <Ionicons name="ellipsis-vertical" size={18} color="#fff" />
                        </IconButton>
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    {/* Hero avatar + name */}
                    <View style={styles.heroWrap}>
                        {p?.profilePicture ? (
                            <Image source={{ uri: p.profilePicture }} style={[styles.heroAvatar, { borderColor: theme.border }]} />
                        ) : (
                            <View style={[styles.heroAvatar, styles.heroInitials, { backgroundColor: theme.softStrong, borderColor: theme.border }]}>
                                <Text style={[styles.heroInitialsText, { color: theme.primary }]}>{getInitials(name)}</Text>
                            </View>
                        )}
                        <Text style={styles.heroName}>{name}</Text>
                        <Text style={styles.heroRole}>{roleLabel}</Text>
                    </View>

                    {/* Collab state-machine action row */}
                    {!isSelf ? (
                        <View style={styles.actionBlock}>
                            <CollabAction
                                state={collabState}
                                role={profile.role}
                                busy={collabBusy}
                                onCollab={openCollab}
                                onAccept={() => respondTo('ACCEPT')}
                                onReject={() => respondTo('DECLINE')}
                                onChat={openChat}
                                onCall={handleCall}
                            />
                            <View style={styles.metaActionsRow}>
                                <Button
                                    title={isFollowing ? 'Following' : 'Follow'}
                                    role={profile.role}
                                    variant={isFollowing ? 'outline' : 'subtle'}
                                    size="sm"
                                    onPress={handleFollow}
                                    loading={followBusy}
                                    leftIcon={
                                        <Ionicons
                                            name={isFollowing ? 'checkmark' : 'add'}
                                            size={14}
                                            color={theme.primary}
                                        />
                                    }
                                    fullWidth={false}
                                />
                                {collabState === 'sent_pending' ? (
                                    <Button
                                        title="Cancel Request"
                                        role={profile.role}
                                        variant="ghost"
                                        size="sm"
                                        onPress={cancelMyRequest}
                                        loading={collabBusy}
                                        fullWidth={false}
                                    />
                                ) : null}
                            </View>
                        </View>
                    ) : null}

                    {/* Stats */}
                    <View style={styles.statsRow}>
                        <View style={styles.statCol}>
                            <Text style={styles.statValue}>{stats?.followerCount ?? profile.followerCount ?? 0}</Text>
                            <Text style={styles.statLabel}>Followers</Text>
                        </View>
                        <View style={styles.statCol}>
                            <Text style={styles.statValue}>{stats?.followingCount ?? profile.followingCount ?? 0}</Text>
                            <Text style={styles.statLabel}>Following</Text>
                        </View>
                        <View style={styles.statCol}>
                            <Text style={styles.statValue}>{stats?.collabCount ?? profile.collabCount ?? 0}</Text>
                            <Text style={styles.statLabel}>Collabs</Text>
                        </View>
                    </View>

                    {/* About */}
                    {(bio || location || instagram || joinedLabel) ? (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>About</Text>
                            {bio ? <Text style={styles.aboutText}>{bio}</Text> : null}
                            {location ? (
                                <View style={styles.infoRow}>
                                    <Ionicons name="location-outline" size={15} color={theme.primary} />
                                    <Text style={styles.infoText}>{location}</Text>
                                </View>
                            ) : null}
                            {instagram ? (
                                <TouchableOpacity style={styles.infoRow} onPress={() => handleInstagram(instagram)}>
                                    <Ionicons name="link-outline" size={15} color={theme.primary} />
                                    <Text style={styles.infoText} numberOfLines={1}>
                                        {instagram.replace(/^https?:\/\//, '')}
                                    </Text>
                                </TouchableOpacity>
                            ) : null}
                            {joinedLabel ? (
                                <View style={styles.infoRow}>
                                    <Ionicons name="calendar-outline" size={15} color={theme.primary} />
                                    <Text style={styles.infoText}>{joinedLabel}</Text>
                                </View>
                            ) : null}
                        </View>
                    ) : null}

                    {/* Specializations */}
                    {specTags.length > 0 ? (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Specializations</Text>
                            <View style={styles.tagRow}>
                                {specTags.map((t, i) => (
                                    <StatusBadge key={i} label={t} tone="role" role={profile.role} size="md" />
                                ))}
                            </View>
                        </View>
                    ) : null}

                    {/* Recent Requirements */}
                    {posts.length > 0 ? (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Recent Requirements</Text>
                            {posts.slice(0, 5).map((post) => (
                                <View key={post.id} style={styles.postCard}>
                                    {post.imageUrl ? (
                                        <Image source={{ uri: post.imageUrl }} style={styles.postImg} />
                                    ) : (
                                        <View style={[styles.postImg, styles.postImgPlaceholder]}>
                                            <Ionicons name="image-outline" size={28} color={palette.borderStrong} />
                                        </View>
                                    )}
                                    <View style={styles.postBody}>
                                        <Text style={styles.postDesc} numberOfLines={2}>{post.description}</Text>
                                        <View style={styles.postMeta}>
                                            <StatusBadge
                                                label={post.collaborationType === 'PAID' ? 'Paid Collab' : 'Free Collab'}
                                                tone={post.collaborationType === 'PAID' ? 'role' : 'neutral'}
                                                role={profile.role}
                                            />
                                            <Text style={styles.postTime}>{timeAgo(post.createdAt)}</Text>
                                        </View>
                                        {post.location ? (
                                            <Text style={styles.postLocation}>📍 {post.location}</Text>
                                        ) : null}
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : null}

                    {/* Leave enough space for the persistent bottom nav. */}
                    <View style={{ height: 120 }} />
                </ScrollView>
            </SafeAreaView>

            {/* Collab modal */}
            <Modal visible={collabOpen} transparent animationType="slide" onRequestClose={() => setCollabOpen(false)}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.modalBackdrop}
                >
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>Send a Collab Request</Text>
                        <Text style={styles.modalSubtitle}>
                            Tell {name} why you want to work together. They’ll see your profile and message.
                        </Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Your message (optional)"
                            placeholderTextColor={palette.textMuted}
                            multiline
                            value={collabMessage}
                            onChangeText={setCollabMessage}
                            maxLength={1000}
                        />
                        <Button
                            title="Send Request"
                            role={profile.role}
                            variant="solid"
                            size="lg"
                            onPress={submitCollab}
                            loading={collabBusy}
                        />
                        <Button
                            title="Cancel"
                            variant="ghost"
                            size="md"
                            role={profile.role}
                            onPress={() => setCollabOpen(false)}
                            textStyle={{ color: palette.textMuted }}
                        />
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.background, gap: 8 },
    loadingText: { color: palette.textMuted, fontFamily: fonts.regular, fontSize: 13 },

    headerGradient: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 320,
    },

    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
    },

    scroll: { paddingBottom: 40 },

    heroWrap: { alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.md, paddingHorizontal: spacing.xl },
    heroAvatar: {
        width: 92,
        height: 92,
        borderRadius: 46,
        borderWidth: 3,
        backgroundColor: palette.surface,
    },
    heroInitials: { alignItems: 'center', justifyContent: 'center' },
    heroInitialsText: { fontSize: 28, fontFamily: fonts.bold },
    heroName: { color: palette.textPrimary, fontSize: 22, fontFamily: fonts.bold, marginTop: 12 },
    heroRole: { color: palette.textSecondary, fontSize: 13, fontFamily: fonts.regular, marginTop: 2 },

    actionBlock: { paddingHorizontal: spacing.xl, gap: 10, marginBottom: 18 },
    metaActionsRow: { flexDirection: 'row', justifyContent: 'center', gap: 10 },

    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: spacing.xl,
        marginBottom: 22,
    },
    statCol: { alignItems: 'center' },
    statLabel: { color: palette.textMuted, fontSize: 11, fontFamily: fonts.regular, marginTop: 2 },
    statValue: { color: palette.textPrimary, fontSize: 15, fontFamily: fonts.semibold },

    section: { paddingHorizontal: spacing.xl, marginBottom: 22 },
    sectionTitle: { color: palette.textPrimary, fontSize: 16, fontFamily: fonts.bold, marginBottom: 10 },

    aboutText: { color: palette.textSecondary, fontSize: 13, lineHeight: 20, fontFamily: fonts.regular, marginBottom: 10 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    infoText: { color: palette.textSecondary, fontSize: 13, fontFamily: fonts.regular },

    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

    postCard: {
        backgroundColor: palette.surface,
        borderRadius: 14,
        marginBottom: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: palette.border,
    },
    postImg: { width: '100%', height: 140, backgroundColor: palette.surfaceRaised },
    postImgPlaceholder: { alignItems: 'center', justifyContent: 'center' },
    postBody: { padding: 12 },
    postDesc: { color: palette.textPrimary, fontSize: 13, fontFamily: fonts.regular, lineHeight: 19 },
    postMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    postTime: { color: palette.textMuted, fontSize: 11, fontFamily: fonts.regular },
    postLocation: { color: palette.textMuted, fontSize: 11, fontFamily: fonts.regular, marginTop: 4 },

    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalSheet: {
        backgroundColor: palette.surfaceAlt,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 30,
        gap: 10,
    },
    modalHandle: { width: 48, height: 4, borderRadius: 2, backgroundColor: palette.borderStrong, alignSelf: 'center', marginBottom: 10 },
    modalTitle: { color: palette.textPrimary, fontSize: 17, fontFamily: fonts.semibold, marginBottom: 6 },
    modalSubtitle: { color: palette.textMuted, fontSize: 12, fontFamily: fonts.regular, marginBottom: 8 },
    modalInput: {
        backgroundColor: palette.surface,
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: 12,
        padding: 12,
        color: palette.textPrimary,
        fontSize: 14,
        fontFamily: fonts.regular,
        minHeight: 100,
        textAlignVertical: 'top',
        marginBottom: 6,
    },
});
