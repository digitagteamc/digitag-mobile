import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    FlatList,
    Image,
    ImageBackground,
    ActivityIndicator,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { CREATOR_CAT_SVGS } from '../assets/creator-cat';
import { useAuth } from '../context/AuthContext';
import {
    createBrandRequirement,
    getCelebrities,
    getFollowSuggestions,
    getMyBrandProfile,
    getYoutubeChannels,
} from '../services/userService';
import { palette } from '../theme/colors';

// Brand's own accent — indigo/purple, matching the mock (Complete Profile
// button, Send Request gradient, bottom nav). Not part of theme/colors.ts's
// rolePalettes since that type is CREATOR|FREELANCER only throughout the
// app; kept local here rather than widening a type used in ~30 other files
// for one new role.
const BRAND_PRIMARY = '#4F46E5';
const BRAND_GRADIENT: [string, string] = ['#6D5EF5', '#4F46E5'];

const imgHeroBg = require('../assets/herobrand.png');
const imgSectionBg = require('../assets/background.png');
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

// Per-city landmark photos for "Creators by location" — keyed by the exact
// city name used in CITIES below. Filename spellings ("Banglore", no "a")
// come from the asset folder as-is, not a typo introduced here.
const CITY_IMAGES: Record<string, any> = {
    Hyderabad: require('../assets/Brands/Locations/Hyderabad.png'),
    Bangalore: require('../assets/Brands/Locations/Banglore.png'),
    Delhi: require('../assets/Brands/Locations/Delhi.png'),
    Gurugaon: require('../assets/Brands/Locations/Gurugaon.png'),
    Chennai: require('../assets/Brands/Locations/Chennai.png'),
    Kolkata: require('../assets/Brands/Locations/Kolkata.png'),
    Mumbai: require('../assets/Brands/Locations/Mumbai.png'),
    Pune: require('../assets/Brands/Locations/Pune.png'),
};
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

// Creator Categories — same full 26-category list and creator-cat SVG icon
// set as the Creator/Freelancer home page's "Creators by Category" grid
// (app/(tabs)/index.tsx's FREELANCER_CATEGORIES, which despite the name is
// the creator content-category list keyed against assets/creator-cat).
const CREATOR_CATEGORIES = [
    { id: 'f1', label: 'Lifestyle &\nLiving', svgXml: CREATOR_CAT_SVGS['Lifestyle-Living'] },
    { id: 'f2', label: 'Tech', svgXml: CREATOR_CAT_SVGS['Tech'] },
    { id: 'f3', label: 'Education', svgXml: CREATOR_CAT_SVGS['Education'] },
    { id: 'f4', label: 'Photography', svgXml: CREATOR_CAT_SVGS['Photography'] },
    { id: 'f5', label: 'Food', svgXml: CREATOR_CAT_SVGS['Food'] },
    { id: 'f6', label: 'Health', svgXml: CREATOR_CAT_SVGS['Health'] },
    { id: 'f7', label: 'Automotive', svgXml: CREATOR_CAT_SVGS['Automotive'] },
    { id: 'f8', label: 'Comedy &\nMemes', svgXml: CREATOR_CAT_SVGS['Comedy-Memes'] },
    { id: 'f9', label: 'Entertainment', svgXml: CREATOR_CAT_SVGS['Entertainment'] },
    { id: 'f10', label: 'Gaming &\nAnime', svgXml: CREATOR_CAT_SVGS['Gaming-Anime'] },
    { id: 'f11', label: 'Learning', svgXml: CREATOR_CAT_SVGS['Learning'] },
    { id: 'f12', label: 'News, Media\n& Magazins', svgXml: CREATOR_CAT_SVGS['News-Media-Magazins'] },
    { id: 'f13', label: 'Sports', svgXml: CREATOR_CAT_SVGS['Sports'] },
    { id: 'f14', label: 'Travel', svgXml: CREATOR_CAT_SVGS['Travel'] },
    { id: 'f15', label: 'Beauty', svgXml: CREATOR_CAT_SVGS['Beauty'] },
    { id: 'f16', label: 'Fitness', svgXml: CREATOR_CAT_SVGS['Fitness'] },
    { id: 'f17', label: 'Fashion', svgXml: CREATOR_CAT_SVGS['Fashion'] },
    { id: 'f18', label: 'Finance &\nInvestments', svgXml: CREATOR_CAT_SVGS['Finance-Investments'] },
    { id: 'f19', label: 'Arts', svgXml: CREATOR_CAT_SVGS['Arts'] },
    { id: 'f20', label: 'Business &\nStartups', svgXml: CREATOR_CAT_SVGS['Business-Startups'] },
    { id: 'f21', label: 'Community\nPages', svgXml: CREATOR_CAT_SVGS['Community-Pages'] },
    { id: 'f22', label: 'Family, Kids\n& Pets', svgXml: CREATOR_CAT_SVGS['Family-Kids-Pets'] },
    { id: 'f23', label: 'Home &\nDecor', svgXml: CREATOR_CAT_SVGS['Home-Decor'] },
    { id: 'f24', label: 'Law, Rights\n& Activism', svgXml: CREATOR_CAT_SVGS['Law-Rights-Activism'] },
    { id: 'f25', label: 'Pets &\nAnimals', svgXml: CREATOR_CAT_SVGS['Pets-Animals'] },
    { id: 'f26', label: 'Politics', svgXml: CREATOR_CAT_SVGS['Politics'] },
];

