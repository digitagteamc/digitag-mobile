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
import { useAuth } from '../context/AuthContext';
import { getBlockedUsers, unblockUser } from '../services/userService';
import { useRoleTheme } from '../theme/useRoleTheme';

export default function BlockedUsersScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const theme = useRoleTheme();
  const [blocked, setBlocked] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlocked = async () => {
      if (!token) return;
      try {
        const res = await getBlockedUsers(token);
        if (res.success) {
          setBlocked(Array.isArray(res.data) ? res.data : []);
        }
      } catch (e) {
        console.error('Failed to fetch blocked users', e);
      } finally {
        setLoading(false);
      }
    };
    fetchBlocked();
  }, [token]);

  const handleUnblock = async (userId: string) => {
    if (!token || busyId) return;
    setBusyId(userId);
    try {
      const res = await unblockUser(token, userId);
      if (res.success) {
        setBlocked((prev) => prev.filter((u) => u.id !== userId));
      }
    } finally {
      setBusyId(null);
    }
  };

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
          Blocked Accounts
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
          {blocked.length === 0 ? (
            <Text className="text-[#8A8A99] text-center mt-10" style={{ fontFamily: 'Poppins_400Regular' }}>
              You haven't blocked anyone.
            </Text>
          ) : (
            blocked.map((user) => {
              const name = user?.name || user?.role || 'User';
              const isBusy = busyId === user.id;

              return (
                <View
                  key={user.id}
                  className="flex-row items-center gap-3 mb-3 bg-white/5 rounded-xl border border-white/10 p-3.5"
                >
                  <View className="w-12 h-12 rounded-full border items-center justify-center overflow-hidden bg-[#222]" style={{ borderColor: theme.border }}>
                    {user?.profilePicture ? (
                      <Image source={{ uri: user.profilePicture }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                      <Text className="text-base font-bold" style={{ fontFamily: 'Poppins_700Bold', color: theme.primary }}>
                        {name.slice(0, 2).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View className="flex-1 justify-center">
                    <Text className="text-white text-[15px] font-semibold" style={{ fontFamily: 'Poppins_600SemiBold' }}>{name}</Text>
                    <Text className="text-[#8A8A99] text-[13px] mt-[2px] capitalize" style={{ fontFamily: 'Poppins_400Regular' }}>{user?.role?.toLowerCase() || ''}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleUnblock(user.id)}
                    disabled={isBusy}
                    className="px-4 py-2 rounded-full border border-white/15"
                    style={{ opacity: isBusy ? 0.5 : 1 }}
                  >
                    <Text className="text-white text-[13px]" style={{ fontFamily: 'Poppins_500Medium' }}>
                      {isBusy ? '...' : 'Unblock'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
          <View className="h-10" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
