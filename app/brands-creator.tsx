import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    Modal,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ConfirmActionModal from '../Components/ui/ConfirmActionModal';
import CustomAlert from '../Components/ui/CustomAlert';
import ReportModal from '../Components/ui/ReportModal';
import VerifiedBadge from '../Components/ui/VerifiedBadge';
import { useAuth } from '../context/AuthContext';
import { useCall } from '../context/CallContext';
import { useProfileGate } from '../context/ProfileGateContext';
import { instagramUrl, twitterUrl, youtubeUrl } from '../services/socialLinks';
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
    unblockUser,
    unfollowUser,
} from '../services/userService';
import { fonts, palette } from '../theme/colors';

const imgDefaultAvatar = require('../assets/defaultavatar.png');

const DUMMY_SIMILAR_PROFILES = [
    { id: 'sim-1', name: 'FreshBrew Co.', category: 'Entertainment', followers: '50.6M', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80' },
    { id: 'sim-2', name: 'Aadhya Sharma', category: 'Beauty', followers: '12M', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80' },
    { id: 'sim-3', name: 'Rohit Nair', category: 'Podcast', followers: '12M', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80' },
    { id: 'sim-4', name: 'Rudrakshika', category: 'Beauty', followers: '12M', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80' },
];

export default function BrandsCreatorScreen() {
    const router = useRouter();
    const { width: screenWidth } = useWindowDimensions();
    const cardMaxWidth = Math.min(408, screenWidth - 32);

    const { token, userId: myId, userRole } = useAuth();
    const call = useCall();
    const { requireProfile, isProfileCompleted } = useProfileGate();
    const { id: paramId, userId: paramUserId, postId: paramPostId } = useLocalSearchParams<{ id?: string; userId?: string; postId?: string }>();
    const [resolvedUserId, setResolvedUserId] = useState<string | null>(paramUserId || paramId || null);

    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [followBusy, setFollowBusy] = useState(false);
    const [collabStatus, setCollabStatus] = useState<string>('NONE');
    const contactUnlocked = collabStatus === 'ACCEPTED';
    const [isBlocked, setIsBlocked] = useState(false);
    const [blockBusy, setBlockBusy] = useState(false);
    const [isReported, setIsReported] = useState(false);
    const [showActionMenu, setShowActionMenu] = useState(false);
    const [showBlockConfirm, setShowBlockConfirm] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isAddedToList, setIsAddedToList] = useState(false);

    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
    });

    const showAlert = (title: string, message: string) => {
        setAlertConfig({ visible: true, title, message });
    };

    const load = useCallback(async () => {
        try {
            let uid = resolvedUserId;

            if (!uid && paramPostId) {
                const postRes = await getPostById(paramPostId, token);
                if (postRes.success && postRes.data) {
                    uid = postRes.data.owner?.id || postRes.data.userId || null;
                }
            }

            if (!uid) {
                // Fallback to sample demo creator if no UID provided
                setProfile({
                    id: 'demo-creator-1',
                    createdAt: '2020-03-15T00:00:00.000Z',
                    role: 'CREATOR',
                    creatorProfile: {
                        name: 'Priya Sharma',
                        categoryNames: ['Beauty'],
                        bio: 'Creates engaging beauty content like makeup tutorials, skincare tips, and product reviews.',
                        location: 'Banglore, India',
                        instagramHandle: 'priyasharma',
                        youtubeHandle: 'priyasharma_official',
                        twitterHandle: 'priyasharma',
                        language: 'Telugu',
                        languages: ['Telugu'],
                    },
                });
                setLoading(false);
                return;
            }
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
                    setCollabStatus(collabRes.data?.status ?? 'NONE');
                }
            } else {
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

    useFocusEffect(useCallback(() => { load(); }, [load]));

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

    const openChat = async () => {
        if (!requireProfile('message this user')) return;
        if (!token || !resolvedUserId) {
            showAlert('Demo Profile', 'Connect or log in to message this creator.');
            return;
        }
        const res = await openConversationWith(token, resolvedUserId);
        if (res.success && res.data?.id) {
            router.push({ pathname: '/chat/[id]', params: { id: res.data.id } } as any);
        } else {
            showAlert('Chat Error', res.error || 'Could not open conversation.');
        }
    };

    const handleCall = async () => {
        if (!requireProfile('call this user')) return;
        if (!token || !resolvedUserId) {
            showAlert('Demo Profile', 'Connect or log in to call this creator.');
            return;
        }
        if (call.callMode !== 'idle') { call.resume(); return; }
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

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out ${p?.name || 'this Creator'} on DigiTag!`,
                url: `https://digitag.app/creator/${resolvedUserId || ''}`,
            });
        } catch {}
    };

    const openLink = async (url: string | null | undefined) => {
        if (!url) return;
        let target = url.trim();
        if (!target) return;
        if (!target.startsWith('http://') && !target.startsWith('https://')) target = 'https://' + target;
        try {
            await WebBrowser.openBrowserAsync(target);
        } catch {
            try {
                await Linking.openURL(target);
            } catch {
                showAlert('Could not open link', 'This link could not be opened.');
            }
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#060606', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#1A8CFF" />
            </View>
        );
    }

    const p = profile?.creatorProfile || profile?.freelancerProfile || {};
    const name = p.name || 'Priya Sharma';
    const category = p.categoryNames?.[0] || 'Beauty';
    const roleLabel = profile?.role === 'FREELANCER' ? 'Freelancer' : 'Creator';
    const bio = p.bio || 'Creates engaging beauty content like makeup tutorials, skincare tips, and product reviews.';
    const location = p.location || 'Banglore, India';
    const joinedLabel = profile?.createdAt
        ? `Joined ${new Date(profile.createdAt).toLocaleString('en-US', { month: 'long', year: 'numeric' })}`
        : 'Joined March 2020';
    const handleUrl = p.instagramHandle
        ? `instagram.com/${p.instagramHandle.replace(/^@/, '')}`
        : 'instagram.com/priyasharma';

    const igHandle = p.instagramHandle || 'priyasharma';
    const ytHandle = p.youtubeHandle || null;
    const twHandle = p.twitterHandle || null;
    const languageText = (p.languages && p.languages.length > 0) ? p.languages.join(', ') : (p.language || 'Telugu');

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#060606' }} edges={['top']}>
            {/* Ambient Decorative Background Blur Circles */}
            <View
                pointerEvents="none"
                style={{
                    position: 'absolute',
                    top: -80,
                    left: -80,
                    width: 280,
                    height: 280,
                    borderRadius: 140,
                    backgroundColor: 'rgba(108, 71, 255, 0.25)',
                }}
            />
            <View
                pointerEvents="none"
                style={{
                    position: 'absolute',
                    top: 590,
                    right: -100,
                    width: 320,
                    height: 320,
                    borderRadius: 160,
                    backgroundColor: 'rgba(0, 229, 195, 0.15)',
                }}
            />

            {/* Header Navigation Bar */}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                }}
            >
                <TouchableOpacity
                    onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as any))}
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    {/* Share Button */}
                    <TouchableOpacity
                        onPress={handleShare}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            backgroundColor: 'rgba(39, 39, 42, 0.6)',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
                    </TouchableOpacity>

                    {/* Bookmark Button */}
                    <TouchableOpacity
                        onPress={() => setIsSaved(!isSaved)}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            backgroundColor: 'rgba(39, 39, 42, 0.6)',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={isSaved ? 'bookmark' : 'bookmark-outline'}
                            size={18}
                            color={isSaved ? '#1A8CFF' : '#FFFFFF'}
                        />
                    </TouchableOpacity>

                    {/* Options Menu Button */}
                    <TouchableOpacity
                        onPress={() => setShowActionMenu(true)}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            backgroundColor: 'rgba(39, 39, 42, 0.6)',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="ellipsis-vertical" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 110, paddingTop: 10 }}
            >
                {/* Glassmorphism Main Profile Card */}
                <View
                    style={{
                        width: '100%',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: 'rgba(64, 64, 64, 0.5)',
                        padding: 18,
                        position: 'relative',
                    }}
                >
                    {/* Header Row: Avatar + Message/Call Action Buttons */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Image
                            source={p.profilePicture ? { uri: p.profilePicture } : imgDefaultAvatar}
                            style={{
                                width: 80,
                                height: 80,
                                borderRadius: 40,
                                borderWidth: 2,
                                borderColor: 'rgba(255,255,255,0.2)',
                            }}
                            resizeMode="cover"
                        />

                        {/* Message & Call Action Buttons */}
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity
                                onPress={openChat}
                                style={{
                                    backgroundColor: '#1A8CFF',
                                    borderRadius: 99,
                                    paddingHorizontal: 16,
                                    paddingVertical: 10,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                                activeOpacity={0.85}
                            >
                                <Ionicons name="send" size={13} color="#FFFFFF" />
                                <Text style={{ color: '#FFFFFF', fontSize: 13, fontFamily: fonts.medium }}>
                                    Message
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleCall}
                                style={{
                                    borderWidth: 1,
                                    borderColor: '#FFFFFF',
                                    borderRadius: 99,
                                    paddingHorizontal: 16,
                                    paddingVertical: 10,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                                activeOpacity={0.85}
                            >
                                <Ionicons name="call-outline" size={14} color="#FFFFFF" />
                                <Text style={{ color: '#FFFFFF', fontSize: 13, fontFamily: fonts.regular }}>
                                    Call
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Name & Verified Badge */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 6 }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 20, fontFamily: fonts.semibold }}>
                            {name}
                        </Text>
                        <VerifiedBadge isPremium={profile?.isPremium ?? true} size={18} />
                    </View>

                    {/* Category | Role */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 }}>
                        <Text style={{ color: '#E2E2E2', fontSize: 12, fontFamily: fonts.regular }}>
                            {category}
                        </Text>
                        <Text style={{ color: '#E2E2E2', fontSize: 12, fontFamily: fonts.regular }}>
                            |
                        </Text>
                        <Text style={{ color: '#E2E2E2', fontSize: 12, fontFamily: fonts.regular }}>
                            {roleLabel}
                        </Text>
                    </View>

                    {/* Location & Joined Date Lines */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginTop: 14 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Ionicons name="location-outline" size={16} color="#D6D6D6" />
                            <Text style={{ color: '#D6D6D6', fontSize: 14, fontFamily: fonts.regular }}>
                                {location}
                            </Text>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Ionicons name="calendar-outline" size={16} color="#D6D6D6" />
                            <Text style={{ color: '#D6D6D6', fontSize: 14, fontFamily: fonts.regular }}>
                                {joinedLabel}
                            </Text>
                        </View>
                    </View>

                    {/* Main Website / Handle Link */}
                    <TouchableOpacity
                        onPress={() => openLink(instagramUrl(igHandle))}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="link-outline" size={18} color="#E2E2E2" />
                        <Text style={{ color: '#E2E2E2', fontSize: 14, fontFamily: fonts.regular }}>
                            {handleUrl}
                        </Text>
                    </TouchableOpacity>

                    {/* About Section */}
                    <Text style={{ color: '#FFFFFF', fontSize: 16, fontFamily: fonts.semibold, marginTop: 18 }}>
                        About
                    </Text>
                    <Text
                        style={{
                            color: '#D6D6D6',
                            fontSize: 13,
                            fontFamily: fonts.small,
                            lineHeight: 19,
                            marginTop: 6,
                        }}
                    >
                        {bio}
                    </Text>
                </View>

                {/* Social Links Section */}
                <View style={{ marginTop: 28 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 18, fontFamily: fonts.medium }}>
                        Social links
                    </Text>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 12, marginTop: 14 }}
                    >
                        {/* Instagram Card */}
                        <TouchableOpacity
                            onPress={() => openLink(instagramUrl(igHandle))}
                            activeOpacity={0.85}
                            style={{
                                width: 128,
                                height: 141,
                                borderRadius: 16,
                                padding: 14,
                                justifyContent: 'space-between',
                                borderWidth: 1,
                                borderColor: '#FFFFFF',
                                backgroundColor: '#14141A',
                            }}
                        >
                            <Ionicons name="logo-instagram" size={28} color="#E1306C" />
                            <View>
                                <Text style={{ color: '#FFFFFF', fontSize: 20, fontFamily: fonts.bold }}>
                                    30M
                                </Text>
                                <Text style={{ color: '#D6D6D6', fontSize: 11, fontFamily: fonts.regular, marginTop: 2 }}>
                                    Followers
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {/* YouTube Card */}
                        <TouchableOpacity
                            onPress={() => ytHandle && openLink(youtubeUrl(ytHandle))}
                            activeOpacity={0.85}
                            style={{
                                width: 128,
                                height: 141,
                                borderRadius: 16,
                                padding: 14,
                                justifyContent: 'space-between',
                                borderWidth: 1,
                                borderColor: '#FFFFFF',
                                backgroundColor: '#14141A',
                            }}
                        >
                            <Ionicons name="logo-youtube" size={28} color="#FF0000" />
                            <View>
                                <Text style={{ color: '#FFFFFF', fontSize: 16, fontFamily: fonts.medium }}>
                                    Youtube
                                </Text>
                                <Text style={{ color: '#D6D6D6', fontSize: 11, fontFamily: fonts.regular, marginTop: 2 }}>
                                    {ytHandle ? `@${ytHandle}` : 'Add youtube link'}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {/* Twitter / X Card */}
                        <TouchableOpacity
                            onPress={() => twHandle && openLink(twitterUrl(twHandle))}
                            activeOpacity={0.85}
                            style={{
                                width: 128,
                                height: 141,
                                borderRadius: 16,
                                padding: 14,
                                justifyContent: 'space-between',
                                borderWidth: 1,
                                borderColor: '#FFFFFF',
                                backgroundColor: '#14141A',
                            }}
                        >
                            <FontAwesome6 name="x-twitter" size={24} color="#FFFFFF" style={{ marginTop: 2 }} />
                            <View>
                                <Text style={{ color: '#FFFFFF', fontSize: 16, fontFamily: fonts.medium }}>
                                    Twitter
                                </Text>
                                <Text style={{ color: '#D6D6D6', fontSize: 11, fontFamily: fonts.regular, marginTop: 2 }}>
                                    {twHandle ? `@${twHandle}` : 'Add twitter link'}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* Ad Preferences Section */}
                <View style={{ marginTop: 28 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 22, fontFamily: fonts.semibold }}>
                        Ad Preferences
                    </Text>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 12, marginTop: 14 }}
                    >
                        {/* Stripe Ad */}
                        <View
                            style={{
                                width: 128,
                                height: 141,
                                borderRadius: 16,
                                padding: 14,
                                justifyContent: 'space-between',
                                borderWidth: 1,
                                borderColor: '#FFFFFF',
                                backgroundColor: '#14141A',
                            }}
                        >
                            <Ionicons name="megaphone-outline" size={24} color="#1A8CFF" />
                            <View>
                                <Text style={{ color: '#FFFFFF', fontSize: 15, fontFamily: fonts.medium }}>
                                    Stripe Ad
                                </Text>
                                <Text style={{ color: '#D6D6D6', fontSize: 11, fontFamily: fonts.regular, marginTop: 2 }}>
                                    ₹1000-5000
                                </Text>
                            </View>
                        </View>

                        {/* Photo Ad */}
                        <View
                            style={{
                                width: 128,
                                height: 141,
                                borderRadius: 16,
                                padding: 14,
                                justifyContent: 'space-between',
                                borderWidth: 1,
                                borderColor: '#FFFFFF',
                                backgroundColor: '#14141A',
                            }}
                        >
                            <Ionicons name="image-outline" size={24} color="#00E5C3" />
                            <View>
                                <Text style={{ color: '#FFFFFF', fontSize: 15, fontFamily: fonts.medium }}>
                                    Photo Ad
                                </Text>
                                <Text style={{ color: '#D6D6D6', fontSize: 11, fontFamily: fonts.regular, marginTop: 2 }}>
                                    ₹800-3000
                                </Text>
                            </View>
                        </View>

                        {/* Video Ad */}
                        <View
                            style={{
                                width: 128,
                                height: 141,
                                borderRadius: 16,
                                padding: 14,
                                justifyContent: 'space-between',
                                borderWidth: 1,
                                borderColor: '#FFFFFF',
                                backgroundColor: '#14141A',
                            }}
                        >
                            <Ionicons name="videocam-outline" size={24} color="#FF4081" />
                            <View>
                                <Text style={{ color: '#FFFFFF', fontSize: 15, fontFamily: fonts.medium }}>
                                    Video Ad
                                </Text>
                                <Text style={{ color: '#D6D6D6', fontSize: 11, fontFamily: fonts.regular, marginTop: 2 }}>
                                    ₹1200-4000
                                </Text>
                            </View>
                        </View>
                    </ScrollView>
                </View>

                {/* Content Type Section */}
                <View style={{ marginTop: 28 }}>
                    <Text style={{ color: '#D6D6D6', fontSize: 17, fontFamily: fonts.medium }}>
                        Content Type
                    </Text>
                    <View style={{ flexDirection: 'row', marginTop: 10 }}>
                        <View
                            style={{
                                backgroundColor: '#333435',
                                borderRadius: 14,
                                paddingHorizontal: 16,
                                paddingVertical: 10,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                            }}
                        >
                            <Ionicons name="sparkles-outline" size={16} color="#FFFFFF" />
                            <Text style={{ color: '#FFFFFF', fontSize: 14, fontFamily: fonts.medium }}>
                                {category}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Content Language Section */}
                <View style={{ marginTop: 24 }}>
                    <Text style={{ color: '#D6D6D6', fontSize: 17, fontFamily: fonts.medium }}>
                        Content Language
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                        <Ionicons name="language-outline" size={18} color="#FFFFFF" />
                        <Text style={{ color: '#FFFFFF', fontSize: 15, fontFamily: fonts.medium }}>
                            {languageText}
                        </Text>
                    </View>
                </View>

                {/* Profile Type Section */}
                <View style={{ marginTop: 24 }}>
                    <Text style={{ color: '#D6D6D6', fontSize: 17, fontFamily: fonts.medium }}>
                        Profile Type
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                        <Ionicons name="person-outline" size={18} color="#FFFFFF" />
                        <Text style={{ color: '#FFFFFF', fontSize: 15, fontFamily: fonts.medium }}>
                            Individual Creator
                        </Text>
                    </View>
                </View>

                {/* Similar Profiles Section */}
                <View style={{ marginTop: 32 }}>
                    <Text style={{ color: '#D6D6D6', fontSize: 18, fontFamily: fonts.medium }}>
                        Similar Profiles
                    </Text>

                    <View style={{ marginTop: 14, gap: 12 }}>
                        {DUMMY_SIMILAR_PROFILES.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                activeOpacity={0.85}
                                onPress={() =>
                                    router.push({
                                        pathname: '/brands-creator',
                                        params: { userId: item.id },
                                    } as any)
                                }
                                style={{
                                    backgroundColor: '#14141A',
                                    borderRadius: 16,
                                    height: 96,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingHorizontal: 14,
                                    borderWidth: 1,
                                    borderColor: '#2C313A',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                                    <Image
                                        source={{ uri: item.avatar }}
                                        style={{ width: 64, height: 64, borderRadius: 32 }}
                                    />
                                    <View>
                                        <Text style={{ color: '#FFFFFF', fontSize: 17, fontFamily: fonts.medium }}>
                                            {item.name}
                                        </Text>
                                        <Text style={{ color: '#D6D6D6', fontSize: 12, fontFamily: fonts.regular, marginTop: 2 }}>
                                            {item.category}
                                        </Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                            <Ionicons name="person-circle-outline" size={13} color="#D6D6D6" />
                                            <Text style={{ color: '#D6D6D6', fontSize: 13, fontFamily: fonts.regular }}>
                                                {item.followers}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <Ionicons name="arrow-up-outline" size={20} color="#FFFFFF" style={{ transform: [{ rotate: '45deg' }] }} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Floating Action Button */}
            <View
                style={{
                    position: 'absolute',
                    bottom: 24,
                    left: 0,
                    right: 0,
                    alignItems: 'center',
                }}
            >
                <TouchableOpacity
                    onPress={() => {
                        setIsAddedToList(!isAddedToList);
                        showAlert(
                            isAddedToList ? 'Removed from List' : 'Added to List',
                            isAddedToList
                                ? `${name} has been removed from your saved list.`
                                : `${name} has been added to your shortlist for upcoming campaigns.`
                        );
                    }}
                    style={{
                        width: Math.min(396, screenWidth - 32),
                        height: 54,
                        borderRadius: 26,
                        overflow: 'hidden',
                    }}
                    activeOpacity={0.85}
                >
                    <LinearGradient
                        colors={
                            isAddedToList
                                ? ['#262631', '#1C1C24']
                                : ['#1A8CFF', '#6633E5']
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{
                            flex: 1,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 26,
                        }}
                    >
                        <Text style={{ color: '#FFFFFF', fontSize: 16, fontFamily: fonts.medium }}>
                            {isAddedToList ? 'Added to List ✓' : 'Add to List'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Action Modals */}
            <Modal
                visible={showActionMenu}
                transparent
                animationType="fade"
                onRequestClose={() => setShowActionMenu(false)}
            >
                <TouchableOpacity
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
                    activeOpacity={1}
                    onPress={() => setShowActionMenu(false)}
                >
                    <View
                        style={{
                            backgroundColor: palette.surface,
                            borderTopLeftRadius: 20,
                            borderTopRightRadius: 20,
                            padding: 20,
                            gap: 12,
                        }}
                    >
                        <TouchableOpacity
                            style={{ paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                            onPress={() => {
                                setShowActionMenu(false);
                                setShowBlockConfirm(true);
                            }}
                        >
                            <Ionicons name="ban-outline" size={20} color={palette.danger} />
                            <Text style={{ color: palette.danger, fontSize: 15, fontFamily: fonts.medium }}>
                                {isBlocked ? 'Unblock User' : 'Block User'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{ paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                            onPress={() => {
                                setShowActionMenu(false);
                                if (!token) {
                                    showAlert('Action Restricted', 'Log in to report content.');
                                    return;
                                }
                                setShowReportModal(true);
                            }}
                        >
                            <Ionicons name="flag-outline" size={20} color="#FFFFFF" />
                            <Text style={{ color: '#FFFFFF', fontSize: 15, fontFamily: fonts.medium }}>
                                {isReported ? 'Reported' : 'Report User'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            <ConfirmActionModal
                visible={showBlockConfirm}
                title={isBlocked ? 'Unblock User' : 'Block User'}
                message={
                    isBlocked
                        ? 'Are you sure you want to unblock this user?'
                        : 'Are you sure you want to block this user? You will no longer see their posts.'
                }
                confirmLabel={isBlocked ? 'Unblock' : 'Block'}
                confirmColor={palette.danger}
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
                    onSubmitted={() => {
                        setIsReported(true);
                        showAlert('Report Submitted', 'Thank you. We will review this user.');
                    }}
                />
            )}

            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
            />
        </SafeAreaView>
    );
}
