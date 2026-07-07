import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    ImageBackground,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../../context/AuthContext';
import {
    deleteMessage as apiDeleteMessage,
    editMessage as apiEditMessage,
    sendMessage as apiSendMessage,
    getConversation,
    initiateCall,
    listMessages,
    uploadMessageImage,
} from '../../services/userService';
import { useRoleTheme } from '../../theme/useRoleTheme';

const chatBg = require('../../assets/bg-chat.webp');
const DARK_BUBBLE = '#1E1E26';
const REACTIONS = ['❤️', '👍', '😂', '😮', '🙏', '😢'];

interface ChatMessage {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    imageUrl?: string | null;
    isRead: boolean;
    isEdited?: boolean;
    isDeleted?: boolean;
    createdAt: string;
    pending?: boolean;
    reactions?: Record<string, string[]>;
}

function getInitials(name: string | null | undefined) {
    if (!name) return 'U';
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

function formatTime(dateStr: string | null | undefined) {
    if (!dateStr) return '';
    try { return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
}

function formatLastSeen(dateStr: string | null | undefined): string {
    if (!dateStr) return 'Last seen recently';
    const d = new Date(dateStr);
    const diffMs = Date.now() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 2) return 'Online';
    if (diffMins < 60) return `Last seen ${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `Last seen today at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    if (diffHrs < 48) return 'Last seen yesterday';
    return `Last seen ${d.toLocaleDateString([], { day: 'numeric', month: 'short' })}`;
}

export default function ChatScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { token, userId } = useAuth();
    const insets = useSafeAreaInsets();
    const myTheme = useRoleTheme();

    const [other, setOther] = useState<any>(null);
    const otherRef = useRef<any>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [input, setInput] = useState('');
    const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
    const [editingMsg, setEditingMsg] = useState<ChatMessage | null>(null);
    const [imageToSend, setImageToSend] = useState<ImagePicker.ImagePickerAsset | null>(null);
    // Long-press context menu state
    const [ctxMsg, setCtxMsg] = useState<ChatMessage | null>(null);
    const [ctxMine, setCtxMine] = useState(false);
    const [viewImageUrl, setViewImageUrl] = useState<string | null>(null);

    const listRef = useRef<FlatList<ChatMessage> | null>(null);
    const inputRef = useRef<TextInput>(null);
    const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());

    const load = useCallback(async () => {
        if (!token || !id) return;
        const [convRes, msgsRes] = await Promise.all([
            getConversation(token, String(id)),
            listMessages(token, String(id), { limit: 50 }),
        ]);
        if (convRes.success && convRes.data?.other) {
            setOther(convRes.data.other);
            otherRef.current = convRes.data.other;
        }
        if (msgsRes.success) setMessages(msgsRes.data || []);
        setLoading(false);
        // Anchor to the latest message on open, same as WhatsApp — without this the
        // inverted list can settle at an inconsistent initial offset once images/
        // variable-height rows finish measuring.
        requestAnimationFrame(() => {
            listRef.current?.scrollToOffset({ offset: 0, animated: false });
        });
    }, [token, id]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        if (!token || !id) return;
        const interval = setInterval(async () => {
            const [msgsRes, convRes] = await Promise.all([
                listMessages(token, String(id), { limit: 50 }),
                getConversation(token, String(id)),
            ]);
            if (msgsRes.success) setMessages(msgsRes.data || []);
            if (convRes.success && convRes.data?.other) {
                setOther(convRes.data.other);
                otherRef.current = convRes.data.other;
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [token, id]);

    // Scroll to latest messages when keyboard opens (inverted list: offset 0 = bottom)
    useEffect(() => {
        const sub = Keyboard.addListener('keyboardDidShow', () => {
            listRef.current?.scrollToOffset({ offset: 0, animated: false });
        });
        return () => sub.remove();
    }, []);

    // ── Camera / Gallery ────────────────────────────────────────────────────────
    const handleCamera = async () => {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) { Alert.alert('Permission Required', 'Camera access is needed to take photos.'); return; }
        const result = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.75, allowsEditing: true });
        if (!result.canceled && result.assets[0]) setImageToSend(result.assets[0]);
    };

    const handleAttach = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.75 });
        if (!result.canceled && result.assets[0]) setImageToSend(result.assets[0]);
    };

    // ── Send / Edit ─────────────────────────────────────────────────────────────
    const handleSend = async () => {
        if (!token || !id) return;

        if (editingMsg) {
            const text = input.trim();
            if (!text) return;
            setMessages((prev) => prev.map((m) => m.id === editingMsg.id ? { ...m, content: text, isEdited: true } : m));
            setEditingMsg(null);
            setInput('');
            apiEditMessage(token, String(id), editingMsg.id, text).catch(() => { });
            return;
        }

        const text = input.trim();
        if (!text && !imageToSend) return;

        setSending(true);
        const optimisticId = `tmp-${Date.now()}`;
        const optimistic: ChatMessage = {
            id: optimisticId, conversationId: String(id), senderId: userId!,
            content: text, imageUrl: imageToSend ? imageToSend.uri : null,
            isRead: false, createdAt: new Date().toISOString(), pending: true,
        };
        setMessages((prev) => [...prev, optimistic]);
        setInput('');
        setImageToSend(null);
        const capturedReplyTo = replyTo;
        setReplyTo(null);

        try {
            let uploadedUrl: string | undefined;
            if (imageToSend) {
                const upRes = await uploadMessageImage(token, imageToSend);
                if (upRes.success && upRes.data?.url) uploadedUrl = upRes.data.url;
            }
            const finalContent = capturedReplyTo
                ? `> ${capturedReplyTo.content.slice(0, 80)}${capturedReplyTo.content.length > 80 ? '…' : ''}\n\n${text}`
                : text;
            const res = await apiSendMessage(token, String(id), finalContent, uploadedUrl);
            if (!res.success) {
                setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
                setInput(text);
                Alert.alert('Send Failed', (res as any).error || 'Could not send message');
                return;
            }
            setMessages((prev) => prev.map((m) => (m.id === optimisticId ? res.data : m)));
        } finally {
            setSending(false);
            // List is inverted, so the bottom (newest message) is offset 0 — scrollToEnd()
            // would instead jump to the oldest message at the opposite end of the list.
            setTimeout(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }), 80);
        }
    };

    // ── WhatsApp long-press context menu ───────────────────────────────────────
    const handleLongPress = (msg: ChatMessage, mine: boolean) => {
        setCtxMsg(msg);
        setCtxMine(mine);
    };

    const handleReaction = (emoji: string) => {
        if (!ctxMsg) return;
        setMessages((prev) => prev.map((m) => {
            if (m.id !== ctxMsg.id) return m;
            const existing = m.reactions || {};
            const users = existing[emoji] || [];
            const alreadyReacted = users.includes(userId!);
            return {
                ...m,
                reactions: {
                    ...existing,
                    [emoji]: alreadyReacted
                        ? users.filter((u) => u !== userId)
                        : [...users, userId!],
                },
            };
        }));
        setCtxMsg(null);
    };

    const handleCtxEdit = () => {
        if (!ctxMsg) return;
        setEditingMsg(ctxMsg);
        setInput(ctxMsg.content);
        setCtxMsg(null);
        setTimeout(() => inputRef.current?.focus(), 150);
    };

    const handleCtxReply = () => {
        if (!ctxMsg) return;
        setReplyTo(ctxMsg);
        setCtxMsg(null);
        setTimeout(() => inputRef.current?.focus(), 150);
    };

    const handleCtxCopy = async () => {
        if (!ctxMsg) return;
        await Clipboard.setStringAsync(ctxMsg.content || '');
        setCtxMsg(null);
    };

    const handleCtxDelete = () => {
        if (!ctxMsg || !token || !id) return;
        const targetId = ctxMsg.id;
        setCtxMsg(null);
        Alert.alert(
            'Delete message?',
            'This message will be deleted for everyone in this chat.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setMessages((prev) => prev.map((m) =>
                            m.id === targetId ? { ...m, content: '', imageUrl: null, isDeleted: true } : m
                        ));
                        const res = await apiDeleteMessage(token, String(id), targetId);
                        if (!res.success) {
                            Alert.alert('Delete Failed', (res as any).error || 'Could not delete message');
                            load();
                        }
                    },
                },
            ],
        );
    };

    // ── Call ────────────────────────────────────────────────────────────────────
    const handleCall = () => {
        const peer = otherRef.current;
        if (!token) { Alert.alert('Error', 'Not signed in'); return; }
        if (!peer?.id) { Alert.alert('Still loading', 'Conversation not loaded yet. Please wait a moment.'); return; }

        initiateCall(token, peer.id).then((res) => {
            if (res.success && res.data) {
                router.push({
                    pathname: '/call',
                    params: {
                        mode: 'outgoing', callId: res.data.callId,
                        channelName: res.data.channelName, agoraToken: res.data.token,
                        appId: res.data.appId, remoteName: peer.name || 'User',
                        remoteImage: peer.profilePicture || '',
                    },
                });
            } else {
                Alert.alert('Call Failed', (res as any).error || 'Could not start call. Please try again.');
            }
        }).catch((err) => {
            Alert.alert('Call Failed', err?.message || 'Network error. Could not start call.');
        });
    };

    const name = other?.name || (other?.role === 'FREELANCER' ? 'Freelancer' : 'Creator');
    const pic = other?.profilePicture || null;
    const reversedMessages = [...messages].reverse();

    const renderMainContent = () => (
        <ImageBackground
            source={chatBg}
            style={[styles.chatBackground, { backgroundColor: '#060606' }]}
            imageStyle={{ opacity: 0.65 }}
            resizeMode="cover"
        >

            {loading ? (
                <View style={styles.centerWrap}>
                    <ActivityIndicator color={myTheme.primary} size="large" />
                </View>
            ) : (
                <>
                    <FlatList
                        ref={listRef}
                        inverted
                        data={reversedMessages}
                        keyExtractor={(m) => m.id}
                        contentContainerStyle={styles.messagesContent}
                        keyboardShouldPersistTaps="handled"
                        ListFooterComponent={
                            <View style={styles.dateSeparator}>
                                <Text style={styles.dateText}>Today</Text>
                            </View>
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyBox}>
                                <Ionicons name="chatbubbles-outline" size={42} color="#3A3A47" />
                                <Text style={styles.emptyText}>Say hi to start the conversation</Text>
                            </View>
                        }
                        renderItem={({ item }) => {
                            const mine = item.senderId === userId;
                            return (
                                <MessageRow
                                    item={item}
                                    mine={mine}
                                    myColor={myTheme.primary}
                                    otherColor={myTheme.primary}
                                    userId={userId!}
                                    onLongPress={handleLongPress}
                                    onSwipeReply={(msg) => {
                                        setReplyTo(msg);
                                        swipeableRefs.current.get(msg.id)?.close();
                                        setTimeout(() => inputRef.current?.focus(), 150);
                                    }}
                                    onImagePress={(url) => setViewImageUrl(url)}
                                    swipeableRefs={swipeableRefs}
                                />
                            );
                        }}
                    />

                    {/* ── Composer ──────────────────────────────────────────── */}
                    <View style={[styles.composerWrapper, {
                        paddingBottom: Math.max(insets.bottom, 8),
                    }]}>
                        {/* Reply preview */}
                        {replyTo && !editingMsg && (
                            <Animated.View entering={FadeIn.duration(140)} exiting={FadeOut.duration(100)} style={[styles.contextBar, { borderLeftColor: myTheme.primary }]}>
                                <View style={styles.contextBarInner}>
                                    <Ionicons name="return-down-forward" size={13} color={myTheme.primary} />
                                    <Text style={[styles.contextBarText, { color: myTheme.primary }]} numberOfLines={1}>
                                        {replyTo.content.replace(/^> .+\n\n/, '').slice(0, 60)}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={() => setReplyTo(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                    <Ionicons name="close" size={15} color="#888" />
                                </TouchableOpacity>
                            </Animated.View>
                        )}

                        {/* Edit mode banner */}
                        {editingMsg && (
                            <Animated.View entering={FadeIn.duration(140)} exiting={FadeOut.duration(100)} style={[styles.contextBar, { borderLeftColor: '#F59E0B' }]}>
                                <View style={styles.contextBarInner}>
                                    <Ionicons name="pencil" size={13} color="#F59E0B" />
                                    <Text style={[styles.contextBarText, { color: '#F59E0B' }]} numberOfLines={1}>
                                        Editing: {editingMsg.content.slice(0, 50)}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={() => { setEditingMsg(null); setInput(''); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                    <Ionicons name="close" size={15} color="#888" />
                                </TouchableOpacity>
                            </Animated.View>
                        )}

                        {/* Image preview */}
                        {imageToSend && (
                            <Animated.View entering={FadeIn.duration(140)} exiting={FadeOut.duration(100)} style={styles.imagePreviewRow}>
                                <Image source={{ uri: imageToSend.uri }} style={styles.imagePreview} resizeMode="cover" />
                                <TouchableOpacity style={styles.imagePreviewRemove} onPress={() => setImageToSend(null)}>
                                    <Ionicons name="close-circle" size={20} color="#fff" />
                                </TouchableOpacity>
                            </Animated.View>
                        )}

                        <View style={styles.composer}>
                            <TouchableOpacity
                                style={[styles.composerCircleBtn, { backgroundColor: myTheme.primary }]}
                                onPress={handleCamera}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="camera" size={18} color="#fff" />
                            </TouchableOpacity>

                            <TextInput
                                ref={inputRef}
                                style={styles.input}
                                placeholder={editingMsg ? 'Edit message…' : 'Type a message…'}
                                placeholderTextColor="#8A8A99"
                                value={input}
                                onChangeText={setInput}
                                multiline
                                maxLength={4000}
                            />

                            <TouchableOpacity style={styles.attachBtn} onPress={handleAttach} activeOpacity={0.75}>
                                <Ionicons name="attach" size={22} color="#aaa" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.composerCircleBtn,
                                    { backgroundColor: myTheme.primary },
                                    (!input.trim() && !imageToSend) && styles.sendBtnDisabled,
                                ]}
                                onPress={handleSend}
                                disabled={(!input.trim() && !imageToSend && !editingMsg) || sending}
                                activeOpacity={0.8}
                            >
                                {sending
                                    ? <ActivityIndicator color="#fff" size="small" />
                                    : <Ionicons name={editingMsg ? 'checkmark' : 'paper-plane'} size={17} color="#fff" />
                                }
                            </TouchableOpacity>
                        </View>
                    </View>
                </>
            )}
        </ImageBackground>
    );

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

            {/* ── Header ─────────────────────────────────────────────────────── */}
            <View style={[styles.header, { borderBottomColor: myTheme.border }]}>
                <TouchableOpacity
                    style={styles.headerBackBtn}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/messages')}
                >
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.headerMid}
                    activeOpacity={0.75}
                    disabled={!other?.id}
                    onPress={() => other?.id && router.push({ pathname: '/creator-details', params: { userId: other.id } } as any)}
                >
                    {pic ? (
                        <Image source={{ uri: pic }} style={[styles.headerAvatar, { borderColor: myTheme.border }]} />
                    ) : (
                        <View style={[styles.headerAvatar, styles.headerInitialsAvatar, { backgroundColor: myTheme.soft }]}>
                            <Text style={[styles.headerInitialsText, { color: myTheme.primary }]}>{getInitials(name)}</Text>
                        </View>
                    )}
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerName} numberOfLines={1}>{name}</Text>
                        <Text style={[styles.headerStatus, { color: myTheme.primary }]}>
                            {formatLastSeen(other?.lastActiveAt || other?.lastLoginAt)}
                        </Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={[styles.callBtn, { backgroundColor: myTheme.primary }]}
                    onPress={handleCall}
                    activeOpacity={0.75}
                >
                    <Ionicons name="call" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* ── Body: keyboard pushes the composer up, WhatsApp-style ───────────── */}
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
            >
                {renderMainContent()}
            </KeyboardAvoidingView>

            {/* ── Full-screen image viewer ─────────────────────────────────────── */}
            <Modal
                visible={!!viewImageUrl}
                transparent
                animationType="fade"
                statusBarTranslucent
                onRequestClose={() => setViewImageUrl(null)}
            >
                <View style={{ flex: 1, backgroundColor: '#000' }}>
                    <TouchableOpacity
                        style={{ position: 'absolute', top: (insets.top || 0) + 12, right: 16, zIndex: 10, padding: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 }}
                        onPress={() => setViewImageUrl(null)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                    {viewImageUrl && (
                        <Image
                            source={{ uri: viewImageUrl }}
                            style={{ flex: 1 }}
                            resizeMode="contain"
                        />
                    )}
                </View>
            </Modal>

            {/* ── WhatsApp-style context menu modal ─────────────────────────── */}
            <Modal
                visible={!!ctxMsg}
                transparent
                animationType="fade"
                onRequestClose={() => setCtxMsg(null)}
            >
                <Pressable style={styles.ctxOverlay} onPress={() => setCtxMsg(null)}>
                    <Pressable style={styles.ctxSheet} onPress={(e) => e.stopPropagation()}>
                        {/* Emoji reaction row */}
                        <View style={styles.ctxReactionRow}>
                            {REACTIONS.map((emoji) => {
                                const count = ctxMsg?.reactions?.[emoji]?.length || 0;
                                const reacted = ctxMsg?.reactions?.[emoji]?.includes(userId!) || false;
                                return (
                                    <TouchableOpacity
                                        key={emoji}
                                        style={[styles.ctxEmoji, reacted && { backgroundColor: myTheme.soft, borderRadius: 20 }]}
                                        onPress={() => handleReaction(emoji)}
                                        activeOpacity={0.75}
                                    >
                                        <Text style={styles.ctxEmojiText}>{emoji}</Text>
                                        {count > 0 && <Text style={[styles.ctxEmojiCount, { color: myTheme.primary }]}>{count}</Text>}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <View style={styles.ctxDivider} />

                        {/* Reply */}
                        <TouchableOpacity style={styles.ctxAction} onPress={handleCtxReply}>
                            <Ionicons name="return-down-forward-outline" size={18} color="#ccc" />
                            <Text style={styles.ctxActionText}>Reply</Text>
                        </TouchableOpacity>

                        {/* Edit — only own messages */}
                        {ctxMine && (
                            <TouchableOpacity style={styles.ctxAction} onPress={handleCtxEdit}>
                                <Ionicons name="pencil-outline" size={18} color="#ccc" />
                                <Text style={styles.ctxActionText}>Edit</Text>
                            </TouchableOpacity>
                        )}

                        {/* Copy */}
                        {!!ctxMsg?.content && (
                            <TouchableOpacity style={styles.ctxAction} onPress={handleCtxCopy}>
                                <Ionicons name="copy-outline" size={18} color="#ccc" />
                                <Text style={styles.ctxActionText}>Copy</Text>
                            </TouchableOpacity>
                        )}

                        {/* Delete — only own messages */}
                        {ctxMine && (
                            <TouchableOpacity style={styles.ctxAction} onPress={handleCtxDelete}>
                                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                <Text style={[styles.ctxActionText, { color: '#EF4444' }]}>Delete</Text>
                            </TouchableOpacity>
                        )}
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

// ── MessageRow ───────────────────────────────────────────────────────────────

interface MessageRowProps {
    item: ChatMessage;
    mine: boolean;
    myColor: string;
    otherColor: string;
    userId: string;
    onLongPress: (msg: ChatMessage, mine: boolean) => void;
    onSwipeReply: (msg: ChatMessage) => void;
    onImagePress: (url: string) => void;
    swipeableRefs: React.MutableRefObject<Map<string, Swipeable>>;
}

function MessageRow({ item, mine, myColor, otherColor, userId, onLongPress, onSwipeReply, onImagePress, swipeableRefs }: MessageRowProps) {
    const bubbleColor = mine ? DARK_BUBBLE : otherColor;
    const hasQuote = item.content.startsWith('> ');
    let quoteText = '';
    let bodyText = item.content;
    if (hasQuote) {
        const lines = item.content.split('\n\n');
        quoteText = lines[0].replace(/^> /, '');
        bodyText = lines.slice(1).join('\n\n');
    }

    const reactionEntries = Object.entries(item.reactions || {}).filter(([, users]) => users.length > 0);

    const renderReplyHint = () => (
        <View style={[styles.swipeHint, { justifyContent: mine ? 'flex-end' : 'flex-start' }]}>
            <Ionicons name="return-down-forward-outline" size={18} color={mine ? myColor : otherColor} />
        </View>
    );

    return (
        <Swipeable
            ref={(ref) => { if (ref) swipeableRefs.current.set(item.id, ref); else swipeableRefs.current.delete(item.id); }}
            renderLeftActions={renderReplyHint}
            onSwipeableWillOpen={() => onSwipeReply(item)}
            friction={2}
            leftThreshold={52}
            overshootLeft={false}
        >
            <Pressable
                onLongPress={() => { if (!item.isDeleted) onLongPress(item, mine); }}
                delayLongPress={300}
                style={[styles.bubbleWrapper, mine ? styles.rowRight : styles.rowLeft]}
            >
                <View style={{ maxWidth: '82%' }}>
                    {/* Bubble */}
                    <View style={[
                        styles.bubble,
                        { backgroundColor: bubbleColor },
                        mine ? styles.bubbleMine : styles.bubbleTheirs,
                    ]}>
                        {item.isDeleted ? (
                            <View style={styles.bubbleMeta}>
                                <Ionicons name="ban-outline" size={14} color="rgba(255,255,255,0.45)" style={{ marginRight: 5 }} />
                                <Text style={[styles.bubbleText, { color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }]}>
                                    This message was deleted
                                </Text>
                            </View>
                        ) : (
                            <>
                                {/* Quoted reply */}
                                {hasQuote && (
                                    <View style={[styles.quotedBar, {
                                        borderLeftColor: mine ? myColor : '#fff',
                                        backgroundColor: mine ? myColor + '22' : 'rgba(255,255,255,0.1)',
                                    }]}>
                                        <Text style={styles.quotedText} numberOfLines={2}>{quoteText}</Text>
                                    </View>
                                )}
                                {item.imageUrl && (
                                    <TouchableOpacity activeOpacity={0.9} onPress={() => onImagePress(item.imageUrl!)}>
                                        <Image source={{ uri: item.imageUrl }} style={styles.bubbleImage} resizeMode="cover" />
                                    </TouchableOpacity>
                                )}
                                {bodyText ? <Text style={styles.bubbleText}>{bodyText}</Text> : null}
                                {/* Time + read receipt inside bubble */}
                                <View style={styles.bubbleMeta}>
                                    {item.isEdited && <Text style={styles.editedLabel}>edited · </Text>}
                                    <Text style={styles.bubbleTime}>{formatTime(item.createdAt)}</Text>
                                    {mine && (
                                        <Ionicons
                                            name={item.pending ? 'checkmark' : 'checkmark-done'}
                                            size={13}
                                            color={item.isRead ? myColor : 'rgba(255,255,255,0.4)'}
                                            style={{ marginLeft: 3 }}
                                        />
                                    )}
                                </View>
                            </>
                        )}
                    </View>

                    {/* Emoji reactions below bubble */}
                    {reactionEntries.length > 0 && (
                        <View style={[styles.reactionsRow, mine ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }]}>
                            {reactionEntries.map(([emoji, users]) => (
                                <View key={emoji} style={styles.reactionChip}>
                                    <Text style={{ fontSize: 13 }}>{emoji}</Text>
                                    {users.length > 1 && <Text style={styles.reactionCount}>{users.length}</Text>}
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </Pressable>
        </Swipeable>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#060606' },

    // ── Header
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 12, paddingVertical: 10,
        backgroundColor: '#060606',
        gap: 10,
    },
    headerBackBtn: { padding: 4 },
    headerMid: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, backgroundColor: '#2A2A32' },
    headerInitialsAvatar: { alignItems: 'center', justifyContent: 'center' },
    headerInitialsText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
    headerName: { color: '#fff', fontSize: 16, fontFamily: 'Poppins_600SemiBold', lineHeight: 20 },
    headerStatus: { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 1 },
    callBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

    // ── Chat background
    chatBackground: { flex: 1 },
    centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    // ── Messages list
    messagesContent: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8, flexGrow: 1 },
    dateSeparator: { alignItems: 'center', marginVertical: 16 },
    dateText: { color: '#8A8A99', fontSize: 12, fontFamily: 'Poppins_400Regular' },
    emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
    emptyText: { color: '#6B6B7A', fontSize: 14, fontFamily: 'Poppins_400Regular' },

    // ── Bubbles
    bubbleWrapper: { marginBottom: 2, paddingHorizontal: 4 },
    rowRight: { alignItems: 'flex-end' },
    rowLeft: { alignItems: 'flex-start' },
    bubble: { borderRadius: 16, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6, overflow: 'hidden' },
    bubbleMine: { borderBottomRightRadius: 3 },
    bubbleTheirs: { borderBottomLeftRadius: 3 },
    bubbleText: { color: '#fff', fontSize: 14.5, fontFamily: 'Poppins_400Regular', lineHeight: 21 },
    bubbleImage: { width: 200, height: 140, borderRadius: 10, marginBottom: 6 },
    bubbleMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4, gap: 2 },
    bubbleTime: { color: 'rgba(255,255,255,0.45)', fontSize: 10, fontFamily: 'Poppins_400Regular' },
    editedLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: 'Poppins_400Regular' },
    quotedBar: { borderLeftWidth: 3, paddingLeft: 8, paddingVertical: 4, marginBottom: 6, borderRadius: 4 },
    quotedText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 17 },
    reactionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 3, marginHorizontal: 4 },
    reactionChip: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2 },
    reactionCount: { color: '#ccc', fontSize: 11, fontFamily: 'Poppins_400Regular' },

    // ── Swipe reply
    swipeHint: { width: 56, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },

    // ── Composer
    composerWrapper: { paddingHorizontal: 8, paddingTop: 4, backgroundColor: 'transparent' },
    contextBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: 'rgba(24,24,30,0.97)', borderLeftWidth: 3,
        paddingHorizontal: 12, paddingVertical: 8, marginBottom: 4, borderRadius: 10,
    },
    contextBarInner: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 8 },
    contextBarText: { fontSize: 12, fontFamily: 'Poppins_400Regular', flex: 1 },
    imagePreviewRow: { flexDirection: 'row', alignItems: 'center', paddingLeft: 8, marginBottom: 6 },
    imagePreview: { width: 60, height: 60, borderRadius: 10 },
    imagePreviewRemove: { position: 'absolute', top: -6, left: 52, zIndex: 10 },
    composer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#1E1E26', borderRadius: 28,
        paddingHorizontal: 8, paddingVertical: 5, gap: 6,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
    },
    composerCircleBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    input: {
        flex: 1, color: '#fff', fontSize: 14.5, fontFamily: 'Poppins_400Regular',
        maxHeight: 100, paddingVertical: 6, paddingHorizontal: 4,
    },
    attachBtn: { padding: 4 },
    sendBtnDisabled: { opacity: 0.4 },

    // ── Context menu modal
    ctxOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
    ctxSheet: { width: '100%', maxWidth: 320, backgroundColor: '#1E1E26', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    ctxReactionRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 14, paddingHorizontal: 8 },
    ctxEmoji: { alignItems: 'center', padding: 6 },
    ctxEmojiText: { fontSize: 26 },
    ctxEmojiCount: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', marginTop: 2 },
    ctxDivider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 0 },
    ctxAction: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.07)' },
    ctxActionText: { color: '#e0e0e0', fontSize: 15, fontFamily: 'Poppins_400Regular', flex: 1 },
});
