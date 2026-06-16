import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
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
  getSavedPostIds,
  initiateCall,
  openConversationWith,
  sendCollaboration,
  toggleSavePost,
} from '../services/userService';

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

  const load = useCallback(async () => {
    if (!token || !postId) { setLoading(false); return; }
    const res = await getPostById(postId, token);
    if (res.success && res.data) {
      setPost(res.data);
      const ownerId = res.data.owner?.id || res.data.userId;
      const [collabRes, savedRes] = await Promise.all([
        ownerId ? getCollaborationWith(token, ownerId) : Promise.resolve({ success: false }),
        getSavedPostIds(token),
      ]);
      if (collabRes.success) setCollabStatus((collabRes.data?.status ?? 'NONE') as any);
      if (savedRes.success && Array.isArray(savedRes.data)) setIsSaved(savedRes.data.includes(postId));
    }
    setLoading(false);
  }, [token, postId]);

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
    if (!token || !owner.id || collabBusy) return;
    if (!requireProfile('send a collab request')) return;
    setCollabBusy(true);
    try {
      const res = await sendCollaboration(token, { receiverId: owner.id, postId, message: 'I would love to collaborate with you!' });
      if (res.success !== false) {
        setCollabStatus('PENDING');
        Alert.alert('Collab Sent!', 'Your collaboration request has been sent.');
      } else {
        Alert.alert('Error', (res as any).error || 'Could not send collab request.');
      }
    } catch {
      Alert.alert('Error', 'Could not send collab request.');
    } finally {
      setCollabBusy(false);
    }
  };

  const handleMessage = async () => {
    if (!token || !owner.id) return;
    if (!requireProfile('message this user')) return;
    const res = await openConversationWith(token, owner.id);
    if (res.success && res.data?.id) {
      router.push({ pathname: '/chat/[id]', params: { id: res.data.id } } as any);
    } else {
      Alert.alert('Chat Error', (res as any).error || 'Could not open conversation.');
    }
  };

  const handleCall = async () => {
    if (!token || !owner.id) return;
    if (!requireProfile('call this user')) return;
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
        Alert.alert('Call Failed', (res as any).error || 'Could not start call.');
      }
    } catch (err: any) {
      Alert.alert('Call Failed', err?.message || 'Network error.');
    }
  };

  const handleSave = async () => {
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
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>

        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Post</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={handleSave} style={styles.iconBtn}>
              <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={20} color={isSaved ? accent : '#fff'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} style={styles.iconBtn}>
              <Feather name="share-2" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Banner */}
          {post.imageUrl ? (
            <View style={styles.bannerWrap}>
              <Image source={{ uri: post.imageUrl }} style={styles.bannerImg} resizeMode="cover" />
              <LinearGradient
                colors={['transparent', 'rgba(10,10,10,0.85)']}
                style={StyleSheet.absoluteFillObject}
              />
            </View>
          ) : (
            <LinearGradient
              colors={[theme.soft, 'rgba(10,10,10,0)']}
              style={styles.bannerGradient}
            />
          )}

          {/* Owner row */}
          <TouchableOpacity style={styles.ownerRow} activeOpacity={0.8} onPress={goToProfile}>
            <Image source={pic ? { uri: pic } : require('../assets/images/icon.png')} style={styles.avatar} resizeMode="cover" />
            <View style={styles.ownerInfo}>
              <Text style={styles.ownerName} numberOfLines={1}>{name}</Text>
              <Text style={[styles.ownerRole, { color: accent }]}>{roleLabel}</Text>
            </View>
            <View style={[styles.viewProfileBtn, { borderColor: accent }]}>
              <Text style={[styles.viewProfileText, { color: accent }]}>View Profile</Text>
            </View>
          </TouchableOpacity>

          {/* Badges row */}
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: isPaid ? 'rgba(34,197,94,0.12)' : 'rgba(167,139,250,0.12)', borderColor: isPaid ? '#22c55e' : '#a78bfa' }]}>
              <Ionicons name={isPaid ? 'cash-outline' : 'gift-outline'} size={12} color={isPaid ? '#22c55e' : '#a78bfa'} />
              <Text style={[styles.badgeText, { color: isPaid ? '#22c55e' : '#a78bfa' }]}>
                {isPaid ? 'Paid Collab' : 'Free Collab'}
              </Text>
            </View>
            {post.category ? (
              <View style={[styles.badge, { backgroundColor: accent + '18', borderColor: accent + '55' }]}>
                <Text style={[styles.badgeText, { color: accent }]}>{post.category}</Text>
              </View>
            ) : null}
          </View>

          {/* Description */}
          <View style={styles.descCard}>
            <Text style={styles.descText}>{post.description}</Text>
          </View>

          {/* Meta info */}
          <View style={styles.metaRow}>
            {post.location ? (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={14} color="#8A8A99" />
                <Text style={styles.metaText} numberOfLines={1}>{post.location}</Text>
              </View>
            ) : null}
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color="#8A8A99" />
              <Text style={styles.metaText}>{timeAgo(post.createdAt)}</Text>
            </View>
          </View>

          {/* Action buttons — only for other users' posts */}
          {!isOwn && (
            <View style={styles.actionsWrap}>
              {collabStatus === 'ACCEPTED' ? (
                /* Collaboration accepted — show Message + Call */
                <View style={styles.secondaryActions}>
                  <TouchableOpacity style={[styles.secondaryBtn, { borderColor: accent }]} onPress={handleMessage}>
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color={accent} />
                    <Text style={[styles.secondaryBtnText, { color: accent }]}>Message</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.secondaryBtn, { borderColor: accent }]} onPress={handleCall}>
                    <Ionicons name="call-outline" size={18} color={accent} />
                    <Text style={[styles.secondaryBtnText, { color: accent }]}>Call</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* Not yet collaborated — show Collaborate button */
                <TouchableOpacity
                  style={[
                    styles.collabBtn,
                    { backgroundColor: collabStatus === 'PENDING' ? 'transparent' : accent },
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
                  <Text style={[styles.collabBtnText, collabStatus === 'PENDING' && { color: '#f59e0b' }]}>
                    {collabBusy ? 'Sending…' : collabStatus === 'PENDING' ? 'Request Pending' : 'Collaborate'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0A' },
  center: { flex: 1, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#fff', fontSize: 16, marginBottom: 16 },
  backBtn2: { paddingVertical: 10, paddingHorizontal: 20 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  topTitle: {
    color: '#fff',
    fontSize: 17,
    fontFamily: 'Poppins_500Medium',
    letterSpacing: -0.3,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: { paddingBottom: 20 },

  bannerWrap: {
    width: SW,
    height: 240,
    marginBottom: -40,
  },
  bannerImg: { width: '100%', height: '100%' },
  bannerGradient: { height: 140, width: SW, marginBottom: -20 },

  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2A2A2A',
  },
  avatarInitials: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
  },
  initialsText: { fontSize: 18, fontWeight: '700' },
  ownerInfo: { flex: 1, marginLeft: 12 },
  ownerName: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
    letterSpacing: -0.3,
  },
  ownerRole: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 1,
  },
  viewProfileBtn: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewProfileText: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
  },

  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: { fontSize: 12, fontFamily: 'Poppins_400Regular' },

  descCard: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  descText: {
    color: '#E0E0E0',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 22,
  },

  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingHorizontal: 16,
    marginBottom: 24,
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

  actionsWrap: {
    paddingHorizontal: 16,
    gap: 12,
  },
  collabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
  },
  collabBtnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
    letterSpacing: -0.3,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    letterSpacing: -0.3,
  },
});
