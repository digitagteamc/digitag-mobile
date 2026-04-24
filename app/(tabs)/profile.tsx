import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getFullProfile, getMyPosts, getUserStats, listCollaborations } from '../../services/userService';
import { useRoleTheme } from '../../theme/useRoleTheme';

// ── Figma background blur image (dark photo)
const HERO_BG = 'http://localhost:3845/assets/595d43e9722ebfd6a20e39509f33138336aa83fe.png';

interface ProfileData {
  name: string;
  phone: string;
  role: string;
  profilePicture?: string | null;
  bio?: string | null;
  category?: string | null;
  categories?: string[] | null;
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
  { id: 'edit_profile', icon: 'create-outline' as const, label: 'Edit Profile' },
  { id: 'saved', icon: 'heart-outline' as const, label: 'Saved Posts' },
  { id: 'settings', icon: 'settings-outline' as const, label: 'Settings' },
  { id: 'help', icon: 'help-circle-outline' as const, label: 'Help & Support' },
  { id: 'about', icon: 'information-circle-outline' as const, label: 'About Digitag' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { token, isGuest, userPhone, userRole, userId, logout, setProfiles } = useAuth();
  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

  const theme = useRoleTheme();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      <SafeAreaView style={styles.safe}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingTop: statusBarHeight }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ══════════ HERO HEADER ══════════ */}
          <View style={styles.heroContainer}>
            {/* Blurred background with dark overlay */}
            <Image source={{ uri: HERO_BG }} style={styles.heroBg} blurRadius={3} />
            <View style={styles.heroDarkOverlay} />

            {/* Back button row */}
            <View style={[styles.heroTopRow, { marginTop: statusBarHeight + 8 }]}>
              <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuBtn}>
                <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Avatar + Name block */}
            <View style={styles.heroContent}>
              {/* Avatar */}
              <View style={styles.avatarRing}>
                {profile?.profilePicture ? (
                  <Image
                    source={{ uri: profile.profilePicture }}
                    style={styles.avatarImg}
                    resizeMode="cover"
                  />
                ) : (
                  <LinearGradient
                    colors={[theme.softStrong, theme.primary] as [string, string]}
                    style={styles.avatarFallback}
                  >
                    <Text style={styles.avatarInitials}>
                      {initials(profile?.name || 'U')}
                    </Text>
                  </LinearGradient>
                )}
              </View>

              {/* Name, phone, role + social */}
              <View style={styles.nameBlock}>
                <Text style={styles.nameText}>{profile?.name}</Text>
                <Text style={styles.phoneText}>{profile?.phone}</Text>

                {/* Role badge with verified icon */}
                <View style={styles.rolePill}>
                  <Text style={styles.roleText}>{getRoleLabel(profile?.role || '')}</Text>
                  <Ionicons name="checkmark-circle" size={13} color="#ed2a91" style={{ marginLeft: 3 }} />
                </View>

                {/* Category + location */}
                {(profile?.categories && profile.categories.length > 0) ? (
                  <Text style={[styles.categoryText, { color: theme.primary }]} numberOfLines={1}>
                    {profile.categories.map(c => `#${c}`).join(' ')}
                  </Text>
                ) : profile?.category ? (
                  <Text style={[styles.categoryText, { color: theme.primary }]}>#{profile.category}</Text>
                ) : null}
              </View>
            </View>
          </View>

          {/* ══════════ FOLLOW / COLLAB COUNTS ══════════ */}
          <View style={styles.countsRow}>
            <View style={styles.countItem}>
              <Text style={[styles.countValue, { color: theme.primary }]}>{followerCount}</Text>
              <Text style={styles.countLabel}>Followers</Text>
            </View>
            <View style={styles.countDivider} />
            <View style={styles.countItem}>
              <Text style={[styles.countValue, { color: theme.primary }]}>{followingCount}</Text>
              <Text style={styles.countLabel}>Following</Text>
            </View>
            <View style={styles.countDivider} />
            <View style={styles.countItem}>
              <Text style={[styles.countValue, { color: theme.primary }]}>{collabCount}</Text>
              <Text style={styles.countLabel}>Collabs</Text>
            </View>
          </View>

          {/* ══════════ ROLE STATS CARD ══════════ */}
          {profile && profile.role === 'CREATOR' && (
            <View style={styles.statsCard}>
              {(profile.instagramHandle || profile.youtubeHandle || profile.twitterHandle) && (
                <View style={styles.socialStatsRow}>
                  {profile.instagramHandle && (
                    <View style={styles.socialStat}>
                      <Ionicons name="logo-instagram" size={15} color="#E1306C" />
                      <Text style={styles.socialStatCount}>{fmtCount(profile.instagramFollowers)}</Text>
                      <Text style={styles.socialStatHandle}>@{profile.instagramHandle}</Text>
                    </View>
                  )}
                  {profile.youtubeHandle && (
                    <View style={styles.socialStat}>
                      <Ionicons name="logo-youtube" size={15} color="#FF0000" />
                      <Text style={styles.socialStatCount}>{fmtCount(profile.youtubeFollowers)}</Text>
                      <Text style={styles.socialStatHandle}>@{profile.youtubeHandle}</Text>
                    </View>
                  )}
                  {profile.twitterHandle && (
                    <View style={styles.socialStat}>
                      <Ionicons name="logo-twitter" size={15} color="#1DA1F2" />
                      <Text style={styles.socialStatCount}>{fmtCount(profile.twitterFollowers)}</Text>
                      <Text style={styles.socialStatHandle}>@{profile.twitterHandle}</Text>
                    </View>
                  )}
                </View>
              )}
              <View style={styles.badgeRow}>
                <View style={[styles.availBadge, {
                  backgroundColor: profile.isAvailableForCollab ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                }]}>
                  <View style={[styles.availDot, { backgroundColor: profile.isAvailableForCollab ? '#10B981' : '#EF4444' }]} />
                  <Text style={[styles.availText, { color: profile.isAvailableForCollab ? '#10B981' : '#EF4444' }]}>
                    {profile.isAvailableForCollab ? 'Open to Collabs' : 'Not Available'}
                  </Text>
                </View>
                {profile.preferredCollabType && (
                  <View style={[styles.collabTypeBadge, { backgroundColor: theme.soft, borderColor: theme.border }]}>
                    <Text style={[styles.collabTypeText, { color: theme.primary }]}>{profile.preferredCollabType}</Text>
                  </View>
                )}
              </View>
              {profile.bio ? <Text style={styles.bioText}>{profile.bio}</Text> : null}
            </View>
          )}

          {profile && profile.role === 'FREELANCER' && (
            <View style={styles.statsCard}>
              <View style={styles.badgeRow}>
                {(() => {
                  const c = availColor(profile.availability); return (
                    <View style={[styles.availBadge, { backgroundColor: c.bg }]}>
                      <View style={[styles.availDot, { backgroundColor: c.dot }]} />
                      <Text style={[styles.availText, { color: c.text }]}>{fmtAvailability(profile.availability)}</Text>
                    </View>
                  );
                })()}
                {profile.experienceLevel && (
                  <View style={[styles.expBadge, { backgroundColor: theme.soft, borderColor: theme.border }]}>
                    <Text style={[styles.expText, { color: theme.primary }]}>{profile.experienceLevel}</Text>
                  </View>
                )}
                {profile.hourlyRate ? (
                  <View style={styles.rateBadge}>
                    <Text style={styles.rateText}>₹{profile.hourlyRate}/hr</Text>
                  </View>
                ) : null}
              </View>
              {profile.skills && profile.skills.length > 0 && (
                <View style={styles.skillsRow}>
                  {profile.skills.slice(0, 6).map((skill, i) => (
                    <View key={i} style={[styles.skillChip, { backgroundColor: theme.soft, borderColor: theme.border }]}>
                      <Text style={[styles.skillChipText, { color: theme.primary }]}>{skill}</Text>
                    </View>
                  ))}
                </View>
              )}
              {profile.bio ? <Text style={styles.bioText}>{profile.bio}</Text> : null}
              {profile.portfolioUrl ? (
                <TouchableOpacity onPress={() => openLink(profile.portfolioUrl)} style={styles.portfolioRow}>
                  <Ionicons name="link-outline" size={13} color={theme.primary} />
                  <Text style={[styles.portfolioText, { color: theme.primary }]}>View Portfolio</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}

          {/* ══════════ MY POSTS ══════════ */}
          {myPosts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>My Posts</Text>
              {myPosts.map(post => (
                <View key={post.id} style={styles.postItem}>
                  {post.imageUrl ? (
                    <Image source={{ uri: post.imageUrl }} style={styles.postThumb} />
                  ) : (
                    <View style={[styles.postThumb, styles.postThumbPlaceholder]}>
                      <Ionicons name="image-outline" size={20} color="#555" />
                    </View>
                  )}
                  <View style={styles.postItemBody}>
                    <Text style={styles.postItemDesc} numberOfLines={2}>{post.description}</Text>
                    <View style={styles.postItemMeta}>
                      <View style={[styles.postTypeBadge, { backgroundColor: theme.soft, borderColor: theme.border }]}>
                        <Text style={[styles.postTypeText, { color: theme.primary }]}>
                          {post.collaborationType === 'PAID' ? 'Paid' : 'Free'}
                        </Text>
                      </View>
                      <Text style={styles.postItemTime}>{timeAgo(post.createdAt)}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ══════════ MY COLLABS ══════════ */}
          {myCollabs.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>My Collabs</Text>
              {myCollabs.map(collab => {
                const other = collab.sender?.id === userId ? collab.receiver : collab.sender;
                const otherProfile = other?.creatorProfile || other?.freelancerProfile;
                const otherName = otherProfile?.name || other?.role || 'User';
                const description = collab.post?.description || collab.message || '';
                return (
                  <TouchableOpacity
                    key={collab.id}
                    style={styles.collabItem}
                    activeOpacity={0.8}
                    onPress={() => other?.id && router.push({ pathname: '/creator-details', params: { userId: other.id } } as any)}
                  >
                    <View style={[styles.collabAvatar, { backgroundColor: theme.soft, borderColor: theme.border }]}>
                      <Text style={[styles.collabAvatarText, { color: theme.primary }]}>
                        {otherName.slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.collabItemBody}>
                      <Text style={styles.collabItemName}>{otherName}</Text>
                      <Text style={styles.collabItemRole}>{other?.role?.toLowerCase() || ''}</Text>
                      {description ? (
                        <Text style={styles.collabItemDesc} numberOfLines={2}>{description}</Text>
                      ) : null}
                    </View>
                    <View style={[styles.collabStatusBadge, { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.3)' }]}>
                      <Text style={{ color: '#10B981', fontSize: 11, fontWeight: '600' }}>Accepted</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* ══════════ MENU CARD ══════════ */}
          <View style={styles.menuCard}>
            <View style={styles.menuCardBlur} />
            <View style={styles.menuCardInset} />

            {MENU_ITEMS.map((item, index) => {
              return (
                <React.Fragment key={item.id}>
                  <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => handleMenuPress(item.id)}>
                    {/* Icon pill */}
                    <View style={[styles.menuIconPill, { borderColor: theme.border }]}>
                      <Ionicons name={item.icon} size={16} color={theme.primary} />
                    </View>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <Ionicons name="chevron-forward" size={14} color="#9a9a9a" />
                  </TouchableOpacity>

                  {/* Divider (not after last item) */}
                  {index < MENU_ITEMS.length - 1 && <View style={styles.menuDivider} />}
                </React.Fragment>
              )
            })}
          </View>

          {/* ══════════ LOGOUT BUTTON ══════════ */}
          <TouchableOpacity style={styles.logoutCard} activeOpacity={0.8} onPress={handleLogout}>
            <View style={styles.logoutIconCircle}>
              <Ionicons name="log-out-outline" size={16} color="#fff" />
            </View>
            <Text style={styles.logoutText}>Logout</Text>
            <Ionicons name="chevron-forward" size={14} color="#e30000" />
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Bottom nav rendered globally by (tabs)/_layout.tsx. */}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#060606',
  },
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#060606',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Hero
  heroContainer: {
    height: 305,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  heroBg: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroDarkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  heroContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    gap: 16,
  },
  avatarRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    overflow: 'hidden',
    backgroundColor: '#333',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },

  nameBlock: {
    flex: 1,
    gap: 3,
  },
  nameText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  phoneText: {
    color: '#e1e1e1',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  roleText: {
    color: '#ed2a91',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.14,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  socialIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Menu card
  menuCard: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(156,156,156,0.5)',
    overflow: 'hidden',
    position: 'relative',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  menuCardBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  menuCardInset: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },

  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  menuIconPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(50,50,50,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(242,105,48,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
    flex: 1,
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(156,156,156,0.25)',
    marginLeft: 0,
  },

  // ── Logout
  logoutCard: {
    marginHorizontal: 16,
    marginTop: 16,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#ffe1e1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e30000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    color: '#e30000',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: '#15151A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#222',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  tabBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePillTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFDCEE',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 8,
  },
  activePillText: {
    color: '#ED2A91',
    fontWeight: '800',
    fontSize: 14,
  },

  categoryText: { color: '#A78BFA', fontSize: 12, fontWeight: '500', marginTop: 4 },

  // ── Role stats card
  statsCard: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  socialStatsRow: { flexDirection: 'row', gap: 14, flexWrap: 'wrap' },
  socialStat: { alignItems: 'center', gap: 2 },
  socialStatCount: { color: '#fff', fontSize: 13, fontWeight: '700' },
  socialStatHandle: { color: '#8A8A99', fontSize: 10 },

  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  availBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  availDot: { width: 6, height: 6, borderRadius: 3 },
  availText: { fontSize: 12, fontWeight: '600' },
  collabTypeBadge: {
    backgroundColor: 'rgba(115,82,221,0.15)', borderWidth: 1, borderColor: 'rgba(115,82,221,0.35)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  collabTypeText: { color: '#A78BFA', fontSize: 12, fontWeight: '600' },

  expBadge: {
    backgroundColor: 'rgba(242,105,48,0.12)', borderWidth: 1, borderColor: 'rgba(242,105,48,0.35)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  expText: { color: '#F26930', fontSize: 12, fontWeight: '600' },
  rateBadge: {
    backgroundColor: 'rgba(16,185,129,0.12)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.35)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  rateText: { color: '#10B981', fontSize: 12, fontWeight: '600' },

  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillChip: {
    backgroundColor: 'rgba(242,105,48,0.12)', borderWidth: 1, borderColor: 'rgba(242,105,48,0.3)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  skillChipText: { color: '#F26930', fontSize: 12 },

  bioText: { color: '#C0C0CC', fontSize: 13, lineHeight: 19 },
  portfolioRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  portfolioText: { color: '#A58BFF', fontSize: 13 },
  countsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#14141C', borderRadius: 16, marginHorizontal: 16,
    marginTop: -1, marginBottom: 12, paddingVertical: 14,
    borderWidth: 1, borderColor: '#1E1E2A',
  },
  countItem: { flex: 1, alignItems: 'center' },
  countValue: { fontSize: 20, fontWeight: '700' },
  countLabel: { color: '#8A8A99', fontSize: 12, marginTop: 2 },
  countDivider: { width: 1, height: 32, backgroundColor: '#2A2A36' },

  section: { marginHorizontal: 16, marginTop: 20 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },

  postItem: {
    flexDirection: 'row', gap: 12, marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 10,
  },
  postThumb: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#1C1C24' },
  postThumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  postItemBody: { flex: 1, justifyContent: 'space-between' },
  postItemDesc: { color: '#fff', fontSize: 13, lineHeight: 18 },
  postItemMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  postTypeBadge: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  postTypeText: { fontSize: 11, fontWeight: '600' },
  postItemTime: { color: '#8A8A99', fontSize: 11 },

  collabItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 12,
  },
  collabAvatar: {
    width: 42, height: 42, borderRadius: 21, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  collabAvatarText: { fontSize: 14, fontWeight: '700' },
  collabItemBody: { flex: 1 },
  collabItemName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  collabItemRole: { color: '#8A8A99', fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
  collabStatusBadge: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  collabItemDesc: { color: '#8A8A99', fontSize: 12, marginTop: 3, lineHeight: 16 },
});
