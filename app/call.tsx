import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Easing,
    PermissionsAndroid,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    ChannelProfileType,
    ClientRoleType,
    IRtcEngine,
    createAgoraRtcEngine,
} from 'react-native-agora';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { acceptCall, declineCall, endCall } from '../services/userService';
import { useRoleTheme } from '../theme/useRoleTheme';

async function requestAudioPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    try {
        const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            PermissionsAndroid.PERMISSIONS.MODIFY_AUDIO_SETTINGS,
        ]);
        return granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
        return false;
    }
}

function getInitials(name: string) {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase();
}

type CallMode = 'outgoing' | 'incoming' | 'active';

function PulsingRing({ color, size }: { color: string; size: number }) {
    const anim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(anim, { toValue: 1, duration: 1400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
            ]),
        ).start();
    }, []);
    const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55] });
    const opacity = anim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.5, 0.15, 0] });
    return (
        <Animated.View
            pointerEvents="none"
            style={{
                position: 'absolute',
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: 2,
                borderColor: color,
                transform: [{ scale }],
                opacity,
            }}
        />
    );
}

export default function CallScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const theme = useRoleTheme();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{
        mode: string; callId: string; channelName: string;
        agoraToken: string; appId: string; remoteName: string;
    }>();

    const engineRef = useRef<IRtcEngine | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const endedRef = useRef(false);

    const [callMode, setCallMode] = useState<CallMode>((params.mode as CallMode) || 'outgoing');
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeaker, setIsSpeaker] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    const remoteName = params.remoteName || 'User';
    const initials = getInitials(remoteName);

    const startTimer = useCallback(() => {
        timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    }, []);

    const joinChannel = useCallback(async (tkn: string, channel: string, appId: string) => {
        try {
            const hasPermission = await requestAudioPermission();
            if (!hasPermission) {
                Alert.alert('Permission Denied', 'Microphone access is required for calls.');
                router.back();
                return;
            }
            const engine = createAgoraRtcEngine();
            engineRef.current = engine;
            engine.initialize({ appId });
            engine.enableAudio();
            engine.setDefaultAudioRouteToSpeakerphone(false);
            engine.registerEventHandler({
                onJoinChannelSuccess: () => {},
                onUserJoined: () => { setCallMode('active'); startTimer(); },
                onUserOffline: () => { if (!endedRef.current) handleEndCall(); },
            });
            engine.joinChannel(tkn, channel, 0, {
                channelProfile: ChannelProfileType.ChannelProfileCommunication,
                clientRoleType: ClientRoleType.ClientRoleBroadcaster,
            });
        } catch {
            Alert.alert('Error', 'Could not connect to call');
            router.back();
        }
    }, [startTimer]);

    useEffect(() => {
        if (params.mode === 'outgoing' && params.agoraToken && params.channelName && params.appId) {
            joinChannel(params.agoraToken, params.channelName, params.appId);
        }
        return () => {
            endedRef.current = true;
            if (timerRef.current) clearInterval(timerRef.current);
            engineRef.current?.leaveChannel();
            engineRef.current?.release();
        };
    }, []);

    const handleAccept = async () => {
        if (!token || !params.callId) return;
        const res = await acceptCall(token, params.callId);
        if (res.success && res.data) {
            await joinChannel(res.data.token, res.data.channelName, res.data.appId);
            setCallMode('active');
            startTimer();
        } else {
            Alert.alert('Error', 'Could not accept call');
            router.back();
        }
    };

    const handleDecline = async () => {
        endedRef.current = true;
        if (token && params.callId) await declineCall(token, params.callId);
        router.back();
    };

    const handleEndCall = async () => {
        if (endedRef.current) return;
        endedRef.current = true;
        if (timerRef.current) clearInterval(timerRef.current);
        engineRef.current?.leaveChannel();
        engineRef.current?.release();
        engineRef.current = null;
        if (token && params.callId) await endCall(token, params.callId);
        router.back();
    };

    const toggleMute = () => {
        setIsMuted((prev) => { engineRef.current?.muteLocalAudioStream(!prev); return !prev; });
    };

    const toggleSpeaker = () => {
        setIsSpeaker((prev) => { engineRef.current?.setEnableSpeakerphone(!prev); return !prev; });
    };

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    };

    const accentColor = theme.primary;
    const softColor = theme.soft;

    // ── Incoming call screen ────────────────────────────────────────────────────
    if (callMode === 'incoming') {
        return (
            <View style={styles.root}>
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
                <LinearGradient
                    colors={['#0A0A10', '#13131E', '#0A0A10']}
                    style={StyleSheet.absoluteFill}
                />
                {/* Top glow blob */}
                <View style={[styles.topBlob, { backgroundColor: softColor }]} pointerEvents="none" />

                <View style={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}>
                    {/* Avatar */}
                    <View style={styles.avatarSection}>
                        <PulsingRing color={accentColor} size={140} />
                        <PulsingRing color={accentColor} size={140} />
                        <View style={[styles.avatarRing, { borderColor: accentColor }]}>
                            <LinearGradient
                                colors={[softColor, '#1a1a28']}
                                style={styles.avatarInner}
                            >
                                <Text style={[styles.avatarInitials, { color: accentColor }]}>{initials}</Text>
                            </LinearGradient>
                        </View>
                    </View>

                    <View style={styles.nameSection}>
                        <Text style={styles.remoteName}>{remoteName}</Text>
                        <View style={styles.statusRow}>
                            <View style={[styles.statusDot, { backgroundColor: accentColor }]} />
                            <Text style={styles.statusText}>Incoming audio call</Text>
                        </View>
                    </View>

                    {/* Accept / Decline */}
                    <View style={styles.incomingActions}>
                        <View style={styles.actionItem}>
                            <TouchableOpacity style={styles.declineBtn} onPress={handleDecline} activeOpacity={0.8}>
                                <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
                            </TouchableOpacity>
                            <Text style={styles.actionLabel}>Decline</Text>
                        </View>
                        <View style={styles.actionItem}>
                            <TouchableOpacity
                                style={[styles.acceptBtn, { backgroundColor: accentColor }]}
                                onPress={handleAccept}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="call" size={28} color="#fff" />
                            </TouchableOpacity>
                            <Text style={styles.actionLabel}>Accept</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    }

    // ── Outgoing / Active call screen ───────────────────────────────────────────
    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            <LinearGradient
                colors={['#0A0A10', '#13131E', '#0A0A10']}
                style={StyleSheet.absoluteFill}
            />
            <View style={[styles.topBlob, { backgroundColor: softColor }]} pointerEvents="none" />

            <View style={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}>
                {/* Avatar */}
                <View style={styles.avatarSection}>
                    {callMode !== 'active' && <PulsingRing color={accentColor} size={140} />}
                    <View style={[styles.avatarRing, { borderColor: callMode === 'active' ? accentColor : '#2a2a3a' }]}>
                        <LinearGradient
                            colors={callMode === 'active' ? [softColor, '#1a1a28'] : ['#1a1a28', '#0f0f18']}
                            style={styles.avatarInner}
                        >
                            <Text style={[styles.avatarInitials, { color: accentColor }]}>{initials}</Text>
                        </LinearGradient>
                    </View>
                </View>

                <View style={styles.nameSection}>
                    <Text style={styles.remoteName}>{remoteName}</Text>
                    {callMode === 'active' ? (
                        <View style={styles.timerRow}>
                            <View style={[styles.timerDot, { backgroundColor: '#22c55e' }]} />
                            <Text style={[styles.timerText, { color: '#22c55e' }]}>{formatTime(elapsedSeconds)}</Text>
                        </View>
                    ) : (
                        <View style={styles.statusRow}>
                            <CallingDots color={accentColor} />
                        </View>
                    )}
                </View>

                {/* Controls */}
                <View style={styles.controls}>
                    {callMode === 'active' && (
                        <View style={styles.secondaryControls}>
                            {/* Mute */}
                            <View style={styles.actionItem}>
                                <TouchableOpacity
                                    style={[styles.controlBtn, isMuted && { backgroundColor: accentColor }]}
                                    onPress={toggleMute}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={24} color={isMuted ? '#fff' : '#ccc'} />
                                </TouchableOpacity>
                                <Text style={styles.actionLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
                            </View>

                            {/* Speaker */}
                            <View style={styles.actionItem}>
                                <TouchableOpacity
                                    style={[styles.controlBtn, isSpeaker && { backgroundColor: accentColor }]}
                                    onPress={toggleSpeaker}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name={isSpeaker ? 'volume-high' : 'volume-medium'} size={24} color={isSpeaker ? '#fff' : '#ccc'} />
                                </TouchableOpacity>
                                <Text style={styles.actionLabel}>Speaker</Text>
                            </View>
                        </View>
                    )}

                    {/* End call */}
                    <View style={styles.actionItem}>
                        <TouchableOpacity style={styles.endBtn} onPress={handleEndCall} activeOpacity={0.8}>
                            <Ionicons name="call" size={30} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
                        </TouchableOpacity>
                        <Text style={styles.actionLabel}>End call</Text>
                    </View>
                </View>
            </View>
        </View>
    );
}

