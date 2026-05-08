import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Reanimated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Linking,
  Modal,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Defs, Path, Rect, Stop, Svg, LinearGradient as SvgGradient, Text as SvgText } from 'react-native-svg';
import CustomAlert from '../../Components/ui/CustomAlert';
import { useAuth } from '../../context/AuthContext';
import { useProfileGate } from '../../context/useProfileGate';
import { getCreatorById, getFeed, getFreelancerById, getFullProfile, listCollaborations, openConversationWith, sendCollaboration } from '../../services/userService';
import { getRoleTheme, useRoleTheme } from '../../theme/useRoleTheme';

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
const imgStars = require('../../assets/categories/stars.gif');
const imgPost = require('../../assets/categories/post.gif');
const imgLove = require('../../assets/categories/love.gif');
const imgTargetNew = require('../../assets/categories/targetnew.png');
const slide1 = require('../../assets/slides/slide1.png');
const slide2 = require('../../assets/slides/slide2.png');
const slide3 = require('../../assets/slides/slide3.png');
const slide4 = require('../../assets/slides/slide4.png');

const CAROUSEL_DATA = [
  {
    id: '1',
    titleLine1: 'Book',
    titleLine2: 'Expert',
    titleLine3: 'Creators',
    desc1: 'Find makeup, hair & creative  ',
    desc2: ' professionals. ',
    image: slide1,
    gradient: ['rgba(6,6,6,0.2)', '#ed2a91'],
  },
  {
    id: '2',
    titleLine1: 'Hire',
    titleLine2: 'Expert',
    titleLine3: 'Freelancers',
    desc1: 'Find makeup, hair & creative  ',
    desc2: ' professionals. ',
    image: slide2,
    gradient: ['rgba(0,0,0,0.2)', '#f26930'],
  },
  {
    id: '3',
    titleLine1: 'Discover',
    titleLine2: 'Trusted',
    titleLine3: 'Brands',
    desc1: 'Find makeup, hair & creative  ',
    desc2: ' professionals. ',
    image: slide3,
    gradient: ['rgba(0,0,0,0.6)', '#253e93'],
  },
  {
    id: '4',
    titleLine1: 'Connect',
    titleLine2: 'With',
    titleLine3: 'Agencies',
    desc1: 'Find makeup, hair & creative  ',
    desc2: ' professionals. ',
    image: slide4,
    gradient: ['rgba(0,0,0,0.6)', '#e2f20f'],
  },
];

const CATEGORIES = [
  { id: '1', label: 'Photography', image: imgPhotography, icon: 'camera-outline' as const },
  { id: '2', label: 'Editors', image: imgEditor, icon: 'desktop-outline' as const },
  { id: '3', label: 'Videography', image: imgVideography, icon: 'videocam-outline' as const },
  { id: '4', label: 'Growth\nSpecialist', image: imgGrowth, icon: 'trending-up-outline' as const },
  { id: '5', label: 'Script Writers', image: imgScriptWriters, icon: 'document-text-outline' as const },
  { id: '6', label: 'Styling &\nmakeup', image: imgStyling, icon: 'color-palette-outline' as const },
  { id: '7', label: 'Fashion\nDesigners', image: imgFashion, icon: 'shirt-outline' as const },
  { id: '8', label: 'Property\nRental', image: imgProperty, icon: 'home-outline' as const },
];

const CAT_BORDER_COLORS = [
  ['rgba(52, 52, 52, 1)', 'rgba(255, 51, 0, 0.5)'],
  ['rgba(52, 52, 52, 1)', 'rgba(0, 183, 255, 0.5)'],
  ['rgba(52, 52, 52, 1)', 'rgba(255, 238, 1, 0.5)'],
  ['rgba(52, 52, 52, 1)', 'rgba(1, 255, 35, 0.5)'],
  ['rgba(52, 52, 52, 1)', 'rgba(12, 62, 179, 0.5)'],
  ['rgba(52, 52, 52, 1)', 'rgba(143, 12, 229, 0.5)'],
  ['rgba(52, 52, 52, 1)', 'rgba(240, 0, 160, 0.5)'],
  ['rgba(52, 52, 52, 1)', 'rgba(250, 71, 0, 0.5)'],
];

