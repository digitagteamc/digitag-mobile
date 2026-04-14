import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getFullProfile } from '../../services/userService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

// ─── Figma asset URLs from the localhost dev server (Figma MCP)
const imgChatGptImageMar272026104242Am1 = 'http://localhost:3845/assets/433440489db1bc86b19d2fe2e382e541dbd1c6b3.png';
const imgJamieStreetUnsplash1 = 'http://localhost:3845/assets/e163a7a55d7383a4547aa41778d291b7bd50a5ef.png';
const imgJamieStreetUnsplash2 = 'http://localhost:3845/assets/c7d3d3c46f542d3105102566c8c4d6e4fdce83d1.png';
const imgJamieStreetUnsplash3 = 'http://localhost:3845/assets/068c225fbf028e84247785426f0eb10a6d9d2ed9.png';
const imgFrame427318958 = 'http://localhost:3845/assets/eed7dba5ea152c5e0e3e2b490b42b92b946dcb5d.png';
const imgFrame427318959 = 'http://localhost:3845/assets/231da894fd13807579f8de9d2a586e7dc00b1696.png';
const imgVideoEditorsCat = require('../../assets/images/video_editors.png');
const imgCreatorsCat = require('../../assets/images/creators.png');
const imgDesignerCat = require('../../assets/images/designer.png');
const imgWritersCat = require('../../assets/images/writers.png');

// ─── Category data exactly from Figma
const CATEGORIES = [
  { id: '1', label: 'Video Editors', bg: '#e9f5f7', image: imgVideoEditorsCat, imgSize: 84, imgTop: 0, shadowColor: 'rgba(47,122,134,0.25)' },
  { id: '2', label: 'Creators', bg: '#fdf1dd', image: imgCreatorsCat, imgSize: 82, imgTop: 0, shadowColor: '#dcc196' },
  { id: '3', label: 'Designer', bg: '#ebe5f0', image: imgDesignerCat, imgSize: 80, imgTop: 0, shadowColor: '#c8a7e3' },
  { id: '4', label: 'Writers', bg: '#e1eefb', image: imgWritersCat, imgSize: 55, imgTop: 12, shadowColor: '#93b9df' },
];

