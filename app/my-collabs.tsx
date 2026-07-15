import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { completeCollab, listCollaborations } from '../services/userService';
import { useRoleTheme } from '../theme/useRoleTheme';

export default function MyCollabsScreen() {
  const router = useRouter();
  const { token, userId, userRole } = useAuth();
  const theme = useRoleTheme();
  const [allCollabs, setAllCollabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  // A COLLAB_DECLINED notification tap deep-links straight to the Rejected tab.
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<'collabs' | 'rejected'>(tabParam === 'rejected' ? 'rejected' : 'collabs');

  const isCreator = userRole === 'CREATOR';

  const fetchCollabs = async () => {
    if (!token) return;
    try {
      const res = await listCollaborations(token, { direction: 'all' });
      if (res.success) {
        setAllCollabs(Array.isArray(res.data) ? res.data : []);
      }
    } catch (e) {
      console.error('Failed to fetch collabs', e);
    } finally {
      setLoading(false);
    }
  };

  const collabs = allCollabs.filter((c: any) =>
    tab === 'rejected'
      ? c.status === 'DECLINED'
      : c.status === 'ACCEPTED' || c.status === 'COMPLETED'
  );

  useEffect(() => { fetchCollabs(); }, [token]);

  const handleComplete = (collabId: string, otherName: string) => {
    Alert.alert(
      'Mark as Completed',
      `Mark your collaboration with ${otherName} as completed? This ends the work session — chat and calls will be closed for both of you.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Complete',
          style: 'destructive',
          onPress: async () => {
            setCompleting(collabId);
            try {
              const res = await completeCollab(token!, collabId);
              if (res.success) {
                setAllCollabs(prev => prev.map((c: any) =>
                  c.id === collabId ? { ...c, status: 'COMPLETED' } : c
                ));
              } else {
                Alert.alert('Error', res.error || 'Could not complete collaboration.');
              }
            } catch {
              Alert.alert('Error', 'Network error.');
            } finally {
              setCompleting(null);
            }
          },
        },
      ],
    );
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
          My Collabs
        </Text>
      </View>

      {/* Tabs — same underline pattern as the Notifications screen */}
      <View className="flex-row px-5 border-b border-[#222]">
        <TouchableOpacity className="py-3 mr-7" onPress={() => setTab('collabs')} activeOpacity={0.75}>
          <Text className="text-[14px]" style={{ fontFamily: 'Poppins_600SemiBold', color: tab === 'collabs' ? theme.primary : '#8A8A99' }}>Collabs</Text>
          {tab === 'collabs' && <View style={{ height: 2, borderRadius: 1, marginTop: 8, backgroundColor: theme.primary }} />}
        </TouchableOpacity>
        <TouchableOpacity className="py-3" onPress={() => setTab('rejected')} activeOpacity={0.75}>
          <Text className="text-[14px]" style={{ fontFamily: 'Poppins_600SemiBold', color: tab === 'rejected' ? theme.primary : '#8A8A99' }}>Rejected</Text>
          {tab === 'rejected' && <View style={{ height: 2, borderRadius: 1, marginTop: 8, backgroundColor: theme.primary }} />}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
          {collabs.length === 0 ? (
            <Text className="text-[#8A8A99] text-center mt-10" style={{ fontFamily: 'Poppins_400Regular' }}>
              {tab === 'rejected' ? 'No rejected collabs.' : 'No collabs found.'}
            </Text>
          ) : (
            collabs.map(collab => {
              const iAmSender = collab.sender?.id === userId;
              const other = iAmSender ? collab.receiver : collab.sender;
              const otherProfile = other?.creatorProfile || other?.freelancerProfile;
              const otherName = otherProfile?.name || other?.role || 'User';
              const description = collab.post?.description || collab.message || '';
              const isCompleted = collab.status === 'COMPLETED';
              const isDeclined = collab.status === 'DECLINED';
              const isCompleting = completing === collab.id;

              return (
                <View
                  key={collab.id}
                  className="mb-3 bg-white/5 rounded-xl border border-white/10 p-3.5"
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => other?.id && router.push({ pathname: '/creator-details', params: { userId: other.id } } as any)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
                  >
                    <View className="w-12 h-12 rounded-full border items-center justify-center" style={{ backgroundColor: theme.soft, borderColor: theme.border }}>
                      <Text className="text-base font-bold" style={{ fontFamily: 'Poppins_700Bold', color: theme.primary }}>
                        {otherName.slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text className="text-white text-[15px] font-semibold" style={{ fontFamily: 'Poppins_600SemiBold' }} numberOfLines={1} ellipsizeMode="tail">{otherName}</Text>
                      <Text className="text-[#8A8A99] text-[13px] mt-[2px] capitalize" style={{ fontFamily: 'Poppins_400Regular' }}>{other?.role?.toLowerCase() || ''}</Text>
                      {description ? (
                        <Text className="text-[#8A8A99] text-[13px] mt-1 leading-5" numberOfLines={2} style={{ fontFamily: 'Poppins_400Regular' }}>{description}</Text>
                      ) : null}
                      {isDeclined ? (
                        <Text className="text-[#EF4444] text-[12px] mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                          {iAmSender ? `${otherName} declined your request` : 'You declined this request'}
                        </Text>
                      ) : null}
                    </View>
                    <View
                      className="rounded-full border px-2.5 py-[5px]"
                      style={isDeclined
                        ? { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.3)' }
                        : isCompleted
                          ? { backgroundColor: 'rgba(100,100,100,0.12)', borderColor: 'rgba(100,100,100,0.3)' }
                          : { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.3)' }
                      }
                    >
                      <Text
                        className="text-[11px] font-semibold"
                        style={{ fontFamily: 'Poppins_600SemiBold', color: isDeclined ? '#EF4444' : isCompleted ? '#8A8A99' : '#10B981' }}
                      >
                        {isDeclined ? 'Declined' : isCompleted ? 'Completed' : 'Active'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Mark Complete button — only for creators on active collabs */}
                  {isCreator && !isCompleted && !isDeclined && (
                    <TouchableOpacity
                      onPress={() => handleComplete(collab.id, otherName)}
                      disabled={isCompleting}
                      activeOpacity={0.8}
                      style={{
                        marginTop: 10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        paddingVertical: 8,
                        borderRadius: 99,
                        borderWidth: 1,
                        borderColor: 'rgba(16,185,129,0.4)',
                        backgroundColor: 'rgba(16,185,129,0.08)',
                        opacity: isCompleting ? 0.5 : 1,
                      }}
                    >
                      <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
                      <Text style={{ color: '#10B981', fontSize: 13, fontFamily: 'Poppins_600SemiBold' }}>
                        {isCompleting ? 'Completing...' : 'Mark as Completed'}
                      </Text>
                    </TouchableOpacity>
                  )}
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
