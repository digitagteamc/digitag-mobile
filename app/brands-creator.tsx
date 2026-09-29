import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Linking,
    Modal,
    ScrollView,
    Share,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ConfirmActionModal from '../Components/ui/ConfirmActionModal';
import CustomAlert from '../Components/ui/CustomAlert';
import ReportModal from '../Components/ui/ReportModal';
import { useAuth } from '../context/AuthContext';
import { useCall } from '../context/CallContext';
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
    { id: 'sim-2', name: 'Aadhya Sharma', category: 'Beauty', followers: '12m', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80' },
    { id: 'sim-3', name: 'Rohit Nair', category: 'Podcast', followers: '12m', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80' },
    { id: 'sim-4', name: 'Rudrakshika', category: 'Beauty', followers: '12m', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80' },
];

const AdPrefIcon = ({ type }: { type: 'stripe' | 'photo' | 'video' }) => {
    return (
        <View
            style={{
                width: 28,
                height: 34,
                backgroundColor: '#FFFFFF',
                borderRadius: 4,
                borderWidth: 1,
                borderColor: '#D0D0D5',
                overflow: 'hidden',
                justifyContent: 'space-between',
            }}
        >
            <View style={{ height: 7, backgroundColor: '#1A8CFF', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 8, height: 2, backgroundColor: '#FFFFFF', borderRadius: 1 }} />
            </View>

            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 2 }}>
                {type === 'stripe' && <Ionicons name="megaphone-outline" size={14} color="#1A8CFF" />}
                {type === 'photo' && <Ionicons name="image-outline" size={14} color="#00E5C3" />}
                {type === 'video' && <Ionicons name="videocam-outline" size={14} color="#FF4081" />}
            </View>

            <View style={{ height: 6, backgroundColor: '#FF9500', width: '100%' }} />
        </View>
    );
};

