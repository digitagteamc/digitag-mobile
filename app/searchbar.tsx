import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import VerifiedBadge from '../Components/ui/VerifiedBadge';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCategories, searchProfiles } from '../services/userService';
import { useRoleTheme } from '../theme/useRoleTheme';

type ResultTab = 'All' | 'Accounts' | 'Posts';

export default function SearchbarScreen() {
  const router = useRouter();
  const { token, isGuest, userRole } = useAuth();
  const theme = useRoleTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [accountResults, setAccountResults] = useState<any[]>([]);
  const [postResults, setPostResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [resultTab, setResultTab] = useState<ResultTab>('All');
  const [activeCategory, setActiveCategory] = useState('All');
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filteredAccounts = useMemo(() => (
    activeCategory === 'All'
      ? accountResults
      : accountResults.filter(item => {
          const cats: string[] = (Array.isArray(item.categoryNames) ? item.categoryNames : []).map((c: string) => c.toLowerCase());
          return cats.includes(activeCategory.toLowerCase());
        })
  ), [accountResults, activeCategory]);

  const filteredPosts = useMemo(() => (
    activeCategory === 'All'
      ? postResults
      : postResults.filter(item => (item.category || '').toLowerCase() === activeCategory.toLowerCase())
  ), [postResults, activeCategory]);

  const showAccounts = resultTab === 'All' || resultTab === 'Accounts';
  const showPosts = resultTab === 'All' || resultTab === 'Posts';
  const totalResults = filteredAccounts.length + filteredPosts.length;

  // Search results are always the OPPOSITE role from the viewer (a Freelancer
  // searches Creators and vice versa, matching the backend's OPPOSITE_FEED_ROLE)
  // — so the filter pills must reflect the categories that role actually has,
  // fetched live rather than hardcoded (which had gone stale and was missing
  // several categories, including the newest one).
  const [categoryPills, setCategoryPills] = useState<string[]>(['All']);
  useEffect(() => {
    if (!token || !userRole) return;
    const targetRole = userRole === 'FREELANCER' ? 'CREATOR' : 'FREELANCER';
    getCategories({ role: targetRole }).then((res) => {
      if (res.success && Array.isArray(res.data)) {
        setCategoryPills(['All', ...res.data.map((c: any) => c.name)]);
      }
    });
  }, [token, userRole]);

  const words = ['Accounts', 'Posts', 'Photography', 'Editors', 'And More'];
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

  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (!searchQuery.trim()) {
      setAccountResults([]);
      setPostResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    searchDebounce.current = setTimeout(async () => {
      if (!token) { setSearchLoading(false); return; }
      const res = await searchProfiles(token, searchQuery.trim());
      setAccountResults(res.success && Array.isArray(res.data?.users) ? res.data.users : []);
      setPostResults(res.success && Array.isArray(res.data?.posts) ? res.data.posts : []);
      setSearchLoading(false);
    }, 350);
    return () => {
      if (searchDebounce.current) clearTimeout(searchDebounce.current);
    };
  }, [searchQuery, token]);

  const openAccount = (userId: string) => {
    if (isGuest || !token) { router.push('/role-selection'); return; }
    router.push({ pathname: '/creator-details', params: { userId } } as any);
  };

  const openPost = (postId: string) => {
    if (isGuest || !token) { router.push('/role-selection'); return; }
    router.push({ pathname: '/post-detail', params: { postId } } as any);
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

      {/* Search Bar */}
      <View className="px-4 mb-4">
        <View className="overflow-hidden" style={styles.searchBar}>
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
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                <Feather name="x-circle" size={16} color="#9a9a9a" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {searchQuery.trim().length > 0 && (
        <>
          {/* Result-type segmented tabs */}
          <View style={styles.segmentRow}>
            {(['All', 'Accounts', 'Posts'] as ResultTab[]).map((tab) => {
              const active = resultTab === tab;
              const count = tab === 'All' ? totalResults : tab === 'Accounts' ? filteredAccounts.length : filteredPosts.length;
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setResultTab(tab)}
                  style={[styles.segmentBtn, active && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segmentText, active && { color: '#fff' }]}>
                    {tab}{!searchLoading ? ` (${count})` : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Category Pills */}
          <View className="mb-3">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
              {categoryPills.map((pill, idx) => {
                const active = pill === activeCategory;
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setActiveCategory(pill)}
                    style={{
                      paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999,
                      borderWidth: 1,
                      borderColor: active ? theme.primary : 'rgba(255,255,255,0.25)',
                      backgroundColor: active ? theme.primary : 'transparent',
                    }}
                  >
                    <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#fff' }}>{pill}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </>
      )}

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {searchQuery.trim().length > 0 ? (
          searchLoading ? (
            <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
          ) : totalResults === 0 ? (
            <Text style={styles.noResultsText}>No results found for "{searchQuery}"</Text>
          ) : (
            <>
              {showAccounts && filteredAccounts.length > 0 && (
                <View className="mb-6">
                  <Text style={styles.sectionHeader}>Accounts</Text>
                  {filteredAccounts.map((item) => (
                    <TouchableOpacity
                      key={`acc-${item.role}-${item.userId}`}
                      style={styles.searchResultItem}
                      activeOpacity={0.75}
                      onPress={() => openAccount(item.userId)}
                    >
                      {item.profilePicture ? (
                        <Image source={{ uri: item.profilePicture }} style={styles.searchResultAvatar} resizeMode="cover" />
                      ) : (
                        <View style={[styles.searchResultAvatar, styles.searchResultAvatarFallback]}>
                          <Text style={styles.searchResultInitial}>{item.name?.charAt(0)?.toUpperCase()}</Text>
                        </View>
                      )}
                      <View style={styles.searchResultText}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={[styles.searchResultName, { flexShrink: 1 }]} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
                          <VerifiedBadge isPremium={item.isPremium} size={13} />
                        </View>
                        <Text style={styles.searchResultMeta} numberOfLines={1}>
                          {item.role.charAt(0) + item.role.slice(1).toLowerCase()}
                          {item.categoryNames?.[0] ? ` · ${item.categoryNames[0]}` : ''}
                          {item.location ? ` · ${item.location}` : ''}
                        </Text>
                      </View>
                      <Feather name="chevron-right" size={18} color="#5a5a5a" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {showPosts && filteredPosts.length > 0 && (
                <View className="mb-6">
                  <Text style={styles.sectionHeader}>Posts</Text>
                  {filteredPosts.map((item) => {
                    const thumb = item.imageUrls?.[0] || item.imageUrl;
                    return (
                      <TouchableOpacity
                        key={`post-${item.id}`}
                        style={styles.searchResultItem}
                        activeOpacity={0.75}
                        onPress={() => openPost(item.id)}
                      >
                        {thumb ? (
                          <Image source={{ uri: thumb }} style={styles.postThumb} resizeMode="cover" />
                        ) : (
                          <View style={[styles.postThumb, styles.searchResultAvatarFallback]}>
                            <Feather name="file-text" size={18} color="#9a9a9a" />
                          </View>
                        )}
                        <View style={styles.searchResultText}>
                          <Text style={styles.searchResultName} numberOfLines={1} ellipsizeMode="tail">
                            {item.description || 'Untitled post'}
                          </Text>
                          <Text style={styles.searchResultMeta} numberOfLines={1}>
                            {item.owner?.name ? `${item.owner.name} · ` : ''}
                            {item.category || (item.location ? item.location : 'Post')}
                          </Text>
                        </View>
                        <Feather name="chevron-right" size={18} color="#5a5a5a" />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </>
          )
        ) : null}
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
  segmentRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  segmentBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  segmentText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#c9c9c9',
  },
  sectionHeader: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 10,
    fontFamily: 'Poppins_600SemiBold',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  searchResultAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
  },
  postThumb: {
    width: 42,
    height: 42,
    borderRadius: 8,
    overflow: 'hidden',
  },
  searchResultAvatarFallback: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultInitial: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchResultText: {
    flex: 1,
  },
  searchResultName: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  searchResultMeta: {
    color: '#9a9a9a',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 1,
  },
  noResultsText: {
    color: '#9a9a9a',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
});
