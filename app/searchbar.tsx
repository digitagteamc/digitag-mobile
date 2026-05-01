import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { searchProfiles } from '../services/userService';
import { getRoleTheme } from '../theme/useRoleTheme';

export default function SearchbarScreen() {
  const router = useRouter();
  const { userRole, token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const recentSearches = ['Video graphers', 'Content Creator', 'Editors', 'Cameraman'];
  const recentTags = ['Influencer', 'Video Grapher', 'Content', 'Reel'];
  
  const filterPills = [
    'All Feed',
    ...(userRole === 'FREELANCER' ? ['Creators', 'Brands'] : ['Freelancers', 'Agencies']),
    'Paid Collab'
  ];

  const words = ['Animator', 'Editors', 'Content Writers', 'And More', 'Animator'];
  const translateY = useRef(new Animated.Value(0)).current;
  const currentIndex = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      currentIndex.current += 1;
      
      Animated.timing(translateY, {
        toValue: -(currentIndex.current * 20),
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        if (currentIndex.current === words.length - 1) {
          translateY.setValue(0);
          currentIndex.current = 0;
        }
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [translateY]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchQuery.trim() || !token) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await searchProfiles(token, searchQuery);
        if (res.success) {
          setResults(res.data);
        }
      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, token]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#060606]" edges={['top', 'bottom']}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      {/* Header with Back Button */}
      <View className="px-4 py-4 flex-row items-center">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/5 items-center justify-center border border-white/10"
        >
          <Feather name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="text-white text-lg ml-4 font-semibold" style={{ fontFamily: 'Poppins_600SemiBold' }}>Search</Text>
      </View>

      {/* Search Bar & Filter */}
      <View className="px-4 flex-row items-center gap-3 mb-6">
        <View className="flex-1 overflow-hidden" style={styles.searchBar}>
          <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.02)', 'rgba(255,255,255,0.08)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.searchBarInner}>
            <Feather name="search" size={18} color="#d6d6d6" />
            <TextInput
              style={{ flex: 1, color: '#fff', fontFamily: 'Poppins_400Regular', fontSize: 13, height: '100%', paddingVertical: 0 }}
              placeholder=""
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={true}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
              cursorColor="#fff"
            />
            {searchQuery.length === 0 && (
              <View style={styles.placeholderContainer} pointerEvents="none">
                <Text style={{ 
                  fontFamily: 'Poppins_400Regular', 
                  fontSize: 13, 
                  color: '#9a9a9a',
                  height: 20,
                  lineHeight: 20
                }}>
                  Search here for{' '}
                </Text>
                <View style={{ height: 20, overflow: 'hidden' }}>
                  <Animated.View style={{ transform: [{ translateY }] }}>
                    {words.map((word, idx) => (
                      <Text 
                        key={idx} 
                        style={{ 
                          fontFamily: 'Poppins_400Regular', 
                          fontSize: 13, 
                          color: '#fff', 
                          height: 20, 
                          lineHeight: 20 
                        }}
                      >
                        {word}
                      </Text>
                    ))}
                  </Animated.View>
                </View>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          className="w-14 overflow-hidden items-center justify-center"
          style={styles.filterBtn}
        >
          <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.02)', 'rgba(255,255,255,0.08)']}
            style={StyleSheet.absoluteFill}
          />
          <Feather name="filter" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Horizontal Filter Pills */}
      <View className="mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
          {filterPills.map((pill, idx) => (
            <TouchableOpacity key={idx} className="px-5 py-2.5 rounded-full border border-white/30 bg-transparent">
              <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>{pill}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {loading && <ActivityIndicator color="#ED2A91" style={{ marginTop: 20 }} />}
        
        {searchQuery.length > 0 && !loading && (
          <View className="mt-4">
            {results.length > 0 ? (
              results.map((item) => {
                const roleTheme = getRoleTheme(item.role);
                return (
                  <TouchableOpacity
                    key={item.profileId}
                    className="flex-row items-center gap-3 p-4 mb-3 rounded-2xl bg-[#1E1E24] border border-white/10"
                    onPress={() => router.push({ pathname: '/creator-details', params: { userId: item.userId } } as any)}
                  >
                    {item.profilePicture ? (
                      <Image source={{ uri: item.profilePicture }} className="w-12 h-12 rounded-full" />
                    ) : (
                      <View className="w-12 h-12 rounded-full bg-white/10 items-center justify-center">
                        <Text className="text-white font-bold">{getInitials(item.name)}</Text>
                      </View>
                    )}
                    <View className="flex-1">
                      <Text className="text-white font-semibold" style={{ fontFamily: 'Poppins_600SemiBold' }}>{item.name}</Text>
                      <Text className="text-white/60 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>{item.category || item.role}</Text>
                    </View>
                    <View className="px-3 py-1 rounded-full" style={{ backgroundColor: roleTheme.light }}>
                      <Text style={{ color: roleTheme.primary, fontSize: 10, fontWeight: 'bold' }}>{item.role}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text className="text-white/40 text-center mt-10">No {userRole === 'CREATOR' ? 'Freelancers' : 'Creators'} found.</Text>
            )}
          </View>
        )}

        {searchQuery.length === 0 && (
          <>
            {/* Recent Searches */}
            <View className="mb-8 mt-4">
              <Text className="text-white text-[17px] mb-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>Recent Searches</Text>
              <View className="flex-row flex-wrap gap-3">
                {recentSearches.map((item, idx) => (
                  <TouchableOpacity key={idx} className="flex-row items-center gap-2 px-4 py-2.5 rounded-xl bg-[#d1d4f9]">
                    <Feather name="clock" size={15} color="#000" />
                    <Text className="text-black text-[13px]" style={{ fontFamily: 'Poppins_500Medium' }}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Recent Tags */}
            <View className="mb-8">
              <Text className="text-white text-[17px] mb-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>Recent Tags</Text>
              <View className="flex-row flex-wrap gap-3">
                {recentTags.map((item, idx) => (
                  <TouchableOpacity key={idx} className="px-5 py-2.5 rounded-full border border-white/20 bg-white/5">
                    <Text className="text-white text-[13px]" style={{ fontFamily: 'Poppins_400Medium' }}># {item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(156, 156, 156, 0.40)',
    backgroundColor: 'rgba(70, 70, 70, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 10,
  },
  searchBarInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  placeholderContainer: {
    position: 'absolute',
    left: 48,
    right: 16,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterBtn: {
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(156, 156, 156, 0.40)',
    backgroundColor: 'rgba(70, 70, 70, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 10,
  }
});
