import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Share,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import CompleteProfileModal from '../../Components/ui/CompleteProfileModal';
import VerifiedBadge from '../../Components/ui/VerifiedBadge';
import { useAuth } from '../../context/AuthContext';
import { useApplePurchase } from '../../hooks/useApplePurchase';
import { useRemoteConfig } from '../../hooks/useRemoteConfig';
import { facebookUrl, instagramUrl, twitterUrl, youtubeUrl } from '../../services/socialLinks';
import { completeCollab, createSubscription, getFullProfile, getMyPosts, getUserStats, listCollaborations } from '../../services/userService';
import { useRoleTheme } from '../../theme/useRoleTheme';


interface ProfileData {
  name: string;
  phone: string;
  role: string;
  isPremium?: boolean;
  tagId?: string | null;
  profilePicture?: string | null;
  bio?: string | null;
  category?: string | null;
  categories?: string[] | null;
  email?: string | null;
  location?: string | null;
  languages?: string[] | null;
  // Creator-specific
  instagramHandle?: string | null;
  instagramFollowers?: number | null;
  youtubeHandle?: string | null;
  youtubeFollowers?: number | null;
  twitterHandle?: string | null;
  twitterFollowers?: number | null;
  facebookHandle?: string | null;
  preferredCollabType?: string | null;
  isAvailableForCollab?: boolean | null;
  // Freelancer-specific
  skills?: string[] | null;
  hourlyRate?: number | null;
  experienceLevel?: string | null;
  portfolioUrl?: string | null;
  availability?: string | null;
}

export const MENU_ITEMS = [
  { id: 'my_profile', icon: 'person-outline' as const, label: 'My Profile', imgSrc: require('../../assets/myprofile-icon.png') },
  { id: 'profile_views', icon: 'eye-outline' as const, label: 'Who Viewed My Profile', imgSrc: null },
  { id: 'saved', icon: 'heart-outline' as const, label: 'Saved Posts', imgSrc: require('../../assets/savedposts.png') },
  { id: 'settings', icon: 'settings-outline' as const, label: 'Settings', imgSrc: require('../../assets/setting.png') },
  { id: 'help', icon: 'help-circle-outline' as const, label: 'Help & Support', imgSrc: require('../../assets/help.png') },
  { id: 'about', icon: 'information-circle-outline' as const, label: 'About DigiTag', imgSrc: require('../../assets/about.png') },
  { id: 'report', icon: 'bug-outline' as const, label: 'Report App Issue', imgSrc: require('../../assets/report-icon.png') },
];

const PROFILE_REQUIRED_ITEMS = new Set(['my_profile', 'saved', 'my_posts', 'my_collabs', 'report']);

