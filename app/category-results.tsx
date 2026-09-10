import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Linking,
    Modal,
    PanResponder,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getFeed, getFollowSuggestions } from '../services/userService';
import { facebookUrl, instagramUrl, twitterUrl, youtubeUrl } from '../services/socialLinks';
import { fonts } from '../theme/colors';

const imgDefaultAvatar = require('../assets/defaultavatar.png');
const imgInstagramIcon = require('../assets/instagram-icon.png');
const imgYoutubeIcon = require('../assets/youtube-icon.png');

function getInitials(name?: string | null) {
    if (!name) return 'U';
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

function formatPriceK(val?: number | string | null): string | null {
    if (val === null || val === undefined || val === '') return null;
    const str = String(val).trim();
    if (!str) return null;

    const formatNumber = (numStr: string) => {
        const raw = numStr.trim();
        if (/^\d+(\.\d+)?k$/i.test(raw)) return raw.toLowerCase();
        const n = parseFloat(raw.replace(/[^0-9.]/g, ''));
        if (isNaN(n) || n === 0) return raw;
        if (n >= 1000) {
            const formatted = n % 1000 === 0 ? (n / 1000).toFixed(0) : (n / 1000).toFixed(1);
            return `${formatted}k`;
        }
        return `${n}`;
    };

    if (str.includes('-')) {
        const parts = str.split('-');
        const left = formatNumber(parts[0]);
        const right = formatNumber(parts[1]);
        return `₹${left} - ₹${right} /Project`;
    }

    return `₹${formatNumber(str)} /Project`;
}

// Creator tab IDs → backend Category slug — mirrors app/(tabs)/explore.tsx's
// CATEGORY_SLUG_MAP. Duplicated rather than imported/shared so this screen
// can't accidentally change explore.tsx's own filtering behavior.
const CATEGORY_SLUG_MAP: Record<string, string> = {
    photography: 'photography',
    editor: 'editors',
    videography: 'videography',
    growth: 'growth-specialist',
    script: 'script-writers',
    styling: 'styling-makeup',
    fashion: 'fashion-designers',
    property: 'property-rental',
    voice: 'voice-over',
    models: 'models',
    'social-media-manager': 'social-media-management',
};

// Freelancer tab IDs (f1-f26) → backend Category slug — mirrors
// app/(tabs)/explore.tsx's FREELANCER_CATEGORY_SLUG_MAP.
const FREELANCER_CATEGORY_SLUG_MAP: Record<string, string> = {
    f1: 'lifestyle-living',
    f2: 'tech',
    f3: 'education',
    f4: 'photography',
    f5: 'food',
    f6: 'health',
    f7: 'automotive',
    f8: 'comedy-and-memes',
    f9: 'entertainment',
    f10: 'gaming-and-anime',
    f11: 'learning',
    f12: 'news-media-and-magazines',
    f13: 'sports',
    f14: 'travel',
    f15: 'beauty',
    f16: 'fitness',
    f17: 'fashion',
    f18: 'finance-and-investments',
    f19: 'arts',
    f20: 'business-and-startups',
    f21: 'community-pages',
    f22: 'family-kids-and-pets',
    f23: 'home-and-decor',
    f24: 'law-rights-and-activism',
    f25: 'pets-and-animals',
    f26: 'politics',
};



const SORT_OPTIONS = [
    'Recommended',
    'Most Relevant',
    'Price: Low to High',
    'Price: High to Low',
    'Newest Profiles',
    'Most Experienced',
];

const EXPERIENCE_RANK: Record<string, number> = {
    BEGINNER: 1,
    INTERMEDIATE: 2,
    ADVANCED: 3,
    EXPERT: 4,
};

// Filters — Location/Experience are real filters (matched against real
// profile fields, same as the sort-by fields above). Pricing Type and
// Availability are selectable in the UI to match the reference design, but
// there's no live per-profile field for either on this data (same caveat as
// the "Available" badge elsewhere on the card), so they don't narrow results.
const FILTER_LOCATION_OPTIONS = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata'];
const FILTER_EXPERIENCE_OPTIONS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const FILTER_PRICING_TYPE_OPTIONS = ['Free Collab', 'Per Project', 'Per Hour', 'Per Day'];
const FILTER_AVAILABILITY_OPTIONS = ['Available', 'Unavailable'];
const FILTER_PRICE_MIN = 100;
const FILTER_PRICE_MAX = 50000;

type FilterStep = 'main' | 'location' | 'experience' | 'price' | 'availability';

// Dual-thumb range slider for the Price Range filter screen — no slider
// library is installed, so this is a small PanResponder-driven track. Drag
// math is done in refs (not state) inside the responders to avoid stale
// closures, with a plain re-render counter to reflect the drag live; the
// committed min/max only reach the parent (onChange) on release.
function PriceRangeSlider({
    min, max, onChange,
}: {
    min: number; max: number; onChange: (min: number, max: number) => void;
}) {
    const trackWidthRef = useRef(1);
    const minPctRef = useRef((min - FILTER_PRICE_MIN) / (FILTER_PRICE_MAX - FILTER_PRICE_MIN));
    const maxPctRef = useRef((max - FILTER_PRICE_MIN) / (FILTER_PRICE_MAX - FILTER_PRICE_MIN));
    const grantMinPct = useRef(0);
    const grantMaxPct = useRef(1);
    const [, setTick] = useState(0);
    const MIN_GAP_PCT = 0.05;

    const pctToVal = (pct: number) => Math.round(FILTER_PRICE_MIN + pct * (FILTER_PRICE_MAX - FILTER_PRICE_MIN));

    const commit = () => onChange(pctToVal(minPctRef.current), pctToVal(maxPctRef.current));

    const minResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: () => { grantMinPct.current = minPctRef.current; },
            onPanResponderMove: (_evt, gesture) => {
                const deltaPct = gesture.dx / trackWidthRef.current;
                const next = Math.max(0, Math.min(grantMinPct.current + deltaPct, maxPctRef.current - MIN_GAP_PCT));
                minPctRef.current = next;
                setTick((t) => t + 1);
            },
            onPanResponderRelease: commit,
        })
    ).current;

    const maxResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: () => { grantMaxPct.current = maxPctRef.current; },
            onPanResponderMove: (_evt, gesture) => {
                const deltaPct = gesture.dx / trackWidthRef.current;
                const next = Math.min(1, Math.max(grantMaxPct.current + deltaPct, minPctRef.current + MIN_GAP_PCT));
                maxPctRef.current = next;
                setTick((t) => t + 1);
            },
            onPanResponderRelease: commit,
        })
    ).current;

    // Dragging the filled bar itself (not just a thumb) slides the whole
    // range together, keeping its width fixed.
    const grantRangeMinPct = useRef(0);
    const grantRangeMaxPct = useRef(1);
    const rangeResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                grantRangeMinPct.current = minPctRef.current;
                grantRangeMaxPct.current = maxPctRef.current;
            },
            onPanResponderMove: (_evt, gesture) => {
                const deltaPct = gesture.dx / trackWidthRef.current;
                const width = grantRangeMaxPct.current - grantRangeMinPct.current;
                const newMin = Math.max(0, Math.min(grantRangeMinPct.current + deltaPct, 1 - width));
                minPctRef.current = newMin;
                maxPctRef.current = newMin + width;
                setTick((t) => t + 1);
            },
            onPanResponderRelease: commit,
        })
    ).current;

    const minPct = minPctRef.current;
    const maxPct = maxPctRef.current;
    const minVal = pctToVal(minPct);
    const maxVal = pctToVal(maxPct);

    return (
        <View>
            <Text style={{ color: '#fff', fontSize: 16, fontFamily: fonts.semibold, textAlign: 'center', marginBottom: 28 }}>
                {`₹${minVal.toLocaleString('en-IN')} - ₹${maxVal.toLocaleString('en-IN')}${maxPct >= 1 ? '+' : ''}`}
            </Text>
            <View
                style={{ height: 24, justifyContent: 'center' }}
                onLayout={(e) => { trackWidthRef.current = Math.max(1, e.nativeEvent.layout.width - 24); }}
            >
                <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.15)' }} />
                <View
                    style={{
                        position: 'absolute',
                        left: 12 + minPct * trackWidthRef.current,
                        right: 12 + (1 - maxPct) * trackWidthRef.current,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: '#FF7A18',
                    }}
                />
                {/* Taller invisible hit area over the filled bar — dragging
                    anywhere on it slides the whole range instead of resizing
                    it. Sits under the thumbs so their own edge drags still win. */}
                <View
                    {...rangeResponder.panHandlers}
                    style={{
                        position: 'absolute',
                        left: 12 + minPct * trackWidthRef.current,
                        right: 12 + (1 - maxPct) * trackWidthRef.current,
                        height: 24,
                    }}
                />
                <View
                    {...minResponder.panHandlers}
                    style={{
                        position: 'absolute',
                        left: minPct * trackWidthRef.current,
                        width: 24, height: 24, borderRadius: 12,
                        backgroundColor: '#FF7A18',
                    }}
                />
                <View
                    {...maxResponder.panHandlers}
                    style={{
                        position: 'absolute',
                        left: 24 + maxPct * trackWidthRef.current,
                        width: 24, height: 24, borderRadius: 12,
                        backgroundColor: '#FF7A18',
                    }}
                />
            </View>
        </View>
    );
}

