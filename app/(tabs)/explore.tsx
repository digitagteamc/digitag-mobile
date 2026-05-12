import { useAuth } from '@/context/AuthContext';
import { useProfileGate } from '@/context/ProfileGateContext';
import { getCreatorById, getFeed, getFreelancerById, sendCollaboration } from '@/services/userService';
import { getRoleTheme, useRoleTheme } from '@/theme/useRoleTheme';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Animated, { 
  useSharedValue, 
  useAnimatedScrollHandler, 
  useAnimatedProps, 
  withSpring,
  useDerivedValue,
  FadeIn,
  FadeOut
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Path, Stop, LinearGradient as SvgGradient, Text as SvgText } from 'react-native-svg';

const { width } = Dimensions.get('window');

const FALLBACK_BANNER = 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=1000&auto=format&fit=crop';

const imgPhotography = require('../../assets/categories/Photography.gif');
const imgEditor = require('../../assets/categories/editor.gif');
const imgVideography = require('../../assets/categories/Videography.gif');
const imgGrowth = require('../../assets/categories/growth spcielist.gif');
const imgScriptWriters = require('../../assets/categories/script-writing.gif');
const imgStyling = require('../../assets/categories/Styling-makeup.gif');
const imgFashion = require('../../assets/categories/Fashion-Designers.gif');
const imgProperty = require('../../assets/categories/property-rental.gif');

const CATEGORIES = [
  { 
    id: 'photography', 
    label: 'Photography', 
    image: imgPhotography, 
    heroLine1: 'Every', heroLine2: 'Moment', heroLine3: '', 
    heroDesc: 'Turning moments into timeless visual stories with creativity and emotion.', 
    gradient: ['#7C3AED', '#4C1D95'] as [string, string] 
  },
  { 
    id: 'editor', 
    label: 'Editor', 
    image: imgEditor, 
    heroLine1: 'Editing That Brings', heroLine2: 'Stories to Life', heroLine3: '', 
    heroDesc: 'High-quality edits designed to make your content stand out across every platform.', 
    gradient: ['#9D174D', '#831843'] as [string, string] 
  },
  { 
    id: 'videography', 
    label: 'Videography', 
    image: imgVideography, 
    heroLine1: 'Bringing Ideas to Life', heroLine2: 'on Screen', heroLine3: '', 
    heroDesc: 'High-quality edits designed to make your content stand out across every platform.', 
    gradient: ['#0284C7', '#075985'] as [string, string] 
  },
  { 
    id: 'growth', 
    label: 'Growth\nSpecialist', 
    image: imgGrowth, 
    heroLine1: 'Accelerate Your', heroLine2: 'Brand Growth', heroLine3: '', 
    heroDesc: 'Growth-focused solutions tailored for modern creators, brands, and agencies.', 
    gradient: ['#4338CA', '#3730A3'] as [string, string] 
  },
  { 
    id: 'script', 
    label: 'Script Writers', 
    image: imgScriptWriters, 
    heroLine1: 'Crafting Compelling', heroLine2: 'Narratives', heroLine3: '', 
    heroDesc: 'Engaging scripts that drive your story forward and captivate your audience.', 
    gradient: ['#1E3A8A', '#1E40AF'] as [string, string] 
  },
  { 
    id: 'styling', 
    label: 'Styling &\nmakeup', 
    image: imgStyling, 
    heroLine1: 'The Art of', heroLine2: 'Visual Style', heroLine3: '', 
    heroDesc: 'Professional makeup and styling to ensure you look your best on camera.', 
    gradient: ['#7E22CE', '#6B21A8'] as [string, string] 
  },
  { 
    id: 'fashion', 
    label: 'Fashion\nDesigners', 
    image: imgFashion, 
    heroLine1: 'Innovative', heroLine2: 'Fashion Design', heroLine3: '', 
    heroDesc: 'Custom clothing and style consulting for high-impact visual productions.', 
    gradient: ['#BE185D', '#9D174D'] as [string, string] 
  },
  { 
    id: 'property', 
    label: 'Property\nRental', 
    image: imgProperty, 
    heroLine1: 'Perfect Locations', heroLine2: 'for Your Vision', heroLine3: '', 
    heroDesc: 'Premium properties and studio spaces for rent for any type of production.', 
    gradient: ['#B45309', '#92400E'] as [string, string] 
  },
];

