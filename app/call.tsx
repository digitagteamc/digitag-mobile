import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, PermissionsAndroid, Platform, Text, TouchableOpacity, View } from 'react-native';
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
        const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);
        return (
            granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED
        );
    } catch {
        return false;
    }
}

type CallMode = 'outgoing' | 'incoming' | 'active';

export default function CallScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const params = useLocalSearchParams<{
        mode: string;
        callId: string;
        channelName: string;
        agoraToken: string;
        appId: string;
        remoteName: string;
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
            <View style={{ flex: 1, backgroundColor: '#060606', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
                <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 2, borderColor: '#F02C8C' }}>
                    <Text style={{ fontSize: 44 }}>👤</Text>
                </View>
                <Text style={{ color: '#fff', fontSize: 26, fontFamily: 'Poppins_700Bold', marginBottom: 8 }}>{remoteName}</Text>
                <Text style={{ color: '#888', fontSize: 15, marginBottom: 72 }}>Incoming audio call</Text>
                <View style={{ flexDirection: 'row', gap: 64 }}>
                    <View style={{ alignItems: 'center', gap: 8 }}>
                        <TouchableOpacity onPress={handleDecline} style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 28 }}>📵</Text>
                        </TouchableOpacity>
                        <Text style={{ color: '#888', fontSize: 12 }}>Decline</Text>
                    </View>
                    <View style={{ alignItems: 'center', gap: 8 }}>
                        <TouchableOpacity onPress={handleAccept} style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#16a34a', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 28 }}>📞</Text>
                        </TouchableOpacity>
                        <Text style={{ color: '#888', fontSize: 12 }}>Accept</Text>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#060606', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
            <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 2, borderColor: '#F02C8C' }}>
                <Text style={{ fontSize: 44 }}>👤</Text>
            </View>
            <Text style={{ color: '#fff', fontSize: 26, fontFamily: 'Poppins_700Bold', marginBottom: 8 }}>{remoteName}</Text>
            <Text style={{ color: callMode === 'active' ? '#16a34a' : '#888', fontSize: 15, marginBottom: 48 }}>
                {callMode === 'active' ? formatTime(elapsedSeconds) : 'Calling...'}
            </Text>

            {callMode === 'active' && (
                <View style={{ flexDirection: 'row', gap: 32, marginBottom: 48 }}>
                    <View style={{ alignItems: 'center', gap: 8 }}>
                        <TouchableOpacity onPress={toggleMute} style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: isMuted ? '#F02C8C' : '#1f1f1f', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 24 }}>{isMuted ? '🔇' : '🎤'}</Text>
                        </TouchableOpacity>
                        <Text style={{ color: '#888', fontSize: 12 }}>{isMuted ? 'Unmute' : 'Mute'}</Text>
                    </View>
                    <View style={{ alignItems: 'center', gap: 8 }}>
                        <TouchableOpacity onPress={toggleSpeaker} style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: isSpeaker ? '#F02C8C' : '#1f1f1f', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 24 }}>🔊</Text>
                        </TouchableOpacity>
                        <Text style={{ color: '#888', fontSize: 12 }}>Speaker</Text>
                    </View>
                </View>
            )}

            <View style={{ alignItems: 'center', gap: 8 }}>
                <TouchableOpacity onPress={handleEndCall} style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 28 }}>📵</Text>
                </TouchableOpacity>
                <Text style={{ color: '#888', fontSize: 12 }}>End</Text>
            </View>
        </View>
    );
}