export default function BrandsCreatorScreen() {
    const router = useRouter();
    const { width: screenWidth } = useWindowDimensions();

    const { token, userId: myId } = useAuth();
    const call = useCall();
    const { id: paramId, userId: paramUserId, postId: paramPostId } = useLocalSearchParams<{ id?: string; userId?: string; postId?: string }>();
    const [resolvedUserId, setResolvedUserId] = useState<string | null>(paramUserId || paramId || null);

    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [followBusy, setFollowBusy] = useState(false);
    const [collabStatus, setCollabStatus] = useState<string>('NONE');
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

    const handleFollow = async () => {
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
            <View style={{ flex: 1, backgroundColor: '#070709', alignItems: 'center', justifyContent: 'center' }}>
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
        <SafeAreaView style={{ flex: 1, backgroundColor: '#070709' }} edges={['top']}>
            {/* Background Ambient Purple & Teal Glows */}
            <View
                pointerEvents="none"
                style={{
                    position: 'absolute',
                    top: -100,
                    left: -100,
                    width: 320,
                    height: 320,
                    borderRadius: 160,
                    backgroundColor: 'rgba(88, 44, 180, 0.28)',
                }}
            />
            <View
                pointerEvents="none"
                style={{
                    position: 'absolute',
                    top: 480,
                    right: -110,
                    width: 350,
                    height: 350,
                    borderRadius: 175,
                    backgroundColor: 'rgba(0, 150, 130, 0.14)',
                }}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 110, paddingTop: 4 }}
            >
                {/* Top Navigation Bar */}
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingVertical: 12,
                        marginBottom: 6,
                    }}
                >
                    <TouchableOpacity
                        onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as any))}
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: 19,
                            backgroundColor: 'rgba(255,255,255,0.08)',
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
                                width: 38,
                                height: 38,
                                borderRadius: 19,
                                backgroundColor: 'rgba(255,255,255,0.08)',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="share-outline" size={18} color="#FFFFFF" />
                        </TouchableOpacity>

                        {/* Bookmark Button */}
                        <TouchableOpacity
                            onPress={() => setIsSaved(!isSaved)}
                            style={{
                                width: 38,
                                height: 38,
                                borderRadius: 19,
                                backgroundColor: 'rgba(255,255,255,0.08)',
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
                                width: 38,
                                height: 38,
                                borderRadius: 19,
                                backgroundColor: 'rgba(255,255,255,0.08)',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="ellipsis-vertical" size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Main Creator Profile Card */}
                <View
                    style={{
                        width: '100%',
                        backgroundColor: 'rgba(255, 255, 255, 0.10)',
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: 'rgba(64, 64, 64, 0.50)',
                        padding: 18,
                        overflow: 'hidden',
                        shadowColor: '#000000',
                        shadowOffset: { width: -3, height: 11 },
                        shadowOpacity: 0.08,
                        shadowRadius: 15,
                        elevation: 5,
                    }}
                >
                    <BlurView
                        intensity={30}
                        tint="dark"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                        }}
                    />
                    {/* Top Row: Avatar + Buttons */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Image
                            source={p.profilePicture ? { uri: p.profilePicture } : imgDefaultAvatar}
                            style={{
                                width: 76,
                                height: 76,
                                borderRadius: 38,
                            }}
                            resizeMode="cover"
                        />

                        {/* Message & Call Action Buttons */}
                        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                            <TouchableOpacity
                                onPress={openChat}
                                style={{
                                    backgroundColor: '#0084FF',
                                    borderRadius: 24,
                                    paddingHorizontal: 18,
                                    paddingVertical: 10,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="send" size={12} color="#FFFFFF" style={{ transform: [{ rotate: '-25deg' }] }} />
                                <Text style={{ color: '#FFFFFF', fontSize: 13, fontFamily: fonts.medium }}>
                                    Message
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleCall}
                                style={{
                                    backgroundColor: 'transparent',
                                    borderWidth: 1,
                                    borderColor: 'rgba(255, 255, 255, 0.35)',
                                    borderRadius: 24,
                                    paddingHorizontal: 18,
                                    paddingVertical: 10,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="call-outline" size={14} color="#FFFFFF" />
                                <Text style={{ color: '#FFFFFF', fontSize: 13, fontFamily: fonts.medium }}>
                                    Call
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Name & Pink Checkmark Verified Badge */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 6 }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 20, fontFamily: fonts.bold }}>
                            {name}
                        </Text>
                        <Ionicons name="checkmark-circle" size={18} color="#F43F5E" />
                    </View>

                    {/* Category | Role */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 }}>
                        <Text style={{ color: '#9E9EA5', fontSize: 13, fontFamily: fonts.regular }}>
                            {category}
                        </Text>
                        <Text style={{ color: '#9E9EA5', fontSize: 13, fontFamily: fonts.regular }}>
                            |
                        </Text>
                        <Text style={{ color: '#9E9EA5', fontSize: 13, fontFamily: fonts.regular }}>
                            {roleLabel}
                        </Text>
                    </View>

                    {/* Location & Joined Date */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginTop: 14 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Ionicons name="location-outline" size={16} color="#A0A0AB" />
                            <Text style={{ color: '#D1D1D6', fontSize: 13.5, fontFamily: fonts.regular }}>
                                {location}
                            </Text>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Ionicons name="calendar-outline" size={16} color="#A0A0AB" />
                            <Text style={{ color: '#D1D1D6', fontSize: 13.5, fontFamily: fonts.regular }}>
                                {joinedLabel}
                            </Text>
                        </View>
                    </View>

                    {/* Link handle */}
                    <TouchableOpacity
                        onPress={() => openLink(instagramUrl(igHandle))}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="link-outline" size={16} color="#A0A0AB" />
                        <Text style={{ color: '#D1D1D6', fontSize: 13.5, fontFamily: fonts.regular }}>
                            {handleUrl}
                        </Text>
                    </TouchableOpacity>

                    {/* About Section */}
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontFamily: fonts.semibold, marginTop: 18 }}>
                        About
                    </Text>
                    <Text
                        style={{
                            color: '#9E9EA5',
                            fontSize: 13,
                            fontFamily: fonts.regular,
                            lineHeight: 19,
                            marginTop: 6,
                        }}
                    >
                        {bio}
                    </Text>
                </View>

                {/* Social links Section */}
                <View style={{ marginTop: 26 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 18, fontFamily: fonts.bold }}>
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
                                borderRadius: 20,
                                shadowColor: '#000000',
                                shadowOffset: { width: 0, height: 6 },
                                shadowOpacity: 0.1,
                                shadowRadius: 10,
                                elevation: 4,
                            }}
                        >
                            <LinearGradient
                                colors={['rgba(255, 255, 255, 0.70)', 'rgba(255, 255, 255, 0.04)', 'rgba(255, 255, 255, 0.55)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={{
                                    borderRadius: 20,
                                    padding: 0.8,
                                }}
                            >
                                <LinearGradient
                                    colors={['#1F1F26', '#121216']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 0, y: 1 }}
                                    style={{
                                        width: 122,
                                        height: 134,
                                        padding: 13,
                                        justifyContent: 'space-between',
                                        borderRadius: 19,
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Ionicons name="logo-instagram" size={26} color="#E1306C" />
                                        <Ionicons name="copy-outline" size={16} color="#8E8E93" />
                                    </View>
                                    <View>
                                        <Text style={{ color: '#FFFFFF', fontSize: 20, fontFamily: fonts.bold }}>
                                            30M
                                        </Text>
                                        <Text style={{ color: '#8E8E93', fontSize: 11, fontFamily: fonts.regular, marginTop: 2 }}>
                                            Followers
                                        </Text>
                                    </View>
                                </LinearGradient>
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* YouTube Card */}
                        <TouchableOpacity
                            onPress={() => ytHandle && openLink(youtubeUrl(ytHandle))}
                            activeOpacity={0.85}
                            style={{
                                borderRadius: 20,
                                shadowColor: '#000000',
                                shadowOffset: { width: 0, height: 6 },
                                shadowOpacity: 0.1,
                                shadowRadius: 10,
                                elevation: 4,
                            }}
                        >
                            <LinearGradient
                                colors={['rgba(255, 255, 255, 0.70)', 'rgba(255, 255, 255, 0.04)', 'rgba(255, 255, 255, 0.55)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={{
                                    borderRadius: 20,
                                    padding: 0.8,
                                }}
                            >
                                <LinearGradient
                                    colors={['#1F1F26', '#121216']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 0, y: 1 }}
                                    style={{
                                        width: 122,
                                        height: 134,
                                        padding: 13,
                                        justifyContent: 'space-between',
                                        borderRadius: 19,
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Ionicons name="logo-youtube" size={26} color="#FF0000" />
                                        <Ionicons name="add" size={20} color="#8E8E93" />
                                    </View>
                                    <View>
                                        <Text style={{ color: '#FFFFFF', fontSize: 15, fontFamily: fonts.medium }}>
                                            Youtube
                                        </Text>
                                        <Text style={{ color: '#8E8E93', fontSize: 11, fontFamily: fonts.regular, marginTop: 2 }}>
                                            {ytHandle ? `@${ytHandle}` : 'Add youtube link'}
                                        </Text>
                                    </View>
                                </LinearGradient>
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Twitter / X Card */}
                        <TouchableOpacity
                            onPress={() => twHandle && openLink(twitterUrl(twHandle))}
                            activeOpacity={0.85}
                            style={{
                                borderRadius: 20,
                                shadowColor: '#000000',
                                shadowOffset: { width: 0, height: 6 },
                                shadowOpacity: 0.1,
                                shadowRadius: 10,
                                elevation: 4,
                            }}
                        >
                            <LinearGradient
                                colors={['rgba(255, 255, 255, 0.70)', 'rgba(255, 255, 255, 0.04)', 'rgba(255, 255, 255, 0.55)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={{
                                    borderRadius: 20,
                                    padding: 0.8,
                                }}
                            >
                                <LinearGradient
                                    colors={['#1F1F26', '#121216']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 0, y: 1 }}
                                    style={{
                                        width: 122,
                                        height: 134,
                                        padding: 13,
                                        justifyContent: 'space-between',
                                        borderRadius: 19,
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <FontAwesome6 name="x-twitter" size={22} color="#FFFFFF" style={{ marginTop: 2 }} />
                                        <Ionicons name="add" size={20} color="#8E8E93" />
                                    </View>
                                    <View>
                                        <Text style={{ color: '#FFFFFF', fontSize: 15, fontFamily: fonts.medium }}>
                                            Twitter
                                        </Text>
                                        <Text style={{ color: '#8E8E93', fontSize: 11, fontFamily: fonts.regular, marginTop: 2 }}>
                                            {twHandle ? `@${twHandle}` : 'Add twitter link'}
                                        </Text>
                                    </View>
                                </LinearGradient>
                            </LinearGradient>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* Section Separator */}
                <View style={{ height: 1, backgroundColor: 'rgba(255, 255, 255, 0.06)', marginTop: 24, marginBottom: 4 }} />

                {/* Ad Preferences Section */}
                <View style={{ marginTop: 20 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 20, fontFamily: fonts.bold }}>
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
                                borderRadius: 20,
                                shadowColor: '#000000',
                                shadowOffset: { width: 0, height: 6 },
                                shadowOpacity: 0.1,
                                shadowRadius: 10,
                                elevation: 4,
                            }}
                        >
                            <LinearGradient
                                colors={['rgba(255, 255, 255, 0.70)', 'rgba(255, 255, 255, 0.04)', 'rgba(255, 255, 255, 0.55)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={{
                                    borderRadius: 20,
                                    padding: 0.8,
                                }}
                            >
                                <LinearGradient
                                    colors={['#1F1F26', '#121216']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 0, y: 1 }}
                                    style={{
                                        width: 122,
                                        height: 134,
                                        padding: 13,
                                        justifyContent: 'space-between',
                                        borderRadius: 19,
                                    }}
                                >
                                    <AdPrefIcon type="stripe" />
                                    <View>
                                        <Text style={{ color: '#FFFFFF', fontSize: 15, fontFamily: fonts.medium }}>
                                            Stripe Ad
                                        </Text>
                                        <Text style={{ color: '#8E8E93', fontSize: 11, fontFamily: fonts.regular, marginTop: 2 }}>
                                            ₹1000-5000
                                        </Text>
                                    </View>
                                </LinearGradient>
                            </LinearGradient>
                        </View>

                        {/* Photo Ad */}
                        <View
                            style={{
                                borderRadius: 20,
                                shadowColor: '#000000',
                                shadowOffset: { width: 0, height: 6 },
                                shadowOpacity: 0.1,
                                shadowRadius: 10,
                                elevation: 4,
                            }}
                        >
                            <LinearGradient
                                colors={['rgba(255, 255, 255, 0.70)', 'rgba(255, 255, 255, 0.04)', 'rgba(255, 255, 255, 0.55)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={{
                                    borderRadius: 20,
                                    padding: 0.8,
                                }}
                            >
                                <LinearGradient
                                    colors={['#1F1F26', '#121216']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 0, y: 1 }}
                                    style={{
                                        width: 122,
                                        height: 134,
                                        padding: 13,
                                        justifyContent: 'space-between',
                                        borderRadius: 19,
                                    }}
                                >
                                    <AdPrefIcon type="photo" />
                                    <View>
                                        <Text style={{ color: '#FFFFFF', fontSize: 15, fontFamily: fonts.medium }}>
                                            Photo Ad
                                        </Text>
                                        <Text style={{ color: '#8E8E93', fontSize: 11, fontFamily: fonts.regular, marginTop: 2 }}>
                                            ₹800-3000
                                        </Text>
                                    </View>
                                </LinearGradient>
                            </LinearGradient>
                        </View>

                        {/* Video Ad */}
                        <View
                            style={{
                                borderRadius: 20,
                                shadowColor: '#000000',
                                shadowOffset: { width: 0, height: 6 },
                                shadowOpacity: 0.1,
                                shadowRadius: 10,
                                elevation: 4,
                            }}
                        >
                            <LinearGradient
                                colors={['rgba(255, 255, 255, 0.70)', 'rgba(255, 255, 255, 0.04)', 'rgba(255, 255, 255, 0.55)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={{
                                    borderRadius: 20,
                                    padding: 0.8,
                                }}
                            >
                                <LinearGradient
                                    colors={['#1F1F26', '#121216']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 0, y: 1 }}
                                    style={{
                                        width: 122,
                                        height: 134,
                                        padding: 13,
                                        justifyContent: 'space-between',
                                        borderRadius: 19,
                                    }}
                                >
                                    <AdPrefIcon type="video" />
                                    <View>
                                        <Text style={{ color: '#FFFFFF', fontSize: 15, fontFamily: fonts.medium }}>
                                            Video Ad
                                        </Text>
                                        <Text style={{ color: '#8E8E93', fontSize: 11, fontFamily: fonts.regular, marginTop: 2 }}>
                                            ₹1200-4000
                                        </Text>
                                    </View>
                                </LinearGradient>
                            </LinearGradient>
                        </View>
                    </ScrollView>
                </View>

                {/* Section Separator */}
                <View style={{ height: 1, backgroundColor: 'rgba(255, 255, 255, 0.06)', marginTop: 24, marginBottom: 4 }} />

                {/* Content Type Section */}
                <View style={{ marginTop: 28 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 18, fontFamily: fonts.medium }}>
                        Content Type
                    </Text>
                    <View style={{ flexDirection: 'row', marginTop: 6    }}>
                        <View
                            style={{
                                backgroundColor: '#333435',
                                borderRadius: 14,
                                paddingHorizontal: 16,
                                paddingVertical: 10,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 8,
                                borderWidth: 1,
                                borderColor: 'rgba(255, 255, 255, 0.08)',
                            }}
                        >
                            <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                            <Text style={{ color: '#FFFFFF', fontSize: 14, fontFamily: fonts.medium }}>
                                {category}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Content Language Section */}
                <View style={{ marginTop: 24 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 18, fontFamily: fonts.medium }}>
                        Content Language
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <Ionicons name="language-outline" size={20} color="#FFFFFF" />
                        <Text style={{ color: '#FFFFFF', fontSize: 13, fontFamily: fonts.medium }}>
                            {languageText}
                        </Text>
                    </View>
                </View>

                {/* Profile Type Section */}
                <View style={{ marginTop: 24 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 18, fontFamily: fonts.medium }}>
                        Profile Type
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
                        <View
                            style={{
                                width: 22,
                                height: 22,
                                borderRadius: 5,
                                borderWidth: 1.5,
                                borderColor: '#FFFFFF',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Ionicons name="person" size={13} color="#FFFFFF" />
                        </View>
                        <Text style={{ color: '#FFFFFF', fontSize: 13, fontFamily: fonts.medium }}>
                            Individual Creator
                        </Text>
                    </View>
                </View>

                {/* Section Separator Line */}
                <View style={{ height: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)', marginTop: 24, marginBottom: 4 }} />

                {/* Similar Profiles Section */}
                <View style={{ marginTop: 20 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 18, fontFamily: fonts.regular }}>
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
                                    borderRadius: 16,
                                    overflow: 'hidden',
                                    borderWidth: 1,
                                    borderColor: '#2C313A',
                                    shadowColor: '#808080',
                                    shadowOffset: { width: -62, height: 62 },
                                    shadowOpacity: 0.01,
                                    shadowRadius: 25,
                                    elevation: 2,
                                }}
                            >
                                <LinearGradient
                                    colors={['#0E0C0C', '#2B2B2C']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 0, y: 1 }}
                                    style={{
                                        height: 84,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingHorizontal: 14,
                                        justifyContent: 'space-between',
                                        borderRadius: 15,
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                                        <Image
                                            source={{ uri: item.avatar }}
                                            style={{ width: 56, height: 56, borderRadius: 28 }}
                                        />
                                        <View>
                                            <Text style={{ color: '#FFFFFF', fontSize: 18, fontFamily: fonts.medium }}>
                                                {item.name}
                                            </Text>
                                            <Text style={{ color: '#8E8E93', fontSize: 12, fontFamily: fonts.regular, marginTop: 2 }}>
                                                {item.category}
                                            </Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                                <Ionicons name="logo-instagram" size={13} color="#8E8E93" />
                                                <Text style={{ color: '#8E8E93', fontSize: 14, fontFamily: fonts.regular }}>
                                                    {item.followers}
                                                </Text>
                                            </View> 
                                        </View>
                                    </View>

                                    <Ionicons name="arrow-up-outline" size={18} color="#FFFFFF" style={{ transform: [{ rotate: '45deg' }] }} />
                                </LinearGradient>
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
                        borderRadius: 27,
                        overflow: 'hidden',
                        shadowColor: '#7C3AED',
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.5,
                        shadowRadius: 16,
                        elevation: 10,
                    }}
                    activeOpacity={0.85}
                >
                    <LinearGradient
                        colors={
                            isAddedToList
                                ? ['#262631', '#1C1C24']
                                : ['#0084FF', '#7C3AED']
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{
                            flex: 1,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 27,
                        }}
                    >
                        <Text style={{ color: '#FFFFFF', fontSize: 16, fontFamily: fonts.bold }}>
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
