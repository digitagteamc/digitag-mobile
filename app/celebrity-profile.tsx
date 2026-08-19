import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    Image,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette, fonts } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const imgDefaultAvatar = require('../assets/defaultavatar.png');

// ── Static extended data keyed by celebrity name ──────────────────────────────
interface CelebData {
    bio: string;
    about: string;
    born: string;
    nationality: string;
    website: string;
    instagram: string;
    location: string;
    youtubeFollowers: string;
    instagramFollowers: string;
    facebookFollowers: string;
    following: number;
    posts: number;
    bannerGradient: [string, string, ...string[]];
}

const CELEB_DATA: Record<string, CelebData> = {
    'Meera Iyer': {
        bio: 'Actor by profession, dreamer by heart. Living to entertain & inspire.',
        about: 'Known for versatile roles in film and web series. Passionate about storytelling and connecting with people through art.',
        born: '15 March 1992',
        nationality: 'Indian',
        website: 'meeraiyer.com',
        instagram: '@meera_iyer',
        location: 'Mumbai, India',
        youtubeFollowers: '7.2M',
        instagramFollowers: '5.1M',
        facebookFollowers: '3.4M',
        following: 236,
        posts: 128,
        bannerGradient: ['#1a0533', '#6b0f9e', '#3d1080', '#0d1b6e'],
    },
    'Aryan Kapoor': {
        bio: 'Singer & performer. Music is my language, the stage is my home.',
        about: 'Acclaimed playback and independent singer with multiple chart-topping albums. Known for his soulful voice and live performance energy.',
        born: '3 July 1995',
        nationality: 'Indian',
        website: 'aryankapoor.com',
        instagram: '@aryan_kapoor',
        location: 'Mumbai, India',
        youtubeFollowers: '6.8M',
        instagramFollowers: '4.3M',
        facebookFollowers: '2.8M',
        following: 312,
        posts: 204,
        bannerGradient: ['#0d1b6e', '#1e40af', '#1d4ed8', '#0c4a6e'],
    },
    'Simran Kaur': {
        bio: 'Comedian & writer. Turning life\'s chaos into laughter since day one.',
        about: 'Stand-up comedian and content creator with a unique perspective on everyday life. Known for relatable humor and sharp wit.',
        born: '22 November 1993',
        nationality: 'Indian',
        website: 'simrankaur.in',
        instagram: '@simran_kaur',
        location: 'Delhi, India',
        youtubeFollowers: '9.5M',
        instagramFollowers: '6.8M',
        facebookFollowers: '4.1M',
        following: 189,
        posts: 356,
        bannerGradient: ['#450a0a', '#991b1b', '#b45309', '#78350f'],
    },
    'Vikram Rao': {
        bio: 'Dancer & choreographer. Every step tells a story.',
        about: 'Award-winning dancer and choreographer specialising in classical fusion and contemporary styles. Performed on global stages.',
        born: '8 August 1990',
        nationality: 'Indian',
        website: 'vikramrao.dance',
        instagram: '@vikram_rao',
        location: 'Bangalore, India',
        youtubeFollowers: '4.1M',
        instagramFollowers: '3.2M',
        facebookFollowers: '1.9M',
        following: 421,
        posts: 97,
        bannerGradient: ['#064e3b', '#065f46', '#047857', '#0d9488'],
    },
    'Aditya Malhotra': {
        bio: 'Sports star & fitness icon. Pushing limits every single day.',
        about: 'Professional athlete and fitness influencer. Multiple national championship titles and brand ambassador for leading sports brands.',
        born: '14 February 1988',
        nationality: 'Indian',
        website: 'adityamalhotra.fit',
        instagram: '@aditya_malhotra',
        location: 'Hyderabad, India',
        youtubeFollowers: '12.3M',
        instagramFollowers: '9.7M',
        facebookFollowers: '6.2M',
        following: 156,
        posts: 512,
        bannerGradient: ['#1c1917', '#292524', '#44403c', '#1c1917'],
    },
    'Kavya Menon': {
        bio: 'Influencer & lifestyle creator. Curating beauty, fashion & travel.',
        about: 'Top lifestyle influencer collaborating with luxury brands. Her aesthetic-driven content reaches millions across platforms.',
        born: '29 April 1997',
        nationality: 'Indian',
        website: 'kavyamenon.com',
        instagram: '@kavya_menon',
        location: 'Chennai, India',
        youtubeFollowers: '3.6M',
        instagramFollowers: '2.8M',
        facebookFollowers: '1.5M',
        following: 678,
        posts: 289,
        bannerGradient: ['#500724', '#9d174d', '#be185d', '#831843'],
    },
};