const GradientHeading = React.memo(({ text, style, role }: { text: string, style?: any, role?: string }) => {
  const fontSize = style?.fontSize || 28;
  const fontFamily = style?.fontFamily || 'Poppins_600SemiBold';
  const isFreelancer = role === 'FREELANCER';
  const accentColor = isFreelancer ? '#f26930' : '#ed2a91';

  // Use a tighter multiplier to reduce extra space
  const widthVal = text.length * fontSize * 0.58;

  return (
    <View style={{ width: widthVal, height: fontSize * 1.4 }}>
      <Svg height="100%" width="100%" viewBox={`0 0 ${widthVal} ${fontSize * 1.4}`}>
        <Defs>
          <SvgGradient id="grad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="1" />
            <Stop offset="1" stopColor={accentColor} stopOpacity="1" />
          </SvgGradient>
        </Defs>
        <SvgText
          fill="url(#grad)"
          fontSize={fontSize}
          fontFamily={fontFamily}
          x="0"
          y={fontSize}
        >
          {text}
        </SvgText>
      </Svg>
    </View>
  );
});

const StrokeText = React.memo(({ text, strokeColor }: { text: string, strokeColor: string }) => {
  const fontSize = 38;
  const fontFamily = 'Poppins_800ExtraBold';
  const widthVal = width - 32;
  const heightVal = fontSize * 1.3;

  return (
    <View style={{ height: heightVal, width: widthVal }}>
      <Svg height="100%" width="100%" viewBox={`0 0 ${widthVal} ${heightVal}`}>
        {/* Layer 1: The Stroke (Bottom Layer) */}
        <SvgText
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          fontSize={fontSize}
          fontFamily={fontFamily}
          x="2"
          y={fontSize}
          fontWeight="800"
        >
          {text}
        </SvgText>
        {/* Layer 2: The Fill (Top Layer) */}
        <SvgText
          fill="#FFFFFF"
          fontSize={fontSize}
          fontFamily={fontFamily}
          x="2"
          y={fontSize}
          fontWeight="800"
        >
          {text}
        </SvgText>
      </Svg>
    </View>
  );
});

// Memoized Carousel Card — animations driven by Reanimated SharedValue (UI thread)
const CarouselCard = React.memo(({ item, animationValue, CARD_WIDTH, ITEM_SIZE, handlePostTap, handleBookmark, handleSeePortfolio, handleMessage, handleCall, handleShare, handleCollab, collabSentIds, viewerTheme }: any) => {
  const collabSent = collabSentIds?.has(item.id);
  const postColor = viewerTheme?.primary || '#ED2A91';

  const animStyle = useAnimatedStyle(() => {
    const scale = interpolate(animationValue.value, [-1, 0, 1], [0.85, 1, 0.85], 'clamp');
    const opacity = interpolate(animationValue.value, [-1, 0, 1], [0.8, 1, 0.8], 'clamp');
    const rotateY = interpolate(animationValue.value, [-1, 0, 1], [15, 0, -15], 'clamp');
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }, { scale }],
      opacity,
    };
  });

  return (
    <View style={{ width: ITEM_SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <Reanimated.View style={[{ width: CARD_WIDTH }, animStyle]}>
        <TouchableOpacity style={styles.figmaCard} activeOpacity={0.9} onPress={() => handlePostTap(item.id, item.ownerId)}>
          {/* Top Opacity Overlay */}
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.05)', 'transparent']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%' }}
          />
          {/* Top Absolute Row */}
          <View style={styles.figmaCardTopRow}>
            <View style={styles.figmaCardRoleBadge}>
              <Text style={styles.figmaCardRoleText}>{item.role}</Text>
            </View>
            <TouchableOpacity style={styles.figmaCardBookmarkBtn} onPress={() => handleBookmark(item.id)}>
              <Ionicons name="bookmark-outline" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Avatar */}
          <View style={styles.figmaCardAvatarWrap}>
            {item.isInitials ? (
              <View style={[styles.figmaCardAvatarImg, { backgroundColor: postColor + '33', justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: postColor, fontSize: 18, fontWeight: 'bold' }}>{item.initials}</Text>
              </View>
            ) : (
              <Image source={{ uri: item.avatarUri }} style={styles.figmaCardAvatarImg} resizeMode="cover" />
            )}
          </View>

          {/* Name & Details */}
          <Text style={styles.figmaCardName}>{item.name}</Text>

          <View style={styles.figmaCardMetaRow}>
            <TouchableOpacity
              style={[styles.figmaCardPortfolioBtn, { backgroundColor: postColor }]}
              onPress={() => handleSeePortfolio(item.ownerId, item.ownerRole)}
            >
              <Text style={styles.figmaCardPortfolioText}>See Portfolio</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
              <Ionicons name="time-outline" size={14} color="#a1a2a4" />
              <Text style={styles.figmaCardTimeText}> {item.time}</Text>
            </View>
          </View>

          <Text style={styles.figmaCardDesc} numberOfLines={3}>{item.desc}</Text>

          <Text style={styles.figmaCardPrice}>{item.price === 'Paid Collab' ? '₹ 10K-15K/Month' : 'Free Collab'}</Text>

          {/* Bottom Actions */}
          {!collabSent ? (
            <TouchableOpacity
              style={[styles.figmaCardActions, { backgroundColor: postColor, borderRadius: 20, justifyContent: 'center', paddingHorizontal: 0 }]}
              onPress={() => handleCollab(item.id, item.ownerId)}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#fff', fontSize: 13, fontFamily: 'Poppins_600SemiBold' }}>Collaborate</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.figmaCardActions}>
              <TouchableOpacity style={styles.figmaCardActionBtn} onPress={() => handleMessage(item.ownerId)}>
                <Ionicons name="chatbubble-ellipses-outline" size={16} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.figmaCardActionBtn} onPress={() => handleCall(item.owner)}>
                <Ionicons name="call-outline" size={16} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.figmaCardActionBtn} onPress={() => handleShare(item.id)}>
                <Ionicons name="share-social-outline" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </Reanimated.View>
    </View>
  );
});

