import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

// ─── Filter Tabs Data
const FILTER_TABS = [
  { id: 'all', label: 'All feed' },
  { id: 'creators', label: 'Creators' },
  { id: 'brands', label: 'Brands' },
  { id: 'agency', label: 'Agency' },

];

// ─── Mock Data for Figma Match
const MOCK_CARDS = [
  {
    id: 'mock1',
    type: 'CONTACT',
    name: 'VISHWA JANI',
    role: 'Video Editor',
    desc: 'Passionate Video Editor with 5+ years of experience in storytelling and cinematic edits. Specialist in Reel architecture.',
    price: '₹ 40K-50K/Month',
    time: '4h ago',
    bannerUri: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1000&auto=format&fit=crop',
    avatarUri: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=1000&auto=format&fit=crop',
    isInitials: false,
    initials: 'VJ',
  },
  {
    id: 'mock2',
    type: 'REQUEST',
    name: 'AARAV SHARMA',
    role: 'Motion Designer',
    desc: 'Creating fluid motions and dynamic visual effects for leading global brands. Open for new collaborations.',
    price: '₹ 60K-80K/Month',
    time: '2h ago',
    bannerUri: 'https://images.unsplash.com/photo-1550745165-9bc0b252723f?q=80&w=1000&auto=format&fit=crop',
    avatarUri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1000&auto=format&fit=crop',
    isInitials: false,
    initials: 'AS',
  },
  {
    id: 'mock3',
    type: 'CONTACT',
    name: 'ISHA PATEL',
    role: 'Content Creator',
    desc: 'Lifestyle and travel creator focused on aesthetic storytelling through high-quality video content.',
    price: '₹ 30K-45K/Month',
    time: '1h ago',
    bannerUri: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1000&auto=format&fit=crop',
    avatarUri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop',
    isInitials: false,
    initials: 'IP',
  },
];

export default function ExploreTab() {
  const router = useRouter();
  const { token } = useAuth();
  const [cards, setCards] = useState<any[]>(MOCK_CARDS); // Default to mock data
  const [loading, setLoading] = useState(false); // No spinner for mock data initial view

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const resp = await axios.get('https://api.digitag.world/api/post/get-all-post', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.data.success) {
        const raw = resp.data.data;
        const processed = raw.map((p: any, index: number) => {
          const names = p.user_id?.name?.split(' ') || ['User'];
          const initials = names.map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

          // Figma logic: some cards have a single "SEND REQUEST" button
          // We'll alternate or use a specific index for demonstration
          const cardType = index === 1 ? 'REQUEST' : 'CONTACT';

          return {
            id: p._id,
            type: cardType,
            name: p.user_id?.name || 'User',
            role: p.user_id?.category || 'Creator',
            desc: p.description?.substring(0, 100) + '...',
            price: `₹ ${p.min_price || '10'}K-${p.max_price || '20'}K/Month`,
            time: '4h ago',
            bannerUri: p.media_url?.[0] || 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=1000&auto=format&fit=crop',
            avatarUri: p.user_id?.profile_image_url,
            isInitials: !p.user_id?.profile_image_url,
            initials,
          };
        });
        setCards(processed);
      }
    } catch (err) {
      console.log('Fetch error:', err);
    } finally {
      setLoading(false);
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
        >
          {/* SEARCH BAR */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={20} color="#888" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search here for Animator"
                placeholderTextColor="#666"
              />
              <Ionicons name="mic-outline" size={22} color="#888" />
            </View>
          </View>

          {/* FILTER PILLS */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsRow} contentContainerStyle={styles.pillsContent}>
            {FILTER_TABS.map((tab) => (
              <TouchableOpacity key={tab.id} style={[styles.pill, tab.id === 'all' && styles.pillActive]}>
                <Text style={[styles.pillText, tab.id === 'all' && styles.pillTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* FEED LIST */}
          {loading ? (
            <ActivityIndicator size="large" color="#ED2A91" style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.feedList}>
              {cards.map((item) => (
                <View key={item.id} style={styles.exploreCard}>
                  {/* HERO IMAGE */}
                  <View style={styles.cardHero}>
                    <Image source={{ uri: item.bannerUri }} style={styles.heroImg} />

                    {/* TOP ACTIONS - Positioned absolute in Hero */}
                    <View style={styles.heroActions}>
                      <TouchableOpacity style={styles.heroActionBtn}>
                        <Ionicons name="share-social-outline" size={16} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.heroActionBtn}>
                        <Ionicons name="bookmark-outline" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>

                    {/* PROFILE OVERLAY - Floating on Hero */}
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
                    <Text style={styles.cardDesc}>{item.desc}</Text>

                    <View style={styles.cardMeta}>
                      <Text style={styles.priceTxt}>{item.price}</Text>
                      <View style={styles.timeBox}>
                        <Ionicons name="time-outline" size={12} color="#888" />
                        <Text style={styles.timeTxt}> {item.time}</Text>
                      </View>
                    </View>

                    {/* BUTTONS VARIATION */}
                    {item.type === 'REQUEST' ? (
                      /* TYPE 2: Single Large Button */
                      <TouchableOpacity style={styles.requestBtn} activeOpacity={0.8}>
                        <Ionicons name="paper-plane" size={18} color="#fff" />
                        <Text style={styles.requestBtnText}>SEND REQUEST</Text>
                      </TouchableOpacity>
                    ) : (
                      /* TYPE 1: Row of Buttons */
                      <View style={styles.btnRow}>
                        <TouchableOpacity style={styles.chatCircle} activeOpacity={0.7}>
                          <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.contactBtn} activeOpacity={0.8}>
                          <Ionicons name="call" size={16} color="#fff" />
                          <Text style={styles.contactBtnText}>Call directly</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.contactBtn} activeOpacity={0.8}>
                          <Text style={styles.contactBtnText}>See Portfolio</Text>
                          <Ionicons name="chevron-down" size={16} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.floatingBtn}
        onPress={() => router.push('/create-post')}
      >
        <LinearGradient colors={['#ED2A91', '#D81B60']} style={styles.floatingBtnGrad}>
          <Ionicons name="add" size={30} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* BOTTOM NAV */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.tabBtn} onPress={() => router.push('/(tabs)')}>
          <Ionicons name="home-outline" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.activePillTab}>
          <Ionicons name="compass" size={20} color="#ED2A91" />
          <Text style={styles.activePillText}>Explore</Text>
        </View>

        <TouchableOpacity style={styles.tabBtn} onPress={() => router.push('/(tabs)/messages')}>
          <Ionicons name="chatbubble-outline" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabBtn} onPress={() => router.push('/(tabs)/profile')}>
          <Ionicons name="person-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
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
    color: '#ED2A91', // Main pink for text
    fontWeight: '800',
    fontSize: 14,
  },
});
