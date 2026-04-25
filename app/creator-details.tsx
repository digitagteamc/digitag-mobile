import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import {
    followUser,
    getFollowStatus,
    getPostById,
    getUserById,
    getUserStats,
    openConversationWith,
    unfollowUser,
} from '../services/userService';
import { fonts } from '../theme/colors';
import { useRoleTheme } from '../theme/useRoleTheme';
import CustomAlert from '../Components/ui/CustomAlert';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function getInitials(name: string | null | undefined) {
    if (!name) return 'U';
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase();
}

export default function CreatorDetails() {
    const router = useRouter();
    const { token, userId: myId, isProfileCompleted } = useAuth();
    const { id: paramId, userId: paramUserId, postId: paramPostId } = useLocalSearchParams<{ id?: string; userId?: string; postId?: string }>();
    const [resolvedUserId, setResolvedUserId] = useState<string | null>(paramUserId || paramId || null);

    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [followBusy, setFollowBusy] = useState(false);
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
        if (!token) { setLoading(false); return; }
        try {
            let uid = resolvedUserId;

            // Resolve UID from postId if needed
            if (!uid && paramPostId) {
                const postRes = await getPostById(paramPostId, token);
                if (postRes.success && postRes.data) {
                    uid = postRes.data.owner?.id || postRes.data.userId || null;
                }
            }

            if (!uid) { setLoading(false); return; }
            setResolvedUserId(uid);

            const [userRes, followRes, statsRes] = await Promise.all([
                getUserById(uid, token),
                getFollowStatus(token, uid),
                getUserStats(token, uid),
            ]);
            if (userRes.success) setProfile(userRes.data || null);
            if (followRes.success) setIsFollowing(Boolean(followRes.data?.isFollowing));
            if (statsRes.success) setStats(statsRes.data || null);
        } finally {
            setLoading(false);
        }
    }, [token, resolvedUserId, paramPostId]);

    useEffect(() => { load(); }, [load]);

    const handleFollow = async () => {
        if (!token || !resolvedUserId || followBusy) return;
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

    const openChat = async () => {
        if (!token || !resolvedUserId) return;
        const res = await openConversationWith(token, resolvedUserId);
        if (res.success && res.data?.id) {
            router.push({ pathname: '/chat/[id]', params: { id: res.data.id } } as any);
        } else {
            showAlert('Chat Error', res.error || 'Could not open conversation.');
        }
    };

    const handleCall = () => {
        const phone = profile?.mobileNumber || profile?.phone || profile?.freelancerProfile?.phone || profile?.creatorProfile?.phone;
        if (!phone) {
            showAlert('Contact Error', 'This user has not shared their mobile number.');
            return;
        }
        Linking.openURL(`tel:${phone}`);
    };

    if (loading) {
        return (
            <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color="#F26930" />
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
    const accentColor = isFreelancerProfile ? '#FF832A' : '#F15DAB';
    const headerGradient = isFreelancerProfile
        ? ['rgba(255, 87, 0, 0.4)', 'rgba(0, 0, 0, 0)']
        : ['rgba(241, 93, 171, 0.4)', 'rgba(0, 0, 0, 0)'];

    const p = profile.freelancerProfile || profile.creatorProfile || {};
    const name = p.name || (isFreelancerProfile ? 'Freelancer' : 'Creator');
    const category = profile.category?.name || (isFreelancerProfile ? 'Photography' : 'Beauty');
    const bio = p.bio || (isFreelancerProfile
        ? 'Fashion & lifestyle content creator with a passion for sustainable fashion. I create engaging content for brands that align with my values.'
        : 'Creates engaging beauty content like makeup tutorials, skincare tips, and product reviews.');
    const location = p.location || 'Banglore, India';
    const joinedLabel = profile.createdAt
        ? `Joined ${new Date(profile.createdAt).toLocaleString('en-US', { month: 'long', year: 'numeric' })}`
        : (isFreelancerProfile ? 'Joined March 2021' : 'Joined March 2020');
    const instagram = p.instagramHandle ? `instagram.com/${p.instagramHandle}` : 'instagram.com/priyasharma';

    const specializations = isFreelancerProfile
        ? [
            { label: 'Portrait Photography', bg: 'rgba(74, 1, 48, 0.5)', border: '#4A0130', text: '#FF7CC3' },
            { label: 'Event Photography', bg: 'rgba(11, 2, 60, 0.5)', border: '#0B023C', text: '#7C8CFF' },
            { label: 'Product Photography', bg: 'rgba(57, 45, 1, 0.5)', border: '#392D01', text: '#FFE07C' },
            { label: 'Fashion Photography', bg: 'rgba(1, 47, 47, 0.5)', border: '#012F2F', text: '#7CFFD6' },
            { label: 'Nature & Landscape Photography', bg: 'rgba(55, 30, 0, 0.5)', border: '#371E00', text: '#FFB87C' },
        ]
        : [
            { label: 'Makeup Tutorials', bg: 'rgba(74, 1, 48, 0.5)', border: '#4A0130', text: '#FF7CC3' },
            { label: 'Product Reviews', bg: 'rgba(11, 2, 60, 0.5)', border: '#0B023C', text: '#7C8CFF' },
            { label: 'Hair Styling', bg: 'rgba(57, 45, 1, 0.5)', border: '#392D01', text: '#FFE07C' },
            { label: 'Organic / Skincare Focus', bg: 'rgba(1, 47, 47, 0.5)', border: '#012F2F', text: '#7CFFD6' },
            { label: 'Transformation Videos', bg: 'rgba(55, 30, 0, 0.5)', border: '#371E00', text: '#FFB87C' },
        ];

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
                        <TouchableOpacity onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.topBarRight}>
                            <TouchableOpacity style={styles.topIconBtn} onPress={handleCall}>
                                <Ionicons name="call-outline" size={24} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.topIconBtn}>
                                <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    {/* Profile Card */}
                    <View style={styles.profileCard}>
                        <View style={styles.cardHeader}>
                            {p.profilePicture ? (
                                <Image source={{ uri: p.profilePicture }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatar, styles.initialsAvatar, { borderColor: accentColor + '4D' }]}>
                                    <Text style={[styles.initialsText, { color: accentColor }]}>{getInitials(name)}</Text>
                                </View>
                            )}
                            <View style={styles.headerButtons}>
                                <TouchableOpacity style={[styles.messageBtn, { backgroundColor: accentColor }]} onPress={openChat}>
                                    <Ionicons name="paper-plane-outline" size={12} color="#fff" />
                                    <Text style={styles.messageBtnText}>Message</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.followBtn, { borderColor: accentColor }, isFollowing && { backgroundColor: accentColor + '33' }]}
                                    onPress={handleFollow}
                                >
                                    <Ionicons name={isFollowing ? "checkmark" : "add"} size={14} color={accentColor} />
                                    <Text style={[styles.followBtnText, { color: accentColor }]}>{isFollowing ? 'Following' : 'Follow'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.nameRow}>
                            <Text style={styles.name}>{name}</Text>
                            <MaterialIcons name="verified" size={16} color={accentColor} style={{ marginLeft: 4 }} />
                        </View>
                        <Text style={styles.category}>{category}</Text>

                        <View style={styles.infoGrid}>
                            <View style={styles.infoItem}>
                                <Ionicons name="location-outline" size={24} color="#A0A0A0" />
                                <Text style={styles.infoText}>{location}</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Ionicons name="calendar-outline" size={18} color="#A0A0A0" />
                                <Text style={styles.infoText}>{joinedLabel}</Text>
                            </View>
                        </View>

                        <View style={styles.linkRow}>
                            <Ionicons name="link-outline" size={18} color="#8A8AFF" />
                            <Text style={styles.linkText}>{instagram}</Text>
                        </View>

                        <View style={styles.aboutSection}>
                            <Text style={styles.aboutTitle}>About</Text>
                            <Text style={styles.aboutBio}>{bio}</Text>
                        </View>
                    </View>

                    {/* Stats Card */}
                    <View style={styles.statsCard}>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Followers</Text>
                            <Text style={styles.statValue}>{stats?.followerCount || '85K'}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Following</Text>
                            <Text style={styles.statValue}>{stats?.followingCount || '15K'}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Rating</Text>
                            <Text style={styles.statValue}>4.9</Text>
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
    scrollContent: {
        paddingTop: 0,
        paddingBottom: 40,
    },
    profileCard: {
        width: Math.min(408, SCREEN_WIDTH - 40),
        height: 370,
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
        alignItems: 'center',
        gap: 20,
        marginBottom: 10,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    infoText: {
        color: '#E0E0E0',
        fontSize: 13,
        fontFamily: fonts.regular,
        letterSpacing: -0.5,
    },
    linkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 16,
    },
    linkText: {
        color: '#E0E0E0',
        fontSize: 13,
        fontFamily: fonts.regular,
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
