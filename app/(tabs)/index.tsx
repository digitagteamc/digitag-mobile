import CategoryOptions from '@/Components/CatergoryOptions';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Hero from '../../Components/Hero';
import Navbar from '../../Components/Navbar';
import TopCreators from '../../Components/TopCreators';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.2.3:3001';

interface Creator {
  id: number;
  name: string;
  category: string;
  city?: string;
  state?: string;
  phoneNumber?: string;
  instagram?: string;
  email?: string;
}

export default function Homepage() {
  const { isGuest, userRole, logout } = useAuth();
  const router = useRouter();

  const isBrand = userRole?.toUpperCase() === 'BRAND';
  const isCreator = userRole?.toUpperCase() === 'CREATOR';

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.wrapper}>
      <StatusBar barStyle="light-content" />
      <View style={styles.content}>
        <Navbar />

        {isGuest && (
          <TouchableOpacity style={styles.guestBanner} onPress={() => router.navigate('/login')}>
            <Text style={styles.lockIcon}>🔒</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.guestTitle}>You're browsing as a guest</Text>
              <Text style={styles.guestSub}>Tap any feature to login and unlock everything</Text>
            </View>
            <Text style={styles.guestArrow}>Login →</Text>
          </TouchableOpacity>
        )}

        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {isCreator ? (
            <CreatorView handleLogout={handleLogout} />
          ) : isBrand ? (
            <BrandView handleLogout={handleLogout} />
          ) : (
            <GuestView />
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

/** Default view for Guest users */
function GuestView() {
  return (
    <>
      <Hero />
      <CategoryOptions />
      <TopCreators />
    </>
  );
}

/** UI for Creator users */
function CreatorView({ handleLogout }: { handleLogout: () => void }) {
  const router = useRouter();

  return (
    <>
      <View style={styles.roleHeader}>
        <View style={styles.headerInfo}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.roleTitle}>Creator Partner 👋</Text>
        </View>
        <TouchableOpacity style={styles.minimalLogout} onPress={handleLogout}>
          <Text style={styles.minimalLogoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Collaboration Center</Text>
        <TouchableOpacity onPress={() => router.push('/creator-inbox')}>
          <Text style={styles.seeAllText}>Open Inbox</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.inboxCard}
        onPress={() => router.push('/creator-inbox')}
        activeOpacity={0.8}
      >
        <View style={styles.inboxIconBg}>
          <Text style={styles.inboxIcon}>📩</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.inboxTitle}>New Invitations</Text>
          <Text style={styles.inboxDesc}>You have potential collaborations waiting for your approval.</Text>
        </View>
        <View style={styles.inboxBadge}>
          <Text style={styles.inboxBadgeText}>0</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Performance</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: 'rgba(79, 70, 229, 0.15)' }]}>
            <Text style={styles.statIcon}>🔥</Text>
          </View>
          <Text style={styles.statNum}>0</Text>
          <Text style={styles.statLabel}>Active Campaigns</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
            <Text style={styles.statIcon}>⚖️</Text>
          </View>
          <Text style={styles.statNum}>0</Text>
          <Text style={styles.statLabel}>Avg. Engagement</Text>
        </View>
      </View>

      <View style={styles.premiumBanner}>
        <View style={styles.premiumIconBg}>
          <Text style={styles.premiumIcon}>✨</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.premiumTitle}>Grow your Influence</Text>
          <Text style={styles.premiumDesc}>Update your portfolio daily to attract 2x more brands.</Text>
        </View>
      </View>
    </>
  );
}

import CreatorHits from '../../Components/CreatorHits';

