import { Feather, Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Circle, Defs, RadialGradient, Stop, Svg } from 'react-native-svg';
import PortfolioImageCarousel from '../Components/PortfolioImageCarousel';
import ReportModal from '../Components/ui/ReportModal';
import VerifiedBadge from '../Components/ui/VerifiedBadge';
import { useAuth } from '../context/AuthContext';
import { useCall } from '../context/CallContext';
import { useProfileGate } from '../context/ProfileGateContext';
import { buildCreatorSocialLinks, SocialLink } from '../services/socialLinks';
import {
  cancelCollaboration,
  getCollaborationWith,
  getPostById,
  getReportStatus,
  getSavedPostIds,
  getUserById,
  initiateCall,
  openConversationWith,
  sendCollaboration,
  toggleSavePost,
  updatePostStatus,
} from '../services/userService';
import { getRoleTheme, useRoleTheme } from '../theme/useRoleTheme';


function timeAgo(dateStr?: string) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// Display-only formatting for the budget pill — turns each run of digits
// into "K" notation (5000 -> 5K, 12500 -> 12.5K) so a range like
// "5000-10000" becomes "5K-10K". Doesn't touch the underlying budget value.
function formatBudgetK(value: string | number) {
  return String(value).replace(/\d+/g, (match) => {
    const num = parseInt(match, 10);
    if (num < 1000) return match;
    const k = num / 1000;
    return `${Number.isInteger(k) ? k : k.toFixed(1)}K`;
  });
}