// Static — derived from constant CATEGORIES, never changes
const categoryColumns = [
  [CATEGORIES[0], CATEGORIES[4]],
  [CATEGORIES[1], CATEGORIES[5]],
  [CATEGORIES[2], CATEGORIES[6]],
  [CATEGORIES[3], CATEGORIES[7]],
];

export default function Homepage() {
  const router = useRouter();
  const { token, isGuest, userRole } = useAuth();
  const { requireProfile } = useProfileGate();
  const theme = useRoleTheme();
  const insets = useSafeAreaInsets();

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createPostWidth, setCreatePostWidth] = useState(0);
  const [userName, setUserName] = useState<string>('');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const [portfolioModalVisible, setPortfolioModalVisible] = useState(false);
  const [selectedPortfolioLink, setSelectedPortfolioLink] = useState<string | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [collabSentIds, setCollabSentIds] = useState<Set<string>>(new Set());

  const [currentSlide, setCurrentSlide] = useState(0);

  const colWidth = (width - 32 - 28) / 3;
  const snapInterval = colWidth * 2 + 14 * 2;

  const scrollXCat = useRef(new Animated.Value(0)).current;
  const activeCatPage = Animated.divide(scrollXCat, snapInterval);

  const showAlert = useCallback((title: string, message: string) => {
    setAlertConfig({ visible: true, title, message });
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        if (!token) { setPosts([]); setLoading(false); return; }
        const res = await getFeed(token);
        const allPosts: any[] = Array.isArray(res.data) ? res.data : [];
        setPosts(allPosts);
      } catch (error) {
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
        setUserAvatar(p.profilePicture || null);
      } else {
        setUserName('User');
        setUserAvatar(null);
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

  const handleBookmark = useCallback(async (_postId: string) => {}, []);

  const handlePostTap = useCallback((postId: string, ownerId?: string) => {
    if (isGuest || !token) { router.push('/role-selection'); return; }
    if (!requireProfile('view this profile')) return;
    router.push({ pathname: '/creator-details', params: { postId, ...(ownerId ? { userId: ownerId } : {}) } } as any);
  }, [isGuest, token, requireProfile, router]);

  const handleMessage = useCallback(async (ownerId?: string) => {
    if (isGuest || !token) { router.push('/role-selection'); return; }
    if (!requireProfile('message this user')) return;
    if (!ownerId) return;
    try {
      const res = await openConversationWith(token, ownerId);
      if (res.success && res.data?.id) {
        router.push(`/chat/${res.data.id}` as any);
      } else {
        showAlert('Chat Error', res.error || 'Could not open conversation.');
      }
    } catch {
      showAlert('Error', 'Failed to open chat.');
    }
  }, [isGuest, token, requireProfile, router, showAlert]);

  const handleCall = useCallback((owner?: any) => {
    if (isGuest || !token) { router.push('/role-selection'); return; }
    if (!requireProfile('call this user')) return;
    const phone = owner?.mobileNumber || owner?.phone;
    if (!phone) { showAlert('Contact Error', 'This user has not shared their mobile number.'); return; }
    Linking.openURL(`tel:${phone}`);
  }, [isGuest, token, requireProfile, router, showAlert]);

  const handleSeePortfolio = useCallback(async (ownerId?: string, ownerRole?: string) => {
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
      setSelectedPortfolioLink(profileData?.portfolioUrl || profileData?.portfolio || profileData?.portfolioLink || null);
    } catch {
      setSelectedPortfolioLink(null);
    } finally {
      setPortfolioLoading(false);
    }
  }, [token]);

  const handleShare = useCallback(async (postId: string) => {
    try {
      const url = `https://digitag.ai/post/${postId}`;
      await Share.share({ message: `Check out this post on Digitag: ${url}`, url, title: 'Digitag Post' });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  }, []);

  const handleCollab = useCallback(async (postId: string, ownerId?: string) => {
    if (isGuest || !token) { router.push('/role-selection'); return; }
    if (!requireProfile('send a collaboration request')) return;
    if (!ownerId) return;
    if (collabSentIds.has(postId)) { showAlert('Already Sent', 'You already sent a collaboration request for this post.'); return; }
    try {
      const res = await sendCollaboration(token, { receiverId: ownerId, postId });
      if (res.success) {
        setCollabSentIds(prev => new Set(prev).add(postId));
        showAlert('Request Sent!', 'Your collaboration request has been sent.');
      } else {
        showAlert('Request Failed', (res as any).error || 'Could not send collaboration request.');
      }
    } catch {
      showAlert('Error', 'Something went wrong. Please try again.');
    }
  }, [isGuest, token, requireProfile, router, collabSentIds, showAlert]);

  const CARD_WIDTH = 250;
  const SPACING = 10;
  const ITEM_SIZE = CARD_WIDTH + SPACING;

  const cards = useMemo(() => posts.map(post => {
    const owner = post.owner || {};
    const name = getOwnerName(owner);
    const pic = owner.profilePicture || null;
    const roleLabel = owner.role ? owner.role.charAt(0) + owner.role.slice(1).toLowerCase() : 'User';
    return {
      id: post.id,
      owner,
      ownerId: owner.id as string | undefined,
      ownerRole: owner.role as string | undefined,
      bannerUri: post.imageUrl || FALLBACK_BANNER,
      isInitials: !pic,
      initials: name.slice(0, 2).toUpperCase(),
      avatarUri: pic,
      name,
      role: roleLabel,
      desc: post.description,
      price: post.collaborationType === 'PAID' ? 'Paid Collab' : 'Free Collab',
      time: getTimeAgo(post.createdAt),
      portfolioLink: owner.portfolio || owner.portfolioLink || owner.portfolioUrl || null,
    };
  }), [posts]);

  return (
    <View style={styles.root}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 65 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
        removeClippedSubviews={true}
      >
        {/* ══════════════ HERO CAROUSEL ══════════════ */}
        <View style={{ height: 432, position: 'relative' }}>
          <Carousel
            loop
            width={width}
            height={432}
            autoPlay={true}
            data={CAROUSEL_DATA}
            scrollAnimationDuration={600}
            onSnapToItem={(index) => setCurrentSlide(index)}
            renderItem={({ item }) => (
              <View style={{ flex: 1 }}>
                <Image
                  source={item.image}
                  style={{ position: 'absolute', width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={{ position: 'absolute', bottom: 25, left: 16 }}>
                  <View>
                    <StrokeText text={item.titleLine1} strokeColor={item.gradient[1]} />
                    <StrokeText text={item.titleLine2} strokeColor={item.gradient[1]} />
                    <StrokeText text={item.titleLine3} strokeColor={item.gradient[1]} />
                  </View>
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.heroDesc}>{item.desc1}</Text>
                    <Text style={styles.heroDesc}>{item.desc2}</Text>
                  </View>
                  <TouchableOpacity style={[styles.contactBtn, { backgroundColor: item.gradient[1] }]} activeOpacity={0.8}>
                    <Text style={[styles.contactBtnText, item.id === '4' && { color: '#000' }]}>Contact</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
          {/* Pagination Dots */}
          <View style={styles.paginationContainer}>
            {CAROUSEL_DATA.map((_, index) => (
              <View key={index} style={[styles.dot, currentSlide === index ? styles.activeDot : null]} />
            ))}
          </View>

          {/* ══════════════ FLOATING HEADER ══════════════ */}
          <View style={[styles.headerWrapper, { paddingTop: insets.top + 10 }]}>
            <View style={styles.floatingHeader}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.12)', 'rgba(255,255,255,0.06)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.floatingHeaderInner}>
                <View style={styles.headerAvatarWrap}>
                  {userAvatar ? (
                    <Image source={{ uri: userAvatar }} style={styles.headerAvatar} />
                  ) : (
                    <View style={[styles.headerAvatar, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
                      <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{userName.charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                </View>
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.headerName}>{userName}</Text>
                  <Text style={styles.headerTag}>Fashion <Text style={{ fontWeight: '600', color: '#fff' }}>tag: 45600hyd</Text></Text>
                </View>
              </View>
            </View>

            <View style={styles.headerRightIcons}>
              <TouchableOpacity style={styles.iconCircleDark} onPress={() => router.push('/analytics' as any)}>
                <Ionicons name="stats-chart" size={16} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconCircleDark} onPress={() => router.navigate('/notifications' as any)}>
                <Ionicons name="notifications-outline" size={16} color="#fff" />
                {pendingCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                    <Text style={styles.badgeText}>{pendingCount > 9 ? '9+' : pendingCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 32 }}>
          {/* ══════════════ FREELANCERS BY CATEGORY ══════════════ */}
          <View style={{ marginBottom: 20 }}>
            <GradientHeading text="Freelancers by category" style={styles.gradientHeadingText} role={userRole ?? undefined} />
          </View>
          <View style={styles.catCarouselContainer}>
            <Animated.FlatList
              data={categoryColumns}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={snapInterval}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: 2, gap: 12 }}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollXCat } } }],
                { useNativeDriver: true }
              )}
              keyExtractor={(_, i) => `col-${i}`}
              renderItem={({ item: colItems }) => (
                <View style={styles.catColumn}>
                  {colItems.map((cat) => {
                    const globalIdx = CATEGORIES.findIndex(c => c.id === cat.id);
                    return (
                      <TouchableOpacity key={cat.id} style={styles.catGridItem} onPress={() => router.push({ pathname: '/(tabs)/explore', params: { category: cat.label.replace('\n', ' ') } } as any)}>
                        <LinearGradient
                          colors={CAT_BORDER_COLORS[globalIdx] as [string, string]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.catGradientBorder}
                        >
                          <View style={styles.catGridCard}>
                            {cat.image ? (
                              <Image source={cat.image} style={styles.catGridImg} resizeMode="contain" />
                            ) : (
                              <Ionicons name={cat.icon} size={36} color="#aaa" />
                            )}
                            <Text style={styles.catGridLabel}>{cat.label}</Text>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            />
            {/* Pagination Dots */}
            <View style={styles.catPagination}>
              {[0, 1].map((i) => {
                const opacity = activeCatPage.interpolate({
                  inputRange: [i - 1, i, i + 1],
                  outputRange: [0.3, 1, 0.3],
                  extrapolate: 'clamp',
                });
                const scale = activeCatPage.interpolate({
                  inputRange: [i - 1, i, i + 1],
                  outputRange: [0.8, 1.2, 0.8],
                  extrapolate: 'clamp',
                });
                return (
                  <Animated.View
                    key={i}
                    style={[
                      styles.catDot,
                      { opacity, transform: [{ scale }] }
                    ]}
                  />
                );
              })}
            </View>
          </View>
        </View>

        {/* ══════════════ RECENT UPDATES ══════════════ */}
        <View style={{ marginTop: 40, marginBottom: 20, paddingHorizontal: 16 }}>
          <GradientHeading text="Recent Updates" style={styles.gradientHeadingText} role={userRole} />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
        ) : cards.length === 0 ? (
          <Text style={{ color: '#fff', textAlign: 'center', marginTop: 40 }}>No posts found</Text>
        ) : (
          <LinearGradient
            colors={['transparent', theme.soft, theme.soft, 'transparent']}
            locations={[0, 0.3, 0.7, 1]}
            style={{ paddingVertical: 50 }}
          >
            <Carousel
              loop
              width={ITEM_SIZE}
              height={370}
              data={cards}
              style={{ width }}
              scrollAnimationDuration={400}
              renderItem={({ item, animationValue }: any) => (
                <CarouselCard
                  item={item}
                  animationValue={animationValue}
                  ITEM_SIZE={ITEM_SIZE}
                  CARD_WIDTH={CARD_WIDTH}
                  handlePostTap={handlePostTap}
                  handleBookmark={handleBookmark}
                  handleSeePortfolio={handleSeePortfolio}
                  handleMessage={handleMessage}
                  handleCall={handleCall}
                  handleShare={handleShare}
                  handleCollab={handleCollab}
                  collabSentIds={collabSentIds}
                  viewerTheme={theme}
                />
              )}
            />
          </LinearGradient>
        )}

        <View style={{ paddingHorizontal: 16 }}>
          <TouchableOpacity 
            style={[styles.exploreNowBtn, { backgroundColor: theme.primary }]} 
            onPress={() => router.push('/explore')}
          >
            <Text style={styles.exploreNowBtnText}>Explore now</Text>
          </TouchableOpacity>

          {/* ══════════════ CREATE POST ══════════════ */}
          <View style={{ marginTop: 20, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <GradientHeading text="Create Post" style={styles.gradientHeadingText} role={userRole} />
              <Image
                source={imgStars}
                style={{ width: 32, height: 32, aspectRatio: 1, marginLeft: -4, marginTop: -4 }}
                resizeMode="contain"
              />
            </View>
            <TouchableOpacity
              style={styles.createPostCard}
              activeOpacity={0.8}
              onPress={() => { if (!requireProfile('create a post')) return; router.push('/create-post' as any); }}
              onLayout={(e) => setCreatePostWidth(e.nativeEvent.layout.width)}
            >
              {createPostWidth > 0 && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                  <Svg height="100%" width="100%">
                    <Defs>
                      <SvgGradient id="dashedGrad" x1="0" y1="0" x2="1" y2="1">
                        <Stop offset="0" stopColor="#ed2a91" stopOpacity="1" />
                        <Stop offset="1" stopColor="#3b82f6" stopOpacity="1" />
                      </SvgGradient>
                    </Defs>
                    <Rect
                      x="0.5"
                      y="0.5"
                      width={createPostWidth - 1.5}
                      height={178.5}
                      rx={36}
                      ry={36}
                      stroke="url(#dashedGrad)"
                      strokeWidth="0.4"
                      strokeDasharray="8, 6"
                      fill="transparent"
                    />
                  </Svg>
                </View>
              )}
              <View style={styles.createPostIconWrap}>
                <Image source={imgPost} style={{ width: 64, height: 64 }} resizeMode="contain" />
              </View>
              <Text style={styles.createPostText}>Create your first post</Text>
            </TouchableOpacity>
          </View>

        </View>

        {/* ══════════════ BHARAT FIRST SECTION ══════════════ */}
        <View style={styles.bharatSection}>
          {/* Background SVG Lines */}
          <View style={{ position: 'absolute', top: -100, right: -80, bottom: 10, left: 50, opacity: 0.15 }}>
            <Svg width="100%" height="100%" viewBox="0 0 400 500" fill="none" preserveAspectRatio="none">
              <Path
                d="M0.000465703 500.92C0.000465703 500.92 153.908 500.666 210.353 423.461C268.027 344.577 147.742 288.158 206.128 209.733C257.903 140.188 352.938 201.986 395.598 127.761C423.42 79.3532 408.426 0.0919289 408.426 0.0919289"
                stroke="#F2AF1A"
                strokeWidth="1"
                transform="translate(0, 0)"
              />
              <Path
                d="M0.000465703 500.92C0.000465703 500.92 153.908 500.666 210.353 423.461C268.027 344.577 147.742 288.158 206.128 209.733C257.903 140.188 352.938 201.986 395.598 127.761C423.42 79.3532 408.426 0.0919289 408.426 0.0919289"
                stroke="#48D4A5"
                strokeWidth="1"
                transform="translate(25, 25)"
              />
              <Path
                d="M0.000465703 500.92C0.000465703 500.92 153.908 500.666 210.353 423.461C268.027 344.577 147.742 288.158 206.128 209.733C257.903 140.188 352.938 201.986 395.598 127.761C423.42 79.3532 408.426 0.0919289 408.426 0.0919289"
                stroke="#326CF9"
                strokeWidth="1"
                transform="translate(50, 50)"
              />
            </Svg>
          </View>
          <Image source={imgLove} style={{ width: 48, height: 48, marginBottom: 4 }} resizeMode="contain" />
          <Text style={styles.bharatTitle}>Bharat First{"\n"}Collaboration{"\n"}Network For Creators</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', }}>
            <Text style={styles.bharatSubtitle}>All-in-one space for creators </Text>
            <Image source={imgTargetNew} style={{ width: 22, height: 22, marginBottom: 10 }} />
          </View>
          <View style={{ flexDirection: 'row', marginVertical: 10 }}>
            <Text style={[styles.bharatDivider, { opacity: 0.6 }]}>----</Text>
            <Text style={[styles.bharatDivider, { opacity: 0.5 }]}>----</Text>
            <Text style={[styles.bharatDivider, { opacity: 0.4 }]}>----</Text>
            <Text style={[styles.bharatDivider, { opacity: 0.3 }]}>----------</Text>
            <Text style={[styles.bharatDivider, { opacity: 0.2 }]}>----</Text>
            <Text style={[styles.bharatDivider, { opacity: 0.1 }]}>----</Text>
            <Text style={[styles.bharatDivider, { opacity: 0 }]}>----</Text>
          </View>
          <Text style={styles.bharatSubtitle}>This is only the start</Text>

          <View style={styles.bharatBtnRow}>
            <TouchableOpacity 
              style={[styles.bharatPinkBtn, { backgroundColor: userRole === 'FREELANCER' ? '#f26930' : '#ed2a91' }]}
            >
              <Text style={styles.bharatPinkBtnText}>The TeamC_official</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.bharatOutlineBtn, { borderColor: userRole === 'FREELANCER' ? '#f26930' : '#ed2a91' }]}
            >
              <Ionicons name="logo-whatsapp" size={14} color="#25D366" />
              <Text style={styles.bharatOutlineBtnText}> Let's Talk</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ══════════════ PORTFOLIO MODAL ══════════════ */}
      <Modal
        visible={portfolioModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPortfolioModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalDismissArea} activeOpacity={1} onPress={() => setPortfolioModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Feather name="link" size={20} color="#fff" />
                <Text style={styles.modalTitle}>Portfolio Links</Text>
              </View>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setPortfolioModalVisible(false)}>
                <Feather name="x" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
            {portfolioLoading ? (
              <ActivityIndicator color="#A78BFA" style={{ marginTop: 16 }} />
            ) : selectedPortfolioLink ? (
              <TouchableOpacity
                style={styles.portfolioLinkContainer}
                onPress={() => {
                  let url = selectedPortfolioLink;
                  if (!url.startsWith('http://') && !url.startsWith('https://')) { url = 'https://' + url; }
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

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
        role={userRole as any}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#060606',
  },
  scroll: {
    flex: 1,
  },

  // HERO & HEADER
  headerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
    marginTop: 15,
  },
  floatingHeader: {
    borderRadius: 99,
    paddingVertical: 6,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    overflow: 'hidden',
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  floatingHeaderInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatarWrap: {
    width: 36,
    height: 36, // Back to square for a perfect circle
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ed2a91',

  },
  headerAvatar: {
    width: '100%',
    height: '100%',

  },
  headerName: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    lineHeight: 16,
  },
  headerTag: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  headerRightIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconCircleDark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,

  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },

  heroTitle: {
    color: '#fff',
    fontSize: 38,
    fontFamily: 'Poppins_800ExtraBold',
    letterSpacing: 0.5,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  heroDesc: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    maxWidth: '70%',
    lineHeight: 18,
  },
  contactBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 99,
    alignSelf: 'flex-start',
    marginTop: 20,

  },
  contactBtnText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',

  },
  paginationContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  activeDot: {
    width: 12,
    backgroundColor: '#000',
  },

  // CATEGORIES GRID
  gradientHeadingText: {
    color: '#ff6ab9',
    fontSize: 28,
    fontFamily: 'Poppins_600SemiBold',

  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  catCarouselContainer: {
    height: 275,
  },
  catColumn: {
    gap: 14,
    width: (width - 32 - 28) / 3,
  },
  catGridItem: {
    width: (width - 32 - 28) / 3,
    height: 116,
  },
  catPagination: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 10,
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f9f4f6ff',
  },
  catGradientBorder: {
    borderRadius: 24,
    padding: 0.4,

  },
  catGridCard: {
    backgroundColor: '#050404',
    borderRadius: 23.6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    width: '100%',
    height: '100%',
  },
  catGridImg: {
    width: 51,
    height: 51,
    marginBottom: 8,
  },
  catGridLabel: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },

  // RECENT UPDATES CARDS
  cardsList: {
    paddingHorizontal: (width - 280) / 2,
    gap: 16,
  },
  figmaCard: {
    width: 251,
    height: 350,
    backgroundColor: '#1E1E24',
    borderRadius: 24,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  figmaCardTopRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  figmaCardRoleBadge: {
    backgroundColor: '#10151e',
    borderBottomRightRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  figmaCardRoleText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
  },
  figmaCardBookmarkBtn: {
    padding: 12,
  },
  figmaCardAvatarWrap: {
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2A2A32',
  },
  figmaCardAvatarImg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#1E1E24',
  },
  figmaCardName: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Poppins_500Medium',
    marginTop: 8,
  },
  figmaCardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  figmaCardPortfolioBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 99,
  },
  figmaCardPortfolioText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  figmaCardTimeText: {
    color: '#a1a2a4',
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
  },
  figmaCardDesc: {
    color: '#d1d2d4',
    fontSize: 11,
    fontFamily: 'Poppins_300Light',
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    lineHeight: 16,
  },
  figmaCardPrice: {
    color: '#00a401',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    marginTop: 12,
  },
  figmaCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    position: 'absolute',
    bottom: 20,
  },
  figmaCardActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#373839',
    justifyContent: 'center',
    alignItems: 'center',
  },

  exploreNowBtn: {
    backgroundColor: '#f26930', // orange color
    borderRadius: 99,
    paddingVertical: 16,
    alignItems: 'center',

    marginBottom: 40,
    marginHorizontal: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  exploreNowBtnText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Poppins_500Medium',
  },

  // CREATE POST
  createPostCard: {
    backgroundColor: '#1E1E24',
    borderRadius: 36,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
  },
  createPostIconWrap: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  createPostHeartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  createPostText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
  },

  // BHARAT FIRST SECTION
  bharatSection: {
    marginTop: 40,
    backgroundColor: '#1E1E24',
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 120,
    marginBottom: 0,
  },
  bharatTitle: {
    color: '#fff',
    fontSize: 32,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 40,
    marginBottom: 16,
    letterSpacing: 0,
  },
  bharatSubtitle: {
    color: '#bbb',
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',

  },
  bharatDivider: {
    color: '#787474ff',
    fontSize: 14,
    fontFamily: 'Poppins_300Light',
    marginBottom: 8,
  },
  bharatBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
  },
  bharatPinkBtn: {
    backgroundColor: '#f26930',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  bharatPinkBtnText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  bharatOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f26930',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 12,
  },
  bharatOutlineBtnText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
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
  portfolioLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  portfolioLinkText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
  },
  noPortfolioText: {
    color: '#8A8A99',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    marginTop: 10,
  },
});
