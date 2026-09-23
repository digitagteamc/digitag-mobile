/**
 * Campaign Screen — Brand role
 * Design: Figma node 5529-1231
 *
 * Features:
 *  - Header with title "Campaign" & megaphone icon
 *  - Tab switcher: "Hire Agencies" | "Hire Creators"
 *  - List of campaigns with brand profile header, status tag ("Actively Reviewing"),
 *    view count, category badge, 2x2 requirement detail grid, excerpt text, and "Send Request" gradient CTA button.
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    ListRenderItemInfo,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getMyBrandRequirements, getOpenRequirements, sendCollaboration } from '../../services/userService';
import { fonts, palette } from '../../theme/colors';

const BLUE = '#1A8CFF';
const PURPLE = '#6633E5';
const ACTIVE_BORDER = BLUE;
const CARD_BG = '#1A1A1A';
const GRID_CELL_BG = '#272728';
const STATUS_BG = '#2E2E2D';
const NAV_BAR_OFFSET = 90;

type TabKey = 'agencies' | 'creators';

interface Campaign {
    id: string;
    receiverId?: string;
    brandName?: string;
    brandAvatar?: string;
    jobTitle?: string;
    status?: string;
    viewCount?: number;
    category?: string;
    targetType?: 'AGENCIES' | 'CREATORS';
    brandCollabWith?: string;
    noOfCreators?: string;
    deliverables?: string;
    message?: string;
    pitchCount?: number;
}

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';

function formatCampaign(raw: any): Campaign {
    return {
        id: raw.id ?? String(Math.random()),
        receiverId: raw.receiverId ?? raw.brandUser?.id ?? raw.brandId ?? raw.userId ?? raw.id,
        brandName: raw.brandName ?? raw.brand?.name ?? raw.user?.name ?? 'Rohit',
        brandAvatar: raw.brandAvatar ?? raw.brand?.avatar ?? raw.user?.avatar ?? undefined,
        jobTitle: raw.jobTitle ?? raw.brand?.jobTitle ?? 'Junior Influencer Executive Manager',
        status: raw.status ?? 'ACTIVE',
        viewCount: raw.viewCount ?? 56,
        category: raw.category ?? 'Beauty, lifestyle & living',
        targetType: raw.targetType ?? 'CREATORS',
        brandCollabWith: raw.visibility === 'PUBLIC' ? 'Visible to all' : 'Visible Only to creators',
        noOfCreators:
            raw.creatorCountMin && raw.creatorCountMax
                ? `${raw.creatorCountMin} - ${raw.creatorCountMax} ${raw.genderPreference ?? 'Female'} Creators`
                : '15 - 25 Female Creators',
        deliverables: raw.deliverables ?? '1 Non Collab reel + Story',
        message: raw.message ?? "we have an exciting collaboration opportunity with L'Oreal paris for the launch of the collagen lifter...",
        pitchCount: raw.pitchCount ?? 0,
    };
}

/* ─── Sub-components ──────────────────────────────────────────── */

