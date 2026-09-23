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
import Svg, { Path } from 'react-native-svg';
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
const imgHireAgencies = require('../assets/Brands/hire-agencies.png');

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
// slug — real backend Category slug for each (same f1-f26 → slug mapping as
// app/category-results.tsx's FREELANCER_CATEGORY_SLUG_MAP), so tapping a
// chip can filter people-results.tsx's getFollowSuggestions(categorySlug).
const CREATOR_CATEGORIES = [
    { id: 'f1', label: 'Lifestyle &\nLiving', svgXml: CREATOR_CAT_SVGS['Lifestyle-Living'], slug: 'lifestyle-living' },
    { id: 'f2', label: 'Tech', svgXml: CREATOR_CAT_SVGS['Tech'], slug: 'tech' },
    { id: 'f3', label: 'Education', svgXml: CREATOR_CAT_SVGS['Education'], slug: 'education' },
    { id: 'f4', label: 'Photography', svgXml: CREATOR_CAT_SVGS['Photography'], slug: 'photography' },
    { id: 'f5', label: 'Food', svgXml: CREATOR_CAT_SVGS['Food'], slug: 'food' },
    { id: 'f6', label: 'Health', svgXml: CREATOR_CAT_SVGS['Health'], slug: 'health' },
    { id: 'f7', label: 'Automotive', svgXml: CREATOR_CAT_SVGS['Automotive'], slug: 'automotive' },
    { id: 'f8', label: 'Comedy &\nMemes', svgXml: CREATOR_CAT_SVGS['Comedy-Memes'], slug: 'comedy-and-memes' },
    { id: 'f9', label: 'Entertainment', svgXml: CREATOR_CAT_SVGS['Entertainment'], slug: 'entertainment' },
    { id: 'f10', label: 'Gaming &\nAnime', svgXml: CREATOR_CAT_SVGS['Gaming-Anime'], slug: 'gaming-and-anime' },
    { id: 'f11', label: 'Learning', svgXml: CREATOR_CAT_SVGS['Learning'], slug: 'learning' },
    { id: 'f12', label: 'News, Media\n& Magazins', svgXml: CREATOR_CAT_SVGS['News-Media-Magazins'], slug: 'news-media-and-magazines' },
    { id: 'f13', label: 'Sports', svgXml: CREATOR_CAT_SVGS['Sports'], slug: 'sports' },
    { id: 'f14', label: 'Travel', svgXml: CREATOR_CAT_SVGS['Travel'], slug: 'travel' },
    { id: 'f15', label: 'Beauty', svgXml: CREATOR_CAT_SVGS['Beauty'], slug: 'beauty' },
    { id: 'f16', label: 'Fitness', svgXml: CREATOR_CAT_SVGS['Fitness'], slug: 'fitness' },
    { id: 'f17', label: 'Fashion', svgXml: CREATOR_CAT_SVGS['Fashion'], slug: 'fashion' },
    { id: 'f18', label: 'Finance &\nInvestments', svgXml: CREATOR_CAT_SVGS['Finance-Investments'], slug: 'finance-and-investments' },
    { id: 'f19', label: 'Arts', svgXml: CREATOR_CAT_SVGS['Arts'], slug: 'arts' },
    { id: 'f20', label: 'Business &\nStartups', svgXml: CREATOR_CAT_SVGS['Business-Startups'], slug: 'business-and-startups' },
    { id: 'f21', label: 'Community\nPages', svgXml: CREATOR_CAT_SVGS['Community-Pages'], slug: 'community-pages' },
    { id: 'f22', label: 'Family, Kids\n& Pets', svgXml: CREATOR_CAT_SVGS['Family-Kids-Pets'], slug: 'family-kids-and-pets' },
    { id: 'f23', label: 'Home &\nDecor', svgXml: CREATOR_CAT_SVGS['Home-Decor'], slug: 'home-and-decor' },
    { id: 'f24', label: 'Law, Rights\n& Activism', svgXml: CREATOR_CAT_SVGS['Law-Rights-Activism'], slug: 'law-rights-and-activism' },
    { id: 'f25', label: 'Pets &\nAnimals', svgXml: CREATOR_CAT_SVGS['Pets-Animals'], slug: 'pets-and-animals' },
    { id: 'f26', label: 'Politics', svgXml: CREATOR_CAT_SVGS['Politics'], slug: 'politics' },
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

// Same card content as before, just extracted so the 2-row grid below can
// reuse it instead of duplicating the JSX per row.
function TopCreatorCard({ creator: c, onPress }: { creator: any; onPress: () => void }) {
    return (
        <TouchableOpacity
            className="rounded-3xl p-4 border"
            style={{
                width: 155,
                height: 158,
                borderRadius: 24,
                backgroundColor: '#1A1A1A',
                borderWidth: 1,
                // Figma's `0 0 0 1px #999 inset` ring — the one layer of that
                // box-shadow stack RN can represent directly as a real border.
                borderColor: 'rgba(153,153,153,0.6)',
                overflow: 'hidden',
            }}
            activeOpacity={0.85}
            onPress={onPress}
        >
            {/* Approximates the inset white/gray corner-glint shadows from the
                Figma spec as a soft diagonal sheen. RN's style API has no
                inset/multi-layer box-shadow and no background-blend-mode, so
                those two can't be reproduced exactly — this is the closest
                visual equivalent. backdrop-filter: blur() is skipped: it
                blurs whatever sits *behind* the card, but the card's own
                background here is fully opaque (#1A1A1A), so a backdrop blur
                would have no visible effect. */}
            <LinearGradient
                colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.6, y: 0.6 }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                pointerEvents="none"
            />
            <Image
                source={c.profilePicture ? { uri: c.profilePicture } : imgDefaultAvatar}
                className="rounded-full"
                style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: palette.surfaceAlt }}
            />
            <Text
                className="text-white text-[15px] font-poppins-regular"
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
                <Ionicons name="logo-youtube" size={14} color="rgba(185, 180, 180, 1)" />
                <Ionicons name="logo-instagram" size={14} color="rgba(185, 180, 180, 1)" />
                <Ionicons name="logo-facebook" size={14} color="rgba(185, 180, 180, 1)" />
            </View>
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
            <Text
                style={{
                    color: '#FFF',
                    fontFamily: 'Poppins_600SemiBold',
                    fontSize: 20,
                    fontStyle: 'normal',
                    fontWeight: '600',
                    letterSpacing: -0.5,
                    textTransform: 'capitalize',
                }}
            >
                {title}
            </Text>
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