export default function ProfileScreen() {
  const router = useRouter();
  const { token, isGuest, userPhone, userRole, userId, logout, setProfiles, isProfileCompleted } = useAuth();
  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
  const insets = useSafeAreaInsets();

  const theme = useRoleTheme();
  const remoteConfig = useRemoteConfig(token);
  // Hard-disabled for the July 31 release — Apple rejected the subscription
  // submission (guideline 3.1.2(c): missing EULA/terms metadata in the
  // purchase flow) and this release needs to ship without Premium at all.
  // Deliberately ANDed in ahead of remoteConfig.premiumEnabled so nothing
  // premium-related can appear under ANY backend state, including the
  // reviewer-allowlist bypass that let Apple's reviewer reach the purchase
  // flow in the first place. Flip back to true once the subscription
  // metadata is fixed and ready to resubmit.
  const PREMIUM_ENABLED_THIS_BUILD = false;
  const premiumActive = PREMIUM_ENABLED_THIS_BUILD && remoteConfig.premiumEnabled;
  const applePurchase = useApplePurchase(token, premiumActive);
  useEffect(() => {
    if (applePurchase.error) Alert.alert('Purchase Failed', applePurchase.error);
  }, [applePurchase.error]);
  const visibleMenuItems = MENU_ITEMS.filter((item) => item.id !== 'profile_views' || premiumActive);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'main' | 'details'>('main');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCompleteProfileModal, setShowCompleteProfileModal] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [collabCount, setCollabCount] = useState(0);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [myCollabs, setMyCollabs] = useState<any[]>([]);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [activityTab, setActivityTab] = useState<'posts' | 'collab'>('posts');
  const [expandedActivityIds, setExpandedActivityIds] = useState<Set<string>>(new Set());
  const [completingCollabId, setCompletingCollabId] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
        if (isGuest || !token) {
          setProfile({
            name: 'Guest',
            phone: userPhone || '',
            role: 'GUEST',
          });
          setLoading(false);
          return;
        }

        try {
          const res = await getFullProfile(token);
          // Hydrate dual-role profile map so the role-switcher screen has the
          // freshest state without an extra round-trip.
          if (res.success && res.data?.profiles) {
            setProfiles(res.data.profiles);
          }
          // Fetch counts, posts and collabs in parallel
          const [countRes, postsRes, collabsRes] = await Promise.all([
            getUserStats(token),
            getMyPosts(token, { limit: '20' }),
            listCollaborations(token, { direction: 'all' }),
          ]);
          if (countRes.success && countRes.data) {
            setFollowerCount(countRes.data.followerCount ?? 0);
            setFollowingCount(countRes.data.followingCount ?? 0);
            setCollabCount(countRes.data.collabCount ?? 0);
          }
          if (postsRes.success) setMyPosts(Array.isArray(postsRes.data) ? postsRes.data : []);
          // Same filter as the My Collabs screen — a COMPLETED collab is still
          // one of "my collabs", so the menu count must match that list.
          if (collabsRes.success) setMyCollabs((Array.isArray(collabsRes.data) ? collabsRes.data : []).filter((c: any) => c.status === 'ACCEPTED' || c.status === 'COMPLETED'));
          if (res.success && res.data?.profile) {
            const p = res.data.profile;
            const role = res.data.role || userRole || 'USER';
            const base: ProfileData = {
              name: p.name || '',
              phone: userPhone || '',
              role,
              isPremium: Boolean(res.data.user?.isPremium),
              tagId: p.tagId || null,
              profilePicture: p.profilePicture || null,
              bio: p.bio || null,
              category: p.category?.name || null,
              categories: Array.isArray(p.categoryNames) && p.categoryNames.length > 0 ? p.categoryNames : null,
              email: p.email || null,
              location: p.location || null,
              languages: p.languages?.length > 0 ? p.languages : (p.language ? [p.language] : null),
            };
            if (role === 'CREATOR') {
              Object.assign(base, {
                instagramHandle: p.instagramHandle || null,
                instagramFollowers: p.instagramFollowers ?? null,
                youtubeHandle: p.youtubeHandle || null,
                youtubeFollowers: p.youtubeFollowers ?? null,
                twitterHandle: p.twitterHandle || null,
                twitterFollowers: p.twitterFollowers ?? null,
                facebookHandle: p.facebookHandle || null,
                preferredCollabType: p.preferredCollabType || null,
                isAvailableForCollab: p.isAvailableForCollab ?? true,
              });
            } else {
              Object.assign(base, {
                skills: Array.isArray(p.skills) ? p.skills : null,
                hourlyRate: p.hourlyRate ? Number(p.hourlyRate) : null,
                experienceLevel: p.experienceLevel || null,
                portfolioUrl: p.portfolioUrl || null,
                availability: p.availability || 'AVAILABLE',
                instagramHandle: p.instagramHandle || null,
                youtubeHandle: p.youtubeHandle || null,
                twitterHandle: p.twitterHandle || null,
                facebookHandle: p.facebookHandle || null,
              });
            }
            setProfile(base);
          } else {
            setProfile({
              name: '',
              phone: userPhone || '',
              role: userRole || 'USER',
            });
          }
        } catch (e) {
          console.error('Profile fetch error:', e);
          setProfile({
            name: '',
            phone: userPhone || '',
            role: userRole || 'USER',
          });
        } finally {
          setLoading(false);
        }
  }, [token, isGuest, userPhone, userRole]);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }, [fetchProfile]);

  const isProfileIncomplete = () => {
    if (!profile) return true;
    return !profile.bio && !profile.category && !(profile.categories?.length);
  };

  const handleMenuPress = (id: string) => {
    // A guest has no account to complete — send them to sign up instead of the
    // "finish your profile" modal, which would otherwise push them straight into
    // the signup form with no token to attach it to.
    if (PROFILE_REQUIRED_ITEMS.has(id) && (isGuest || !token)) {
      router.push('/role-selection');
      return;
    }
    if (PROFILE_REQUIRED_ITEMS.has(id) && isProfileIncomplete()) {
      setShowCompleteProfileModal(true);
      return;
    }
    if (id === 'edit_profile') {
      const editPath = userRole?.toUpperCase() === 'FREELANCER' ? '/signup/freelancer' : '/signup/creator';
      router.push(editPath as any);
    }
    if (id === 'my_profile') setViewMode('details');
    if (id === 'my_posts') router.push('/my-posts');
    if (id === 'my_collabs') router.push('/my-collabs');
    if (id === 'profile_views') router.push('/profile-viewers' as any);
    if (id === 'help') router.push('/help-support' as any);
    if (id === 'saved') router.push('/saved-posts');
    if (id === 'settings') router.navigate('/settings' as any);
    if (id === 'about') router.push('/about-digitag' as any);
    if (id === 'report') router.push('/report-issue' as any);
  };

  const getTimeAgo = (dateStr?: string | null) => {
    if (!dateStr) return '';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.round(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.round(diffHrs / 24);
    return `${diffDays}d ago`;
  };

  // 1–4 filled ₹ symbols — a rough price tier, not a literal amount, so a
  // free/low-budget post still renders a legible badge instead of a blank one.
  const getPriceLevel = (value?: number | string | null) => {
    const n = typeof value === 'string' ? parseFloat(value.replace(/[^\d.]/g, '')) : value;
    if (!n || n <= 0) return 1;
    if (n < 2000) return 1;
    if (n < 5000) return 2;
    if (n < 10000) return 3;
    return 4;
  };

  // Feeds the "Posts" tab — each of my own posts, decorated with my own
  // profile attributes (experience/rate/language/location) since those
  // describe me the poster, not the post itself.
  const activityPostCards = myPosts.slice(0, 2).map((post) => ({
    id: post.id,
    name: profile?.name || 'You',
    avatarUri: profile?.profilePicture || null,
    isPremium: profile?.isPremium,
    category: profile?.categories?.[0] || profile?.category || (userRole === 'FREELANCER' ? 'Freelancer' : 'Creator'),
    desc: post.description || '',
    experience: profile?.experienceLevel || 'New',
    priceLevel: getPriceLevel(post.budget ?? profile?.hourlyRate),
    languages: profile?.languages?.join(', ') || '—',
    location: profile?.location || '—',
    time: getTimeAgo(post.createdAt),
    onSeePortfolio: () => userId && router.push({ pathname: '/creator-details', params: { userId } } as any),
  }));

  const handleCompleteCollab = (collabId: string, otherName: string) => {
    Alert.alert(
      'Mark as Completed',
      `Mark your collaboration with ${otherName} as completed? This ends the work session — chat and calls will be closed for both of you.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Complete',
          style: 'destructive',
          onPress: async () => {
            if (!token) return;
            setCompletingCollabId(collabId);
            try {
              const res = await completeCollab(token, collabId);
              if (res.success) {
                setMyCollabs((prev) => prev.map((c) => (c.id === collabId ? { ...c, status: 'COMPLETED' } : c)));
              } else {
                Alert.alert('Error', res.error || 'Could not complete collaboration.');
              }
            } catch {
              Alert.alert('Error', 'Network error.');
            } finally {
              setCompletingCollabId(null);
            }
          },
        },
      ],
    );
  };

  // My Collabs screen's own card UI — kept 1:1 (avatar, name, role,
  // description, status pill, Mark Complete) rather than the Posts-tab
  // Experience/Price/Language/Location layout, at the user's request.
  const renderCollabCard = (collab: any) => {
    const iAmSender = collab.sender?.id === userId;
    const other = iAmSender ? collab.receiver : collab.sender;
    const otherProfile = other?.creatorProfile || other?.freelancerProfile;
    const otherName = otherProfile?.name || other?.role || 'User';
    const description = collab.post?.description || collab.message || '';
    const isCompleted = collab.status === 'COMPLETED';
    const isCompletingThis = completingCollabId === collab.id;
    return (
      <View key={collab.id} className="mb-3 bg-white/5 rounded-xl border border-white/10 p-3.5">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => other?.id && router.push({ pathname: '/creator-details', params: { userId: other.id } } as any)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
        >
          <View className="w-12 h-12 rounded-full border items-center justify-center" style={{ backgroundColor: theme.soft, borderColor: theme.border }}>
            <Text className="text-base font-bold" style={{ fontFamily: 'Poppins_700Bold', color: theme.primary }}>
              {otherName.slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text className="text-white text-[15px] font-semibold" style={{ fontFamily: 'Poppins_600SemiBold', flexShrink: 1 }} numberOfLines={1} ellipsizeMode="tail">{otherName}</Text>
              <VerifiedBadge isPremium={other?.isPremium} size={13} />
            </View>
            <Text className="text-[#8A8A99] text-[13px] mt-[2px] capitalize" style={{ fontFamily: 'Poppins_400Regular' }}>{other?.role?.toLowerCase() || ''}</Text>
            {description ? (
              <Text className="text-[#8A8A99] text-[13px] mt-1 leading-5" numberOfLines={2} style={{ fontFamily: 'Poppins_400Regular' }}>{description}</Text>
            ) : null}
          </View>
          <View
            className="rounded-full border px-2.5 py-[5px]"
            style={isCompleted
              ? { backgroundColor: 'rgba(100,100,100,0.12)', borderColor: 'rgba(100,100,100,0.3)' }
              : { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.3)' }
            }
          >
            <Text
              className="text-[11px] font-semibold"
              style={{ fontFamily: 'Poppins_600SemiBold', color: isCompleted ? '#8A8A99' : '#10B981' }}
            >
              {isCompleted ? 'Completed' : 'Active'}
            </Text>
          </View>
        </TouchableOpacity>

        {userRole === 'CREATOR' && !isCompleted && (
          <TouchableOpacity
            onPress={() => handleCompleteCollab(collab.id, otherName)}
            disabled={isCompletingThis}
            activeOpacity={0.8}
            style={{
              marginTop: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 8,
              borderRadius: 99,
              borderWidth: 1,
              borderColor: 'rgba(16,185,129,0.4)',
              backgroundColor: 'rgba(16,185,129,0.08)',
              opacity: isCompletingThis ? 0.5 : 1,
            }}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
            <Text style={{ color: '#10B981', fontSize: 13, fontFamily: 'Poppins_600SemiBold' }}>
              {isCompletingThis ? 'Completing...' : 'Mark as Completed'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const handleActivityShare = async (desc: string) => {
    try { await Share.share({ message: desc || 'Check this out on DigiTag' }); } catch { /* user dismissed */ }
  };

  const toggleActivityExpanded = (id: string) => {
    setExpandedActivityIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  type ActivityCard = {
    id: string; name: string; avatarUri: string | null; isPremium?: boolean | null;
    category: string; desc: string; experience: string; priceLevel: number;
    languages: string; location: string; time: string; onSeePortfolio: () => void;
  };

  const renderActivityCard = (item: ActivityCard) => {
    const isExpanded = expandedActivityIds.has(item.id);
    const needsTruncation = item.desc.length > 100;
    const shownDesc = isExpanded || !needsTruncation ? item.desc : item.desc.slice(0, 100).trimEnd();
    return (
      <View
        key={item.id}
        style={{
          borderRadius: 24,
          borderWidth: 1,
          borderColor: 'rgba(156,156,156,0.3)',
          backgroundColor: 'rgba(30,30,36,1)',
          padding: 16,
          marginBottom: 16,
        }}
      >
        {/* Header: avatar + name + category */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, overflow: 'hidden', backgroundColor: '#333', marginRight: 12 }}>
            <Image
              source={item.avatarUri ? { uri: item.avatarUri } : require('../../assets/images/icon.png')}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'Poppins_600SemiBold', flexShrink: 1 }} numberOfLines={1}>{item.name}</Text>
              <VerifiedBadge isPremium={item.isPremium} size={14} />
            </View>
            <Text style={{ color: theme.primary, fontSize: 13, fontFamily: 'Poppins_500Medium', marginTop: 2 }} numberOfLines={1}>{item.category}</Text>
          </View>
        </View>

        {/* Description */}
        {!!item.desc && (
          <TouchableOpacity activeOpacity={0.7} disabled={!needsTruncation} onPress={() => toggleActivityExpanded(item.id)}>
            <Text style={{ color: '#D0D0D6', fontSize: 13.5, fontFamily: 'Poppins_400Regular', lineHeight: 20, marginBottom: 16 }}>
              {shownDesc}
              {needsTruncation && (isExpanded ? ' ' : '... ')}
              {needsTruncation && (
                <Text style={{ color: theme.primary, fontFamily: 'Poppins_500Medium' }}>{isExpanded ? 'See less' : 'See more'}</Text>
              )}
            </Text>
          </TouchableOpacity>
        )}

        {/* Experience / Price Level */}
        <View style={{ flexDirection: 'row', marginBottom: 14 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#8A8A99', fontSize: 12, fontFamily: 'Poppins_400Regular', marginBottom: 6 }}>Experience</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="briefcase-outline" size={14} color="#D0D0D6" />
              <Text style={{ color: '#D0D0D6', fontSize: 13.5, fontFamily: 'Poppins_500Medium' }} numberOfLines={1}>{item.experience}</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#8A8A99', fontSize: 12, fontFamily: 'Poppins_400Regular', marginBottom: 6 }}>Price Level (Primary)</Text>
            <View style={{ flexDirection: 'row', gap: 3 }}>
              {[1, 2, 3, 4].map((n) => (
                <Text key={n} style={{ fontSize: 14, fontFamily: 'Poppins_700Bold', color: n <= item.priceLevel ? '#22C55E' : '#3A3A44' }}>₹</Text>
              ))}
            </View>
          </View>
        </View>

        {/* Language / Location */}
        <View style={{ flexDirection: 'row', marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#8A8A99', fontSize: 12, fontFamily: 'Poppins_400Regular', marginBottom: 6 }}>Language</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="language-outline" size={14} color="#D0D0D6" />
              <Text style={{ color: '#D0D0D6', fontSize: 13.5, fontFamily: 'Poppins_500Medium', flexShrink: 1 }} numberOfLines={1}>{item.languages}</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#8A8A99', fontSize: 12, fontFamily: 'Poppins_400Regular', marginBottom: 6 }}>Location (Primary)</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="location-outline" size={14} color="#D0D0D6" />
              <Text style={{ color: '#D0D0D6', fontSize: 13.5, fontFamily: 'Poppins_500Medium', flexShrink: 1 }} numberOfLines={1}>{item.location}</Text>
            </View>
          </View>
        </View>

        {/* Message / Call / Share  —  See Portfolio + time */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/messages' as any)}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#2A2A30', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={16} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/messages' as any)}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#2A2A30', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="call-outline" size={16} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleActivityShare(item.desc)}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#2A2A30', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="share-social-outline" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity onPress={item.onSeePortfolio} style={{ backgroundColor: theme.primary, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 }}>
              <Text style={{ color: '#fff', fontSize: 12.5, fontFamily: 'Poppins_600SemiBold' }}>See Portfolio</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="time-outline" size={12} color="#8A8A99" />
              <Text style={{ color: '#8A8A99', fontSize: 11, fontFamily: 'Poppins_400Regular' }}>{item.time}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const handleLogout = () => {
    logout();
    router.replace('/role-selection');
  };

  // Dev-only entry point for now — final placement is the "Complete Your Profile"
  // success popup, per the product ask. Wired to a real Razorpay subscription.
  const handleUpgrade = async () => {
    if (isGuest || !token) { router.push('/role-selection'); return; }
    if (upgrading) return;
    setUpgrading(true);
    try {
      const res = await createSubscription(token);
      if (!res.success || !res.data) {
        Alert.alert('Upgrade Failed', (res as any).error || 'Could not start checkout. Please try again.');
        return;
      }
      const { subscriptionId, keyId } = res.data;
      await RazorpayCheckout.open({
        key: keyId,
        subscription_id: subscriptionId,
        name: 'DigiTag Premium',
        description: 'Monthly subscription',
        prefill: userPhone ? { contact: userPhone } : undefined,
        theme: { color: theme.primary },
      } as any);
      Alert.alert('Payment Successful', 'Your subscription is now active.');
    } catch (err: any) {
      // RazorpayCheckout rejects on user cancellation too — only surface real errors.
      const isCancelled = /cancel/i.test(err?.description || '');
      if (!isCancelled) {
        Alert.alert('Payment Failed', err?.description || 'Something went wrong.');
      }
    } finally {
      setUpgrading(false);
    }
  };

  const handleAppleUpgrade = async () => {
    if (isGuest || !token) { router.push('/role-selection'); return; }
    await applePurchase.purchase((isPremium) => {
      if (isPremium) {
        setProfile((prev) => (prev ? { ...prev, isPremium: true } : prev));
        Alert.alert('Payment Successful', 'Your subscription is now active.');
      }
    });
  };

  const handleRestorePurchases = async () => {
    if (isGuest || !token) return;
    await applePurchase.restore((isPremium) => {
      if (isPremium) {
        setProfile((prev) => (prev ? { ...prev, isPremium: true } : prev));
        Alert.alert('Restored', 'Your subscription has been restored.');
      }
    });
  };

  const getRoleLabel = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'CREATOR': return 'Creator';
      case 'BRAND': return 'Brand';
      case 'FREELANCER': return 'Freelancer';
      default: return role;
    }
  };

  const getOwnerName = (owner: any) => {
    if (owner?.name) return owner.name;
    if (owner?.role === 'CREATOR') return 'Creator';
    if (owner?.role === 'FREELANCER') return 'Freelancer';
    return 'User';
  };

  const openLink = (url: string | null | undefined) => {
    if (url) Linking.openURL(url).catch(() => { });
  };

  const fmtCount = (n?: number | null) => {
    if (!n) return '—';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  };

  const availColor = (a?: string | null) => {
    if (a === 'BUSY') return { bg: 'rgba(245,158,11,0.15)', dot: '#F59E0B', text: '#F59E0B' };
    if (a === 'NOT_AVAILABLE') return { bg: 'rgba(239,68,68,0.15)', dot: '#EF4444', text: '#EF4444' };
    return { bg: 'rgba(16,185,129,0.15)', dot: '#10B981', text: '#10B981' };
  };

  const fmtAvailability = (a?: string | null) => {
    if (a === 'BUSY') return 'Busy';
    if (a === 'NOT_AVAILABLE') return 'Not Available';
    return 'Available';
  };

  const initials = (name: string) =>
    name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const timeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const m = Math.round(diffMs / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.round(h / 24)}d ago`;
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#060606] justify-center items-center">
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!isGuest && !isProfileCompleted) {
    return (
      <View className="flex-1 bg-[#060606] justify-center items-center px-8">
        <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />
        <Text className="text-white text-2xl font-bold mb-2" style={{ fontFamily: 'Poppins_700Bold' }} numberOfLines={1} ellipsizeMode="tail">
          Hi, {profile?.name || userPhone || 'there'}!
        </Text>
        <Text className="text-[#888] text-sm text-center mb-8" style={{ fontFamily: 'Poppins_400Regular' }}>
          Complete your profile to unlock posts, follows, collaborations and more.
        </Text>
        <TouchableOpacity
          onPress={() => router.push((userRole?.toUpperCase() === 'FREELANCER' ? '/signup/freelancer' : '/signup/creator') as any)}
          style={{ backgroundColor: theme.primary, borderRadius: 99, paddingHorizontal: 32, paddingVertical: 14 }}
        >
          <Text className="text-white font-bold text-base" style={{ fontFamily: 'Poppins_700Bold' }}>Complete Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout} className="mt-6">
          <Text className="text-red-400 text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const iconBorderClass = profile?.role?.toUpperCase() === 'FREELANCER' ? ' ' : ' ';

  return (
    <View className="flex-1 bg-[#060606]">
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      <SafeAreaView className="flex-1" edges={['left', 'right']}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ED2A91" />}
        >
          {/* ══════════ HERO HEADER ══════════ */}
          <View className="h-[300px] w-full relative overflow-hidden">
            {/* Background image matching index.tsx */}
            <Image source={require('../../assets/images/profile_hero_bg.webp')} className="absolute inset-0 w-full h-[300px]  " resizeMode="cover" />
            {/* Dark overlay matching index.tsx gradient */}
            <LinearGradient colors={['rgba(0,0,0,0.2)', '#000']} className="absolute inset-0" />
            {/* Top Navigation Row */}
            <View className="flex-row justify-between items-center px-6" style={{ marginTop: Math.max(insets.top, statusBarHeight) + 8 }}>
              <TouchableOpacity onPress={() => {
                if (viewMode === 'details') setViewMode('main');
                else router.back();
              }}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowDropdown(v => !v)}>
                <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* ══════════ 3-DOT DROPDOWN MENU ══════════ */}
            {showDropdown && (
              <>
                {/* Backdrop to dismiss */}
                <TouchableOpacity
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                  activeOpacity={1}
                  onPress={() => setShowDropdown(false)}
                />
                <View style={{
                  position: 'absolute',
                  top: Math.max(insets.top, statusBarHeight) + 48,
                  right: 16,
                  backgroundColor: '#1A1A1A',
                  borderRadius: 18,
                  paddingVertical: 6,
                  minWidth: 190,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.5,
                  shadowRadius: 16,
                  elevation: 20,
                  borderWidth: 1,
                  borderColor: '#2A2A2A',
                  zIndex: 999,
                }}>
                  {/* Edit Profile */}
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 }}
                    activeOpacity={0.7}
                    onPress={() => {
                      setShowDropdown(false);
                      if (isGuest || !token) { router.push('/role-selection'); return; }
                      const editPath = userRole?.toUpperCase() === 'FREELANCER' ? '/signup/freelancer' : '/signup/creator';
                      router.push(editPath as any);
                    }}
                  >
                    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                      <Image source={require('../../assets/edit.png')} style={{ width: 36, height: 36 }} resizeMode="contain" />
                    </View>
                    <Text style={{ color: '#fff', fontSize: 15, fontFamily: 'Poppins_500Medium' }}>Edit Profile</Text>
                  </TouchableOpacity>

                  {/* Divider */}
                  <View style={{ height: 0.5, backgroundColor: '#2A2A2A', marginHorizontal: 16 }} />

                  {/* Share Profile */}
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 }}
                    activeOpacity={0.7}
                    onPress={async () => {
                      setShowDropdown(false);
                      if (isGuest || !token) { router.push('/role-selection'); return; }
                      try {
                        await Share.share({
                          message: `Check out my profile on digitag! @${profile?.tagId ?? ''}\nhttps://thedigitag.ai/profile/${profile?.tagId ?? ''}`,
                          title: 'digitag Profile',
                        });
                      } catch (_) {}
                    }}
                  >
                    <View style={{  justifyContent: 'center', alignItems: 'center' }}>
                      <Image source={require('../../assets/share.png')} style={{ width: 36, height: 36 }} resizeMode="contain" />
                    </View>
                    <Text style={{ color: '#fff', fontSize: 15, fontFamily: 'Poppins_500Medium' }}>Share Profile</Text>
                  </TouchableOpacity>

                  {/* Divider */}
                  <View style={{ height: 0.5, backgroundColor: '#2A2A2A', marginHorizontal: 16 }} />

                  {/* Logout */}
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 }}
                    activeOpacity={0.7}
                    onPress={() => {
                      setShowDropdown(false);
                      handleLogout();
                    }}
                  >
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FF0000', justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="log-out-outline" size={18} color="#fff" />
                    </View>
                    <Text style={{ color: '#FF3B3B', fontSize: 15, fontFamily: 'Poppins_500Medium' }}>Logout</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Profile Info Block */}
            <View className="flex-row  px-6 mt-6 gap-5">
              {/* Avatar */}
              <TouchableOpacity
                onPress={() => setIsPhotoModalOpen(true)}
                activeOpacity={0.9}
                className="w-[68px] h-[68px] rounded-full border-2 border-white/60 overflow-hidden bg-[#222]"
              >
                <Image
                  source={profile?.profilePicture ? { uri: profile.profilePicture } : require('../../assets/images/icon.png')}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </TouchableOpacity>

              {/* Text Info */}
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text
                    className="text-white text-2xl   tracking-tight"
                    style={{ fontFamily: 'Poppins_600SemiBold', flexShrink: 1 }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {profile?.name || profile?.phone || ''}
                  </Text>
                  <VerifiedBadge isPremium={profile?.isPremium} size={18} />
                </View>
                {profile?.tagId ? (
                  <Text style={{ color: '#e1e1e1', fontFamily: 'Poppins_400Regular', fontSize: 13, marginTop: 2 }}>{profile.tagId}</Text>
                ) : (
                  <Text className="text-[#a1a1a1] text-base font-normal mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>{profile?.phone}</Text>
                )}

                {/* Role badge */}
                <View className="flex-row items-center mt-2">
                  <Text style={{ color: theme.primary, fontSize: 13, fontFamily: 'Poppins_600SemiBold' }}>{getRoleLabel(profile?.role || '')}</Text>
                  <Ionicons name="checkmark-circle" size={14} color={theme.primary} style={{ marginLeft: 4 }} />
                </View>

                {/* Followers / Following */}
                <View className="flex-row items-center mt-3 gap-5">
                  <TouchableOpacity
                    activeOpacity={0.7}
                    className="flex-row items-baseline gap-1.5"
                    onPress={() => router.push('/followers' as any)}
                  >
                    <Text className="text-white text-[15px]" style={{ fontFamily: 'Poppins_700Bold' }}>{fmtCount(followerCount)}</Text>
                    <Text className="text-[#888] text-[13px]" style={{ fontFamily: 'Poppins_400Regular' }}>Followers</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    className="flex-row items-baseline gap-1.5"
                    onPress={() => router.push('/following' as any)}
                  >
                    <Text className="text-white text-[15px]" style={{ fontFamily: 'Poppins_700Bold' }}>{fmtCount(followingCount)}</Text>
                    <Text className="text-[#888] text-[13px]" style={{ fontFamily: 'Poppins_400Regular' }}>Following</Text>
                  </TouchableOpacity>
                </View>

                {/* Social Icons Row — only the links the user actually provided */}
                {(() => {
                  const socials: { key: string; src?: any; icon?: any; color?: string; url: string; platform?: string }[] = [];
                  if (profile?.instagramHandle) socials.push({ key: 'ig', src: require('../../assets/skill-icons_instagram.png'), url: instagramUrl(profile.instagramHandle) });
                  if (profile?.youtubeHandle) socials.push({ key: 'yt', icon: 'logo-youtube', color: '#FF0000', url: youtubeUrl(profile.youtubeHandle) });
                  if (profile?.facebookHandle) socials.push({ key: 'fb', icon: 'logo-facebook', color: '#1877F2', url: facebookUrl(profile.facebookHandle) });
                  if (profile?.twitterHandle) socials.push({ key: 'tw', platform: 'X', icon: 'x-twitter', color: '#000000', url: twitterUrl(profile.twitterHandle) });
                  if (profile?.portfolioUrl) socials.push({ key: 'portfolio', icon: 'globe-outline', color: '#6366F1', url: profile.portfolioUrl });
                  if (socials.length === 0) return null;
                  return (
                    <View className="flex-row items-center mt-5 gap-3.5">
                      {socials.map(s => s.src ? (
                        <TouchableOpacity key={s.key} activeOpacity={0.8} onPress={() => openLink(s.url)}>
                          <View className="w-9 h-9 rounded-xl overflow-hidden shadow-sm">
                            <Image source={s.src} className="w-full h-full" resizeMode="cover" />
                          </View>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          key={s.key}
                          className="w-9 h-9 rounded-xl items-center justify-center shadow-sm"
                          style={{ backgroundColor: s.color }}
                          activeOpacity={0.8}
                          onPress={() => openLink(s.url)}
                        >
                          {s.platform === 'X' ? (
                            <FontAwesome6 name={s.icon} size={18} color="#fff" />
                          ) : (
                            <Ionicons name={s.icon} size={20} color="#fff" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  );
                })()}
              </View>
            </View>
          </View>
          {viewMode === 'main' ? (
              <>
                {/* ══════════ MENU CARD ══════════ */}
                <View 
                  className="mx-5 mt-4 rounded-[28px] border  bg-[#0A0A0A]"
                  style={{
                    shadowColor: '#fff',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.5,
                    shadowRadius: 15,
                    elevation: 10,
                    borderColor: '#fff',
                    borderWidth: 0.3,
                  }}
                >
                {visibleMenuItems.map((item, index) => {
                  const isSpecial = item.id === 'my_posts' || item.id === 'my_collabs';
                  const count = item.id === 'my_posts' ? myPosts.length : (item.id === 'my_collabs' ? myCollabs.length : null);
                  const countLabel = count != null ? `${count} ${item.id === 'my_posts' ? 'post' : 'collab'}${count !== 1 ? 's' : ''}` : null;

                  return (
                    <React.Fragment key={item.id}>
                      <TouchableOpacity
                        className="flex-row items-center py-4 px-5 gap-4"
                        activeOpacity={0.7}
                        onPress={() => handleMenuPress(item.id)}
                      >
                        {/* Icon circle */}
                        <View style={{

                        }}>
                          {item.imgSrc ? (
                            <Image source={item.imgSrc} style={{ width: 36, height: 36 }} resizeMode="contain" />
                          ) : (
                            <Ionicons name={item.icon} size={20} color={isSpecial ? theme.primary : '#fff'} />
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text className="text-white text-[16px] font-medium" style={{ fontFamily: 'Poppins_500Medium' }}>{item.label}</Text>
                          {countLabel && (
                            <Text style={{ color: '#666', fontSize: 13, fontFamily: 'Poppins_400Regular' }}>{countLabel}</Text>
                          )}
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#555" />
                      </TouchableOpacity>
                      {index < visibleMenuItems.length - 1 && (
                        <View className="h-[0.5px] bg-white/10 mx-5" />
                      )}
                    </React.Fragment>
                  );
                })}
              </View>

              {/* ══════════ POSTS / COLLAB ACTIVITY ══════════ */}
              <View className="flex-row mx-5 mt-6 border-b border-white/10">
                <TouchableOpacity
                  style={{ flex: 1, alignItems: 'center', paddingVertical: 10 }}
                  activeOpacity={0.75}
                  onPress={() => setActivityTab('posts')}
                >
                  <Image
                    source={require('../../assets/myposts.png')}
                    style={{ width: 36, height: 36, opacity: activityTab === 'posts' ? 1 : 0.45 }}
                    resizeMode="contain"
                  />
                  <Text
                    style={{
                      marginTop: 4,
                      fontSize: 14,
                      fontFamily: activityTab === 'posts' ? 'Poppins_600SemiBold' : 'Poppins_400Regular',
                      color: activityTab === 'posts' ? '#fff' : '#666',
                    }}
                  >
                    Posts
                  </Text>
                  {activityTab === 'posts' && (
                    <View style={{ height: 2, width: '60%', borderRadius: 1, marginTop: 8, backgroundColor: theme.primary }} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, alignItems: 'center', paddingVertical: 10 }}
                  activeOpacity={0.75}
                  onPress={() => setActivityTab('collab')}
                >
                  <Image
                    source={require('../../assets/mycollabs.png')}
                    style={{ width: 36, height: 36, opacity: activityTab === 'collab' ? 1 : 0.45 }}
                    resizeMode="contain"
                  />
                  <Text
                    style={{
                      marginTop: 4,
                      fontSize: 14,
                      fontFamily: activityTab === 'collab' ? 'Poppins_600SemiBold' : 'Poppins_400Regular',
                      color: activityTab === 'collab' ? '#fff' : '#666',
                    }}
                  >
                    Collab
                  </Text>
                  {activityTab === 'collab' && (
                    <View style={{ height: 2, width: '60%', borderRadius: 1, marginTop: 8, backgroundColor: theme.primary }} />
                  )}
                </TouchableOpacity>
              </View>

              <View className="px-5 mt-5">
                {activityTab === 'posts' ? (
                  activityPostCards.length === 0 ? (
                    <Text className="text-[#8A8A99] text-center mt-8" style={{ fontFamily: 'Poppins_400Regular' }}>No posts yet.</Text>
                  ) : (
                    <>
                      {activityPostCards.map(renderActivityCard)}
                      <TouchableOpacity
                        activeOpacity={0.75}
                        onPress={() => handleMenuPress('my_posts')}
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 }}
                      >
                        <Text style={{ color: theme.primary, fontSize: 14, fontFamily: 'Poppins_600SemiBold' }}>See All Posts</Text>
                        <Ionicons name="chevron-forward" size={16} color={theme.primary} />
                      </TouchableOpacity>
                    </>
                  )
                ) : (
                  myCollabs.length === 0 ? (
                    <Text className="text-[#8A8A99] text-center mt-8" style={{ fontFamily: 'Poppins_400Regular' }}>No collabs yet.</Text>
                  ) : (
                    <>
                      {myCollabs.slice(0, 2).map(renderCollabCard)}
                      <TouchableOpacity
                        activeOpacity={0.75}
                        onPress={() => handleMenuPress('my_collabs')}
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 }}
                      >
                        <Text style={{ color: theme.primary, fontSize: 14, fontFamily: 'Poppins_600SemiBold' }}>See All Collabs</Text>
                        <Ionicons name="chevron-forward" size={16} color={theme.primary} />
                      </TouchableOpacity>
                    </>
                  )
                )}
              </View>

              {/* ══════════ UPGRADE ══════════
                  Apple 3.1.1 requires In-App Purchase for digital subscriptions,
                  so iOS goes through StoreKit (expo-iap) while Android/
                  web keep using Razorpay checkout — never Razorpay on iOS.
                  Gated on premiumActive (remote PREMIUM_ENABLED flag AND the
                  local PREMIUM_ENABLED_THIS_BUILD override above) — hidden on
                  every platform whenever Premium itself is paused, and
                  unconditionally hidden this release regardless of backend state. */}
              {premiumActive && Platform.OS === 'ios' && (
                <>
                  <TouchableOpacity
                    onPress={handleAppleUpgrade}
                    disabled={applePurchase.state !== 'idle'}
                    activeOpacity={0.85}
                    className="mx-5 mt-4 rounded-full items-center justify-center py-4"
                    style={{ backgroundColor: theme.primary, opacity: applePurchase.state !== 'idle' ? 0.7 : 1 }}
                  >
                    {applePurchase.state !== 'idle' ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text className="text-white text-[16px]" style={{ fontFamily: 'Poppins_600SemiBold' }}>Upgrade to Premium</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleRestorePurchases}
                    disabled={applePurchase.state !== 'idle'}
                    activeOpacity={0.85}
                    className="mx-5 mt-3 items-center justify-center py-2"
                  >
                    <Text className="text-[13px]" style={{ fontFamily: 'Poppins_500Medium', color: theme.primary }}>Restore Purchases</Text>
                  </TouchableOpacity>
                </>
              )}
              {premiumActive && Platform.OS !== 'ios' && (
                <TouchableOpacity
                  onPress={handleUpgrade}
                  disabled={upgrading}
                  activeOpacity={0.85}
                  className="mx-5 mt-4 rounded-full items-center justify-center py-4"
                  style={{ backgroundColor: theme.primary, opacity: upgrading ? 0.7 : 1 }}
                >
                  {upgrading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white text-[16px]" style={{ fontFamily: 'Poppins_600SemiBold' }}>Upgrade to Premium</Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View className="px-4 mt-8">
              <Text className="text-white text-xl font-semibold mb-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>Profile Details</Text>

              {/* Profile Details Card */}
              <View
                className="rounded-[24px] px-2 py-4 border bg-[#0A0A0A]"
                style={{
                  shadowColor: '#fff',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.5,
                  shadowRadius: 15,
                  elevation: 10,
                  borderColor: '#fff',
                  borderWidth: 0.3,
                }}
              >
                {/* Email Row */}
                <View className="flex-row items-center gap-4 px-3 py-3  ">
                  <View className={`w-10 h-10 rounded-full bg-[#1A1A1A] items-center justify-center border `}>
                    <Image source={require('../../assets/mailicon.png')} style={{ width: 36, height: 36 }} resizeMode="contain" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[#666] text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>Email</Text>
                    <Text className="text-white text-[15px]" style={{ fontFamily: 'Poppins_400Regular' }}>{profile?.email || 'Not provided'}</Text>
                  </View>
                </View>

                {/* Bio Row */}
                <View className="flex-row items-start gap-4 px-3 py-3  border-[#222]">
                  <View className={`w-10 h-10 rounded-full bg-[#1A1A1A] items-center justify-center border  `}>
                    <Image source={require('../../assets/myprofile-icon.png')} style={{ width: 36, height: 36 }} resizeMode="contain" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[#666] text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>Bio</Text>
                    <Text className="text-white text-[15px] leading-5" style={{ fontFamily: 'Poppins_400Regular' }}>{profile?.bio || 'Not provided'}</Text>
                  </View>
                </View>

                {/* Location Row */}
                <View className="flex-row items-center gap-4 px-3 py-3 ">
                  <View className={`w-10 h-10 rounded-full bg-[#1A1A1A] items-center justify-center border  `}>
                    <Image source={require('../../assets/map-icon.png')} style={{ width: 36, height: 36 }} resizeMode="contain" />
                  </View>
                  <View>
                    <Text className="text-[#666] text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>Location</Text>
                    <Text className="text-white text-[15px]" style={{ fontFamily: 'Poppins_400Regular' }}>{profile?.location || 'Not provided'}</Text>
                  </View>
                </View>

                {/* Category Row */}
                <View className="flex-row items-center gap-4 px-3 py-3 ">
                  <View className={`w-10 h-10 rounded-full bg-[#1A1A1A] items-center justify-center border  `}>
                    <Image source={require('../../assets/category-icon.png')} style={{ width: 36, height: 36 }} resizeMode="contain" />
                  </View>
                  <View>
                    <Text className="text-[#666] text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>Category</Text>
                    <Text className="text-white text-[15px]" style={{ fontFamily: 'Poppins_400Regular' }}>{profile?.categories?.join(', ') || profile?.category || 'Not provided'}</Text>
                  </View>
                </View>

                {/* Language Row */}
                <View className="flex-row items-center gap-4 px-3 py-3">
                  <View className={`w-10 h-10 rounded-full bg-[#1A1A1A] items-center justify-center border ${iconBorderClass}`}>
                    <Image source={require('../../assets/language-icon.png')} style={{ width: 36, height: 36 }} resizeMode="contain" />
                  </View>
                  <View>
                    <Text className="text-[#666] text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>Language</Text>
                    <Text className="text-white text-[15px]" style={{ fontFamily: 'Poppins_400Regular' }}>{profile?.languages?.join(', ') || 'Not provided'}</Text>
                  </View>
                </View>
              </View>

            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* ══════════ PHOTO PREVIEW MODAL ══════════ */}
      <Modal visible={isPhotoModalOpen} transparent animationType="fade">
        <TouchableOpacity
          className="flex-1 bg-black/90 items-center justify-center p-6"
          activeOpacity={1}
          onPress={() => setIsPhotoModalOpen(false)}
        >
          <View className="items-center gap-8">
            {/* Circle Image */}
            <View className="w-[280px] h-[280px] rounded-full overflow-hidden border-4 border-white/20 bg-[#222]">
              <Image
                source={profile?.profilePicture ? { uri: profile.profilePicture! } : require('../../assets/images/icon.png')}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>

            {/* Edit Button */}
            <TouchableOpacity
              onPress={() => {
                setIsPhotoModalOpen(false);
                if (isGuest || !token) { router.push('/role-selection'); return; }
                const editPath = userRole?.toUpperCase() === 'FREELANCER' ? '/signup/freelancer' : '/signup/creator';
                router.push({ pathname: editPath, params: { step: '2' } } as any);
              }}
              style={{
                backgroundColor: theme.primary,
                paddingHorizontal: 40,
                paddingVertical: 14,
                borderRadius: 30,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6
              }}
            >
              <Text className="text-white text-lg font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>Edit</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ══════════ COMPLETE PROFILE MODAL ══════════ */}
      <CompleteProfileModal
        visible={showCompleteProfileModal}
        role={userRole || 'CREATOR'}
        action="access this feature"
        onComplete={() => {
          setShowCompleteProfileModal(false);
          const editPath = userRole?.toUpperCase() === 'FREELANCER' ? '/signup/freelancer' : '/signup/creator';
          setTimeout(() => router.push(editPath as any), 250);
        }}
        onDismiss={() => setShowCompleteProfileModal(false)}
      />

      {/* Bottom nav rendered globally by (tabs)/_layout.tsx. */}
    </View>
  );
}
