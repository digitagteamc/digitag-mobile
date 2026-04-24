import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useProfileGate } from '../../context/useProfileGate';
import { getFeed, getFullProfile, listCollaborations } from '../../services/userService';
import { getRoleTheme, useRoleTheme } from '../../theme/useRoleTheme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

// ─── Figma asset URLs from the localhost dev server (Figma MCP)
const imgChatGptImageMar272026104242Am1 = 'http://localhost:3845/assets/433440489db1bc86b19d2fe2e382e541dbd1c6b3.png';
const imgJamieStreetUnsplash1 = 'http://localhost:3845/assets/e163a7a55d7383a4547aa41778d291b7bd50a5ef.png';
const imgJamieStreetUnsplash2 = 'http://localhost:3845/assets/c7d3d3c46f542d3105102566c8c4d6e4fdce83d1.png';
const imgJamieStreetUnsplash3 = 'http://localhost:3845/assets/068c225fbf028e84247785426f0eb10a6d9d2ed9.png';
const imgFrame427318958 = 'http://localhost:3845/assets/eed7dba5ea152c5e0e3e2b490b42b92b946dcb5d.png';
const imgFrame427318959 = 'http://localhost:3845/assets/231da894fd13807579f8de9d2a586e7dc00b1696.png';
const imgVideoEditors = require('../../assets/categories/video-editor.png');
const imgEditor = require('../../assets/categories/editor.png');
const imgPhotographer = require('../../assets/categories/photographer.png');
const imgFashion = require('../../assets/categories/fashion.png');
const heroBg = require('../../assets/images/profile_hero_bg.jpg');
const CAROUSEL_DATA = [
  {
    id: '1',
    title: 'Discover Top Brands',
    desc: 'Connect with fashion, beauty &\nlifestyle brands.',
    image: require('../../assets/images/banner.png'),
  },
  {
    id: '2',
    title: 'Book Expert Creators',
    desc: 'Find makeup, hair & creative\nprofessionals.',
    image: require('../../assets/images/creator.png'),
  },
  {
    id: '3',
    title: 'Grow & Earn Together',
    desc: 'Launch, track, and grow your\nbusiness.',
    image: require('../../assets/images/freelancer.png'),
  },
  {
    id: '4',
    title: 'Scale Your Agency Faster',
    desc: 'Manage clients, campaigns &\nanalytics in one place.',
    image: require('../../assets/images/agency.png'),
  },


];

// ─── Category data exactly from Figma
const CATEGORIES = [
  { id: '1', label: ' Styling & Makeup', bg: '#e9f5f7', image: imgVideoEditors, imgSize: 60, imgTop: 3, shadowColor: 'rgba(47,122,134,0.25)' },
  { id: '2', label: 'Editors', bg: '#fdf1dd', image: imgEditor, imgSize: 60, imgTop: 5, shadowColor: '#dcc196' },
  { id: '3', label: 'Fashion', bg: '#e1eefb', image: imgFashion, imgSize: 60, imgTop: 5, shadowColor: '#93b9df' },
  { id: '4', label: 'Photographer', bg: '#ebe5f0', image: imgPhotographer, imgSize: 60, imgTop: 5, shadowColor: '#c8a7e3' },
  { id: '5', label: 'Styling & Makeup', bg: '#e9f5f7', image: imgVideoEditors, imgSize: 60, imgTop: 5, shadowColor: 'rgba(47,122,134,0.25)' },
  { id: '6', label: 'Fashion & Beauty', bg: '#fdf1dd', image: imgEditor, imgSize: 60, imgTop: 5, shadowColor: '#dcc196' },
  { id: '7', label: 'Photographer', bg: '#ebe5f0', image: imgPhotographer, imgSize: 60, imgTop: 5, shadowColor: '#c8a7e3' },
  { id: '8', label: 'Fashion', bg: '#e1eefb', image: imgFashion, imgSize: 60, imgTop: 8, shadowColor: '#93b9df' },

];

