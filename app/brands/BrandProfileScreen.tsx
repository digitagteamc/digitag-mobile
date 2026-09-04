/**
 * BrandProfileScreen — implements the "Brand-profile-view" design from Figma
 * node 9538-18223. Displays brand header card, stats grid, social links,
 * campaigns, team members, and creator reviews.
 *
 * Preserves existing navigation / auth functionality — no tab or routing
 * changes are made here.
 */
import { Ionicons } from '@expo/vector-icons';
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
  { value: '—', label: 'Campaigns Run' },
  { value: '—', label: 'Creators Partnered' },
  { value: '—', label: 'Total Reach' },
  { value: '—', label: 'Avg Rating' },
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
        {/* ── TOP NAV BAR ── */}
        <View style={[styles.topNav, { paddingTop: topPad + 12 }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={22} color={TEXT_PRIMARY} />
          </TouchableOpacity>

          <Text style={styles.navTitle}>My Profile</Text>

          <TouchableOpacity
            onPress={() => setShowDropdown(v => !v)}
            style={styles.iconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="ellipsis-horizontal" size={22} color={TEXT_PRIMARY} />
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
          {/* Purple gradient top accent */}
          <LinearGradient
            colors={[PURPLE, 'rgba(108,71,255,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradientBar}
          />

          {/* Logo + Info Row */}
          <View style={styles.headerTopRow}>
            {/* Brand Logo */}
            <View style={styles.brandLogoWrap}>
              {brandProfile?.profilePicture ? (
                <Image
                  source={{ uri: brandProfile.profilePicture }}
                  style={styles.brandLogoImage}
                  resizeMode="cover"
                />
              ) : (
                <LinearGradient
                  colors={[PURPLE, '#5129FF']}
                  style={styles.brandLogoFallback}
                >
                  <Text style={styles.brandLogoInitials}>{initials}</Text>
                </LinearGradient>
              )}
            </View>

            {/* Name, Industry, Location, Partner Since */}
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.brandName} numberOfLines={1}>{displayName}</Text>

              {/* Industry Tag */}
              <View style={styles.industryTag}>
                <Text style={styles.industryTagText}>{industry}</Text>
              </View>

              <View style={styles.metaRow}>
                {location ? (
                  <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={12} color={TEXT_SECONDARY} />
                    <Text style={styles.metaText}>{location}</Text>
                  </View>
                ) : null}
                {partnerSince ? (
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={12} color={TEXT_SECONDARY} />
                    <Text style={styles.metaText}>{partnerSince}</Text>
                  </View>
                ) : null}
              </View>

              {website ? (
                <TouchableOpacity
                  style={styles.websiteRow}
                  activeOpacity={0.7}
                  onPress={() => Linking.openURL(website.startsWith('http') ? website : `https://${website}`).catch(() => {})}
                >
                  <Ionicons name="link-outline" size={13} color={PURPLE} />
                  <Text style={styles.websiteText} numberOfLines={1}>
                    {website.replace(/^https?:\/\//, '')}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* About */}
          <View style={styles.aboutSection}>
            <Text style={styles.sectionLabel}>About</Text>
            <Text style={styles.aboutText}>{bio}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtnOutline}
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/messages' as any)}
            >
              <Ionicons name="chatbubble-outline" size={15} color={TEXT_PRIMARY} />
              <Text style={styles.actionBtnOutlineText}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtnFilled}
              activeOpacity={0.8}
              onPress={() => router.push('/Brands-completeprofile' as any)}
            >
              <Ionicons name="create-outline" size={15} color={TEXT_PRIMARY} />
              <Text style={styles.actionBtnFilledText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
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
        {socialCards.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Social Links</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
              {socialCards.map((card, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.socialCard}
                  activeOpacity={0.8}
                  onPress={() => card.url && Linking.openURL(card.url).catch(() => {})}
                >
                  <View style={[styles.socialIconWrap, { backgroundColor: card.iconColor + '22' }]}>
                    <Ionicons name={card.icon} size={16} color={card.iconColor} />
                  </View>
                  {card.followers && (
                    <Text style={styles.socialFollowers}>{card.followers}</Text>
                  )}
                  <Text style={styles.socialSubLabel} numberOfLines={1}>
                    {card.followers ? 'Followers' : (card.handle || card.platform)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

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

  /* top nav */
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  navTitle: {
    color: TEXT_PRIMARY,
    fontSize: 17,
    fontFamily: 'Poppins_600SemiBold',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
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
    borderColor: BORDER,
    backgroundColor: CARD_BG,
    overflow: 'hidden',
    padding: 18,
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
    alignItems: 'flex-start',
    marginTop: 4,
  },
  brandLogoWrap: {
    width: 72,
    height: 72,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: PURPLE + '55',
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
    fontSize: 26,
    fontFamily: 'Poppins_700Bold',
  },
  brandName: {
    color: TEXT_PRIMARY,
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 4,
  },
  industryTag: {
    alignSelf: 'flex-start',
    backgroundColor: PURPLE_LIGHT,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 6,
  },
  industryTagText: {
    color: PURPLE,
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    color: TEXT_SECONDARY,
    fontSize: 11.5,
    fontFamily: 'Poppins_400Regular',
  },
  websiteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  websiteText: {
    color: PURPLE,
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    flexShrink: 1,
  },

  /* about */
  aboutSection: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  sectionLabel: {
    color: TEXT_PRIMARY,
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 4,
  },
  aboutText: {
    color: TEXT_SECONDARY,
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 20,
  },

  /* action buttons */
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  actionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 18,
  },
  actionBtnOutlineText: {
    color: TEXT_PRIMARY,
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  actionBtnFilled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: PURPLE,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 18,
  },
  actionBtnFilledText: {
    color: TEXT_PRIMARY,
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },

  /* sections */
  sectionContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: TEXT_PRIMARY,
    fontSize: 17,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 12,
  },

  /* stats */
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: SURFACE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
  },
  statValue: {
    color: TEXT_PRIMARY,
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 2,
  },
  statLabel: {
    color: TEXT_SECONDARY,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },

  /* social */
  socialCard: {
    width: 110,
    backgroundColor: SURFACE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
  },
  socialIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  socialFollowers: {
    color: TEXT_PRIMARY,
    fontSize: 17,
    fontFamily: 'Poppins_700Bold',
  },
  socialSubLabel: {
    color: TEXT_SECONDARY,
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
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
