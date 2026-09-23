/**
 * BrandProfileScreen — implements the "Brand-profile-view" design from Figma
 * node 9538-18223. Displays brand header card, stats grid, social links,
 * campaigns, team members, and creator reviews.
 *
 * Preserves existing navigation / auth functionality — no tab or routing
 * changes are made here.
 */
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getMyBrandProfile } from '../../services/userService';

/* ─── colour tokens ────────────────────────────────────────────── */
const PURPLE = '#6C47FF';
const PURPLE_LIGHT = 'rgba(108,71,255,0.12)';
const MINT = '#BFF7E5';
const MINT_LIGHT = 'rgba(191,247,229,0.12)';
const CARD_BG = '#0F0F18';
const SURFACE = '#141423';
const BORDER = 'rgba(255,255,255,0.09)';
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_SECONDARY = '#9D9DB5';
const TEXT_MUTED = '#55556A';

/* ─── static placeholder data (replaced by real API data when available) ─── */
const PLACEHOLDER_STATS = [
  { value: '128', label: 'Campaigns Run' },
  { value: '340', label: 'Creators Partnered' },
  { value: '42M', label: 'Total Reach' },
  { value: '4.8★', label: 'Avg Rating' },
];

interface SocialCard {
  platform: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  followers?: string;
  handle?: string;
  url?: string;
}

