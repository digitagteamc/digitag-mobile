import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Share,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import CompleteProfileModal from '../../Components/ui/CompleteProfileModal';
import { useAuth } from '../../context/AuthContext';
import { getFullProfile, getMyPosts, getUserStats, listCollaborations } from '../../services/userService';
import { useRoleTheme } from '../../theme/useRoleTheme';


interface ProfileData {
  name: string;
  phone: string;
  role: string;
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
  { id: 'my_profile', icon: 'person-outline' as const, label: 'My Profile' },
  { id: 'saved', icon: 'heart-outline' as const, label: 'Saved Posts' },
  { id: 'settings', icon: 'settings-outline' as const, label: 'Settings' },
  { id: 'help', icon: 'help-circle-outline' as const, label: 'Help & Support' },
  { id: 'about', icon: 'information-circle-outline' as const, label: 'About DigiTag' },
  { id: 'report', icon: 'bug-outline' as const, label: 'Report App Issue' },
];

const PROFILE_REQUIRED_ITEMS = new Set(['my_profile', 'saved', 'my_posts', 'my_collabs', 'report']);

export default function ProfileScreen() {
  const router = useRouter();
  const { token, isGuest, userPhone, userRole, userId, logout, setProfiles } = useAuth();
  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
  const insets = useSafeAreaInsets();

  const theme = useRoleTheme();
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

  useFocusEffect(
    useCallback(() => {
      const fetchProfile = async () => {
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
            listCollaborations(token, { status: 'ACCEPTED', direction: 'all' }),
          ]);
          if (countRes.success && countRes.data) {
            setFollowerCount(countRes.data.followerCount ?? 0);
            setFollowingCount(countRes.data.followingCount ?? 0);
            setCollabCount(countRes.data.collabCount ?? 0);
          }
          if (postsRes.success) setMyPosts(Array.isArray(postsRes.data) ? postsRes.data : []);
          if (collabsRes.success) setMyCollabs(Array.isArray(collabsRes.data) ? collabsRes.data : []);
          if (res.success && res.data?.profile) {
            const p = res.data.profile;
            const role = res.data.role || userRole || 'USER';
            const base: ProfileData = {
              name: p.name || '',
              phone: userPhone || '',
              role,
              tagId: p.tagId || null,
              profilePicture: p.profilePicture || null,
              bio: p.bio || null,
              category: p.category?.name || null,
              categories: p.categories && p.categories.length > 0 ? p.categories : null,
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
      };

      fetchProfile();
    }, [token, isGuest])
  );

  const isProfileIncomplete = () => {
    if (!profile) return true;
    return !profile.bio && !profile.category && !(profile.categories?.length);
  };

  const handleMenuPress = (id: string) => {
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
    if (id === 'help') router.push('/help-support' as any);
    if (id === 'saved') router.push('/saved-posts');
    if (id === 'settings') router.navigate('/settings' as any);
    if (id === 'about') router.push('/about-digitag' as any);
    if (id === 'report') router.push('/report-issue' as any);
  };

  const handleLogout = () => {
    logout();
    router.replace('/role-selection');
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

  const iconBorderClass = profile?.role?.toUpperCase() === 'FREELANCER' ? 'border-[#F26930]/30' : 'border-[#ed2a91]/30';

  return (
    <View className="flex-1 bg-[#060606]">
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      <SafeAreaView className="flex-1" edges={['bottom', 'left', 'right']}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 50 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ══════════ HERO HEADER ══════════ */}
          <View className="h-[300px] w-full relative overflow-hidden">
            {/* Background image matching index.tsx */}
            <Image source={require('../../assets/images/profile_hero_bg.webp')} className="absolute inset-0 w-full h-[300px] opacity-60" resizeMode="cover" />
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
                      const editPath = userRole?.toUpperCase() === 'FREELANCER' ? '/signup/freelancer' : '/signup/creator';
                      router.push(editPath as any);
                    }}
                  >
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#2A2A2A', justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="pencil-outline" size={18} color="#fff" />
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
                      try {
                        await Share.share({
                          message: `Check out my profile on digitag! @${profile?.tagId ?? ''}\nhttps://thedigitag.ai/profile/${profile?.tagId ?? ''}`,
                          title: 'digitag Profile',
                        });
                      } catch (_) {}
                    }}
                  >
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#2A2A2A', justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="share-social-outline" size={18} color="#fff" />
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
            <View className="flex-row items-center px-6 mt-6 gap-5">
              {/* Avatar */}
              <TouchableOpacity
                onPress={() => setIsPhotoModalOpen(true)}
                activeOpacity={0.9}
                className="w-24 h-24 rounded-full border-2 border-white/60 overflow-hidden bg-[#222]"
              >
                <Image
                  source={profile?.profilePicture ? { uri: profile.profilePicture } : require('../../assets/images/icon.png')}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </TouchableOpacity>

              {/* Text Info */}
              <View className="flex-1">
                <Text className="text-white text-2xl font-bold tracking-tight" style={{ fontFamily: 'Poppins_700Bold' }}>
                  {profile?.name || profile?.phone || ''}
                </Text>
                {profile?.tagId ? (
                  <Text style={{ color: theme.primary, fontFamily: 'Poppins_400Regular', fontSize: 13, marginTop: 2 }}>{profile.tagId}</Text>
                ) : (
                  <Text className="text-[#a1a1a1] text-base font-normal mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>{profile?.phone}</Text>
                )}

                {/* Role badge */}
                <View className="flex-row items-center mt-2">
                  <Text style={{ color: theme.primary, fontSize: 13, fontFamily: 'Poppins_600SemiBold' }}>{getRoleLabel(profile?.role || '')}</Text>
                  <Ionicons name="checkmark-circle" size={14} color={theme.primary} style={{ marginLeft: 4 }} />
                </View>

                {/* Social Icons Row */}
                <View className="flex-row items-center mt-5 gap-3.5">
                  <TouchableOpacity activeOpacity={0.8}>
                    <View className="w-9 h-9 rounded-xl overflow-hidden shadow-sm">
                      <Image 
                        source={require('../../assets/skill-icons_instagram.png')} 
                        className="w-full h-full" 
                        resizeMode="cover" 
                      />
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity activeOpacity={0.8}>
                    <View className="w-9 h-9 rounded-xl overflow-hidden shadow-sm">
                      <Image 
                        source={require('../../assets/logos_facebook.png')} 
                        className="w-full h-full" 
                        resizeMode="cover" 
                      />
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity activeOpacity={0.8}>
                    <View className="w-9 h-9 rounded-xl overflow-hidden shadow-sm">
                      <Image 
                        source={require('../../assets/bi_threads-fill.png')} 
                        className="w-full h-full" 
                        resizeMode="cover" 
                      />
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    className="w-9 h-9 rounded-xl bg-[#1DA1F2] items-center justify-center shadow-sm" 
                    activeOpacity={0.8}
                  >
                    <Ionicons name="logo-twitter" size={22} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {viewMode === 'main' ? (
            <>
              {/* ══════════ MY POSTS & MY COLLABS ══════════ */}
              <View className="mx-5 mt-4 mb-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-[28px] overflow-hidden">
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, gap: 14 }}
                  activeOpacity={0.7}
                  onPress={() => router.push('/my-posts')}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: theme.primary + '33', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="images-outline" size={20} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'Poppins_500Medium' }}>My Posts</Text>
                    <Text style={{ color: '#666', fontSize: 13, fontFamily: 'Poppins_400Regular' }}>{myPosts.length} post{myPosts.length !== 1 ? 's' : ''}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#555" />
                </TouchableOpacity>

                <View style={{ height: 1, backgroundColor: '#2A2A2A', marginHorizontal: 16 }} />

                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, gap: 14 }}
                  activeOpacity={0.7}
                  onPress={() => router.push('/my-collabs')}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: theme.primary + '33', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="people-outline" size={20} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'Poppins_500Medium' }}>My Collabs</Text>
                    <Text style={{ color: '#666', fontSize: 13, fontFamily: 'Poppins_400Regular' }}>{myCollabs.length} collab{myCollabs.length !== 1 ? 's' : ''}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#555" />
                </TouchableOpacity>
              </View>

              {/* ══════════ MENU CARD ══════════ */}
              <View className="mx-5 mt-2 rounded-[28px] border border-[#2A2A2A] bg-[#0A0A0A] overflow-hidden">
                {MENU_ITEMS.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <TouchableOpacity
                      className="flex-row items-center py-4 px-5 gap-4"
                      activeOpacity={0.7}
                      onPress={() => handleMenuPress(item.id)}
                    >
                      {/* Icon circle */}
                      <View className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-white/10 justify-center items-center">
                        <Ionicons name={item.icon} size={20} color="#fff" />
                      </View>
                      <Text className="text-white text-[16px] font-medium flex-1" style={{ fontFamily: 'Poppins_500Medium' }}>{item.label}</Text>
                      <Ionicons name="chevron-forward" size={18} color="#555" />
                    </TouchableOpacity>
                    {index < MENU_ITEMS.length - 1 && (
                      <View className="h-[0.5px] bg-[#2A2A2A] mx-5" />
                    )}
                  </React.Fragment>
                ))}
              </View>

              {/* ══════════ LOGOUT BUTTON ══════════ */}
              <TouchableOpacity
                className="mx-5 mt-12 h-[72px] rounded-[24px] bg-[#FFE1E1] flex-row items-center px-6 gap-5 shadow-sm"
                activeOpacity={0.8}
                onPress={handleLogout}
              >
                <View className="w-11 h-11 rounded-full bg-[#FF0000] justify-center items-center shadow-sm">
                  <Ionicons name="log-out" size={22} color="#fff" />
                </View>
                <Text className="text-[#FF0000] text-[18px] font-bold flex-1" style={{ fontFamily: 'Poppins_700Bold' }}>Logout</Text>
                <Ionicons name="chevron-forward" size={22} color="#FF0000" />
              </TouchableOpacity>
            </>
          ) : (
            <View className="px-4 mt-8">
              <Text className="text-white text-xl font-semibold mb-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>Profile Details</Text>

              {/* Profile Details Card */}
              <View className="bg-[#121212] border border-[#222] rounded-[24px] px-2 py-4 shadow-lg shadow-black/20">
                {/* Email Row */}
                <View className="flex-row items-center gap-4 px-3 py-3 border-b border-[#222]">
                  <View className={`w-10 h-10 rounded-full bg-[#1A1A1A] items-center justify-center border ${iconBorderClass}`}>
                    <Ionicons name="mail-outline" size={18} color="#FFF" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[#666] text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>Email</Text>
                    <Text className="text-white text-[15px]" style={{ fontFamily: 'Poppins_400Regular' }}>{profile?.email || 'Not provided'}</Text>
                  </View>
                </View>

                {/* Bio Row */}
                <View className="flex-row items-start gap-4 px-3 py-3 border-b border-[#222]">
                  <View className={`w-10 h-10 rounded-full bg-[#1A1A1A] items-center justify-center border ${iconBorderClass}`}>
                    <Ionicons name="information-outline" size={24} color="#FFF" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[#666] text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>Bio</Text>
                    <Text className="text-white text-[15px] leading-5" style={{ fontFamily: 'Poppins_400Regular' }}>{profile?.bio || 'Not provided'}</Text>
                  </View>
                </View>

                {/* Location Row */}
                <View className="flex-row items-center gap-4 px-3 py-3 border-b border-[#222]">
                  <View className={`w-10 h-10 rounded-full bg-[#1A1A1A] items-center justify-center border ${iconBorderClass}`}>
                    <Ionicons name="location-outline" size={18} color="#FFF" />
                  </View>
                  <View>
                    <Text className="text-[#666] text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>Location</Text>
                    <Text className="text-white text-[15px]" style={{ fontFamily: 'Poppins_400Regular' }}>{profile?.location || 'Not provided'}</Text>
                  </View>
                </View>

                {/* Category Row */}
                <View className="flex-row items-center gap-4 px-3 py-3 border-b border-[#222]">
                  <View className={`w-10 h-10 rounded-full bg-[#1A1A1A] items-center justify-center border ${iconBorderClass}`}>
                    <Ionicons name="shapes-outline" size={18} color="#FFF" />
                  </View>
                  <View>
                    <Text className="text-[#666] text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>Category</Text>
                    <Text className="text-white text-[15px]" style={{ fontFamily: 'Poppins_400Regular' }}>{profile?.categories?.join(', ') || profile?.category || 'Not provided'}</Text>
                  </View>
                </View>

                {/* Language Row */}
                <View className="flex-row items-center gap-4 px-3 py-3">
                  <View className={`w-10 h-10 rounded-full bg-[#1A1A1A] items-center justify-center border ${iconBorderClass}`}>
                    <Ionicons name="language-outline" size={18} color="#FFF" />
                  </View>
                  <View>
                    <Text className="text-[#666] text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>Language</Text>
                    <Text className="text-white text-[15px]" style={{ fontFamily: 'Poppins_400Regular' }}>{profile?.languages?.join(', ') || 'Not provided'}</Text>
                  </View>
                </View>
              </View>

            </View>
          )}

          <View style={{ height: 40 }} />
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
