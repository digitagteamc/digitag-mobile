import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    ImageBackground,
    Keyboard,
    Linking,
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
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut, useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import messaging, { onMessage } from '@react-native-firebase/messaging';
import ConfirmActionModal from '../../Components/ui/ConfirmActionModal';
import ZoomableImage from '../../Components/ui/ZoomableImage';
import { useAuth } from '../../context/AuthContext';
import { prepareImageForUpload } from '../../services/imageResize';
import {
    deleteMessage as apiDeleteMessage,
    editMessage as apiEditMessage,
    reactToMessage as apiReactToMessage,
    sendMessage as apiSendMessage,
    getConversation,
    getConversationCalls,
    initiateCall,
    listMessages,
    uploadMessageImage,
} from '../../services/userService';
import { useRoleTheme } from '../../theme/useRoleTheme';

const chatBg = require('../../assets/bg-chat.webp');
const DARK_BUBBLE = '#1E1E26';
const REACTIONS = ['❤️', '👍', '😂', '😮', '🙏', '😢'];

interface QuotedMessage {
    id: string;
    content: string;
    imageUrl?: string | null;
    senderId: string;
    isDeleted?: boolean;
}

interface ChatMessage {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    imageUrl?: string | null;
    locationLat?: number | null;
    locationLng?: number | null;
    isRead: boolean;
    isEdited?: boolean;
    isDeleted?: boolean;
    createdAt: string;
    pending?: boolean;
    reactions?: Record<string, string[]>;
    replyTo?: QuotedMessage | null;
}

/** One-line description of a message for quote previews: text, 📷 for images,
 *  📍 for a shared location. */
function describeMessage(msg: { content?: string; imageUrl?: string | null; locationLat?: number | null; isDeleted?: boolean } | null | undefined) {
    if (!msg || msg.isDeleted) return 'Message deleted';
    // Strip the legacy text-encoded "> quote\n\n" prefix from old messages.
    const text = (msg.content || '').replace(/^> .+\n\n/, '').trim();
    if (text) return text;
    if (msg.locationLat != null) return '📍 Location';
    return msg.imageUrl ? '📷 Photo' : '';
}

/** A completed/missed/declined call, shown inline in the chat thread — same
 *  timeline as messages, not a separate call-log screen. */
interface CallLogEntry {
    id: string;
    callerId: string;
    calleeId: string;
    status: 'RINGING' | 'ACTIVE' | 'ENDED' | 'DECLINED' | 'MISSED';
    startedAt: string | null;
    endedAt: string | null;
    createdAt: string;
}

/** Timeline item: either a chat message or a call-log entry, merged and sorted
 *  by time so calls appear inline exactly where they happened, WhatsApp-style. */
type TimelineItem =
    | { kind: 'message'; key: string; at: string; message: ChatMessage }
    | { kind: 'call'; key: string; at: string; call: CallLogEntry };

function mergeTimeline(messages: ChatMessage[], calls: CallLogEntry[]): TimelineItem[] {
    const items: TimelineItem[] = [
        ...messages.map((m): TimelineItem => ({ kind: 'message', key: `m-${m.id}`, at: m.createdAt, message: m })),
        ...calls.map((c): TimelineItem => ({ kind: 'call', key: `c-${c.id}`, at: c.createdAt, call: c })),
    ];
    items.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
    return items;
}

function formatCallDuration(startedAt: string | null, endedAt: string | null) {
    if (!startedAt || !endedAt) return null;
    const seconds = Math.max(0, Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000));
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

function describeCall(call: CallLogEntry, mine: boolean) {
    if (call.status === 'MISSED') return mine ? 'No answer' : 'Missed call';
    if (call.status === 'DECLINED') return mine ? 'Call declined' : 'Missed call';
    if (call.status === 'RINGING' || call.status === 'ACTIVE') return 'Ongoing call';
    const duration = formatCallDuration(call.startedAt, call.endedAt);
    return duration ? `${mine ? 'Outgoing' : 'Incoming'} call · ${duration}` : (mine ? 'Outgoing call' : 'Incoming call');
}