// Animated "Calling…" dots
function CallingDots({ color }: { color: string }) {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        const anim = (dot: Animated.Value, delay: number) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
                    Animated.timing(dot, { toValue: 0, duration: 400, useNativeDriver: true }),
                    Animated.delay(800 - delay),
                ]),
            );
        Animated.parallel([anim(dot1, 0), anim(dot2, 200), anim(dot3, 400)]).start();
    }, []);
    const style = (dot: Animated.Value) => ({
        width: 7, height: 7, borderRadius: 4, backgroundColor: color, marginHorizontal: 3,
        opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
        transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
    });
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Text style={{ color: '#8A8A99', fontSize: 14, fontFamily: 'Poppins_400Regular', marginRight: 6 }}>Calling</Text>
            <Animated.View style={style(dot1)} />
            <Animated.View style={style(dot2)} />
            <Animated.View style={style(dot3)} />
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#0A0A10' },

    topBlob: {
        position: 'absolute',
        top: -100, alignSelf: 'center',
        width: 320, height: 320, borderRadius: 160,
        opacity: 0.25,
    },

    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 32,
    },

    // Avatar
    avatarSection: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 160,
        height: 160,
    },
    avatarRing: {
        width: 130,
        height: 130,
        borderRadius: 65,
        borderWidth: 2.5,
        padding: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInner: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInitials: {
        fontSize: 40,
        fontFamily: 'Poppins_700Bold',
        lineHeight: 52,
    },

    // Name / status
    nameSection: { alignItems: 'center', gap: 8 },
    remoteName: {
        color: '#fff',
        fontSize: 28,
        fontFamily: 'Poppins_700Bold',
        letterSpacing: -0.5,
        textAlign: 'center',
    },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { color: '#8A8A99', fontSize: 15, fontFamily: 'Poppins_400Regular' },
    timerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    timerDot: { width: 8, height: 8, borderRadius: 4 },
    timerText: { fontSize: 22, fontFamily: 'Poppins_600SemiBold', letterSpacing: 1 },

    // Controls
    controls: { width: '100%', alignItems: 'center', gap: 32 },
    secondaryControls: {
        flexDirection: 'row',
        gap: 48,
        justifyContent: 'center',
    },
    actionItem: { alignItems: 'center', gap: 10 },
    actionLabel: { color: '#8A8A99', fontSize: 12, fontFamily: 'Poppins_400Regular' },

    controlBtn: {
        width: 60, height: 60, borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center', justifyContent: 'center',
    },
    endBtn: {
        width: 70, height: 70, borderRadius: 35,
        backgroundColor: '#ef4444',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#ef4444', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5, shadowRadius: 12, elevation: 10,
    },
    acceptBtn: {
        width: 70, height: 70, borderRadius: 35,
        alignItems: 'center', justifyContent: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5, shadowRadius: 12, elevation: 10,
    },
    declineBtn: {
        width: 70, height: 70, borderRadius: 35,
        backgroundColor: '#ef4444',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#ef4444', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4, shadowRadius: 12, elevation: 10,
    },
    incomingActions: {
        flexDirection: 'row',
        gap: 64,
        justifyContent: 'center',
    },
});