function formatCount(n?: number | null | string): string {
    if (n == null) return '0';
    if (typeof n === 'string') return n;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

type Tab = 'Posts' | 'Collabs' | 'About';

// Dummy post thumbnails — three images
const DUMMY_POSTS = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
];

export default function CelebrityProfile() {
    const router = useRouter();
    const {
        name,
        role,
        followerCount,
        photoUrl,
        isVerified,
    } = useLocalSearchParams<{
        name?: string;
        role?: string;
        followerCount?: string;
        photoUrl?: string;
        isVerified?: string;
    }>();

    const [activeTab, setActiveTab] = useState<Tab>('Posts');
    const [isFollowing, setIsFollowing] = useState(false);

    const displayName = name || 'Celebrity';
    const data: CelebData = CELEB_DATA[displayName] ?? {
        bio: 'Inspiring millions through passion and dedication.',
        about: 'A celebrated public figure known for outstanding contributions to their field.',
        born: 'N/A',
        nationality: 'Indian',
        website: `${displayName.toLowerCase().replace(/\s/g, '')}.com`,
        instagram: `@${displayName.toLowerCase().replace(/\s/g, '_')}`,
        location: 'India',
        youtubeFollowers: '1M',
        instagramFollowers: '500K',
        facebookFollowers: '300K',
        following: 100,
        posts: 50,
        bannerGradient: ['#1a0533', '#6b0f9e', '#3d1080', '#0d1b6e'],
    };

    const verified = isVerified !== 'false';
    const followers = followerCount ? Number(followerCount) : 0;
    const avatarSource = photoUrl ? { uri: photoUrl } : imgDefaultAvatar;
    const thumbnailSize = (SCREEN_WIDTH - 40) / 3;

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* ── Header Block ── */}
                <View style={styles.headerBlock}>
                    {/* Banner gradient background */}
                    <LinearGradient
                        colors={data.bannerGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFillObject}
                    />

                    {/* Decorative glowing orbs */}
                    <View style={[styles.orb, { top: 20, right: 20, width: 160, height: 160, backgroundColor: 'rgba(138,43,226,0.25)' }]} />
                    <View style={[styles.orb, { top: 110, right: 90, width: 100, height: 100, backgroundColor: 'rgba(30,64,175,0.25)' }]} />

                    {/* Celebrity hero image — right-aligned like the design */}
                    <Image
                        source={avatarSource}
                        style={styles.heroCelebrityImage}
                        resizeMode="cover"
                    />

                    {/* Dark fade at bottom */}
                    <LinearGradient
                        colors={['transparent', 'rgba(10,10,16,0.98)']}
                        style={styles.bannerOverlay}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                    />

                    {/* Back button */}
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => router.back()}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="chevron-back" size={20} color="#fff" />
                    </TouchableOpacity>

                    {/* More button */}
                    <TouchableOpacity style={styles.moreBtn} activeOpacity={0.8}>
                        <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* ── Profile Info Row ── */}
                <View style={styles.profileRow}>
                    {/* Avatar with blue ring + green verified dot */}
                    <View style={styles.avatarWrapper}>
                        <View style={styles.avatarRing}>
                            <Image
                                source={avatarSource}
                                style={styles.avatarImage}
                                resizeMode="cover"
                            />
                        </View>
                        {verified && (
                            <View style={styles.greenVerifiedDot}>
                                <Ionicons name="checkmark-sharp" size={9} color="#000" />
                            </View>
                        )}
                    </View>

                    {/* Name / role / location */}
                    <View style={styles.nameBlock}>
                        <View style={styles.nameRow}>
                            <Text style={styles.nameText} numberOfLines={1}>{displayName}</Text>
                            {verified && (
                                <Ionicons name="checkmark-circle" size={16} color="#1D9BF0" />
                            )}
                        </View>
                        {!!role && (
                            <View style={styles.roleChip}>
                                <Text style={styles.roleChipText}>{role}</Text>
                            </View>
                        )}
                        <View style={styles.locationRow}>
                            <Ionicons name="location-outline" size={12} color="#94A3B8" />
                            <Text style={styles.locationText}>{data.location}</Text>
                        </View>
                    </View>

                    {/* Follow / Following toggle */}
                    <TouchableOpacity
                        style={[styles.followBtn, isFollowing && styles.followBtnFollowing]}
                        activeOpacity={0.85}
                        onPress={() => setIsFollowing(f => !f)}
                    >
                        <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextFollowing]}>
                            {isFollowing ? 'Following' : 'Follow'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Short bio */}
                <Text style={styles.bio}>{data.bio}</Text>

                {/* ── Stats Row ── */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{formatCount(followers)}</Text>
                        <Text style={styles.statLabel}>Followers</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{data.following}</Text>
                        <Text style={styles.statLabel}>Following</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{data.posts}</Text>
                        <Text style={styles.statLabel}>Posts</Text>
                    </View>
                </View>

                {/* ── About Panel ── */}
                <View style={styles.aboutPanel}>
                    <View style={styles.aboutHeader}>
                        <Ionicons name="information-circle-outline" size={18} color="#fff" />
                        <Text style={styles.aboutTitle}>About</Text>
                    </View>
                    <Text style={styles.aboutBodyText}>{data.about}</Text>
                    <View style={styles.divider} />

                    <InfoRow icon="🎂" label="Born" value={data.born} />
                    <InfoRow icon="🌟" label="Nationality" value={data.nationality} />
                    <InfoRow
                        icon="🔗"
                        label="Website"
                        value={data.website}
                        onPress={() => Linking.openURL(`https://${data.website}`).catch(() => {})}
                    />
                    <InfoRow
                        icon="📷"
                        label="Instagram"
                        value={data.instagram}
                        onPress={() => Linking.openURL(`https://instagram.com/${data.instagram.replace('@', '')}`).catch(() => {})}
                    />
                </View>

                {/* ── Top Channels ── */}
                <View style={styles.channelsSection}>
                    <View style={styles.channelsHeader}>
                        <Text style={styles.channelsSectionTitle}>Top Channels</Text>
                        <TouchableOpacity activeOpacity={0.7}>
                            <Text style={styles.viewAllText}>View all</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.channelsRow}>
                        <ChannelItem
                            icon={<Ionicons name="logo-youtube" size={18} color="#FF0000" />}
                            bgColor="rgba(255,0,0,0.12)"
                            name="YouTube"
                            count={data.youtubeFollowers}
                        />
                        <ChannelItem
                            icon={<Ionicons name="logo-instagram" size={18} color="#E1306C" />}
                            bgColor="rgba(225,48,108,0.12)"
                            name="Instagram"
                            count={data.instagramFollowers}
                        />
                        <ChannelItem
                            icon={<Ionicons name="logo-facebook" size={18} color="#1877F2" />}
                            bgColor="rgba(24,119,242,0.12)"
                            name="Facebook"
                            count={data.facebookFollowers}
                        />
                    </View>
                </View>

                {/* ── Posts / Collabs / About Tabs ── */}
                <View style={styles.tabsContainer}>
                    <View style={styles.tabBar}>
                        {(['Posts', 'Collabs', 'About'] as Tab[]).map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                style={styles.tabItem}
                                onPress={() => setActiveTab(tab)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                                    {tab}
                                </Text>
                                {activeTab === tab && <View style={styles.tabUnderline} />}
                            </TouchableOpacity>
                        ))}
                    </View>

                    {activeTab === 'Posts' && (
                        <View style={styles.postsGrid}>
                            {DUMMY_POSTS.map((uri, i) => (
                                <TouchableOpacity key={i} activeOpacity={0.85} style={{ position: 'relative' }}>
                                    <Image
                                        source={{ uri }}
                                        style={{ width: thumbnailSize, height: thumbnailSize * 1.25, borderRadius: 10, backgroundColor: palette.surfaceAlt }}
                                        resizeMode="cover"
                                    />
                                    <View style={styles.postThumbOverlay}>
                                        <Ionicons name="bookmark-outline" size={13} color="#fff" />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {activeTab === 'Collabs' && (
                        <View style={styles.emptyTab}>
                            <Ionicons name="people-outline" size={38} color="#2a2a3a" />
                            <Text style={styles.emptyTabText}>No collaborations yet</Text>
                        </View>
                    )}

                    {activeTab === 'About' && (
                        <View style={{ paddingTop: 14 }}>
                            <Text style={styles.aboutBodyText}>{data.about}</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* ── Bottom Action Bar (fixed) ── */}
            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.messageBtn} activeOpacity={0.85}>
                    <Ionicons name="send-outline" size={16} color="#fff" />
                    <Text style={styles.messageBtnText}>Message</Text>
                </TouchableOpacity>

                <LinearGradient
                    colors={['#3B82F6', '#6C47FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.collabGradient}
                >
                    <TouchableOpacity style={styles.collabBtn} activeOpacity={0.85}>
                        <Ionicons name="people-outline" size={16} color="#fff" />
                        <Text style={styles.collabBtnText}>Collaborate</Text>
                    </TouchableOpacity>
                </LinearGradient>
            </View>
        </SafeAreaView>
    );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function InfoRow({
    icon,
    label,
    value,
    onPress,
}: {
    icon: string;
    label: string;
    value: string;
    onPress?: () => void;
}) {
    return (
        <TouchableOpacity
            style={styles.infoRow}
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
            disabled={!onPress}
        >
            <View style={styles.infoRowLeft}>
                <Text style={styles.infoRowIcon}>{icon}</Text>
                <Text style={styles.infoRowLabel}>{label}</Text>
            </View>
            <View style={styles.infoRowRight}>
                <Text style={[styles.infoRowValue, !!onPress && { color: '#60A5FA' }]}>{value}</Text>
                <Text style={styles.infoRowChevron}>›</Text>
            </View>
        </TouchableOpacity>
    );
}

function ChannelItem({
    icon,
    bgColor,
    name,
    count,
}: {
    icon: React.ReactNode;
    bgColor: string;
    name: string;
    count: string;
}) {
    return (
        <View style={styles.channelItem}>
            <View style={[styles.channelIconBg, { backgroundColor: bgColor }]}>
                {icon}
            </View>
            <View style={styles.channelInfo}>
                <View style={styles.channelNameRow}>
                    <Text style={styles.channelName}>{name}</Text>
                    <View style={styles.channelVerifiedDot} />
                </View>
                <Text style={styles.channelCount}>{count}</Text>
            </View>
        </View>
    );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: palette.background,
    },

    // Header
    headerBlock: {
        width: '100%',
        height: 290,
        position: 'relative',
        overflow: 'hidden',
    },
    orb: {
        position: 'absolute',
        borderRadius: 999,
    },
    heroCelebrityImage: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: SCREEN_WIDTH * 0.7,
        height: 290,
    },
    bannerOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 110,
    },
    backBtn: {
        position: 'absolute',
        top: 16,
        left: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.38)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    moreBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.38)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Profile row
    profileRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 16,
        marginTop: -28,
        gap: 10,
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatarRing: {
        width: 78,
        height: 78,
        borderRadius: 39,
        borderWidth: 2.5,
        borderColor: '#1D9BF0',
        backgroundColor: palette.surfaceAlt,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 39,
    },
    greenVerifiedDot: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#84CC16',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: palette.background,
    },
    nameBlock: {
        flex: 1,
        paddingTop: 30,
        gap: 4,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    nameText: {
        color: '#fff',
        fontSize: 15,
        fontFamily: fonts.semibold,
        letterSpacing: -0.3,
    },
    roleChip: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(30,58,138,0.5)',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 3,
    },
    roleChipText: {
        color: '#38BDF8',
        fontSize: 11,
        fontFamily: fonts.medium,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    locationText: {
        color: '#94A3B8',
        fontSize: 11,
        fontFamily: fonts.regular,
    },
    followBtn: {
        marginTop: 34,
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#3B82F6',
        alignSelf: 'flex-start',
    },
    followBtnFollowing: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: '#3B82F6',
    },
    followBtnText: {
        color: '#fff',
        fontSize: 13,
        fontFamily: fonts.semibold,
    },
    followBtnTextFollowing: {
        color: '#3B82F6',
    },

    // Bio
    bio: {
        color: '#CBD5E1',
        fontSize: 13,
        fontFamily: fonts.regular,
        lineHeight: 20,
        marginHorizontal: 16,
        marginTop: 14,
    },

    // Stats
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 18,
        paddingVertical: 14,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        color: '#fff',
        fontSize: 20,
        fontFamily: fonts.bold,
        letterSpacing: -0.5,
    },
    statLabel: {
        color: '#94A3B8',
        fontSize: 11,
        fontFamily: fonts.regular,
        marginTop: 2,
    },
    statDivider: {
        width: StyleSheet.hairlineWidth,
        height: 34,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },

    // About panel
    aboutPanel: {
        marginHorizontal: 16,
        marginTop: 18,
        backgroundColor: '#0F1626',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(59,130,246,0.2)',
        padding: 16,
    },
    aboutHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    aboutTitle: {
        color: '#fff',
        fontSize: 15,
        fontFamily: fonts.semibold,
    },
    aboutBodyText: {
        color: '#94A3B8',
        fontSize: 13,
        fontFamily: fonts.regular,
        lineHeight: 20,
        marginTop: 10,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: 'rgba(255,255,255,0.08)',
        marginVertical: 14,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    infoRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoRowIcon: {
        fontSize: 14,
    },
    infoRowLabel: {
        color: '#94A3B8',
        fontSize: 13,
        fontFamily: fonts.regular,
    },
    infoRowRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    infoRowValue: {
        color: '#CBD5E1',
        fontSize: 13,
        fontFamily: fonts.regular,
    },
    infoRowChevron: {
        color: '#475569',
        fontSize: 16,
    },

    // Top Channels
    channelsSection: {
        marginHorizontal: 16,
        marginTop: 22,
    },
    channelsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    channelsSectionTitle: {
        color: '#fff',
        fontSize: 16,
        fontFamily: fonts.semibold,
    },
    viewAllText: {
        color: '#3B82F6',
        fontSize: 13,
        fontFamily: fonts.medium,
    },
    channelsRow: {
        flexDirection: 'row',
        gap: 8,
        backgroundColor: '#0F1626',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(59,130,246,0.15)',
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    channelItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    channelIconBg: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
    },
    channelInfo: {
        flex: 1,
    },
    channelNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    channelName: {
        color: '#fff',
        fontSize: 11,
        fontFamily: fonts.semibold,
    },
    channelVerifiedDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#3B82F6',
    },
    channelCount: {
        color: '#94A3B8',
        fontSize: 11,
        fontFamily: fonts.regular,
        marginTop: 1,
    },

    // Tabs
    tabsContainer: {
        marginTop: 22,
        paddingHorizontal: 16,
    },
    tabBar: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.08)',
        marginBottom: 12,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        paddingBottom: 10,
        position: 'relative',
    },
    tabText: {
        color: '#64748B',
        fontSize: 14,
        fontFamily: fonts.medium,
    },
    tabTextActive: {
        color: '#fff',
    },
    tabUnderline: {
        position: 'absolute',
        bottom: 0,
        left: '20%',
        right: '20%',
        height: 2,
        borderRadius: 1,
        backgroundColor: '#3B82F6',
    },
    postsGrid: {
        flexDirection: 'row',
        gap: 4,
    },
    postThumbOverlay: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyTab: {
        alignItems: 'center',
        paddingVertical: 40,
        gap: 10,
    },
    emptyTabText: {
        color: '#475569',
        fontSize: 14,
        fontFamily: fonts.regular,
    },

    // Bottom bar
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: Platform.OS === 'ios' ? 28 : 16,
        paddingTop: 12,
        backgroundColor: 'rgba(10,10,16,0.97)',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(255,255,255,0.08)',
        gap: 12,
    },
    messageBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 40,
        backgroundColor: '#1C1C24',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    messageBtnText: {
        color: '#fff',
        fontSize: 14,
        fontFamily: fonts.semibold,
    },
    collabGradient: {
        flex: 1.2,
        borderRadius: 40,
        overflow: 'hidden',
    },
    collabBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
    },
    collabBtnText: {
        color: '#fff',
        fontSize: 14,
        fontFamily: fonts.semibold,
    },
});
