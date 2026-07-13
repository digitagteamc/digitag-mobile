import { FontAwesome6, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Linking,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useProfileGate } from '../context/ProfileGateContext';
import {
    blockUser,
    followUser,
    getBlockStatus,
    getCollaborationWith,
    getFollowStatus,
    getPostById,
    getReportStatus,
    getUserById,
    getUserStats,
    initiateCall,
    openConversationWith,
    sendCollaboration,
    unblockUser,
    unfollowUser,
} from '../services/userService';
import { facebookUrl, youtubeUrl } from '../services/socialLinks';
import { fonts } from '../theme/colors';
import { useRoleTheme } from '../theme/useRoleTheme';
import CustomAlert from '../Components/ui/CustomAlert';
import ConfirmActionModal from '../Components/ui/ConfirmActionModal';
import ReportModal from '../Components/ui/ReportModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');


export default function CreatorDetails() {
    const router = useRouter();
    const { token, userId: myId, userRole } = useAuth();
    const { requireProfile, isProfileCompleted } = useProfileGate();
    const { id: paramId, userId: paramUserId, postId: paramPostId } = useLocalSearchParams<{ id?: string; userId?: string; postId?: string }>();
    const [resolvedUserId, setResolvedUserId] = useState<string | null>(paramUserId || paramId || null);

    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [followBusy, setFollowBusy] = useState(false);
    const [collabStatus, setCollabStatus] = useState<'NONE' | 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED'>('NONE');
    const [collabSent, setCollabSent] = useState(false);
    const [collabBusy, setCollabBusy] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [blockBusy, setBlockBusy] = useState(false);
    const [isReported, setIsReported] = useState(false);
    const [showActionMenu, setShowActionMenu] = useState(false);
    const [showBlockConfirm, setShowBlockConfirm] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
    });

    const showAlert = (title: string, message: string) => {
        setAlertConfig({ visible: true, title, message });
    };

    const theme = useRoleTheme();

    const load = useCallback(async () => {
        try {
            let uid = resolvedUserId;

            // Resolve UID from postId if needed — works for guests too, profile
            // browsing doesn't require an account.
            if (!uid && paramPostId) {
                const postRes = await getPostById(paramPostId, token);
                if (postRes.success && postRes.data) {
                    uid = postRes.data.owner?.id || postRes.data.userId || null;
                }
            }

            if (!uid) { setLoading(false); return; }
            setResolvedUserId(uid);

            if (token) {
                const [userRes, followRes, statsRes, collabRes, blockRes, reportRes] = await Promise.all([
                    getUserById(uid, token),
                    getFollowStatus(token, uid),
                    getUserStats(token, uid),
                    getCollaborationWith(token, uid),
                    getBlockStatus(token, uid),
                    getReportStatus(token, 'USER', uid),
                ]);
                if (userRes.success) setProfile(userRes.data || null);
                if (followRes.success) setIsFollowing(Boolean(followRes.data?.isFollowing));
                if (statsRes.success) setStats(statsRes.data || null);
                if (reportRes.success) setIsReported(Boolean(reportRes.data?.reported));
                if (blockRes.success) setIsBlocked(Boolean(blockRes.data?.isBlocked));
                if (collabRes.success) {
                    const status = collabRes.data?.status ?? 'NONE';
                    setCollabStatus(status as any);
                    if (status === 'ACCEPTED') setCollabSent(true);
                }
            } else {
                // Guest — only the public profile/stat data. Follow/collab/block/report
                // status are viewer-specific and require an account, so they stay at
                // their defaults until the guest signs up.
                const [userRes, statsRes] = await Promise.all([
                    getUserById(uid, token),
                    getUserStats(token, uid),
                ]);
                if (userRes.success) setProfile(userRes.data || null);
                if (statsRes.success) setStats(statsRes.data || null);
            }
        } finally {
            setLoading(false);
        }
    }, [token, resolvedUserId, paramPostId]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        if (!token) return;
        if (!isProfileCompleted) {
            requireProfile('view this profile');
            if (router.canGoBack()) router.back();
            else router.replace('/(tabs)' as any);
        }
    }, [token, isProfileCompleted]);

    const handleFollow = async () => {
        if (!requireProfile('follow this creator')) return;
        if (!token || !resolvedUserId || followBusy) return;
        setFollowBusy(true);
        try {
            const res = isFollowing
                ? await unfollowUser(token, resolvedUserId)
                : await followUser(token, resolvedUserId);
            if (res.success) {
                const wasFollowing = isFollowing;
                setIsFollowing(!wasFollowing);
                setStats((prev: any) => prev ? {
                    ...prev,
                    followerCount: (prev.followerCount ?? 0) + (wasFollowing ? -1 : 1),
                } : prev);
            }
        } finally {
            setFollowBusy(false);
        }
    };

    const handleBlock = async () => {
        if (!requireProfile('block this user')) return;
        if (!token || !resolvedUserId || blockBusy) return;
        setBlockBusy(true);
        try {
            const res = isBlocked
                ? await unblockUser(token, resolvedUserId)
                : await blockUser(token, resolvedUserId);
            if (res.success) {
                const wasBlocked = isBlocked;
                setIsBlocked(!wasBlocked);
                setShowBlockConfirm(false);
                showAlert(
                    wasBlocked ? 'User Unblocked' : 'User Blocked',
                    wasBlocked
                        ? 'You can now see their content again.'
                        : 'You will no longer see their content in your feed.'
                );
            }
        } finally {
            setBlockBusy(false);
        }
    };

    const handleCollab = async () => {
        if (!requireProfile('send a collaboration request')) return;
        if (!token || !resolvedUserId || collabBusy || collabSent) return;
        setCollabBusy(true);
        try {
            const res = await sendCollaboration(token, { receiverId: resolvedUserId });
            if (res.success) {
                setCollabSent(true);
                setCollabStatus('PENDING');
                showAlert('Request Sent!', 'Your collaboration request has been sent. You will be notified when they respond.');
            } else {
                showAlert('Request Failed', (res as any).error || 'Could not send collaboration request.');
            }
        } finally {
            setCollabBusy(false);
        }
    };

    const openChat = async () => {
        if (!requireProfile('message this user')) return;
        if (!token || !resolvedUserId) return;
        const res = await openConversationWith(token, resolvedUserId);
        if (res.success && res.data?.id) {
            router.push({ pathname: '/chat/[id]', params: { id: res.data.id } } as any);
        } else {
            showAlert('Chat Error', res.error || 'Could not open conversation.');
        }
    };

    const handleCall = async () => {
        if (!requireProfile('call this user')) return;
        if (!token || !resolvedUserId) return;
        try {
            const res = await initiateCall(token, resolvedUserId);
            if (res.success && res.data) {
                router.push({
                    pathname: '/call',
                    params: {
                        mode: 'outgoing',
                        callId: res.data.callId,
                        channelName: res.data.channelName,
                        agoraToken: res.data.token,
                        appId: res.data.appId,
                        remoteName: profile?.name || 'User',
                        remoteImage: profile?.profilePicture || '',
                    },
                } as any);
            } else {
                showAlert('Call Failed', (res as any).error || 'Could not start call.');
            }
        } catch (err: any) {
            showAlert('Call Failed', err?.message || 'Network error.');
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={styles.loadingWrap}>
                <Text style={styles.loadingText}>Profile not found</Text>
            </View>
        );
    }

    const isFreelancerProfile = profile.role === 'FREELANCER';
    // Both following and collaborating only make sense across roles (Creator
    // ↔ Freelancer) — the backend already 403s a same-role request for
    // either, but showing the buttons at all (e.g. a Creator viewing another
    // Creator) is misleading.
    const isOppositeRole = !!userRole && !!profile.role && userRole !== profile.role;
    // Buttons/borders use the viewer's own role color for consistency
    const accentColor = theme.primary;
    // Header gradient reflects the profile owner's role as a visual cue
    const headerGradient = isFreelancerProfile
        ? ['rgba(242, 105, 48, 0.4)', 'rgba(0, 0, 0, 0)']
        : ['rgba(237, 42, 145, 0.4)', 'rgba(0, 0, 0, 0)'];

    const p = profile.freelancerProfile || profile.creatorProfile || {};
    const name = p.name || (isFreelancerProfile ? 'Freelancer' : 'Creator');
    const category = p.categoryNames?.[0] || null;
    const bio = p.bio || (isFreelancerProfile
        ? 'Fashion & lifestyle content creator with a passion for sustainable fashion. I create engaging content for brands that align with my values.'
        : 'Creates engaging beauty content like makeup tutorials, skincare tips, and product reviews.');
    const location = p.location || null;
    const joinedLabel = profile.createdAt
        ? `Joined ${new Date(profile.createdAt).toLocaleString('en-US', { month: 'long', year: 'numeric' })}`
        : null;
    const openLink = (url: string | null | undefined) => {
        if (url) Linking.openURL(url).catch(() => { });
    };
    // Each provided link renders as its own clickable icon — instagram, youtube,
    // twitter/X and portfolio are independent fields and can all be present at once.
    const socials: { key: string; icon: any; color: string; url: string; platform?: string }[] = [];
    if (p.instagramHandle) socials.push({ key: 'ig', icon: 'logo-instagram', color: '#E4405F', url: `https://instagram.com/${p.instagramHandle}` });
    if (p.youtubeHandle) socials.push({ key: 'yt', icon: 'logo-youtube', color: '#FF0000', url: youtubeUrl(p.youtubeHandle) });
    if (p.facebookHandle) socials.push({ key: 'fb', icon: 'logo-facebook', color: '#1877F2', url: facebookUrl(p.facebookHandle) });
    if (p.twitterHandle) socials.push({ key: 'tw', platform: 'X', icon: 'x-twitter', color: '#000000', url: `https://x.com/${p.twitterHandle}` });
    if (p.portfolioUrl) socials.push({ key: 'portfolio', icon: 'globe-outline', color: '#6366F1', url: p.portfolioUrl });
    const langsArr: string[] = p.languages && p.languages.length > 0 ? p.languages : p.language ? [p.language] : [];
    const languagesText = langsArr.join(', ') || null;
    const experienceText = p.experienceLevel
        ? p.experienceLevel.charAt(0) + p.experienceLevel.slice(1).toLowerCase()
        : null;

    const CHIP_COLORS = [
        { bg: 'rgba(74, 1, 48, 0.5)', border: '#4A0130', text: '#FF7CC3' },
        { bg: 'rgba(11, 2, 60, 0.5)', border: '#0B023C', text: '#7C8CFF' },
        { bg: 'rgba(57, 45, 1, 0.5)', border: '#392D01', text: '#FFE07C' },
        { bg: 'rgba(1, 47, 47, 0.5)', border: '#012F2F', text: '#7CFFD6' },
        { bg: 'rgba(55, 30, 0, 0.5)', border: '#371E00', text: '#FFB87C' },
    ];
    const rawSkills: string[] = (isFreelancerProfile ? p.skills : p.categoryNames) || [];
    const skillLabels = rawSkills;
    const specializations = skillLabels.map((label: string, idx: number) => ({
        label,
        ...CHIP_COLORS[idx % CHIP_COLORS.length],
    }));

    return (
        <View style={styles.root}>
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Header Gradient */}
                    <LinearGradient
                        colors={headerGradient as any}
                        style={styles.topGradient}
                    />
                    
                    {/* Top Bar */}
                    <View style={styles.topBar}>
                        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as any))}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.topBarRight}>
                            {collabStatus === 'ACCEPTED' && (
                                <TouchableOpacity style={styles.topIconBtn} onPress={handleCall}>
                                    <Ionicons name="call-outline" size={24} color="#fff" />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity style={styles.topIconBtn} onPress={() => setShowActionMenu(true)}>
                                <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    {/* Profile Card */}
                    <View style={styles.profileCard}>
                        <View style={styles.cardHeader}>
                            <Image source={p.profilePicture ? { uri: p.profilePicture } : require('../assets/images/icon.png')} style={styles.avatar} resizeMode="cover" />
                            <View style={styles.headerButtons}>
                                {collabStatus === 'ACCEPTED' ? (
                                    <TouchableOpacity style={[styles.messageBtn, { backgroundColor: accentColor }]} onPress={openChat}>
                                        <Ionicons name="chatbubble-ellipses-outline" size={12} color="#fff" />
                                        <Text style={styles.messageBtnText}>Message</Text>
                                    </TouchableOpacity>
                                ) : null}
                                {resolvedUserId !== myId && isOppositeRole && (
                                    <TouchableOpacity
                                        style={[styles.followBtn, { borderColor: accentColor }, isFollowing && { backgroundColor: accentColor + '33' }]}
                                        onPress={handleFollow}
                                        disabled={followBusy}
                                    >
                                        <Ionicons name={isFollowing ? "checkmark" : "add"} size={14} color={accentColor} />
                                        <Text style={[styles.followBtnText, { color: accentColor }]}>{isFollowing ? 'Following' : 'Follow'}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        <View style={styles.nameRow}>
                            <Text style={[styles.name, { flexShrink: 1 }]} numberOfLines={1} ellipsizeMode="tail">{name}</Text>
                            <MaterialIcons name="verified" size={16} color={accentColor} style={{ marginLeft: 4, flexShrink: 0 }} />
                            {profile?.isPremium && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 6, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, backgroundColor: 'rgba(255,215,0,0.15)', flexShrink: 0 }}>
                                    <Ionicons name="star" size={10} color="#FFD700" />
                                    <Text style={{ color: '#FFD700', fontSize: 10, fontFamily: 'Poppins_600SemiBold' }}>Premium</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.category}>{category}</Text>

                        <View style={styles.infoGrid}>
                            {location ? (
                                <View style={styles.infoItem}>
                                    <Ionicons name="location-outline" size={18} color="#A0A0A0" />
                                    <Text style={styles.infoText}>{location}</Text>
                                </View>
                            ) : null}
                            {joinedLabel ? (
                                <View style={styles.infoItem}>
                                    <Ionicons name="calendar-outline" size={18} color="#A0A0A0" />
                                    <Text style={styles.infoText}>{joinedLabel}</Text>
                                </View>
                            ) : null}
                            {languagesText ? (
                                <View style={styles.infoItem}>
                                    <Ionicons name="language-outline" size={18} color="#A0A0A0" />
                                    <Text style={styles.infoText}>{languagesText}</Text>
                                </View>
                            ) : null}
                            {experienceText ? (
                                <View style={styles.infoItem}>
                                    <Ionicons name="briefcase-outline" size={18} color="#A0A0A0" />
                                    <Text style={styles.infoText}>{experienceText}</Text>
                                </View>
                            ) : null}
                        </View>

                        {socials.length > 0 ? (
                            <View style={styles.socialRow}>
                                {socials.map(s => (
                                    <TouchableOpacity
                                        key={s.key}
                                        style={[styles.socialIcon, { backgroundColor: s.color }]}
                                        activeOpacity={0.8}
                                        onPress={() => openLink(s.url)}
                                    >
                                        {s.platform === 'X' ? (
                                            <FontAwesome6 name={s.icon} size={16} color="#fff" />
                                        ) : (
                                            <Ionicons name={s.icon} size={18} color="#fff" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : null}

                        <View style={styles.aboutSection}>
                            <Text style={styles.aboutTitle}>About</Text>
                            <Text style={styles.aboutBio}>{bio}</Text>
                        </View>
                    </View>

                    {/* ── Collaborate / Message CTA */}
                    {resolvedUserId !== myId && isOppositeRole && (
                        <TouchableOpacity
                            style={[
                                styles.collabBtn,
                                collabStatus === 'ACCEPTED'
                                    ? { borderColor: '#4caf50', backgroundColor: 'rgba(76,175,80,0.08)' }
                                    : collabStatus === 'PENDING'
                                        ? { borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.08)' }
                                        : { borderColor: accentColor },
                            ]}
                            onPress={handleCollab}
                            disabled={collabBusy || collabStatus === 'PENDING' || collabStatus === 'ACCEPTED'}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name={collabStatus === 'ACCEPTED' ? 'people' : collabStatus === 'PENDING' ? 'time-outline' : 'people-outline'}
                                size={16}
                                color={collabStatus === 'ACCEPTED' ? '#4caf50' : collabStatus === 'PENDING' ? '#f59e0b' : accentColor}
                            />
                            <Text style={[styles.collabBtnText, { color: collabStatus === 'ACCEPTED' ? '#4caf50' : collabStatus === 'PENDING' ? '#f59e0b' : accentColor }]}>
                                {collabBusy ? 'Sending…' : collabStatus === 'ACCEPTED' ? 'Collaborated' : collabStatus === 'PENDING' ? 'Request Pending' : 'Collaborate'}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Stats Card */}
                    <View style={styles.statsCard}>
                        <TouchableOpacity
                            style={styles.statBox}
                            activeOpacity={0.7}
                            onPress={() => resolvedUserId && router.push({ pathname: '/followers', params: { userId: resolvedUserId, name } } as any)}
                        >
                            <Text style={styles.statLabel}>Followers</Text>
                            <Text style={styles.statValue}>{stats?.followerCount ?? 0}</Text>
                        </TouchableOpacity>
                        <View style={styles.statDivider} />
                        <TouchableOpacity
                            style={styles.statBox}
                            activeOpacity={0.7}
                            onPress={() => resolvedUserId && router.push({ pathname: '/following', params: { userId: resolvedUserId, name } } as any)}
                        >
                            <Text style={styles.statLabel}>Following</Text>
                            <Text style={styles.statValue}>{stats?.followingCount ?? 0}</Text>
                        </TouchableOpacity>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Collabs</Text>
                            <Text style={styles.statValue}>{stats?.collabCount ?? 0}</Text>
                        </View>
                    </View>

                    {/* Specializations Section */}
                    <View style={styles.specializationsSection}>
                        <Text style={styles.specialTitle}>Specializations</Text>
                        <View style={styles.chipsContainer}>
                            {specializations.map((spec, idx) => (
                                <View key={idx} style={[styles.chip, { backgroundColor: spec.bg, borderColor: spec.border }]}>
                                    <Text style={[styles.chipText, { color: spec.text }]}>{spec.label}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    <View style={{ height: 100 }} />
                </ScrollView>
            </SafeAreaView>
            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
                role={profile?.role as any}
            />

            <Modal visible={showActionMenu} transparent animationType="fade" onRequestClose={() => setShowActionMenu(false)}>
                <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setShowActionMenu(false)}>
                    <View style={styles.menuCard}>
                        <TouchableOpacity
                            style={[styles.menuRow, isReported && { opacity: 0.5 }]}
                            disabled={isReported}
                            onPress={() => {
                                setShowActionMenu(false);
                                if (!requireProfile('report this user')) return;
                                setShowReportModal(true);
                            }}
                        >
                            <Ionicons name={isReported ? 'checkmark-circle-outline' : 'flag-outline'} size={20} color="#fff" />
                            <Text style={styles.menuRowText}>{isReported ? 'Reported' : 'Report User'}</Text>
                        </TouchableOpacity>
                        <View style={styles.menuDivider} />
                        <TouchableOpacity
                            style={styles.menuRow}
                            onPress={() => { setShowActionMenu(false); setShowBlockConfirm(true); }}
                        >
                            <Ionicons name={isBlocked ? 'checkmark-circle-outline' : 'ban-outline'} size={20} color="#FF6B78" />
                            <Text style={[styles.menuRowText, { color: '#FF6B78' }]}>
                                {isBlocked ? 'Unblock User' : 'Block User'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            <ConfirmActionModal
                visible={showBlockConfirm}
                title={isBlocked ? 'Unblock User?' : 'Block User?'}
                message={
                    isBlocked
                        ? `${name} will be able to appear in your feed again.`
                        : `${name} won't be able to reach you, and their posts will disappear from your feed.`
                }
                confirmLabel={isBlocked ? 'Unblock' : 'Block'}
                busy={blockBusy}
                onConfirm={handleBlock}
                onDismiss={() => setShowBlockConfirm(false)}
            />

            {resolvedUserId && (
                <ReportModal
                    visible={showReportModal}
                    type="USER"
                    targetId={resolvedUserId}
                    targetName={name}
                    onClose={() => setShowReportModal(false)}
                    onSubmitted={() => setIsReported(true)}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#0A0A0A',
    },
    loadingWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0A0A0A',
    },
    loadingText: {
        color: '#fff',
        fontFamily: fonts.regular,
    },
    topGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 300,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    topBarRight: {
        flexDirection: 'row',
        gap: 15,
    },
    topIconBtn: {
        padding: 5,
    },
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: 60,
        paddingRight: 16,
    },
    menuCard: {
        backgroundColor: '#17171F',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
        minWidth: 180,
    },
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    menuRowText: {
        color: '#fff',
        fontSize: 14,
        fontFamily: fonts.medium,
    },
    menuDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    scrollContent: {
        paddingTop: 0,
        paddingBottom: 40,
    },
    profileCard: {
        width: Math.min(408, SCREEN_WIDTH - 40),
         borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(64, 64, 64, 0.50)',
        alignSelf: 'center',
        // Shadow emulation
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 11 },
        shadowOpacity: 0.07,
        shadowRadius: 11,
                backgroundColor: 'rgba(243, 243, 243, 0.1)',

    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatar: {
        width: 92,
        height: 92,
        borderRadius: 100,
        backgroundColor: '#2A2A2A',
    },
    initialsAvatar: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
    },
    initialsText: {
        fontSize: 24,
        fontFamily: fonts.bold,
    },
    headerButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    messageBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        height: 36,
        borderRadius: 99,
        gap: 5,
        width: 100
    },
    messageBtnText: {
        color: '#fff',
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
        lineHeight: 14,
        letterSpacing: -0.5,
    },
    followBtn: {
        backgroundColor: 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        height: 36,
        borderRadius: 99,
        borderWidth: 1,
        gap: 4,
        width: 96,

    },
    followBtnText: {
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
        lineHeight: 14,
        letterSpacing: -0.5,

    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 0,
    },
    name: {
        color: '#fff',
        fontSize: 20,
        fontFamily: fonts.semibold,
        lineHeight: 28,
        letterSpacing: -0.5,
    },
    category: {
        color: '#A0A0A0',
        fontSize: 12,
        fontFamily: fonts.regular,
        marginBottom: 4,
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 10,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        maxWidth: '48%',
    },
    infoText: {
        color: '#E0E0E0',
        fontSize: 13,
        fontFamily: fonts.regular,
        letterSpacing: -0.5,
        flexShrink: 1,
    },
    socialRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    socialIcon: {
        width: 34,
        height: 34,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    aboutSection: {
        gap: 4,
        marginHorizontal: 20,
        marginBottom: 25,
    },
    aboutTitle: {
        color: '#fff',
        fontSize: 16,
        fontFamily: fonts.bold,
    },
    aboutBio: {
        color: '#B0B0B0',
        fontSize: 13,
        lineHeight: 18,
        fontFamily: fonts.regular,
    },
    collabBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginHorizontal: 20,
        marginBottom: 16,
        paddingVertical: 13,
        borderRadius: 14,
        borderWidth: 1.5,
        backgroundColor: 'transparent',
    },
    collabBtnText: {
        fontSize: 14,
        fontFamily: fonts.semibold,
        letterSpacing: -0.3,
    },
    statsCard: {
        backgroundColor: 'rgba(243, 243, 243, 0.1)',
        borderRadius: 20,
        flexDirection: 'row',
        paddingVertical: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        marginHorizontal: 20,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    statLabel: {
        color: '#A0A0A0',
        fontSize: 14,
        fontFamily: fonts.small,
    },
    statValue: {
        color: '#fff',
        fontSize: 20,
        fontFamily: fonts.regular,
        lineHeight:20,
        
    },
    statDivider: {
        width: 1,
        height: '60%',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignSelf: 'center',
    },
    specializationsSection: {
        backgroundColor: 'rgba(243, 243, 243, 0.1)',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        marginHorizontal: 20,
    },
    specialTitle: {
        color: '#fff',
        fontSize: 20,
        fontFamily: fonts.regular,
        marginBottom: 16,
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'flex-start',
    },
    chip: {
        width: '48%',
        flexGrow: 1,
        minWidth: '45%',
        paddingHorizontal: 12,
        height: 46,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chipText: {
        fontSize: 12,
        fontFamily: fonts.regular,
        letterSpacing: 0.3,
        textAlign: 'center',
    },
});