/** UI for Brand users */
function BrandView({ handleLogout }: { handleLogout: () => void }) {
  return (
    <>
      <View style={styles.roleHeader}>
        <View style={styles.headerInfo}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.roleTitle}>Brand Partner 🏢</Text>
        </View>
        <TouchableOpacity style={styles.minimalLogout} onPress={handleLogout}>
          <Text style={styles.minimalLogoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.brandHero}>
        <Text style={styles.brandHeroTitle}>Discover the Perfect Voice</Text>
        <Text style={styles.brandHeroSub}>Search through thousands of verified creators ready for your next campaign.</Text>
        <TouchableOpacity
          style={styles.brandHeroBtn}
          onPress={() => { /* Potential Search Navigation */ }}
        >
          <Text style={styles.brandHeroBtnText}>Start Scouting</Text>
        </TouchableOpacity>
      </View>

      <CategoryOptions />

      {/* 
          Removing the manual directory list here because CreatorHits 
          already provides a premium grid view of top creators.
      */}
      <CreatorHits />

      <View style={styles.infoBox}>
        <View style={styles.infoBoxHeader}>
          <Text style={styles.infoBoxIcon}>💡</Text>
          <Text style={styles.infoBoxTitle}>Quick Insight</Text>
        </View>
        <Text style={styles.infoBoxDesc}>Brands that collaborate with micro-creators see a 40% higher conversion rate on average.</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#0f0f1e' },
  content: { flex: 1 },
  container: { flex: 1 },

  // Guest banner
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(79,70,229,0.15)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(79,70,229,0.3)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  lockIcon: { fontSize: 16 },
  guestTitle: { color: '#a78bfa', fontSize: 13, fontWeight: '700' },
  guestSub: { color: '#7c6fad', fontSize: 11, marginTop: 2 },
  guestArrow: { color: '#a78bfa', fontSize: 13, fontWeight: '700' },

  // Role Header
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
  },
  headerInfo: { flex: 1 },
  welcomeText: { color: '#64748b', fontSize: 14, fontWeight: '500' },
  roleTitle: { color: '#fff', fontSize: 26, fontWeight: '900', marginTop: 4 },
  minimalLogout: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  minimalLogoutText: { color: '#ef4444', fontSize: 13, fontWeight: '700' },

  // Section Styling
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 15,
  },
  sectionTitle: { color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },
  seeAllText: { color: '#4f46e5', fontSize: 13, fontWeight: '700' },

  // Inbox Card
  inboxCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e30',
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#2e2e4e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  inboxIconBg: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: 'rgba(79, 70, 229, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  inboxIcon: { fontSize: 24 },
  inboxTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  inboxDesc: { color: '#64748b', fontSize: 13, marginTop: 6, lineHeight: 18 },
  inboxBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  inboxBadgeText: { color: '#fff', fontSize: 11, fontWeight: '900' },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1e1e30',
    padding: 24,
    borderRadius: 26,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2e2e4e',
  },
  statIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  statIcon: { fontSize: 20 },
  statNum: { color: '#fff', fontSize: 28, fontWeight: '900' },
  statLabel: { color: '#64748b', fontSize: 12, marginTop: 4, fontWeight: '600', textAlign: 'center' },

  // Premium Banner
  premiumBanner: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#4f46e5',
    padding: 20,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  premiumIconBg: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumIcon: { fontSize: 22 },
  premiumTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  premiumDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2, lineHeight: 16 },

  // Brand Hero
  brandHero: {
    backgroundColor: '#16162d',
    marginHorizontal: 16,
    padding: 25,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#2e2e4e',
    marginBottom: 20,
  },
  brandHeroTitle: { color: '#fff', fontSize: 24, fontWeight: '900', lineHeight: 30 },
  brandHeroSub: { color: '#64748b', fontSize: 13, marginTop: 8, lineHeight: 19 },
  brandHeroBtn: {
    backgroundColor: '#4f46e5',
    alignSelf: 'flex-start',
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  brandHeroBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  // Info Box
  infoBox: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 20,
    backgroundColor: 'rgba(79, 70, 229, 0.05)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.1)',
    borderStyle: 'dashed',
  },
  infoBoxHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoBoxIcon: { fontSize: 18 },
  infoBoxTitle: { color: '#818cf8', fontSize: 15, fontWeight: 'bold' },
  infoBoxDesc: { color: '#64748b', fontSize: 13, lineHeight: 19 },
});