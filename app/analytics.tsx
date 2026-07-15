import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuth } from '../context/AuthContext';
import { getMyPosts, getUserStats, listCollaborations } from '../services/userService';
import { useRoleTheme } from '../theme/useRoleTheme';

export default function AnalyticsScreen() {
  const router = useRouter();
  const { token, isProfileCompleted, userRole } = useAuth();
  const theme = useRoleTheme();

  const [loading, setLoading] = useState(true);
  const [approved, setApproved] = useState(0);
  const [pending, setPending] = useState(0);
  const [declined, setDeclined] = useState(0);
  const [total, setTotal] = useState(0);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [postCount, setPostCount] = useState(0);

  useEffect(() => {
    if (!token) {
      router.replace('/login' as any);
      return;
    }
    if (!isProfileCompleted) {
      const signupPath = userRole?.toUpperCase() === 'FREELANCER' ? '/signup/freelancer' : '/signup/creator';
      router.replace(signupPath as any);
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const [statsRes, pendingRes, allRes, postsRes] = await Promise.all([
          getUserStats(token),
          listCollaborations(token, { direction: 'incoming', status: 'PENDING' }),
          // Approved/declined/total count both directions — a collab I sent
          // that got accepted is just as much "mine" as one sent to me.
          listCollaborations(token, { direction: 'all' }),
          getMyPosts(token, { limit: '1' }),
        ]);
        if (statsRes.success && statsRes.data) {
          setFollowers(statsRes.data.followerCount ?? 0);
          setFollowing(statsRes.data.followingCount ?? 0);
        }
        if (pendingRes.success) setPending(Array.isArray(pendingRes.data) ? pendingRes.data.length : 0);
        if (allRes.success && Array.isArray(allRes.data)) {
          setTotal(allRes.data.length);
          // COMPLETED still counts as approved — marking a collab done must
          // not silently drop it from the acceptance stats.
          setApproved(allRes.data.filter((c: any) => c.status === 'ACCEPTED' || c.status === 'COMPLETED').length);
          setDeclined(allRes.data.filter((c: any) => c.status === 'DECLINED').length);
        }
        if ((postsRes as any).success) setPostCount((postsRes as any).meta?.total ?? (postsRes as any).data?.length ?? 0);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  if (!token || !isProfileCompleted) return null;

  // Of requests that got a decision either way, what fraction were accepted —
  // a more telling number than any single raw count.
  const decided = approved + declined;
  const acceptanceRate = decided > 0 ? Math.round((approved / decided) * 100) : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[theme.primary + '2E', 'transparent']}
        style={styles.headerGlow}
        pointerEvents="none"
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as any))}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Analytics</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={theme.primary} size="large" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

            {/* ── Hero: Total Collaborations + Acceptance Rate ── */}
            <Animated.View entering={FadeInDown.duration(400)}>
              <LinearGradient
                colors={[theme.primary, theme.hover]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCard}
              >
                <View style={styles.heroTopRow}>
                  <View>
                    <Text style={styles.heroLabel}>Total Collaborations</Text>
                    <Text style={styles.heroValue}>{total}</Text>
                  </View>
                  {acceptanceRate !== null && (
                    <View style={styles.rateRing}>
                      <Text style={styles.rateRingValue}>{acceptanceRate}%</Text>
                      <Text style={styles.rateRingLabel}>Accepted</Text>
                    </View>
                  )}
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroBottomRow}>
                  <Text style={styles.heroHint}>
                    {approved} accepted · {pending} pending · {declined} declined
                  </Text>
                  <TouchableOpacity
                    style={styles.heroBtn}
                    activeOpacity={0.85}
                    onPress={() => router.push('/my-collabs' as any)}
                  >
                    <Text style={[styles.heroBtnText, { color: theme.primary }]}>View Collabs</Text>
                    <Ionicons name="arrow-forward" size={14} color={theme.primary} />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* ── Your Reach ── */}
            <Animated.View entering={FadeInUp.duration(400).delay(80)}>
              <Text style={styles.sectionTitle}>Your Reach</Text>
              <View style={styles.statsRow}>
                <TouchableOpacity style={styles.statCardSmall} activeOpacity={0.8} onPress={() => router.push('/followers' as any)}>
                  <View style={[styles.iconCircle, { backgroundColor: theme.soft }]}>
                    <Ionicons name="people" size={20} color={theme.primary} />
                  </View>
                  <Text style={styles.statLabel}>Followers</Text>
                  <Text style={styles.statValue}>{followers}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.statCardSmall} activeOpacity={0.8} onPress={() => router.push('/following' as any)}>
                  <View style={[styles.iconCircle, { backgroundColor: theme.soft }]}>
                    <Ionicons name="person-add" size={18} color={theme.primary} />
                  </View>
                  <Text style={styles.statLabel}>Following</Text>
                  <Text style={styles.statValue}>{following}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.statCardSmall} activeOpacity={0.8} onPress={() => router.push('/my-posts' as any)}>
                  <View style={[styles.iconCircle, { backgroundColor: theme.soft }]}>
                    <Ionicons name="image" size={18} color={theme.primary} />
                  </View>
                  <Text style={styles.statLabel}>Posts</Text>
                  <Text style={styles.statValue}>{postCount}</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* ── Collaboration Breakdown ── */}
            <Animated.View entering={FadeInUp.duration(400).delay(160)}>
              <Text style={styles.sectionTitle}>Collaboration Requests</Text>
              <View style={styles.statsRow}>
                <TouchableOpacity
                  style={styles.statCardSmall}
                  activeOpacity={0.8}
                  onPress={() => router.push('/my-collabs' as any)}
                >
                  <View style={[styles.iconCircle, { backgroundColor: theme.soft }]}>
                    <Ionicons name="checkmark" size={20} color={theme.primary} />
                  </View>
                  <Text style={styles.statLabel}>Approved</Text>
                  <Text style={styles.statValue}>{approved}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.statCardSmall}
                  activeOpacity={0.8}
                  onPress={() => router.push({ pathname: '/notifications', params: { tab: 'requests' } } as any)}
                >
                  <View style={[styles.iconCircle, styles.pendingIconCircle]}>
                    <View style={styles.innerDottedCircle} />
                  </View>
                  <Text style={styles.statLabel}>Pending</Text>
                  <Text style={styles.statValue}>{pending}</Text>
                </TouchableOpacity>

                <View style={styles.statCardSmall}>
                  <View style={[styles.iconCircle, styles.declinedIconCircle]}>
                    <Ionicons name="close" size={20} color="#EF4444" />
                  </View>
                  <Text style={styles.statLabel}>Declined</Text>
                  <Text style={styles.statValue}>{declined}</Text>
                </View>
              </View>
            </Animated.View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    marginTop: 50,
  },
  headerGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 240,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontFamily: 'Poppins_600SemiBold',
  },
  content: {
    padding: 16,
    gap: 22,
    paddingBottom: 40,
  },

  // ── Hero card ──
  heroCard: {
    borderRadius: 28,
    padding: 22,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    marginBottom: 6,
  },
  heroValue: {
    color: '#fff',
    fontSize: 44,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 48,
  },
  rateRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateRingValue: {
    color: '#fff',
    fontSize: 17,
    fontFamily: 'Poppins_700Bold',
  },
  rateRingLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 9,
    fontFamily: 'Poppins_500Medium',
  },
  heroDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical: 16,
  },
  heroBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  heroHint: {
    flex: 1,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 99,
  },
  heroBtnText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },

  // ── Sections ──
  sectionTitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCardSmall: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    minHeight: 128,
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  pendingIconCircle: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  declinedIconCircle: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  innerDottedCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#fff',
    borderStyle: 'dashed',
  },
  statLabel: {
    color: '#fff',
    fontSize: 12.5,
    fontFamily: 'Poppins_500Medium',
    opacity: 0.85,
  },
  statValue: {
    color: '#fff',
    fontSize: 26,
    fontFamily: 'Poppins_700Bold',
    marginTop: 4,
  },
});