// Ambient glow circle (same technique as the Home screen's background
// glows) — an SVG radial gradient, not RN's shadow* props, so it renders
// identically on iOS and Android instead of being iOS-only.
const GlowCircle = ({ size, color, opacity = 1, style }: { size: number; color: string; opacity?: number; style?: any }) => {
  const gradId = React.useMemo(() => `glow_${Math.random().toString(36).slice(2, 10)}`, []);
  return (
    <View pointerEvents="none" style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={gradId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
            <Stop offset="55%" stopColor={color} stopOpacity={opacity * 0.45} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${gradId})`} />
      </Svg>
    </View>
  );
};

export default function PostDetail() {
  const router = useRouter();
  const { token, userId: myId, userRole } = useAuth();
  const call = useCall();
  const { requireProfile } = useProfileGate();
  const theme = useRoleTheme();
  const { postId } = useLocalSearchParams<{ postId: string }>();

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [collabStatus, setCollabStatus] = useState<'NONE' | 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'DECLINED' | 'CANCELLED'>('NONE');
  const [collabId, setCollabId] = useState<string | null>(null);
  const [cancelBusy, setCancelBusy] = useState(false);
  // Product rule (matches the backend gates): chat/calls are open only while
  // a collaboration is ACCEPTED — completing it closes contact until a new
  // collab is accepted.
  const contactUnlocked = collabStatus === 'ACCEPTED';
  const [collabBusy, setCollabBusy] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isReported, setIsReported] = useState(false);

  // Popup state
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupType, setPopupType] = useState<'success' | 'error'>('success');
  const [popupTitle, setPopupTitle] = useState('Success');
  const [popupMessage, setPopupMessage] = useState('');

  // Portfolio modal state (same pattern as the Home screen's "See Portfolio")
  const [portfolioModalVisible, setPortfolioModalVisible] = useState(false);
  const [selectedPortfolioLink, setSelectedPortfolioLink] = useState<string | null>(null);
  const [selectedSocialLinks, setSelectedSocialLinks] = useState<SocialLink[] | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);

  const load = useCallback(async () => {
    if (!postId) { setLoading(false); return; }
    // Guests can view a post without an account; only logged-in users are held to the
    // profile-completion gate that was already enforced here.
    if (token && !requireProfile('view this post')) { setLoading(false); return; }
    const res = await getPostById(postId, token);
    if (res.success && res.data) {
      setPost(res.data);
      if (token) {
        const ownerId = res.data.owner?.id || res.data.userId;
        const [collabRes, savedRes, reportRes] = await Promise.all([
          // Scoped to this exact post — a freelancer with multiple posts must
          // show each one's own collaboration status independently, not
          // whichever collab with this owner happens to be most recent.
          ownerId ? getCollaborationWith(token, ownerId, postId) : Promise.resolve({ success: false }),
          getSavedPostIds(token),
          getReportStatus(token, 'POST', postId),
        ]);
        if (collabRes.success) {
          setCollabStatus(((collabRes as any).data?.status ?? 'NONE') as any);
          setCollabId((collabRes as any).data?.id ?? null);
        }
        if (savedRes.success && Array.isArray(savedRes.data)) setIsSaved(savedRes.data.includes(postId));
        if (reportRes.success) setIsReported(Boolean((reportRes as any).data?.reported));
      }
    }
    setLoading(false);
  }, [token, postId, requireProfile]);

  // Refetch on every focus, not just first mount — collab status (accepted/
  // declined/cancelled by the other party) can change while this screen sits
  // in the nav stack, same class of staleness fixed in notifications.tsx.
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const owner = post?.owner || {};
  const accent = theme.primary;
  // Post owner's own role color (not the viewer's) — used for the profile
  // card's top glow/border so a Freelancer's post reads orange and a
  // Creator's post reads pink regardless of who's viewing it.
  const ownerTheme = getRoleTheme(owner.role);
  const isOwnerFreelancer = owner.role === 'FREELANCER';
  const name = owner.name || (isOwnerFreelancer ? 'Freelancer' : 'Creator');
  const pic = owner.profilePicture || null;
  const isPaid = post?.collaborationType === 'PAID';
  // Same Experience-badge treatment as the Home screen's post card —
  // solid role-tinted fill, gradient border, gradient-masked star icon.
  const expertBg = isOwnerFreelancer ? '#4C2409' : '#460628';
  const expertGradientColors = isOwnerFreelancer
    ? ['rgba(255, 152, 42, 1)', 'rgba(245, 136, 92, 1)', 'rgba(227, 86, 28, 1)']
    : ['rgba(237, 42, 145, 1)', 'rgba(206, 10, 113, 1)', 'rgba(175, 4, 95, 1)'];

  const goToProfile = () => {
    if (!owner.id) return;
    router.push({ pathname: '/creator-details', params: { userId: owner.id } } as any);
  };

  const handleCollab = async () => {
    if (!requireProfile('send a collab request')) return;
    if (!token || !owner.id || collabBusy) return;
    setCollabBusy(true);
    try {
      const res = await sendCollaboration(token, { receiverId: owner.id, postId, message: 'I would love to collaborate with you!' });
      if (res.success !== false) {
        setCollabStatus('PENDING');
        setCollabId((res as any).data?.id ?? null);
        setPopupType('success');
        setPopupTitle('Collab Sent!');
        setPopupMessage('Your collaboration request has been sent.');
        setPopupVisible(true);
      } else {
        setPopupType('error');
        setPopupMessage((res as any).error || 'Could not send collab request.');
        setPopupVisible(true);
      }
    } catch {
      setPopupType('error');
      setPopupMessage('Could not send collab request.');
      setPopupVisible(true);
    } finally {
      setCollabBusy(false);
    }
  };

  const handleCancelCollab = () => {
    if (!token || !collabId || cancelBusy) return;
    Alert.alert(
      'Cancel request?',
      'This will withdraw your collaboration request. You can send a new one later.',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel Request',
          style: 'destructive',
          onPress: async () => {
            setCancelBusy(true);
            try {
              const res = await cancelCollaboration(token, collabId);
              if (res.success !== false) {
                setCollabStatus('NONE');
                setCollabId(null);
                setPopupType('success');
                setPopupTitle('Request Cancelled');
                setPopupMessage('Your collaboration request has been cancelled.');
                setPopupVisible(true);
              } else {
                setPopupType('error');
                setPopupMessage((res as any).error || 'Could not cancel the request.');
                setPopupVisible(true);
              }
            } catch {
              setPopupType('error');
              setPopupMessage('Could not cancel the request.');
              setPopupVisible(true);
            } finally {
              setCancelBusy(false);
            }
          },
        },
      ],
    );
  };

  const handleUpdateStatus = async (status: 'OPEN' | 'COMPLETED' | 'CLOSED') => {
    if (!token || !postId || statusBusy) return;
    setStatusBusy(true);
    try {
      const res = await updatePostStatus(token, postId, status);
      if (res.success) {
        setPost((prev: any) => (prev ? { ...prev, status } : prev));
        setPopupType('success');
        setPopupTitle('Updated!');
        setPopupMessage(
          status === 'COMPLETED' ? 'Post marked as completed.' : status === 'CLOSED' ? 'Post closed.' : 'Post reopened.',
        );
      } else {
        setPopupType('error');
        setPopupMessage((res as any).error || 'Could not update post status.');
      }
      setPopupVisible(true);
    } finally {
      setStatusBusy(false);
    }
  };

  const handleMessage = async () => {
    if (!requireProfile('message this user')) return;
    if (!token || !owner.id) return;
    const res = await openConversationWith(token, owner.id);
    if (res.success && res.data?.id) {
      router.push({ pathname: '/chat/[id]', params: { id: res.data.id } } as any);
    } else {
      setPopupType('error');
      setPopupMessage((res as any).error || 'Could not open conversation.');
      setPopupVisible(true);
    }
  };

  const handleCall = async () => {
    if (!requireProfile('call this user')) return;
    if (!token || !owner.id) return;
    if (call.callMode !== 'idle') { call.resume(); return; }
    try {
      const res = await initiateCall(token, owner.id);
      if (res.success && res.data) {
        router.push({
          pathname: '/call',
          params: {
            mode: 'outgoing',
            callId: res.data.callId,
            channelName: res.data.channelName,
            agoraToken: res.data.token,
            appId: res.data.appId,
            remoteName: name,
            remoteImage: pic || '',
          },
        } as any);
      } else {
        setPopupType('error');
        setPopupMessage((res as any).error || 'Could not start call.');
        setPopupVisible(true);
      }
    } catch (err: any) {
      setPopupType('error');
      setPopupMessage(err?.message || 'Network error.');
      setPopupVisible(true);
    }
  };

  const handleSave = async () => {
    if (!requireProfile('save this post')) return;
    if (!token || !postId) return;
    setIsSaved(prev => !prev); // optimistic
    const res = await toggleSavePost(postId, token, isSaved);
    if (!res.success) setIsSaved(prev => !prev); // revert
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: `Check out this post on DigiTag!\nhttps://thedigitag.ai/post/${postId}` });
    } catch { }
  };

  // Same pattern as the Home screen's "See Portfolio" — fetches the owner's
  // full profile to read their portfolio link, since the post/feed payload
  // doesn't include it.
  const handleSeePortfolio = async () => {
    // Uses the public profile endpoint — viewing a portfolio link is browsing,
    // same as the rest of the profile, so it works for guests too.
    setSelectedPortfolioLink(null);
    setSelectedSocialLinks(null);
    setPortfolioLoading(true);
    setPortfolioModalVisible(true);
    try {
      if (!owner.id) { setPortfolioLoading(false); return; }
      const res = await getUserById(owner.id, token);
      if (!res.success) return;
      // Creators don't have a real portfolio (no portfolio-image upload, no
      // portfolio URL field in creator signup) — show their social accounts
      // instead of an always-empty portfolio-link modal.
      if (owner.role === 'CREATOR') { setSelectedSocialLinks(buildCreatorSocialLinks(res.data)); return; }
      const profileData = res.data?.creatorProfile || res.data?.freelancerProfile;
      const link = profileData?.portfolioUrl || profileData?.portfolio || profileData?.portfolioLink || null;
      setSelectedPortfolioLink(link);
    } catch {
      setSelectedPortfolioLink(null);
    } finally {
      setPortfolioLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Post not found.</Text>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as any))} style={styles.backBtn2}>
          <Text style={{ color: '#F15DAB' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOwn = owner.id === myId;
  const postStatus: 'OPEN' | 'COMPLETED' | 'CLOSED' = post.status || 'OPEN';
  const postImages: string[] = Array.isArray(post.imageUrls) && post.imageUrls.length
    ? post.imageUrls
    : (post.imageUrl ? [post.imageUrl] : []);
  // My own collaboration on this post is done — show a completed badge, not
  // an active Collaborate button, since sending another request here would
  // just re-open a fresh collab with someone I already finished working with.
  const myCollabCompleted = collabStatus === 'COMPLETED';
  // Owner marked the whole post as filled — blocks everyone, not just me.
  const positionFilled = !myCollabCompleted && postStatus === 'COMPLETED';
  // Collaboration only makes sense across roles (Creator ↔ Freelancer) — the
  // backend already 403s a same-role request. An already-accepted collab is
  // always shown since it could only have been created as a valid pair.
  const canCollaborate = !!userRole && !!owner.role && userRole !== owner.role;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      {/* <LinearGradient
        colors={[accent + 'B3', accent + '40', 'transparent']}
        style={styles.headerGlow}
        pointerEvents="none"
      /> */}
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>

        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as any))} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Post View</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={handleSave} style={[styles.iconBtn, { backgroundColor: 'transparent' }]}>
              <Image source={require('../assets/Save.png')} style={{ width: 34, height: 34 }} resizeMode="contain" />
              {/* Filled bookmark layered on top so the "saved" state reads as a
                  solid filled icon, not just a recolored outline — same
                  treatment as the Home/Explore post cards. */}
              {isSaved && (
                <Image
                  source={require('../assets/SaveFilled.png')}
                  style={{ width: 34, height: 34, position: 'absolute', tintColor: accent }}
                  resizeMode="contain"
                />
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} style={[styles.iconBtn, { backgroundColor: 'transparent' }]}>
              <Image source={require('../assets/share.png')} style={{ width: 34, height: 34 }} resizeMode="contain" />
            </TouchableOpacity>
            {!isOwn && (
              <TouchableOpacity
                onPress={() => {
                  if (isReported) return;
                  if (!requireProfile('report this post')) return;
                  setShowReportModal(true);
                }}
                disabled={isReported}
                style={[styles.iconBtn, { backgroundColor: 'transparent' }]}
              >
                <Image
                  source={require('../assets/report-post-view.png')}
                  style={{ width: 34, height: 34, tintColor: isReported ? accent : undefined }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ED2A91" />}
        >

          {/* Main profile card */}
          <View style={[styles.card, { borderColor: ownerTheme.border }]}>
            {/* Top ambient glow, colored by the post owner's role (not the
                viewer's) — SVG-based so it renders on both iOS and Android
                (unlike RN's shadow-blur props). */}
            <GlowCircle
              size={400}
              color={ownerTheme.primary}
              opacity={0.55}
              style={{ position: 'absolute', top: -230, alignSelf: 'center' }}
            />

            <View style={styles.cardTopRow}>
              <Image source={pic ? { uri: pic } : require('../assets/images/icon.png')} style={[styles.avatar, { borderColor: ownerTheme.primary }]} resizeMode="cover" />
              <View style={styles.identityCol}>
                <View style={styles.nameRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
                    <Text style={styles.ownerName} numberOfLines={1}>{name}</Text>
                    <VerifiedBadge isPremium={owner.isPremium} size={16} />
                  </View>
                  {/* <TouchableOpacity style={[styles.viewProfileBtn, { borderColor: ownerTheme.primary }]} activeOpacity={0.8} onPress={goToProfile}>
                    <Text style={[styles.viewProfileText, { color: ownerTheme.primary }]}>View Profile</Text>
                  </TouchableOpacity> */}
                </View>

                {/* Owner's profession/category — plain text, not a pill. */}
                {!!post.category && (
                  <Text style={styles.categoryText} numberOfLines={1}>{post.category}</Text>
                )}

                {/* Experience badge — same gradient-border/gradient-star
                    treatment as the Home screen's post card. */}
                {!!owner.experience && (
                  <LinearGradient
                    colors={expertGradientColors as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.expertBadgeBorder}
                  >
                    <View style={[styles.expertBadge, { backgroundColor: expertBg }]}>
                      <MaskedView
                        style={{ width: 12, height: 12, marginBottom: 3 }}
                        maskElement={<Ionicons name="star" size={12} color="#000" />}
                      >
                        <LinearGradient
                          colors={expertGradientColors as any}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{ width: 12, height: 12 }}
                        />
                      </MaskedView>
                      <Text style={[styles.expertBadgeText, { color: '#fff' }]} numberOfLines={1}>{owner.experience}</Text>
                    </View>
                  </LinearGradient>
                )}
              </View>
            </View>

            <View style={styles.profileActionsRow}>
              <TouchableOpacity style={[styles.viewProfileBtn, { borderColor: ownerTheme.primary }]} activeOpacity={0.8} onPress={handleSeePortfolio}>
                <Ionicons name="briefcase-outline" size={14} color={ownerTheme.primary} />
                <Text style={[styles.viewProfileText, { color: ownerTheme.primary }]}>Portfolio</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.viewProfileBtn, { borderColor: ownerTheme.primary }]} activeOpacity={0.8} onPress={goToProfile}>
                <Text style={[styles.viewProfileText, { color: ownerTheme.primary }]}>View Profile</Text>
              </TouchableOpacity>
            </View>


            <View style={styles.metaRow}>
              <View style={styles.metaPill}>
                {post.location ? (
                  <>
                    <Ionicons name="location-outline" size={15} color="#8A8A99" />
                    <Text style={styles.metaTextLight} numberOfLines={1}>{post.location}</Text>

                  </>
                ) : null}

              </View>
              <View style={styles.metaPill}>
                <Ionicons name="time-outline" size={14} color="#8A8A99" />
                <Text style={styles.metaText}>{timeAgo(post.createdAt)}</Text>
              </View>
            </View>

            {/* Post image(s) — up to 3 for portfolio-category posts, swipeable */}
            {postImages.length > 0 && (
              <PortfolioImageCarousel images={postImages} style={styles.bannerWrapInCard} />
            )}

            {post.description ? (
              <View style={styles.aboutSection}>
                <Text style={styles.aboutHeading}>Looking for</Text>
                <View style={[styles.aboutHeadingUnderline, { backgroundColor: ownerTheme.primary }]} />
                <Text style={styles.descText}>{post.description}</Text>
              </View>
            ) : null}

            <View style={styles.dashedDivider} />

            <View style={styles.badgeRow}>
              {/* Real budget from the post — no budget entered means no pill,
                  never an invented number. */}
              {isPaid && post.budget ? (
                <View style={[styles.statPill, { backgroundColor: 'rgba(200,255,10,0.06)', borderColor: 'rgba(143,224,0,0.25)' }]}>
                  <View style={[styles.statIconWrap, { backgroundColor: 'rgba(143,224,0,0.18)' }]}>
                    <Ionicons name="wallet" size={14} color="#8fe000" />
                  </View>
                  <View style={{ flexShrink: 1 }}>
                    <Text style={styles.statLabel}>Budget</Text>
                    <Text style={[styles.statValue, { color: '#fff' }]} numberOfLines={1}>
                      ₹ {formatBudgetK(String(post.budget).replace(/^₹\s*/, ''))}
                    </Text>
                  </View>
                </View>
              ) : null}
              <View style={[styles.statPill, { backgroundColor: isPaid ? 'rgba(200,255,10,0.06)' : 'rgba(167,139,250,0.15)', borderColor: isPaid ? 'rgba(143,224,0,0.25)' : '#a78bfa' }]}>
                <View style={[styles.statIconWrap, { backgroundColor: isPaid ? 'rgba(143,224,0,0.18)' : 'rgba(167,139,250,0.25)' }]}>
                  <Ionicons name={isPaid ? 'cash' : 'gift-outline'} size={14} color={isPaid ? '#8fe000' : '#a78bfa'} />
                </View>
                <View style={{ flexShrink: 1 }}>
                  <Text style={[styles.statLabel, !isPaid && { color: '#a78bfa' }]}>Collab Type</Text>
                  <Text style={[styles.statValue, { color: isPaid ? '#fff' : '#fff' }]} numberOfLines={1}>
                    {isPaid ? 'Paid Collaboration' : 'Free Collaboration'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Owner-only control over this post's lifecycle: Completed keeps it
              visible but blocks new collab requests from anyone; Closed hides
              it from feeds entirely until reopened. */}
          {isOwn && (
            <View style={styles.actionsWrap}>
              {postStatus === 'OPEN' ? (
                <View style={styles.primaryActionsRow}>
                  <TouchableOpacity
                    style={[styles.outlineBtn, { borderColor: accent, flex: 1 }, statusBusy && { opacity: 0.6 }]}
                    onPress={() => handleUpdateStatus('CLOSED')}
                    disabled={statusBusy}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close-circle-outline" size={18} color={accent} />
                    <Text style={[styles.outlineBtnText, { color: accent }]}>Close Post</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filledBtn, { backgroundColor: accent, flex: 1 }, statusBusy && { opacity: 0.6 }]}
                    onPress={() => handleUpdateStatus('COMPLETED')}
                    disabled={statusBusy}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                    <Text style={styles.filledBtnText}>Mark Completed</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.filledBtn, { backgroundColor: accent }, statusBusy && { opacity: 0.6 }]}
                  onPress={() => handleUpdateStatus('OPEN')}
                  disabled={statusBusy}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh-outline" size={18} color="#fff" />
                  <Text style={styles.filledBtnText}>
                    {postStatus === 'COMPLETED' ? 'Reopen (marked Completed)' : 'Reopen (Closed)'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Action buttons — only for other users' posts, and only when
              collaboration is actually possible between these two roles */}
          {!isOwn && (contactUnlocked || canCollaborate) && (
            <View style={styles.actionsWrap}>
              {contactUnlocked ? (
                <View style={styles.secondaryActions}>
                  <TouchableOpacity style={[styles.outlineBtn, { borderColor: accent, flex: 1 }]} onPress={handleMessage} activeOpacity={0.8}>
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color={accent} />
                    <Text style={[styles.outlineBtnText, { color: accent }]}>Message</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.filledBtn, { backgroundColor: accent, flex: 1 }]} onPress={handleCall} activeOpacity={0.8}>
                    <Ionicons name="call-outline" size={18} color="#fff" />
                    <Text style={styles.filledBtnText}>Call</Text>
                  </TouchableOpacity>
                </View>
              ) : collabStatus === 'PENDING' ? (
                <TouchableOpacity
                  style={[styles.collabBtnGradient, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#f59e0b' }, cancelBusy && { opacity: 0.6 }]}
                  onPress={handleCancelCollab}
                  disabled={!collabId || cancelBusy}
                  activeOpacity={0.8}
                >
                  <View style={[styles.collabBtnIconWrap, { backgroundColor: 'rgba(245,158,11,0.15)' }]}>
                    <Ionicons name={collabId ? 'close-circle-outline' : 'time-outline'} size={20} color="#f59e0b" />
                  </View>
                  <Text style={[styles.collabBtnTitle, { color: '#f59e0b' }]}>
                    {collabId ? 'Request Pending · Tap to Cancel' : 'Request Pending'}
                  </Text>
                </TouchableOpacity>
              ) : myCollabCompleted || positionFilled ? (
                <View style={[styles.collabBtnGradient, { backgroundColor: '#246307' }]}>
                  <View style={[styles.collabBtnIconWrap, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  </View>
                  <Text style={styles.collabBtnTitle}>{myCollabCompleted ? 'Collaborated' : 'Position Filled'}</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={collabBusy && { opacity: 0.6 }}
                  onPress={handleCollab}
                  disabled={collabBusy}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#F26930', '#ED2A91']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.collabBtnGradient}
                  >
                    <View style={styles.collabBtnIconWrap}>
                      <Image
                        source={require('../assets/collaborate.png')}
                        style={{ width: 20, height: 20, tintColor: '#fff' }}
                        resizeMode="contain"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.collabBtnTitle}>{collabBusy ? 'Sending…' : 'Collaborate Now'}</Text>
                      {!collabBusy && <Text style={styles.collabBtnSubtitle}>Start a conversation</Text>}
                    </View>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              )}

              <LinearGradient
                colors={['rgba(1, 255, 35, 0.5)', 'transparent', 'rgba(1, 255, 35, 0.5)']}
                locations={[0, 0.5, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.safeCollabBorder}
              >
                <View style={styles.safeCollabRow}>
                  <View style={styles.safeCollabIconWrap}>
                    <Ionicons name="shield-checkmark" size={18} color="#94d744" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.safeCollabTitle}>Safe Collaboration</Text>
                    <Text style={styles.safeCollabSubtitle}>Your data and payments are 100% secure</Text>
                  </View>
                  {/* <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" /> */}
                </View>
              </LinearGradient>
            </View>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>

        {/* ── Custom Success/Error Popup ── */}
        <Modal
          visible={popupVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPopupVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalIconCircle}>
                {popupType === 'success' ? (
                  <>
                    <Image
                      source={require('../assets/spark.gif')}
                      style={[StyleSheet.absoluteFill, { width: 80, height: 80, opacity: 0.6 }]}
                    />
                    <Image
                      source={require('../assets/images/success.gif')}
                      style={{ width: 60, height: 60 }}
                    />
                  </>
                ) : (
                  <Ionicons name="alert-circle" size={44} color="#FF4D4D" />
                )}
              </View>

              <Text style={styles.modalTitle}>
                {popupType === 'success' ? popupTitle : 'Error'}
              </Text>

              <Text style={styles.modalMessage}>{popupMessage}</Text>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setPopupVisible(false)}
              >
                <LinearGradient
                  colors={popupType === 'success' ? [theme.primary, theme.primary + 'CC'] : ['#FF4D4D', '#FF8080']}
                  style={styles.modalButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.modalButtonText}>OK</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ── Portfolio Modal (same pattern as Home screen's "See Portfolio") ── */}
        <Modal
          visible={portfolioModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setPortfolioModalVisible(false)}
        >
          <View style={styles.portfolioModalOverlay}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setPortfolioModalVisible(false)} />
            <View style={styles.portfolioModalContent}>
              <View style={styles.portfolioModalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Feather name="link" size={20} color="#fff" />
                  <Text style={styles.portfolioModalTitle}>{selectedSocialLinks ? 'Social Links' : 'Portfolio Links'}</Text>
                </View>
                <TouchableOpacity style={styles.portfolioModalCloseBtn} onPress={() => setPortfolioModalVisible(false)}>
                  <Feather name="x" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
              {portfolioLoading ? (
                <ActivityIndicator color={accent} style={{ marginTop: 16 }} />
              ) : selectedSocialLinks ? (
                selectedSocialLinks.length > 0 ? (
                  selectedSocialLinks.map((link) => (
                    <TouchableOpacity
                      key={link.key}
                      style={styles.portfolioLinkContainer}
                      onPress={() => Linking.openURL(link.url)}
                    >
                      <Ionicons name={link.icon as any} size={20} color={link.color} />
                      <Text style={[styles.portfolioLinkText, { marginLeft: 10 }]} numberOfLines={1}>{link.url}</Text>
                      <Feather name="arrow-up-right" size={20} color={accent} />
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.noPortfolioText}>No social links provided.</Text>
                )
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
                  <Feather name="arrow-up-right" size={20} color={accent} />
                </TouchableOpacity>
              ) : (
                <Text style={styles.noPortfolioText}>No portfolio link provided.</Text>
              )}
            </View>
          </View>
        </Modal>

        {postId && (
          <ReportModal
            visible={showReportModal}
            type="POST"
            targetId={postId}
            targetName={`${name}'s post`}
            onClose={() => setShowReportModal(false)}
            onSubmitted={() => setIsReported(true)}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0A' },
  center: { flex: 1, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#fff', fontSize: 16, marginBottom: 16 },
  backBtn2: { paddingVertical: 10, paddingHorizontal: 20 },

  headerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 25,
    paddingBottom: 15
  },
  topTitle: {
    color: '#fff',
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.3,
    marginLeft: -48
    
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: { paddingBottom: 20 },

  bannerWrapInCard: {
    width: '100%',
    height: 190,
    borderRadius: 16,
    marginTop: 16,
    marginBottom: 4,
  },

  card: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    position: 'relative',
    overflow: 'hidden',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    marginBottom: 15,
  },
  identityCol: { flex: 1, marginLeft: 14 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  ownerName: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  categoryText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    marginTop: 3,
  },
  expertBadgeBorder: {
    borderRadius: 99,
    padding: 1,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  expertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  expertBadgeText: {
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
  },

  profileActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  viewProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  viewProfileText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metaDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 2,
  },
  metaText: {
    color: '#8A8A99',
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    flexShrink: 1,
  },
  metaTextLight: {
    color: '#E0E0E0',
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    flexShrink: 1,
  },

  aboutSection: { marginTop: 18 },
  aboutHeading: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
  aboutHeadingUnderline: {
    width: 26,
    height: 3,
    borderRadius: 2,
    marginTop: 6,
    marginBottom: 10,
  },
  descText: {
    color: '#B0B0BB',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 21,
  },

  dashedDivider: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.15)',
    marginTop: 18,
    marginBottom: 16,
  },

  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statPill: {
    flex: 1,
    minWidth: 140,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    color: '#8fe000',
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
  },
  statValue: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',

  },

  actionsWrap: {
    paddingHorizontal: 16,
    gap: 12,
  },
  primaryActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 26,
    borderWidth: 1.5,
  },
  outlineBtnText: {
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
    letterSpacing: -0.3,
  },
  filledBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 26,
  },
  filledBtnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
    letterSpacing: -0.3,
  },
  collabBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  collabBtnIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collabBtnTitle: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  collabBtnSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',

  },
  safeCollabBorder: {
    borderRadius: 99,
    padding: 1,
  },
  safeCollabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 98,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#0A0A0A',
  },
  safeCollabIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 99,
    backgroundColor: '#1d260f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeCollabTitle: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
  },
  safeCollabSubtitle: {
    color: '#9298a3',
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },

  // Success/Error modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#1C1C24',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 30,
    alignItems: 'center',
  },
  modalIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#272730',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalMessage: {
    color: '#A0A0AB',
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  modalButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  modalButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },

  // Portfolio modal styles (mirrors the Home screen's portfolio modal)
  portfolioModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  portfolioModalContent: {
    minHeight: 180,
    backgroundColor: '#1E1E24',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    borderTopWidth: 1,
    borderColor: 'rgba(156,156,156,0.3)',
  },
  portfolioModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  portfolioModalTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
  },
  portfolioModalCloseBtn: {
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
