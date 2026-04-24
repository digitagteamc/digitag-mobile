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
    sendMessage as apiSendMessage,
    getConversation,
    listMessages,
} from '../../services/userService';

const DARK_BUBBLE = '#1C1C1C';

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
    const { token, userId, userRole } = useAuth();

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
    
    // Dynamic colors based on role
    const otherColor = other?.role === 'FREELANCER' ? '#F26930' : '#E91E8C';
    const myAccent = userRole === 'FREELANCER' ? '#E91E8C' : '#F26930';
    const blobColor = userRole === 'FREELANCER' ? 'rgba(237, 42, 145, 0.15)' : 'rgba(242, 105, 48, 0.15)';

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
            <View style={[styles.bgBlob, { backgroundColor: blobColor }]} />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.headerBackBtn}
                    onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/messages'))}
                >
                    <Ionicons name="chevron-back" size={24} color="#fff" />
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
                        <Text style={styles.headerStatus}>Last Seen at 11:30am</Text>
                    </View>
                </View>

                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.headerIconBtn}>
                        <Ionicons name="videocam-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerIconBtn}>
                        <Ionicons name="call-outline" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <View style={styles.centerWrap}>
                    <ActivityIndicator color={myAccent} size="large" />
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
                        ListHeaderComponent={
                            <View style={styles.dateSeparator}>
                                <Text style={styles.dateText}>Today</Text>
                            </View>
                        }
                        renderItem={({ item }) => {
                            const mine = item.senderId === userId;
                            return (
                                <View style={[styles.bubbleWrapper, mine ? styles.rowRight : styles.rowLeft]}>
                                    <View style={[
                                        styles.bubble, 
                                        mine ? styles.bubbleMine : { ...styles.bubbleTheirs, backgroundColor: otherColor }
                                    ]}>
                                        <Text style={styles.bubbleText}>
                                            {item.content}
                                        </Text>
                                    </View>
                                    {mine && (
                                        <View style={styles.mineMeta}>
                                            <Text style={styles.mineTime}>{formatTime(item.createdAt)}</Text>
                                            <Ionicons name="checkmark-done" size={16} color="#fff" style={{ marginLeft: 4 }} />
                                        </View>
                                    )}
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

                    <View style={styles.composerWrapper}>
                        <View style={styles.composer}>
                            <TouchableOpacity style={[styles.composerCircleBtn, { backgroundColor: myAccent }]}>
                                <Ionicons name="camera" size={20} color="#fff" />
                            </TouchableOpacity>
                            
                            <TextInput
                                style={styles.input}
                                placeholder="Type a Message..."
                                placeholderTextColor="#8A8A99"
                                value={input}
                                onChangeText={setInput}
                                multiline
                                maxLength={4000}
                            />

                            <TouchableOpacity style={styles.attachBtn}>
                                <Ionicons name="attach" size={24} color="#fff" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.composerCircleBtn, { backgroundColor: myAccent }, (!input.trim() || sending) && styles.sendBtnDisabled]}
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
                    </View>
                </KeyboardAvoidingView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#060606' },

    bgBlob: {
        position: 'absolute',
        top: -50,
        right: -50,
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
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        marginTop: Platform.OS === 'android' ? 10 : 0,
    },
    headerBackBtn: {
        paddingRight: 12,
    },
    headerMid: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#2A2A32',
    },
    headerInitialsAvatar: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerInitialsText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Poppins_600SemiBold',
    },
    headerName: {
        color: '#fff',
        fontSize: 18,
        fontFamily: 'Poppins_600SemiBold',
        lineHeight: 24,
    },
    headerStatus: {
        color: '#8A8A99',
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    headerIconBtn: {
        padding: 4,
    },

    centerWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    messagesContent: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        flexGrow: 1,
    },
    dateSeparator: {
        alignItems: 'center',
        marginVertical: 20,
    },
    dateText: {
        color: '#8A8A99',
        fontSize: 14,
        fontFamily: 'Poppins_400Regular',
    },

    bubbleWrapper: {
        marginBottom: 16,
    },
    rowRight: {
        alignItems: 'flex-end',
    },
    rowLeft: {
        alignItems: 'flex-start',
    },
    bubble: {
        maxWidth: '85%',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
    },
    bubbleMine: {
        backgroundColor: DARK_BUBBLE,
        borderBottomRightRadius: 2,
    },
    bubbleTheirs: {
        borderBottomLeftRadius: 2,
    },
    bubbleText: {
        color: '#fff',
        fontSize: 15,
        fontFamily: 'Poppins_400Regular',
        lineHeight: 22,
    },
    mineMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    mineTime: {
        color: '#fff',
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
    },

    emptyBox: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
        gap: 12,
    },
    emptyText: {
        color: '#6B6B7A',
        fontSize: 14,
        fontFamily: 'Poppins_400Regular',
    },

    composerWrapper: {
        paddingHorizontal: 16,
        paddingBottom: Platform.OS === 'ios' ? 0 : 16,
        backgroundColor: 'transparent',
        marginBottom:20
    },
    composer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 30,
        paddingHorizontal: 8,
        paddingVertical: 8,
        gap: 8,
    },
    composerCircleBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 15,
        fontFamily: 'Poppins_400Regular',
        maxHeight: 100,
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    attachBtn: {
        padding: 4,
    },
    sendBtnDisabled: {
        opacity: 0.6,
    },
});