// "Hire Creators"/"Hire Agencies" tab bar — drawn as ONE continuous SVG
// stroke (bottom baseline → up the active tab's side → across its rounded
// top → down its other side → back to baseline) instead of two elements
// each owning a separate border. That's what makes it a single unbroken
// border rather than a per-tab border that has to be hidden/aligned against
// a neighboring line — there's structurally only one border to draw.
function RaisedTabBar({
    activeTab,
    onSelect,
}: {
    activeTab: 'CREATORS' | 'AGENCIES';
    onSelect: (tab: 'CREATORS' | 'AGENCIES') => void;
}) {
    const BAR_HEIGHT = 46;
    const CORNER_RADIUS = 12;
    const STROKE = 1.5;
    // The path runs right along y=0 (top) and x=0/x=barWidth (sides) — a
    // stroke centered on those coordinates has half its width clipped by
    // the SVG canvas's own edge. Pad the canvas by the stroke width on
    // every side and shift the path inward by the same amount so the full
    // stroke has room to render instead of being cut off.
    const PAD = STROKE;
    const [barWidth, setBarWidth] = useState(0);
    const [creatorsWidth, setCreatorsWidth] = useState(0);
    const [agenciesWidth, setAgenciesWidth] = useState(0);

    const activeWidth = activeTab === 'CREATORS' ? creatorsWidth : agenciesWidth;
    // True (un-padded) x-coordinates, used only to decide which sides have
    // an adjacent baseline segment to round into — the side flush against
    // the real edge of the bar (x=0 or x=barWidth) has no baseline there to
    // curve from, so it stays a plain vertical line; only the side bordering
    // the other tab gets a rounded bottom corner.
    const trueActiveX = activeTab === 'CREATORS' ? 0 : creatorsWidth;
    const trueActiveRight = trueActiveX + activeWidth;
    const hasLeftBaseline = trueActiveX > 0.5;
    const hasRightBaseline = barWidth > 0 && trueActiveRight < barWidth - 0.5;

    const activeX = trueActiveX + PAD;
    const r = Math.min(CORNER_RADIUS, activeWidth / 2 || 0, BAR_HEIGHT / 2);
    const topY = PAD;
    const bottomY = BAR_HEIGHT + PAD;

    let borderPath: string | null = null;
    if (barWidth > 0 && activeWidth > 0) {
        borderPath = hasLeftBaseline
            ? `M${PAD},${bottomY} L${activeX - r},${bottomY} Q${activeX},${bottomY} ${activeX},${bottomY - r} `
            : `M${activeX},${bottomY} `;
        borderPath += `L${activeX},${topY + r} Q${activeX},${topY} ${activeX + r},${topY} `
            + `L${activeX + activeWidth - r},${topY} Q${activeX + activeWidth},${topY} ${activeX + activeWidth},${topY + r} `;
        borderPath += hasRightBaseline
            ? `L${activeX + activeWidth},${bottomY - r} Q${activeX + activeWidth},${bottomY} ${activeX + activeWidth + r},${bottomY} L${barWidth + PAD},${bottomY}`
            : `L${activeX + activeWidth},${bottomY}`;
    }

    return (
        <View style={{ marginTop: 40, height: BAR_HEIGHT }} onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}>
            {borderPath ? (
                <Svg
                    width={barWidth + PAD * 2}
                    height={BAR_HEIGHT + PAD * 2}
                    style={{ position: 'absolute', top: -PAD, left: -PAD }}
                    pointerEvents="none"
                >
                    <Path d={borderPath} stroke="#1A8CFF" strokeWidth={STROKE} fill="none" />
                </Svg>
            ) : null}
            <View className="flex-row" style={{ height: BAR_HEIGHT }}>
                <TouchableOpacity
                    onLayout={(e) => setCreatorsWidth(e.nativeEvent.layout.width)}
                    onPress={() => onSelect('CREATORS')}
                    activeOpacity={0.85}
                    style={{
                        height: '100%',
                        justifyContent: 'center',
                        paddingHorizontal: 20,
                        backgroundColor: activeTab === 'CREATORS' ? '#0B0B12' : 'transparent',
                        borderTopLeftRadius: activeTab === 'CREATORS' ? CORNER_RADIUS : 0,
                        borderTopRightRadius: activeTab === 'CREATORS' ? CORNER_RADIUS : 0,
                    }}
                >
                    <Text
                        className={activeTab === 'CREATORS' ? 'font-poppins-semibold' : 'font-poppins-medium'}
                        style={{ fontSize: 16, color: activeTab === 'CREATORS' ? '#fff' : palette.textMuted }}
                    >
                        Hire Creators
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onLayout={(e) => setAgenciesWidth(e.nativeEvent.layout.width)}
                    onPress={() => onSelect('AGENCIES')}
                    activeOpacity={0.85}
                    style={{
                        height: '100%',
                        justifyContent: 'center',
                        paddingHorizontal: 20,
                        backgroundColor: activeTab === 'AGENCIES' ? '#0B0B12' : 'transparent',
                        borderTopLeftRadius: activeTab === 'AGENCIES' ? CORNER_RADIUS : 0,
                        borderTopRightRadius: activeTab === 'AGENCIES' ? CORNER_RADIUS : 0,
                    }}
                >
                    <Text
                        className={activeTab === 'AGENCIES' ? 'font-poppins-semibold' : 'font-poppins-medium'}
                        style={{ fontSize: 16, color: activeTab === 'AGENCIES' ? '#fff' : palette.textMuted }}
                    >
                        Hire Agencies
                    </Text>
                </TouchableOpacity>
            </View>
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

// One stat tile inside a MatchCard's 2x2 info grid — label on top, optional
// leading icon, value below.
// One cell's content only — the divider lines between cells live on the
// wrapping grid (StatGrid), not on each box individually, so the 4 cells
// read as one card split by a cross rather than 4 separate boxes with gaps.
function StatBox({ label, value, icon }: { label: string; value: string; icon?: keyof typeof Ionicons.glyphMap }) {
    return (
        <View className="flex-1" style={{ padding: 12 }}>
            <Text style={{ color: '#8A8A99', fontSize: 10, fontFamily: 'Poppins_400Regular', marginBottom: 6 }}>
                {label}
            </Text>
            <View className="flex-row items-center" style={{ gap: 5 }}>
                {icon ? <Ionicons name={icon} size={13} color="#C7C7D1" /> : null}
                <Text
                    className="font-poppins-medium"
                    style={{ color: '#fff', fontSize: 12, flexShrink: 1 }}
                    numberOfLines={2}
                >
                    {value}
                </Text>
            </View>
        </View>
    );
}

// One dark card holding all 4 stats in a 2x2 grid, split by a single
// cross-shaped divider (a vertical line down the middle of each row, plus
// one horizontal line between the rows) instead of 4 separately-boxed
// tiles with gaps between them.
function StatGrid({ children }: { children: [React.ReactNode, React.ReactNode, React.ReactNode, React.ReactNode] }) {
    const DIVIDER = 'rgba(255,255,255,0.08)';
    return (
        <View
            style={{
                backgroundColor: '#242424',
                borderRadius: 16,
                marginTop: 10,
                overflow: 'hidden',
            }}
        >
            <View className="flex-row" style={{ borderBottomWidth: 1, borderBottomColor: DIVIDER }}>
                <View className="flex-1" style={{ borderRightWidth: 1, borderRightColor: DIVIDER }}>
                    {children[0]}
                </View>
                <View className="flex-1">{children[1]}</View>
            </View>
            <View className="flex-row">
                <View className="flex-1" style={{ borderRightWidth: 1, borderRightColor: DIVIDER }}>
                    {children[2]}
                </View>
                <View className="flex-1">{children[3]}</View>
            </View>
        </View>
    );
}

// "Hire Creators"/"Hire Agencies" candidate card — matches the Figma spec
// exactly: avatar+name+verified badge, view count, status pill, a
// "Looking for" category chip, a 2x2 stat grid, a truncated message preview,
// and a gradient Send Request button.
function MatchCard({ item, onSendRequest }: { item: any; onSendRequest: () => void }) {
    return (
        <View
            style={{
                backgroundColor: '#161616',
                borderRadius: 22,
                padding: 16,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.06)',
            }}
        >
            <View className="flex-row items-start justify-between">
                <View className="flex-row items-center flex-1" style={{ gap: 10 }}>
                    <Image
                        source={item.avatar ? { uri: item.avatar } : imgDefaultAvatar}
                        style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: palette.surfaceAlt }}
                    />
                    <View className="flex-1">
                        <View className="flex-row items-center" style={{ gap: 5 }}>
                            <Text className="text-white font-poppins-semibold" style={{ fontSize: 15 }} numberOfLines={1}>
                                {item.name}
                            </Text>
                            {item.isVerified ? (
                                <Ionicons name="shield-checkmark" size={14} color="#38BDF8" />
                            ) : null}
                        </View>
                        <View className="flex-row items-center" style={{ gap: 4, marginTop: 2 }}>
                            <Ionicons name="briefcase-outline" size={11} color="#8A8A99" />
                            <Text
                                className="font-poppins-regular"
                                style={{ color: '#8A8A99', fontSize: 11, flexShrink: 1 }}
                                numberOfLines={1}
                            >
                                {item.role}
                            </Text>
                        </View>
                    </View>
                </View>
                <View className="flex-row items-center" style={{ gap: 4 }}>
                    <Ionicons name="eye-outline" size={12} color="#8A8A99" />
                    <Text className="font-poppins-regular" style={{ color: '#8A8A99', fontSize: 11 }}>
                        {item.views} views
                    </Text>
                </View>
            </View>

            <View
                className="flex-row items-center self-start"
                style={{
                    gap: 5,
                    backgroundColor: 'rgba(34,197,94,0.12)',
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 20,
                    marginTop: 10,
                }}
            >
                <Ionicons name="checkmark-circle" size={12} color={palette.success} />
                <Text className="font-poppins-medium" style={{ color: palette.success, fontSize: 11 }}>
                    {item.status}
                </Text>
            </View>

            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginTop: 14, marginBottom: 12 }} />

            <Text className="font-poppins-regular" style={{ color: '#8A8A99', fontSize: 11, marginBottom: 8 }}>
                Looking for
            </Text>
            <View
                className="flex-row items-center"
                style={{ gap: 10, backgroundColor: '#242424', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 14 }}
            >
                <Ionicons name="pricetag-outline" size={16} color="#fff" />
                <Text className="font-poppins-medium" style={{ color: '#fff', fontSize: 13 }}>
                    {item.lookingForCategory}
                </Text>
            </View>

            <StatGrid>
                <StatBox label="Brand Collab with" value={item.brandCollabValue} icon="lock-closed-outline" />
                <StatBox label="Category" value={item.categoryValue} />
                <StatBox label="No.of Creators" value={item.creatorsCountValue} icon="people-outline" />
                <StatBox label="Deliverables" value={item.deliverablesValue} />
            </StatGrid>

            <View style={{ backgroundColor: '#242424', borderRadius: 14, padding: 12, marginTop: 12 }}>
                <Text className="font-poppins-regular" style={{ color: '#C7C7D1', fontSize: 12, lineHeight: 18 }} numberOfLines={3}>
                    {item.message} <Text style={{ color: '#FF7A45' }}>See more</Text>
                </Text>
            </View>

            <LinearGradient
                colors={['#1A8CFF', '#6C47FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 999, marginTop: 14, overflow: 'hidden' }}
            >
                <TouchableOpacity
                    onPress={onSendRequest}
                    activeOpacity={0.85}
                    style={{ paddingVertical: 13, alignItems: 'center', justifyContent: 'center' }}
                >
                    <Text className="text-white font-poppins-semibold" style={{ fontSize: 14 }}>
                        Send Request
                    </Text>
                </TouchableOpacity>
            </LinearGradient>
        </View>
    );
}