function openLocationInMaps(lat: number, lng: number) {
    const url = Platform.OS === 'ios'
        ? `https://maps.apple.com/?ll=${lat},${lng}&q=Shared+Location`
        : `geo:${lat},${lng}?q=${lat},${lng}(Shared+Location)`;
    Linking.openURL(url).catch(() => {
        Linking.openURL(`https://www.google.com/maps?q=${lat},${lng}`).catch(() => {});
    });
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
    // Status of the collaboration this conversation belongs to. Anything other
    // than ACCEPTED (e.g. COMPLETED) means the chat is read-only — the backend
    // rejects sends anyway; this just surfaces it up front in the UI.
    const [collabStatus, setCollabStatus] = useState<string | null>(null);
    const chatLocked = collabStatus !== null && collabStatus !== 'ACCEPTED';
    const otherRef = useRef<any>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [calls, setCalls] = useState<CallLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [sendingLocation, setSendingLocation] = useState(false);
    const [input, setInput] = useState('');
    const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
    const [editingMsg, setEditingMsg] = useState<ChatMessage | null>(null);
    const [imageToSend, setImageToSend] = useState<ImagePicker.ImagePickerAsset | null>(null);
    // Long-press context menu state
    const [ctxMsg, setCtxMsg] = useState<ChatMessage | null>(null);
    const [ctxMine, setCtxMine] = useState(false);
    const [viewImageUrl, setViewImageUrl] = useState<string | null>(null);
    // Single keyboard-compensation mechanism for BOTH platforms. useAnimatedKeyboard
    // tracks the keyboard's real native animation frame-by-frame on the UI thread, so
    // the composer rises in perfect sync. Do NOT wrap this screen in a
    // KeyboardAvoidingView as well — running both compensations at once is what caused
    // the big black band between the composer and the keyboard on iOS.
    // On iOS the keyboard frame overlaps the home-indicator area the composer already
    // pads for (insets.bottom), so subtract it to sit flush against the keyboard.
    const keyboard = useAnimatedKeyboard();
    const bottomInset = insets.bottom;
    const keyboardStyle = useAnimatedStyle(() => ({
        marginBottom: Platform.OS === 'android'
            ? keyboard.height.value
            : Math.max(keyboard.height.value - bottomInset, 0),
    }));

    const listRef = useRef<FlatList<TimelineItem> | null>(null);
    const inputRef = useRef<TextInput>(null);
    const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());

    const load = useCallback(async () => {
        if (!token || !id) return;
        const [convRes, msgsRes, callsRes] = await Promise.all([
            getConversation(token, String(id)),
            listMessages(token, String(id), { limit: 50 }),
            getConversationCalls(token, String(id)),
        ]);
        if (convRes.success && convRes.data?.other) {
            setOther(convRes.data.other);
            otherRef.current = convRes.data.other;
            setCollabStatus(convRes.data.collabStatus ?? null);
        }
        if (msgsRes.success) setMessages(msgsRes.data || []);
        if (callsRes.success) setCalls(callsRes.data || []);
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
            const [msgsRes, convRes, callsRes] = await Promise.all([
                listMessages(token, String(id), { limit: 50 }),
                getConversation(token, String(id)),
                getConversationCalls(token, String(id)),
            ]);
            if (msgsRes.success) setMessages(msgsRes.data || []);
            if (convRes.success && convRes.data?.other) {
                setOther(convRes.data.other);
                otherRef.current = convRes.data.other;
                setCollabStatus(convRes.data.collabStatus ?? null);
            }
            if (callsRes.success) setCalls(callsRes.data || []);
        }, 5000);
        return () => clearInterval(interval);
    }, [token, id]);

    // Instant refresh when a push for this conversation arrives while the chat is
    // open: a new message, or a call event (ended/declined/accepted) that should
    // show up in the call-history timeline immediately rather than after the next
    // 5s poll. Same handling on both iOS and Android — onMessage covers both.
    useEffect(() => {
        if (!token || !id) return;
        const unsubscribe = onMessage(messaging(), async remoteMessage => {
            const data = remoteMessage.data as Record<string, string> | undefined;
            if (!data) return;
            if (data.type === 'NEW_MESSAGE' && data.conversationId === String(id)) {
                const msgsRes = await listMessages(token, String(id), { limit: 50 });
                if (msgsRes.success) setMessages(msgsRes.data || []);
            } else if (data.type === 'CALL_ENDED' || data.type === 'CALL_DECLINED' || data.type === 'CALL_ACCEPTED') {
                const callsRes = await getConversationCalls(token, String(id));
                if (callsRes.success) setCalls(callsRes.data || []);
            }
        });
        return () => unsubscribe();
    }, [token, id]);

    // Scroll to latest messages when keyboard opens (inverted list: offset 0 = bottom)
    useEffect(() => {
        const sub = Keyboard.addListener('keyboardDidShow', () => {
            listRef.current?.scrollToOffset({ offset: 0, animated: false });
        });
        return () => sub.remove();
    }, []);

    // ── Camera / Gallery ────────────────────────────────────────────────────────
    // Photos are resized/re-compressed before being staged for send — modern phone
    // cameras (iOS and Android alike) can produce files over the backend's upload
    // size limit even after ImagePicker's own JPEG quality setting, since quality
    // alone doesn't shrink pixel dimensions.
    const handleCamera = async () => {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) { Alert.alert('Permission Required', 'Camera access is needed to take photos.'); return; }
        // No forced crop step — a photo taken here should go straight to the
        // preview/send flow, same as picking one from the gallery already does.
        const result = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.75 });
        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            const uri = await prepareImageForUpload(asset.uri, asset.width, asset.height);
            setImageToSend({ ...asset, uri, mimeType: 'image/jpeg' });
        }
    };

    const handleAttach = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.75 });
        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            const uri = await prepareImageForUpload(asset.uri, asset.width, asset.height);
            setImageToSend({ ...asset, uri, mimeType: 'image/jpeg' });
        }
    };

    // ── Location (one-time pin, not live tracking) ────────────────────────────
    // Two-step like WhatsApp: fetch the fix first, then require an explicit
    // confirm tap before it actually sends — tapping the pin icon must never
    // itself be the send action.
    const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number } | null>(null);

    const handleSendLocation = async () => {
        if (!token || !id || sendingLocation) return;
        const perm = await Location.requestForegroundPermissionsAsync();
        if (!perm.granted) {
            Alert.alert('Permission Required', 'Location access is needed to share your location.');
            return;
        }
        setSendingLocation(true);
        try {
            const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            setPendingLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        } catch {
            Alert.alert('Location Failed', 'Could not get your current location. Please try again.');
        } finally {
            setSendingLocation(false);
        }
    };

    const confirmSendLocation = async () => {
        if (!token || !id || !pendingLocation || sendingLocation) return;
        const { lat: latitude, lng: longitude } = pendingLocation;
        setSendingLocation(true);
        try {
            const optimisticId = `tmp-${Date.now()}`;
            const optimistic: ChatMessage = {
                id: optimisticId, conversationId: String(id), senderId: userId!,
                content: '', locationLat: latitude, locationLng: longitude,
                isRead: false, createdAt: new Date().toISOString(), pending: true,
            };
            setMessages((prev) => [...prev, optimistic]);
            setPendingLocation(null);
            setTimeout(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }), 80);

            const res = await apiSendMessage(token, String(id), '', undefined, undefined, { lat: latitude, lng: longitude });
            if (res.success) {
                setMessages((prev) => prev.map((m) => (m.id === optimisticId ? res.data : m)));
            } else {
                setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
                Alert.alert('Send Failed', (res as any).error || 'Could not share location');
            }
        } finally {
            setSendingLocation(false);
        }
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
            replyTo: replyTo ? { id: replyTo.id, content: replyTo.content, imageUrl: replyTo.imageUrl, senderId: replyTo.senderId } : null,
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
                if (upRes.success && upRes.data?.url) {
                    uploadedUrl = upRes.data.url;
                } else {
                    // Don't silently drop the image and send a text-only message —
                    // let the user know and leave their input/photo intact to retry.
                    setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
                    setInput(text);
                    setImageToSend(imageToSend);
                    setReplyTo(capturedReplyTo);
                    Alert.alert('Send Failed', (upRes as any).error || 'Could not upload image');
                    return;
                }
            }
            const res = await apiSendMessage(token, String(id), text, uploadedUrl, capturedReplyTo?.id);
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
        if (!ctxMsg || !token || !id) return;
        const targetId = ctxMsg.id;
        setMessages((prev) => prev.map((m) => {
            if (m.id !== targetId) return m;
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
        // Persisted server-side so it survives the 5s poll — without this the
        // optimistic update above gets overwritten by the next listMessages refresh.
        apiReactToMessage(token, String(id), targetId, emoji).then((res) => {
            if (res.success && res.data) {
                setMessages((prev) => prev.map((m) => m.id === targetId ? { ...m, reactions: res.data.reactions } : m));
            } else {
                load();
            }
        });
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
    const reversedTimeline = mergeTimeline(messages, calls).reverse();

    const renderMainContent = () => (
        <>
            {loading ? (
                <View style={styles.centerWrap}>
                    <ActivityIndicator color={myTheme.primary} size="large" />
                </View>
            ) : (
                <>
                    <FlatList
                        ref={listRef}
                        style={{ flex: 1 }}
                        inverted
                        data={reversedTimeline}
                        keyExtractor={(t) => t.key}
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
                            if (item.kind === 'call') {
                                return (
                                    <CallLogRow
                                        call={item.call}
                                        mine={item.call.callerId === userId}
                                        accentColor={myTheme.primary}
                                        onCallBack={handleCall}
                                    />
                                );
                            }
                            const msg = item.message;
                            const mine = msg.senderId === userId;
                            return (
                                <MessageRow
                                    item={msg}
                                    mine={mine}
                                    myColor={myTheme.primary}
                                    otherColor={myTheme.primary}
                                    userId={userId!}
                                    onLongPress={handleLongPress}
                                    onSwipeReply={(m) => {
                                        setReplyTo(m);
                                        swipeableRefs.current.get(m.id)?.close();
                                        setTimeout(() => inputRef.current?.focus(), 150);
                                    }}
                                    onImagePress={(url) => setViewImageUrl(url)}
                                    swipeableRefs={swipeableRefs}
                                />
                            );
                        }}
                    />

                    {/* ── Composer ──────────────────────────────────────────── */}
                    {chatLocked ? (
                        <View style={[styles.composerWrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}>
                            <View style={styles.lockedBanner}>
                                <Ionicons name="lock-closed-outline" size={16} color="#8A8A99" />
                                <Text style={styles.lockedBannerText}>
                                    {collabStatus === 'COMPLETED'
                                        ? 'This collaboration is completed — messaging is closed. Start a new collab to chat again.'
                                        : 'Messaging is available only during an active collaboration.'}
                                </Text>
                            </View>
                        </View>
                    ) : (
                    <View style={[styles.composerWrapper, {
                        paddingBottom: Math.max(insets.bottom, 8),
                    }]}>
                        {/* Reply preview */}
                        {replyTo && !editingMsg && (
                            <Animated.View entering={FadeIn.duration(140)} exiting={FadeOut.duration(100)} style={[styles.contextBar, { borderLeftColor: myTheme.primary }]}>
                                <View style={styles.contextBarInner}>
                                    <Ionicons name="return-down-forward" size={13} color={myTheme.primary} />
                                    {replyTo.imageUrl ? (
                                        <Image source={{ uri: replyTo.imageUrl }} style={styles.contextBarThumb} resizeMode="cover" />
                                    ) : null}
                                    <Text style={[styles.contextBarText, { color: myTheme.primary }]} numberOfLines={1}>
                                        {describeMessage(replyTo).slice(0, 60)}
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

                            <TouchableOpacity style={styles.attachBtn} onPress={handleSendLocation} activeOpacity={0.75} disabled={sendingLocation}>
                                {sendingLocation
                                    ? <ActivityIndicator size="small" color="#aaa" />
                                    : <Ionicons name="location-outline" size={22} color="#aaa" />
                                }
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
                    )}
                </>
            )}
        </>
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
            <View style={{ flex: 1 }}>
                {/* Fixed wallpaper — sized once, never resizes/re-crops when the keyboard opens */}
                <ImageBackground
                    source={chatBg}
                    style={[StyleSheet.absoluteFillObject, { backgroundColor: '#060606' }]}
                    imageStyle={{ opacity: 0.65 }}
                    resizeMode="cover"
                />
                <Animated.View style={[{ flex: 1 }, keyboardStyle]}>
                    {renderMainContent()}
                </Animated.View>
            </View>

            {/* ── Full-screen image viewer ─────────────────────────────────────── */}
            <Modal
                visible={!!viewImageUrl}
                transparent
                animationType="fade"
                statusBarTranslucent
                onRequestClose={() => setViewImageUrl(null)}
            >
                {/* Modals on Android don't inherit the app root's
                    GestureHandlerRootView — without this local one the
                    pinch/pan gestures silently never fire. */}
                <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000' }}>
                    <TouchableOpacity
                        style={{ position: 'absolute', top: (insets.top || 0) + 12, right: 16, zIndex: 10, padding: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 }}
                        onPress={() => setViewImageUrl(null)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                    {viewImageUrl && <ZoomableImage uri={viewImageUrl} />}
                </GestureHandlerRootView>
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

            <ConfirmActionModal
                visible={!!pendingLocation}
                title="Share Location"
                message="Send your current location? The other person will be able to see it on a map."
                confirmLabel="Send"
                confirmColor="#22C55E"
                busy={sendingLocation}
                onConfirm={confirmSendLocation}
                onDismiss={() => setPendingLocation(null)}
            />
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
    // Real replies carry a replyTo record; older messages used a text-encoded
    // "> quote\n\nbody" format, still parsed so history renders correctly.
    const legacyQuote = !item.replyTo && item.content.startsWith('> ');
    let quoteText = item.replyTo ? describeMessage(item.replyTo) : '';
    let quoteImage = item.replyTo && !item.replyTo.isDeleted ? item.replyTo.imageUrl : null;
    let bodyText = item.content;
    if (legacyQuote) {
        const lines = item.content.split('\n\n');
        quoteText = lines[0].replace(/^> /, '');
        bodyText = lines.slice(1).join('\n\n');
    }
    const hasQuote = Boolean(item.replyTo) || legacyQuote;

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
                                        {quoteImage ? (
                                            <Image source={{ uri: quoteImage }} style={styles.quotedThumb} resizeMode="cover" />
                                        ) : null}
                                        <Text style={[styles.quotedText, { flexShrink: 1 }]} numberOfLines={2}>{quoteText}</Text>
                                    </View>
                                )}
                                {item.imageUrl && (
                                    <Pressable
                                        onPress={() => onImagePress(item.imageUrl!)}
                                        onLongPress={() => onLongPress(item, mine)}
                                        delayLongPress={300}
                                    >
                                        <Image source={{ uri: item.imageUrl }} style={styles.bubbleImage} resizeMode="cover" />
                                    </Pressable>
                                )}
                                {item.locationLat != null && item.locationLng != null && (
                                    <Pressable
                                        onPress={() => openLocationInMaps(item.locationLat!, item.locationLng!)}
                                        onLongPress={() => onLongPress(item, mine)}
                                        delayLongPress={300}
                                        style={styles.locationCard}
                                    >
                                        <Ionicons name="location" size={20} color={mine ? myColor : otherColor} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.locationTitle}>Current Location</Text>
                                            <Text style={styles.locationSubtitle}>Tap to open in Maps</Text>
                                        </View>
                                        <Ionicons name="open-outline" size={16} color="rgba(255,255,255,0.5)" />
                                    </Pressable>
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

/** Inline call-history row, WhatsApp-style: centered pill in the message
 *  timeline (not a bubble, not a separate screen). Tapping it calls back —
 *  identical behavior/markup on iOS and Android, no platform branching needed
 *  since it's plain RN Views/Ionicons throughout. */
function CallLogRow({ call, mine, accentColor, onCallBack }: {
    call: CallLogEntry;
    mine: boolean;
    accentColor: string;
    onCallBack: () => void;
}) {
    const missed = call.status === 'MISSED' || call.status === 'DECLINED';
    const iconColor = missed ? '#EF4444' : accentColor;
    return (
        <View style={styles.callLogWrap}>
            <TouchableOpacity
                style={styles.callLogPill}
                activeOpacity={0.75}
                onPress={onCallBack}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
                <Ionicons name="call" size={13} color={iconColor} />
                <Text style={[styles.callLogText, missed && { color: iconColor }]} numberOfLines={1}>
                    {describeCall(call, mine)}
                </Text>
                <Text style={styles.callLogTime}>{formatTime(call.createdAt)}</Text>
            </TouchableOpacity>
        </View>
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

    // ── Inline call log row ──
    callLogWrap: { alignItems: 'center', marginVertical: 6 },
    callLogPill: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14,
        maxWidth: '80%',
    },
    callLogText: { color: '#D8D8E2', fontSize: 12, fontFamily: 'Poppins_400Regular', flexShrink: 1 },
    callLogTime: { color: '#8A8A99', fontSize: 11, fontFamily: 'Poppins_400Regular', marginLeft: 2 },
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
    locationCard: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10,
        paddingHorizontal: 10, paddingVertical: 10, marginBottom: 6, minWidth: 180,
    },
    locationTitle: { color: '#fff', fontSize: 13.5, fontFamily: 'Poppins_600SemiBold' },
    locationSubtitle: { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 1 },
    bubbleMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4, gap: 2 },
    bubbleTime: { color: 'rgba(255,255,255,0.45)', fontSize: 10, fontFamily: 'Poppins_400Regular' },
    editedLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: 'Poppins_400Regular' },
    quotedBar: { borderLeftWidth: 3, paddingLeft: 8, paddingRight: 8, paddingVertical: 4, marginBottom: 6, borderRadius: 4, flexDirection: 'row', alignItems: 'center', gap: 6 },
    quotedThumb: { width: 34, height: 34, borderRadius: 4 },
    quotedText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 17 },
    reactionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 3, marginHorizontal: 4 },
    reactionChip: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2 },
    reactionCount: { color: '#ccc', fontSize: 11, fontFamily: 'Poppins_400Regular' },

    // ── Swipe reply
    swipeHint: { width: 56, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },

    // ── Composer
    composerWrapper: { paddingHorizontal: 8, paddingTop: 4, backgroundColor: 'transparent' },
    lockedBanner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: 'rgba(24,24,30,0.97)', borderRadius: 14,
        paddingHorizontal: 16, paddingVertical: 14,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    },
    lockedBannerText: {
        color: '#8A8A99', fontSize: 12.5, fontFamily: 'Poppins_400Regular',
        flexShrink: 1, textAlign: 'center',
    },
    contextBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: 'rgba(24,24,30,0.97)', borderLeftWidth: 3,
        paddingHorizontal: 12, paddingVertical: 8, marginBottom: 4, borderRadius: 10,
    },
    contextBarInner: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 8 },
    contextBarThumb: { width: 28, height: 28, borderRadius: 4 },
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