export default function Homepage() {
  const router = useRouter();
  const { token, isGuest, userRole } = useAuth();
  const { requireProfile } = useProfileGate();
  const theme = useRoleTheme();
  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        if (!token) { setPosts([]); setLoading(false); return; }
        const res = await getFeed(token);
        // Backend GET /feed already filters by opposite role server-side
        // (CREATOR → FREELANCER posts, FREELANCER → CREATOR posts) via
        // OPPOSITE_FEED_ROLE, so no client-side filter is needed.
        const allPosts: any[] = Array.isArray(res.data) ? res.data : [];
        console.log(`📰 Feed loaded: ${allPosts.length} post(s)`);
        setPosts(allPosts);
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
        setUserName(p.name || 'User');
      } else {
        setUserName('User');
      }
    };

    const fetchPendingCount = async () => {
      if (!token || isGuest) return;
      const res = await listCollaborations(token, { direction: 'incoming' });
      if (res.success && Array.isArray(res.data)) {
        setPendingCount(res.data.filter((r: any) => r.status === 'PENDING').length);
      }
    };

    fetchPosts();
    fetchUser();
    fetchPendingCount();
  }, [token, isGuest, userRole]);

  // Backend `shapePost` already flattens the author → { id, role, name,
  // profilePicture, location } on `post.owner`. `name` falls back to the
  // role label when the user hasn't completed their profile yet.
  const getOwnerName = (owner: any) => {
    if (owner?.name) return owner.name;
    if (owner?.role === 'CREATOR') return 'Creator';
    if (owner?.role === 'FREELANCER') return 'Freelancer';
    return 'User';
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

  const handleBookmark = async (postId: string) => {
    // Backend save/unsave endpoints not implemented yet — reconnect when
    // /posts/:id/save is added.
  };

  const handlePostTap = (postId: string, ownerId?: string) => {
    if (isGuest || !token) { router.push('/role-selection'); return; }
    if (!requireProfile('view this profile')) return;
    router.push({ pathname: '/creator-details', params: { postId, ...(ownerId ? { userId: ownerId } : {}) } } as any);
  };

  // Category keyword map for loose filtering against post descriptions / owner category
  const CATEGORY_KEYWORDS: Record<string, string[]> = {
    '1': ['video', 'editor', 'editing', 'motion', 'reel'],
    '2': ['creator', 'influencer', 'content', 'ugc'],
    '3': ['design', 'graphic', 'illustration', 'branding', 'ui', 'ux'],
    '4': ['writ', 'copywrite', 'blog', 'content write'],
  };

  const filteredPosts = selectedCategory
    ? posts.filter(post => {
      const keywords = CATEGORY_KEYWORDS[selectedCategory] || [];
      const searchText = [
        post.description || '',
        post.owner?.categoryName || '',
        post.category?.name || '',
      ].join(' ').toLowerCase();
      return keywords.some(kw => searchText.includes(kw));
    })
    : posts;

  const cards = filteredPosts.map(post => {
    const owner = post.owner || {};
    const name = getOwnerName(owner);
    const pic = owner.profilePicture || null;
    const roleLabel = owner.role
      ? owner.role.charAt(0) + owner.role.slice(1).toLowerCase()
      : 'User';
    return {
      id: post.id,
      ownerId: owner.id as string | undefined,
      ownerRole: owner.role as string | undefined,
      bannerUri: post.imageUrl || imgJamieStreetUnsplash1,
      isInitials: !pic,
      initials: name.slice(0, 2).toUpperCase(),
      avatarUri: pic,
      name,
      role: roleLabel,
      desc: post.description,
      price: post.collaborationType === 'PAID' ? 'Paid Collab' : 'Free Collab',
      time: getTimeAgo(post.createdAt),
    };
  });

  return (
    <View style={styles.root}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      {/* Full-screen purple→black gradient (top 264dp area) */}
      <View style={[styles.topHero, { paddingTop: statusBarHeight }]}>
        <Image
          source={heroBg}
          style={styles.heroBgImage}
          resizeMode="cover"
        />

        {/* Dark overlay (important for readability) */}
        <LinearGradient
          colors={['rgba(0,0,0,0.2)', '#000']}
          style={styles.heroOverlay}
        />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: 0 } // 🔥 remove extra space
          ]}
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
                <Text style={styles.hiText}>{userName}</Text>
                <Text style={styles.welcomeText}>Discover Freelancers for Creators</Text>
              </View>
            </View>

            {/* Icons right */}
            <View style={styles.headerRight}>
              {/* Chart icon */}
              <TouchableOpacity style={styles.iconCircle}>
                <Ionicons name="bar-chart-outline" size={16} color="#fff" />
              </TouchableOpacity>
              {/* Notification bell */}
              <TouchableOpacity style={styles.iconCircle} onPress={() => router.push('/notifications' as any)}>
                <Ionicons name="notifications-outline" size={16} color="#fff" />
                {pendingCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                    <Text style={styles.badgeText}>{pendingCount > 9 ? '9+' : pendingCount}</Text>
                  </View>
                )}
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

          {/* ══════════════ BANNER CAROUSEL ══════════════ */}
          {/* Figma: glassmorphic rgba(240,240,240,0.3) with border rgba(64,64,64,0.5) */}
          <View style={{ marginBottom: 28, borderRadius: 20, marginHorizontal: -8 }}>
            <Carousel
              loop
              width={width - 16}
              height={152}
              autoPlay={true}
              data={CAROUSEL_DATA}
              scrollAnimationDuration={1000}
              style={{ overflow: 'visible' }}
              renderItem={({ item }) => (
                <View style={{ paddingHorizontal: 8 }}>
                  <View style={[styles.bannerOuter, { marginBottom: 0 }]}>
                    <View style={styles.bannerGlass} />
                    <View style={styles.bannerInner}>
                      <View style={styles.bannerTextBlock}>
                        <Text style={styles.bannerTitle}>{item.title}</Text>
                        <Text style={styles.bannerDesc}>{item.desc}</Text>
                        <TouchableOpacity style={styles.exploreBtn} activeOpacity={0.85}>
                          <Text style={styles.exploreBtnText}>Explore Now</Text>
                        </TouchableOpacity>
                      </View>
                      <Image
                        source={item.image}
                        style={styles.bannerImg}
                        resizeMode="contain"
                      />
                    </View>
                    <View style={styles.bannerInsetOverlay} pointerEvents="none" />
                  </View>
                </View>
              )}
            />
          </View>

          {/* ══════════════ CATEGORIES ══════════════ */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catRow}
          >
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.catItem}
                  activeOpacity={0.8}
                  onPress={() => setSelectedCategory(isActive ? null : cat.id)}
                >
                  <View style={styles.catCardWrap}>
                    <View style={[
                      styles.catCard,
                      { backgroundColor: cat.bg },
                      isActive && { borderWidth: 2, borderColor: theme.primary },
                    ]}>
                      <Text style={styles.catLabel}>{cat.label}</Text>
                    </View>

                    <Image
                      source={cat.image}
                      style={[
                        styles.catImg,
                        { width: cat.imgSize, height: cat.imgSize, top: cat.imgTop }
                      ]}
                      resizeMode="contain"
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {/* ══════════════ RECENTLY UPDATED HEADER ══════════════ */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recently Updated</Text>
            <TouchableOpacity>
              <Text style={[styles.viewAll, { color: theme.primary }]}>View all</Text>
            </TouchableOpacity>
          </View>

          {/* ══════════════ CARDS ══════════════ */}
          {/* Figma: each card 408×290, glassmorphic bg #1e1e24, border rgba(156,156,156,0.5) */}
          <View style={styles.cardsList}>
            {loading ? (
              <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
            ) : cards.length === 0 ? (
              <Text style={{ color: '#fff', textAlign: 'center', marginTop: 40 }}>No posts found</Text>
            ) : (
              cards.map((item) => {
                const postColor = getRoleTheme(item.ownerRole).primary;
                return (
                  <TouchableOpacity key={item.id} style={styles.card} activeOpacity={0.9} onPress={() => handlePostTap(item.id, item.ownerId)}>

                    {/* ── Top hero image */}
                    <View style={styles.cardHero}>
                      <Image source={{ uri: item.bannerUri }} style={styles.cardBannerImg} resizeMode="cover" />
                      <View style={styles.cardHeroOverlay} />

                      {/* Top-right: share + bookmark */}
                      <View style={styles.cardTopIcons}>
                        <TouchableOpacity style={styles.heroIconBtn}>
                          <Ionicons name="share-social-outline" size={15} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.heroIconBtn} onPress={() => handleBookmark(item.id)}>
                          <Ionicons name="bookmark-outline" size={15} color="#fff" />
                        </TouchableOpacity>
                      </View>

                      {/* Profile row — bottom-left */}
                      <View style={styles.cardProfile}>
                        {item.isInitials ? (
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
                      <Text style={styles.cardDesc} numberOfLines={2}>{item.desc}</Text>

                      {/* Price + Time row */}
                      <View style={styles.cardMetaRow}>
                        <Text style={styles.cardPrice}>
                          {item.price === 'Paid Collab' ? '₹40K–50K/Month' : 'Free Collab'}
                        </Text>
                        <View style={styles.timeRow}>
                          <Ionicons name="time-outline" size={12} color="#7a7a8a" />
                          <Text style={styles.cardTime}> {item.time}</Text>
                        </View>
                      </View>

                      {/* Action buttons — color from post owner's role */}
                      <View style={styles.cardActions}>
                        <TouchableOpacity style={[styles.btnChat, { borderColor: postColor }]} activeOpacity={0.8}>
                          <MaterialIcons name="chat-bubble-outline" size={16} color={postColor} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.btnAction, { backgroundColor: postColor }]}
                          activeOpacity={0.8}
                          onPress={() => handlePostTap(item.id, item.ownerId)}
                        >
                          <Ionicons name="call-outline" size={14} color="#fff" />
                          <Text style={styles.btnActionText}>Call directly</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.btnAction, { backgroundColor: postColor }]}
                          activeOpacity={0.8}
                          onPress={() => handlePostTap(item.id, item.ownerId)}
                        >
                          <Text style={styles.btnActionText}>See Portfolio</Text>
                          <Ionicons name="chevron-down" size={14} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.cardInsetOverlay} pointerEvents="none" />
                  </TouchableOpacity>
                );
              }))}
          </View>

          {/* Bottom spacer so content doesn't hide behind nav */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Bottom nav + FAB are rendered globally by (tabs)/_layout.tsx. */}
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

  topHero: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280, // same as before
  },

  heroBgImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },

  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.20)', // 🔥 important (darkens image)
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
    marginBottom: 16,
    marginTop: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, // 🔥 more spacing
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 100, // 🔥 softer rounded like figma
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)', // glow edge
  },
  avatar: {
    width: '100%',
    height: '100%',

  },
  hiText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.5,
    lineHeight: 14,
    fontFamily: 'Poppins_600SemiBold',
    paddingBottom: 5,
  },
  welcomeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.5,
    lineHeight: 14,
    fontFamily: 'Poppins_500Medium',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',

    // 🔥 glass effect
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  badge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },

  // ── Search bar (Figma: border rgba(156,156,156,0.5), bg rgba(240,240,240,0.1))
  searchBar: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(156,156,156,0.5)',
    backgroundColor: 'rgba(240, 240, 240, 0.10)',
    boxShadow: ' 0 -5px 4px 0 rgba(255, 255, 255, 0.25) inset, 0 4px 4px 0 rgba(255, 255, 255, 0.25) inset, -42px 103px 31px 0 rgba(145, 145, 145, 0.00), -27px 66px 29px 0 rgba(145, 145, 145, 0.01), -15px 37px 24px 0 rgba(145, 145, 145, 0.03), -7px 17px 18px 0 rgba(145, 145, 145, 0.04), -2px 4px 10px 0 rgba(145, 145, 145, 0.05)',
    marginBottom: 20,
    backdropFilter: 'blur(10px)',
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
    fontFamily: 'Poppins_400Medium',
    textAlign: 'center',
  },
  searchWhite: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  micIcon: {
    marginLeft: 8,
  },

  // ── Banner (Figma: glassmorphic 152×409, bg rgba(240,240,240,0.3), border rgba(64,64,64,0.5))
  bannerOuter: {
    height: 148,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(156, 156, 156, 0.50)',
    overflow: 'hidden',
    marginBottom: 28,
    position: 'relative',
    backdropFilter: 'blur(10px)',
    boxShadow: ' 0 -5px 4px 0 rgba(255, 255, 255, 0.25) inset, 0 4px 4px 0 rgba(255, 255, 255, 0.25) inset, -42px 103px 31px 0 rgba(145, 145, 145, 0.00), -27px 66px 29px 0 rgba(145, 145, 145, 0.01), -15px 37px 24px 0 rgba(145, 145, 145, 0.03), -7px 17px 18px 0 rgba(145, 145, 145, 0.04), -2px 4px 10px 0 rgba(145, 145, 145, 0.05)',

  },
  bannerGlass: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(240, 240, 240, 0.30)',

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
    fontWeight: '600',
    letterSpacing: -0.5,
    marginBottom: 2,
    fontFamily: 'Poppins_600SemiBold',
  },
  bannerDesc: {
    color: '#000',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
    width: 212,
    fontFamily: 'Poppins_500SemiBold',

  },
  exploreBtn: {
    backgroundColor: '#F26930',
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: 'flex-start',
    fontFamily: 'Poppins_500Medium',
    letterSpacing: -0.5,
    fontSize: 14,

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
    height: 128.04,
    position: 'absolute',
    right: 0,
    bottom: 0,
    top: 12,
    left: 230,
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
    paddingHorizontal: 4,
    gap: 12, // spacing between cards
  },
  catItem: {
    alignItems: 'center',
  },
  // Wrapper: relative, height = card(82) + image overflow above(28) = 110
  catCardWrap: {
    width: 88,
    height: 110,
    position: 'relative',
    alignItems: 'center',
  },
  // Card: absolute at bottom of wrapper, contains the label at its bottom
  catCard: {
    position: 'absolute',
    bottom: 0,
    width: 88,
    height: 80,
    borderRadius: 16,

    justifyContent: 'center',   // 🔥 center vertically
    alignItems: 'center',       // 🔥 center horizontally

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },

  catImg: {
    position: 'absolute',
    top: -6,
    width: 45,
    height: 45,
    zIndex: 2,
  },
  catLabel: {
    color: '#1a1a2e',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 18,
    lineHeight: 14,
    maxWidth: 70,
    fontFamily: 'Poppins_400',
    fontWeight: '700',

  },
  // ── Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 12,
  },
  sectionTitle: {
    // Figma: Poppins SemiBold 20px white
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
  },
  viewAll: {
    // color is applied dynamically via theme.primary
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

  // Top-right icons (share + bookmark)
  cardTopIcons: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  heroIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
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
  initialsCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(30,30,36,0.75)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    backgroundColor: '#efefef',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cardAvatar: {
    width: '100%',
    height: '100%',
  },
  cardNameBlock: {
    gap: 2,
  },
  cardName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 17,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardRole: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: -0.2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Card body
  cardBody: {
    paddingHorizontal: 13,
    paddingTop: 13,
    // paddingBottom: 14,
  },
  cardDesc: {
    color: '#e0e0e0',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardPrice: {
    color: '#2ec75a',
    fontSize: 12,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cardTime: {
    color: '#888',
    fontSize: 10,
    fontWeight: '500',
  },

  // Action buttons row
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // Chat icon button — borderColor applied inline
  btnChat: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // "Call directly" / "See Portfolio" — backgroundColor applied inline
  btnAction: {
    flex: 1,
    height: 40,
    borderRadius: 99,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnActionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.3,
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

});
