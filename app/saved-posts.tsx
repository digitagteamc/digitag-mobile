import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getSavedPosts, unsavePost } from '../services/userService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

const FALLBACK_BANNER = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800';

export default function SavedPostsScreen() {
  const router = useRouter();
  const { token, isGuest } = useAuth();
  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSaved = useCallback(async () => {
    if (!token || isGuest) { setLoading(false); return; }
    const res = await getSavedPosts(token);
    if (res.success && Array.isArray(res.data)) {
      setPosts(res.data);
    }
    setLoading(false);
  }, [token, isGuest]);

  useEffect(() => { fetchSaved(); }, [fetchSaved]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSaved();
    setRefreshing(false);
  };

  const handleUnsave = async (postId: string) => {
    if (!token) return;
    // Optimistic removal
    setPosts(prev => prev.filter(p => p.id !== postId));
    await unsavePost(postId, token);
  };

  const getAuthorName = (author: any) => {
    if (author?.role === 'BRAND') return author.brandProfile?.brandName || 'Brand';
    if (author?.role === 'CREATOR') return author.creatorProfile?.name || 'Creator';
    if (author?.role === 'FREELANCER') return author.freelancerProfile?.name || 'Freelancer';
    return 'User';
  };

  const getTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.round(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${Math.round(diffHrs / 24)}d ago`;
  };

  return (
    <View style={styles.root}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      <SafeAreaView style={styles.safe}>
        {/* ── HEADER ── */}
        <View style={[styles.header, { marginTop: statusBarHeight + 8 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Saved Posts</Text>
          <View style={{ width: 36 }} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#7352DD" />
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="bookmark-outline" size={56} color="#3a3a4a" />
            <Text style={styles.emptyTitle}>No saved posts yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the bookmark icon on any post to save it here.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#7352DD"
              />
            }
          >
            {posts.map(post => {
              const name = getAuthorName(post.author);
              const initials = name.slice(0, 2).toUpperCase();
              const pic = post.author?.creatorProfile?.profilePicture;
              const banner = post.imageUrl || FALLBACK_BANNER;

              return (
                <View key={post.id} style={styles.card}>
                  {/* ── Hero image */}
                  <View style={styles.cardHero}>
                    <Image source={{ uri: banner }} style={styles.cardBanner} resizeMode="cover" />
                    <View style={styles.heroOverlay} />

                    {/* Unsave / filled bookmark */}
                    <TouchableOpacity
                      style={styles.bookmarkBtn}
                      onPress={() => handleUnsave(post.id)}
                    >
                      <Ionicons name="bookmark" size={16} color="#F26930" />
                    </TouchableOpacity>

                    {/* Author row */}
                    <View style={styles.authorRow}>
                      {pic ? (
                        <View style={styles.avatarCircle}>
                          <Image source={{ uri: pic }} style={styles.avatarImg} resizeMode="cover" />
                        </View>
                      ) : (
                        <View style={styles.initialsCircle}>
                          <Text style={styles.initialsText}>{initials}</Text>
                        </View>
                      )}
                      <View>
                        <Text style={styles.authorName}>{name}</Text>
                        <Text style={styles.authorRole}>
                          {post.author?.role?.charAt(0) + post.author?.role?.slice(1).toLowerCase()}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* ── Card body */}
                  <View style={styles.cardBody}>
                    <Text style={styles.cardDesc} numberOfLines={2}>
                      {post.description}
                    </Text>
                    <View style={styles.cardMeta}>
                      <Text style={styles.interestCount}>
                        {post._count?.interests ?? 0} interested
                      </Text>
                      <View style={styles.timeRow}>
                        <Ionicons name="time-outline" size={12} color="#7a7a8a" />
                        <Text style={styles.timeText}> {getTimeAgo(post.createdAt)}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#060606' },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20, gap: 20 },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '500',
    letterSpacing: -0.3,
  },

  // ── States
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#9a9a9a',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Card
  card: {
    width: CARD_WIDTH,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(156,156,156,0.5)',
    overflow: 'hidden',
    backgroundColor: '#1e1e24',
  },
  cardHero: {
    height: 152,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  cardBanner: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  bookmarkBtn: {
    position: 'absolute',
    top: 14,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorRow: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#efefef',
  },
  avatarImg: { width: '100%', height: '100%' },
  initialsCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  authorName: { color: '#fff', fontSize: 14, fontWeight: '600', letterSpacing: -0.3 },
  authorRole: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '400' },

  // ── Body
  cardBody: { paddingHorizontal: 12, paddingVertical: 12 },
  cardDesc: { color: '#fff', fontSize: 13, lineHeight: 18, marginBottom: 8 },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  interestCount: { color: '#7352DD', fontSize: 12, fontWeight: '500' },
  timeRow: { flexDirection: 'row', alignItems: 'center' },
  timeText: { color: '#9a9a9a', fontSize: 11 },
});