function getInitials(name: string | null | undefined) {
  if (!name) return 'U';
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

function timeAgo(dateStr: string | null | undefined) {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.max(0, Math.round(diffMs / 60000));
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.round(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.round(diffHrs / 24)}d ago`;
}

const GradientTitle = ({ text }: { text: string }) => {
  const fontSize = 28;
  const w = text.length * fontSize * 0.58;
  const h = fontSize * 1.4;
  return (
    <View style={{ width: w, height: h }}>
      <Svg height="100%" width="100%" viewBox={`0 0 ${w} ${h}`}>
        <Defs>
          <SvgGradient id="titleGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="1" />
            <Stop offset="1" stopColor="#ff6ab9" stopOpacity="1" />
          </SvgGradient>
        </Defs>
        <SvgText fill="url(#titleGrad)" fontSize={fontSize} fontFamily="Poppins_600SemiBold" x="0" y={fontSize}>
          {text}
        </SvgText>
      </Svg>
    </View>
  );
};

const AnimatedPath = Animated.createAnimatedComponent(Path);

const FolderBackground = ({ scrollX, activeIndexAnim, width, height, tabWidth, tabHeight, radius, colors }: any) => {
  const r = radius || 24;
  const tw = tabWidth || 110;
  const th = tabHeight || 90;
  const w = width;
  const h = height;

  const animatedProps = useAnimatedProps(() => {
    const tx = Math.max(0, activeIndexAnim.value * 108 - scrollX.value); // 100 inactive width + 8 gap

    const d = `
      M 0 ${th + r}
      ${tx > 0 ? `
        A ${r} ${r} 0 0 1 ${r} ${th}
        L ${tx - r} ${th}
        A ${r} ${r} 0 0 0 ${tx} ${th - r}
        L ${tx} ${r}
        A ${r} ${r} 0 0 1 ${tx + r} 0
      ` : `
        M 0 ${r}
        A ${r} ${r} 0 0 1 ${r} 0
      `}
      L ${tx + tw - r} 0
      A ${r} ${r} 0 0 1 ${tx + tw} ${r}
      L ${tx + tw} ${th - r}
      A ${r} ${r} 0 0 0 ${tx + tw + r} ${th}
      L ${w - r} ${th}
      A ${r} ${r} 0 0 1 ${w} ${th + r}
      L ${w} ${h - r}
      A ${r} ${r} 0 0 1 ${w - r} ${h}
      L ${r} ${h}
      A ${r} ${r} 0 0 1 0 ${h - r}
      Z
    `;
    return { d };
  });

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, width: w, height: h }}>
      <Svg width={w} height={h}>
        <Defs>
          <SvgGradient id="folderGrad" x1="0" y1="0" x2="0.5" y2="1">
            <Stop offset="0" stopColor={colors[0]} />
            <Stop offset="1" stopColor={colors[1]} />
          </SvgGradient>
        </Defs>
        <AnimatedPath animatedProps={animatedProps} fill="url(#folderGrad)" />
      </Svg>
      {/* Sparkles Overlay */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Sparkles />
      </View>
    </View>
  );
};

const Sparkles = () => {
  return (
    <>
      <Ionicons name="sparkles" size={16} color="rgba(255,255,255,0.2)" style={{ position: 'absolute', top: 40, left: 80 }} />
      <Ionicons name="sparkles" size={12} color="rgba(255,255,255,0.1)" style={{ position: 'absolute', top: 120, right: 40 }} />
      <Ionicons name="sparkles" size={20} color="rgba(255,255,255,0.15)" style={{ position: 'absolute', bottom: 60, left: 30 }} />
      <View style={[s.sparkleDot, { width: 4, height: 4, top: 100, left: 120, opacity: 0.3 }]} />
      <View style={[s.sparkleDot, { width: 2, height: 2, top: 150, right: 100, opacity: 0.2 }]} />
      <View style={[s.sparkleDot, { width: 3, height: 3, bottom: 80, right: 150, opacity: 0.4 }]} />
    </>
  );
};

export default function ExploreTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, isGuest, userRole } = useAuth();
  const { requireProfile } = useProfileGate();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);
  const [portfolioModalVisible, setPortfolioModalVisible] = useState(false);
  const [selectedPortfolioLink, setSelectedPortfolioLink] = useState<string | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [collabSentIds, setCollabSentIds] = useState<Set<string>>(new Set());

  const fetchPosts = useCallback(async () => {
    if (!token) { setPosts([]); setLoading(false); return; }
    try {
      const res = await getFeed(token);
      setPosts(Array.isArray(res.data) ? res.data : []);
    } catch { setPosts([]); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const onRefresh = async () => { setRefreshing(true); await fetchPosts(); setRefreshing(false); };

  const availableCategories = useMemo(() => {
    // If user is a Freelancer, only show the first 4 categories
    if (userRole === 'FREELANCER') {
      return CATEGORIES.slice(0, 4);
    }
    // Otherwise (Creator or Guest), show all
    return CATEGORIES;
  }, [userRole]);

  const activeCat = availableCategories.find(c => c.id === activeCategory) || availableCategories[0];
  const activeIndex = Math.max(0, availableCategories.findIndex(c => c.id === activeCategory));

  const scrollX = useSharedValue(0);
  const activeIndexAnim = useSharedValue(activeIndex);

  useEffect(() => {
    // Instantly snap the folder tab when the active index changes (no effects)
    activeIndexAnim.value = activeIndex;
  }, [activeIndex]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      // Synchronize the scroll position with zero-lag on the UI thread
      scrollX.value = event.contentOffset.x;
    },
  });

  useEffect(() => {
    if (!availableCategories.find(c => c.id === activeCategory)) {
      setActiveCategory(availableCategories[0].id);
    }
  }, [availableCategories]);

  // Constants for tab layout
  const TAB_ACTIVE_WIDTH = 120;
  const TAB_INACTIVE_WIDTH = 100;
  const TAB_GAP = 8;

  const allCards = posts.map((p) => {
    const owner = p.owner || {};
    const name = owner.name || (owner.role === 'FREELANCER' ? 'Freelancer' : 'Creator');
    return {
      id: p.id, ownerId: owner.id, ownerRole: owner.role, name,
      role: owner.role ? owner.role.charAt(0) + owner.role.slice(1).toLowerCase() : 'User',
      desc: p.description || '',
      price: p.collaborationType === 'PAID' ? 'Paid Collab' : 'Free Collab',
      time: timeAgo(p.createdAt),
      avatarUri: owner.profilePicture || null,
      isInitials: !owner.profilePicture,
      initials: getInitials(name),
      experience: owner.experience || '5 years',
      languages: owner.languages || 'Telugu, English, Tamil',
      location: owner.location || owner.city || 'Hyderabad',
      category: owner.category || p.category || '',
    };
  });

  const cards = allCards.filter((item) => {
    if (!activeCategory) return true;
    return true; 
  });

  const handleCardTap = (postId: string, ownerId?: string) => {
    if (isGuest || !token) { router.push('/role-selection'); return; }
    if (!requireProfile('view this profile')) return;
    router.push({ pathname: '/creator-details', params: { postId, ...(ownerId ? { userId: ownerId } : {}) } } as any);
  };

  const handlePortfolio = async (ownerId?: string, ownerRole?: string) => {
    setSelectedPortfolioLink(null); setPortfolioLoading(true); setPortfolioModalVisible(true);
    try {
      if (!token || !ownerId) { setPortfolioLoading(false); return; }
      let profileData: any = null;
      if (ownerRole === 'FREELANCER') {
        const res = await getFreelancerById(ownerId, token);
        profileData = res.success ? res.data : null;
      } else {
        const res = await getCreatorById(ownerId, token);
        profileData = res.success ? res.data : null;
      }
      setSelectedPortfolioLink(profileData?.portfolioUrl || profileData?.portfolio || profileData?.portfolioLink || null);
    } catch { setSelectedPortfolioLink(null); } finally { setPortfolioLoading(false); }
  };

  const handleShare = async (postId: string) => {
    try {
      await Share.share({ message: `Check out this post on Digitag! https://digitag.com/post/${postId}`, title: 'Digitag Post' });
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const handleMessage = (ownerId?: string) => {
    if (isGuest || !token) { router.push('/role-selection'); return; }
    if (!requireProfile('message this user')) return;
  };

  const handleCall = () => {
    if (isGuest || !token) { router.push('/role-selection'); return; }
    if (!requireProfile('call this user')) return;
    Alert.alert('Contact', 'Phone contact is not available yet.');
  };

  return (
    <View style={s.root}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ED2A91" />}
      >
        {/* ═══ HEADER ═══ */}
        <View style={[s.header, { paddingTop: insets.top + 16 }]}>
          <GradientTitle text="Explore All" />
          <Text style={s.subtitle}>Discover & Connect with the right people</Text>
        </View>

        {/* ═══ HERO SECTION (FOLDER STYLE) ═══ */}
        <View style={s.heroWrapper}>
          <FolderBackground
            width={width - 32}
            height={340}
            scrollX={scrollX}
            activeIndexAnim={activeIndexAnim}
            tabWidth={TAB_ACTIVE_WIDTH}
            tabHeight={95}
            colors={activeCat.gradient}
          />

          {/* ═══ CATEGORY TABS ═══ */}
          <View style={s.catTabsContainer}>
            <Animated.ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.catTabsRow}
              onScroll={scrollHandler}
              scrollEventThrottle={16}
            >
              {availableCategories.map((cat) => {
                const isActive = cat.id === activeCategory;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    activeOpacity={0.8}
                    onPress={() => setActiveCategory(cat.id)}
                    style={[
                      isActive ? s.catTabActive : s.catTabInactive,
                      { width: isActive ? TAB_ACTIVE_WIDTH : TAB_INACTIVE_WIDTH }
                    ]}
                  >
                    <Image source={cat.image} style={s.catTabImg} resizeMode="contain" />
                    <Text style={isActive ? s.catTabLabelActive : s.catTabLabel}>{cat.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </Animated.ScrollView>
          </View>

          {/* ═══ HERO CONTENT ═══ */}
          <View style={s.heroContentContainer}>
            <View style={s.heroContent}>
              <View style={s.heroTextArea}>
                <Text style={s.heroTitle}>
                  <Text style={s.heroTitleBold}>{activeCat.heroLine1} </Text>
                  <Text style={s.heroTitleFaded}>{activeCat.heroLine2}{"\n"}</Text>
                  <Text style={s.heroTitleFaded}>{activeCat.heroLine3}</Text>
                </Text>
                <Text style={s.heroDesc}>{activeCat.heroDesc}</Text>
              </View>
              <Image source={activeCat.image} style={s.heroCharacter} resizeMode="contain" />
            </View>
          </View>
        </View>
        <View style={s.filterRow}>
          <View style={s.filterCol}>
            <Text style={s.filterLabel}>Price Range</Text>
            <TouchableOpacity style={s.filterDropdown} activeOpacity={0.7}>
              <Text style={s.filterPlaceholder}>Select Price Range</Text>
              <Ionicons name="filter" size={16} color="#6e7180" />
            </TouchableOpacity>
          </View>
          <View style={s.filterCol}>
            <Text style={s.filterLabel}>Experience</Text>
            <TouchableOpacity style={s.filterDropdown} activeOpacity={0.7}>
              <Text style={s.filterPlaceholder}>Select experience</Text>
              <Ionicons name="chevron-down" size={20} color="#6e7180" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ═══ FEED CARDS ═══ */}
        {loading ? (
          <ActivityIndicator size="large" color="#ED2A91" style={{ marginTop: 40 }} />
        ) : cards.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="compass-outline" size={48} color="#3A3A47" />
            <Text style={s.emptyTitle}>Nothing to explore yet</Text>
            <Text style={s.emptySubtitle}>Pull down to refresh — new posts will appear here.</Text>
          </View>
        ) : (
          <View style={s.feedList}>
            {cards.map((item) => {
              const postTheme = getRoleTheme(item.ownerRole);
              const accent = postTheme.primary;
              return (
                <TouchableOpacity key={item.id} style={s.card} activeOpacity={0.9} onPress={() => handleCardTap(item.id, item.ownerId)}>
                  {/* Avatar + Name */}
                  <View style={s.cardTop}>
                    <View style={s.cardAvatarWrap}>
                      {item.isInitials ? (
                        <View style={[s.cardAvatar, { backgroundColor: accent + '33' }]}>
                          <Text style={[s.cardInitials, { color: accent }]}>{item.initials}</Text>
                        </View>
                      ) : (
                        <Image source={{ uri: item.avatarUri }} style={s.cardAvatar} resizeMode="cover" />
                      )}
                    </View>
                    <View style={s.cardNameArea}>
                      <View style={s.cardNameRow}>
                        <Text style={s.cardName}>{item.name}</Text>
                        <Ionicons name="shield-checkmark" size={14} color="#f26930" style={{ marginLeft: 6 }} />
                      </View>
                      <TouchableOpacity onPress={() => handlePortfolio(item.ownerId, item.ownerRole)}>
                        <Text style={[s.cardPortfolioLink, { color: accent }]}>See Portfolio ▾</Text>
                      </TouchableOpacity>
                    </View>
                    {/* Bookmark */}
                    <TouchableOpacity style={s.bookmarkBtn}>
                      <Ionicons name="bookmark-outline" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>

                  {/* Description */}
                  <Text style={s.cardDesc} numberOfLines={2}>
                    {item.desc || 'Looking for a Photographer experienced in creating engaging short-form content...'}
                    <Text style={{ color: accent }}> See more</Text>
                  </Text>

                  {/* Info Grid */}
                  <View style={s.infoGrid}>
                    {/* Row 1 */}
                    <View style={s.infoRow}>
                      <View style={s.infoCell}>
                        <Text style={s.infoLabel}>Experience</Text>
                        <View style={s.infoValueRow}>
                          <Ionicons name="briefcase-outline" size={13} color="#a1a2a4" />
                          <Text style={s.infoValue}>{item.experience}</Text>
                        </View>
                      </View>
                      <View style={s.infoCell}>
                        <Text style={s.infoLabel}>Price Level <Text style={s.infoLabelSub}>(Primary)</Text></Text>
                        <View style={s.infoValueRow}>
                          {[1, 2, 3, 4].map(i => (
                            <Text key={i} style={{ color: '#f26930', fontSize: 14 }}>₹</Text>
                          ))}
                        </View>
                      </View>
                    </View>
                    {/* Row 2 */}
                    <View style={s.infoRow}>
                      <View style={s.infoCell}>
                        <Text style={s.infoLabel}>Language</Text>
                        <View style={s.infoValueRow}>
                          <Ionicons name="language-outline" size={13} color="#a1a2a4" />
                          <Text style={s.infoValue}>{item.languages}</Text>
                        </View>
                      </View>
                      <View style={s.infoCell}>
                        <Text style={s.infoLabel}>Location <Text style={s.infoLabelSub}>(Primary)</Text></Text>
                        <View style={s.infoValueRow}>
                          <Ionicons name="location-outline" size={13} color="#a1a2a4" />
                          <Text style={s.infoValue}>{item.location}</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Bottom Actions */}
                  <View style={s.cardBottom}>
                    <View style={s.cardActions}>
                      <TouchableOpacity style={s.actionCircle} onPress={() => handleMessage(item.ownerId)}>
                        <Ionicons name="chatbubble-ellipses-outline" size={16} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity style={s.actionCircle} onPress={handleCall}>
                        <Ionicons name="call-outline" size={16} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity style={s.actionCircle} onPress={() => handleShare(item.id)}>
                        <Ionicons name="share-social-outline" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                    <View style={s.cardBottomRight}>
                      <TouchableOpacity
                        style={[s.seePortfolioBtn, { backgroundColor: accent }]}
                        onPress={() => handlePortfolio(item.ownerId, item.ownerRole)}
                      >
                        <Text style={s.seePortfolioBtnText}>See Portfolio</Text>
                      </TouchableOpacity>
                      <View style={s.timeRow}>
                        <Ionicons name="time-outline" size={12} color="#a1a2a4" />
                        <Text style={s.timeText}>{item.time || '4h ago'}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ═══ PORTFOLIO MODAL ═══ */}
      <Modal visible={portfolioModalVisible} transparent animationType="slide" onRequestClose={() => setPortfolioModalVisible(false)}>
        <View style={s.modalOverlay}>
          <TouchableOpacity style={s.modalDismiss} activeOpacity={1} onPress={() => setPortfolioModalVisible(false)} />
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Feather name="link" size={20} color="#fff" />
                <Text style={s.modalTitle}>Portfolio Links</Text>
              </View>
              <TouchableOpacity style={s.modalClose} onPress={() => setPortfolioModalVisible(false)}>
                <Feather name="x" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
            {portfolioLoading ? (
              <ActivityIndicator color="#A78BFA" style={{ marginTop: 16 }} />
            ) : selectedPortfolioLink ? (
              <TouchableOpacity style={s.portfolioRow} onPress={() => {
                let url = selectedPortfolioLink;
                if (!url.startsWith('http')) url = 'https://' + url;
                Linking.openURL(url);
              }}>
                <Text style={s.portfolioLinkText}>{selectedPortfolioLink}</Text>
                <Feather name="arrow-up-right" size={20} color="#A78BFA" />
              </TouchableOpacity>
            ) : (
              <Text style={s.noPortfolio}>No portfolio link provided.</Text>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  scroll: { flex: 1 },

  // Header
  header: { paddingHorizontal: 16, paddingBottom: 20 },
  subtitle: { color: '#E2E2E2', fontSize: 12, marginTop: 4, fontFamily: 'Poppins_400Regular', lineHeight: 18 },

  // Hero wrapper
  heroWrapper: { marginHorizontal: 16, marginBottom: 20, position: 'relative', height: 340 },
  catTabsContainer: { flexDirection: 'row', zIndex: 1, height: 95 },
  catTabsRow: { gap: 8, paddingHorizontal: 0 },

  catTabActive: {
    alignItems: 'center', justifyContent: 'center', height: 95,
  },
  catTabInactive: {
    alignItems: 'center', justifyContent: 'center', height: 75,
    backgroundColor: '#1A1A1A', borderRadius: 24, alignSelf: 'flex-end',
  },
  catTabImg: { width: 28, height: 28, marginBottom: 4 },
  catTabLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: 'Poppins_600SemiBold', textAlign: 'center' },
  catTabLabelActive: { color: '#fff', fontSize: 11, fontFamily: 'Poppins_600SemiBold', textAlign: 'center' },

  heroContentContainer: { flex: 1, paddingHorizontal: 20, paddingBottom: 24, justifyContent: 'flex-end' },

  // Sparkle dots
  sparkleDot: { position: 'absolute', borderRadius: 99, backgroundColor: '#fff' },

  // Hero text + character
  heroContent: { flexDirection: 'row', alignItems: 'center' },
  heroTextArea: { flex: 1.2, paddingRight: 10 },
  heroTitle: { fontSize: 32, lineHeight: 38, fontStyle: 'italic', fontFamily: 'Poppins_700Bold' },
  heroTitleBold: { color: '#fff' },
  heroTitleFaded: { color: 'rgba(255,255,255,0.3)' },
  heroDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 18, marginTop: 8 },
  heroCharacter: { flex: 1, height: 160, marginLeft: 10 },

  // Filters
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 16, marginBottom: 24 },
  filterCol: { flex: 1 },
  filterLabel: { color: '#fff', fontSize: 14, fontFamily: 'Poppins_400Regular', marginBottom: 6 },
  filterDropdown: {
    height: 46, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(64,64,64,0.5)',
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, justifyContent: 'space-between',
  },
  filterPlaceholder: { color: '#6e7180', fontSize: 13, fontFamily: 'Poppins_400Regular' },

  // Empty
  emptyState: { paddingHorizontal: 40, paddingTop: 60, alignItems: 'center', gap: 10 },
  emptyTitle: { color: '#fff', fontSize: 17, fontWeight: '600', marginTop: 10 },
  emptySubtitle: { color: '#888', fontSize: 13, textAlign: 'center', lineHeight: 20 },

  // Feed
  feedList: { paddingHorizontal: 16, gap: 16 },

  // Card
  card: {
    backgroundColor: '#1a1a1a', borderRadius: 24, padding: 16,
    borderWidth: 1, borderColor: '#000',
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  cardAvatarWrap: { marginRight: 14 },
  cardAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#333', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  cardInitials: { fontSize: 20, fontWeight: '700' },
  cardNameArea: { flex: 1, paddingTop: 4 },
  cardNameRow: { flexDirection: 'row', alignItems: 'center' },
  cardName: { color: '#fff', fontSize: 18, fontFamily: 'Poppins_500Medium' },
  cardPortfolioLink: { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  bookmarkBtn: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(39,39,42,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Description
  cardDesc: { color: '#d1d2d4', fontSize: 12, fontFamily: 'Poppins_300Light', lineHeight: 18, marginBottom: 14 },

  // Info Grid
  infoGrid: { gap: 12, marginBottom: 14 },
  infoRow: { flexDirection: 'row', gap: 16 },
  infoCell: { flex: 1 },
  infoLabel: { color: '#fff', fontSize: 11, fontFamily: 'Poppins_400Regular', marginBottom: 4 },
  infoLabelSub: { color: '#d1d2d4' },
  infoValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoValue: { color: '#a1a2a4', fontSize: 11, fontFamily: 'Poppins_400Regular' },

  // Bottom
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionCircle: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  cardBottomRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  seePortfolioBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99,
    alignItems: 'center', justifyContent: 'center',
  },
  seePortfolioBtnText: { color: '#fff', fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  timeText: { color: '#a1a2a4', fontSize: 10, fontFamily: 'Poppins_500Medium' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalDismiss: { flex: 1 },
  modalContent: {
    height: '30%', backgroundColor: '#1E1E24', borderTopLeftRadius: 30, borderTopRightRadius: 30,
    padding: 24, borderTopWidth: 1, borderColor: 'rgba(156,156,156,0.3)',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 },
  modalTitle: { color: '#fff', fontSize: 18, fontFamily: 'Poppins_600SemiBold' },
  modalClose: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  portfolioRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  portfolioLinkText: { color: '#fff', fontSize: 16, fontFamily: 'Poppins_500Medium', flex: 1, marginRight: 12 },
  noPortfolio: { color: '#8A8A99', fontSize: 14, fontFamily: 'Poppins_400Regular', marginTop: 10 },
});
