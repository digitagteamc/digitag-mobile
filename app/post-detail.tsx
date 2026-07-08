import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useProfileGate } from '../context/ProfileGateContext';
import { useRoleTheme } from '../theme/useRoleTheme';
import {
  getCollaborationWith,
  getPostById,
  getReportStatus,
  getSavedPostIds,
  getUserById,
  initiateCall,
  openConversationWith,
  sendCollaboration,
  toggleSavePost,
} from '../services/userService';
import ReportModal from '../Components/ui/ReportModal';

const { width: SW } = Dimensions.get('window');


function timeAgo(dateStr?: string) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function PostDetail() {
  const router = useRouter();
  const { token, userId: myId } = useAuth();
  const { requireProfile } = useProfileGate();
  const theme = useRoleTheme();
  const { postId } = useLocalSearchParams<{ postId: string }>();

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [collabStatus, setCollabStatus] = useState<'NONE' | 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED'>('NONE');
  const [collabBusy, setCollabBusy] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isReported, setIsReported] = useState(false);

  // Popup state
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupType, setPopupType] = useState<'success' | 'error'>('success');
  const [popupMessage, setPopupMessage] = useState('');

  // Portfolio modal state (same pattern as the Home screen's "See Portfolio")
  const [portfolioModalVisible, setPortfolioModalVisible] = useState(false);
  const [selectedPortfolioLink, setSelectedPortfolioLink] = useState<string | null>(null);
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
          ownerId ? getCollaborationWith(token, ownerId) : Promise.resolve({ success: false }),
          getSavedPostIds(token),
          getReportStatus(token, 'POST', postId),
        ]);
        if (collabRes.success) setCollabStatus(((collabRes as any).data?.status ?? 'NONE') as any);
        if (savedRes.success && Array.isArray(savedRes.data)) setIsSaved(savedRes.data.includes(postId));
        if (reportRes.success) setIsReported(Boolean((reportRes as any).data?.reported));
      }
    }
    setLoading(false);
  }, [token, postId, requireProfile]);

  useEffect(() => { load(); }, [load]);

  const owner = post?.owner || {};
  const accent = theme.primary;
  const isOwnerFreelancer = owner.role === 'FREELANCER';
  const name = owner.name || (isOwnerFreelancer ? 'Freelancer' : 'Creator');
  const pic = owner.profilePicture || null;
  const roleLabel = owner.role ? owner.role.charAt(0) + owner.role.slice(1).toLowerCase() : '';
  const isPaid = post?.collaborationType === 'PAID';

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
        setPopupType('success');
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
    } catch {}
  };

  // Same pattern as the Home screen's "See Portfolio" — fetches the owner's
  // full profile to read their portfolio link, since the post/feed payload
  // doesn't include it.
  const handleSeePortfolio = async () => {
    // Uses the public profile endpoint — viewing a portfolio link is browsing,
    // same as the rest of the profile, so it works for guests too.
    setSelectedPortfolioLink(null);
    setPortfolioLoading(true);
    setPortfolioModalVisible(true);
    try {
      if (!owner.id) { setPortfolioLoading(false); return; }
      const res = await getUserById(owner.id, token);
      const profileData = res.success ? (res.data?.creatorProfile || res.data?.freelancerProfile) : null;
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn2}>
          <Text style={{ color: '#F15DAB' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOwn = owner.id === myId;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[accent + 'B3', accent + '40', 'transparent']}
        style={styles.headerGlow}
        pointerEvents="none"
      />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>

        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Post View</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={handleSave} style={styles.iconBtn}>
              <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={19} color={isSaved ? accent : '#fff'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} style={styles.iconBtn}>
              <Feather name="share-2" size={18} color="#fff" />
            </TouchableOpacity>
            {!isOwn && (
              <TouchableOpacity
                onPress={() => {
                  if (isReported) return;
                  if (!requireProfile('report this post')) return;
                  setShowReportModal(true);
                }}
                disabled={isReported}
                style={styles.iconBtn}
              >
                <Feather name="flag" size={18} color={isReported ? accent : '#fff'} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Post image, if present */}
          {post.imageUrl ? (
            <View style={styles.bannerWrap}>
              <Image source={{ uri: post.imageUrl }} style={styles.bannerImg} resizeMode="cover" />
            </View>
          ) : null}

          {/* Main profile card */}
          <View style={styles.card}>
            <View style={styles.cardTopRow}>
              <Image source={pic ? { uri: pic } : require('../assets/images/icon.png')} style={styles.avatar} resizeMode="cover" />
              <View style={styles.identityCol}>
                <Text style={styles.ownerName} numberOfLines={1}>{name}</Text>
                <View style={styles.roleRow}>
                  {!!roleLabel && <Text style={styles.ownerRole}>{roleLabel}</Text>}
                  {post.category ? (
                    <View style={[styles.pillOutline, { borderColor: accent }]}>
                      <Ionicons name="star" size={11} color={accent} />
                      <Text style={[styles.pillOutlineText, { color: accent }]} numberOfLines={1}>{post.category}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            <TouchableOpacity style={[styles.viewProfileBtn, { borderColor: accent }]} activeOpacity={0.8} onPress={goToProfile}>
              <Text style={[styles.viewProfileText, { color: accent }]}>View Profile</Text>
            </TouchableOpacity>

            <View style={styles.metaRow}>
              {post.location ? (
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={15} color="#8A8A99" />
                  <Text style={styles.metaTextLight} numberOfLines={1}>{post.location}</Text>
                </View>
              ) : null}
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color="#8A8A99" />
                <Text style={styles.metaText}>{timeAgo(post.createdAt)}</Text>
              </View>
            </View>

            {post.description ? (
              <View style={styles.aboutSection}>
                <Text style={styles.aboutHeading}>About</Text>
                <Text style={styles.descText}>{post.description}</Text>
              </View>
            ) : null}

            <View style={styles.dashedDivider} />

            <View style={styles.badgeRow}>
              {isPaid && (
                <View style={[styles.pillSolid, { backgroundColor: 'rgba(34,197,94,0.15)', borderColor: '#22c55e' }]}>
                  <Ionicons name="cash-outline" size={13} color="#22c55e" />
                  <Text style={[styles.pillSolidText, { color: '#22c55e' }]}>₹ 10K-15K/Month</Text>
                </View>
              )}
              <View style={[styles.pillSolid, { backgroundColor: isPaid ? 'rgba(34,197,94,0.15)' : 'rgba(167,139,250,0.15)', borderColor: isPaid ? '#22c55e' : '#a78bfa' }]}>
                <Ionicons name={isPaid ? 'videocam-outline' : 'gift-outline'} size={13} color={isPaid ? '#22c55e' : '#a78bfa'} />
                <Text style={[styles.pillSolidText, { color: isPaid ? '#22c55e' : '#a78bfa' }]}>
                  {isPaid ? 'Paid Collab' : 'Free Collab'}
                </Text>
              </View>
            </View>
          </View>

          {/* Action buttons — only for other users' posts */}
          {!isOwn && (
            <View style={styles.actionsWrap}>
              {collabStatus === 'ACCEPTED' ? (
                <>
                  <TouchableOpacity style={[styles.outlineBtn, { borderColor: accent }]} onPress={handleSeePortfolio} activeOpacity={0.8}>
                    <Ionicons name="briefcase-outline" size={18} color={accent} />
                    <Text style={[styles.outlineBtnText, { color: accent }]}>Portfolio</Text>
                  </TouchableOpacity>
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
                </>
              ) : (
                <View style={styles.primaryActionsRow}>
                  <TouchableOpacity style={[styles.outlineBtn, { borderColor: accent, flex: 0.85 }]} onPress={handleSeePortfolio} activeOpacity={0.8}>
                    <Ionicons name="briefcase-outline" size={18} color={accent} />
                    <Text style={[styles.outlineBtnText, { color: accent }]}>Portfolio</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filledBtn,
                      { flex: 1.25, backgroundColor: collabStatus === 'PENDING' ? 'transparent' : accent },
                      collabStatus === 'PENDING' && { borderWidth: 1.5, borderColor: '#f59e0b' },
                      collabBusy && { opacity: 0.6 },
                    ]}
                    onPress={handleCollab}
                    disabled={collabBusy || collabStatus === 'PENDING'}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={collabStatus === 'PENDING' ? 'time-outline' : 'people-outline'}
                      size={18}
                      color={collabStatus === 'PENDING' ? '#f59e0b' : '#fff'}
                    />
                    <Text style={[styles.filledBtnText, collabStatus === 'PENDING' && { color: '#f59e0b' }]}>
                      {collabBusy ? 'Sending…' : collabStatus === 'PENDING' ? 'Request Pending' : 'Collaborate'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
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
                {popupType === 'success' ? 'Collab Sent!' : 'Error'}
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
                  <Text style={styles.portfolioModalTitle}>Portfolio Links</Text>
                </View>
                <TouchableOpacity style={styles.portfolioModalCloseBtn} onPress={() => setPortfolioModalVisible(false)}>
                  <Feather name="x" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
              {portfolioLoading ? (
                <ActivityIndicator color={accent} style={{ marginTop: 16 }} />
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
    paddingVertical: 10,
  },
  topTitle: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.3,
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

  bannerWrap: {
    width: SW,
    height: 200,
    marginBottom: 16,
  },
  bannerImg: { width: '100%', height: '100%' },

  card: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
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
  },
  identityCol: { flex: 1, marginLeft: 14 },
  ownerName: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: -0.3,
  },
  ownerRole: {
    color: '#9A9AA5',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    marginTop: 4,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  pillOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  pillOutlineText: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
  },

  viewProfileBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 14,
  },
  viewProfileText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
  },

  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 1,
  },
  metaText: {
    color: '#8A8A99',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    flexShrink: 1,
  },
  metaTextLight: {
    color: '#E0E0E0',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    flexShrink: 1,
  },

  aboutSection: { marginTop: 18 },
  aboutHeading: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 6,
  },
  descText: {
    color: '#B0B0BB',
    fontSize: 14,
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
  pillSolid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillSolidText: { fontSize: 12, fontFamily: 'Poppins_500Medium' },

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
