import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Easing,
    Image,
    ImageBackground,
    PermissionsAndroid,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import {
    ChannelProfileType,
    ClientRoleType,
    IRtcEngine,
    createAgoraRtcEngine,
} from 'react-native-agora';
import { useAuth } from '../context/AuthContext';
import { acceptCall, declineCall, endCall } from '../services/userService';

async function requestAudioPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    try {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
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

    const engineRef = useRef<IRtcEngine | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const endedRef = useRef(false);

    const [callMode, setCallMode] = useState<CallMode>((params.mode as CallMode) || 'outgoing');
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeaker, setIsSpeaker] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    const remoteName = params.remoteName || 'User';

    const startTimer = useCallback(() => {
        timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
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
                onJoinChannelSuccess: () => console.log('[Agora] Joined channel'),
                onUserJoined: () => {
                    setCallMode('active');
                    startTimer();
                },
                onUserOffline: () => {
                    if (!endedRef.current) handleEndCall();
                },
            });
            engine.joinChannel(tkn, channel, 0, {
                channelProfile: ChannelProfileType.ChannelProfileCommunication,
                clientRoleType: ClientRoleType.ClientRoleBroadcaster,
            });
        } catch (err) {
            console.error('[Agora] Join error:', err);
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
        setIsMuted(prev => { engineRef.current?.muteLocalAudioStream(!prev); return !prev; });
    };

    const toggleSpeaker = () => {
        setIsSpeaker(prev => { engineRef.current?.setEnableSpeakerphone(!prev); return !prev; });
    };

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    };

    if (callMode === 'incoming') {
        return (
            <View style={styles.root}>
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
                <ImageBackground
                    source={params.remoteImage ? { uri: params.remoteImage } : undefined}
                    style={StyleSheet.absoluteFill}
                >
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />

                    <View style={styles.topControls}>
                        <TouchableOpacity style={styles.topIconBtn} onPress={() => router.back()}>
                            <Ionicons name="expand-outline" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View style={{ flexDirection: 'row', gap: 15 }}>
                            <TouchableOpacity style={styles.topIconBtn}>
                                <Ionicons name="person-add-outline" size={24} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.topIconBtn}>
                                <Ionicons name="chatbubble-ellipses-outline" size={22} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
                        <BlurView intensity={30} tint="dark" style={styles.glassCard}>
                            <View style={styles.cardHeader}>
                                <View style={[styles.avatarBox, !params.remoteImage && { backgroundColor: theme.soft }]}>
                                    {params.remoteImage ? (
                                        <Image source={{ uri: params.remoteImage }} style={styles.avatarImage} />
                                    ) : (
                                        <Text style={[styles.avatarText, { color: theme.primary }]}>{initials}</Text>
                                    )}
                                </View>
                                <Text style={styles.remoteNameText}>{remoteName}</Text>
                                <Text style={styles.statusText}>Incoming audio call</Text>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.incomingActions}>
                                <View style={styles.actionItem}>
                                    <TouchableOpacity style={styles.declineBtnGlass} onPress={handleDecline} activeOpacity={0.8}>
                                        <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
                                    </TouchableOpacity>
                                    <Text style={styles.actionLabel}>Decline</Text>
                                </View>
                                <View style={styles.actionItem}>
                                    <TouchableOpacity
                                        style={[styles.acceptBtnGlass, { backgroundColor: '#22C55E' }]}
                                        onPress={handleAccept}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="call" size={28} color="#fff" />
                                    </TouchableOpacity>
                                    <Text style={styles.actionLabel}>Accept</Text>
                                </View>
                            </View>
                        </BlurView>
                    </View>
                </ImageBackground>
            </View>
        );
    }

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            <ImageBackground
                source={params.remoteImage ? { uri: params.remoteImage } : undefined}
                style={StyleSheet.absoluteFill}
            >
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />

                <View style={styles.topControls}>
                    <TouchableOpacity style={styles.topIconBtn} onPress={() => router.back()}>
                        <Ionicons name="expand-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={{ flexDirection: 'row', gap: 15 }}>
                        <TouchableOpacity style={styles.topIconBtn}>
                            <Ionicons name="person-add-outline" size={24} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.topIconBtn}>
                            <Ionicons name="chatbubble-ellipses-outline" size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
                    <BlurView intensity={45} tint="dark" style={styles.glassCard}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.avatarBox, !params.remoteImage && { backgroundColor: theme.soft }]}>
                                {params.remoteImage ? (
                                    <Image source={{ uri: params.remoteImage }} style={styles.avatarImage} />
                                ) : (
                                    <Text style={[styles.avatarText, { color: theme.primary }]}>{initials}</Text>
                                )}
                            </View>
                            <Text style={styles.remoteNameText}>{remoteName}</Text>
                            {callMode === 'active' ? (
                                <Text style={[styles.statusText, { color: '#22c55e' }]}>
                                    Connected · {formatTime(elapsedSeconds)}
                                </Text>
                            ) : (
                                <Text style={styles.statusText}>Calling...</Text>
                            )}
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.controlsRow}>
                            {/* Speaker */}
                            <TouchableOpacity
                                style={[styles.glassBtn, isSpeaker && { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                                onPress={toggleSpeaker}
                            >
                                <Ionicons name={isSpeaker ? 'volume-high' : 'volume-medium'} size={24} color="#fff" />
                            </TouchableOpacity>

                            {/* Mute */}
                            <TouchableOpacity
                                style={[styles.glassBtn, isMuted && { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                                onPress={toggleMute}
                            >
                                <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={24} color="#fff" />
                            </TouchableOpacity>

                            {/* End Call */}
                            <TouchableOpacity style={styles.endBtnGlass} onPress={handleEndCall}>
                                <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
                            </TouchableOpacity>
                        </View>
                    </BlurView>
                </View>
            </ImageBackground>
        </View>
    );
}

// Minimal placeholder component for calling status
function CallingDots({ color }: { color: string }) {
    return <Text style={{ color: '#8A8A99' }}>Calling...</Text>;
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#000',
    },
    content: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingHorizontal: 20,
    },

    // ── Top Controls
    topControls: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        zIndex: 10,
    },
    topIconBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },

    // ── Action Card
    glassCard: {
        width: '100%',
        borderRadius: 32,
        padding: 24,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        overflow: 'hidden',
    },
    cardHeader: {
        alignItems: 'center',
        paddingBottom: 20,
    },
    avatarBox: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 16,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2A2A32',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        fontSize: 32,
        fontFamily: 'Poppins_700Bold',
    },
    remoteNameText: {
        color: '#fff',
        fontSize: 22,
        fontFamily: 'Poppins_600SemiBold',
        marginBottom: 4,
    },
    statusText: {
        color: '#B8B8C6',
        fontSize: 13,
        fontFamily: 'Poppins_400Regular',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        width: '100%',
        marginBottom: 20,
    },

    // ── Buttons
    controlsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
    },
    glassBtn: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    endBtnGlass: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 5,
    },

    // ── Incoming Actions
    incomingActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 40,
    },
    actionItem: {
        alignItems: 'center',
        gap: 8,
    },
    actionLabel: {
        color: '#8A8A99',
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
    },
    declineBtnGlass: {
        width: 65,
        height: 65,
        borderRadius: 33,
        backgroundColor: '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    acceptBtnGlass: {
        width: 65,
        height: 65,
        borderRadius: 33,
        alignItems: 'center',
        justifyContent: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
});