interface CampaignItem {
  id: string;
  title: string;
  dates: string;
  creatorsCount: number;
  status: 'Active' | 'Completed' | 'Upcoming';
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

interface ReviewItem {
  id: string;
  reviewer: string;
  rating: number;
  text: string;
  avatar?: string;
}

interface BrandProfile {
  id?: string;
  name?: string;
  businessName?: string;
  category?: string;
  location?: string;
  website?: string;
  bio?: string;
  profilePicture?: string;
  partnerSince?: string;
  instagramHandle?: string;
  instagramFollowers?: number;
  youtubeHandle?: string;
  twitterHandle?: string;
  email?: string;
}

function ratingStars(rating: number): string {
  return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
}

function statusColor(status: CampaignItem['status']) {
  switch (status) {
    case 'Active': return { bg: 'rgba(16,185,129,0.14)', text: '#10B981', border: 'rgba(16,185,129,0.3)' };
    case 'Completed': return { bg: 'rgba(120,120,160,0.14)', text: '#9D9DB5', border: 'rgba(120,120,160,0.3)' };
    case 'Upcoming': return { bg: 'rgba(108,71,255,0.14)', text: PURPLE, border: 'rgba(108,71,255,0.3)' };
  }
}

/* ═══════════════════════════════════════════════════════════════ */
export default function BrandProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, logout } = useAuth();

  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCampaignTab, setActiveCampaignTab] = useState<'Active' | 'Past'>('Active');
  const [showDropdown, setShowDropdown] = useState(false);

  /* ── fetch ── */
  const fetchBrand = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await getMyBrandProfile(token);
      if (res.success && res.data) {
        setBrandProfile(res.data);
      }
    } catch (e) {
      console.warn('BrandProfileScreen fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchBrand(); }, [fetchBrand]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBrand();
    setRefreshing(false);
  }, [fetchBrand]);

  /* ── derived values ── */
  const displayName = brandProfile?.businessName || brandProfile?.name || 'Your Brand';
  const initials = displayName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  const industry = brandProfile?.category || 'Fashion & Lifestyle';
  const location = brandProfile?.location || '';
  const website = brandProfile?.website || '';
  const bio = brandProfile?.bio || 'A leading brand partnering with creators for impactful campaigns.';
  const partnerSince = brandProfile?.partnerSince
    ? `Partner since ${brandProfile.partnerSince}`
    : '';

  /* ── social cards derived from profile ── */
  const socialCards: SocialCard[] = [];
  if (brandProfile?.instagramHandle) {
    socialCards.push({
      platform: 'Instagram',
      icon: 'logo-instagram',
      iconColor: '#E1306C',
      followers: brandProfile.instagramFollowers ? `${(brandProfile.instagramFollowers / 1000).toFixed(0)}K` : undefined,
      handle: brandProfile.instagramHandle,
      url: `https://instagram.com/${brandProfile.instagramHandle}`,
    });
  }
  if (brandProfile?.youtubeHandle) {
    socialCards.push({
      platform: 'YouTube',
      icon: 'logo-youtube',
      iconColor: '#FF0000',
      handle: brandProfile.youtubeHandle,
      url: `https://youtube.com/@${brandProfile.youtubeHandle}`,
    });
  }
  if (website) {
    socialCards.push({
      platform: 'Website',
      icon: 'globe-outline',
      iconColor: PURPLE,
      handle: website.replace(/^https?:\/\//, ''),
      url: website.startsWith('http') ? website : `https://${website}`,
    });
  }

  /* ── placeholder campaigns / team / reviews ── */
  const campaigns: CampaignItem[] = [
    { id: '1', title: "Summer Drop '26", dates: 'Jun 1 – Aug 15', creatorsCount: 24, status: 'Active' },
    { id: '2', title: 'Festive Styling Edit', dates: 'Jul 10 – Sep 30', creatorsCount: 18, status: 'Active' },
    { id: '3', title: 'Monsoon Lookbook', dates: 'Mar 1 – May 15', creatorsCount: 31, status: 'Completed' },
  ];

  const team: TeamMember[] = [
    { id: '1', name: 'Priya Singh', role: 'Marketing Lead' },
    { id: '2', name: 'Arjun Mehta', role: 'Partnerships Manager' },
  ];

  const reviews: ReviewItem[] = [
    { id: '1', reviewer: 'Aisha Verma', rating: 5, text: 'Smooth collaboration and clear briefs. Payment was on time.' },
    { id: '2', reviewer: 'Rohit Nair', rating: 4, text: 'Great creative freedom, would partner again for future drops.' },
  ];

  const filteredCampaigns = campaigns.filter(c =>
    activeCampaignTab === 'Active' ? c.status !== 'Completed' : c.status === 'Completed'
  );

  /* ── loading state ── */
  if (loading) {
    return (
      <View style={[styles.loadingCenter, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={PURPLE} />
      </View>
    );
  }

  const topPad = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : insets.top;

  return (
    <View style={styles.root}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PURPLE} />
        }
      >
        {/* Top purple glow fading seamlessly into screen background */}
        <View style={styles.topGlow} pointerEvents="none">
          <LinearGradient
            colors={[
              'rgba(108, 71, 255, 0.40)',
              'rgba(81, 41, 255, 0.22)',
              'rgba(15, 15, 28, 0.08)',
              '#08080F',
            ]}
            locations={[0, 0.35, 0.75, 1.0]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.4, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* ── TOP NAV BAR ── */}
        <View style={[styles.topNav, { paddingTop: topPad + 8 }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={20} color={TEXT_PRIMARY} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowDropdown(v => !v)}
            style={styles.iconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={TEXT_PRIMARY} />
          </TouchableOpacity>
        </View>

        {/* ── DROPDOWN MENU ── */}
        {showDropdown && (
          <View style={[styles.dropdown, { top: topPad + 60 }]}>
            <TouchableOpacity
              style={styles.dropdownItem}
              activeOpacity={0.7}
              onPress={() => {
                setShowDropdown(false);
                router.push('/Brands-completeprofile' as any);
              }}
            >
              <Ionicons name="create-outline" size={18} color={TEXT_PRIMARY} style={{ marginRight: 10 }} />
              <Text style={styles.dropdownText}>Edit Brand Profile</Text>
            </TouchableOpacity>
            <View style={styles.dropdownDivider} />
            <TouchableOpacity
              style={styles.dropdownItem}
              activeOpacity={0.7}
              onPress={async () => {
                setShowDropdown(false);
                try {
                  await Share.share({ message: `Check out ${displayName} on DigiTag!`, title: displayName });
                } catch {}
              }}
            >
              <Ionicons name="share-social-outline" size={18} color={TEXT_PRIMARY} style={{ marginRight: 10 }} />
              <Text style={styles.dropdownText}>Share Profile</Text>
            </TouchableOpacity>
            <View style={styles.dropdownDivider} />
            <TouchableOpacity
              style={styles.dropdownItem}
              activeOpacity={0.7}
              onPress={() => {
                setShowDropdown(false);
                Alert.alert('Logout', 'Are you sure you want to logout?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Logout', style: 'destructive', onPress: () => { logout(); router.replace('/role-selection'); } },
                ]);
              }}
            >
              <Ionicons name="log-out-outline" size={18} color="#FF3B3B" style={{ marginRight: 10 }} />
              <Text style={[styles.dropdownText, { color: '#FF3B3B' }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── HEADER CARD ── */}
        <View style={styles.headerCard}>
          <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />

          {/* Logo + Name & Industry */}
          <View style={styles.headerTopRow}>
            {/* Avatar & Verified Badge */}
            <View style={styles.avatarContainer}>
              <View style={styles.brandLogoWrap}>
                {brandProfile?.profilePicture ? (
                  <Image
                    source={{ uri: brandProfile.profilePicture }}
                    style={styles.brandLogoImage}
                    resizeMode="cover"
                  />
                ) : (
                  <LinearGradient
                    colors={['#2A7BFF', '#6C47FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.brandLogoFallback}
                  >
                    <Text style={styles.brandLogoInitials}>{initials}</Text>
                  </LinearGradient>
                )}
              </View>
              {/* Verified Check Badge */}
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={18} color="#2A7BFF" />
              </View>
            </View>

            {/* Name & Industry Tag */}
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={styles.brandName} numberOfLines={1}>{displayName}</Text>
              <View style={styles.industryTag}>
                <Text style={styles.industryTagText}>{industry}</Text>
              </View>
            </View>
          </View>

          {/* Meta Information Rows */}
          <View style={styles.metaContainer}>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={16} color={TEXT_SECONDARY} />
                <Text style={styles.metaText}>{location}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={16} color={TEXT_SECONDARY} />
                <Text style={styles.metaText}>{partnerSince}</Text>
              </View>
            </View>

            {website ? (
              <TouchableOpacity
                style={styles.websiteRow}
                activeOpacity={0.7}
                onPress={() => Linking.openURL(website.startsWith('http') ? website : `https://${website}`).catch(() => {})}
              >
                <Ionicons name="link-outline" size={16} color="#9B82FF" />
                <Text style={styles.websiteText} numberOfLines={1}>
                  {website.replace(/^https?:\/\//, '')}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* About Section */}
          <View style={styles.aboutSection}>
            <Text style={styles.sectionLabel}>About</Text>
            <Text style={styles.aboutText}>{bio}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push('/(tabs)/messages' as any)}
              style={styles.actionBtnFillWrap}
            >
              <LinearGradient
                colors={['#2A7BFF', '#6C47FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionBtnFillGradient}
              >
                <Text style={styles.actionBtnFillText}>Message</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtnOutline}
              activeOpacity={0.8}
              onPress={() => router.push('/Brands-completeprofile' as any)}
            >
              <Text style={styles.actionBtnOutlineText}>Follow</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── BRAND STATS & SOCIAL LINKS WRAPPER WITH RIGHT SIDE GRADIENT ── */}
        <View style={styles.statsAndSocialWrapper}>
          {/* Right side cyan/mint background gradient scoped ONLY to Stats & Social links */}
          <View style={styles.rightSideGradient} pointerEvents="none">
            {/* Horizontal cyan glow layer */}
            <LinearGradient
              colors={[
                'rgba(0, 229, 195, 0.22)',
                'rgba(0, 229, 195, 0.12)',
                'rgba(0, 229, 195, 0.04)',
                'transparent',
              ]}
              locations={[0, 0.35, 0.7, 1.0]}
              start={{ x: 1, y: 0.5 }}
              end={{ x: 0, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
            {/* Vertical top & bottom mask layer merging seamlessly with #08080F */}
            <LinearGradient
              colors={[
                '#08080F',
                'transparent',
                'transparent',
                '#08080F',
              ]}
              locations={[0, 0.18, 0.82, 1.0]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </View>

          {/* ── BRAND STATS ── */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Brand Stats</Text>
            <View style={styles.statsGrid}>
              {PLACEHOLDER_STATS.map((stat, i) => (
                <View key={i} style={styles.statCard}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── SOCIAL LINKS ── */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Social links</Text>
            <View style={styles.socialRow}>
              {/* Instagram */}
              <TouchableOpacity
                style={styles.socialCard}
                activeOpacity={0.8}
                onPress={() => brandProfile?.instagramHandle && Linking.openURL(`https://instagram.com/${brandProfile.instagramHandle}`).catch(() => {})}
              >
                <LinearGradient
                  colors={['#F58529', '#DD2A7B', '#833AB4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.socialIconBox}
                >
                  <Ionicons name="logo-instagram" size={18} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.socialValue} numberOfLines={1}>
                  {brandProfile?.instagramFollowers ? `${(brandProfile.instagramFollowers / 1000).toFixed(0)}K` : '215K'}
                </Text>
                <Text style={styles.socialSubLabel}>Followers</Text>
              </TouchableOpacity>

              {/* Website / Link */}
              <TouchableOpacity
                style={styles.socialCard}
                activeOpacity={0.8}
                onPress={() => website && Linking.openURL(website.startsWith('http') ? website : `https://${website}`).catch(() => {})}
              >
                <LinearGradient
                  colors={['#2A7BFF', '#6C47FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.socialIconBox}
                >
                  <Ionicons name="link" size={18} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.socialValue} numberOfLines={1}>
                  {website ? website.replace(/^https?:\/\//, '') : 'novaapparel'}
                </Text>
                <Text style={styles.socialSubLabel}>Visit site</Text>
              </TouchableOpacity>

              {/* LinkedIn */}
              <TouchableOpacity
                style={styles.socialCard}
                activeOpacity={0.8}
                onPress={() => Linking.openURL('https://linkedin.com').catch(() => {})}
              >
                <View style={[styles.socialIconBox, { backgroundColor: '#0077B5' }]}>
                  <Ionicons name="logo-linkedin" size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.socialValue} numberOfLines={1}>18K</Text>
                <Text style={styles.socialSubLabel}>Followers</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── CAMPAIGNS ── */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Campaigns</Text>

          {/* Tab filter */}
          <View style={styles.tabRow}>
            {(['Active', 'Past'] as const).map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabChip, activeCampaignTab === tab && styles.tabChipActive]}
                activeOpacity={0.7}
                onPress={() => setActiveCampaignTab(tab)}
              >
                <Text style={[styles.tabChipText, activeCampaignTab === tab && styles.tabChipTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {filteredCampaigns.length === 0 ? (
            <Text style={styles.emptyText}>No {activeCampaignTab.toLowerCase()} campaigns.</Text>
          ) : (
            filteredCampaigns.map(c => {
              const col = statusColor(c.status);
              return (
                <View key={c.id} style={styles.campaignCard}>
                  {/* Thumbnail placeholder */}
                  <LinearGradient
                    colors={[PURPLE, '#5129FF']}
                    style={styles.campaignThumb}
                  >
                    <Ionicons name="megaphone" size={18} color="rgba(255,255,255,0.7)" />
                  </LinearGradient>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.campaignTitle} numberOfLines={1}>{c.title}</Text>
                    <Text style={styles.campaignMeta}>
                      {c.dates} · {c.creatorsCount} creators
                    </Text>
                  </View>

                  <View style={[styles.statusPill, { backgroundColor: col.bg, borderColor: col.border }]}>
                    <Text style={[styles.statusPillText, { color: col.text }]}>{c.status}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* ── TEAM ── */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Team</Text>
          {team.map(member => (
            <View key={member.id} style={styles.teamCard}>
              <View style={styles.teamAvatar}>
                <Text style={styles.teamAvatarText}>
                  {member.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.teamName}>{member.name}</Text>
                <Text style={styles.teamRole}>{member.role}</Text>
              </View>
              <TouchableOpacity style={styles.atBtn} activeOpacity={0.7}>
                <Text style={styles.atBtnText}>@</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* ── REVIEWS ── */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          <Text style={styles.reviewsSummary}>4.8 ★ · 56 reviews from creators</Text>
          {reviews.map(r => (
            <View key={r.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewAvatar}>
                  <Text style={styles.reviewAvatarText}>
                    {r.reviewer.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.reviewerName}>{r.reviewer}</Text>
                  <Text style={styles.reviewStars}>{ratingStars(r.rating)}</Text>
                </View>
              </View>
              <Text style={styles.reviewText}>{r.text}</Text>
            </View>
          ))}
        </View>

        {/* ── EDIT PROFILE CTA ── */}
        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          <TouchableOpacity
            style={styles.editCta}
            activeOpacity={0.85}
            onPress={() => router.push('/Brands-completeprofile' as any)}
          >
            <LinearGradient
              colors={[PURPLE, '#5129FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.editCtaGradient}
            >
              <Ionicons name="create-outline" size={18} color="#fff" />
              <Text style={styles.editCtaText}>Edit Brand Profile</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

/* ─── styles ────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  root: {
     flex: 1,
    backgroundColor: '#08080F',
  },
  loadingCenter: {
    flex: 1,
    backgroundColor: '#08080F',
    alignItems: 'center',
    justifyContent: 'center',
  },

  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 410,
    zIndex: 0,
  },

  statsAndSocialWrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  rightSideGradient: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: '55%',
    zIndex: 0,
  },

  /* top nav */
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
    zIndex: 10,
  },
  navTitle: {
    color: TEXT_PRIMARY,
    fontSize: 17,
    fontFamily: 'Poppins_600SemiBold',
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },

  /* dropdown */
  dropdown: {
    position: 'absolute',
    right: 16,
    zIndex: 999,
    backgroundColor: '#1A1A2A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    minWidth: 200,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  dropdownText: {
    color: TEXT_PRIMARY,
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
  },
  dropdownDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: BORDER,
    marginHorizontal: 18,
  },

  /* header card */
  headerCard: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    padding: 20,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
    zIndex: 1,
  },
  headerGradientBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  brandLogoWrap: {
    width: 68,
    height: 68,
    borderRadius: 20,
    overflow: 'hidden',
  },
  brandLogoImage: {
    width: '100%',
    height: '100%',
  },
  brandLogoFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogoInitials: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    color: TEXT_PRIMARY,
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 2,
  },
  industryTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  industryTagText: {
    color: '#A0A0B8',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  metaContainer: {
    marginTop: 18,
    gap: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: '#A0A0B8',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
  },
  websiteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  websiteText: {
    color: '#9B82FF',
    fontSize: 13.5,
    fontFamily: 'Poppins_500Medium',
    flexShrink: 1,
  },

  /* about */
  aboutSection: {
    marginTop: 18,
  },
  sectionLabel: {
    color: TEXT_PRIMARY,
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 4,
  },
  aboutText: {
    color: '#A0A0B8',
    fontSize: 13.5,
    fontFamily: 'Poppins_300Light',
    lineHeight: 20,
  },

  /* action buttons */
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
  },
  actionBtnFillWrap: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  actionBtnFillGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  }, 
  actionBtnFillText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontFamily: 'Poppins_500Medium',
  },
  actionBtnOutline: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  actionBtnOutlineText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontFamily: 'Poppins_500Medium',
  },

  /* sections */
  sectionContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 12,
  },

  /* stats */
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 18,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 26,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#A0A0B8',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
  },

  /* social links */
  socialRow: {
    flexDirection: 'row',
    gap: 10,
  },
  socialCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    justifyContent: 'space-between',
  },
  socialIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  socialValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 2,
  },
  socialSubLabel: {
    color: '#A0A0B8',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },

  /* campaigns */
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tabChip: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: 'transparent',
  },
  tabChipActive: {
    backgroundColor: PURPLE_LIGHT,
    borderColor: PURPLE + '55',
  },
  tabChipText: {
    color: TEXT_MUTED,
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
  },
  tabChipTextActive: {
    color: PURPLE,
  },
  campaignCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    marginBottom: 10,
  },
  campaignThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  campaignTitle: {
    color: TEXT_PRIMARY,
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 3,
  },
  campaignMeta: {
    color: TEXT_SECONDARY,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  statusPill: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPillText: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
  },
  emptyText: {
    color: TEXT_SECONDARY,
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    marginTop: 8,
  },

  /* team */
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 10,
  },
  teamAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PURPLE_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PURPLE + '44',
  },
  teamAvatarText: {
    color: PURPLE,
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
  },
  teamName: {
    color: TEXT_PRIMARY,
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  teamRole: {
    color: TEXT_SECONDARY,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 1,
  },
  atBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: PURPLE_LIGHT,
    borderWidth: 1,
    borderColor: PURPLE + '44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  atBtnText: {
    color: PURPLE,
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },

  /* reviews */
  reviewsSummary: {
    color: TEXT_SECONDARY,
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    marginBottom: 12,
    marginTop: -6,
  },
  reviewCard: {
    backgroundColor: SURFACE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: MINT_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: MINT + '44',
  },
  reviewAvatarText: {
    color: MINT,
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
  },
  reviewerName: {
    color: TEXT_PRIMARY,
    fontSize: 13.5,
    fontFamily: 'Poppins_600SemiBold',
  },
  reviewStars: {
    color: '#F59E0B',
    fontSize: 13,
    marginTop: 1,
  },
  reviewText: {
    color: TEXT_SECONDARY,
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 19,
  },

  /* edit CTA */
  editCta: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
  },
  editCtaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
  },
  editCtaText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
  },
});
