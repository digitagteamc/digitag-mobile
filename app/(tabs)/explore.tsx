import { useAuth } from '@/context/AuthContext';
import { useProfileGate } from '@/context/useProfileGate';
import { getFeed, getCreatorById, getFreelancerById, sendCollaboration } from '@/services/userService';
import { useRoleTheme } from '@/theme/useRoleTheme';
import ExpandableText from '@/Components/ui/ExpandableText';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Linking,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

const FALLBACK_BANNER = 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=1000&auto=format&fit=crop';

const CATEGORY_TABS = [
  { id: 'all', label: 'All' },
  { id: 'Photography', label: 'Photography' },
  { id: 'Editors', label: 'Editors' },
  { id: 'Videography', label: 'Videography' },
  { id: 'Growth Specialist', label: 'Growth Specialist' },
  { id: 'Script Writers', label: 'Script Writers' },
  { id: 'Styling & makeup', label: 'Styling & Makeup' },
  { id: 'Fashion Designers', label: 'Fashion Designers' },
  { id: 'Property Rental', label: 'Property Rental' },
];

function getInitials(name: string | null | undefined) {
  if (!name) return 'U';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
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

export default function ExploreTab() {
  const router = useRouter();
  const { token, isGuest, userRole } = useAuth();
  const { requireProfile } = useProfileGate();
  const theme = useRoleTheme();
  const params = useLocalSearchParams<{ category?: string }>();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  useFocusEffect(
    useCallback(() => {
      if (params.category) {
        const matched = CATEGORY_TABS.find(t => t.id === params.category || t.label.toLowerCase() === (params.category as string).toLowerCase());
        setActiveFilter(matched ? matched.id : 'all');
      }
    }, [params.category])
  );

  const [portfolioModalVisible, setPortfolioModalVisible] = useState(false);
  const [selectedPortfolioLink, setSelectedPortfolioLink] = useState<string | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [collabSentIds, setCollabSentIds] = useState<Set<string>>(new Set());

  const words = ['Animator', 'Editors', 'Content Writers', 'And More', 'Animator'];
  const translateY = useRef(new Animated.Value(0)).current;
  const currentIndex = useRef(0);

  const fetchPosts = useCallback(async () => {
    if (!token) { setPosts([]); setLoading(false); return; }
    try {
      const res = await getFeed(token);
      const rows = Array.isArray(res.data) ? res.data : [];
      console.log(`🧭 Explore feed loaded: ${rows.length} post(s)`);
      setPosts(rows);
    } catch (err) {
      console.log('Explore fetch error:', err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  useEffect(() => {
    const interval = setInterval(() => {
      currentIndex.current += 1;

      Animated.timing(translateY, {
        toValue: -(currentIndex.current * 20),
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        if (currentIndex.current === words.length - 1) {
          translateY.setValue(0);
          currentIndex.current = 0;
        }
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [translateY]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  const filteredPosts = posts.filter((p) => {
    if (activeFilter === 'all') return true;
    const filter = activeFilter.toLowerCase();
    const cats: string[] = [
      p.owner?.category,
      ...(Array.isArray(p.owner?.categories) ? p.owner.categories : []),
      p.category,
      ...(Array.isArray(p.owner?.skills) ? p.owner.skills : []),
    ].flat().filter(Boolean).map((c: string) => c.toLowerCase());
    // Posts without any category data only appear in the "All" filter
    if (cats.length === 0) return false;
    return cats.some(c => c.includes(filter) || filter.includes(c));
  });

  const cards = filteredPosts.map((p, index) => {
    const owner = p.owner || {};
    const name = owner.name || (owner.role === 'FREELANCER' ? 'Freelancer' : 'Creator');
    const roleLabel = owner.role
      ? owner.role.charAt(0) + owner.role.slice(1).toLowerCase()
      : 'User';
    return {
      id: p.id,
      ownerId: owner.id as string | undefined,
      ownerRole: owner.role,
      name,
      role: roleLabel,
      desc: p.description || '',
      price: p.collaborationType === 'PAID' ? 'Paid Collab' : 'Free Collab',
      time: timeAgo(p.createdAt),
      bannerUri: p.imageUrl || FALLBACK_BANNER,
      avatarUri: owner.profilePicture || null,
      isInitials: !owner.profilePicture,
      initials: getInitials(name),
    };
  });

  const handleCardTap = (postId: string, ownerId?: string) => {
    if (isGuest || !token) { router.push('/role-selection'); return; }
    if (!requireProfile('view this profile')) return;
    router.push({ pathname: '/creator-details', params: { postId, ...(ownerId ? { userId: ownerId } : {}) } } as any);
  };

  const handlePortfolio = async (ownerId?: string, ownerRole?: string) => {
    setSelectedPortfolioLink(null);
    setPortfolioLoading(true);
    setPortfolioModalVisible(true);
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
      const link = profileData?.portfolioUrl 
        || profileData?.portfolio 
        || profileData?.portfolioLink 
        || null;
      setSelectedPortfolioLink(link);
    } catch (e) {
      setSelectedPortfolioLink(null);
    } finally {
      setPortfolioLoading(false);
    }
  };

  const handleCollab = async (postId: string, ownerId?: string) => {
    if (isGuest || !token) { router.push('/role-selection'); return; }
    if (!requireProfile('send a collaboration request')) return;
    if (!ownerId) return;
    if (collabSentIds.has(postId)) {
      Alert.alert('Already Sent', 'You already sent a collaboration request for this post.');
      return;
    }
    try {
      const res = await sendCollaboration(token, { receiverId: ownerId, postId });
      if (res.success) {
        setCollabSentIds(prev => new Set(prev).add(postId));
        Alert.alert('Request Sent!', 'Your collaboration request has been sent. You will be notified when they respond.');
      } else {
        Alert.alert('Request Failed', (res as any).error || 'Could not send collaboration request.');
      }
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const handleBookmark = () => {
    if (!requireProfile('save this post')) return;
    Alert.alert('Coming Soon', 'Saving posts is not yet available.');
  };

  const handleShare = async (postId: string) => {
    try {
      const url = `https://digitag.com/post/${postId}`;
      await Share.share({
        message: `Check out this post on Digitag! ${url}`,
        url: url,
        title: 'Digitag Post',
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.exploreHeader}>
          <Text style={styles.exploreTitle}>Explore</Text>
          <Text style={styles.exploreSubtitle}>Discover & Connect with the right people</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        >
          {/* SEARCH BAR */}
          <View style={styles.searchContainer}>
            <TouchableOpacity
              style={styles.searchBar}
              activeOpacity={0.8}
              onPress={() => router.push('/searchbar' as any)}
            >
              <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
              <LinearGradient
                colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.02)', 'rgba(255,255,255,0.08)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.searchBarInner}>
                <Feather name="search" size={18} color="#d6d6d6" />
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{
                    fontFamily: 'Poppins_400Regular',
                    fontSize: 13,
                    color: '#9a9a9a',
                    height: 20,
                    lineHeight: 20
                  }}>
                    Search here for{' '}
                  </Text>
                  <View style={{ height: 20, overflow: 'hidden' }}>
                    <Animated.View style={{ transform: [{ translateY }] }}>
                      {words.map((word, idx) => (
                        <Text
                          key={idx}
                          style={{
                            fontFamily: 'Poppins_400Regular',
                            fontSize: 13,
                            color: '#fff',
                            height: 20,
                            lineHeight: 20
                          }}
                        >
                          {word}
                        </Text>
                      ))}
                    </Animated.View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* FILTER PILLS */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsRow} contentContainerStyle={styles.pillsContent}>
            {CATEGORY_TABS.map((tab) => {
              const active = tab.id === activeFilter;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.pill, active && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                  onPress={() => setActiveFilter(tab.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* FEED LIST */}
          {loading ? (
            <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
          ) : cards.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="compass-outline" size={48} color="#3A3A47" />
              <Text style={styles.emptyTitle}>Nothing to explore yet</Text>
              <Text style={styles.emptySubtitle}>
                {activeFilter !== 'all'
                  ? 'No posts match your filters. Try a different filter.'
                  : 'Pull down to refresh — new posts will appear here as people share them.'}
              </Text>
            </View>
          ) : (
            <View style={styles.feedList}>
              {cards.map((item) => {
                const postColor = theme.primary;

                return (
                  <View
                    key={item.id}
                    style={styles.card}
                  >
                    {/* ── Header: Avatar, Name, See Portfolio, Share */}
                    <View style={styles.cardHeader}>
                      <TouchableOpacity
                        style={styles.cardHeaderLeft}
                        activeOpacity={0.7}
                        onPress={() => handleCardTap(item.id, item.ownerId)}
                      >
                        {item.isInitials ? (
                          <View style={[styles.avatarCircle, { backgroundColor: postColor + '33' }]}>
                            <Text style={[styles.initialsText, { color: postColor }]}>{item.initials}</Text>
                          </View>
                        ) : (
                          <View style={styles.avatarCircle}>
                            <Image source={{ uri: item.avatarUri }} style={styles.cardAvatarImg} resizeMode="cover" />
                          </View>
                        )}
                        <View style={styles.headerNameBlock}>
                          <Text style={styles.cardName}>{item.name}</Text>
                          <Text style={styles.cardCategory}>{item.role}</Text>
                        </View>
                      </TouchableOpacity>

                      <View style={styles.cardHeaderRight}>
                        <TouchableOpacity 
                          style={[styles.portfolioBtn, { backgroundColor: postColor }]} 
                          onPress={() => handlePortfolio(item.ownerId, item.ownerRole)}
                        >
                          <Text style={styles.portfolioBtnText}>See Portfolio</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.shareBtn} onPress={() => handleShare(item.id)}>
                          <Ionicons name="share-social-outline" size={18} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* ── Description */}
                    <ExpandableText text={item.desc} style={styles.cardDesc} numberOfLines={2} />

                    {/* ── Meta: Price + Time */}
                    <View style={styles.cardMetaRow}>
                      <Text style={[styles.cardPrice, { color: 'rgba(0, 164, 1, 1)' }]}>
                        {item.price === 'Paid Collab' ? '₹40K–50K/Month' : 'Free Collab'}
                      </Text>
                      <View style={styles.cardTimeRow}>
                        <Ionicons name="time-outline" size={14} color="#8A8A99" />
                        <Text style={styles.cardTime}>{item.time || '4h ago'}</Text>
                      </View>
                    </View>

                    {/* ── Banner Image */}
                    <View style={styles.cardBannerContainer}>
                      <Image source={{ uri: item.bannerUri }} style={styles.cardBanner} resizeMode="cover" />
                      <View style={styles.bannerOverlay} />

                      <View style={styles.bannerActionsRight}>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: postColor }]} onPress={() => handleBookmark()}>
                          <Ionicons name="bookmark-outline" size={16} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* ── Collaborate row */}
                    <View style={styles.cardActionsRow}>
                      <TouchableOpacity
                        style={[styles.collabBtn, collabSentIds.has(item.id) ? { backgroundColor: '#22c55e', borderColor: '#22c55e' } : { borderColor: postColor }]}
                        onPress={() => handleCollab(item.id, item.ownerId)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name={collabSentIds.has(item.id) ? "checkmark-circle-outline" : "people-outline"} size={15} color={collabSentIds.has(item.id) ? '#fff' : postColor} />
                        <Text style={[styles.collabBtnText, { color: collabSentIds.has(item.id) ? '#fff' : postColor }]}>
                          {collabSentIds.has(item.id) ? 'Request Sent' : 'Collaborate'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>

      {/* FAB + bottom nav are rendered globally by (tabs)/_layout.tsx. */}
      {/* ══════════════ PORTFOLIO MODAL ══════════════ */}
      <Modal
        visible={portfolioModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPortfolioModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalDismissArea} 
            activeOpacity={1} 
            onPress={() => setPortfolioModalVisible(false)} 
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Feather name="link" size={20} color="#fff" />
                <Text style={styles.modalTitle}>Portfolio Links</Text>
              </View>
              <TouchableOpacity 
                style={styles.modalCloseBtn}
                onPress={() => setPortfolioModalVisible(false)}
              >
                <Feather name="x" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            {portfolioLoading ? (
              <ActivityIndicator color="#A78BFA" style={{ marginTop: 16 }} />
            ) : selectedPortfolioLink ? (
              <TouchableOpacity 
                style={styles.portfolioLinkRow}
                onPress={() => {
                  let url = selectedPortfolioLink;
                  if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    url = 'https://' + url;
                  }
                  Linking.openURL(url);
                }}
              >
                <Text style={styles.portfolioLinkText}>{selectedPortfolioLink}</Text>
                <Feather name="arrow-up-right" size={20} color="#A78BFA" />
              </TouchableOpacity>
            ) : (
              <Text style={styles.noPortfolioText}>No portfolio link provided.</Text>
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#060606',

  },
  safeArea: {
    flex: 1,
  },

  exploreHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    marginTop: 50
  },
  exploreTitle: {
    color: '#fff',
    fontSize: 24,

    fontFamily: 'Poppins_500Medium'
  },
  exploreSubtitle: {
    color: '#E2E2E2',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 18,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(156, 156, 156, 0.40)',
    backgroundColor: 'rgba(70, 70, 70, 0.15)',
    marginBottom: 20,
    overflow: 'hidden',

    // Figma shadows
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 10,
  },
  searchBarInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    marginLeft: 12,
    height: 40,
    paddingVertical: 0,
  },
  searchResultsPanel: {
    backgroundColor: '#1a1a22',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(156,156,156,0.3)',
    marginTop: -12,
    overflow: 'hidden',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  searchResultAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
  },
  searchResultAvatarFallback: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultInitial: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchResultText: {
    flex: 1,
  },
  searchResultName: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  searchResultMeta: {
    color: '#9a9a9a',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 1,
  },
  noResultsText: {
    color: '#9a9a9a',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalContent: {
    height: '30%',
    backgroundColor: '#1E1E24',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    borderTopWidth: 1,
    borderColor: 'rgba(156,156,156,0.3)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  portfolioLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  portfolioLinkText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    flex: 1,
    marginRight: 12,
  },
  noPortfolioText: {
    color: '#8A8A99',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    marginTop: 10,
  },
  pillsRow: {
    paddingLeft: 20,
    marginBottom: 35,
  },
  pillsContent: {
    paddingRight: 20,
    gap: 12,
  },
  pill: {
    paddingHorizontal: 20,
    backgroundColor: '#24221eff',
    borderRadius: 20,
    justifyContent: 'center',
    minWidth: 117,
    height: 40,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center'
  },
  pillActive: {
    // active color applied inline via theme.primary
  },
  pillText: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular'
  },
  pillTextActive: {
    color: '#fff',
  },
  feedList: {
    paddingHorizontal: 16,
    gap: 20,
  },
  emptyState: {
    paddingHorizontal: 40,
    paddingTop: 60,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    marginTop: 10,
  },
  emptySubtitle: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Individual card (Figma: 408×392, bg #1E1E24, border rgba(156,156,156,0.5), rounded-24)
  card: {
    width: CARD_WIDTH,
    minHeight: 392,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(156, 156, 156, 0.50)',
    backgroundColor: '#1E1E24',
    padding: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardAvatarImg: {
    width: '100%',
    height: '100%',
  },
  initialsText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  headerNameBlock: {
    gap: 2,
  },
  cardName: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    lineHeight: 14,
    letterSpacing: -0.5,
  },
  cardCategory: {
    color: '#A0A0A0',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    lineHeight: 14,
    letterSpacing: -0.5,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  portfolioBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  portfolioBtnText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    lineHeight: 16,
  },
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardDesc: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 20,
    marginBottom: 12,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardPrice: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    lineHeight: 14,
  },
  cardTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTime: {
    color: '#8A8A99',
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
  },
  cardBannerContainer: {
    height: 220,
    width: '100%',
    borderRadius: 30,
    overflow: 'hidden',
    position: 'relative',
  },
  cardBanner: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  collabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  collabBtnText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    lineHeight: 16,
  },
  bannerActionsRight: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  floatingBtn: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 100,
  },
  floatingBtnGrad: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#ED2A91',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: '#15151A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  tabBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePillTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFDCEE', // Lighter pink for active state
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 8,
  },
  activePillText: {
    color: '#ED2A91',
    fontWeight: '800',
    fontSize: 14,
  },
});
