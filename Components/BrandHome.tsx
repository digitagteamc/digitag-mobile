import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import {
    createBrandRequirement,
    getAdTypes,
    getCelebrities,
    getFollowSuggestions,
    getMyBrandProfile,
    getYoutubeChannels,
} from '../services/userService';
import { fonts, palette } from '../theme/colors';

// Brand's own accent — indigo/purple, matching the mock (Complete Profile
// button, Send Request gradient, bottom nav). Not part of theme/colors.ts's
// rolePalettes since that type is CREATOR|FREELANCER only throughout the
// app; kept local here rather than widening a type used in ~30 other files
// for one new role.
const BRAND_PRIMARY = '#4F46E5';
const BRAND_GRADIENT: [string, string] = ['#6D5EF5', '#4F46E5'];

const imgPhotography = require('../assets/tabs-icons-freelancer/Photography.png');
const imgEditor = require('../assets/tabs-icons-freelancer/editors.png');
const imgVideography = require('../assets/tabs-icons-freelancer/Videography.png');
const imgGrowth = require('../assets/tabs-icons-freelancer/GrowthSpecialist.png');
const imgScriptWriters = require('../assets/tabs-icons-freelancer/ScriptWriters.png');
const imgStyling = require('../assets/tabs-icons-freelancer/Stylingmakeup.png');
const imgFashion = require('../assets/tabs-icons-freelancer/FashionDesigners.png');
const imgProperty = require('../assets/tabs-icons-freelancer/PropertyRental.png');
const imgVoiceOver = require('../assets/tabs-icons-freelancer/VoiceOver.png');
const imgModal = require('../assets/tabs-icons-freelancer/Modals.png');
const imgSocialMediaManager = require('../assets/tabs-icons-freelancer/SocialMediaManager.png');
const imgLocation = require('../assets/location.png');
const imgDefaultAvatar = require('../assets/defaultavatar.png');

// Same canonical tile→slug map as explore.tsx/index.tsx's Creator-browsing
// tabs — one tile is one real Category row (FREELANCER-role rows).
const FREELANCER_CATEGORIES = [
    { id: 'photography', label: 'Photography', image: imgPhotography, slug: 'photography' },
    { id: 'editor', label: 'Editor', image: imgEditor, slug: 'editors' },
    { id: 'videography', label: 'Videography', image: imgVideography, slug: 'videography' },
    { id: 'property', label: 'Property\nRental', image: imgProperty, slug: 'property-rental' },
    { id: 'script', label: 'Script Writers', image: imgScriptWriters, slug: 'script-writers' },
    { id: 'styling', label: 'Styling &\nmakeup', image: imgStyling, slug: 'styling-makeup' },
    { id: 'fashion', label: 'Fashion\nDesigners', image: imgFashion, slug: 'fashion-designers' },
    { id: 'growth', label: 'Growth\nSpecialist', image: imgGrowth, slug: 'growth-specialist' },
    { id: 'voice', label: 'Voice Over', image: imgVoiceOver, slug: 'voice-over' },
    { id: 'models', label: 'Models', image: imgModal, slug: 'models' },
    { id: 'social-media-manager', label: 'Social Media\nManager', image: imgSocialMediaManager, slug: 'social-media-management' },
];

// No existing city list/data source anywhere in the app (checked this
// session) — fixed showcase set, same convention as the app's other fixed
// category arrays. Filtering matches CreatorProfile/FreelancerProfile's
// free-text `location` field via a contains match, not a strict city model.
const CITIES = ['Hyderabad', 'Bangalore', 'Delhi', 'Gurugaon', 'Chennai', 'Kolkata', 'Mumbai', 'Pune'];

const YT_FILTER_CHIPS = ['All', 'Podcast', 'Tech', 'Education', 'Others'];

