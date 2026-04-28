import { Ionicons } from '@expo/vector-icons';
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
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getFullProfile, getMyPosts, getUserStats, listCollaborations } from '../../services/userService';
import { useRoleTheme } from '../../theme/useRoleTheme';



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
  { id: 'settings', icon: 'settings-outline' as const, label: 'Settings' },
  { id: 'help', icon: 'help-circle-outline' as const, label: 'Help & Support' },
  { id: 'about', icon: 'information-circle-outline' as const, label: 'About Digitag' },
];

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
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [collabCount, setCollabCount] = useState(0);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [myCollabs, setMyCollabs] = useState<any[]>([]);

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

  const handleMenuPress = (id: string) => {
    if (id === 'edit_profile') {
      const editPath = userRole?.toUpperCase() === 'FREELANCER' ? '/signup/freelancer' : '/signup/creator';
      router.push(editPath as any);
    }
    if (id === 'my_profile') setViewMode('details');
    if (id === 'about') router.push('/about-digitag');
    if (id === 'help') router.push('/help-support' as any);
    if (id === 'saved') router.push('/saved-posts');
    if (id === 'settings') router.push('/settings' as any);
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
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ══════════ HERO HEADER ══════════ */}
          <View className="h-[200px] w-full relative overflow-hidden">
            {/* Background image matching index.tsx */}
            <Image source={require('../../assets/images/profile_hero_bg.jpg')} className="absolute inset-0 w-full h-full opacity-40" resizeMode="cover" />
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
              <TouchableOpacity className="w-[36px] h-[36px] rounded-full justify-center items-center" onPress={() => setIsMenuOpen(true)}>
                <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Avatar + Name block */}
            <View className="flex-row items-start px-4 gap-4">
              {/* Avatar */}
              <View className="w-[72px] h-[72px] rounded-full border-2 border-white/40 overflow-hidden bg-[#333]">
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
              </View>

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
                <View className="flex-1 items-center">
                  <Text className="text-xl font-bold" style={{ fontFamily: 'Poppins_700Bold', color: theme.primary }}>{followerCount}</Text>
                  <Text className="text-[#8A8A99] text-xs mt-[2px]" style={{ fontFamily: 'Poppins_400Regular' }}>Followers</Text>
                </View>
                <View className="w-[1px] h-8 bg-[#2A2A36]" />
                <View className="flex-1 items-center">
                  <Text className="text-xl font-bold" style={{ fontFamily: 'Poppins_700Bold', color: theme.primary }}>{followingCount}</Text>
                  <Text className="text-[#8A8A99] text-xs mt-[2px]" style={{ fontFamily: 'Poppins_400Regular' }}>Following</Text>
                </View>
                <View className="w-[1px] h-8 bg-[#2A2A36]" />
                <View className="flex-1 items-center">
                  <Text className="text-xl font-bold" style={{ fontFamily: 'Poppins_700Bold', color: theme.primary }}>{collabCount}</Text>
                  <Text className="text-[#8A8A99] text-xs mt-[2px]" style={{ fontFamily: 'Poppins_400Regular' }}>Collabs</Text>
                </View>
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

              {/* ══════════ MY POSTS ══════════ */}
              {myPosts.length > 0 && (
                <View className="mx-4 mt-5">
                  <Text className="text-white text-base font-bold mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>My Posts</Text>
                  {myPosts.map(post => (
                    <View key={post.id} className="flex-row gap-3 mb-3 bg-white/5 rounded-xl border border-white/10 p-2.5">
                      {post.imageUrl ? (
                        <Image source={{ uri: post.imageUrl }} className="w-[60px] h-[60px] rounded-lg bg-[#1C1C24]" />
                      ) : (
                        <View className="w-[60px] h-[60px] rounded-lg bg-[#1C1C24] items-center justify-center">
                          <Ionicons name="image-outline" size={20} color="#555" />
                        </View>
                      )}
                      <View className="flex-1 justify-between">
                        <Text className="text-white text-[13px] leading-[18px]" numberOfLines={2} style={{ fontFamily: 'Poppins_400Regular' }}>{post.description}</Text>
                        <View className="flex-row items-center gap-2 mt-1">
                          <View className="rounded-full border px-2 py-0.5" style={{ backgroundColor: theme.soft, borderColor: theme.border }}>
                            <Text className="text-[11px] font-semibold" style={{ fontFamily: 'Poppins_600SemiBold', color: theme.primary }}>
                              {post.collaborationType === 'PAID' ? 'Paid' : 'Free'}
                            </Text>
                          </View>
                          <Text className="text-[#8A8A99] text-[11px]" style={{ fontFamily: 'Poppins_400Regular' }}>{timeAgo(post.createdAt)}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* ══════════ MY COLLABS ══════════ */}
              {myCollabs.length > 0 && (
                <View className="mx-4 mt-5">
                  <Text className="text-white text-base font-bold mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>My Collabs</Text>
                  {myCollabs.map(collab => {
                    const other = collab.sender?.id === userId ? collab.receiver : collab.sender;
                    const otherProfile = other?.creatorProfile || other?.freelancerProfile;
                    const otherName = otherProfile?.name || other?.role || 'User';
                    const description = collab.post?.description || collab.message || '';
                    return (
                      <TouchableOpacity
                        key={collab.id}
                        className="flex-row items-center gap-3 mb-2.5 bg-white/5 rounded-xl border border-white/10 p-3"
                        activeOpacity={0.8}
                        onPress={() => other?.id && router.push({ pathname: '/creator-details', params: { userId: other.id } } as any)}
                      >
                        <View className="w-[42px] h-[42px] rounded-full border items-center justify-center" style={{ backgroundColor: theme.soft, borderColor: theme.border }}>
                          <Text className="text-sm font-bold" style={{ fontFamily: 'Poppins_700Bold', color: theme.primary }}>
                            {otherName.slice(0, 2).toUpperCase()}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-white text-sm font-semibold" style={{ fontFamily: 'Poppins_600SemiBold' }}>{otherName}</Text>
                          <Text className="text-[#8A8A99] text-xs mt-[2px] capitalize" style={{ fontFamily: 'Poppins_400Regular' }}>{other?.role?.toLowerCase() || ''}</Text>
                          {description ? (
                            <Text className="text-[#8A8A99] text-xs mt-[3px] leading-4" numberOfLines={2} style={{ fontFamily: 'Poppins_400Regular' }}>{description}</Text>
                          ) : null}
                        </View>
                        <View className="rounded-full border px-2 py-[3px] bg-[#10B981]/12 border-[#10B981]/30">
                          <Text className="text-[#10B981] text-[11px] font-semibold" style={{ fontFamily: 'Poppins_600SemiBold' }}>Accepted</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

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

              {/* Posts Button */}
              <TouchableOpacity className="mt-6 bg-[#1A1A1A] border border-[#222] rounded-[24px] p-4 flex-row justify-between items-center shadow-lg shadow-black/20" activeOpacity={0.8} onPress={() => setViewMode('main')}>
                <View className="flex-row items-center gap-4">
                  <View className={`w-10 h-10 rounded-full bg-[#111] items-center justify-center border ${iconBorderClass}`}>
                    <Ionicons name="aperture-outline" size={18} color="#FFF" />
                  </View>
                  <Text className="text-white text-[16px] font-medium" style={{ fontFamily: 'Poppins_600SemiBold' }}>Posts</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#FFF" />
              </TouchableOpacity>

              {/* Collab Button */}
              <TouchableOpacity className="mt-4 bg-[#1A1A1A] border border-[#222] rounded-[24px] p-4 flex-row justify-between items-center shadow-lg shadow-black/20" activeOpacity={0.8} onPress={() => setViewMode('main')}>
                <View className="flex-row items-center gap-4">
                  <View className={`w-10 h-10 rounded-full bg-[#111] items-center justify-center border ${iconBorderClass}`}>
                    <Ionicons name="people-outline" size={18} color="#FFF" />
                  </View>
                  <Text className="text-white text-[16px] font-medium" style={{ fontFamily: 'Poppins_600SemiBold' }}>Collab</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#FFF" />
              </TouchableOpacity>

            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      {/* ══════════ DROPDOWN MENU ══════════ */}
      <Modal visible={isMenuOpen} transparent animationType="fade">
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={() => setIsMenuOpen(false)}
        >
          <View
            className="absolute bg-[#1c1c1c] rounded-3xl w-[230px] p-2"
            style={{
              top: Math.max(insets.top, statusBarHeight) + 10,
              right: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.5,
              shadowRadius: 15,
              elevation: 10
            }}
          >
            {/* Edit Profile */}
            <TouchableOpacity
              className="flex-row items-center gap-4 p-3 border-b border-[#333]"
              onPress={() => { setIsMenuOpen(false); handleMenuPress('edit_profile'); }}
            >
              <View className="w-11 h-11 rounded-full bg-[#333] items-center justify-center border border-[#444]">
                <Ionicons name="pencil-outline" size={18} color="#fff" />
              </View>
              <Text className="text-white text-[15px] font-medium" style={{ fontFamily: 'Poppins_600SemiBold' }}>Edit Profile</Text>
            </TouchableOpacity>

            {/* Share Profile */}
            <TouchableOpacity
              className="flex-row items-center gap-4 p-3 border-b border-[#333]"
              onPress={() => { setIsMenuOpen(false); /* implement share */ }}
            >
              <View className="w-11 h-11 rounded-full bg-[#333] items-center justify-center border border-[#444]">
                <Ionicons name="share-social-outline" size={18} color="#fff" />
              </View>
              <Text className="text-white text-[15px] font-medium" style={{ fontFamily: 'Poppins_600SemiBold' }}>Share Profile</Text>
            </TouchableOpacity>

            {/* Logout */}
            <TouchableOpacity
              className="flex-row items-center gap-4 p-3"
              onPress={() => { setIsMenuOpen(false); handleLogout(); }}
            >
              <View className="w-11 h-11 rounded-full bg-[#E30000] items-center justify-center">
                <Ionicons name="log-out-outline" size={18} color="#fff" />
              </View>
              <Text className="text-[#E30000] text-[15px] font-medium" style={{ fontFamily: 'Poppins_600SemiBold' }}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Bottom nav rendered globally by (tabs)/_layout.tsx. */}
    </View>
  );
}