// Static placeholder candidates for the Hire Creators / Hire Agencies tabs —
// same fixed-showcase convention as DUMMY_TOP_CREATORS/DUMMY_CELEBRITIES;
// the app has no structured requirement-matching fields (category, collab
// visibility, creator count, deliverables) yet, only free-text message +
// targetType, so this card's content isn't wired to real data.
const DUMMY_CREATOR_MATCHES = [
    {
        id: 'match-creator-1',
        name: 'Rohit',
        role: 'Junior influencer Executive Manager',
        views: 56,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
        isVerified: true,
        status: 'Actively Reviewing',
        lookingForCategory: 'Beauty, lifestyle & living',
        brandCollabValue: 'Visible Only to creators',
        categoryValue: 'Beauty, lifestyle & living',
        creatorsCountValue: '15 – 25 Female Creators',
        deliverablesValue: '1 Non Collab reel + Story',
        message: "Hi, we have an exciting collaboration opportunity with L'oeal paris for the the launch of the collagen lifter...",
    },
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

    // Top Creators carousel page tracking — dots reflect actual horizontal
    // scroll position/content width rather than a fixed chunk count, since
    // the rendered layout is a continuous 2-row horizontal scroll, not
    // discrete pages.
    const [creatorsPage, setCreatorsPage] = useState(0);
    const [creatorsViewportWidth, setCreatorsViewportWidth] = useState(0);
    const [creatorsContentWidth, setCreatorsContentWidth] = useState(0);
    const creatorsTotalPages = creatorsViewportWidth > 0
        ? Math.max(1, Math.ceil(creatorsContentWidth / creatorsViewportWidth))
        : 0;

    // Creator Categories carousel page tracking (same scroll-tracked
    // pagination approach as Top Creators above).
    const [creatorCatsPage, setCreatorCatsPage] = useState(0);
    const [creatorCatsViewportWidth, setCreatorCatsViewportWidth] = useState(0);
    const [creatorCatsContentWidth, setCreatorCatsContentWidth] = useState(0);
    const creatorCatsTotalPages = creatorCatsViewportWidth > 0
        ? Math.max(1, Math.ceil(creatorCatsContentWidth / creatorCatsViewportWidth))
        : 0;

    // Freelancers by Category carousel page tracking
    const [freelancerCatsPage, setFreelancerCatsPage] = useState(0);
    const [freelancerCatsViewportWidth, setFreelancerCatsViewportWidth] = useState(0);
    const [freelancerCatsContentWidth, setFreelancerCatsContentWidth] = useState(0);
    const freelancerCatsTotalPages = freelancerCatsViewportWidth > 0
        ? Math.max(1, Math.ceil(freelancerCatsContentWidth / freelancerCatsViewportWidth))
        : 0;

    const load = useCallback(async () => {
        if (!token) { setLoading(false); return; }
        const [profileRes, channelsRes, creatorsRes, celebsRes] = await Promise.all([
            getMyBrandProfile(token),
            getYoutubeChannels(token),
            getFollowSuggestions(token, 12, { role: 'CREATOR' }),
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
            setRequirementText('');
        }
    };

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
                                    { paddingHorizontal: 18, paddingVertical: 6, borderColor: '#6C47FF' },
                                    channelFilter === chip && { backgroundColor: BRAND_PRIMARY, borderColor: BRAND_PRIMARY },
                                ]}
                            >
                                <Text
                                    className="text-sm font-poppins-semibold"
                                    style={[
                                        { color: '#6C47FF' },
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
                                <Text className="text-white text-[16px] font-poppins-semibold mt-1 text-center" numberOfLines={1}>
                                    {item.name}
                                </Text>
                                <Text className="text-[12px] font-poppins-regular mt-0.5" style={{ color: palette.textMuted }}>
                                    {formatCount(item.subscriberCount)} Subs
                                </Text>
                                {!!item.category && (
                                    <View className="flex-row items-center mt-1" style={{ gap: 4 }}>
                                        <View
                                            className="rounded-full"
                                            style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: palette.success }}
                                        />
                                        <Text className="text-[12px] font-poppins-regular" style={{ fontSize: 10, color: palette.textMuted }}>
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
                    <SectionHeader title="Top Creators" onViewAll={() => router.push({ pathname: '/people-results', params: { title: 'Top Creators', role: 'CREATOR' } } as any)} />
                    {topCreators.length === 0 ? (
                        <Text className="text-xs font-poppins-regular py-2" style={{ color: palette.textMuted }}>
                            No creators yet
                        </Text>
                    ) : (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={{ marginTop: 16 }}
                            scrollEventThrottle={16}
                            onLayout={(e) => setCreatorsViewportWidth(e.nativeEvent.layout.width)}
                            onContentSizeChange={(w) => setCreatorsContentWidth(w)}
                            onScroll={(e) => {
                                if (creatorsViewportWidth <= 0) return;
                                const page = Math.round(e.nativeEvent.contentOffset.x / creatorsViewportWidth);
                                const maxPage = Math.max(creatorsTotalPages - 1, 0);
                                setCreatorsPage(Math.min(Math.max(page, 0), maxPage));
                            }}
                        >
                            <View>
                                <View className="flex-row" style={{ gap: 12 }}>
                                    {topCreators.filter((_, i) => i % 2 === 0).map((c) => (
                                        <TopCreatorCard key={c.id} creator={c} onPress={() => router.push({ pathname: '/brands-creator', params: { userId: c.id } } as any)} />
                                    ))}
                                </View>
                                <View className="flex-row" style={{ gap: 12, marginTop: 12 }}>
                                    {topCreators.filter((_, i) => i % 2 === 1).map((c) => (
                                        <TopCreatorCard key={c.id} creator={c} onPress={() => router.push({ pathname: '/brands-creator', params: { userId: c.id } } as any)} />
                                    ))}
                                </View>
                            </View>
                        </ScrollView>
                    )}
                    <PaginationDots total={creatorsTotalPages} active={creatorsPage} />
                </View>

                {/* ── Creator Categories ── */}
                <View className="px-4 mt-7">
                    <SectionHeader title="Creator Categories" onViewAll={() => router.push('/All-creators' as any)} />
                    {/* Render as a 2-row scrollable grid */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ marginTop: 12 }}
                        scrollEventThrottle={16}
                        onLayout={(e) => setCreatorCatsViewportWidth(e.nativeEvent.layout.width)}
                        onContentSizeChange={(w) => setCreatorCatsContentWidth(w)}
                        onScroll={(e) => {
                            if (creatorCatsViewportWidth <= 0) return;
                            const page = Math.round(e.nativeEvent.contentOffset.x / creatorCatsViewportWidth);
                            const maxPage = Math.max(creatorCatsTotalPages - 1, 0);
                            setCreatorCatsPage(Math.min(Math.max(page, 0), maxPage));
                        }}
                    >
                        <View>
                            <View className="flex-row" style={{ gap: 2 }}>
                                {CREATOR_CATEGORIES.filter((_, i) => i % 2 === 0).map((cat) => (
                                    <CategoryChip
                                        key={cat.id}
                                        cat={cat}
                                        colorIndex={CREATOR_CATEGORIES.findIndex(c => c.id === cat.id)}
                                        onPress={() => router.push({ pathname: '/people-results', params: { title: cat.label.replace('\n', ' '), role: 'CREATOR', categorySlug: cat.slug } } as any)}
                                    />
                                ))}
                            </View>
                            <View className="flex-row" style={{ gap: 2, marginTop: 6 }}>
                                {CREATOR_CATEGORIES.filter((_, i) => i % 2 === 1).map((cat) => (
                                    <CategoryChip
                                        key={cat.id}
                                        cat={cat}
                                        colorIndex={CREATOR_CATEGORIES.findIndex(c => c.id === cat.id)}
                                        onPress={() => router.push({ pathname: '/people-results', params: { title: cat.label.replace('\n', ' '), role: 'CREATOR', categorySlug: cat.slug } } as any)}
                                    />
                                ))}
                            </View>
                        </View>
                    </ScrollView>
                    <PaginationDots total={creatorCatsTotalPages} active={creatorCatsPage} />
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

                    <RaisedTabBar activeTab={requirementTab} onSelect={setRequirementTab} />

                    {requirementTab === 'CREATORS' ? (
                        <View style={{ marginTop: 16, gap: 14 }}>
                            {DUMMY_CREATOR_MATCHES.map((item) => (
                                <MatchCard
                                    key={item.id}
                                    item={item}
                                    onSendRequest={() => router.push({ pathname: '/brands-creator', params: { userId: item.id } } as any)}
                                />
                            ))}
                        </View>
                    ) : (
                        <View className="items-center" style={{ marginTop: 10, paddingHorizontal: 8 }}>
                            <Image
                                source={imgHireAgencies}
                                style={{ width: '100%', maxWidth: 320, height: 260 }}
                                resizeMode="contain"
                            />
                            <Text
                                className="text-white font-poppins-semibold text-center"
                                style={{ fontSize: 42, marginTop: 2 }}
                            >
                                Coming Soon
                            </Text>
                            <Text
                                className="font-poppins-regular text-center"
                                style={{ color: palette.textMuted, fontSize: 13, lineHeight: 20, marginTop: 2 }}
                            >
                                The future of agency collaboration is coming. Manage talent, streamline campaigns, and deliver greater impact for every brand you represent.
                            </Text>
                        </View>
                    )}
                </View>

                {/* ── Freelancers by Category ── */}
                <View className="px-4 mt-7">
                    <SectionHeader title="Freelancers by Category" />
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ marginTop: 12 }}
                        scrollEventThrottle={16}
                        onLayout={(e) => setFreelancerCatsViewportWidth(e.nativeEvent.layout.width)}
                        onContentSizeChange={(w) => setFreelancerCatsContentWidth(w)}
                        onScroll={(e) => {
                            if (freelancerCatsViewportWidth <= 0) return;
                            const page = Math.round(e.nativeEvent.contentOffset.x / freelancerCatsViewportWidth);
                            const maxPage = Math.max(freelancerCatsTotalPages - 1, 0);
                            setFreelancerCatsPage(Math.min(Math.max(page, 0), maxPage));
                        }}
                    >
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
                    <PaginationDots total={freelancerCatsTotalPages} active={freelancerCatsPage} />
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
