import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import VerifiedBadge from '../Components/ui/VerifiedBadge';
import { useAuth } from '../context/AuthContext';
import { getFollowers } from '../services/userService';
import { useRoleTheme } from '../theme/useRoleTheme';

export default function FollowersScreen() {
  const router = useRouter();
  const { userId, name } = useLocalSearchParams<{ userId?: string; name?: string }>();
  const { token } = useAuth();
  const theme = useRoleTheme();
  const [followers, setFollowers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFollowers = async () => {
      // Both the own-list and other-user endpoints require auth.
      if (!token) { setLoading(false); return; }
      try {
        const res = await getFollowers(token, userId);
        if (res.success) {
          setFollowers(Array.isArray(res.data) ? res.data : []);
        }
      } catch (e) {
        console.error('Failed to fetch followers', e);
      } finally {
        setLoading(false);
      }
    };
    fetchFollowers();
  }, [token, userId]);

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
          {name ? `${name}'s Followers` : 'Followers'}
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
          {followers.length === 0 ? (
            <Text className="text-[#8A8A99] text-center mt-10" style={{ fontFamily: 'Poppins_400Regular' }}>
              {name ? 'No followers yet.' : "You don't have any followers yet."}
            </Text>
          ) : (
            followers.map(user => {
              const profile = user?.creatorProfile || user?.freelancerProfile || user;
              const name = profile?.name || user?.role || 'User';

              return (
                <TouchableOpacity
                  key={user.id}
                  className="flex-row items-center gap-3 mb-3 bg-white/5 rounded-xl border border-white/10 p-3.5"
                  activeOpacity={0.8}
                  onPress={() => user?.id && router.push({ pathname: '/creator-details', params: { userId: user.id } } as any)}
                >
                  <View className="w-12 h-12 rounded-full border items-center justify-center overflow-hidden bg-[#222]" style={{ borderColor: theme.border }}>
                    {profile?.profilePicture ? (
                      <Image source={{ uri: profile.profilePicture }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                      <Text className="text-base font-bold" style={{ fontFamily: 'Poppins_700Bold', color: theme.primary }}>
                        {name.slice(0, 2).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View className="flex-1 justify-center">
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text className="text-white text-[15px] font-semibold" style={{ fontFamily: 'Poppins_600SemiBold', flexShrink: 1 }} numberOfLines={1} ellipsizeMode="tail">{name}</Text>
                      <VerifiedBadge isPremium={user?.isPremium} size={13} />
                    </View>
                    <Text className="text-[#8A8A99] text-[13px] mt-[2px] capitalize" style={{ fontFamily: 'Poppins_400Regular' }}>{user?.role?.toLowerCase() || ''}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
          <View className="h-10" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
