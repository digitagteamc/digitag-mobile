import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getFullProfile, getMyPosts, getUserStats, listCollaborations } from '../../services/userService';
import { useRoleTheme } from '../../theme/useRoleTheme';
import PostCard from '../../Components/PostCard';
import CompleteProfileModal from '../../Components/ui/CompleteProfileModal';

const FALLBACK_BANNER = 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=1000&auto=format&fit=crop';

interface ProfileData {
  name: string;
  phone: string;
  role: string;
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

const MENU_ITEMS = [
  { id: 'my_profile', icon: 'person-outline' as const, label: 'My Profile' },
  { id: 'saved', icon: 'heart-outline' as const, label: 'Saved Posts' },
  { id: 'my_posts', icon: 'images-outline' as const, label: 'My Posts' },
  { id: 'my_collabs', icon: 'people-outline' as const, label: 'My Collabs' },
  { id: 'settings', icon: 'settings-outline' as const, label: 'Settings' },
  { id: 'help', icon: 'help-circle-outline' as const, label: 'Help & Support' },
  { id: 'about', icon: 'information-circle-outline' as const, label: 'About DigiTag' },
];

const PROFILE_REQUIRED_ITEMS = new Set(['my_profile', 'saved', 'my_posts', 'my_collabs']);

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
              name: p.name || 'User',
              phone: userPhone || '',
              role,
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
              name: 'User',
              phone: userPhone || '',
              role: userRole || 'USER',
            });
          }
        } catch (e) {
          console.error('Profile fetch error:', e);
          setProfile({
            name: 'User',
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
    if (id === 'about') Linking.openURL('https://digitag.in/about').catch(() => {});
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
          <View className="h-[200px] w-full relative overflow-hidden">
            {/* Background image matching index.tsx */}
            <Image source={require('../../assets/images/profile_hero_bg.webp')} className="absolute inset-0 w-full h-full opacity-40" resizeMode="cover" />
            {/* Dark overlay matching index.tsx gradient */}
            <LinearGradient colors={['rgba(0,0,0,0.2)', '#000']} className="absolute inset-0" />

            {/* Back button row */}
            <View className="flex-row justify-between items-center px-4 mb-4" style={{ marginTop: Math.max(insets.top, statusBarHeight) + 8 }}>
              <TouchableOpacity className="w-[36px] h-[36px] rounded-full bg-white/12 justify-center items-center" onPress={() => {
                if (viewMode === 'details') {
                  setViewMode('main');
                } else {
                  router.back();
                }
              }}>
                <Ionicons name="arrow-back" size={20} color="#fff" />
              </TouchableOpacity>
              <View style={{ width: 36 }} />
            </View>

            {/* Avatar + Name block */}
            <View className="flex-row items-start px-4 gap-4">
              {/* Avatar */}
              <TouchableOpacity
                onPress={() => setIsPhotoModalOpen(true)}
                activeOpacity={0.9}
                className="w-[72px] h-[72px] rounded-full border-2 border-white/40 overflow-hidden bg-[#333]"
              >
                {profile?.profilePicture ? (
                  <Image
                    source={{ uri: profile.profilePicture }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <LinearGradient
                    colors={[theme.softStrong, theme.primary] as [string, string]}
                    className="w-full h-full justify-center items-center"
                  >
                    <Text className="text-white text-2xl font-bold tracking-[-0.5px]" style={{ fontFamily: 'Poppins_700Bold' }}>
                      {initials(profile?.name || 'U')}
                    </Text>
                  </LinearGradient>
                )}
              </TouchableOpacity>

              {/* Name, phone, role + social */}
              <View className="flex-1 gap-[3px]">
                <Text className="text-white text-xl font-semibold tracking-[-0.3px] leading-6" style={{ fontFamily: 'Poppins_600SemiBold' }}>{profile?.name}</Text>
                <Text className="text-[#e1e1e1] text-sm font-normal leading-5" style={{ fontFamily: 'Poppins_400Regular' }}>{profile?.phone}</Text>

                {/* Role badge with verified icon */}
                <View className="flex-row items-center mt-[2px]">
                  <Text className="text-sm font-medium tracking-[-0.14px]" style={{ fontFamily: 'Poppins_600SemiBold', color: theme.primary }}>{getRoleLabel(profile?.role || '')}</Text>
                  <Ionicons name="checkmark-circle" size={13} color={theme.primary} style={{ marginLeft: 3 }} />
                </View>

                {/* Category + location */}
                {(profile?.categories && profile.categories.length > 0) ? (
                  <Text className="text-xs font-medium mt-1" style={{ fontFamily: 'Poppins_600SemiBold', color: theme.primary }} numberOfLines={1}>
                    {profile.categories.map(c => `#${c}`).join(' ')}
                  </Text>
                ) : profile?.category ? (
                  <Text className="text-xs font-medium mt-1" style={{ fontFamily: 'Poppins_600SemiBold', color: theme.primary }}>#{profile.category}</Text>
                ) : null}
              </View>
            </View>
          </View>

          {viewMode === 'main' ? (
            <>
              {/* ══════════ FOLLOW / COLLAB COUNTS ══════════ */}
              <View className="flex-row items-center justify-center bg-[#14141C] rounded-2xl mx-4 -mt-[1px] mb-3 py-3.5 border border-[#1E1E2A]">
                <TouchableOpacity className="flex-1 items-center" onPress={() => router.push('/followers')} activeOpacity={0.7}>
                  <Text className="text-xl font-bold" style={{ fontFamily: 'Poppins_700Bold', color: theme.primary }}>{followerCount}</Text>
                  <Text className="text-[#8A8A99] text-xs mt-[2px]" style={{ fontFamily: 'Poppins_400Regular' }}>Followers</Text>
                </TouchableOpacity>
                <View className="w-[1px] h-8 bg-[#2A2A36]" />
                <TouchableOpacity className="flex-1 items-center" onPress={() => router.push('/following')} activeOpacity={0.7}>
                  <Text className="text-xl font-bold" style={{ fontFamily: 'Poppins_700Bold', color: theme.primary }}>{followingCount}</Text>
                  <Text className="text-[#8A8A99] text-xs mt-[2px]" style={{ fontFamily: 'Poppins_400Regular' }}>Following</Text>
                </TouchableOpacity>
                <View className="w-[1px] h-8 bg-[#2A2A36]" />
                <TouchableOpacity className="flex-1 items-center" onPress={() => router.push('/my-collabs')} activeOpacity={0.7}>
                  <Text className="text-xl font-bold" style={{ fontFamily: 'Poppins_700Bold', color: theme.primary }}>{collabCount}</Text>
                  <Text className="text-[#8A8A99] text-xs mt-[2px]" style={{ fontFamily: 'Poppins_400Regular' }}>Collabs</Text>
                </TouchableOpacity>
              </View>

              {/* ══════════ ROLE STATS CARD ══════════ */}
              {/* {profile && profile.role === 'CREATOR' && (
                <View className="mx-4 mt-[14px] bg-white/5 border border-white/10 rounded-2xl p-3.5 gap-2.5">
                  {(profile.instagramHandle || profile.youtubeHandle || profile.twitterHandle) && (
                    <View className="flex-row gap-3.5 flex-wrap">
                      {profile.instagramHandle && (
                        <View className="items-center gap-[2px]">
                          <Ionicons name="logo-instagram" size={15} color="#E1306C" />
                          <Text className="text-white text-[13px] font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>{fmtCount(profile.instagramFollowers)}</Text>
                          <Text className="text-[#8A8A99] text-[10px]" style={{ fontFamily: 'Poppins_400Regular' }}>@{profile.instagramHandle}</Text>
                        </View>
                      )}
                      {profile.youtubeHandle && (
                        <View className="items-center gap-[2px]">
                          <Ionicons name="logo-youtube" size={15} color="#FF0000" />
                          <Text className="text-white text-[13px] font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>{fmtCount(profile.youtubeFollowers)}</Text>
                          <Text className="text-[#8A8A99] text-[10px]" style={{ fontFamily: 'Poppins_400Regular' }}>@{profile.youtubeHandle}</Text>
                        </View>
                      )}
                      {profile.twitterHandle && (
                        <View className="items-center gap-[2px]">
                          <Ionicons name="logo-twitter" size={15} color="#1DA1F2" />
                          <Text className="text-white text-[13px] font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>{fmtCount(profile.twitterFollowers)}</Text>
                          <Text className="text-[#8A8A99] text-[10px]" style={{ fontFamily: 'Poppins_400Regular' }}>@{profile.twitterHandle}</Text>
                        </View>
                      )}
                    </View>
                  )}
                  <View className="flex-row gap-2 flex-wrap">
                    <View className={`flex-row items-center gap-[5px] rounded-full px-2.5 py-1 ${profile.isAvailableForCollab ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>
                      <View className={`w-1.5 h-1.5 rounded-full ${profile.isAvailableForCollab ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`} />
                      <Text className={`text-xs font-semibold ${profile.isAvailableForCollab ? 'text-[#10B981]' : 'text-[#EF4444]'}`} style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        {profile.isAvailableForCollab ? 'Open to Collabs' : 'Not Available'}
                      </Text>
                    </View>
                    {profile.preferredCollabType && (
                      <View className="rounded-full px-2.5 py-1 border" style={{ backgroundColor: theme.soft, borderColor: theme.border }}>
                        <Text className="text-xs font-semibold" style={{ fontFamily: 'Poppins_600SemiBold', color: theme.primary }}>{profile.preferredCollabType}</Text>
                      </View>
                    )}
                  </View>
                  {profile.bio ? <Text className="text-[#C0C0CC] text-[13px] leading-[19px]" style={{ fontFamily: 'Poppins_400Regular' }}>{profile.bio}</Text> : null}
                </View>
              )}

              {profile && profile.role === 'FREELANCER' && (
                <View className="mx-4 mt-[14px] bg-white/5 border border-white/10 rounded-2xl p-3.5 gap-2.5">
                  <View className="flex-row gap-2 flex-wrap">
                    {(() => {
                      const c = availColor(profile.availability); return (
                        <View className="flex-row items-center gap-[5px] rounded-full px-2.5 py-1" style={{ backgroundColor: c.bg }}>
                          <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.dot }} />
                          <Text className="text-xs font-semibold" style={{ fontFamily: 'Poppins_600SemiBold', color: c.text }}>{fmtAvailability(profile.availability)}</Text>
                        </View>
                      );
                    })()}
                    {profile.experienceLevel && (
                      <View className="rounded-full px-2.5 py-1 border" style={{ backgroundColor: theme.soft, borderColor: theme.border }}>
                        <Text className="text-xs font-semibold" style={{ fontFamily: 'Poppins_600SemiBold', color: theme.primary }}>{profile.experienceLevel}</Text>
                      </View>
                    )}
                    {profile.hourlyRate ? (
                      <View className="bg-[#10B981]/12 border border-[#10B981]/35 rounded-full px-2.5 py-1">
                        <Text className="text-[#10B981] text-xs font-semibold" style={{ fontFamily: 'Poppins_600SemiBold' }}>₹{profile.hourlyRate}/hr</Text>
                      </View>
                    ) : null}
                  </View>
                  {profile.skills && profile.skills.length > 0 && (
                    <View className="flex-row flex-wrap gap-1.5">
                      {profile.skills.slice(0, 6).map((skill, i) => (
                        <View key={i} className="rounded-full px-2.5 py-1 border" style={{ backgroundColor: theme.soft, borderColor: theme.border }}>
                          <Text className="text-xs" style={{ fontFamily: 'Poppins_400Regular', color: theme.primary }}>{skill}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {profile.bio ? <Text className="text-[#C0C0CC] text-[13px] leading-[19px]" style={{ fontFamily: 'Poppins_400Regular' }}>{profile.bio}</Text> : null}
                  {profile.portfolioUrl ? (
                    <TouchableOpacity onPress={() => openLink(profile.portfolioUrl)} className="flex-row items-center gap-[5px]">
                      <Ionicons name="link-outline" size={13} color={theme.primary} />
                      <Text className="text-[13px]" style={{ fontFamily: 'Poppins_400Regular', color: theme.primary }}>View Portfolio</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              )} */}


              {/* ══════════ MENU CARD ══════════ */}
              <View className="mx-4 mt-5 rounded-2xl border border-[#9C9C9C]/50 overflow-hidden relative px-4 py-2">
                <View className="absolute inset-0 bg-black/30" />
                <View className="absolute inset-0 rounded-2xl shadow-lg shadow-[#323232]" />

                {MENU_ITEMS.map((item, index) => {
                  return (
                    <React.Fragment key={item.id}>
                      <TouchableOpacity className="flex-row items-center py-3.5 gap-3" activeOpacity={0.7} onPress={() => handleMenuPress(item.id)}>
                        {/* Icon pill */}
                        <View className="w-[36px] h-[36px] rounded-full bg-[#323232]/15 border justify-center items-center" style={{ borderColor: theme.border }}>
                          <Ionicons name={item.icon} size={16} color={theme.primary} />
                        </View>
                        <Text className="text-white text-base font-normal flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>{item.label}</Text>
                        <Ionicons name="chevron-forward" size={14} color="#9a9a9a" />
                      </TouchableOpacity>

                      {/* Divider (not after last item) */}
                      {index < MENU_ITEMS.length - 1 && <View className="h-[1px] bg-[#9C9C9C]/25" />}
                    </React.Fragment>
                  )
                })}
              </View>

              {/* ══════════ LOGOUT BUTTON ══════════ */}
              <TouchableOpacity className="mx-4 mt-4 h-16 rounded-2xl bg-[#ffe1e1] flex-row items-center px-4 gap-4 shadow-md elevation-4" activeOpacity={0.8} onPress={handleLogout}>
                <View className="w-8 h-8 rounded-full bg-[#e30000] justify-center items-center">
                  <Ionicons name="log-out-outline" size={16} color="#fff" />
                </View>
                <Text className="text-[#e30000] text-base font-semibold flex-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>Logout</Text>
                <Ionicons name="chevron-forward" size={14} color="#e30000" />
              </TouchableOpacity>

            </>
          ) : (
            <View className="px-4 mt-6">
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
              {profile?.profilePicture ? (
                <Image
                  source={{ uri: profile.profilePicture }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <LinearGradient
                  colors={[theme.softStrong, theme.primary] as [string, string]}
                  className="w-full h-full justify-center items-center"
                >
                  <Text className="text-white text-6xl font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>
                    {initials(profile?.name || 'U')}
                  </Text>
                </LinearGradient>
              )}
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
