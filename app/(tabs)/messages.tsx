import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { listConversations } from '../../services/userService';

const ACCENT = '#F26930';

function getInitials(name: string | null | undefined) {
    if (!name) return 'U';
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase();
}

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
    const { token, isGuest } = useAuth();

    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');

    const load = useCallback(async () => {
        if (!token || isGuest) { setConversations([]); setLoading(false); return; }
        const res = await listConversations(token);
        if (res.success) setConversations(res.data || []);
        setLoading(false);
    }, [token, isGuest]);

    useEffect(() => { load(); }, [load]);

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

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
            <View style={styles.bgBlob} />
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
                        placeholder="Search here"
                        placeholderTextColor="#6B6B7A"
                        value={search}
                        onChangeText={setSearch}
                        autoCapitalize="none"
                    />
                </View>
            </View>

            {loading ? (
                <View style={styles.centerWrap}>
                    <ActivityIndicator color={ACCENT} size="large" />
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
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
                    contentContainerStyle={{ paddingBottom: 120 }}
                    renderItem={({ item }) => {
                        const name = item.other?.name || (item.other?.role === 'FREELANCER' ? 'Freelancer' : 'Creator');
                        const pic = item.other?.profilePicture || null;
                        const preview = item.lastMessage?.content || 'Say hi to start the conversation';
                        const when = formatTime(item.lastMessageAt || item.createdAt);
                        const unread = item.unreadCount || 0;
                        return (
                            <TouchableOpacity style={styles.row} activeOpacity={0.8} onPress={() => handleOpen(item)}>
                                {pic ? (
                                    <Image source={{ uri: pic }} style={styles.avatar} />
                                ) : (
                                    <View style={[styles.avatar, styles.initialsAvatar]}>
                                        <Text style={styles.initialsText}>{getInitials(name)}</Text>
                                    </View>
                                )}
                                <View style={styles.rowBody}>
                                    <Text style={styles.rowName} numberOfLines={1}>{name}</Text>
                                    <Text style={styles.rowPreview} numberOfLines={1}>{preview}</Text>
                                </View>
                                <View style={styles.rowRight}>
                                    <Text style={styles.rowTime}>{when}</Text>
                                    {unread > 0 ? (
                                        <View style={styles.unreadBadge}>
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

    bgBlob: {
        position: 'absolute',
        width: 405,
        height: 400,
        borderRadius: 340,
        backgroundColor: 'rgba(237, 42, 145, 0.15)',
        filter: 'blur(65px)',
    },

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
    title: { color: '#fff', fontSize: 24, fontFamily: 'Poppins_500Regular', lineHeight: 33, },
    subtitle: { color: '#E2E2E2', fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2, lineHeight: 18 },

    searchWrap: { paddingHorizontal: 16, paddingBottom: 14, borderRadius: 12, marginTop: 15 },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: "rgba(167, 167, 167, 0.14)",
        boxShadow: "0 -3px 3px 0 rgba(255, 255, 255, 0.25) inset, 0 3px 3px 0 rgba(255, 255, 255, 0.25) inset, -42px 103px 31px 0 rgba(145, 145, 145, 0.00), -27px 66px 29px 0 rgba(145, 145, 145, 0.01), -15px 37px 24px 0 rgba(145, 145, 145, 0.03), -7px 17px 18px 0 rgba(145, 145, 145, 0.04), -2px 4px 10px 0 rgba(145, 145, 145, 0.05)",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderColor: "rgba(156, 156, 156, 0.50)",
        borderWidth: 1,
        backdropFilter: 'blur(10px)',
        width: 385,
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
        backgroundColor: ACCENT,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
    },
    unreadText: { color: '#fff', fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
});
