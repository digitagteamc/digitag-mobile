import { useAuth } from '@/context/AuthContext';
import { useProfileGate } from '@/context/useProfileGate';
import { getFeed } from '@/services/userService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const FALLBACK_BANNER = 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=1000&auto=format&fit=crop';

// ─── Filter pills (UI-only for now — backend does not accept these filters yet)
const FILTER_TABS = [
  { id: 'all', label: 'All feed' },
  { id: 'creators', label: 'Creators' },
  { id: 'freelancers', label: 'Freelancers' },
  { id: 'paid', label: 'Paid Collab' },
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
  const { token, isGuest } = useAuth();
  const { requireProfile } = useProfileGate();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  // Client-side view filters. Backend already filters by opposite role, so
  // "Creators" / "Freelancers" pills narrow within the already-opposite set.
  const filteredPosts = posts.filter((p) => {
    if (activeFilter === 'creators' && p.owner?.role !== 'CREATOR') return false;
    if (activeFilter === 'freelancers' && p.owner?.role !== 'FREELANCER') return false;
    if (activeFilter === 'paid' && p.collaborationType !== 'PAID') return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const haystack = [p.description, p.location, p.owner?.name].filter(Boolean).join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
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
      // Alternate between the two card styles for visual variety, matching the
      // original Figma layout. The API has no "type" concept yet.
      type: index % 3 === 1 ? 'REQUEST' : 'CONTACT',
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

  const handleChat = () => {
    if (!requireProfile('start a chat')) return;
    Alert.alert('Coming Soon', 'Chat is not yet available.');
  };

  const handleCall = () => {
    if (!requireProfile('call directly')) return;
    Alert.alert('Coming Soon', 'Direct calling is not yet available.');
  };

  const handlePortfolio = () => {
    Alert.alert('Coming Soon', 'Portfolio view is not yet available.');
  };

  const handleSendRequest = () => {
    if (!requireProfile('send a request')) return;
    Alert.alert('Coming Soon', 'Collaboration requests are not yet available.');
  };

  const handleBookmark = () => {
    if (!requireProfile('save this post')) return;
    Alert.alert('Coming Soon', 'Saving posts is not yet available.');
  };

  const handleShare = () => {
    Alert.alert('Share', 'Share sheet is not yet wired up.');
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ED2A91" />}
        >
          {/* SEARCH BAR */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={20} color="#888" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search here for Animator"
                placeholderTextColor="#666"
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
              />
              <Ionicons name="mic-outline" size={22} color="#888" />
            </View>
          </View>

          {/* FILTER PILLS */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsRow} contentContainerStyle={styles.pillsContent}>
            {FILTER_TABS.map((tab) => {
              const active = tab.id === activeFilter;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.pill, active && styles.pillActive]}
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
            <ActivityIndicator size="large" color="#ED2A91" style={{ marginTop: 40 }} />
          ) : cards.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="compass-outline" size={48} color="#3A3A47" />
              <Text style={styles.emptyTitle}>Nothing to explore yet</Text>
              <Text style={styles.emptySubtitle}>
                {search.trim() || activeFilter !== 'all'
                  ? 'No posts match your filters. Try a different search.'
                  : 'Pull down to refresh — new posts will appear here as people share them.'}
              </Text>
            </View>
          ) : (
            <View style={styles.feedList}>
              {cards.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.exploreCard}
                  activeOpacity={0.9}
                  onPress={() => handleCardTap(item.id, item.ownerId)}
                >
                  {/* HERO IMAGE */}
                  <View style={styles.cardHero}>
                    <Image source={{ uri: item.bannerUri }} style={styles.heroImg} />

                    <View style={styles.heroActions}>
                      <TouchableOpacity style={styles.heroActionBtn} onPress={handleShare}>
                        <Ionicons name="share-social-outline" size={16} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.heroActionBtn} onPress={handleBookmark}>
                        <Ionicons name="bookmark-outline" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.profileOverlay}>
                      <View style={styles.profileAvatar}>
                        {item.isInitials ? (
                          <View style={styles.initialsBox}>
                            <Text style={styles.initialsTxt}>{item.initials}</Text>
                          </View>
                        ) : (
                          <Image source={{ uri: item.avatarUri }} style={styles.avatarImg} />
                        )}
                      </View>
                      <View>
                        <Text style={styles.profileName}>{item.name}</Text>
                        <Text style={styles.profileRole}>{item.role}</Text>
                      </View>
                    </View>
                  </View>

                  {/* DETAILS */}
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardDesc} numberOfLines={3}>{item.desc}</Text>

                    <View style={styles.cardMeta}>
                      <Text style={styles.priceTxt}>{item.price}</Text>
                      <View style={styles.timeBox}>
                        <Ionicons name="time-outline" size={12} color="#888" />
                        <Text style={styles.timeTxt}> {item.time}</Text>
                      </View>
                    </View>

                    {item.type === 'REQUEST' ? (
                      <TouchableOpacity style={styles.requestBtn} activeOpacity={0.8} onPress={handleSendRequest}>
                        <Ionicons name="paper-plane" size={18} color="#fff" />
                        <Text style={styles.requestBtnText}>SEND REQUEST</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.btnRow}>
                        <TouchableOpacity style={styles.chatCircle} activeOpacity={0.7} onPress={handleChat}>
                          <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.contactBtn} activeOpacity={0.8} onPress={handleCall}>
                          <Ionicons name="call" size={16} color="#fff" />
                          <Text style={styles.contactBtnText}>Call directly</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.contactBtn} activeOpacity={0.8} onPress={handlePortfolio}>
                          <Text style={styles.contactBtnText}>See Portfolio</Text>
                          <Ionicons name="chevron-down" size={16} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>

      {/* FAB + bottom nav are rendered globally by (tabs)/_layout.tsx. */}
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
  },
  exploreTitle: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  exploreSubtitle: {
    color: '#AAA',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C21',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#2D2D33',
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
  },
  pillsRow: {
    paddingLeft: 20,
    marginBottom: 24,
  },
  pillsContent: {
    paddingRight: 20,
    gap: 12,
  },
  pill: {
    paddingHorizontal: 20,
    backgroundColor: '#1E1E24',
    borderRadius: 20,
    justifyContent: 'center',
    height: 40,
    borderWidth: 1,
    borderColor: '#333',
  },
  pillActive: {
    backgroundColor: '#333',
  },
  pillText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
  },
  pillTextActive: {
    color: '#fff',
  },
  feedList: {
    paddingHorizontal: 20,
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
  exploreCard: {
    backgroundColor: '#1E1E24',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardHero: {
    height: 180,
    position: 'relative',
  },
  heroImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroActions: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 10,
  },
  heroActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 6,
    borderRadius: 30,
  },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  initialsBox: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsTxt: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  profileName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  profileRole: {
    color: '#eee',
    fontSize: 10,
    lineHeight: 14,
  },
  cardInfo: {
    padding: 16,
    paddingTop: 12,
  },
  cardDesc: {
    color: '#eee',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceTxt: {
    color: '#00A401', // Exact Figma Green
    fontSize: 14,
    fontWeight: '700',
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeTxt: {
    color: '#888',
    fontSize: 11,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  chatCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2A2A32',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3D3D45',
  },
  contactBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FC6D3F', // Exact Figma Orange
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  contactBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  requestBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FC6D3F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  requestBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
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
