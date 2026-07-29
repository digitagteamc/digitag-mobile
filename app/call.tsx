import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
    Alert,
    BackHandler,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useCall } from '../context/CallContext';
import { getCall } from '../services/userService';
import { useRoleTheme } from '../theme/useRoleTheme';

function getInitials(name: string) {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

/** Thin view over CallContext — this screen owns none of the call's
 *  lifecycle. Navigating away from it (back button, tab switch) never ends
 *  the call; the call keeps running (talkable, ringable) in CallProvider
 *  until the user explicitly ends it or the other side hangs up, exactly
 *  like a real phone call. */
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
    const call = useCall();

    const startedRef = useRef(false);

    const safeNavigateBack = () => {
        call.minimize();
        if (router.canGoBack()) router.back();
        else router.replace('/(tabs)' as any);
    };

    // Kick off a fresh call only if nothing is already in progress — returning
    // to an ongoing call (the minimized bar, or a stray notification tap for a
    // call that's already active) must just render the existing session, not
    // start dialing again.
    useEffect(() => {
        if (startedRef.current) return;
        if (call.callMode !== 'idle') return; // already ringing/active — just render it
        startedRef.current = true;

        if (params.mode === 'outgoing' && params.agoraToken && params.channelName && params.appId) {
            call.startOutgoingCall({
                callId: params.callId,
                channelName: params.channelName,
                agoraToken: params.agoraToken,
                appId: params.appId,
                remoteName: params.remoteName,
                remoteImage: params.remoteImage,
            });
        } else if (params.mode === 'incoming' && params.callId) {
            call.startIncomingCall({
                callId: params.callId,
                remoteName: params.remoteName,
                remoteImage: params.remoteImage,
            });
        }
        // mode === 'resume' (from the minimized bar) falls through — nothing to start.
    }, []);

    // Stale-call guard: a leftover notification can open this screen for a call
    // that already ended (caller gave up while the app was killed) — check the
    // real status once and bail out with a missed-call message instead of
    // ringing forever.
    useEffect(() => {
        if (params.mode !== 'incoming' || !token || !params.callId) return;
        let cancelled = false;
        (async () => {
            const res = await getCall(token, params.callId);
            if (cancelled) return;
            const status = res.success ? res.data?.status : null;
            if (status && status !== 'RINGING' && status !== 'ACTIVE') {
                call.declineCall().catch(() => {});
                Alert.alert('Missed call', `You missed a call from ${params.remoteName || 'this user'}.`);
                safeNavigateBack();
            }
        })();
        return () => { cancelled = true; };
    }, [token]);

    // Android hardware back minimizes (keeps the call alive) instead of
    // falling through to the default "pop" — same intent either way, but this
    // guarantees minimize() runs first.
    useEffect(() => {
        const sub = BackHandler.addEventListener('hardwareBackPress', () => {
            safeNavigateBack();
            return true;
        });
        return () => sub.remove();
    }, []);

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    };

    const remoteName = call.remoteName || params.remoteName || 'User';
    const remoteImage = call.remoteImage || params.remoteImage;
    const initials = getInitials(remoteName);

    const avatar = (
        <View style={[styles.avatarBox, !remoteImage && { backgroundColor: theme.soft }]}>
            {remoteImage ? (
                <Image source={{ uri: remoteImage }} style={styles.avatarImage} />
            ) : (
                <Text style={[styles.avatarText, { color: theme.primary }]}>{initials}</Text>
            )}
        </View>
    );

    if (call.callMode === 'incoming') {
        return (
            <View style={styles.root}>
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
                <LinearGradient colors={['#0D0D14', '#1A1A2E', '#16213E']} style={StyleSheet.absoluteFill} />
                {remoteImage && (
                    <Image
                        source={{ uri: remoteImage }}
                        style={[StyleSheet.absoluteFill, { opacity: 0.25 }]}
                        resizeMode="cover"
                        blurRadius={8}
                    />
                )}

                <View style={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}>
                    <View style={styles.callerSection}>
                        {avatar}
                        <Text style={styles.remoteNameText} numberOfLines={1} ellipsizeMode="tail">{remoteName}</Text>
                        <Text style={styles.statusText}>Incoming audio call</Text>
                    </View>

                    <BlurView intensity={30} tint="dark" style={styles.glassCard}>
                        <View style={styles.incomingActions}>
                            <View style={styles.actionItem}>
                                <TouchableOpacity style={styles.declineBtn} onPress={() => { call.declineCall(); safeNavigateBack(); }} activeOpacity={0.8}>
                                    <Ionicons name="call" size={30} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
                                </TouchableOpacity>
                                <Text style={styles.actionLabel}>Decline</Text>
                            </View>
                            <View style={styles.actionItem}>
                                <TouchableOpacity style={styles.acceptBtn} onPress={() => call.acceptCall()} activeOpacity={0.8}>
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
            <LinearGradient colors={['#0D0D14', '#1A1A2E', '#16213E']} style={StyleSheet.absoluteFill} />
            {remoteImage && (
                <Image
                    source={{ uri: remoteImage }}
                    style={[StyleSheet.absoluteFill, { opacity: 0.25 }]}
                    resizeMode="cover"
                    blurRadius={8}
                />
            )}

            <View style={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}>
                <View style={styles.callerSection}>
                    {avatar}
                    <Text style={styles.remoteNameText} numberOfLines={1} ellipsizeMode="tail">{remoteName}</Text>
                    {call.callMode === 'active' ? (
                        <Text style={[styles.statusText, { color: '#22c55e' }]}>
                            Connected · {formatTime(call.elapsedSeconds)}
                        </Text>
                    ) : (
                        <Text style={styles.statusText}>Calling...</Text>
                    )}
                </View>

                <BlurView intensity={45} tint="dark" style={styles.glassCard}>
                    <View style={styles.controlsRow}>
                        <View style={styles.controlItem}>
                            <TouchableOpacity
                                style={[styles.glassBtn, call.isSpeaker && styles.glassBtnActive]}
                                onPress={call.toggleSpeaker}
                            >
                                <Ionicons name={call.isSpeaker ? 'volume-high' : 'volume-medium-outline'} size={24} color="#fff" />
                            </TouchableOpacity>
                            <Text style={styles.controlLabel}>{call.isSpeaker ? 'Speaker' : 'Earpiece'}</Text>
                        </View>

                        <View style={styles.controlItem}>
                            <TouchableOpacity style={styles.endBtn} onPress={() => { call.endCall(); safeNavigateBack(); }} activeOpacity={0.8}>
                                <Ionicons name="call" size={30} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
                            </TouchableOpacity>
                            <Text style={styles.controlLabel}>End</Text>
                        </View>

                        <View style={styles.controlItem}>
                            <TouchableOpacity
                                style={[styles.glassBtn, call.isMuted && styles.glassBtnActive]}
                                onPress={call.toggleMute}
                            >
                                <Ionicons name={call.isMuted ? 'mic-off' : 'mic-outline'} size={24} color="#fff" />
                            </TouchableOpacity>
                            <Text style={styles.controlLabel}>{call.isMuted ? 'Unmute' : 'Mute'}</Text>
                        </View>
                    </View>
                </BlurView>

                <TouchableOpacity style={styles.minimizeHint} onPress={safeNavigateBack} activeOpacity={0.7}>
                    <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
                    <Text style={styles.minimizeHintText}>Minimize — call stays connected</Text>
                </TouchableOpacity>
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
    minimizeHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
    },
    minimizeHintText: {
        color: '#9CA3AF',
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
    },
});
