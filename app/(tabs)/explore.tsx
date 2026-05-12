import { useAuth } from '@/context/AuthContext';
import { useProfileGate } from '@/context/useProfileGate';
import { getCreatorById, getFeed, getFreelancerById, sendCollaboration } from '@/services/userService';
import { getRoleTheme } from '@/theme/useRoleTheme';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
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
import Svg, { Defs, Stop, LinearGradient as SvgGradient, Text as SvgText } from 'react-native-svg';

const { width } = Dimensions.get('window');

const FALLBACK_BANNER = 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=1000&auto=format&fit=crop';

const imgPhotography = require('../../assets/categories/Photography.gif');
const imgEditor = require('../../assets/categories/editor.gif');
const imgVideography = require('../../assets/categories/Videography.gif');
const imgGrowth = require('../../assets/categories/growth spcielist.gif');

const CATEGORIES = [
  { id: 'photography', label: 'Photography', image: imgPhotography, heroLine1: 'Capture', heroLine2: 'Every', heroLine3: 'Beautifully', heroDesc: 'Turning moments into timeless visual stories with creativity and emotion.', gradient: ['rgba(53, 10, 97, 1)', 'rgba(136, 21, 250, 1)', 'rgba(53, 10, 97, 1)'] as [string, string, string] },
  { id: 'editor', label: 'Editor', image: imgEditor, heroLine1: 'Amazing', heroLine2: 'Things', heroLine3: 'Stories', heroDesc: 'High-quality edits designed to make your content stand out across every platform.', gradient: ['#1a0533', '#6e0a5a', '#a6148a'] as [string, string, string] },
  { id: 'videography', label: 'Videography', image: imgVideography, heroLine1: 'Film', heroLine2: 'Every', heroLine3: 'Moment', heroDesc: 'Capture cinematic stories that bring your vision to life with motion.', gradient: ['#0a1a33', '#0a3b6e', '#145ba6'] as [string, string, string] },
  { id: 'growth', label: 'Growth\nSpecialist', image: imgGrowth, heroLine1: 'Scale', heroLine2: 'Your', heroLine3: 'Brand', heroDesc: 'Strategic growth solutions to amplify your digital presence and reach.', gradient: ['#331a0a', '#6e3b0a', '#a65b14'] as [string, string, string] },
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

export default function ExploreTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, isGuest, userRole } = useAuth();
  const { requireProfile } = useProfileGate();
  const theme = useRoleTheme();
  const params = useLocalSearchParams<{ category?: string }>();
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

  const activeCat = CATEGORIES.find(c => c.id === activeCategory) || CATEGORIES[0];

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

  // Filter cards by active category tab
  const cards = allCards.filter((item) => {
    if (!activeCategory) return true;
    const keyword = activeCategory.toLowerCase();
    const desc = (item.desc || '').toLowerCase();
    const cat = (item.category || '').toLowerCase();
    const role = (item.role || '').toLowerCase();
    return desc.includes(keyword) || cat.includes(keyword) || role.includes(keyword) || true; // show all for now, backend doesn't support category filter
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

  const handleCollab = async (postId: string, ownerId?: string) => {
    if (isGuest || !token) { router.push('/role-selection'); return; }
    if (!requireProfile('send a collaboration request')) return;
    if (!ownerId) return;
    if (collabSentIds.has(postId)) { Alert.alert('Already Sent', 'You already sent a request for this post.'); return; }
    try {
      const res = await sendCollaboration(token, { receiverId: ownerId, postId });
      if (res.success) {
        setCollabSentIds(prev => new Set(prev).add(postId));
        Alert.alert('Request Sent!', 'Your collaboration request has been sent.');
      } else { Alert.alert('Request Failed', (res as any).error || 'Could not send request.'); }
    } catch { Alert.alert('Error', 'Something went wrong.'); }
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

        {/* ═══ HERO SECTION ═══ */}
        <View style={s.heroWrapper}>
          {/* Category Tabs Row (on black background) */}
          <View style={s.catTabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catTabsRow}>
              {CATEGORIES.map((cat, index) => {
                const isActive = cat.id === activeCategory;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    activeOpacity={0.8}
                    onPress={() => setActiveCategory(cat.id)}
                    style={{ alignItems: 'center' }}
                  >
                    {isActive ? (
                      /* Active tab: gradient bg, no bottom radius → merges into hero */
                      <LinearGradient
                        colors={[activeCat.gradient[0], activeCat.gradient[1]]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={s.catTabMerged}
                      >
                        <Image source={cat.image} style={s.catTabImg} resizeMode="contain" />
                        <Text style={s.catTabLabelActive}>{cat.label}</Text>
                      </LinearGradient>
                    ) : (
                      /* Inactive tab: black bg, fully rounded */
                      <View style={s.catTabInactive}>
                        <Image source={cat.image} style={s.catTabImg} resizeMode="contain" />
                        <Text style={s.catTabLabel}>{cat.label}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Hero Gradient Body */}
          <LinearGradient
            colors={activeCat.gradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={s.heroGradient}
          >
            {/* Sparkle dots */}
            <View style={[s.sparkleDot, { top: 20, left: 160, width: 4, height: 4, opacity: 0.5 }]} />
            <View style={[s.sparkleDot, { top: 55, left: 50, width: 3, height: 3, opacity: 0.35 }]} />
            <View style={[s.sparkleDot, { top: 120, left: 130, width: 2, height: 2, opacity: 0.25 }]} />
            <View style={[s.sparkleDot, { top: 80, left: 260, width: 3, height: 3, opacity: 0.3 }]} />
            <View style={[s.sparkleDot, { top: 170, left: 80, width: 2, height: 2, opacity: 0.2 }]} />

            {/* Hero Text + Character */}
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
          </LinearGradient>
        </View>

        {/* ═══ FILTER DROPDOWNS ═══ */}
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
  heroWrapper: { marginHorizontal: 16, marginBottom: 20, overflow: 'hidden', borderRadius: 24 },
  catTabsContainer: { backgroundColor: '#000', flexDirection: 'row', zIndex: 1 },
  catTabsRow: { gap: 0 },

  // Active tab: gradient, rounded top, flat bottom → merges into hero
  catTabMerged: {
    alignItems: 'center', justifyContent: 'center', paddingVertical: 23, paddingHorizontal: 16,
    borderTopLeftRadius: 24, borderTopRightRadius: 24, borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
    minWidth: 90,
  },
  // Inactive tab: black bg, fully rounded top
  catTabInactive: {
    alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 16,
    borderTopLeftRadius: 24, borderTopRightRadius: 24, borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
    minWidth: 90, backgroundColor: '#000',
  },
  catTabImg: { width: 30, height: 30, marginBottom: 6 },
  catTabLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: 'Poppins_600SemiBold', textAlign: 'center' },
  catTabLabelActive: { color: '#fff', fontSize: 11, fontFamily: 'Poppins_600SemiBold', textAlign: 'center' },

  // Hero gradient body (no top radius — tabs sit on top, no gap)
  heroGradient: {
    borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
    paddingTop: 20, paddingBottom: 28, position: 'relative', minHeight: 260,
    marginTop: -1,
  },

  // Sparkle dots
  sparkleDot: { position: 'absolute', borderRadius: 99, backgroundColor: '#fff' },

  // Hero text + character
  heroContent: { flexDirection: 'row', paddingHorizontal: 16, alignItems: 'flex-end', flex: 1 },
  heroTextArea: { flex: 1, paddingRight: 10, paddingBottom: 10 },
  heroTitle: { fontSize: 32, lineHeight: 38, fontStyle: 'italic', fontFamily: 'Poppins_700Bold' },
  heroTitleBold: { color: '#fff' },
  heroTitleFaded: { color: 'rgba(255,255,255,0.35)' },
  heroDesc: { color: '#fff', fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 20, marginTop: 14 },
  heroCharacter: { width: 160, height: 180, position: 'absolute', right: 0, bottom: -24 },

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
