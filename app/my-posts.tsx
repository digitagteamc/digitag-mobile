import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { deleteDraft, listDrafts, PostDraft } from '../services/drafts';
import { deletePost, getMyPosts } from '../services/userService';
import { useRoleTheme } from '../theme/useRoleTheme';
import PostCard from '../Components/PostCard';

const FALLBACK_BANNER = null;

type Tab = 'published' | 'drafts';

export default function MyPostsScreen() {
  const router = useRouter();
  const { token, userId, userRole } = useAuth();
  const theme = useRoleTheme();
  const [tab, setTab] = useState<Tab>('published');
  const [posts, setPosts] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<PostDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const [postsRes, draftList] = await Promise.all([
      token ? getMyPosts(token, { limit: '50' }) : Promise.resolve({ success: false, data: [] } as any),
      listDrafts(),
    ]);
    if (postsRes.success) setPosts(Array.isArray(postsRes.data) ? postsRes.data : []);
    setDrafts(draftList);
    setLoading(false);
  }, [token]);

  // Refetch on every focus — returning from editing a post or a draft should
  // immediately show the result, not a stale list.
  useFocusEffect(useCallback(() => { fetchAll(); }, [fetchAll]));

  const handleEdit = (postId: string) => {
    router.push({ pathname: '/create-post', params: { editPostId: postId } } as any);
  };

  const handleDelete = (postId: string) => {
    Alert.alert(
      'Delete post?',
      'This post will be removed for everyone. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!token) return;
            setDeletingId(postId);
            const res = await deletePost(postId, token);
            setDeletingId(null);
            if (res.success) {
              setPosts(prev => prev.filter(p => p.id !== postId));
            } else {
              Alert.alert('Delete Failed', res.error || 'Could not delete the post. Please try again.');
            }
          },
        },
      ],
    );
  };

  const handleOpenDraft = (draft: PostDraft) => {
    router.push({ pathname: '/create-post', params: { draftId: draft.id } } as any);
  };

  const handleDeleteDraft = (draft: PostDraft) => {
    Alert.alert(
      'Delete draft?',
      'This draft will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteDraft(draft.id);
            setDrafts(prev => prev.filter(d => d.id !== draft.id));
          },
        },
      ],
    );
  };

  const getTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.round(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.round(diffHrs / 24);
    return `${diffDays}d ago`;
  };

  const getOwnerName = (owner: any) => {
    if (owner?.name) return owner.name;
    if (owner?.role === 'CREATOR') return 'Creator';
    if (owner?.role === 'FREELANCER') return 'Freelancer';
    return 'User';
  };

  const cards = posts.map(post => {
    const owner = post.owner || { id: userId, role: userRole };
    const name = getOwnerName(owner);
    const pic = owner.profilePicture || null;
    const roleLabel = owner.role
      ? owner.role.charAt(0) + owner.role.slice(1).toLowerCase()
      : 'User';
    return {
      id: post.id,
      owner: owner,
      ownerId: owner.id as string | undefined,
      ownerRole: owner.role as string | undefined,
      bannerUri: post.imageUrl || FALLBACK_BANNER,
      isInitials: !pic,
      initials: name.slice(0, 2).toUpperCase(),
      avatarUri: pic,
      name,
      role: roleLabel,
      desc: post.description,
      price: post.collaborationType === 'PAID' ? 'Paid Collab' : 'Free Collab',
      budget: post.budget || null,
      time: getTimeAgo(post.createdAt),
      portfolioLink: owner.portfolio || owner.portfolioLink || owner.portfolioUrl || null,
    };
  });

  return (
    <SafeAreaView className="flex-1 bg-[#060606]" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-[#222]">
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as any))}
          className="w-10 h-10 rounded-full bg-[#1c1c1c] items-center justify-center"
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text className="text-white text-lg ml-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>
          My Posts
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity style={styles.tabBtn} onPress={() => setTab('published')} activeOpacity={0.75}>
          <Text style={[styles.tabLabel, tab === 'published' && { color: theme.primary }]}>Published</Text>
          {tab === 'published' && <View style={[styles.tabIndicator, { backgroundColor: theme.primary }]} />}
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBtn} onPress={() => setTab('drafts')} activeOpacity={0.75}>
          <Text style={[styles.tabLabel, tab === 'drafts' && { color: theme.primary }]}>
            Drafts{drafts.length > 0 ? ` (${drafts.length})` : ''}
          </Text>
          {tab === 'drafts' && <View style={[styles.tabIndicator, { backgroundColor: theme.primary }]} />}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : tab === 'published' ? (
        <ScrollView className="flex-1 py-4" showsVerticalScrollIndicator={false}>
          {cards.length === 0 ? (
            <Text className="text-[#8A8A99] text-center mt-10" style={{ fontFamily: 'Poppins_400Regular' }}>
              No posts found.
            </Text>
          ) : (
            cards.map(item => (
              <View key={item.id} style={deletingId === item.id ? { opacity: 0.4 } : undefined}>
                <PostCard
                  item={item}
                  onPostTap={(postId) => router.push({ pathname: '/post-detail', params: { postId } } as any)}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </View>
            ))
          )}
          <View className="h-10" />
        </ScrollView>
      ) : (
        <ScrollView className="flex-1 py-4 px-4" showsVerticalScrollIndicator={false}>
          {drafts.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="document-text-outline" size={40} color="#3A3A47" />
              <Text style={styles.emptyText}>No drafts yet</Text>
              <Text style={styles.emptyHint}>Posts you save as drafts will appear here.</Text>
            </View>
          ) : (
            drafts.map(draft => (
              <TouchableOpacity
                key={draft.id}
                style={styles.draftCard}
                activeOpacity={0.8}
                onPress={() => handleOpenDraft(draft)}
              >
                <View style={[styles.draftIcon, { backgroundColor: theme.soft }]}>
                  <Ionicons name="document-text-outline" size={18} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.draftTitle} numberOfLines={1}>
                    {draft.title || draft.body || 'Untitled draft'}
                  </Text>
                  <Text style={styles.draftMeta} numberOfLines={1}>
                    {draft.body && draft.title ? `${draft.body.slice(0, 40)} · ` : ''}Saved {getTimeAgo(draft.savedAt)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteDraft(draft)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.draftDeleteBtn}
                >
                  <Ionicons name="trash-outline" size={17} color="#EF4444" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
          <View className="h-10" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2A2A2A',
  },
  tabBtn: { paddingVertical: 12, marginRight: 28 },
  tabLabel: { color: '#8A8A99', fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
  tabIndicator: { height: 2, borderRadius: 1, marginTop: 8 },

  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { color: '#8A8A99', fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  emptyHint: { color: '#5A5A66', fontSize: 12.5, fontFamily: 'Poppins_400Regular' },

  draftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  draftIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftTitle: { color: '#fff', fontSize: 14.5, fontFamily: 'Poppins_600SemiBold' },
  draftMeta: { color: '#8A8A99', fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  draftDeleteBtn: { padding: 6 },
});
