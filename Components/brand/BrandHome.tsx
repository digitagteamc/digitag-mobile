import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Image, Linking, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import {
    BrandHome as BrandHomeData,
    BrandStatus,
    formatCount,
    getBrandDashboard,
    getBrandHome,
    getBrandStatus,
    getMyBrandProfile,
} from '../../services/brandService';
import { fonts, palette } from '../../theme/colors';
import { Avatar, BG, BRAND, Card, SectionTitle } from './ui';

type Dashboard = { posts: Record<string, number>; applicants: Record<string, number>; adRequests: Record<string, number>; unreadNotifications: number };

const sum = (m?: Record<string, number>, keys?: string[]) =>
    Object.entries(m || {}).reduce((n, [k, v]) => (!keys || keys.includes(k) ? n + v : n), 0);

/** Home tab for BRAND accounts: approval state, quick actions, and the
 *  admin-managed Top YouTube Channels / Ad Types / Celebrities sections. */
export default function BrandHome() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { token } = useAuth();
    const [home, setHome] = useState<BrandHomeData | null>(null);
    const [status, setStatus] = useState<BrandStatus | null>(null);
    const [dash, setDash] = useState<Dashboard | null>(null);
    const [brandName, setBrandName] = useState<string | null>(null);
    const [logo, setLogo] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!token) return;
        const [h, s, d, p] = await Promise.all([getBrandHome(token), getBrandStatus(token), getBrandDashboard(token), getMyBrandProfile(token)]);
        if (h.success) { setHome(h.data); setError(null); } else setError(h.error);
        if (s.success) setStatus(s.data);
        if (d.success) setDash(d.data);
        if (p.success) { setBrandName(p.data.name); setLogo(p.data.profilePicture); }
    }, [token]);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    const onRefresh = async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    };

    const approved = status?.status === 'APPROVED';
    // Actions that need an approved brand bounce to the status screen instead.
    const gated = (path: string) => () => {
        if (!status?.hasProfile) return router.push('/signup/brand' as any);
        if (!approved) return router.push('/signup/pending?role=BRAND' as any);
        router.push(path as any);
    };

    const quickActions = [
        { key: 'advertise', icon: 'tv-outline' as const, title: 'Advertise', desc: 'TV & YouTube channels', onPress: () => router.push('/brand/channels' as any) },
        { key: 'post', icon: 'add-circle-outline' as const, title: 'Post Requirement', desc: 'Find creators & freelancers', onPress: gated('/brand/create-requirement') },
        {
            key: 'requests', icon: 'paper-plane-outline' as const, title: 'Ad Requests',
            desc: dash ? `${sum(dash.adRequests, ['PENDING', 'UNDER_REVIEW'])} awaiting reply` : 'Track channel replies',
            onPress: () => router.push('/brand/ad-requests' as any),
        },
        {
            key: 'posts', icon: 'people-outline' as const, title: 'My Posts',
            desc: dash ? `${dash.applicants?.PENDING || 0} new applicants` : 'Review applicants',
            onPress: () => router.push('/brand/my-posts' as any),
        },
    ];

    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            <ScrollView
                contentContainerStyle={{ paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.primary} />}
            >
                <LinearGradient
                    colors={['rgba(115, 82, 221, 0.45)', 'rgba(115, 82, 221, 0.08)', 'transparent']}
                    style={{ paddingTop: insets.top + 14, paddingHorizontal: 18, paddingBottom: 22 }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Avatar uri={logo} name={brandName} size={46} />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={{ color: palette.textSecondary, fontSize: 12, fontFamily: fonts.regular }}>Welcome back</Text>
                            <Text numberOfLines={1} style={{ color: '#fff', fontSize: 20, fontFamily: fonts.bold }}>{brandName || 'Your Brand'}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => router.push('/notifications' as any)}
                            style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Ionicons name="notifications-outline" size={20} color="#fff" />
                            {!!dash?.unreadNotifications && (
                                <View style={{ position: 'absolute', top: 8, right: 9, width: 9, height: 9, borderRadius: 5, backgroundColor: '#ED2A91' }} />
                            )}
                        </TouchableOpacity>
                    </View>
                    <Text style={{ color: '#fff', fontSize: 24, fontFamily: fonts.bold, marginTop: 22, lineHeight: 30 }}>
                        Reach the right audience,{'\n'}
                        <Text style={{ color: BRAND.light }}>on every screen.</Text>
                    </Text>
                </LinearGradient>

                <View style={{ paddingHorizontal: 16 }}>
                    <ApprovalBanner status={status} onPress={() => router.push((status?.hasProfile ? '/signup/pending?role=BRAND' : '/signup/brand') as any)} />

                    {/* Quick actions */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 8 }}>
                        {quickActions.map((a) => (
                            <Card key={a.key} onPress={a.onPress} style={{ width: '48.5%', marginBottom: 12, padding: 14 }}>
                                <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: BRAND.soft, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                                    <Ionicons name={a.icon} size={20} color={BRAND.primary} />
                                </View>
                                <Text style={{ color: '#fff', fontSize: 14, fontFamily: fonts.semibold }}>{a.title}</Text>
                                <Text numberOfLines={1} style={{ color: palette.textMuted, fontSize: 11, fontFamily: fonts.regular, marginTop: 2 }}>{a.desc}</Text>
                            </Card>
                        ))}
                    </View>

                    {!!error && !home && (
                        <Card style={{ marginTop: 12, alignItems: 'center' }} onPress={load}>
                            <Text style={{ color: palette.textMuted, fontFamily: fonts.regular }}>{error} · Tap to retry</Text>
                        </Card>
                    )}

                    {/* Ad Types */}
                    {!!home?.adTypes.length && (
                        <>
                            <SectionTitle title="Ad Types" action="Browse channels" onAction={() => router.push('/brand/channels' as any)} />
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16 }}>
                                {home.adTypes.map((t) => {
                                    const c = t.accentColor || BRAND.primary;
                                    return (
                                        <TouchableOpacity
                                            key={t.id}
                                            activeOpacity={0.85}
                                            onPress={() => router.push({ pathname: '/brand/channels', params: { adTypeId: t.id, adTypeName: t.name } } as any)}
                                            style={{ width: 132, marginRight: 10, borderRadius: 16, padding: 14, backgroundColor: c + '1A', borderWidth: 1, borderColor: c + '55' }}
                                        >
                                            {t.iconUrl ? (
                                                <Image source={{ uri: t.iconUrl }} style={{ width: 34, height: 34, marginBottom: 10 }} resizeMode="contain" />
                                            ) : (
                                                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: c + '33', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                                                    <Ionicons name="megaphone-outline" size={18} color={c} />
                                                </View>
                                            )}
                                            <Text numberOfLines={1} style={{ color: '#fff', fontSize: 14, fontFamily: fonts.semibold }}>{t.name}</Text>
                                            {!!t.description && <Text numberOfLines={2} style={{ color: palette.textMuted, fontSize: 11, fontFamily: fonts.regular, marginTop: 3 }}>{t.description}</Text>}
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </>
                    )}

                    {/* Top YouTube Channels */}
                    {!!home?.youtubeChannels.length && (
                        <>
                            <SectionTitle title="Top YouTube Channels" action="See all" onAction={() => router.push({ pathname: '/brand/channels', params: { type: 'YOUTUBE' } } as any)} />
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16 }}>
                                {home.youtubeChannels.map((ch) => (
                                    <TouchableOpacity
                                        key={ch.id}
                                        activeOpacity={0.85}
                                        onPress={() => router.push({ pathname: '/brand/channel/[id]', params: { id: ch.id } } as any)}
                                        style={{ width: 140, marginRight: 10, borderRadius: 16, padding: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center' }}
                                    >
                                        <Avatar uri={ch.logoUrl} name={ch.name} size={60} color="#FF3B30" />
                                        <Text numberOfLines={1} style={{ color: '#fff', fontSize: 13, fontFamily: fonts.semibold, marginTop: 10 }}>{ch.name}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                            <Ionicons name="logo-youtube" size={12} color="#FF3B30" />
                                            <Text style={{ color: palette.textMuted, fontSize: 11, fontFamily: fonts.regular, marginLeft: 4 }}>{formatCount(ch.subscriberCount)} subs</Text>
                                        </View>
                                        {!!ch.category && <Text numberOfLines={1} style={{ color: BRAND.light, fontSize: 10, fontFamily: fonts.semibold, marginTop: 6 }}>{ch.category}</Text>}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </>
                    )}

                    {/* Celebrities */}
                    {!!home?.celebrities.length && (
                        <>
                            <SectionTitle title="Celebrities" action="See all" onAction={() => router.push('/brand/celebrities' as any)} />
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16 }}>
                                {home.celebrities.map((c) => (
                                    <TouchableOpacity
                                        key={c.id}
                                        activeOpacity={0.85}
                                        disabled={!c.profileUrl}
                                        onPress={() => c.profileUrl && Linking.openURL(c.profileUrl).catch(() => { })}
                                        style={{ width: 120, marginRight: 10, alignItems: 'center' }}
                                    >
                                        <Avatar uri={c.photoUrl} name={c.name} size={88} />
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                            <Text numberOfLines={1} style={{ color: '#fff', fontSize: 13, fontFamily: fonts.semibold, maxWidth: 100 }}>{c.name}</Text>
                                            {c.isVerified && <Ionicons name="checkmark-circle" size={13} color="#60A5FA" style={{ marginLeft: 3 }} />}
                                        </View>
                                        <Text numberOfLines={1} style={{ color: palette.textMuted, fontSize: 11, fontFamily: fonts.regular }}>
                                            {[c.role, `${formatCount(c.followerCount)} followers`].filter(Boolean).join(' · ')}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

function ApprovalBanner({ status, onPress }: { status: BrandStatus | null; onPress: () => void }) {
    if (!status || status.status === 'APPROVED') return null;
    const cfg = !status.hasProfile
        ? { color: BRAND.primary, icon: 'create-outline' as const, title: 'Complete your brand registration', body: 'Add your PAN/GSTIN to start posting and advertising.' }
        : status.status === 'REJECTED'
            ? { color: '#EF4444', icon: 'alert-circle-outline' as const, title: 'Registration not approved', body: status.rejectionReason || 'Update your details and resubmit.' }
            : { color: '#F59E0B', icon: 'time-outline' as const, title: 'Awaiting admin approval', body: 'You can browse now. Posting and ad requests unlock once approved.' };
    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={onPress}
            style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, marginBottom: 14, backgroundColor: cfg.color + '18', borderWidth: 1, borderColor: cfg.color + '55' }}
        >
            <Ionicons name={cfg.icon} size={22} color={cfg.color} />
            <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: '#fff', fontSize: 14, fontFamily: fonts.semibold }}>{cfg.title}</Text>
                <Text numberOfLines={2} style={{ color: palette.textSecondary, fontSize: 12, fontFamily: fonts.regular, marginTop: 2 }}>{cfg.body}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={cfg.color} />
        </TouchableOpacity>
    );
}