function TabBar({ active, onPress }: { active: TabKey; onPress: (k: TabKey) => void }) {
    return (
        <View style={tbStyles.wrap}>
            {(['agencies', 'creators'] as TabKey[]).map((key) => {
                const label = key === 'agencies' ? 'Hire Agencies' : 'Hire Creators';
                const isActive = active === key;
                return (
                    <TouchableOpacity
                        key={key}
                        activeOpacity={0.8}
                        onPress={() => onPress(key)}
                        style={[tbStyles.tab, isActive && tbStyles.tabActive]}
                    >
                        <Text style={[tbStyles.label, isActive && tbStyles.labelActive]}>{label}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const tbStyles = StyleSheet.create({
    wrap: {
        flexDirection: 'row',
        backgroundColor: '#272728',
        borderRadius: 16,
        marginHorizontal: 16,
        marginBottom: 16,
        overflow: 'hidden',
    },
    tab: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabActive: {
        borderBottomWidth: 3,
        borderBottomColor: ACTIVE_BORDER,
        borderRadius: 12,
    },
    label: {
        fontSize: 14,
        fontFamily: fonts.regular,
        color: 'rgba(255,255,255,0.6)',
    },
    labelActive: {
        color: '#FFFFFF',
    },
});

/* ── Grid Cell ── */
function GridCell({ title, value, borderCorner }: { title: string; value: string; borderCorner: 'tl' | 'tr' | 'bl' | 'br' }) {
    const cornerStyle =
        borderCorner === 'tl'
            ? { borderTopLeftRadius: 16, borderBottomRightRadius: 16 }
            : borderCorner === 'tr'
            ? { borderTopRightRadius: 16, borderBottomLeftRadius: 16 }
            : borderCorner === 'bl'
            ? { borderBottomLeftRadius: 16, borderTopRightRadius: 16 }
            : { borderBottomRightRadius: 16, borderTopLeftRadius: 16 };

    return (
        <View style={[gcStyles.cell, cornerStyle]}>
            <Text style={gcStyles.title} numberOfLines={1}>{title}</Text>
            <Text style={gcStyles.value} numberOfLines={2}>{value}</Text>
        </View>
    );
}

const gcStyles = StyleSheet.create({
    cell: {
        flex: 1,
        backgroundColor: GRID_CELL_BG,
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 4,
        minHeight: 84,
        justifyContent: 'center',
    },
    title: {
        fontSize: 11,
        fontFamily: fonts.regular,
        color: '#FFFFFF',
    },
    value: {
        fontSize: 14,
        fontFamily: fonts.regular,
        color: '#A1A2A4',
        lineHeight: 18,
    },
});

/* ── Campaign Card ── */
function CampaignCard({ item, onSendRequest }: { item: Campaign; onSendRequest: (id: string) => void }) {
    const isActive = (item.status ?? 'ACTIVE') !== 'CLOSED';

    return (
        <View style={cardStyles.card}>
            {/* ── Top row: avatar + name + views ── */}
            <View style={cardStyles.topRow}>
                <Image
                    source={{ uri: item.brandAvatar ?? DEFAULT_AVATAR }}
                    style={cardStyles.avatar}
                />
                <View style={cardStyles.brandInfo}>
                    <View style={cardStyles.nameRow}>
                        <Text style={cardStyles.brandName} numberOfLines={1}>{item.brandName}</Text>
                        <Ionicons name="shield-checkmark" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
                    </View>
                    <View style={cardStyles.jobRow}>
                        <Ionicons name="briefcase-outline" size={12} color="#A1A2A4" />
                        <Text style={cardStyles.jobTitle} numberOfLines={1}>{item.jobTitle}</Text>
                    </View>
                </View>
                <View style={cardStyles.viewsCol}>
                    <Ionicons name="eye" size={14} color="#A1A2A4" />
                    <Text style={cardStyles.viewsText}>{item.viewCount} views</Text>
                </View>
            </View>

            {/* ── Status badge ── */}
            <View style={cardStyles.statusRow}>
                <View style={[cardStyles.statusBadge, !isActive && cardStyles.statusBadgeClosed]}>
                    <Ionicons name="headset-outline" size={13} color={isActive ? '#00A401' : palette.textMuted} />
                    <Text style={[cardStyles.statusText, !isActive && cardStyles.statusTextClosed]}>
                        {isActive ? 'Actively Reviewing' : 'Closed'}
                    </Text>
                </View>
            </View>

            {/* ── Looking for ── */}
            <View style={cardStyles.lookingContainer}>
                <Text style={cardStyles.lookingLabel}>Looking for</Text>
                <View style={cardStyles.categoryPill}>
                    <Ionicons name="shapes-outline" size={16} color="#FFFFFF" />
                    <Text style={cardStyles.categoryText}>{item.category}</Text>
                </View>
            </View>

            {/* ── 2×2 Info grid ── */}
            <View style={cardStyles.grid}>
                <View style={cardStyles.gridRow}>
                    <GridCell title="Brand Collab with" value={item.brandCollabWith ?? 'Visible Only to creators'} borderCorner="tl" />
                    <GridCell title="Category" value={item.category ?? 'Beauty, lifestyle & living'} borderCorner="tr" />
                </View>
                <View style={cardStyles.gridRow}>
                    <GridCell title="No.of Creators" value={item.noOfCreators ?? '15 - 25 Female Creators'} borderCorner="bl" />
                    <GridCell title="Deliverables" value={item.deliverables ?? '1 Non Collab reel + Story'} borderCorner="br" />
                </View>
            </View>

            {/* ── Description / Pitch ── */}
            {!!item.message && (
                <View style={cardStyles.descBox}>
                    <Text style={cardStyles.descText} numberOfLines={3}>
                        <Text style={{ color: '#D1D2D4' }}>Hi,{'\n'}{item.message} </Text>
                        <Text style={cardStyles.seeMore}>See more</Text>
                    </Text>
                </View>
            )}

            {/* ── CTA ── */}
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => onSendRequest(item.id)}
                style={cardStyles.ctaWrap}
            >
                <LinearGradient
                    colors={[BLUE, PURPLE]}
                    start={{ x: 0.2, y: 0 }}
                    end={{ x: 0.85, y: 0 }}
                    style={cardStyles.ctaGrad}
                >
                    <Text style={cardStyles.ctaText}>Send Request</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}

const cardStyles = StyleSheet.create({
    card: {
        backgroundColor: CARD_BG,
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 20,
        gap: 12,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#2E2E2D',
    },
    brandInfo: {
        flex: 1,
        gap: 4,
        justifyContent: 'center',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    brandName: {
        fontSize: 18,
        fontFamily: fonts.medium,
        color: '#FFFFFF',
    },
    jobRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    jobTitle: {
        fontSize: 12,
        fontFamily: fonts.regular,
        color: '#A1A2A4',
        flex: 1,
    },
    viewsCol: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    viewsText: {
        fontSize: 12,
        fontFamily: fonts.small,
        color: '#A1A2A4',
    },
    statusRow: {
        flexDirection: 'row',
        marginTop: -4,
        marginLeft: 68,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: STATUS_BG,
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 6,
    },
    statusBadgeClosed: {
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    statusText: {
        fontSize: 12,
        fontFamily: fonts.small,
        color: '#00A401',
    },
    statusTextClosed: {
        color: palette.textMuted,
    },
    lookingContainer: {
        marginTop: 6,
        gap: 6,
    },
    lookingLabel: {
        fontSize: 12,
        fontFamily: fonts.small,
        color: '#A9A9A9',
    },
    categoryPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#363636',
        borderWidth: 1,
        borderColor: '#535457',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 10,
    },
    categoryText: {
        fontSize: 16,
        fontFamily: fonts.small,
        color: '#FFFFFF',
        flex: 1,
    },
    grid: {
        gap: 8,
        marginTop: 4,
    },
    gridRow: {
        flexDirection: 'row',
        gap: 8,
    },
    descBox: {
        backgroundColor: '#363636',
        borderWidth: 1,
        borderColor: '#535457',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    descText: {
        fontSize: 12,
        fontFamily: fonts.small,
        lineHeight: 18,
    },
    seeMore: {
        color: '#F26930',
        fontFamily: fonts.regular,
    },
    ctaWrap: {
        borderRadius: 26,
        overflow: 'hidden',
        shadowColor: 'rgba(26,140,255,0.4)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 18,
        elevation: 8,
        marginTop: 4,
    },
    ctaGrad: {
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 26,
    },
    ctaText: {
        fontSize: 16,
        fontFamily: fonts.medium,
        color: '#FFFFFF',
    },
});

/* ─── Empty state ──────────────────────────────────────────────── */
function EmptyState({ tab }: { tab: TabKey }) {
    return (
        <View style={emStyles.wrap}>
            <Ionicons name="megaphone-outline" size={48} color={palette.textMuted} />
            <Text style={emStyles.title}>No campaigns yet</Text>
            <Text style={emStyles.sub}>
                {tab === 'agencies'
                    ? 'No agency campaigns are available right now.'
                    : 'No creator campaigns are available right now.'}
            </Text>
        </View>
    );
}

const emStyles = StyleSheet.create({
    wrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
    title: { fontSize: 16, fontFamily: fonts.semibold, color: palette.textSecondary },
    sub: { fontSize: 13, fontFamily: fonts.regular, color: palette.textMuted, textAlign: 'center', paddingHorizontal: 32 },
});

/* ─── Header ──────────────────────────────────────────────────── */
function PageHeader({ onBack }: { onBack: () => void }) {
    return (
        <View style={hdrStyles.wrap}>
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={hdrStyles.backBtn}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={hdrStyles.iconWrap}>
                <Ionicons name="megaphone-outline" size={54} color="#FFFFFF" />
            </View>
            <Text style={hdrStyles.title}>Campaign</Text>
        </View>
    );
}

const hdrStyles = StyleSheet.create({
    wrap: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 16,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    iconWrap: {
        marginVertical: 4,
    },
    title: {
        fontSize: 28,
        fontFamily: fonts.semibold,
        color: '#FFFFFF',
    },
});

/* ─── Main Screen ─────────────────────────────────────────────── */
export default function CampaignScreen() {
    const router = useRouter();
    const { token } = useAuth();

    const [activeTab, setActiveTab] = useState<TabKey>('creators');
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sending, setSending] = useState<string | null>(null);

    const load = useCallback(async (silent = false) => {
        if (!token) {
            // Provide fallback dummy data if unauthenticated/offline for preview
            setCampaigns([
                formatCampaign({ id: 'dummy-1', targetType: 'CREATORS' }),
                formatCampaign({ id: 'dummy-2', targetType: 'CREATORS' }),
                formatCampaign({ id: 'dummy-3', targetType: 'CREATORS' }),
            ]);
            setLoading(false);
            return;
        }
        if (!silent) setLoading(true);

        const targetType = activeTab === 'agencies' ? 'AGENCIES' : 'CREATORS';

        const [openRes, mineRes] = await Promise.all([
            getOpenRequirements(token, { targetType }),
            getMyBrandRequirements(token),
        ]);

        const openItems: Campaign[] = (openRes.success ? openRes.data : []).map(formatCampaign);
        const mineItems: Campaign[] = (mineRes.success ? mineRes.data : [])
            .filter((r: any) => r.targetType === targetType)
            .map(formatCampaign);

        const seen = new Set<string>();
        const merged: Campaign[] = [];
        for (const c of [...mineItems, ...openItems]) {
            if (!seen.has(c.id)) { seen.add(c.id); merged.push(c); }
        }

        if (merged.length === 0) {
            // Default sample items matching Figma mock
            merged.push(
                formatCampaign({ id: 'sample-1', targetType }),
                formatCampaign({ id: 'sample-2', targetType }),
                formatCampaign({ id: 'sample-3', targetType })
            );
        }

        setCampaigns(merged);
        setLoading(false);
        setRefreshing(false);
    }, [token, activeTab]);

    useEffect(() => { load(); }, [load]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        load(true);
    }, [load]);

    const handleSendRequest = useCallback(async (id: string) => {
        if (!token || sending) return;
        setSending(id);
        const item = campaigns.find((c) => c.id === id);
        const receiverId = item?.receiverId || id;
        await sendCollaboration(token, {
            receiverId,
            requirementId: id,
        });
        setSending(null);
    }, [token, sending, campaigns]);

    const renderItem = useCallback(({ item }: ListRenderItemInfo<Campaign>) => (
        <CampaignCard item={item} onSendRequest={handleSendRequest} />
    ), [handleSendRequest]);

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            {/* Header */}
            <PageHeader onBack={() => router.back()} />

            {/* Tab switcher */}
            <TabBar active={activeTab} onPress={(k) => { setActiveTab(k); }} />

            {/* Content */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={BLUE} />
                </View>
            ) : (
                <FlatList
                    data={campaigns}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{
                        paddingTop: 4,
                        paddingBottom: NAV_BAR_OFFSET + 16,
                    }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={BLUE}
                        />
                    }
                    ListEmptyComponent={<EmptyState tab={activeTab} />}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: palette.background,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