// No existing city list/data source anywhere in the app (checked this
// session) — fixed showcase set, same convention as the app's other fixed
// category arrays. Filtering matches CreatorProfile/FreelancerProfile's
// free-text `location` field via a contains match, not a strict city model.
const CITIES = ['Hyderabad', 'Bangalore', 'Delhi', 'Gurugaon', 'Chennai', 'Kolkata', 'Mumbai', 'Pune'];

const YT_FILTER_CHIPS = ['All', 'Podcast', 'Tech', 'Education', 'Others'];

// Same gradient-border palette as the Creator/Freelancer home category grid
// (app/(tabs)/index.tsx) — cycled by each category's index in its own list.
const CAT_BORDER_COLORS = [
    ['rgba(52, 52, 52, 1)', 'rgba(255, 51, 0, 0.5)'],
    ['rgba(52, 52, 52, 1)', 'rgba(0, 183, 255, 0.5)'],
    ['rgba(52, 52, 52, 1)', 'rgba(255, 238, 1, 0.5)'],
    ['rgba(52, 52, 52, 1)', 'rgba(1, 255, 35, 0.5)'],
    ['rgba(52, 52, 52, 1)', 'rgba(12, 62, 179, 0.5)'],
    ['rgba(52, 52, 52, 1)', 'rgba(143, 12, 229, 0.5)'],
    ['rgba(52, 52, 52, 1)', 'rgba(240, 0, 160, 0.5)'],
    ['rgba(52, 52, 52, 1)', 'rgba(250, 71, 0, 0.5)'],
    ['rgba(52, 52, 52, 1)', 'rgba(255, 51, 0, 0.5)'],
    ['rgba(52, 52, 52, 1)', 'rgba(0, 183, 255, 0.5)'],
];

// Same chip shape/border/sizing as the Creator/Freelancer home category grid
// — gradient-bordered dark card, icon or image, label underneath.
function CategoryChip({ cat, colorIndex, onPress }: { cat: any; colorIndex: number; onPress?: () => void }) {
    const borderColors = (CAT_BORDER_COLORS[colorIndex % CAT_BORDER_COLORS.length] || ['#333', '#333']) as [string, string];
    return (
        <TouchableOpacity style={{ width: 100, height: 96 }} onPress={onPress} activeOpacity={0.8}>
            <LinearGradient
                colors={borderColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ width: 90, height: 86, borderRadius: 24, padding: 1 }}
            >
                <View
                    style={{
                        backgroundColor: '#050404',
                        borderRadius: 22.8,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 1,
                        paddingHorizontal: 1,
                        width: '100%',
                        height: '100%',
                    }}
                >
                    {cat.svgXml ? (
                        <SvgXml xml={cat.svgXml} width={25} height={25} style={{ width: 26, height: 24, marginBottom: 4 }} />
                    ) : cat.image ? (
                        <Image source={cat.image} style={{ width: 26, height: 20, marginBottom: 8 }} resizeMode="contain" />
                    ) : (
                        <Ionicons name={cat.icon} size={28} color="#aaa" />
                    )}
                    <Text
                        style={{
                            color: '#fff',
                            fontSize: 10,
                            fontFamily: 'Poppins_400Regular',
                            textAlign: 'center',
                            lineHeight: 14,
                            width: '100%',
                            alignSelf: 'stretch',
                        }}
                        numberOfLines={/[\n ]/.test(cat.label) ? 2 : 1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.6}
                    >
                        {cat.label}
                    </Text>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
}

