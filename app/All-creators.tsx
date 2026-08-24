import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getFollowSuggestions } from '../services/userService';
import { fonts, palette } from '../theme/colors';

const imgDefaultAvatar = require('../assets/defaultavatar.png');
const imgAllCreator = require('../assets/all-creator.png');

function formatCount(n?: number | string | null) {
    if (!n) return '50.6M';
    if (typeof n === 'string') return n;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

const FILTER_TABS = ['Categories', 'Platform', 'Location', 'Followers', 'Language'] as const;
type FilterTab = typeof FILTER_TABS[number];

const FILTER_DATA: Record<FilterTab, string[]> = {
    Categories: [
        'Fashion & Lifestyle',
        'Beauty',
        'Fitness & Health',
        'Travel',
        'Food',
        'Technology',
        'Gaming',
        'Finance',
        'Business',
        'Entertainment',
        'Comedy',
        'Motivation',
        'Photography',
        'Spiritual',
        'Parenting',
    ],
    Platform: ['Instagram', 'YouTube', 'Facebook', 'Twitter / X', 'Threads', 'LinkedIn'],
    Location: ['Hyderabad', 'Bangalore', 'Delhi', 'Mumbai', 'Chennai', 'Kolkata', 'Pune', 'Gurgaon'],
    Followers: ['Under 10K', '10K - 50K', '50K - 100K', '100K - 500K', '500K - 1M', '1M+'],
    Language: ['English', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Malayalam', 'Marathi', 'Bengali'],
};

const DEFAULT_CREATORS = [
    {
        id: 'c-1',
        name: 'FreshBrew Co.',
        category: 'Entertainment',
        location: 'Hyderabad',
        platform: 'Instagram',
        followersCount: 50600000,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        instagramReach: 50600000,
        youtubeReach: 50600000,
    },
    {
        id: 'c-2',
        name: 'FreshBrew Co.',
        category: 'Fashion & Lifestyle',
        location: 'Bangalore',
        platform: 'Instagram',
        followersCount: 50600000,
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
        instagramReach: 50600000,
        youtubeReach: 50600000,
    },
    {
        id: 'c-3',
        name: 'FreshBrew Co.',
        category: 'Beauty',
        location: 'Mumbai',
        platform: 'YouTube',
        followersCount: 50600000,
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
        instagramReach: 50600000,
        youtubeReach: 50600000,
    },
    {
        id: 'c-4',
        name: 'FreshBrew Co.',
        category: 'Technology',
        location: 'Delhi',
        platform: 'YouTube',
        followersCount: 50600000,
        avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
        instagramReach: 50600000,
        youtubeReach: 50600000,
    },
    {
        id: 'c-5',
        name: 'FreshBrew Co.',
        category: 'Travel',
        location: 'Chennai',
        platform: 'Instagram',
        followersCount: 50600000,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        instagramReach: 50600000,
        youtubeReach: 50600000,
    },
    {
        id: 'c-6',
        name: 'FreshBrew Co.',
        category: 'Food',
        location: 'Pune',
        platform: 'Instagram',
        followersCount: 50600000,
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
        instagramReach: 50600000,
        youtubeReach: 50600000,
    },
    {
        id: 'c-7',
        name: 'FreshBrew Co.',
        category: 'Fitness & Health',
        location: 'Hyderabad',
        platform: 'YouTube',
        followersCount: 50600000,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
        instagramReach: 50600000,
        youtubeReach: 50600000,
    },
    {
        id: 'c-8',
        name: 'FreshBrew Co.',
        category: 'Gaming',
        location: 'Bangalore',
        platform: 'YouTube',
        followersCount: 50600000,
        avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=300&q=80',
        instagramReach: 50600000,
        youtubeReach: 50600000,
    },
];

export default function AllCreatorsScreen() {
    const router = useRouter();
    const { token } = useAuth();

    const [creators, setCreators] = useState<any[]>(DEFAULT_CREATORS);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter Modal States
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [activeTab, setActiveTab] = useState<FilterTab>('Categories');
    const [filterTabSearch, setFilterTabSearch] = useState('');

    // Active & Draft selected filter options
    const [appliedFilters, setAppliedFilters] = useState<Record<FilterTab, string[]>>({
        Categories: [],
        Platform: [],
        Location: [],
        Followers: [],
        Language: [],
    });
    const [draftFilters, setDraftFilters] = useState<Record<FilterTab, string[]>>({
        Categories: [],
        Platform: [],
        Location: [],
        Followers: [],
        Language: [],
    });

    const loadCreators = useCallback(async () => {
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const res = await getFollowSuggestions(token, 50, { role: 'CREATOR' });
            if (res.success && Array.isArray(res.data) && res.data.length > 0) {
                const mapped = res.data.map((item: any, idx: number) => ({
                    id: item.id || `fetched-${idx}`,
                    name: item.name || item.username || 'Creator',
                    category: item.categoryNames?.[0] || item.category || 'Entertainment',
                    location: item.location || 'Hyderabad',
                    platform: item.platform || 'Instagram',
                    followersCount: item.instagramFollowers || 50600000,
                    avatar: item.profilePicture || DEFAULT_CREATORS[idx % DEFAULT_CREATORS.length].avatar,
                    instagramReach: item.instagramFollowers || 50600000,
                    youtubeReach: item.youtubeSubscribers || 50600000,
                }));
                setCreators(mapped.length >= 8 ? mapped : [...mapped, ...DEFAULT_CREATORS.slice(mapped.length)]);
            } else {
                setCreators(DEFAULT_CREATORS);
            }
        } catch (e) {
            setCreators(DEFAULT_CREATORS);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadCreators();
    }, [loadCreators]);

    // Total count of applied filters across all tabs
    const totalAppliedCount = useMemo(() => {
        return Object.values(appliedFilters).reduce((acc, curr) => acc + curr.length, 0);
    }, [appliedFilters]);

    // Open Filter Modal
    const handleOpenFilters = () => {
        setDraftFilters(appliedFilters);
        setFilterTabSearch('');
        setShowFilterModal(true);
    };

    // Toggle single option
    const handleToggleOption = (tab: FilterTab, option: string) => {
        setDraftFilters((prev) => {
            const current = prev[tab];
            const exists = current.includes(option);
            const updated = exists ? current.filter((item) => item !== option) : [...current, option];
            return { ...prev, [tab]: updated };
        });
    };

    // Toggle Select All for current tab
    const currentTabOptions = FILTER_DATA[activeTab];
    const filteredTabOptions = useMemo(() => {
        if (!filterTabSearch.trim()) return currentTabOptions;
        return currentTabOptions.filter((opt) =>
            opt.toLowerCase().includes(filterTabSearch.trim().toLowerCase())
        );
    }, [currentTabOptions, filterTabSearch]);

    const isAllSelectedInCurrentTab = useMemo(() => {
        if (filteredTabOptions.length === 0) return false;
        return filteredTabOptions.every((opt) => draftFilters[activeTab].includes(opt));
    }, [filteredTabOptions, draftFilters, activeTab]);

    const handleToggleSelectAll = () => {
        setDraftFilters((prev) => {
            const current = prev[activeTab];
            if (isAllSelectedInCurrentTab) {
                const updated = current.filter((opt) => !filteredTabOptions.includes(opt));
                return { ...prev, [activeTab]: updated };
            } else {
                const combined = Array.from(new Set([...current, ...filteredTabOptions]));
                return { ...prev, [activeTab]: combined };
            }
        });
    };

    const handleClearAll = () => {
        setDraftFilters({
            Categories: [],
            Platform: [],
            Location: [],
            Followers: [],
            Language: [],
        });
        setFilterTabSearch('');
    };

    const handleApplyFilters = () => {
        setAppliedFilters(draftFilters);
        setShowFilterModal(false);
    };

    const handleRemoveFilterTag = (tab: FilterTab, val: string) => {
        setAppliedFilters((prev) => ({
            ...prev,
            [tab]: prev[tab].filter((item) => item !== val),
        }));
    };

    // Filter main creators list
    const filteredCreators = useMemo(() => {
        return creators.filter((c) => {
            // Search query filter
            const matchesSearch =
                !searchQuery.trim() ||
                (c.name || '').toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
                (c.category || '').toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
                (c.location || '').toLowerCase().includes(searchQuery.trim().toLowerCase());

            // Categories filter
            const selectedCats = appliedFilters.Categories;
            const matchesCategory =
                selectedCats.length === 0 ||
                selectedCats.some((cat) =>
                    (c.category || '').toLowerCase().includes(cat.toLowerCase())
                );

            // Location filter
            const selectedLocs = appliedFilters.Location;
            const matchesLocation =
                selectedLocs.length === 0 ||
                selectedLocs.some((loc) =>
                    (c.location || '').toLowerCase().includes(loc.toLowerCase())
                );

            // Platform filter
            const selectedPlats = appliedFilters.Platform;
            const matchesPlatform =
                selectedPlats.length === 0 ||
                selectedPlats.some((plat) =>
                    (c.platform || '').toLowerCase().includes(plat.toLowerCase())
                );

            return matchesSearch && matchesCategory && matchesLocation && matchesPlatform;
        });
    }, [creators, searchQuery, appliedFilters]);

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            {/* Top Back & Gradient Header */}
            <LinearGradient
                colors={['#2563EB', '#1E40AF', '#09090B']}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={styles.gradientBannerHeader}
            >
                <View style={styles.topBarRow}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                <View style={styles.titleSection}>
                    <Image source={imgAllCreator} style={styles.headerIcon} resizeMode="contain" />
                    <Text style={styles.headerTitle}>All creators</Text>
                </View>
            </LinearGradient>

            {/* Promo Banner Card */}
            <View style={styles.promoCardWrapper}>
                <LinearGradient
                    colors={['#4C1D95', '#6D28D9', '#C026D3', '#DB2777']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.promoCard}
                >
                    <View style={styles.promoContentLeft}>
                        <View style={styles.creatorHubBadge}>
                            <Ionicons name="sparkles" size={12} color="#FFFFFF" />
                            <Text style={styles.creatorHubBadgeText}>Creator Hub</Text>
                        </View>

                        <Text style={styles.promoTitle}>
                            Create.{'\n'}Connect.{'\n'}
                            <Text style={{ color: '#F472B6' }}>Grow.</Text>
                        </Text>

                        <Text style={styles.promoSubtitle}>
                            Collaborate with brands, showcase your talent, and unlock new opportunities.
                        </Text>

                        <TouchableOpacity
                            style={styles.exploreBtn}
                            activeOpacity={0.8}
                            onPress={() => router.push('/Brand-Create-Campaign' as any)}
                        >
                            <Text style={styles.exploreBtnText}>Explore Campaigns</Text>
                            <Ionicons name="arrow-forward" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
                        </TouchableOpacity>
                    </View>

                    {/* Banner Graphic Stats Overlays */}
                    <View style={styles.promoGraphicsRight}>
                        <View style={styles.miniStatCardTop}>
                            <Text style={styles.miniStatLabel}>Total Reach</Text>
                            <View style={styles.miniStatValueRow}>
                                <Text style={styles.miniStatValue}>128K</Text>
                                <View style={styles.miniBadgeGreen}>
                                    <Ionicons name="arrow-up" size={9} color="#10B981" />
                                    <Text style={styles.miniBadgeGreenText}>25%</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.miniStatCardMiddle}>
                            <Text style={styles.miniStatLabel}>Engagement Rate</Text>
                            <View style={styles.miniStatValueRow}>
                                <Text style={styles.miniStatValue}>8.6%</Text>
                                <View style={styles.miniBadgeGreen}>
                                    <Ionicons name="arrow-up" size={9} color="#10B981" />
                                    <Text style={styles.miniBadgeGreenText}>15%</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.miniStatCardBottom}>
                            <Text style={styles.miniStatValue}>12</Text>
                            <Text style={styles.miniStatSubtext}>Active Campaigns</Text>
                        </View>
                    </View>
                </LinearGradient>
            </View>

            {/* Search and Filter Row */}
            <View style={styles.controlsRow}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={18} color="#9CA3AF" />
                    <TextInput
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Search here for"
                        placeholderTextColor="#6B7280"
                        style={styles.searchInput}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color="#6B7280" />
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={handleOpenFilters}
                    activeOpacity={0.8}
                >
                    <Ionicons name="options-outline" size={18} color="#000000" />
                    <Text style={styles.filterButtonText}>Filter</Text>
                    {totalAppliedCount > 0 && (
                        <View style={styles.filterBadge}>
                            <Text style={styles.filterBadgeText}>{totalAppliedCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Applied Active Filter Chips */}
            {totalAppliedCount > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.appliedChipsScrollView}>
                    <View style={styles.appliedChipsContainer}>
                        {FILTER_TABS.map((tab) =>
                            appliedFilters[tab].map((val) => (
                                <View key={`${tab}-${val}`} style={styles.activeFilterChip}>
                                    <Text style={styles.activeFilterChipText}>{val}</Text>
                                    <TouchableOpacity
                                        onPress={() => handleRemoveFilterTag(tab, val)}
                                        style={{ marginLeft: 6 }}
                                    >
                                        <Ionicons name="close" size={14} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                        <TouchableOpacity onPress={() => setAppliedFilters({ Categories: [], Platform: [], Location: [], Followers: [], Language: [] })}>
                            <Text style={styles.clearAllTagsText}>Clear all</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={palette.textPrimary} />
                </View>
            ) : (
                <FlatList
                    data={filteredCreators}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    columnWrapperStyle={styles.columnWrapper}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={renderHeader}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={40} color="#6B7280" />
                            <Text style={styles.emptyText}>No creators found matching criteria</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.creatorCard}
                            activeOpacity={0.85}
                            onPress={() =>
                                router.push({
                                    pathname: '/creator-details',
                                    params: { userId: item.id },
                                } as any)
                            }
                        >
                            <View style={styles.cardHeader}>
                                <Image
                                    source={
                                        typeof item.avatar === 'string'
                                            ? { uri: item.avatar }
                                            : item.avatar || imgDefaultAvatar
                                    }
                                    style={styles.avatar}
                                />
                                <TouchableOpacity style={styles.arrowBtn} activeOpacity={0.7}>
                                    <Ionicons
                                        name="arrow-up-outline"
                                        size={16}
                                        color="#FFFFFF"
                                        style={{ transform: [{ rotate: '45deg' }] }}
                                    />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.creatorName} numberOfLines={1}>
                                {item.name}
                            </Text>

                            <View style={styles.categoryBadge}>
                                <Text style={styles.categoryBadgeText} numberOfLines={1}>
                                    {item.category}
                                </Text>
                            </View>

                            <View style={styles.socialStatsRow}>
                                <View style={styles.socialStatItem}>
                                    <Ionicons name="logo-instagram" size={14} color="#E1306C" />
                                    <Text style={styles.socialStatText}>{formatCount(item.instagramReach)}</Text>
                                </View>

                                <View style={styles.socialStatItem}>
                                    <Ionicons name="logo-youtube" size={14} color="#FF0000" />
                                    <Text style={styles.socialStatText}>{formatCount(item.youtubeReach)}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}

            {/* Figma-Matched Filter Modal */}
            <Modal
                visible={showFilterModal}
                transparent={false}
                animationType="slide"
                statusBarTranslucent
                onRequestClose={() => setShowFilterModal(false)}
            >
                <SafeAreaView style={styles.filterModalSafeArea} edges={['top', 'bottom']}>
                    {/* Modal Top Header */}
                    <View style={styles.filterModalHeader}>
                        <Text style={styles.filterModalTitle}>Filters</Text>
                        <TouchableOpacity onPress={handleClearAll} activeOpacity={0.7}>
                            <Text style={styles.filterClearAllText}>CLEAR ALL</Text>
                        </TouchableOpacity>
                    </View>

                    {/* 2-Column Body */}
                    <View style={styles.filterSplitBody}>
                        {/* Left Category Tabs Navigation Column */}
                        <View style={styles.filterLeftSidebar}>
                            {FILTER_TABS.map((tab) => {
                                const isActive = activeTab === tab;
                                const selectedCount = draftFilters[tab].length;
                                return (
                                    <TouchableOpacity
                                        key={tab}
                                        style={[
                                            styles.filterTabItem,
                                            isActive && styles.filterTabItemActive,
                                        ]}
                                        onPress={() => {
                                            setActiveTab(tab);
                                            setFilterTabSearch('');
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <Text
                                            style={[
                                                styles.filterTabText,
                                                isActive && styles.filterTabTextActive,
                                            ]}
                                        >
                                            {tab}
                                        </Text>
                                        {selectedCount > 0 && (
                                            <View style={styles.filterTabBadge}>
                                                <Text style={styles.filterTabBadgeText}>{selectedCount}</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Right Content Options Column */}
                        <View style={styles.filterRightContent}>
                            {/* Search Field inside Filter tab */}
                            <View style={styles.filterSearchRow}>
                                <Ionicons name="search" size={16} color="#8E8E93" />
                                <TextInput
                                    value={filterTabSearch}
                                    onChangeText={setFilterTabSearch}
                                    placeholder="Search"
                                    placeholderTextColor="#6E6E73"
                                    style={styles.filterSearchInput}
                                />
                                {filterTabSearch.length > 0 && (
                                    <TouchableOpacity onPress={() => setFilterTabSearch('')}>
                                        <Ionicons name="close-circle" size={16} color="#6E6E73" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Select All Option */}
                            <TouchableOpacity
                                style={styles.selectAllRow}
                                onPress={handleToggleSelectAll}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.checkboxSquare, isAllSelectedInCurrentTab && styles.checkboxSquareSelected]}>
                                    {isAllSelectedInCurrentTab && <Ionicons name="checkmark" size={12} color="#000000" />}
                                </View>
                                <Text style={styles.selectAllText}>
                                    Select All ({filteredTabOptions.length})
                                </Text>
                            </TouchableOpacity>

                            {/* List of Filter Items */}
                            <ScrollView style={styles.filterOptionsList} showsVerticalScrollIndicator={false}>
                                {filteredTabOptions.map((item) => {
                                    const isSelected = draftFilters[activeTab].includes(item);
                                    return (
                                        <TouchableOpacity
                                            key={item}
                                            style={styles.optionItemRow}
                                            onPress={() => handleToggleOption(activeTab, item)}
                                            activeOpacity={0.7}
                                        >
                                            <View style={styles.optionCheckSlot}>
                                                {isSelected && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
                                            </View>
                                            <Text
                                                style={[
                                                    styles.optionItemText,
                                                    isSelected && styles.optionItemTextSelected,
                                                ]}
                                            >
                                                {item}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    </View>

                    {/* Bottom Modal Actions */}
                    <View style={styles.filterModalFooter}>
                        <TouchableOpacity
                            style={styles.filterFooterBtn}
                            onPress={() => setShowFilterModal(false)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.filterCloseText}>CLOSE</Text>
                        </TouchableOpacity>

                        <View style={styles.filterFooterDivider} />

                        <TouchableOpacity
                            style={styles.filterFooterBtn}
                            onPress={handleApplyFilters}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.filterApplyText}>APPLY</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#09090B',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#09090B',
    },
    listContent: {
        paddingBottom: 40,
    },
    headerContainer: {
        marginBottom: 16,
    },
    gradientBannerHeader: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    topBarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    backButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleSection: {
        alignItems: 'flex-start',
        gap: 8,
    },
    headerIcon: {
        width: 44,
        height: 44,
    },
    headerTitle: {
        fontSize: 30,
        fontFamily: fonts.bold,
        color: '#FFFFFF',
        letterSpacing: -0.5,
    },
    promoCardWrapper: {
        paddingHorizontal: 16,
        marginTop: -16,
    },
    promoCard: {
        borderRadius: 24,
        padding: 18,
        flexDirection: 'row',
        justifyContent: 'space-between',
        overflow: 'hidden',
    },
    promoContentLeft: {
        flex: 1,
        paddingRight: 10,
    },
    creatorHubBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginBottom: 10,
        gap: 4,
    },
    creatorHubBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontFamily: fonts.medium,
    },
    promoTitle: {
        color: '#FFFFFF',
        fontSize: 24,
        fontFamily: fonts.bold,
        lineHeight: 28,
        marginBottom: 8,
    },
    promoSubtitle: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 11,
        fontFamily: fonts.regular,
        lineHeight: 15,
        marginBottom: 14,
    },
    exploreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    exploreBtnText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontFamily: fonts.medium,
    },
    promoGraphicsRight: {
        width: 130,
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    miniStatCardTop: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 12,
        padding: 8,
        width: '100%',
        marginBottom: 6,
    },
    miniStatCardMiddle: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 12,
        padding: 8,
        width: '100%',
        marginBottom: 6,
    },
    miniStatCardBottom: {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 12,
        padding: 8,
        width: '100%',
    },
    miniStatLabel: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 9,
        fontFamily: fonts.regular,
    },
    miniStatValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 2,
    },
    miniStatValue: {
        color: '#FFFFFF',
        fontSize: 13,
        fontFamily: fonts.bold,
    },
    miniStatSubtext: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 9,
        fontFamily: fonts.regular,
        marginTop: 1,
    },
    miniBadgeGreen: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 6,
    },
    miniBadgeGreenText: {
        color: '#10B981',
        fontSize: 8,
        fontFamily: fonts.semibold,
        marginLeft: 1,
    },
    controlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginTop: 18,
        gap: 12,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#18181B',
        borderRadius: 16,
        paddingHorizontal: 14,
        height: 48,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    searchInput: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: fonts.regular,
        marginLeft: 10,
        paddingVertical: 0,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 18,
        height: 48,
        gap: 6,
        position: 'relative',
    },
    filterButtonText: {
        color: '#000000',
        fontSize: 14,
        fontFamily: fonts.semibold,
    },
    filterBadge: {
        backgroundColor: '#EF4444',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginLeft: 2,
    },
    filterBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontFamily: fonts.bold,
    },
    appliedChipsScrollView: {
        paddingHorizontal: 16,
        marginTop: 12,
    },
    appliedChipsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    activeFilterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#27272A',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    activeFilterChipText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontFamily: fonts.medium,
    },
    clearAllTagsText: {
        color: '#EF4444',
        fontSize: 12,
        fontFamily: fonts.semibold,
        marginLeft: 6,
    },
    columnWrapper: {
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 12,
    },
    creatorCard: {
        flex: 1,
        backgroundColor: '#18181B',
        borderRadius: 20,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        justifyContent: 'space-between',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#27272A',
    },
    arrowBtn: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    creatorName: {
        color: '#FFFFFF',
        fontSize: 15,
        fontFamily: fonts.semibold,
        marginTop: 10,
    },
    categoryBadge: {
        backgroundColor: '#27272A',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        marginTop: 6,
    },
    categoryBadgeText: {
        color: '#9CA3AF',
        fontSize: 11,
        fontFamily: fonts.regular,
    },
    socialStatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        gap: 12,
    },
    socialStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    socialStatText: {
        color: '#D1D5DB',
        fontSize: 11,
        fontFamily: fonts.medium,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 8,
    },
    emptyText: {
        color: '#9CA3AF',
        fontSize: 14,
        fontFamily: fonts.regular,
    },

    /* ── Figma Filter Modal Styles ── */
    filterModalSafeArea: {
        flex: 1,
        backgroundColor: '#000000',
    },
    filterModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#000000',
        borderBottomWidth: 1,
        borderBottomColor: '#1C1C1E',
    },
    filterModalTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontFamily: fonts.semibold,
    },
    filterClearAllText: {
        color: '#EF4444',
        fontSize: 14,
        fontFamily: fonts.semibold,
        letterSpacing: 0.5,
    },
    filterSplitBody: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#000000',
    },
    filterLeftSidebar: {
        width: 140,
        backgroundColor: '#18181D',
        borderRightWidth: 1,
        borderRightColor: '#1C1C1E',
    },
    filterTabItem: {
        paddingVertical: 18,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    filterTabItemActive: {
        backgroundColor: '#000000',
        borderLeftWidth: 3,
        borderLeftColor: '#FFFFFF',
    },
    filterTabText: {
        color: '#8E8E93',
        fontSize: 15,
        fontFamily: fonts.regular,
    },
    filterTabTextActive: {
        color: '#FFFFFF',
        fontFamily: fonts.semibold,
    },
    filterTabBadge: {
        backgroundColor: '#EF4444',
        borderRadius: 8,
        paddingHorizontal: 5,
        paddingVertical: 1,
    },
    filterTabBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontFamily: fonts.bold,
    },
    filterRightContent: {
        flex: 1,
        backgroundColor: '#000000',
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    filterSearchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
        marginBottom: 12,
    },
    filterSearchInput: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 15,
        fontFamily: fonts.regular,
        marginLeft: 10,
        paddingVertical: 0,
    },
    selectAllRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1C1C1E',
        marginBottom: 8,
    },
    checkboxSquare: {
        width: 18,
        height: 18,
        borderRadius: 3,
        borderWidth: 1.5,
        borderColor: '#8E8E93',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    checkboxSquareSelected: {
        backgroundColor: '#FFFFFF',
        borderColor: '#FFFFFF',
    },
    selectAllText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontFamily: fonts.medium,
    },
    filterOptionsList: {
        flex: 1,
    },
    optionItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#141416',
    },
    optionCheckSlot: {
        width: 24,
        alignItems: 'center',
        marginRight: 8,
    },
    optionItemText: {
        color: '#8E8E93',
        fontSize: 15,
        fontFamily: fonts.regular,
    },
    optionItemTextSelected: {
        color: '#FFFFFF',
        fontFamily: fonts.medium,
    },
    filterModalFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 60,
        backgroundColor: '#000000',
        borderTopWidth: 1,
        borderTopColor: '#1C1C1E',
    },
    filterFooterBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },
    filterFooterDivider: {
        width: 1,
        height: 28,
        backgroundColor: '#2C2C2E',
    },
    filterCloseText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontFamily: fonts.bold,
        letterSpacing: 0.5,
    },
    filterApplyText: {
        color: '#EF4444',
        fontSize: 15,
        fontFamily: fonts.bold,
        letterSpacing: 0.5,
    },
});
