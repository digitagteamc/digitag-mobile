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
import { useAuth } from '../context/AuthContext';
import { getMyPosts, getUserStats, listCollaborations } from '../services/userService';

export default function AnalyticsScreen() {
  const router = useRouter();
  const { token, isProfileCompleted, userRole } = useAuth();

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
        const [statsRes, pendingRes, approvedRes, declinedRes, allRes, postsRes] = await Promise.all([
          getUserStats(token),
          listCollaborations(token, { direction: 'incoming', status: 'PENDING' }),
          // Approved/declined/total count both directions — a collab I sent
          // that got accepted is just as much "mine" as one sent to me.
          listCollaborations(token, { direction: 'all', status: 'ACCEPTED' }),
          listCollaborations(token, { direction: 'all', status: 'DECLINED' }),
          listCollaborations(token, { direction: 'all' }),
          getMyPosts(token, { limit: '1' }),
        ]);
        if (statsRes.success && statsRes.data) {
          setFollowers(statsRes.data.followerCount ?? 0);
          setFollowing(statsRes.data.followingCount ?? 0);
        }
        if (pendingRes.success) setPending(Array.isArray(pendingRes.data) ? pendingRes.data.length : 0);
        if (approvedRes.success) setApproved(Array.isArray(approvedRes.data) ? approvedRes.data.length : 0);
        if (declinedRes.success) setDeclined(Array.isArray(declinedRes.data) ? declinedRes.data.length : 0);
        if (allRes.success) setTotal(Array.isArray(allRes.data) ? allRes.data.length : 0);
        if ((postsRes as any).success) setPostCount((postsRes as any).meta?.total ?? (postsRes as any).data?.length ?? 0);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  if (!token || !isProfileCompleted) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
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
            <ActivityIndicator color="#F15DAB" size="large" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.sectionTitle}>Your Reach</Text>
            <View style={styles.statsRow}>
              <TouchableOpacity style={styles.statCardSmall} activeOpacity={0.8} onPress={() => router.push('/followers' as any)}>
                <View style={styles.iconCircleWrapper}>
                  <View style={[styles.iconCircle, styles.approvedIconCircle]}>
                    <Ionicons name="people" size={20} color="#fff" />
                  </View>
                </View>
                <Text style={styles.statLabel}>Followers</Text>
                <Text style={styles.statValue}>{followers}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.statCardSmall} activeOpacity={0.8} onPress={() => router.push('/following' as any)}>
                <View style={styles.iconCircleWrapper}>
                  <View style={[styles.iconCircle, styles.pendingIconCircle]}>
                    <Ionicons name="person-add" size={18} color="#fff" />
                  </View>
                </View>
                <Text style={styles.statLabel}>Following</Text>
                <Text style={styles.statValue}>{following}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Collaborations</Text>
            <View style={styles.statsRow}>
              <View style={styles.statCardSmall}>
                <View style={styles.iconCircleWrapper}>
                  <View style={[styles.iconCircle, styles.approvedIconCircle]}>
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  </View>
                  <View style={styles.dottedBorder} />
                </View>
                <Text style={styles.statLabel}>Approved</Text>
                <Text style={styles.statValue}>{approved}</Text>
              </View>

              <View style={styles.statCardSmall}>
                <View style={styles.iconCircleWrapper}>
                  <View style={[styles.iconCircle, styles.pendingIconCircle]}>
                    <View style={styles.innerDottedCircle} />
                  </View>
                </View>
                <Text style={styles.statLabel}>Pending</Text>
                <Text style={styles.statValue}>{pending}</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCardSmall}>
                <View style={styles.iconCircleWrapper}>
                  <View style={[styles.iconCircle, styles.declinedIconCircle]}>
                    <Ionicons name="close" size={20} color="#fff" />
                  </View>
                </View>
                <Text style={styles.statLabel}>Declined</Text>
                <Text style={styles.statValue}>{declined}</Text>
              </View>

              <TouchableOpacity style={styles.statCardSmall} activeOpacity={0.8} onPress={() => router.push('/my-posts' as any)}>
                <View style={styles.iconCircleWrapper}>
                  <View style={[styles.iconCircle, styles.approvedIconCircle]}>
                    <Ionicons name="image" size={18} color="#fff" />
                  </View>
                </View>
                <Text style={styles.statLabel}>Your Posts</Text>
                <Text style={styles.statValue}>{postCount}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.totalCard}>
              <View style={styles.totalCardContent}>
                <View>
                  <Text style={styles.totalLabel}>Total Collaboration</Text>
                  <Text style={styles.totalValue}>{total}</Text>
                </View>

                <TouchableOpacity onPress={() => router.push({ pathname: '/notifications', params: { tab: 'requests' } } as any)}>
                  <LinearGradient
                    colors={['#F15DAB', '#ED2A91']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.viewRequestBtn}
                  >
                    <Text style={styles.viewRequestText}>View Requests</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
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
    gap: 16,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 4,
    marginBottom: -4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statCardSmall: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    minHeight: 150,
  },
  iconCircleWrapper: {
    width: 56,
    height: 56,
    marginBottom: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  approvedIconCircle: {
    backgroundColor: 'rgba(241, 93, 171, 0.15)',
  },
  pendingIconCircle: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  declinedIconCircle: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  dottedBorder: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(241, 93, 171, 0.4)',
    borderStyle: 'dashed',
  },
  innerDottedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#fff',
    borderStyle: 'dashed',
  },
  statLabel: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    marginBottom: 8,
    opacity: 0.9,
  },
  statValue: {
    color: '#fff',
    fontSize: 32,
    fontFamily: 'Poppins_700Bold',
  },
  totalCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  totalCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    marginBottom: 8,
    opacity: 0.9,
  },
  totalValue: {
    color: '#fff',
    fontSize: 36,
    fontFamily: 'Poppins_700Bold',
  },
  viewRequestBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 99,
  },
  viewRequestText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
});
