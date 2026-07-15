import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
import { getProfileViewers } from '../services/userService';
import { useRoleTheme } from '../theme/useRoleTheme';

function timeAgo(dateStr?: string) {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.max(0, Math.round(diffMs / 60000));
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.round(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.round(diffHrs / 24)}d ago`;
}

export default function ProfileViewersScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const theme = useRoleTheme();
  const [viewers, setViewers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Driven entirely by the backend's response — GET /users/me/profile-viewers
  // 403s with a "Premium" message for non-Premium accounts, which is the
  // single source of truth here rather than duplicating an isPremium check
  // client-side.
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    if (!token) { router.replace('/role-selection' as any); return; }
    const load = async () => {
      try {
        const res = await getProfileViewers(token);
        if (res.success) {
          setViewers(Array.isArray(res.data) ? res.data : []);
        } else if ((res as any).error?.toLowerCase().includes('premium')) {
          setForbidden(true);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  return (
    <SafeAreaView className="flex-1 bg-[#060606]" edges={['top', 'bottom']}>
      <View className="flex-row items-center px-4 py-3 border-b border-[#222]">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-[#1c1c1c] items-center justify-center"
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text className="text-white text-lg ml-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>
          Who Viewed My Profile
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : forbidden ? (
        <View className="flex-1 justify-center items-center px-8">
          <View className="w-16 h-16 rounded-full items-center justify-center mb-4" style={{ backgroundColor: 'rgba(255,215,0,0.12)' }}>
            <Ionicons name="eye-outline" size={30} color="#FFD700" />
          </View>
          <Text className="text-white text-[17px] text-center mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            See who's checking you out
          </Text>
          <Text className="text-[#8A8A99] text-[14px] text-center leading-5" style={{ fontFamily: 'Poppins_400Regular' }}>
            Who Viewed My Profile is a Premium feature. Upgrade to see everyone who's recently visited your profile.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile' as any)}
            className="mt-6 rounded-full px-6 py-3"
            style={{ backgroundColor: theme.primary }}
          >
            <Text className="text-white text-[14px]" style={{ fontFamily: 'Poppins_600SemiBold' }}>Go to Upgrade</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
          {viewers.length === 0 ? (
            <Text className="text-[#8A8A99] text-center mt-10" style={{ fontFamily: 'Poppins_400Regular' }}>
              No one has viewed your profile yet.
            </Text>
          ) : (
            viewers.map((v) => {
              const name = v?.name || v?.role || 'User';
              return (
                <TouchableOpacity
                  key={v.userId}
                  className="flex-row items-center gap-3 mb-3 bg-white/5 rounded-xl border border-white/10 p-3.5"
                  activeOpacity={0.8}
                  onPress={() => router.push({ pathname: '/creator-details', params: { userId: v.userId } } as any)}
                >
                  <View className="w-12 h-12 rounded-full border items-center justify-center overflow-hidden bg-[#222]" style={{ borderColor: theme.border }}>
                    {v?.profilePicture ? (
                      <Image source={{ uri: v.profilePicture }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                      <Text className="text-base font-bold" style={{ fontFamily: 'Poppins_700Bold', color: theme.primary }}>
                        {name.slice(0, 2).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View className="flex-1 justify-center">
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text className="text-white text-[15px] font-semibold" style={{ fontFamily: 'Poppins_600SemiBold', flexShrink: 1 }} numberOfLines={1} ellipsizeMode="tail">{name}</Text>
                      <VerifiedBadge isPremium={v?.isPremium} size={13} />
                    </View>
                    <Text className="text-[#8A8A99] text-[13px] mt-[2px] capitalize" style={{ fontFamily: 'Poppins_400Regular' }}>{v?.role?.toLowerCase() || ''}</Text>
                  </View>
                  <Text className="text-[#8A8A99] text-[12px]" style={{ fontFamily: 'Poppins_400Regular' }}>{timeAgo(v?.viewedAt)}</Text>
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