function formatCount(n?: number | null) {
    if (!n) return '0';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

function SectionHeader({ title, onViewAll }: { title: string; subtitle?: string; onViewAll?: () => void }) {
    return (
        <View className="flex-row items-center justify-between">
            <Text className="text-white text-xl font-poppins-semibold" style={{ letterSpacing: -0.5 }}>{title}</Text>
            {onViewAll ? (
                <TouchableOpacity
                    onPress={onViewAll}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    className="rounded-full px-4 py-2.5 border"
                    style={{ backgroundColor: 'rgba(66,62,62,0.1)', borderColor: 'rgba(64,64,64,0.5)' }}
                >
                    <Text className="text-white text-xs font-poppins-medium text-center">View all</Text>
                </TouchableOpacity>
            ) : null}
        </View>
    );
}

// Pagination dots for the Top Creators carousel
function PaginationDots({ total, active }: { total: number; active: number }) {
    if (total <= 1) return null;
    return (
        <View className="flex-row justify-center mt-3.5" style={{ gap: 6 }}>
            {Array.from({ length: total }).map((_, i) => (
                <View
                    key={i}
                    className="h-1.5 rounded"
                    style={[
                        { width: i === active ? 14 : 6 },
                        { backgroundColor: i === active ? '#fff' : 'rgba(255,255,255,0.2)' },
                    ]}
                />
            ))}
        </View>
    );
}

const DUMMY_YOUTUBE_CHANNELS = [
    { id: 'yt-1', name: 'Suman Tv', subscriberCount: 4200000, category: 'News', logoUrl: null },
    { id: 'yt-2', name: 'TV 9', subscriberCount: 2200000, category: 'News', logoUrl: null },
    { id: 'yt-3', name: 'Aha', subscriberCount: 6200000, category: 'Entertainment', logoUrl: null },
    { id: 'yt-4', name: 'IDream', subscriberCount: 4240000, category: 'Entertainment', logoUrl: null },
    { id: 'yt-5', name: 'NTV', subscriberCount: 6200000, category: 'News', logoUrl: null },
];

const DUMMY_TOP_CREATORS = [
    { id: 'c-1', name: 'Priya Sharma', categoryNames: ['Fashion', 'Beauty'], profilePicture: null },
    { id: 'c-2', name: 'FreshBrew Co.', categoryNames: ['Entertainment'], profilePicture: null },
    { id: 'c-3', name: 'Aadhya Sharma', categoryNames: ['Beauty'], profilePicture: null },
    { id: 'c-4', name: 'Keshav Reddy', categoryNames: ['News'], profilePicture: null },
    { id: 'c-5', name: 'Rohit Nair', categoryNames: ['Podcast'], profilePicture: null },
    { id: 'c-6', name: 'Rudrakshika', categoryNames: ['Beauty'], profilePicture: null },
];

const DUMMY_CELEBRITIES = [
    { id: 'cel-1', name: 'Meera Iyer', role: 'Actor', followerCount: 12400000, isVerified: true, photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80' },
    { id: 'cel-2', name: 'Aryan Kapoor', role: 'Singer', followerCount: 8900000, isVerified: true, photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80' },
    { id: 'cel-3', name: 'Simran Kaur', role: 'Comedian', followerCount: 15200000, isVerified: true, photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80' },
    { id: 'cel-4', name: 'Vikram Rao', role: 'Dancer', followerCount: 6100000, isVerified: true, photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80' },
    { id: 'cel-5', name: 'Aditya Malhotra', role: 'Sports Star', followerCount: 20700000, isVerified: true, photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80' },
    { id: 'cel-6', name: 'Kavya Menon', role: 'Influencer', followerCount: 4300000, isVerified: true, photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80' },
];

export default function BrandHome() {
    const router = useRouter();
    const { token } = useAuth();
    // Recomputed on rotation/fold instead of a module-level snapshot, so the
    // location tiles stay correctly sized across phones, tablets, and
    // foldables. Design spec is 93x100 — 4 cols with 10px gaps and 16px
    // padding each side; capped at 93 so it only shrinks (never grows past
    // spec) on wider screens.
    const { width: screenWidth } = useWindowDimensions();
    const CITY_TILE_WIDTH = Math.min(93, (screenWidth - 32 - 30) / 4);

    const [brandName, setBrandName] = useState('');
    const [brandAvatar, setBrandAvatar] = useState<string | null>(null);

    const [channels, setChannels] = useState<any[]>(DUMMY_YOUTUBE_CHANNELS);
    const [channelFilter, setChannelFilter] = useState('All');
    const [topCreators, setTopCreators] = useState<any[]>(DUMMY_TOP_CREATORS);
    const [celebrities, setCelebrities] = useState<any[]>(DUMMY_CELEBRITIES);
    const [loading, setLoading] = useState(true);

    // "Who are you looking for?" composer
    const [requirementTab, setRequirementTab] = useState<'CREATORS' | 'AGENCIES'>('CREATORS');
    const [requirementText, setRequirementText] = useState('');
    const [posting, setPosting] = useState(false);
    const [lastPosted, setLastPosted] = useState<{ message: string; targetType: 'CREATORS' | 'AGENCIES' } | null>(null);

    // Top Creators carousel page tracking
    const [creatorsPage, setCreatorsPage] = useState(0);

    const load = useCallback(async () => {
        if (!token) { setLoading(false); return; }
        const [profileRes, channelsRes, creatorsRes, celebsRes] = await Promise.all([
            getMyBrandProfile(token),
            getYoutubeChannels(token),
            getFollowSuggestions(token, 6, { role: 'CREATOR' }),
            getCelebrities(token),
        ]);
        if (profileRes.success && profileRes.data) {
            setBrandName(profileRes.data.name || '');
            setBrandAvatar(profileRes.data.profilePicture || null);
        }
        if (channelsRes.success && channelsRes.data && channelsRes.data.length > 0) {
            setChannels(channelsRes.data);
        } else {
            setChannels(DUMMY_YOUTUBE_CHANNELS);
        }
        if (creatorsRes.success && creatorsRes.data && creatorsRes.data.length > 0) {
            setTopCreators(creatorsRes.data);
        } else {
            setTopCreators(DUMMY_TOP_CREATORS);
        }
        if (celebsRes.success && celebsRes.data && celebsRes.data.length > 0) {
            setCelebrities(celebsRes.data);
        } else {
            setCelebrities(DUMMY_CELEBRITIES);
        }
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

    // chunk topCreators into rows of 3 for the carousel
    const creatorRows: any[][] = [];
    for (let i = 0; i < topCreators.length; i += 3) {
        creatorRows.push(topCreators.slice(i, i + 3));
    }

    // chunk cities into 2 rows of 4
    const cityRows: string[][] = [];
    for (let i = 0; i < CITIES.length; i += 4) {
        cityRows.push(CITIES.slice(i, i + 4));
    }

    if (loading) {
        return (
            <SafeAreaView className="flex-1" style={{ backgroundColor: palette.background }} edges={['top']}>
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color={BRAND_PRIMARY} size="large" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: palette.background }} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* ── Top Hero Banner with Background Image ── */}
                <ImageBackground source={imgHeroBg} className="w-full overflow-hidden " style={{ minHeight: 330 }} resizeMode="cover">
                    <View className="flex-1 ">
                        {/* ── Header ── */}
                        <View className="flex-row items-center justify-between px-4 py-3">
                            <TouchableOpacity
                                className="flex-row items-center flex-1 gap-2.5"
                                activeOpacity={0.8}
                                onPress={() => router.push('/(tabs)/profile' as any)}
                            >
                                <Image
                                    source={brandAvatar ? { uri: brandAvatar } : imgDefaultAvatar}
                                    className="w-11 h-11 rounded-full"
                                    style={{ backgroundColor: palette.surface }}
                                />
                                <View>
                                    <Text className="text-white text-sm font-poppins-regular opacity-90">Hi</Text>
                                    <Text className="text-white text-base font-poppins-semibold max-w-[180px]" numberOfLines={1}>
                                        {brandName || 'Welcome To Digitag'}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                            <View className="flex-row gap-2.5">
                                <TouchableOpacity
                                    className="items-center justify-center w-[38px] h-[38px] rounded-full bg-white/15"
                                    onPress={() => router.push('/analytics-brand' as any)}
                                >
                                    <Ionicons name="stats-chart-outline" size={18} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className="items-center justify-center w-[38px] h-[38px] rounded-full bg-white/15"
                                    onPress={() => router.push('/notifications' as any)}
                                >
                                    <Ionicons name="notifications-outline" size={18} color="#fff" />
                                    <View className="absolute top-2 right-2 w-[7px] h-[7px] rounded-full bg-red-500" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* ── Hero Center Content ── */}
                        <View className="items-center justify-center px-5 pt-4 pb-3">
                            <Text className="text-white text-[32px] font-poppins-semibold text-center tracking-tight">
                                Connect with Top
                            </Text>
                            <Text className="text-[#FFDF20] text-[46px] text-center font-bold italic -mt-2.5 tracking-tight">
                                Influencers
                            </Text>
                            <Text className="text-white text-[14px] font-poppins-semibold text-center  ">
                                100K+ Creators
                            </Text>
                            <TouchableOpacity
                                className="self-center rounded-full items-center justify-center bg-[#253E93] py-2 px-4 mt-[18px]"
                                style={{
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 6,
                                    elevation: 5,
                                }}
                                onPress={() => router.push('/Brands-completeprofile' as any)}
                                activeOpacity={0.85}
                            >
                                <Text className="text-white text-[13px] font-poppins-medium">Complete Profile</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ImageBackground>

                {/* ── Top YouTube Channels → Ad Types share one background image ──
                    imageStyle (not style) holds the top/left/right/bottom
                    offsets — style is the outer container that also lays out
                    the content, so putting offsets there dragged the content
                    along with the image; imageStyle only affects the
                    rendered background image itself. */}
                <ImageBackground
                    source={imgSectionBg}
                    resizeMode="cover"
                    imageStyle={{ top: 0, left: 0, right: -220, bottom: -40 }}
                >
                {/* ── Top YouTube Channels ── */}
                <View className="px-4 mt-7">
                    <SectionHeader title="Top youtube channels" onViewAll={() => router.push('/youtube-channels' as any)} />
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12, marginBottom: 4 }}>
                        {YT_FILTER_CHIPS.map((chip) => (
                            <TouchableOpacity
                                key={chip}
                                onPress={() => setChannelFilter(chip)}
                                className="rounded-2xl mr-1.5 border"
                                style={[
                                    { paddingHorizontal: 18, paddingVertical: 8, borderColor: palette.borderStrong },
                                    channelFilter === chip && { backgroundColor: BRAND_PRIMARY, borderColor: BRAND_PRIMARY },
                                ]}
                            >
                                <Text
                                    className="text-xs font-poppins-medium"
                                    style={[
                                        { color: palette.textSecondary },
                                        channelFilter === chip && { color: '#fff' },
                                    ]}
                                >
                                    {chip}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={filteredChannels}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ paddingTop: 12, gap: 9 }}
                        ListEmptyComponent={
                            <Text className="text-xs font-poppins-regular py-2" style={{ color: palette.textMuted }}>
                                No channels yet
                            </Text>
                        }
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() =>
                                    router.push({
                                        pathname: '/youtube-channel-detail',
                                        params: {
                                            channelId: item.id,
                                            name: item.name,
                                            subscriberCount: item.subscriberCount,
                                            category: item.category,
                                            logoUrl: item.logoUrl,
                                        },
                                    } as any)
                                }
                                className="items-center rounded-3xl p-4 border"
                                style={{
                                    width: 130,
                                    height: 158,
                                    backgroundColor: '#1a1a1a',
                                    borderColor: 'rgba(153,153,153,0.3)',
                                }}
                            >
                                <View
                                    className="overflow-hidden mb-2"
                                    style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 24,
                                        borderWidth: 2,
                                        borderColor: 'rgba(255,255,255,0.15)',
                                    }}
                                >
                                    <Image
                                        source={item.logoUrl ? { uri: item.logoUrl } : imgDefaultAvatar}
                                        style={{ width: '100%', height: '100%', borderRadius: 24 }}
                                    />
                                </View>
                                <Text className="text-white text-xs font-poppins-semibold mt-1 text-center" numberOfLines={1}>
                                    {item.name}
                                </Text>
                                <Text className="text-xs font-poppins-regular mt-0.5" style={{ color: palette.textMuted }}>
                                    {formatCount(item.subscriberCount)} Subs
                                </Text>
                                {!!item.category && (
                                    <View className="flex-row items-center mt-1" style={{ gap: 4 }}>
                                        <View
                                            className="rounded-full"
                                            style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: palette.success }}
                                        />
                                        <Text className="text-xs font-poppins-regular" style={{ fontSize: 10, color: palette.textMuted }}>
                                            {item.category}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        )}
                    />
                </View>

                </ImageBackground>

                {/* ── Top Creators ── */}
                <View className="px-4 mt-7">
                    <SectionHeader title="Top Creators" onViewAll={() => { }} />
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={topCreators}
                        keyExtractor={(c) => c.id}
                        contentContainerStyle={{ paddingTop: 16, gap: 12 }}
                        ListEmptyComponent={
                            <Text className="text-xs font-poppins-regular py-2" style={{ color: palette.textMuted }}>
                                No creators yet
                            </Text>
                        }
                        renderItem={({ item: c }) => (
                            <TouchableOpacity
                                className="rounded-3xl p-4 border"
                                style={{
                                    width: 168,
                                    height: 162,
                                    backgroundColor: '#1a1a1a',
                                    borderColor: 'rgba(153,153,153,0.25)',
                                }}
                                activeOpacity={0.85}
                                onPress={() => router.push({ pathname: '/brands-creator', params: { userId: c.id } } as any)}
                            >
                                <Image
                                    source={c.profilePicture ? { uri: c.profilePicture } : imgDefaultAvatar}
                                    className="rounded-full"
                                    style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: palette.surfaceAlt }}
                                />
                                <Text
                                    className="text-white text-base font-poppins-regular"
                                    style={{ marginTop: 6, letterSpacing: -0.5 }}
                                    numberOfLines={1}
                                >
                                    {c.name || 'Creator'}
                                </Text>
                                {/* Category tags */}
                                <View className="flex-row mt-1.5" style={{ gap: 6 }}>
                                    {(c.categoryNames || ['Creator']).slice(0, 2).map((cat: string, i: number) => (
                                        <View
                                            key={i}
                                            className="rounded px-1 py-0.5"
                                            style={{ backgroundColor: '#333435' }}
                                        >
                                            <Text
                                                className="text-white font-poppins-regular"
                                                style={{ fontSize: 10, letterSpacing: -0.5 }}
                                            >
                                                {cat}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                                {/* Social icons row */}
                                <View className="flex-row mt-2" style={{ gap: 8 }}>
                                    <Ionicons name="logo-youtube" size={14} color="#FF0000" />
                                    <Ionicons name="logo-instagram" size={14} color="#E1306C" />
                                    <Ionicons name="logo-facebook" size={14} color="#1877F2" />
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                    <PaginationDots total={creatorRows.length} active={creatorsPage} />
                </View>

                {/* ── Creator Categories ── */}
                <View className="px-4 mt-7">
                    <SectionHeader title="Creator Categories" onViewAll={() => router.push('/All-creators' as any)} />
                    {/* Render as a 2-row scrollable grid */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                        <View>
                            <View className="flex-row" style={{ gap: 2 }}>
                                {CREATOR_CATEGORIES.filter((_, i) => i % 2 === 0).map((cat) => (
                                    <CategoryChip key={cat.id} cat={cat} colorIndex={CREATOR_CATEGORIES.findIndex(c => c.id === cat.id)} />
                                ))}
                            </View>
                            <View className="flex-row" style={{ gap: 2, marginTop: 6 }}>
                                {CREATOR_CATEGORIES.filter((_, i) => i % 2 === 1).map((cat) => (
                                    <CategoryChip key={cat.id} cat={cat} colorIndex={CREATOR_CATEGORIES.findIndex(c => c.id === cat.id)} />
                                ))}
                            </View>
                        </View>
                    </ScrollView>
                </View>

                {/* ── Creators by Location ── */}
                <View className="px-4 mt-7">
                    <SectionHeader title="Creators by location" onViewAll={() => router.push('/choose-location' as any)} />
                    <View className="flex-row flex-wrap mt-3" style={{ gap: 10 }}>
                        {CITIES.map((city) => (
                            <TouchableOpacity
                                key={city}
                                className="overflow-hidden rounded-2xl"
                                style={{ width: CITY_TILE_WIDTH, height: 100 }}
                                
                                onPress={() => router.push({ pathname: '/people-results', params: { title: `Creators in ${city}`, role: 'CREATOR', location: city } } as any)}
                            >
                                <Image
                                    source={CITY_IMAGES[city] || imgLocation}
                                    style={{ width: '100%', height: '100%', position: 'absolute', }}
                                    resizeMode="cover"
                                />
                                <View
                                    className="absolute inset-0"

                                    />
                                <Text
                                    className="absolute text-#000 font-poppins-semibold align-items-center x"
                                    style={{ top: 10, left: 10, right: 6, fontSize: 11 }}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                    minimumFontScale={0.7}
                                >
                                    {city}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* ── Who are you looking for? ── */}
                <View className="px-4 mt-7">
                    <Text className="text-white text-xl font-poppins-semibold" style={{ letterSpacing: -0.5 }}>
                        Who are you looking for?
                    </Text>
                    <Text
                        className="text-xs font-poppins-regular mt-1"
                        style={{ color: 'rgba(208,226,255,0.65)' }}
                    >
                        Post your requirement & receive responses, Instantly....
                    </Text>

                    <View
                        className="flex-row items-center rounded-2xl px-3.5 py-2.5 mt-3.5"
                        style={{ gap: 10, backgroundColor: palette.surface }}
                    >
                        <Ionicons name="person-circle-outline" size={20} color="#8A8A99" />
                        <TextInput
                            className="flex-1 text-white text-sm font-poppins-regular"
                            style={{ maxHeight: 80 }}
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

                    <View
                        className="flex-row mt-3.5 border-b"
                        style={{ borderBottomColor: palette.borderSoft }}
                    >
                        <TouchableOpacity
                            onPress={() => setRequirementTab('CREATORS')}
                            className="py-2.5 mr-6 border-b-2"
                            style={{ borderBottomColor: requirementTab === 'CREATORS' ? BRAND_PRIMARY : 'transparent' }}
                        >
                            <Text
                                className="text-sm font-poppins-medium"
                                style={{ color: requirementTab === 'CREATORS' ? '#fff' : palette.textMuted }}
                            >
                                Hire Creators
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setRequirementTab('AGENCIES')}
                            className="py-2.5 mr-6 border-b-2"
                            style={{ borderBottomColor: requirementTab === 'AGENCIES' ? BRAND_PRIMARY : 'transparent' }}
                        >
                            <Text
                                className="text-sm font-poppins-medium"
                                style={{ color: requirementTab === 'AGENCIES' ? '#fff' : palette.textMuted }}
                            >
                                Hire Agencies
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {lastPosted && (
                        <View
                            className="rounded-2xl p-3.5 mt-4"
                            style={{ backgroundColor: palette.surface, gap: 10 }}
                        >
                            <View className="flex-row items-center" style={{ gap: 10 }}>
                                <Image
                                    source={brandAvatar ? { uri: brandAvatar } : imgDefaultAvatar}
                                    style={{ width: 40, height: 40, borderRadius: 20 }}
                                />
                                <View className="flex-1">
                                    <Text className="text-white text-sm font-poppins-semibold" numberOfLines={1}>
                                        {brandName || 'Your Brand'}
                                    </Text>
                                    <View className="flex-row items-center" style={{ gap: 6 }}>
                                        <View
                                            className="rounded-full"
                                            style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: palette.success }}
                                        />
                                        <Text className="font-poppins-medium" style={{ color: palette.success, fontSize: 11 }}>
                                            Actively Reviewing
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <Text
                                className="font-poppins-regular"
                                style={{ color: palette.textSecondary, fontSize: 12, lineHeight: 18 }}
                                numberOfLines={4}
                            >
                                {lastPosted.message}
                            </Text>
                            <Text className="text-xs font-poppins-medium" style={{ color: BRAND_PRIMARY }}>
                                {lastPosted.targetType === 'CREATORS' ? 'Looking for Creators' : 'Looking for Agencies'}
                            </Text>
                        </View>
                    )}
                </View>

                {/* ── Freelancers by Category ── */}
                <View className="px-4 mt-7">
                    <SectionHeader title="Freelancers by Category" />
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                        <View>
                            <View className="flex-row" style={{ gap: 2 }}>
                                {FREELANCER_CATEGORIES.filter((_, i) => i < 6).map((cat) => (
                                    <CategoryChip
                                        key={cat.id}
                                        cat={cat}
                                        colorIndex={FREELANCER_CATEGORIES.findIndex(c => c.id === cat.id)}
                                        onPress={() => router.push({ pathname: '/people-results', params: { title: cat.label.replace('\n', ' '), role: 'FREELANCER', categorySlug: cat.slug } } as any)}
                                    />
                                ))}
                            </View>
                            <View className="flex-row" style={{ gap: 2, marginTop: 6 }}>
                                {FREELANCER_CATEGORIES.filter((_, i) => i >= 6).map((cat) => (
                                    <CategoryChip
                                        key={cat.id}
                                        cat={cat}
                                        colorIndex={FREELANCER_CATEGORIES.findIndex(c => c.id === cat.id)}
                                        onPress={() => router.push({ pathname: '/people-results', params: { title: cat.label.replace('\n', ' '), role: 'FREELANCER', categorySlug: cat.slug } } as any)}
                                    />
                                ))}
                            </View>
                        </View>
                    </ScrollView>
                </View>

                {/* ── Celebrities ── */}
                <View className="px-4 mt-7 mb-10">
                    <SectionHeader title="Celebrities" onViewAll={() => { }} />
                    <Text
                        className="font-poppins-regular mt-0.5"
                        style={{ color: '#94A3B8', fontSize: 11 }}
                    >
                        Handpicked icons trending this week
                    </Text>
                    <View className="flex-row flex-wrap mt-2" style={{ gap: 8, marginBottom: 30 }}>
                        {celebrities.map((c) => (
                            <View
                                key={c.id}
                                className="items-center"
                                style={{ width: Math.floor((screenWidth - 32 - 16) / 3), marginTop: 28 }}
                            >
                                {/* Glowing Avatar protruding above card */}
                                <View
                                    style={{
                                        position: 'absolute',
                                        top: -24,
                                        zIndex: 10,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <View
                                        style={{
                                            width: 58,
                                            height: 58,
                                            borderRadius: 29,
                                            borderWidth: 2,
                                            borderColor: '#1A8CFF',
                                            backgroundColor: '#0B0F19',
                                            padding: 1.5,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            shadowColor: '#84CC16',
                                            shadowOffset: { width: 0, height: 0 },
                                            shadowOpacity: 0.8,
                                            shadowRadius: 6,
                                            elevation: 5,
                                        }}
                                    >
                                        <Image
                                            source={c.photoUrl ? { uri: c.photoUrl } : imgDefaultAvatar}
                                            style={{ width: '100%', height: '100%', borderRadius: 27, backgroundColor: palette.surfaceAlt }}
                                        />
                                    </View>
                                    {c.isVerified !== false && (
                                        <View
                                            style={{
                                                position: 'absolute',
                                                right: 0,
                                                bottom: 0,
                                                width: 16,
                                                height: 16,
                                                borderRadius: 8,
                                                backgroundColor: '#84CC16',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderWidth: 1.5,
                                                borderColor: '#0B0F19',
                                            }}
                                        >
                                            <Ionicons name="checkmark-sharp" size={9} color="#000" />
                                        </View>
                                    )}
                                </View>

                                {/* Dark Card Box */}
                                <View
                                    style={{
                                        width: '100%',
                                        backgroundColor: '#0F1626',
                                        borderRadius: 20,
                                        borderWidth: 1,
                                        borderColor: 'rgba(59, 130, 246, 0.3)',
                                        alignItems: 'center',
                                        paddingTop: 38,
                                        paddingBottom: 12,
                                        paddingHorizontal: 4,
                                    }}
                                >
                                    <Text
                                        className="text-white font-poppins-semibold text-center"
                                        style={{ fontSize: 12 }}
                                        numberOfLines={1}
                                    >
                                        {c.name}
                                    </Text>
                                    {!!c.role && (
                                        <View
                                            style={{
                                                backgroundColor: 'rgba(30, 58, 138, 0.45)',
                                                paddingHorizontal: 8,
                                                paddingVertical: 2,
                                                borderRadius: 10,
                                                marginTop: 4,
                                            }}
                                        >
                                            <Text
                                                style={{ color: '#38BDF8', fontSize: 10, fontFamily: 'Poppins_500Medium' }}
                                            >
                                                {c.role}
                                            </Text>
                                        </View>
                                    )}
                                    <Text
                                        style={{ color: '#94A3B8', fontSize: 10, fontFamily: 'Poppins_500Medium', marginTop: 6, marginBottom: 10 }}
                                    >
                                        {formatCount(c.followerCount)} Followers
                                    </Text>
                                    <LinearGradient
                                        colors={['rgba(26, 140, 255, 1)', 'rgba(108, 71, 255, 1)']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={{
                                            width: '90%',
                                            borderRadius: 99,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <TouchableOpacity
                                            style={{ paddingVertical: 7, alignItems: 'center', justifyContent: 'center' }}
                                            activeOpacity={0.8}
                                            onPress={() => router.push({
                                                pathname: '/celebrity-profile',
                                                params: {
                                                    name: c.name,
                                                    role: c.role,
                                                    followerCount: String(c.followerCount ?? 0),
                                                    photoUrl: c.photoUrl ?? '',
                                                    isVerified: c.isVerified !== false ? 'true' : 'false',
                                                },
                                            } as any)}
                                        >
                                            <Text className="text-white font-poppins-semibold" style={{ fontSize: 10 }}>
                                                View Profile
                                            </Text>
                                        </TouchableOpacity>
                                    </LinearGradient>
                                </View>
                            </View>
                        ))}
                        {celebrities.length === 0 && (
                            <Text className="font-poppins-regular py-2" style={{ color: palette.textMuted, fontSize: 13 }}>
                                No celebrities yet
                            </Text>
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
