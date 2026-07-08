import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { listConversations, openConversationWith, searchProfiles } from '../../services/userService';
import { useRoleTheme } from '../../theme/useRoleTheme';


function formatTime(dateStr: string | null | undefined) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
}

export default function MessagesTab() {
    const router = useRouter();
    const { token, isGuest, userRole } = useAuth();

    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [profileResults, setProfileResults] = useState<any[]>([]);
    const [profileLoading, setProfileLoading] = useState(false);
    const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

    const load = useCallback(async () => {
        if (!token || isGuest) { setConversations([]); setLoading(false); return; }
        const res = await listConversations(token);
        if (res.success) setConversations(res.data || []);
        setLoading(false);
    }, [token, isGuest]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        if (searchDebounce.current) clearTimeout(searchDebounce.current);
        if (!search.trim()) { setProfileResults([]); setProfileLoading(false); return; }
        setProfileLoading(true);
        searchDebounce.current = setTimeout(async () => {
            if (!token) { setProfileLoading(false); return; }
            const res = await searchProfiles(token, search.trim());
            setProfileResults(res.success ? res.data : []);
            setProfileLoading(false);
        }, 350);
        return () => { if (searchDebounce.current) clearTimeout(searchDebounce.current); };
    }, [search, token]);

    const onRefresh = async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    };

    const filtered = conversations.filter((c) => {
        if (!search.trim()) return true;
        const q = search.trim().toLowerCase();
        const name = (c.other?.name || '').toLowerCase();
        const msg = (c.lastMessage?.content || '').toLowerCase();
        return name.includes(q) || msg.includes(q);
    });

    const handleOpen = (conv: any) => {
        router.push({ pathname: '/chat/[id]', params: { id: conv.id } } as any);
    };

    // UI colors based on viewer's role
    const theme = useRoleTheme();
    const accentColor = theme.primary;

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
            <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.headerIconBtn}
                    onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
                >
                    <Ionicons name="arrow-back" size={20} color="#fff" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>Messages</Text>
                    <Text style={styles.subtitle}>Your Collab Conversations</Text>
                </View>
            </View>

            <View style={styles.searchWrap}>
                <View style={styles.searchBar}>
                    <Ionicons name="search-outline" size={18} color="#6B6B7A" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search chats or find people..."
                        placeholderTextColor="#6B6B7A"
                        value={search}
                        onChangeText={setSearch}
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="search"
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Feather name="x" size={16} color="#6B6B7A" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* PROFILE SEARCH RESULTS */}
                {search.trim().length > 0 && (
                    <View style={styles.profileResultsPanel}>
                        <Text style={styles.profileResultsLabel}>People</Text>
                        {profileLoading ? (
                            <ActivityIndicator size="small" color={accentColor} style={{ paddingVertical: 14 }} />
                        ) : profileResults.length === 0 ? (
                            <Text style={styles.noResultsText}>No profiles found for "{search}"</Text>
                        ) : (
                            profileResults.map((item) => (
                                <TouchableOpacity
                                    key={`${item.role}-${item.userId}`}
                                    style={styles.profileResultItem}
                                    activeOpacity={0.75}
                                    onPress={async () => {
                                        if (!token) { router.push('/role-selection' as any); return; }
                                        setSearch('');
                                        const res = await openConversationWith(token, item.userId);
                                        if (res.success && res.data?.id) {
                                            router.push(`/chat/${res.data.id}` as any);
                                        }
                                    }}
                                >
                                    <Image source={item.profilePicture ? { uri: item.profilePicture } : require('../../assets/images/icon.png')} style={styles.profileResultAvatar} resizeMode="cover" />
                                    <View style={styles.profileResultText}>
                                        <Text style={styles.profileResultName}>{item.name}</Text>
                                        <Text style={styles.profileResultMeta}>
                                            {item.role.charAt(0) + item.role.slice(1).toLowerCase()}
                                            {item.category ? ` · ${item.category}` : ''}
                                        </Text>
                                    </View>
                                    <Ionicons name="chatbubble-ellipses-outline" size={18} color={accentColor} />
                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                )}
            </View>

            {loading ? (
                <View style={styles.centerWrap}>
                    <ActivityIndicator color={accentColor} size="large" />
                </View>
            ) : filtered.length === 0 ? (
                <View style={styles.emptyBox}>
                    <Ionicons name="chatbubbles-outline" size={48} color="#3A3A47" />
                    <Text style={styles.emptyTitle}>No conversations yet</Text>
                    <Text style={styles.emptySubtitle}>
                        Accepted collab requests open a chat here. Send or accept a request to get started.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(c) => c.id}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentColor} />}
                    contentContainerStyle={{ paddingBottom: 120 }}
                    renderItem={({ item }) => {
                        const name = item.other?.name || (item.other?.role === 'FREELANCER' ? 'Freelancer' : 'Creator');
                        const pic = item.other?.profilePicture || null;
                        const preview = item.lastMessage?.content || 'Say hi to start the conversation';
                        const when = formatTime(item.lastMessageAt || item.createdAt);
                        const unread = item.unreadCount || 0;
                        return (
                            <TouchableOpacity style={styles.row} activeOpacity={0.8} onPress={() => handleOpen(item)}>
                                <Image source={pic ? { uri: pic } : require('../../assets/images/icon.png')} style={styles.avatar} resizeMode="cover" />
                                <View style={styles.rowBody}>
                                    <Text style={styles.rowName} numberOfLines={1}>{name}</Text>
                                    <Text style={styles.rowPreview} numberOfLines={1}>{preview}</Text>
                                </View>
                                <View style={styles.rowRight}>
                                    <Text style={styles.rowTime}>{when}</Text>
                                    {unread > 0 ? (
                                        <View style={[styles.unreadBadge, { backgroundColor: accentColor }]}>
                                            <Text style={styles.unreadText}>{unread}</Text>
                                        </View>
                                    ) : null}
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#0A0A10' },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 10,
        marginTop: 20
    },
    headerIconBtn: {
        width: 36,
        height: 36,
        paddingBottom: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: { color: '#fff', fontSize: 24, fontFamily: 'Poppins_600SemiBold', lineHeight: 33, },
    subtitle: { color: '#E2E2E2', fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2, lineHeight: 18 },

    searchWrap: { paddingHorizontal: 16, paddingBottom: 14, borderRadius: 12, marginTop: 15 },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: "rgba(167, 167, 167, 0.14)",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderColor: "rgba(156, 156, 156, 0.50)",
        borderWidth: 1,
        height: 56,
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        fontSize: 14,
        fontFamily: 'Poppins_400Regular',

        textAlignVertical: 'center', // ✅ Android
        paddingVertical: 0,          // ✅ removes extra space
        includeFontPadding: false,   // 🔥 Android perfect centering
    },
    centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', },

    emptyBox: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        gap: 10,
    },
    emptyTitle: { color: '#fff', fontSize: 16, fontFamily: 'Poppins_600SemiBold', marginTop: 10 },
    emptySubtitle: { color: '#8A8A99', fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 20 },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    avatar: { width: 52, height: 52, borderRadius: 52, backgroundColor: '#2A2A32' },
    initialsAvatar: { alignItems: 'center', justifyContent: 'center' },
    initialsText: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 14 },

    rowBody: { flex: 1 },
    rowName: { color: '#fff', fontSize: 18, fontFamily: 'Poppins_400Regular', lineHeight: 20, letterSpacing: -0.50 },
    rowPreview: { color: '#8A8A99', fontSize: 13, fontFamily: 'Poppins_400Regular', marginTop: 3 },

    rowRight: { alignItems: 'flex-end', gap: 6 },
    rowTime: { color: '#FFF', fontSize: 12, fontFamily: 'Poppins_400Regular', letterSpacing: -0.50 },
    unreadBadge: {
        minWidth: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
    },
    unreadText: { color: '#fff', fontSize: 11, fontFamily: 'Poppins_600SemiBold' },

    profileResultsPanel: {
        backgroundColor: '#13131A',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(156,156,156,0.2)',
        marginTop: 10,
        overflow: 'hidden',
        paddingTop: 4,
    },
    profileResultsLabel: {
        color: '#6B6B7A',
        fontSize: 11,
        fontFamily: 'Poppins_600SemiBold',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        paddingHorizontal: 14,
        paddingTop: 10,
        paddingBottom: 6,
    },
    profileResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        gap: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(255,255,255,0.06)',
    },
    profileResultAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
    },
    profileResultAvatarFallback: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileResultInitial: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Poppins_600SemiBold',
    },
    profileResultText: { flex: 1 },
    profileResultName: {
        color: '#fff',
        fontSize: 14,
        fontFamily: 'Poppins_600SemiBold',
    },
    profileResultMeta: {
        color: '#6B6B7A',
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
        marginTop: 1,
    },
    noResultsText: {
        color: '#6B6B7A',
        fontSize: 13,
        textAlign: 'center',
        paddingVertical: 18,
        paddingHorizontal: 16,
        fontFamily: 'Poppins_400Regular',
    },
});
