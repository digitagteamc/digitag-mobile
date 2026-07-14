import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Audio } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Image,
    PermissionsAndroid,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    ChannelProfileType,
    ClientRoleType,
    IRtcEngine,
    createAgoraRtcEngine,
} from 'react-native-agora';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { clearIncomingCallNotification } from '../services/callNotification';
import { acceptCall, declineCall, endCall, getCall } from '../services/userService';
import { useRoleTheme } from '../theme/useRoleTheme';

const RING_ASSET = require('../assets/sounds/ringtone.mp3');

function getInitials(name: string) {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

async function requestAudioPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    try {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
        return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
        return false;
    }
}

type CallMode = 'outgoing' | 'incoming' | 'active';

export default function CallScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const params = useLocalSearchParams<{
        mode: string; callId: string; channelName: string;
        agoraToken: string; appId: string; remoteName: string;
        remoteImage?: string;
    }>();
    const insets = useSafeAreaInsets();
    const theme = useRoleTheme();

    const engineRef = useRef<IRtcEngine | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const endedRef = useRef(false);
    const timerStartedRef = useRef(false);
    const ringSoundRef = useRef<Audio.Sound | null>(null);

    // Ref to always hold the latest handleEndCall so Agora handlers don't go stale
    const handleEndCallRef = useRef<(() => Promise<void>) | undefined>(undefined);

    const [callMode, setCallMode] = useState<CallMode>((params.mode as CallMode) || 'outgoing');
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeaker, setIsSpeaker] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    // ── Stop ring — synchronous-first to guarantee silence even on unmount
    const stopRing = useCallback(() => {
        const sound = ringSoundRef.current;
        if (!sound) return;
        ringSoundRef.current = null;
        sound.stopAsync().catch(() => {});
        sound.unloadAsync().catch(() => {});
    }, []);

    // ── Start ring — guarded so it never plays after call ends
    const startRing = useCallback(async () => {
        if (endedRef.current) return;
        try {
            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: true,
            });
            if (endedRef.current) return; // check again after async gap
            const { sound } = await Audio.Sound.createAsync(
                RING_ASSET,
                { isLooping: true, volume: 1.0 }
            );
            if (endedRef.current) {
                // call ended while sound was loading — discard immediately
                sound.unloadAsync().catch(() => {});
                return;
            }
            ringSoundRef.current = sound;
            await sound.playAsync();
        } catch { /* ignore */ }
    }, []);

    const startTimer = useCallback(() => {
        if (timerStartedRef.current) return;
        timerStartedRef.current = true;
        timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    }, []);

    const safeNavigateBack = useCallback(() => {
        if (router.canGoBack()) router.back();
        else router.replace('/(tabs)' as any);
    }, [router]);

    const joinChannel = useCallback(async (tkn: string, channel: string, appId: string) => {
        try {
            const hasPermission = await requestAudioPermission();
            if (!hasPermission) {
                Alert.alert('Permission Denied', 'Microphone access is required for calls.');
                safeNavigateBack();
                return;
            }
            const engine = createAgoraRtcEngine();
            engineRef.current = engine;
            engine.initialize({ appId });
            engine.enableAudio();
            engine.setDefaultAudioRouteToSpeakerphone(false);
            engine.registerEventHandler({
                onJoinChannelSuccess: () => console.log('[Agora] Joined channel'),
                onUserJoined: () => {
                    setCallMode('active');
                    startTimer();
                },
                onUserOffline: () => {
                    // always call the latest version via ref to avoid stale closure
                    handleEndCallRef.current?.();
                },
            });
            engine.joinChannel(tkn, channel, 0, {
                channelProfile: ChannelProfileType.ChannelProfileCommunication,
                clientRoleType: ClientRoleType.ClientRoleBroadcaster,
            });
        } catch (err) {
            console.error('[Agora] Join error:', err);
            Alert.alert('Error', 'Could not connect to call');
            safeNavigateBack();
        }
    }, [startTimer, safeNavigateBack]);

    const handleEndCall = useCallback(async () => {
        if (endedRef.current) return;
        endedRef.current = true;
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        stopRing();
        if (params.callId) await clearIncomingCallNotification(params.callId).catch(() => {});
        engineRef.current?.leaveChannel();
        engineRef.current?.release();
        engineRef.current = null;
        if (token && params.callId) await endCall(token, params.callId).catch(() => {});
        safeNavigateBack();
    }, [token, params.callId, stopRing, safeNavigateBack]);

    // Keep the ref current so Agora's onUserOffline always calls the latest version
    handleEndCallRef.current = handleEndCall;

    const handleDecline = useCallback(async () => {
        if (endedRef.current) return;
        endedRef.current = true;
        stopRing();
        if (params.callId) await clearIncomingCallNotification(params.callId).catch(() => {});
        if (token && params.callId) await declineCall(token, params.callId).catch(() => {});
        safeNavigateBack();
    }, [token, params.callId, stopRing, safeNavigateBack]);

    const handleAccept = useCallback(async () => {
        if (!token || !params.callId) return;
        stopRing();
        await clearIncomingCallNotification(params.callId).catch(() => {});
        const res = await acceptCall(token, params.callId);
        if (res.success && res.data) {
            await joinChannel(res.data.token, res.data.channelName, res.data.appId);
            // setCallMode / startTimer driven by onUserJoined to avoid double-start
        } else {
            Alert.alert('Error', 'Could not accept call');
            safeNavigateBack();
        }
    }, [token, params.callId, stopRing, joinChannel, safeNavigateBack]);

    // Stale-call guard: a leftover notification can open this screen for a call
    // that already ended (caller gave up while the app was killed) — check the
    // real status once the token is restored and bail out with a missed-call
    // message instead of ringing forever.
    useEffect(() => {
        if (params.mode !== 'incoming' || !token || !params.callId) return;
        let cancelled = false;
        (async () => {
            const res = await getCall(token, params.callId);
            if (cancelled || endedRef.current) return;
            const status = res.success ? res.data?.status : null;
            if (status && status !== 'RINGING') {
                endedRef.current = true;
                stopRing();
                clearIncomingCallNotification(params.callId).catch(() => {});
                Alert.alert('Missed call', `You missed a call from ${params.remoteName || 'this user'}.`);
                safeNavigateBack();
            }
        })();
        return () => { cancelled = true; };
    }, [token]);

    // ── Lifecycle
    useEffect(() => {
        if (params.mode === 'incoming') {
            // Cancel the notification immediately so its channel sound stops;
            // the in-app looping ring (expo-av) takes over from here.
            if (params.callId) clearIncomingCallNotification(params.callId).catch(() => {});
            startRing();
        } else if (params.mode === 'outgoing' && params.agoraToken && params.channelName && params.appId) {
            startRing();
            joinChannel(params.agoraToken, params.channelName, params.appId);
        }
        return () => {
            endedRef.current = true;
            if (timerRef.current) clearInterval(timerRef.current);
            stopRing();
            if (params.callId) clearIncomingCallNotification(params.callId).catch(() => {});
            engineRef.current?.leaveChannel();
            engineRef.current?.release();
            engineRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (callMode !== 'active') return;
        stopRing();
        // The caller's ringback is still playing when Agora joins the channel
        // and sets up its own (correct) audio route — stopping/unloading that
        // expo-av sound just now can disturb the OS audio session Agora
        // already configured, leaving the callee's voice near-silent on
        // earpiece until speaker is toggled (which forces a fresh route).
        // Re-assert the intended route now that the ringback is gone so it
        // never depends on the user finding the speaker button.
        engineRef.current?.setEnableSpeakerphone(isSpeaker);
    }, [callMode, isSpeaker]);

    const toggleMute = () => {
        setIsMuted(prev => { engineRef.current?.muteLocalAudioStream(!prev); return !prev; });
    };

    const toggleSpeaker = () => {
        setIsSpeaker(prev => { engineRef.current?.setEnableSpeakerphone(!prev); return !prev; });
    };

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    };

    const remoteName = params.remoteName || 'User';
    const initials = getInitials(remoteName);

    const avatar = (
        <View style={[styles.avatarBox, !params.remoteImage && { backgroundColor: theme.soft }]}>
            {params.remoteImage ? (
                <Image source={{ uri: params.remoteImage }} style={styles.avatarImage} />
            ) : (
                <Text style={[styles.avatarText, { color: theme.primary }]}>{initials}</Text>
            )}
        </View>
    );

    if (callMode === 'incoming') {
        return (
            <View style={styles.root}>
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
                <LinearGradient
                    colors={['#0D0D14', '#1A1A2E', '#16213E']}
                    style={StyleSheet.absoluteFill}
                />
                {params.remoteImage && (
                    <Image
                        source={{ uri: params.remoteImage }}
                        style={[StyleSheet.absoluteFill, { opacity: 0.25 }]}
                        resizeMode="cover"
                        blurRadius={8}
                    />
                )}

                <View style={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}>
                    {/* Caller info */}
                    <View style={styles.callerSection}>
                        {avatar}
                        <Text style={styles.remoteNameText} numberOfLines={1} ellipsizeMode="tail">{remoteName}</Text>
                        <Text style={styles.statusText}>Incoming audio call</Text>
                    </View>

                    {/* Action buttons */}
                    <BlurView intensity={30} tint="dark" style={styles.glassCard}>
                        <View style={styles.incomingActions}>
                            <View style={styles.actionItem}>
                                <TouchableOpacity style={styles.declineBtn} onPress={handleDecline} activeOpacity={0.8}>
                                    <Ionicons name="call" size={30} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
                                </TouchableOpacity>
                                <Text style={styles.actionLabel}>Decline</Text>
                            </View>
                            <View style={styles.actionItem}>
                                <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept} activeOpacity={0.8}>
                                    <Ionicons name="call" size={30} color="#fff" />
                                </TouchableOpacity>
                                <Text style={styles.actionLabel}>Accept</Text>
                            </View>
                        </View>
                    </BlurView>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            <LinearGradient
                colors={['#0D0D14', '#1A1A2E', '#16213E']}
                style={StyleSheet.absoluteFill}
            />
            {params.remoteImage && (
                <Image
                    source={{ uri: params.remoteImage }}
                    style={[StyleSheet.absoluteFill, { opacity: 0.25 }]}
                    resizeMode="cover"
                    blurRadius={8}
                />
            )}

            <View style={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}>
                {/* Remote info */}
                <View style={styles.callerSection}>
                    {avatar}
                    <Text style={styles.remoteNameText} numberOfLines={1} ellipsizeMode="tail">{remoteName}</Text>
                    {callMode === 'active' ? (
                        <Text style={[styles.statusText, { color: '#22c55e' }]}>
                            Connected · {formatTime(elapsedSeconds)}
                        </Text>
                    ) : (
                        <Text style={styles.statusText}>Calling...</Text>
                    )}
                </View>

                {/* Controls */}
                <BlurView intensity={45} tint="dark" style={styles.glassCard}>
                    <View style={styles.controlsRow}>
                        <View style={styles.controlItem}>
                            <TouchableOpacity
                                style={[styles.glassBtn, isSpeaker && styles.glassBtnActive]}
                                onPress={toggleSpeaker}
                            >
                                <Ionicons name={isSpeaker ? 'volume-high' : 'volume-medium-outline'} size={24} color="#fff" />
                            </TouchableOpacity>
                            <Text style={styles.controlLabel}>{isSpeaker ? 'Speaker' : 'Earpiece'}</Text>
                        </View>

                        <View style={styles.controlItem}>
                            <TouchableOpacity style={styles.endBtn} onPress={handleEndCall} activeOpacity={0.8}>
                                <Ionicons name="call" size={30} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
                            </TouchableOpacity>
                            <Text style={styles.controlLabel}>End</Text>
                        </View>

                        <View style={styles.controlItem}>
                            <TouchableOpacity
                                style={[styles.glassBtn, isMuted && styles.glassBtnActive]}
                                onPress={toggleMute}
                            >
                                <Ionicons name={isMuted ? 'mic-off' : 'mic-outline'} size={24} color="#fff" />
                            </TouchableOpacity>
                            <Text style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
                        </View>
                    </View>
                </BlurView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#0D0D14',
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
    },

    // ── Caller info
    callerSection: {
        alignItems: 'center',
        gap: 12,
    },
    avatarBox: {
        width: 110,
        height: 110,
        borderRadius: 55,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2A2A3A',
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        fontSize: 36,
        fontFamily: 'Poppins_700Bold',
    },
    remoteNameText: {
        color: '#fff',
        fontSize: 26,
        fontFamily: 'Poppins_600SemiBold',
        letterSpacing: -0.5,
    },
    statusText: {
        color: '#9CA3AF',
        fontSize: 14,
        fontFamily: 'Poppins_400Regular',
    },

    // ── Glass card (action area)
    glassCard: {
        width: '100%',
        borderRadius: 32,
        padding: 28,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        overflow: 'hidden',
    },

    // ── Incoming actions
    incomingActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 60,
    },
    actionItem: {
        alignItems: 'center',
        gap: 10,
    },
    actionLabel: {
        color: '#9CA3AF',
        fontSize: 13,
        fontFamily: 'Poppins_400Regular',
    },
    declineBtn: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
    },
    acceptBtn: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#22C55E',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: '#22C55E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
    },

    // ── Active call controls
    controlsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 28,
    },
    controlItem: {
        alignItems: 'center',
        gap: 8,
    },
    controlLabel: {
        color: '#9CA3AF',
        fontSize: 11,
        fontFamily: 'Poppins_400Regular',
    },
    glassBtn: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    glassBtnActive: {
        backgroundColor: 'rgba(255,255,255,0.25)',
    },
    endBtn: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
    },
});