function formatCount(n?: number | null) {
    if (!n) return '0';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

function SectionHeader({ title, onViewAll }: { title: string; subtitle?: string; onViewAll?: () => void }) {
    return (
        <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {onViewAll ? (
                <TouchableOpacity onPress={onViewAll} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={styles.viewAll}>View all</Text>
                </TouchableOpacity>
            ) : null}
        </View>
    );
}

export default function BrandHome() {
    const router = useRouter();
    const { token } = useAuth();

    const [brandName, setBrandName] = useState('');
    const [brandAvatar, setBrandAvatar] = useState<string | null>(null);

    const [channels, setChannels] = useState<any[]>([]);
    const [channelFilter, setChannelFilter] = useState('All');
    const [adTypes, setAdTypes] = useState<any[]>([]);
    const [topCreators, setTopCreators] = useState<any[]>([]);
    const [celebrities, setCelebrities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // "Who are you looking for?" composer
    const [requirementTab, setRequirementTab] = useState<'CREATORS' | 'AGENCIES'>('CREATORS');
    const [requirementText, setRequirementText] = useState('');
    const [posting, setPosting] = useState(false);
    const [lastPosted, setLastPosted] = useState<{ message: string; targetType: 'CREATORS' | 'AGENCIES' } | null>(null);

    const load = useCallback(async () => {
        if (!token) { setLoading(false); return; }
        const [profileRes, channelsRes, adTypesRes, creatorsRes, celebsRes] = await Promise.all([
            getMyBrandProfile(token),
            getYoutubeChannels(token),
            getAdTypes(token),
            getFollowSuggestions(token, 6, { role: 'CREATOR' }),
            getCelebrities(token),
        ]);
        if (profileRes.success && profileRes.data) {
            setBrandName(profileRes.data.name || '');
            setBrandAvatar(profileRes.data.profilePicture || null);
        }
        if (channelsRes.success) setChannels(channelsRes.data);
        if (adTypesRes.success) setAdTypes(adTypesRes.data);
        if (creatorsRes.success) setTopCreators(creatorsRes.data);
        if (celebsRes.success) setCelebrities(celebsRes.data);
        setLoading(false);
    }, [token]);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    const filteredChannels = channelFilter === 'All'
        ? channels
        : channels.filter((c) => (c.category || '').toLowerCase() === channelFilter.toLowerCase());

    const handlePostRequirement = async () => {
        if (!requirementText.trim() || !token || posting) return;
        setPosting(true);
        const res = await createBrandRequirement({ targetType: requirementTab, message: requirementText.trim() }, token);
        setPosting(false);
        if (res.success) {
            setLastPosted({ message: requirementText.trim(), targetType: requirementTab });
            setRequirementText('');
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safe} edges={['top']}>
                <View style={styles.centerFill}>
                    <ActivityIndicator color={BRAND_PRIMARY} size="large" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* ── Header ── */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.headerLeft} activeOpacity={0.8} onPress={() => router.push('/(tabs)/profile' as any)}>
                        <Image source={brandAvatar ? { uri: brandAvatar } : imgDefaultAvatar} style={styles.headerAvatar} />
                        <View>
                            <Text style={styles.headerHi}>Hi</Text>
                            <Text style={styles.headerName} numberOfLines={1}>{brandName || 'Welcome To Digitag'}</Text>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.headerRight}>
                        <TouchableOpacity style={styles.headerIconBtn}>
                            <Ionicons name="stats-chart-outline" size={18} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.push('/notifications' as any)}>
                            <Ionicons name="notifications-outline" size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── Hero ── */}
                <LinearGradient colors={['#1a1a2e', '#0A0A10']} style={styles.hero}>
                    <Text style={styles.heroTitle}>Connect with Top{'\n'}
                        <Text style={{ color: '#FFC10A', fontStyle: 'italic' }}>Influencers</Text>
                    </Text>
                    <Text style={styles.heroSubtitle}>100K+ Creators</Text>
                    <TouchableOpacity style={styles.heroBtn} onPress={() => router.push('/signup/brand' as any)} activeOpacity={0.85}>
                        <Text style={styles.heroBtnText}>Complete Profile</Text>
                    </TouchableOpacity>
                </LinearGradient>

                {/* ── Top YouTube Channels ── */}
                <View style={styles.section}>
                    <SectionHeader title="Top Youtube Channels" onViewAll={() => { }} />
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12, marginBottom: 4 }}>
                        {YT_FILTER_CHIPS.map((chip) => (
                            <TouchableOpacity
                                key={chip}
                                onPress={() => setChannelFilter(chip)}
                                style={[styles.chip, channelFilter === chip && { backgroundColor: BRAND_PRIMARY, borderColor: BRAND_PRIMARY }]}
                            >
                                <Text style={[styles.chipText, channelFilter === chip && { color: '#fff' }]}>{chip}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={filteredChannels}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ paddingTop: 12, gap: 12 }}
                        ListEmptyComponent={<Text style={styles.emptyText}>No channels yet</Text>}
                        renderItem={({ item }) => (
                            <View style={styles.channelCard}>
                                <Image source={item.logoUrl ? { uri: item.logoUrl } : imgDefaultAvatar} style={styles.channelLogo} />
                                <Text style={styles.channelName} numberOfLines={1}>{item.name}</Text>
                                <Text style={styles.channelSubs}>{formatCount(item.subscriberCount)} Subs</Text>
                                {!!item.category && (
                                    <View style={styles.channelCatRow}>
                                        <View style={styles.dot} />
                                        <Text style={styles.channelCat}>{item.category}</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    />
                </View>

                {/* ── Ad Types ── */}
                <View style={styles.section}>
                    <SectionHeader title="Ad Types" onViewAll={() => { }} />
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={adTypes}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ paddingTop: 12, gap: 12 }}
                        ListEmptyComponent={<Text style={styles.emptyText}>No ad types yet</Text>}
                        renderItem={({ item }) => (
                            <View style={[styles.adTypeCard, { borderColor: item.accentColor || palette.borderStrong }]}>
                                <View style={[styles.adTypeIconWrap, { backgroundColor: (item.accentColor || BRAND_PRIMARY) + '33' }]}>
                                    <Ionicons name="play-circle" size={20} color={item.accentColor || BRAND_PRIMARY} />
                                </View>
                                <Text style={styles.adTypeName} numberOfLines={1}>{item.name}</Text>
                            </View>
                        )}
                    />
                </View>

                {/* ── Top Creators ── */}
                <View style={styles.section}>
                    <SectionHeader title="Top Creators" onViewAll={() => { }} />
                    <View style={styles.peopleGrid}>
                        {topCreators.map((c) => (
                            <TouchableOpacity
                                key={c.id}
                                style={styles.peopleCard}
                                activeOpacity={0.85}
                                onPress={() => router.push({ pathname: '/creator-details', params: { userId: c.id } } as any)}
                            >
                                <Image source={c.profilePicture ? { uri: c.profilePicture } : imgDefaultAvatar} style={styles.peopleAvatar} />
                                <Text style={styles.peopleName} numberOfLines={1}>{c.name || 'Creator'}</Text>
                                <Text style={styles.peopleSub} numberOfLines={1}>{c.categoryNames?.[0] || 'Creator'}</Text>
                            </TouchableOpacity>
                        ))}
                        {topCreators.length === 0 && <Text style={styles.emptyText}>No creators yet</Text>}
                    </View>
                </View>

                {/* ── Creators by Location ── */}
                <View style={styles.section}>
                    <SectionHeader title="Creators by Location" onViewAll={() => { }} />
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={CITIES}
                        keyExtractor={(c) => c}
                        contentContainerStyle={{ paddingTop: 12, gap: 12 }}
                        renderItem={({ item: city }) => (
                            <TouchableOpacity
                                style={styles.cityCard}
                                activeOpacity={0.85}
                                onPress={() => router.push({ pathname: '/people-results', params: { title: `Creators in ${city}`, role: 'CREATOR', location: city } } as any)}
                            >
                                <Image source={imgLocation} style={styles.cityImage} resizeMode="cover" />
                                <View style={styles.cityOverlay} />
                                <Text style={styles.cityName}>{city}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>

                {/* ── Who are you looking for? ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Who are you looking for?</Text>
                    <Text style={styles.requirementSubtitle}>Post your requirement & receive responses, instantly...</Text>

                    <View style={styles.requirementInputRow}>
                        <Ionicons name="person-circle-outline" size={20} color="#8A8A99" />
                        <TextInput
                            style={styles.requirementInput}
                            placeholder="Type your requirement here"
                            placeholderTextColor="#6B6B7A"
                            value={requirementText}
                            onChangeText={setRequirementText}
                            multiline
                        />
                        <TouchableOpacity onPress={handlePostRequirement} disabled={posting || !requirementText.trim()}>
                            {posting
                                ? <ActivityIndicator size="small" color={BRAND_PRIMARY} />
                                : <Ionicons name="add-circle" size={26} color={requirementText.trim() ? BRAND_PRIMARY : '#3a3a44'} />
                            }
                        </TouchableOpacity>
                    </View>

                    <View style={styles.requirementTabs}>
                        <TouchableOpacity onPress={() => setRequirementTab('CREATORS')} style={[styles.requirementTab, requirementTab === 'CREATORS' && styles.requirementTabActive]}>
                            <Text style={[styles.requirementTabText, requirementTab === 'CREATORS' && styles.requirementTabTextActive]}>Hire Creators</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setRequirementTab('AGENCIES')} style={[styles.requirementTab, requirementTab === 'AGENCIES' && styles.requirementTabActive]}>
                            <Text style={[styles.requirementTabText, requirementTab === 'AGENCIES' && styles.requirementTabTextActive]}>Hire Agencies</Text>
                        </TouchableOpacity>
                    </View>

                    {lastPosted && (
                        <View style={styles.requirementPreview}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <Image source={brandAvatar ? { uri: brandAvatar } : imgDefaultAvatar} style={{ width: 40, height: 40, borderRadius: 20 }} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.previewName} numberOfLines={1}>{brandName || 'Your Brand'}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <View style={[styles.dot, { backgroundColor: palette.success }]} />
                                        <Text style={styles.previewStatus}>Actively Reviewing</Text>
                                    </View>
                                </View>
                            </View>
                            <Text style={styles.previewMessage} numberOfLines={4}>{lastPosted.message}</Text>
                            <Text style={styles.previewTargetType}>
                                {lastPosted.targetType === 'CREATORS' ? 'Looking for Creators' : 'Looking for Agencies'}
                            </Text>
                        </View>
                    )}
                </View>

                {/* ── Freelancers by Category ── */}
                <View style={styles.section}>
                    <SectionHeader title="Freelancers by Category" />
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={FREELANCER_CATEGORIES}
                        keyExtractor={(c) => c.id}
                        contentContainerStyle={{ paddingTop: 12, gap: 10 }}
                        renderItem={({ item: cat }) => (
                            <TouchableOpacity
                                style={styles.catTile}
                                activeOpacity={0.85}
                                onPress={() => router.push({ pathname: '/people-results', params: { title: cat.label.replace('\n', ' '), role: 'FREELANCER', categorySlug: cat.slug } } as any)}
                            >
                                <Image source={cat.image} style={styles.catImage} resizeMode="contain" />
                                <Text style={styles.catLabel} numberOfLines={2}>{cat.label}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>

                {/* ── Celebrities ── */}
                <View style={styles.section}>
                    <SectionHeader title="Celebrities" onViewAll={() => { }} />
                    <Text style={styles.requirementSubtitle}>Handpicked icons trending this week</Text>
                    <View style={styles.peopleGrid}>
                        {celebrities.map((c) => (
                            <View key={c.id} style={styles.celebCard}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Image source={c.photoUrl ? { uri: c.photoUrl } : imgDefaultAvatar} style={styles.celebAvatar} />
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                            <Text style={styles.peopleName} numberOfLines={1}>{c.name}</Text>
                                            {c.isVerified && <Ionicons name="checkmark-circle" size={14} color={BRAND_PRIMARY} />}
                                        </View>
                                        <Text style={styles.peopleSub} numberOfLines={1}>{c.role || ''}</Text>
                                    </View>
                                </View>
                                <Text style={styles.celebFollowers}>{formatCount(c.followerCount)} Followers</Text>
                                {!!c.profileUrl && (
                                    <TouchableOpacity style={styles.viewProfileBtn}>
                                        <Text style={styles.viewProfileText}>View Profile</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                        {celebrities.length === 0 && <Text style={styles.emptyText}>No celebrities yet</Text>}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: palette.background },
    centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    headerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: palette.surface },
    headerHi: { color: palette.textMuted, fontSize: 12, fontFamily: fonts.regular },
    headerName: { color: '#fff', fontSize: 15, fontFamily: fonts.semibold, maxWidth: 180 },
    headerRight: { flexDirection: 'row', gap: 10 },
    headerIconBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },

    hero: { marginHorizontal: 16, borderRadius: 20, padding: 20, marginTop: 4, overflow: 'hidden' },
    heroTitle: { color: '#fff', fontSize: 26, fontFamily: fonts.bold, lineHeight: 32 },
    heroSubtitle: { color: palette.textSecondary, fontSize: 14, fontFamily: fonts.regular, marginTop: 6 },
    heroBtn: { backgroundColor: BRAND_PRIMARY, borderRadius: 24, paddingVertical: 12, paddingHorizontal: 20, alignSelf: 'flex-start', marginTop: 16 },
    heroBtnText: { color: '#fff', fontFamily: fonts.semibold, fontSize: 14 },

    section: { paddingHorizontal: 16, marginTop: 26 },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    sectionTitle: { color: '#fff', fontSize: 17, fontFamily: fonts.semibold },
    viewAll: { color: BRAND_PRIMARY, fontSize: 13, fontFamily: fonts.medium },
    emptyText: { color: palette.textMuted, fontSize: 13, fontFamily: fonts.regular, paddingVertical: 8 },

    chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18, borderWidth: 1, borderColor: palette.borderStrong, marginRight: 8 },
    chipText: { color: palette.textSecondary, fontSize: 12, fontFamily: fonts.medium },

    channelCard: { width: 100, alignItems: 'center', backgroundColor: palette.surface, borderRadius: 16, padding: 12 },
    channelLogo: { width: 48, height: 48, borderRadius: 24, backgroundColor: palette.surfaceAlt },
    channelName: { color: '#fff', fontSize: 12, fontFamily: fonts.semibold, marginTop: 8, textAlign: 'center' },
    channelSubs: { color: palette.textMuted, fontSize: 10, fontFamily: fonts.regular, marginTop: 2 },
    channelCatRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    channelCat: { color: palette.textMuted, fontSize: 10, fontFamily: fonts.regular },
    dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: palette.success },

    adTypeCard: { width: 92, height: 92, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surface, gap: 8 },
    adTypeIconWrap: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    adTypeName: { color: '#fff', fontSize: 11, fontFamily: fonts.medium, textAlign: 'center', paddingHorizontal: 4 },

    peopleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
    peopleCard: { width: '31%', backgroundColor: palette.surface, borderRadius: 14, padding: 10, alignItems: 'center' },
    peopleAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: palette.surfaceAlt },
    peopleName: { color: '#fff', fontSize: 12, fontFamily: fonts.semibold, marginTop: 6 },
    peopleSub: { color: palette.textMuted, fontSize: 10, fontFamily: fonts.regular, marginTop: 1 },

    cityCard: { width: 100, height: 90, borderRadius: 16, overflow: 'hidden' },
    cityImage: { width: '100%', height: '100%', position: 'absolute' },
    cityOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
    cityName: { position: 'absolute', bottom: 8, left: 8, right: 8, color: '#fff', fontSize: 12, fontFamily: fonts.semibold },

    requirementSubtitle: { color: palette.textMuted, fontSize: 12, fontFamily: fonts.regular, marginTop: 4 },
    requirementInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: palette.surface, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, marginTop: 14 },
    requirementInput: { flex: 1, color: '#fff', fontSize: 13, fontFamily: fonts.regular, maxHeight: 80 },
    requirementTabs: { flexDirection: 'row', marginTop: 14, borderBottomWidth: 1, borderBottomColor: palette.borderSoft },
    requirementTab: { paddingVertical: 10, marginRight: 24, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    requirementTabActive: { borderBottomColor: BRAND_PRIMARY },
    requirementTabText: { color: palette.textMuted, fontSize: 13, fontFamily: fonts.medium },
    requirementTabTextActive: { color: '#fff' },

    requirementPreview: { backgroundColor: palette.surface, borderRadius: 16, padding: 14, marginTop: 16, gap: 10 },
    previewName: { color: '#fff', fontSize: 14, fontFamily: fonts.semibold },
    previewStatus: { color: palette.success, fontSize: 11, fontFamily: fonts.medium },
    previewMessage: { color: palette.textSecondary, fontSize: 12, fontFamily: fonts.regular, lineHeight: 18 },
    previewTargetType: { color: BRAND_PRIMARY, fontSize: 12, fontFamily: fonts.medium },

    catTile: { width: 90, alignItems: 'center', backgroundColor: palette.surface, borderRadius: 16, padding: 12, gap: 8 },
    catImage: { width: 32, height: 32 },
    catLabel: { color: '#fff', fontSize: 11, fontFamily: fonts.medium, textAlign: 'center' },

    celebCard: { width: '48%', backgroundColor: palette.surface, borderRadius: 16, padding: 12, gap: 8 },
    celebAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: palette.surfaceAlt },
    celebFollowers: { color: palette.textMuted, fontSize: 11, fontFamily: fonts.regular },
    viewProfileBtn: { backgroundColor: BRAND_PRIMARY, borderRadius: 18, paddingVertical: 8, alignItems: 'center' },
    viewProfileText: { color: '#fff', fontSize: 11, fontFamily: fonts.semibold },
});
