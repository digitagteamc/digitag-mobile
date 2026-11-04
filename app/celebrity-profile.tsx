import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Image,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, fonts } from '../theme/colors';

const imgDefaultAvatar = require('../assets/defaultavatar.png');

const BANNER_GRADIENT: [string, string, ...string[]] = ['#1a0533', '#6b0f9e', '#3d1080', '#0d1b6e'];

// Ad types from celebrity onboarding (BRAND_OPTIONS in the website's BrandStep).
const AD_TYPES: Record<string, { title: string; text: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
    'l-bands': { title: 'L-Bands', text: 'L-shaped screen frames that wrap content with brand messaging.', icon: 'tablet-landscape-outline', color: '#F97316' },
    'full-screen-ad': { title: 'Full Screen Ad', text: 'Immersive full-frame brand takeovers between or within content.', icon: 'scan-outline', color: '#F97316' },
    'streak-ad': { title: 'Streak Ad', text: 'Slim banner strips pinned to the top or bottom of the screen.', icon: 'remove-outline', color: '#F97316' },
    'product-showcases': { title: 'Product Showcases & Feature Integrations', text: 'Seamless, organic placement of brand products within content.', icon: 'bag-handle-outline', color: '#EC4899' },
    'community-mentions': { title: 'Community Direct Mentions', text: 'Smart link placements, stickers, pinned comments, and profile/post tags.', icon: 'chatbubble-ellipses-outline', color: '#34D399' },
    'collaborative-releases': { title: 'Collaborative Releases', text: 'Co-authored Instagram posts, dedicated Reels, Shorts, and long-form video segments.', icon: 'people-outline', color: '#A78BFA' },
    'brand-endorsements': { title: 'Creator Brand Endorsements', text: 'On-camera recommendations and authentic brand reviews.', icon: 'star-outline', color: '#EC4899' },
};

