import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getMyPosts } from '../services/userService';
import { useRoleTheme } from '../theme/useRoleTheme';
import PostCard from '../Components/PostCard';

const FALLBACK_BANNER = null;

export default function MyPostsScreen() {
  const router = useRouter();
  const { token, userId, userRole } = useAuth();
  const theme = useRoleTheme();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!token) return;
      try {
        const res = await getMyPosts(token, { limit: '50' });
        if (res.success) {
          setPosts(Array.isArray(res.data) ? res.data : []);
        }
      } catch (e) {
        console.error('Failed to fetch posts', e);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [token]);

  const getTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.round(diffMs / 60000);
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
      time: getTimeAgo(post.createdAt),
      portfolioLink: owner.portfolio || owner.portfolioLink || owner.portfolioUrl || null,
    };
  });

  return (
    <SafeAreaView className="flex-1 bg-[#060606]" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-[#222]">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-[#1c1c1c] items-center justify-center"
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text className="text-white text-lg ml-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>
          My Posts
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScrollView className="flex-1 py-4" showsVerticalScrollIndicator={false}>
          {cards.length === 0 ? (
            <Text className="text-[#8A8A99] text-center mt-10" style={{ fontFamily: 'Poppins_400Regular' }}>
              No posts found.
            </Text>
          ) : (
            cards.map(item => (
              <PostCard 
                key={item.id} 
                item={item} 
                onPostTap={() => {}}
              />
            ))
          )}
          <View className="h-10" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