// Shared radio row for the filter sub-screens — label + a hollow/filled
// selection circle, matching the Sort By modal's own row styling.
function FilterRadioRow({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPress}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}
        >
            {selected ? (
                <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#FF7A18', alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#fff' }} />
                </View>
            ) : (
                <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)' }} />
            )}
            <Text style={{ color: '#fff', fontSize: 16, fontFamily: fonts.medium }}>{label}</Text>
        </TouchableOpacity>
    );
}

/**
 * Category browse grid — opened from Home's "Creators by Category" /
 * "Freelancers by Category" tiles. Reuses getFeed() (same source
 * app/(tabs)/explore.tsx's sidebar view already fetches, unfiltered) and
 * de-dupes posts down to one card per unique profile matching the tapped
 * category, instead of one card per post.
 *
 * "Available" badge and the Instagram/YouTube badges are decorative — the
 * feed's embedded owner summary doesn't carry live presence or per-platform
 * verification, so these mirror the reference design rather than live state.
 * Price shows the post's own budget/collaboration type (the only price-like
 * field that actually exists on this data), not a fabricated range.
 */
export default function CategoryResultsScreen() {
    const router = useRouter();
    const { token, userRole } = useAuth();
    const params = useLocalSearchParams<{ category?: string; label?: string }>();
    const categoryId = params.category || '';
    const categoryLabel = (params.label || 'Results').replace(/\n/g, ' ');
    // Fixed width instead of flex — a lone last-row card (odd item count)
    // would otherwise stretch to fill the row since it has no sibling to
    // share flex:1 with.
    const { width: screenWidth } = useWindowDimensions();
    const CARD_WIDTH = (screenWidth - 32 - 12) / 2;

    const [posts, setPosts] = useState<any[]>([]);
    // Every user in the app who might match this category, not just people
    // who happen to have posted — getFeed alone only surfaces post authors.
    // getFollowSuggestions returns real profile objects directly, so it's
    // the closest thing this app has to "browse everyone"; merged in below
    // rather than replacing the feed-based list, so nothing that showed
    // before stops showing. Guest-only (no token) keeps the old feed-only
    // behavior since that endpoint requires auth.
    const [suggestionUsers, setSuggestionUsers] = useState<any[]>([]);
    // Full profile data keyed by userId — fetched after the feed loads so we
    // always display the real skills/categoryNames the user set in their profile.
    const [fullProfiles, setFullProfiles] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [sort, setSort] = useState(SORT_OPTIONS[0]);
    const [sortOpen, setSortOpen] = useState(false);

    // Filters
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [filterStep, setFilterStep] = useState<FilterStep>('main');
    const [filterLocation, setFilterLocation] = useState<string | null>(null);
    const [filterExperience, setFilterExperience] = useState<string | null>(null);
    const [filterPricingType, setFilterPricingType] = useState(FILTER_PRICING_TYPE_OPTIONS[0]);
    const [filterAvailability, setFilterAvailability] = useState<string | null>(null);
    const [filterPriceMin, setFilterPriceMin] = useState(FILTER_PRICE_MIN);
    const [filterPriceMax, setFilterPriceMax] = useState(FILTER_PRICE_MAX);
    const activeFilterCount = [filterLocation, filterExperience, filterAvailability].filter(Boolean).length
        + (filterPriceMin !== FILTER_PRICE_MIN || filterPriceMax !== FILTER_PRICE_MAX ? 1 : 0);

    const load = useCallback(async () => {
        setLoading(true);
        const [feedRes, suggestionsRes] = await Promise.all([
            // getFeed defaults to the backend's generic page size (20) when no
            // limit is given — fine for a normal home feed, but this screen
            // then filters that same small, category-unaware page down to
            // just the tapped category client-side (see `profiles` below), so
            // almost everything outside that first page never had a chance to
            // match. '100' is the server's own max per request (see
            // parsePagination in feed.service.js) — not true pagination, but
            // a 5x larger pool to filter from without changing what "matches
            // this category" means (the backend's categoryId filter only
            // checks a Freelancer's single primary category, not their
            // categories[] array, so filtering server-side would silently
            // drop profiles the existing client-side categorySlugs[] check
            // correctly includes today).
            getFeed(token, { limit: '100' }),
            token ? getFollowSuggestions(token, 200) : Promise.resolve({ success: false, data: [] as any[] }),
        ]);
        const feedPosts: any[] = (feedRes.success && Array.isArray(feedRes.data)) ? feedRes.data : [];
        const suggested: any[] = (suggestionsRes.success && Array.isArray(suggestionsRes.data)) ? suggestionsRes.data : [];
        setPosts(feedPosts);
        setSuggestionUsers(suggested);

        // Skills and social handles now come back on the feed/suggestion
        // payloads themselves. This used to fetch every unique owner's full
        // profile just to read them — one request per creator in the feed, on
        // top of everything else the screen loads, which is what tipped
        // browsing over the API rate limit.
        const map: Record<string, any> = {};
        for (const { owner } of [
            ...feedPosts.map((p: any) => ({ owner: p.owner })),
            ...suggested.map((u: any) => ({ owner: u })),
        ]) {
            if (owner?.id && !map[owner.id]) {
                // Mirrors getUserById's nesting so the reader below is unchanged.
                map[owner.id] = owner.role === 'FREELANCER'
                    ? { role: owner.role, freelancerProfile: owner }
                    : { role: owner.role, creatorProfile: owner };
            }
        }
        setFullProfiles(map);
        setLoading(false);
    }, [token]);

    useEffect(() => { load(); }, [load]);

    // One card per unique profile (not one per post), filtered to this
    // category — sourced from both post authors (existing behavior) and
    // getFollowSuggestions (every other matching profile in the app that
    // hasn't necessarily posted). Feed entries come first so a profile that
    // exists in both keeps its real post data (location/budget/etc).
    const ownerSources = useMemo(() => [
        ...posts.map((post) => ({ owner: post.owner || {}, post })),
        ...suggestionUsers.map((user) => ({ owner: user, post: {} as any })),
    ], [posts, suggestionUsers]);

    const profiles = useMemo(() => {
        const slug = userRole === 'FREELANCER'
            ? FREELANCER_CATEGORY_SLUG_MAP[categoryId]
            : CATEGORY_SLUG_MAP[categoryId];
        const seen = new Set<string>();
        const list: any[] = [];
        for (const { owner, post: p } of ownerSources) {
            if (!owner.id || seen.has(owner.id)) continue;
            // Freelancer owners can carry several service categories, so the
            // feed's lightweight owner summary exposes those as the plural
            // categorySlugs[] array (same field explore.tsx's sidebar checks).
            // Creator owners have a single primary content category instead,
            // which only shows up as the singular owner.category.slug — not
            // in categorySlugs — so checking categorySlugs alone silently
            // matched zero Creator profiles whenever a Freelancer browsed by
            // category. Check both so either shape of owner matches.
            const slugs: string[] = Array.isArray(owner.categorySlugs) ? owner.categorySlugs : [];
            const singleSlug: string | undefined = owner.category?.slug;
            const ownerSlugs = singleSlug ? [...slugs, singleSlug] : slugs;
            if (slug && !ownerSlugs.some((s) => (s || '').toLowerCase() === slug)) continue;
            seen.add(owner.id);
            const categoryNames: string[] = Array.isArray(owner.categoryNames) ? owner.categoryNames : [];
            const fullP = fullProfiles[owner.id];
            // getUserById nests the actual profile fields (skills, bio, etc.)
            // under freelancerProfile/creatorProfile — same shape
            // creator-details.tsx reads (`profile.freelancerProfile || profile.creatorProfile`).
            // Reading fullP.skills directly here always misses, since that key
            // doesn't exist at the top level.
            const nestedProfile = fullP ? (fullP.freelancerProfile || fullP.creatorProfile || {}) : {};
            const pObj = nestedProfile;
            const isFreelancer = (fullP?.role || owner.role) === 'FREELANCER';

            // 1. Gather the user's own entered skills — Freelancer-only field
            // from the "Complete Profile" Skills input (stored as either a
            // string[] or a comma-separated string depending on what the
            // signup form sent).
            let userSkills: string[] = [];
            if (Array.isArray(nestedProfile.skills) && nestedProfile.skills.length > 0) {
                userSkills = nestedProfile.skills;
            } else if (typeof nestedProfile.skills === 'string' && (nestedProfile.skills as string).trim()) {
                userSkills = (nestedProfile.skills as string).split(',').map((s) => s.trim()).filter(Boolean);
            } else if (Array.isArray(owner.skills) && owner.skills.length > 0) {
                userSkills = owner.skills;
            }

            // Filter out broad category name duplicates (e.g. 'Photography')
            const mainCategoryName = (categoryNames[0] || '').toLowerCase();
            const filteredSkills = userSkills.filter(
                (s) => s && s.toLowerCase() !== mainCategoryName
            );

            // Creators don't have a Skills input — categoryNames (the
            // categories they actually picked) is their real equivalent,
            // same as creator-details.tsx's own rawSkills logic. No dummy
            // padding either way: whatever they actually entered, up to 3.
            const specializations: string[] = (isFreelancer ? filteredSkills : categoryNames).slice(0, 3);

            // 4. Build real social links based on profile handles — only shown
            // when the user actually provided that link (no placeholder icons
            // for links that don't exist).
            const socials: { key: string; icon?: string; image?: any; color?: string; url?: string }[] = [];
            const igH = pObj.instagramHandle || owner.instagramHandle || (Array.isArray(pObj.instagramAccounts) && pObj.instagramAccounts[0]?.instagramUsername);
            const ytH = pObj.youtubeHandle || owner.youtubeHandle;
            const fbH = pObj.facebookHandle || owner.facebookHandle;
            const twH = pObj.twitterHandle || owner.twitterHandle;

            if (igH) {
                socials.push({ key: 'ig', image: imgInstagramIcon, url: instagramUrl(igH) });
            }
            if (ytH) {
                socials.push({ key: 'yt', image: imgYoutubeIcon, url: youtubeUrl(ytH) });
            }
            if (fbH) {
                socials.push({ key: 'fb', icon: 'logo-facebook', color: '#1877F2', url: facebookUrl(fbH) });
            }
            if (twH) {
                socials.push({ key: 'tw', icon: 'logo-twitter', color: '#1DA1F2', url: twitterUrl(twH) });
            }

            const rawPrice = p.budget || p.hourlyRate || pObj.hourlyRate || pObj.budget;
            // Raw numeric value for Price sorting — priceLabel above is a
            // formatted display string ("₹15k /Project") that can't be
            // sorted directly. Takes the low end of a "X-Y" range.
            const priceValue = (() => {
                if (rawPrice === null || rawPrice === undefined || rawPrice === '') return null;
                const first = String(rawPrice).split('-')[0];
                const n = parseFloat(first.replace(/[^0-9.]/g, ''));
                return Number.isFinite(n) ? n : null;
            })();
            const experienceLevelRaw = String(pObj.experienceLevel || '').toUpperCase();
            const experienceRank = EXPERIENCE_RANK[experienceLevelRaw] || 0;
            // Title-cased label ("Advanced") to match FILTER_EXPERIENCE_OPTIONS.
            const experienceLabel = experienceLevelRaw
                ? experienceLevelRaw.charAt(0) + experienceLevelRaw.slice(1).toLowerCase()
                : null;

            list.push({
                id: owner.id,
                name: owner.name || (isFreelancer ? 'Freelancer' : 'Creator'),
                avatar: owner.profilePicture || null,
                role: categoryNames[0] || (isFreelancer ? 'Freelancer' : 'Creator'),
                specializations,  // Real user-entered data only, up to 3
                socials,          // Real social links, only the ones provided
                location: p.location || owner.location || '',
                priceLabel: formatPriceK(rawPrice) || (p.collaborationType === 'PAID' ? 'Paid Collab' : 'Free Collab'),
                priceValue,
                experienceRank,
                experienceLabel,
                createdAt: p.createdAt || null,
            });
        }
        return list;
    }, [ownerSources, categoryId, userRole, fullProfiles]);

    const filteredProfiles = useMemo(() => {
        let list = profiles;
        if (query.trim()) {
            const q = query.trim().toLowerCase();
            list = list.filter((c) => c.name.toLowerCase().includes(q));
        }
        if (filterLocation) {
            list = list.filter((c) => (c.location || '').toLowerCase().includes(filterLocation.toLowerCase()));
        }
        if (filterExperience) {
            list = list.filter((c) => c.experienceLabel === filterExperience);
        }
        if (filterPriceMin !== FILTER_PRICE_MIN || filterPriceMax !== FILTER_PRICE_MAX) {
            list = list.filter((c) => {
                if (c.priceValue === null) return false;
                if (c.priceValue < filterPriceMin) return false;
                // Max is "+" (uncapped) once dragged to the top of the range.
                if (filterPriceMax < FILTER_PRICE_MAX && c.priceValue > filterPriceMax) return false;
                return true;
            });
        }
        // 'Recommended' and 'Most Relevant' keep the feed's own order — there's
        // no relevance-scoring field to sort by, so this is a no-op for both.
        if (sort === 'Newest Profiles') {
            list = [...list].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        } else if (sort === 'Price: Low to High') {
            list = [...list].sort((a, b) => (a.priceValue ?? Infinity) - (b.priceValue ?? Infinity));
        } else if (sort === 'Price: High to Low') {
            list = [...list].sort((a, b) => (b.priceValue ?? -Infinity) - (a.priceValue ?? -Infinity));
        } else if (sort === 'Most Experienced') {
            list = [...list].sort((a, b) => b.experienceRank - a.experienceRank);
        }
        return list;
    }, [profiles, query, sort, filterLocation, filterExperience, filterPriceMin, filterPriceMax]);

    const openProfile = (userId: string) => {
        router.push({ pathname: '/creator-details', params: { userId } } as any);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
            <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 40, paddingBottom: 16, gap: 14 }}>
                <TouchableOpacity
                    onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as any))}
                    style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={{ color: '#fff', fontSize: 22, fontWeight: '600', fontFamily: fonts.semibold }} numberOfLines={1}>
                    {categoryLabel}
                </Text>
            </View>

            <FlatList
                data={filteredProfiles}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
                contentContainerStyle={{ paddingBottom: 32, gap: 12 }}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <View style={{ paddingHorizontal: 16, marginBottom: 18 }}>
                        {/* Search + Filters */}
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <View
                                style={{
                                    flex: 1,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: 'rgba(255,255,255,0.06)',
                                    borderRadius: 12,
                                    paddingHorizontal: 12,
                                    height: 44,
                                    gap: 8,
                                }}
                            >
                                <Ionicons name="search" size={18} color="#8A8A99" />
                                <TextInput
                                    value={query}
                                    onChangeText={setQuery}
                                    placeholder={`Search ${categoryLabel.toLowerCase()}...`}
                                    placeholderTextColor="#8A8A99"
                                    style={{ flex: 1, color: '#fff', fontSize: 14, fontFamily: fonts.regular }}
                                />
                            </View>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => { setFilterStep('main'); setFiltersOpen(true); }}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 6,
                                    backgroundColor: 'rgba(255,255,255,0.06)',
                                    borderRadius: 12,
                                    paddingHorizontal: 14,
                                    height: 44,
                                    borderWidth: 1,
                                    borderColor: activeFilterCount > 0 ? '#FF7A18' : 'rgba(255,255,255,0.08)',
                                }}
                            >
                                <Ionicons name="options-outline" size={16} color="#fff" />
                                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '500', fontFamily: fonts.medium }}>
                                    Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Sort */}
                        <View style={{ marginTop: 16 }}>
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => setSortOpen(true)}
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}
                            >
                                <Text style={{ color: '#8A8A99', fontSize: 13, fontFamily: fonts.regular }}>Sort by: </Text>
                                <Text style={{ color: '#FF7A18', fontSize: 13, fontWeight: '600', fontFamily: fonts.semibold }}>{sort}</Text>
                                <Ionicons name="chevron-down" size={14} color="#FF7A18" />
                            </TouchableOpacity>
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={{ alignItems: 'center', marginTop: 60, paddingHorizontal: 32 }}>
                            <Ionicons name="people-outline" size={40} color="#3A3A44" />
                            <Text style={{ color: '#8A8A99', fontSize: 14, marginTop: 10, textAlign: 'center', fontFamily: fonts.regular }}>
                                No {categoryLabel.toLowerCase()} found yet
                            </Text>
                        </View>
                    ) : (
                        <View style={{ alignItems: 'center', marginTop: 60 }}>
                            <ActivityIndicator color="#FF7A18" size="large" />
                        </View>
                    )
                }
                renderItem={({ item }) => (
                    <View
                        style={{
                            width: CARD_WIDTH,
                            backgroundColor: '#121216',
                            borderRadius: 18,
                            padding: 0,
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.06)',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Available badge + social icons */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, marginHorizontal: -2, marginBottom: 2 }}>
                            <View
                                style={{
                                    backgroundColor: '#045D19',
                                    borderTopLeftRadius: 0,
                                    borderBottomRightRadius: 12,
                                    borderTopRightRadius: 0,
                                    paddingHorizontal: 12,
                                    paddingVertical: 2,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginTop: 6,
                                }}
                            >
                                <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '600', letterSpacing: 0.2, fontFamily: fonts.semibold }}>Available</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 12, paddingTop: 10 }}>
                                {(item.socials || []).map((soc: any) => (
                                    <TouchableOpacity
                                        key={soc.key}
                                        activeOpacity={0.7}
                                        onPress={() => soc.url && Linking.openURL(soc.url).catch(() => {})}
                                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                    >
                                        {soc.image ? (
                                            <Image source={soc.image} style={{ width: 20, height: 20 }} resizeMode="contain" />
                                        ) : (
                                            <Ionicons name={soc.icon as any} size={20} color={soc.color} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Avatar */}
                        <View style={{ alignItems: 'center', marginTop: 10 }}>
                            <LinearGradient
                                colors={['#FF3D9A', '#ED2A91']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={{ width: 52, height: 52, borderRadius: 39, padding: 1 }}
                            >
                                <View
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: 36,
                                        overflow: 'hidden',
                                        backgroundColor: '#2A2A33',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {item.avatar ? (
                                        <Image source={{ uri: item.avatar }} style={{ width: '100%', height: '100%' }} />
                                    ) : (
                                        <Image source={imgDefaultAvatar} style={{ width: '100%', height: '100%' }} />
                                    )}
                                </View>
                            </LinearGradient>
                        </View>

                        {/* Name */}
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center', marginTop: 10, fontFamily: fonts.bold }} numberOfLines={1}>
                            {item.name}
                        </Text>

                        {/* Role | Portfolio */}
                        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, paddingHorizontal: 12 }}>
                            <Text
                                style={{ color: '#B8B8C6', fontSize: 12, fontFamily: fonts.medium, flexShrink: 1 }}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {item.role}
                            </Text>
                            <Text style={{ color: '#5A5A66', fontSize: 12, fontFamily: fonts.medium, flexShrink: 0 }}>|</Text>
                            <TouchableOpacity onPress={() => openProfile(item.id)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }} style={{ flexShrink: 0 }}>
                                <Text style={{ color: '#FF7A18', fontSize: 12, fontWeight: '500', fontFamily: fonts.medium }}>Portfolio</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Price */}
                        <Text style={{ color: '#FF7A18', fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 2, fontFamily: fonts.semibold }} numberOfLines={1}>
                            {item.priceLabel}
                        </Text>

                        {/* Specializations — horizontal scroller for 3 chips */}
                        {item.specializations.length > 0 && (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingHorizontal: 8, gap: 5, alignItems: 'center' }}
                                style={{ marginTop: 5, flexGrow: 0 }}
                            >
                                {item.specializations.map((spec: string, i: number) => (
                                    <View
                                        key={i}
                                        style={{
                                            backgroundColor: 'rgba(255,255,255,0.07)',
                                            borderRadius: 20,
                                            borderWidth: 1,
                                            borderColor: 'rgba(255,255,255,0.12)',
                                            paddingHorizontal: 10,
                                            paddingVertical: 4,
                                        }}
                                    >
                                        <Text style={{ color: '#9090A8', fontSize: 10, fontWeight: '500', fontFamily: fonts.medium }}>{spec}</Text>
                                    </View>
                                ))}
                            </ScrollView>
                        )}

                        {/* Location */}
                        {Boolean(item.location) && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 10, marginHorizontal: 20 }}>
                                <Ionicons name="location-outline" size={12} color="#8A8A99" />
                                <Text style={{ color: '#8A8A99', fontSize: 11, fontFamily: fonts.regular }} numberOfLines={1}>{item.location}</Text>
                            </View>
                        )}

                        {/* View Profile */}
                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => openProfile(item.id)}
                            style={{ marginTop: 4, borderRadius: 0, overflow: 'hidden' }}
                        >
                            <LinearGradient
                                colors={['#FF7A18', '#ED2A91']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11 }}
                            >
                                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700', fontFamily: fonts.bold }}>View Profile</Text>
                                <Ionicons name="arrow-forward" size={13} color="#fff" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}
            />

            {/* Sort By — full-screen picker */}
            <Modal
                visible={sortOpen}
                animationType="slide"
                onRequestClose={() => setSortOpen(false)}
            >
                <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
                    <StatusBar barStyle="light-content" backgroundColor="#000" />
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 16,
                            paddingTop: 50,
                            paddingBottom: 16,
                            gap: 16,
                            borderBottomWidth: 1,
                            borderBottomColor: 'rgba(255,255,255,0.08)',
                        }}
                    >
                        <TouchableOpacity
                            onPress={() => setSortOpen(false)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="arrow-back" size={26} color="#fff" />
                        </TouchableOpacity>
                        <Text style={{ color: '#fff', fontSize: 26, fontWeight: '500', fontFamily: fonts.bold }}>
                            Sort By
                        </Text>
                    </View>

                    <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
                        {SORT_OPTIONS.map((opt) => {
                            const selected = opt === sort;
                            return (
                                <TouchableOpacity
                                    key={opt}
                                    activeOpacity={0.7}
                                    onPress={() => setSort(opt)}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        paddingVertical: 10,
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                                        <View
                                            style={{
                                                width: 16,
                                                height: 16,
                                                borderRadius: 14,
                                                borderWidth: 1.5,
                                                borderColor: 'rgba(255,255,255,0.3)',
                                            }}
                                        />
                                        <Text style={{ color: '#fff', fontSize: 16, fontFamily: fonts.medium }}>{opt}</Text>
                                    </View>
                                    {selected ? (
                                        <View
                                            style={{
                                                width: 20,
                                                height: 20,
                                                borderRadius: 10,
                                                backgroundColor: '#FF7A18',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Ionicons name="checkmark" size={13} color="#fff" />
                                        </View>
                                    ) : (
                                        <View
                                            style={{
                                                width: 20,
                                                height: 20,
                                                borderRadius: 10,
                                                borderWidth: 1.5,
                                                borderColor: 'rgba(255,255,255,0.3)',
                                            }}
                                        />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => setSortOpen(false)}
                        style={{ marginHorizontal: 20, marginTop: 24, borderRadius: 26, overflow: 'hidden' }}
                    >
                        <LinearGradient
                            colors={['#FF7A18', '#ED2A91']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 15 }}
                        >
                            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', fontFamily: fonts.bold }}>Apply</Text>
                            <Ionicons name="arrow-forward" size={15} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                </SafeAreaView>
            </Modal>

            {/* Filters — main screen + Location/Experience/Price/Availability
                sub-screens, all as one Modal switching content by filterStep
                rather than stacking separate Modals. */}
            <Modal
                visible={filtersOpen}
                animationType="slide"
                onRequestClose={() => (filterStep === 'main' ? setFiltersOpen(false) : setFilterStep('main'))}
            >
                <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
                    <StatusBar barStyle="light-content" backgroundColor="#000" />
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingHorizontal: 16,
                            paddingTop: 40,
                            paddingBottom: 16,
                            borderBottomWidth: 1,
                            borderBottomColor: 'rgba(255,255,255,0.08)',
                        }}
                    >   
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                            <TouchableOpacity
                                onPress={() => (filterStep === 'main' ? setFiltersOpen(false) : setFilterStep('main'))}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="arrow-back" size={22} color="#fff" />
                            </TouchableOpacity>
                            <Text style={{ color: '#fff', fontSize: 24, fontWeight: '500', fontFamily: fonts.medium }}>
                                {filterStep === 'main' && 'Filters'}
                                {filterStep === 'location' && 'Location'}
                                {filterStep === 'experience' && 'Experience'}
                                {filterStep === 'price' && 'Price Range'}
                                {filterStep === 'availability' && 'Availability'}
                            </Text>
                        </View>
                        {filterStep === 'main' && (
                            <TouchableOpacity
                                onPress={() => {
                                    setFilterLocation(null);
                                    setFilterExperience(null);
                                    setFilterAvailability(null);
                                    setFilterPricingType(FILTER_PRICING_TYPE_OPTIONS[0]);
                                    setFilterPriceMin(FILTER_PRICE_MIN);
                                    setFilterPriceMax(FILTER_PRICE_MAX);
                                }}
                            >
                                <Text style={{ color: '#FF7A18', fontSize: 14, fontFamily: fonts.medium }}>Reset</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, flexGrow: 1 }}>
                        {filterStep === 'main' && (
                            <View>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => setFilterStep('location')}
                                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <Ionicons name="location-outline" size={18} color="#B8B8C6" />
                                        <Text style={{ color: '#fff', fontSize: 15, fontFamily: fonts.regular }}>
                                            {filterLocation ? `Location: ${filterLocation}` : 'Location'}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color="#5A5A66" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => setFilterStep('experience')}
                                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <Ionicons name="ribbon-outline" size={18} color="#B8B8C6" />
                                        <Text style={{ color: '#fff', fontSize: 15, fontFamily: fonts.regular }}>
                                            {filterExperience ? `Experience: ${filterExperience}` : 'Experience'}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color="#5A5A66" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => setFilterStep('price')}
                                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <Ionicons name="pricetag-outline" size={18} color="#B8B8C6" />
                                        <Text style={{ color: '#fff', fontSize: 15, fontFamily: fonts.regular }}>
                                            {(filterPriceMin !== FILTER_PRICE_MIN || filterPriceMax !== FILTER_PRICE_MAX)
                                                ? `Price Range: ₹${filterPriceMin.toLocaleString('en-IN')} - ₹${filterPriceMax.toLocaleString('en-IN')}${filterPriceMax >= FILTER_PRICE_MAX ? '+' : ''}`
                                                : 'Price Range'}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color="#5A5A66" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => setFilterStep('availability')}
                                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <Ionicons name="time-outline" size={18} color="#B8B8C6" />
                                        <Text style={{ color: '#fff', fontSize: 15, fontFamily: fonts.regular }}>
                                            {filterAvailability ? `Availability: ${filterAvailability}` : 'Availability'}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color="#5A5A66" />
                                </TouchableOpacity>
                            </View>
                        )}

                        {filterStep === 'location' && (
                            <View>
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        backgroundColor: 'rgba(255,255,255,0.06)',
                                        borderRadius: 12,
                                        paddingHorizontal: 12,
                                        height: 44,
                                        gap: 8,
                                        marginBottom: 20,
                                    }}
                                >
                                    <Ionicons name="search" size={16} color="#8A8A99" />
                                    <TextInput
                                        placeholder="Search Location..."
                                        placeholderTextColor="#8A8A99"
                                        style={{ flex: 1, color: '#fff', fontSize: 14, fontFamily: fonts.regular }}
                                    />
                                </View>
                                <Text style={{ color: '#fff', fontSize: 16, fontFamily: fonts.medium, marginBottom: 4 }}>
                                    Popular Locations
                                </Text>
                                {FILTER_LOCATION_OPTIONS.map((loc) => (
                                    <FilterRadioRow
                                        key={loc}
                                        label={loc}
                                        selected={filterLocation === loc}
                                        onPress={() => setFilterLocation(filterLocation === loc ? null : loc)}
                                    />
                                ))}
                            </View>
                        )}

                        {filterStep === 'experience' && (
                            <View>
                                {FILTER_EXPERIENCE_OPTIONS.map((exp) => (
                                    <FilterRadioRow
                                        key={exp}
                                        label={exp}
                                        selected={filterExperience === exp}
                                        onPress={() => setFilterExperience(filterExperience === exp ? null : exp)}
                                    />
                                ))}
                            </View>
                        )}

                        {filterStep === 'price' && (
                            <View style={{ paddingTop: 12 }}>
                                <PriceRangeSlider
                                    min={filterPriceMin}
                                    max={filterPriceMax}
                                    onChange={(lo, hi) => { setFilterPriceMin(lo); setFilterPriceMax(hi); }}
                                />
                                <Text style={{ color: '#8A8A99', fontSize: 13, fontFamily: fonts.medium, marginTop: 32, marginBottom: 4 }}>
                                    Pricing Type
                                </Text>
                                {FILTER_PRICING_TYPE_OPTIONS.map((type) => (
                                    <FilterRadioRow
                                        key={type}
                                        label={type}
                                        selected={filterPricingType === type}
                                        onPress={() => setFilterPricingType(type)}
                                    />
                                ))}
                            </View>
                        )}

                        {filterStep === 'availability' && (
                            <View>
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        backgroundColor: 'rgba(255,255,255,0.06)',
                                        borderRadius: 12,
                                        paddingHorizontal: 12,
                                        height: 44,
                                        gap: 8,
                                        marginBottom: 20,
                                    }}
                                >
                                    <Ionicons name="search" size={16} color="#8A8A99" />
                                    <TextInput
                                        placeholder="Search Location..."
                                        placeholderTextColor="#8A8A99"
                                        style={{ flex: 1, color: '#fff', fontSize: 14, fontFamily: fonts.regular }}
                                    />
                                </View>
                                <Text style={{ color: '#8A8A99', fontSize: 13, fontFamily: fonts.medium, marginBottom: 4 }}>
                                    Select Your Availability
                                </Text>
                                {FILTER_AVAILABILITY_OPTIONS.map((av) => (
                                    <FilterRadioRow
                                        key={av}
                                        label={av}
                                        selected={filterAvailability === av}
                                        onPress={() => setFilterAvailability(filterAvailability === av ? null : av)}
                                    />
                                ))}
                            </View>
                        )}
                    </ScrollView>

                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => (filterStep === 'main' ? setFiltersOpen(false) : setFilterStep('main'))}
                        style={{ marginHorizontal: 20, marginBottom: 20, marginTop: 12, borderRadius: 26, overflow: 'hidden' }}
                    >
                        <LinearGradient
                            colors={['#FF7A18', '#ED2A91']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 15 }}
                        >
                            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', fontFamily: fonts.bold }}>Apply Filters</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}
