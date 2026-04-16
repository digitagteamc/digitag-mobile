import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { getFullProfile } from '../../services/userService';

// ── Figma background blur image (dark photo)
const HERO_BG = 'http://localhost:3845/assets/595d43e9722ebfd6a20e39509f33138336aa83fe.png';

interface ProfileData {
  name: string;
  phone: string;
  role: string;
  profilePicture?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  twitter?: string | null;
  threads?: string | null;
  industry?: string | null;
  bio?: string | null;
  followerCount?: number | null;
}

const MENU_ITEMS = [
  { id: 'profile', icon: 'person-outline' as const, label: 'My Profile' },
  { id: 'saved',   icon: 'heart-outline' as const,  label: 'Saved Posts' },
  { id: 'settings',icon: 'settings-outline' as const, label: 'Settings' },
  { id: 'help',    icon: 'help-circle-outline' as const, label: 'Help & Support' },
  { id: 'about',   icon: 'information-circle-outline' as const, label: 'About Digitag' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { token, isGuest, userPhone, userRole, logout } = useAuth();
  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        if (res.success && res.data?.profile) {
          const p = res.data.profile;
          const role = res.data.role || userRole || 'USER';
          setProfile({
            name: p.name || p.creatorName || p.brandName || 'User',
            phone: p.phoneNumber || p.phone || userPhone || '',
            role,
            profilePicture: p.profilePicture || null,
            instagram: p.socialLinks?.instagram || p.instagram || null,
            facebook: p.socialLinks?.facebook || null,
            twitter: p.socialLinks?.twitter || null,
            threads: p.socialLinks?.threads || null,
            industry: p.industry || p.category || null,
            bio: p.bio || null,
            followerCount: p.followerCount || null,
          });
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
  }, [token, isGuest]);

  const handleMenuPress = (id: string) => {
    if (id === 'about') router.push('/about-digitag');
    if (id === 'help') router.push('/help-support');
    if (id === 'saved') router.push('/saved-posts');
    if (id === 'settings') router.push('/settings');
    // other items can be wired here
  };

  const handleLogout = () => {
    logout();
    router.replace('/login');
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
    if (url) Linking.openURL(url).catch(() => {});
  };

  const initials = (name: string) =>
    name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7352DD" />
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
                    colors={['#9b7ef7', '#7352DD']}
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

                {/* Social icons */}
                <View style={styles.socialRow}>
                  <TouchableOpacity onPress={() => openLink(profile?.instagram)} style={styles.socialIcon}>
                    <Ionicons name="logo-instagram" size={22} color="#E1306C" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => openLink(profile?.facebook)} style={styles.socialIcon}>
                    <Ionicons name="logo-facebook" size={22} color="#1877F2" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => openLink(profile?.threads)} style={styles.socialIcon}>
                    <MaterialCommunityIcons name="alpha-t-circle" size={22} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => openLink(profile?.twitter)} style={styles.socialIcon}>
                    <Ionicons name="logo-twitter" size={22} color="#1DA1F2" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* ══════════ MENU CARD ══════════ */}
          <View style={styles.menuCard}>
            <View style={styles.menuCardBlur} />
            <View style={styles.menuCardInset} />

            {MENU_ITEMS.map((item, index) => (
              <React.Fragment key={item.id}>
                <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => handleMenuPress(item.id)}>
                  {/* Icon pill */}
                  <View style={styles.menuIconPill}>
                    <Ionicons name={item.icon} size={16} color="#F26930" />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={14} color="#9a9a9a" />
                </TouchableOpacity>

                {/* Divider (not after last item) */}
                {index < MENU_ITEMS.length - 1 && <View style={styles.menuDivider} />}
              </React.Fragment>
            ))}
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
});