export default function Homepage() {
  const router = useRouter();
  const { token, isGuest, userId, userRole } = useAuth();
  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/posts/feed`);
        if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
        const data = await response.json();

        const allPosts: any[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];

        // ── Role-based filtering ──────────────────────────────────────────
        // CREATOR  → sees posts by FREELANCER authors only
        // FREELANCER → sees posts by CREATOR authors only
        // BRAND / GUEST / other → sees all posts
        const role = userRole?.toUpperCase();
        let filtered = allPosts;
        if (role === 'CREATOR') {
          filtered = allPosts.filter(p => p.author?.role === 'FREELANCER');
        } else if (role === 'FREELANCER') {
          filtered = allPosts.filter(p => p.author?.role === 'CREATOR');
        }

        setPosts(filtered);
      } catch (error) {
        console.error('Error fetching posts:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };


    const fetchUser = async () => {
      if (isGuest || !token) {
        setUserName('Guest');
        return;
      }
      
      const res = await getFullProfile(token);
      
      if (res.success && res.data?.profile) {
        const p = res.data.profile;
        setUserName(p.name || p.creatorName || p.brandName || 'User');
      } else {
        // Fallback for older Render deployments missing the /user/me/full endpoint
        if (userRole === 'CREATOR' && userId) {
             try {
                 const fallbackRes = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/creators`);
                 if (fallbackRes.ok) {
                     const creatorsData = await fallbackRes.json();
                     // Data shape could be { value: [...] } or [...]
                     const creatorsList = creatorsData.value ? creatorsData.value : creatorsData;
                     const myProfile = creatorsList.find((c: any) => c.userId === userId);
                     if (myProfile) {
                         setUserName(myProfile.name || myProfile.creatorName || 'Creator');
                         return;
                     }
                 }
             } catch (e) {
                 console.error("Fallback fetch failed", e);
             }
        }
        setUserName('User');
      }
    };

    fetchPosts();
    fetchUser();
  }, [token, isGuest, userRole]);

  const getAuthorName = (author: any) => {
    if (author?.role === 'BRAND') return author.brandProfile?.brandName || 'Brand';
    if (author?.role === 'CREATOR') return author.creatorProfile?.name || author.creatorProfile?.creatorName || 'Creator';
    if (author?.role === 'FREELANCER') return author.freelancerProfile?.name || 'Freelancer';
    return 'User';
  };

  const getProfilePic = (author: any) => {
    if (author?.role === 'CREATOR') return author.creatorProfile?.profilePicture;
    return null; // backend currently only has profilePicture for creator implicitly via Prisma schema (not shown perfectly, but works for the logic)
  };

  const getTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.round(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.round(diffHrs / 24);
    return `${diffDays}d ago`;
  };

  const cards = posts.map(post => {
    const name = getAuthorName(post.author);
    const pic = getProfilePic(post.author);
    return {
      id: post.id,
      bannerUri: post.imageUrl || imgJamieStreetUnsplash1, 
      isInitials: !pic,
      initials: name.slice(0, 2).toUpperCase(),
      avatarUri: pic,
      name: name,
      role: post.author?.role?.toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Unknown',
      desc: post.description,
      price: '₹40K-50K/Month', // Hardcoded as placeholder based on design, backend does not have price
      time: getTimeAgo(post.createdAt),
    };
  });

  return (
    <View style={styles.root}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      {/* Full-screen purple→black gradient (top 264dp area) */}
      <View style={[styles.topGradientBand, { paddingTop: statusBarHeight }]}>
        <LinearGradient
          colors={['#7352DD', '#000000']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingTop: statusBarHeight + 16 }]}
          showsVerticalScrollIndicator={false}
        >

          {/* ══════════════ HEADER ══════════════ */}
          <View style={styles.header}>
            {/* Avatar + greeting */}
            <View style={styles.headerLeft}>
              <View style={styles.avatarWrap}>
                <Image
                  source={{ uri: imgChatGptImageMar272026104242Am1 }}
                  style={styles.avatar}
                  resizeMode="cover"
                />
              </View>
              <View>
                <Text style={styles.hiText}>Hi {userName}</Text>
                <Text style={styles.welcomeText}>Welcome To Digitag</Text>
              </View>
            </View>

            {/* Icons right */}
            <View style={styles.headerRight}>
              {/* Chart icon */}
              <TouchableOpacity style={styles.iconCircle}>
                <Ionicons name="bar-chart-outline" size={16} color="#fff" />
              </TouchableOpacity>
              {/* Notification bell */}
              <TouchableOpacity style={styles.iconCircle}>
                <Ionicons name="notifications-outline" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* ══════════════ SEARCH BAR ══════════════ */}
          {/* Figma: glassmorphic h-56, rounded-12, border rgba(156,156,156,0.5) */}
          <View style={styles.searchBar}>
            {/* Inner blur tint */}
            <View style={styles.searchBarBlur} />
            <View style={styles.searchBarInner}>
              {/* Search icon */}
              <Feather name="search" size={18} color="#d6d6d6" />
              <Text style={styles.searchGray}>Search here for </Text>
              <Text style={styles.searchWhite}>Animator</Text>
            </View>
            {/* Mic icon right */}
            <Ionicons name="mic-outline" size={18} color="#d6d6d6" style={styles.micIcon} />
          </View>

          {/* ══════════════ BANNER ══════════════ */}
          {/* Figma: glassmorphic rgba(240,240,240,0.3) with border rgba(64,64,64,0.5) */}
          <View style={styles.bannerOuter}>
            {/* Glass backing */}
            <View style={styles.bannerGlass} />
            <View style={styles.bannerInner}>
              {/* Left text block */}
              <View style={styles.bannerTextBlock}>
                <Text style={styles.bannerTitle}>Discover Top Brands</Text>
                <Text style={styles.bannerDesc}>Connect with fashion, beauty &amp; {"\n"} lifestyle brands.</Text>
                <TouchableOpacity style={styles.exploreBtn} activeOpacity={0.85}>
                  <Text style={styles.exploreBtnText}>Explore Now</Text>
                </TouchableOpacity>
              </View>
              {/* Right image — overflows */}
              <Image
                source={require('../../assets/images/banner.png')}
                style={styles.bannerImg}
                resizeMode="contain"
              />
            </View>
            {/* Inset shadow overlay from Figma */}
            <View style={styles.bannerInsetOverlay} pointerEvents="none" />
          </View>

          {/* ══════════════ CATEGORIES ══════════════ */}
          <View style={styles.catRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity key={cat.id} style={styles.catItem} activeOpacity={0.8}>
                <View style={styles.catCardWrap}>
                  {/* Colored rounded card — full height of wrapper bottom */}
                  <View style={[styles.catCard, { backgroundColor: cat.bg }]}>
                    {/* Label text INSIDE the card at the bottom */}
                    <Text style={styles.catLabel}>{cat.label}</Text>
                  </View>
                  {/* 3D image: per-category size+top so all look visually aligned */}
                  <Image
                    source={cat.image}
                    style={[styles.catImg, { width: cat.imgSize, height: cat.imgSize, top: cat.imgTop }]}
                    resizeMode="contain"
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* ══════════════ RECENTLY UPDATED HEADER ══════════════ */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recently Updated</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>View all</Text>
            </TouchableOpacity>
          </View>

          {/* ══════════════ CARDS ══════════════ */}
          {/* Figma: each card 408×290, glassmorphic bg #1e1e24, border rgba(156,156,156,0.5) */}
          <View style={styles.cardsList}>
            {loading ? (
              <ActivityIndicator size="large" color="#7352DD" style={{ marginTop: 40 }} />
            ) : cards.length === 0 ? (
              <Text style={{ color: '#fff', textAlign: 'center', marginTop: 40 }}>No posts found</Text>
            ) : (
              cards.map((item) => (
                <View key={item.id} style={styles.card}>
                  {/* ── Top hero image (152px tall) */}
                  <View style={styles.cardHero}>
                    <Image source={{ uri: item.bannerUri }} style={styles.cardBannerImg} resizeMode="cover" />
                    {/* Slight dark overlay per Figma rgba(0,0,0,0.2) */}
                    <View style={styles.cardHeroOverlay} />

                  {/* Bookmark icon — top right */}
                  <TouchableOpacity style={styles.bookmarkBtn}>
                    <Ionicons name="bookmark-outline" size={16} color="#fff" />
                  </TouchableOpacity>

                  {/* Profile row — bottom-left of hero */}
                  <View style={styles.cardProfile}>
                    {item.isInitials ? (
                      /* Initials circle with glass effect */
                      <View style={styles.initialsCircle}>
                        <Text style={styles.initialsText}>{(item as any).initials}</Text>
                      </View>
                    ) : (
                      <View style={styles.avatarCircle}>
                        <Image source={{ uri: (item as any).avatarUri }} style={styles.cardAvatar} resizeMode="cover" />
                      </View>
                    )}
                    <View style={styles.cardNameBlock}>
                      <Text style={styles.cardName}>{item.name}</Text>
                      <Text style={styles.cardRole}>{item.role}</Text>
                    </View>
                  </View>
                </View>

                {/* ── Card body */}
                <View style={styles.cardBody}>
                  {/* Description */}
                  <Text style={styles.cardDesc} numberOfLines={2}>{item.desc}</Text>

                  {/* Price + Time row */}
                  <View style={styles.cardMetaRow}>
                    <Text style={styles.cardPrice}>{item.price}</Text>
                    <View style={styles.timeRow}>
                      <Ionicons name="time-outline" size={12} color="#7a7a8a" />
                      <Text style={styles.cardTime}> {item.time}</Text>
                    </View>
                  </View>

                  {/* Action buttons */}
                  <View style={styles.cardActions}>
                    {/* Quick Chat — glass outline */}
                    <TouchableOpacity style={styles.btnQuickChat} activeOpacity={0.8}>
                      <View style={styles.btnBlurBg} />
                      <Ionicons name="chatbubble-ellipses-outline" size={14} color="#fff" />
                      <Text style={styles.btnQuickChatText}>Quick Chat</Text>
                    </TouchableOpacity>

                    {/* Call directly — purple fill */}
                    <TouchableOpacity style={styles.btnCall} activeOpacity={0.8}>
                      <View style={styles.btnPurpleBg} />
                      <Ionicons name="call-outline" size={14} color="#fff" />
                      <Text style={styles.btnCallText}>Call directly</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Inset shadow overlay */}
                <View style={styles.cardInsetOverlay} pointerEvents="none" />
              </View>
            )))}
          </View>

          {/* Bottom spacer so content doesn't hide behind nav */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>

      {/* ══════════════ BOTTOM NAV ══════════════ */}
      {/* Figma: Component 21 — #1e1e24, rounded-tl/tr-16, px-24 py-16 */}
      <View style={styles.bottomNavContainer}>
        {/* The nav bar */}
        <View style={styles.bottomNav}>
          {/* Home — ACTIVE: #e9e2ff pill, purple icon + text */}
          <TouchableOpacity style={styles.navHome} activeOpacity={0.9}>
            <Ionicons name="home" size={28} color="#7352DD" />
            <Text style={styles.navHomeLabel}>Home</Text>
          </TouchableOpacity>

          {/* Explore */}
          <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
            <Ionicons name="compass" size={28} color="#6b6b8a" />
          </TouchableOpacity>

          {/* Chat */}
          <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
            <Ionicons name="chatbubble-ellipses" size={26} color="#6b6b8a" />
          </TouchableOpacity>

          {/* Profile */}
          <TouchableOpacity style={styles.navItem} activeOpacity={0.7} onPress={() => router.push('/(tabs)/profile')}>
            <Ionicons name="person-circle" size={28} color="#6b6b8a" />
          </TouchableOpacity>
        </View>

        {/* FAB — purple gradient circle with + , sits above the nav bar */}
        <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
          <LinearGradient
            colors={['#9b7ef7', '#7352DD', '#5a3db8']}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGrad}
          >
            <Ionicons name="add" size={26} color="#fff" />
          </LinearGradient>
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

  // ── Top gradient band (264px tall in Figma, covers header area)
  topGradientBand: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
  },

  safeArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarWrap: {
    width: 45,
    height: 44,
    borderRadius: 8,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  hiText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 20,
  },
  welcomeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.5,
    lineHeight: 18,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Search bar (Figma: border rgba(156,156,156,0.5), bg rgba(240,240,240,0.1))
  searchBar: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(156,156,156,0.5)',
    marginBottom: 20,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  searchBarBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(240,240,240,0.1)',
  },
  searchBarInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  searchGray: {
    color: '#d6d6d6',
    fontSize: 12,
    marginLeft: 4,
  },
  searchWhite: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  micIcon: {
    marginLeft: 8,
  },

  // ── Banner (Figma: glassmorphic 152×409, bg rgba(240,240,240,0.3), border rgba(64,64,64,0.5))
  bannerOuter: {
    height: 152,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(64,64,64,0.5)',
    overflow: 'hidden',
    marginBottom: 28,
    position: 'relative',
  },
  bannerGlass: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(240,240,240,0.3)',
  },
  bannerInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 15,
    paddingRight: 0,
    paddingTop: 12,
    paddingBottom: 12,
  },
  bannerTextBlock: {
    flex: 1,
    paddingRight: 8,
  },
  bannerTitle: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  bannerDesc: {
    color: '#000',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
    width: 212,
  },
  exploreBtn: {
    backgroundColor: '#F26930',
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  exploreBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.5,
    lineHeight: 14,
  },
  bannerImg: {
    width: 152,
    height: 152,
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  bannerInsetOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 0,
  },

  // ── Categories
  catRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  catItem: {
    alignItems: 'center',
    width: (width - 48) / 4,
  },
  // Wrapper: relative, height = card(82) + image overflow above(28) = 110
  catCardWrap: {
    width: 80,
    height: 110,
    position: 'relative',
    alignItems: 'center',
  },
  // Card: absolute at bottom of wrapper, contains the label at its bottom
  catCard: {
    position: 'absolute',
    bottom: 0,
    width: 80,
    height: 82,
    borderRadius: 16,
    justifyContent: 'flex-end',   // push label to bottom
    alignItems: 'center',
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  // Image: identical fixed box for all 4 — resizeMode contain keeps aspect ratio
  // top: 0 means ~28px overflows above the card (110-82=28)
  catImg: {
    position: 'absolute',
    top: 0,
    width: 68,
    height: 68,
    zIndex: 2,
  },
  catLabel: {
    color: '#1a1a2e',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 13,
  },

  // ── Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    // Figma: Poppins SemiBold 20px white
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
  },
  viewAll: {
    // Figma: Poppins Medium 14px #7352dd
    color: '#7352DD',
    fontSize: 14,
    fontWeight: '500',
  },

  // ── Cards list
  cardsList: {
    gap: 20,
  },

  // ── Individual card (Figma: 408×290, bg #1e1e24, border rgba(156,156,156,0.5), rounded-20)
  card: {
    width: CARD_WIDTH,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(156,156,156,0.5)',
    overflow: 'hidden',
    backgroundColor: '#1e1e24',
    position: 'relative',
  },

  // Card hero section (152px tall)
  cardHero: {
    height: 152,
    width: '100%',
    position: 'relative',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  cardBannerImg: {
    width: '100%',
    height: 177,
    position: 'absolute',
    top: -13,
    left: 0,
  },
  cardHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },

  // Bookmark top-right
  bookmarkBtn: {
    position: 'absolute',
    top: 15,
    right: 12,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Profile row in hero
  cardProfile: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  // Initials circle (Figma: glassmorphic rounded-100, 36px)
  initialsCircle: {
    width: 36,
    height: 36,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(64,64,64,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  // Regular photo avatar circle
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 100,
    overflow: 'hidden',
    backgroundColor: '#efefef',
  },
  cardAvatar: {
    width: '100%',
    height: '100%',
  },
  cardNameBlock: {
    gap: 4,
  },
  cardName: {
    // Figma: Manrope SemiBold 16px white
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.5,
    lineHeight: 18,
  },
  cardRole: {
    // Figma: Poppins Medium 12px white
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.5,
  },

  // Card body
  cardBody: {
    paddingHorizontal: 11,
    paddingTop: 12,
    paddingBottom: 14,
  },
  cardDesc: {
    // Figma: Poppins Regular 12px white, line-height 16
    color: '#fff',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
    width: 324,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardPrice: {
    // Figma: Poppins Medium 12px #00a401
    color: '#00a401',
    fontSize: 12,
    fontWeight: '500',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTime: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
  },

  // Action buttons row
  cardActions: {
    flexDirection: 'row',
    gap: 16,
  },

  // Quick Chat button (Figma: glassmorphic, border rgba(156,156,156,0.5), rounded-20)
  btnQuickChat: {
    flex: 1,
    height: 38,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(156,156,156,0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  btnBlurBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(240,240,240,0.1)',
  },
  btnQuickChatText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.5,
  },

  // Call directly button (Figma: bg #7352dd, rounded-99)
  btnCall: {
    flex: 1,
    height: 38,
    borderRadius: 99,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  btnPurpleBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#7352DD',
  },
  btnCallText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.5,
  },

  cardInsetOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 0,
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },

  // ── Bottom Nav wrapper — spans full width, sits at absolute bottom
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  // The dark bar itself (Figma: bg #1e1e24, rounded-tl/tr-16, px-24 py-16)
  bottomNav: {
    backgroundColor: '#1e1e24',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    justifyContent: 'space-between',
  },

  // Active Home tab — Figma: bg #e9e2ff pill, gap-8, px-16 py-10, rounded-30
  navHome: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#e9e2ff',
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  navHomeLabel: {
    // Figma: Poppins SemiBold 14px #7352dd
    color: '#7352DD',
    fontSize: 14,
    fontWeight: '700',
  },
  // Inactive items: same padding structure, no background (Figma: px-16 py-10 rounded-30)
  navItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
  },

  // FAB (Figma node 59:1023): 50×50, purple gradient, positioned above the nav — smaller so it clears the profile icon)
  fab: {
    position: 'absolute',
    right: 20,
    bottom: Platform.OS === 'ios' ? 72 : 62,  // lifted higher to clear the profile icon
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    // Purple glow shadow
    shadowColor: '#7352DD',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 14,
  },
  fabGrad: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