function formatCount(n?: number | null | string): string {
    if (n == null) return '0';
    if (typeof n === 'string') return n;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

function parseList<T>(raw?: string): T[] {
    try {
        const list = JSON.parse(raw || '[]');
        return Array.isArray(list) ? list : [];
    } catch {
        return [];
    }
}

type Tab = 'Posts' | 'Collabs';

export default function CelebrityProfile() {
    const router = useRouter();
    const {
        name,
        role,
        followerCount,
        photoUrl,
        isVerified,
        instagramHandle,
        instagramFollowers,
        youtubeUrl,
        youtubeSubscribers,
        instagramAccounts,
        youtubeChannels,
        brandIntegrations,
    } = useLocalSearchParams<{
        name?: string;
        role?: string;
        followerCount?: string;
        photoUrl?: string;
        isVerified?: string;
        instagramHandle?: string;
        instagramFollowers?: string;
        youtubeUrl?: string;
        youtubeSubscribers?: string;
        instagramAccounts?: string;
        youtubeChannels?: string;
        brandIntegrations?: string;
    }>();

    const insets = useSafeAreaInsets();

    const [activeTab, setActiveTab] = useState<Tab>('Posts');
    const [isFollowing, setIsFollowing] = useState(false);

    const displayName = name || 'Celebrity';

    const verified = isVerified !== 'false';
    const followers = followerCount ? Number(followerCount) : 0;
    const avatarSource = photoUrl ? { uri: photoUrl } : imgDefaultAvatar;
    // Celebrities approved before these lists existed only have the single
    // handle/URL fields, so fall back to those.
    const parsedInstagram = parseList<{ handle: string; followers?: string }>(instagramAccounts);
    const parsedYoutube = parseList<{ name?: string; url: string; subscribers?: string }>(youtubeChannels);
    const instagramList = parsedInstagram.length
        ? parsedInstagram
        : instagramHandle ? [{ handle: instagramHandle, followers: formatCount(Number(instagramFollowers)) }] : [];
    const youtubeList = parsedYoutube.length
        ? parsedYoutube
        : youtubeUrl ? [{ name: 'YouTube', url: youtubeUrl, subscribers: formatCount(Number(youtubeSubscribers)) }] : [];
    const adTypes = parseList<string>(brandIntegrations);
    const hasChannels = instagramList.length > 0 || youtubeList.length > 0;

    const openInstagram = (handle: string) =>
        Linking.openURL(`https://instagram.com/${handle.replace(/^@/, '')}`).catch(() => {});
    const openYoutube = (url: string) =>
        Linking.openURL(/^https?:\/\//i.test(url) ? url : `https://${url}`).catch(() => {});

    return (
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* ── Header Block ── */}
                <View style={styles.headerBlock}>
                    {/* Banner gradient background */}
                    <LinearGradient
                        colors={BANNER_GRADIENT}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFillObject}
                    />

                    {/* Decorative glowing orbs */}
                    <View style={[styles.orb, { top: 20, right: 20, width: 160, height: 160, backgroundColor: 'rgba(138,43,226,0.25)' }]} />
                    <View style={[styles.orb, { top: 110, right: 90, width: 100, height: 100, backgroundColor: 'rgba(30,64,175,0.25)' }]} />

                    {/* Celebrity hero image — full width like the design */}
                    {!!photoUrl && (
                        <Image
                            source={avatarSource}
                            style={styles.heroCelebrityImage}
                            resizeMode="cover"
                        />
                    )}

                    {/* Dark fade at bottom */}
                    <LinearGradient
                        colors={['transparent', 'rgba(10,10,16,0.98)']}
                        style={styles.bannerOverlay}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                    />

                    {/* Back button */}
                    <TouchableOpacity
                        style={[styles.backBtn, { top: insets.top + 8 }]}
                        onPress={() => router.back()}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="chevron-back" size={20} color="#fff" />
                    </TouchableOpacity>

                    {/* More button */}
                    <TouchableOpacity style={[styles.moreBtn, { top: insets.top + 8 }]} activeOpacity={0.8}>
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

                {/* ── Stats Row ── */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{formatCount(followers)}</Text>
                        <Text style={styles.statLabel}>Followers</Text>
                    </View>
                    {instagramList.length > 0 && (
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{formatCount(Number(instagramFollowers))}</Text>
                            <Text style={styles.statLabel}>Instagram</Text>
                        </View>
                    )}
                    {youtubeList.length > 0 && (
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{formatCount(Number(youtubeSubscribers))}</Text>
                            <Text style={styles.statLabel}>YouTube</Text>
                        </View>
                    )}
                </View>

                {/* ── About Panel ── */}
                {(hasChannels || !!role) && (
                    <View style={styles.aboutPanel}>
                        <View style={styles.aboutHeader}>
                            <Ionicons name="information-circle-outline" size={18} color="#fff" />
                            <Text style={styles.aboutTitle}>About</Text>
                        </View>
                        {!!role && <InfoRow icon="🎬" label="Partner type" value={role} />}
                        {instagramList.map((a) => (
                            <InfoRow
                                key={a.handle}
                                icon="📷"
                                label="Instagram"
                                value={`@${a.handle.replace(/^@/, '')}`}
                                onPress={() => openInstagram(a.handle)}
                            />
                        ))}
                        {youtubeList.map((c) => (
                            <InfoRow
                                key={c.url}
                                icon="▶️"
                                label="YouTube"
                                value={c.name && c.name !== 'YouTube' ? c.name : 'View channel'}
                                onPress={() => openYoutube(c.url)}
                            />
                        ))}
                    </View>
                )}

                {/* ── Top Channels ── */}
                {hasChannels && (
                    <View style={styles.channelsSection}>
                        <View style={styles.channelsHeader}>
                            <Text style={styles.channelsSectionTitle}>Top Channels</Text>
                        </View>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.channelsCard}
                            contentContainerStyle={styles.channelsRow}
                        >
                            {youtubeList.map((c) => (
                                <ChannelItem
                                    key={c.url}
                                    icon={<Ionicons name="logo-youtube" size={18} color="#FF0000" />}
                                    bgColor="rgba(255,0,0,0.12)"
                                    name={c.name || 'YouTube'}
                                    count={c.subscribers || ''}
                                    onPress={() => openYoutube(c.url)}
                                />
                            ))}
                            {instagramList.map((a) => (
                                <ChannelItem
                                    key={a.handle}
                                    icon={<Ionicons name="logo-instagram" size={18} color="#E1306C" />}
                                    bgColor="rgba(225,48,108,0.12)"
                                    name={instagramList.length > 1 ? `@${a.handle.replace(/^@/, '')}` : 'Instagram'}
                                    count={a.followers || ''}
                                    onPress={() => openInstagram(a.handle)}
                                />
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* ── Ad Types ── */}
                <View style={styles.aboutPanel}>
                    <View style={styles.aboutHeader}>
                        <Ionicons name="megaphone-outline" size={18} color="#fff" />
                        <Text style={styles.aboutTitle}>Ad Types</Text>
                    </View>
                    {adTypes.length === 0 ? (
                        <Text style={styles.adTypeText}>No ad types added yet</Text>
                    ) : (
                        adTypes.map((id) => {
                            const adType = AD_TYPES[id];
                            return (
                                <View key={id} style={styles.adTypeRow}>
                                    <View style={[styles.adTypeIcon, { backgroundColor: `${adType?.color ?? '#3B82F6'}22` }]}>
                                        <Ionicons name={adType?.icon ?? 'pricetag-outline'} size={16} color={adType?.color ?? '#3B82F6'} />
                                    </View>
                                    <View style={styles.adTypeInfo}>
                                        <Text style={styles.adTypeTitle}>{adType?.title ?? id}</Text>
                                        {!!adType && <Text style={styles.adTypeText}>{adType.text}</Text>}
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>

                {/* ── Posts / Collabs Tabs ── */}
                <View style={styles.tabsContainer}>
                    <View style={styles.tabBar}>
                        {(['Posts', 'Collabs'] as Tab[]).map((tab) => (
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
                        <View style={styles.emptyTab}>
                            <Ionicons name="images-outline" size={38} color="#2a2a3a" />
                            <Text style={styles.emptyTabText}>No posts yet</Text>
                        </View>
                    )}

                    {activeTab === 'Collabs' && (
                        <View style={styles.emptyTab}>
                            <Ionicons name="people-outline" size={38} color="#2a2a3a" />
                            <Text style={styles.emptyTabText}>No collaborations yet</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Keeps the status bar readable over bright photos and scrolled content */}
            <LinearGradient
                pointerEvents="none"
                colors={['rgba(10,10,16,0.9)', 'rgba(10,10,16,0.6)', 'transparent']}
                style={[styles.statusBarShade, { height: insets.top + 24 }]}
            />

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
                {!!onPress && <Text style={styles.infoRowChevron}>›</Text>}
            </View>
        </TouchableOpacity>
    );
}

function ChannelItem({
    icon,
    bgColor,
    name,
    count,
    onPress,
}: {
    icon: React.ReactNode;
    bgColor: string;
    name: string;
    count: string;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity style={styles.channelItem} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.channelIconBg, { backgroundColor: bgColor }]}>
                {icon}
            </View>
            <View style={styles.channelInfo}>
                <View style={styles.channelNameRow}>
                    <Text style={styles.channelName} numberOfLines={1}>{name}</Text>
                    <View style={styles.channelVerifiedDot} />
                </View>
                {!!count && <Text style={styles.channelCount}>{count}</Text>}
            </View>
        </TouchableOpacity>
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
        height: 320,
        position: 'relative',
        overflow: 'hidden',
    },
    orb: {
        position: 'absolute',
        borderRadius: 999,
    },
    heroCelebrityImage: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
    },
    statusBarShade: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
    },
    bannerOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 140,
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
        marginTop: -48,
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
        paddingTop: 22,
        gap: 4,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    nameText: {
        color: '#fff',
        flexShrink: 1,
        fontSize: 18,
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
    followBtn: {
        marginTop: 24,
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

    // About panel
    aboutPanel: {
        marginHorizontal: 16,
        marginTop: 18,
        backgroundColor: '#12131C',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        padding: 16,
    },
    aboutHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    aboutTitle: {
        color: '#fff',
        fontSize: 15,
        fontFamily: fonts.semibold,
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
        flexShrink: 1,
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

    // Ad Types
    adTypeRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    adTypeIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    adTypeInfo: {
        flex: 1,
    },
    adTypeTitle: {
        color: '#fff',
        fontSize: 13,
        fontFamily: fonts.semibold,
    },
    adTypeText: {
        color: '#94A3B8',
        fontSize: 11,
        fontFamily: fonts.regular,
        marginTop: 2,
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
    channelsCard: {
        backgroundColor: '#12131C',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    channelsRow: {
        flexGrow: 1,
        justifyContent: 'space-between',
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    channelItem: {
        width: 150,
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
        flexShrink: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    channelName: {
        flexShrink: 1,
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
        marginHorizontal: 16,
        paddingHorizontal: 16,
        paddingTop: 14,
        backgroundColor: '#12131C',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    tabBar: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.08)',
        marginBottom: 12,
    },
    tabItem: {
        marginRight: 24,
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
        left: 0,
        right: 0,
        height: 2,
        borderRadius: 1,
        backgroundColor: '#3B82F6',
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
