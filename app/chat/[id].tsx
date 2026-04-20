import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import {
    getConversation,
    listMessages,
    sendMessage as apiSendMessage,
} from '../../services/userService';

const ACCENT = '#7352DD';

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
    try {
        const d = new Date(dateStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
        return '';
    }
}

export default function ChatScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { token, userId } = useAuth();

    const [other, setOther] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [input, setInput] = useState('');
    const listRef = useRef<FlatList<any> | null>(null);

    const load = useCallback(async () => {
        if (!token || !id) return;
        const [convRes, msgsRes] = await Promise.all([
            getConversation(token, String(id)),
            listMessages(token, String(id), { limit: 50 }),
        ]);
        if (convRes.success) setOther(convRes.data?.other || null);
        if (msgsRes.success) setMessages(msgsRes.data || []);
        setLoading(false);
    }, [token, id]);

    useEffect(() => { load(); }, [load]);

    // Light polling so new messages from the other party show up.
    useEffect(() => {
        if (!token || !id) return;
        const interval = setInterval(async () => {
            const res = await listMessages(token, String(id), { limit: 50 });
            if (res.success) setMessages(res.data || []);
        }, 5000);
        return () => clearInterval(interval);
    }, [token, id]);

    const handleSend = async () => {
        const text = input.trim();
        if (!text || !token || !id) return;
        setSending(true);
        const optimistic = {
            id: `tmp-${Date.now()}`,
            conversationId: id,
            senderId: userId,
            content: text,
            isRead: false,
            createdAt: new Date().toISOString(),
            pending: true,
        };
        setMessages((prev) => [...prev, optimistic]);
        setInput('');
        try {
            const res = await apiSendMessage(token, String(id), text);
            if (!res.success) {
                Alert.alert('Send Failed', res.error || 'Could not send message');
                setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
                setInput(text);
                return;
            }
            setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? res.data : m)));
        } finally {
            setSending(false);
            setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
        }
    };

    const name = other?.name || (other?.role === 'FREELANCER' ? 'Freelancer' : 'Creator');
    const pic = other?.profilePicture || null;

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.headerIconBtn}
                    onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/messages'))}
                >
                    <Ionicons name="chevron-back" size={20} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerMid}>
                    {pic ? (
                        <Image source={{ uri: pic }} style={styles.headerAvatar} />
                    ) : (
                        <View style={[styles.headerAvatar, styles.headerInitialsAvatar]}>
                            <Text style={styles.headerInitialsText}>{getInitials(name)}</Text>
                        </View>
                    )}
                    <View>
                        <Text style={styles.headerName}>{name}</Text>
                        <Text style={styles.headerRole}>{other?.role || ''}</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.headerIconBtn}
                    onPress={() => Alert.alert('Coming Soon', 'In-app calling is not yet wired up.')}
                >
                    <Ionicons name="call" size={18} color="#fff" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centerWrap}>
                    <ActivityIndicator color={ACCENT} size="large" />
                </View>
            ) : (
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
                    style={{ flex: 1 }}
                >
                    <FlatList
                        ref={listRef}
                        data={messages}
                        keyExtractor={(m) => m.id}
                        contentContainerStyle={styles.messagesContent}
                        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
                        renderItem={({ item }) => {
                            const mine = item.senderId === userId;
                            return (
                                <View style={[styles.bubbleRow, mine ? styles.rowRight : styles.rowLeft]}>
                                    <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                                        <Text style={mine ? styles.bubbleTextMine : styles.bubbleTextTheirs}>
                                            {item.content}
                                        </Text>
                                        <Text style={[styles.bubbleTime, mine ? styles.timeMine : styles.timeTheirs]}>
                                            {formatTime(item.createdAt)}{item.pending ? '  ·  sending…' : ''}
                                        </Text>
                                    </View>
                                </View>
                            );
                        }}
                        ListEmptyComponent={
                            <View style={styles.emptyBox}>
                                <Ionicons name="chatbubbles-outline" size={42} color="#3A3A47" />
                                <Text style={styles.emptyText}>Say hi to start the conversation</Text>
                            </View>
                        }
                    />

                    <View style={styles.composer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Type a message…"
                            placeholderTextColor="#6B6B7A"
                            value={input}
                            onChangeText={setInput}
                            multiline
                            maxLength={4000}
                        />
                        <TouchableOpacity
                            style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
                            onPress={handleSend}
                            disabled={!input.trim() || sending}
                        >
                            {sending ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Ionicons name="paper-plane" size={18} color="#fff" />
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#0A0A10' },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#1C1C24',
    },
    headerIconBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#1A1A22',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerMid: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2A2A32' },
    headerInitialsAvatar: { alignItems: 'center', justifyContent: 'center' },
    headerInitialsText: { color: '#fff', fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
    headerName: { color: '#fff', fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
    headerRole: { color: '#8A8A99', fontSize: 11, fontFamily: 'Poppins_400Regular' },

    centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    messagesContent: {
        paddingHorizontal: 12,
        paddingVertical: 16,
        gap: 8,
        flexGrow: 1,
    },
    bubbleRow: { flexDirection: 'row' },
    rowRight: { justifyContent: 'flex-end' },
    rowLeft: { justifyContent: 'flex-start' },
    bubble: {
        maxWidth: '78%',
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 18,
    },
    bubbleMine: { backgroundColor: ACCENT, borderBottomRightRadius: 4 },
    bubbleTheirs: { backgroundColor: '#1C1C24', borderBottomLeftRadius: 4 },
    bubbleTextMine: { color: '#fff', fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 20 },
    bubbleTextTheirs: { color: '#fff', fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 20 },
    bubbleTime: { fontSize: 10, marginTop: 4, fontFamily: 'Poppins_400Regular' },
    timeMine: { color: 'rgba(255,255,255,0.7)', alignSelf: 'flex-end' },
    timeTheirs: { color: '#6B6B7A', alignSelf: 'flex-start' },

    emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 8 },
    emptyText: { color: '#6B6B7A', fontSize: 13, fontFamily: 'Poppins_400Regular' },

    composer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#1C1C24',
        gap: 10,
        backgroundColor: '#0A0A10',
    },
    input: {
        flex: 1,
        minHeight: 42,
        maxHeight: 120,
        backgroundColor: '#1C1C24',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 10,
        color: '#fff',
        fontSize: 14,
        fontFamily: 'Poppins_400Regular',
    },
    sendBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: ACCENT,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendBtnDisabled: { opacity: 0.5 },
});
