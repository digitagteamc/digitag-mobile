import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
    ChannelProfileType,
    ClientRoleType,
    IRtcEngine,
    createAgoraRtcEngine,
} from 'react-native-agora';
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import { useAuth } from './AuthContext';
import { clearIncomingCallNotification } from '../services/callNotification';
import { acceptCall as apiAcceptCall, declineCall as apiDeclineCall, endCall as apiEndCall } from '../services/userService';

const RING_ASSET = require('../assets/sounds/ringtone.mp3');

export type CallMode = 'idle' | 'incoming' | 'outgoing' | 'active';

export interface OutgoingCallParams {
    callId: string;
    channelName: string;
    agoraToken: string;
    appId: string;
    remoteName?: string;
    remoteImage?: string;
}

export interface IncomingCallParams {
    callId: string;
    remoteName?: string;
    remoteImage?: string;
}

interface CallContextValue {
    callMode: CallMode;
    callId: string | null;
    remoteName: string;
    remoteImage?: string;
    elapsedSeconds: number;
    isMuted: boolean;
    isSpeaker: boolean;
    // True once the user has navigated away from the full-screen call UI while
    // a call is still ringing/active — drives the minimized "return to call" bar.
    isMinimized: boolean;
    startOutgoingCall: (params: OutgoingCallParams) => Promise<void>;
    startIncomingCall: (params: IncomingCallParams) => void;
    acceptCall: () => Promise<void>;
    declineCall: () => Promise<void>;
    endCall: () => Promise<void>;
    toggleMute: () => void;
    toggleSpeaker: () => void;
    minimize: () => void;
    resume: () => void;
}

const CallContext = createContext<CallContextValue | undefined>(undefined);

async function requestAudioPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    try {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
        return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
        return false;
    }
}

/** Owns the Agora call session independently of whatever screen is currently
 *  mounted — a call must keep running (talkable, ringable) if the user
 *  navigates away from the call screen, the same way a real phone call does.
 *  Mounted once at the app root; app/call.tsx is just a view onto this state. */
export function CallProvider({ children }: { children: React.ReactNode }) {
    const { token } = useAuth();
    const router = useRouter();

    const [callMode, setCallMode] = useState<CallMode>('idle');
    const [callId, setCallId] = useState<string | null>(null);
    const [remoteName, setRemoteName] = useState('User');
    const [remoteImage, setRemoteImage] = useState<string | undefined>(undefined);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeaker, setIsSpeaker] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

    const engineRef = useRef<IRtcEngine | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const timerStartedRef = useRef(false);
    const endedRef = useRef(true); // true = no call in progress
    const ringSoundRef = useRef<Audio.Sound | null>(null);
    const callIdRef = useRef<string | null>(null);
    const tokenRef = useRef(token);
    tokenRef.current = token;

    const stopRing = useCallback(() => {
        const sound = ringSoundRef.current;
        if (!sound) return;
        ringSoundRef.current = null;
        sound.stopAsync().catch(() => {});
        sound.unloadAsync().catch(() => {});
    }, []);

    const startRing = useCallback(async () => {
        if (endedRef.current) return;
        try {
            await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true });
            if (endedRef.current) return;
            const { sound } = await Audio.Sound.createAsync(RING_ASSET, { isLooping: true, volume: 1.0 });
            if (endedRef.current) { sound.unloadAsync().catch(() => {}); return; }
            ringSoundRef.current = sound;
            await sound.playAsync();
        } catch { /* ignore */ }
    }, []);

    const startTimer = useCallback(() => {
        if (timerStartedRef.current) return;
        timerStartedRef.current = true;
        timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    }, []);

    const resetCallState = useCallback(() => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        timerStartedRef.current = false;
        setElapsedSeconds(0);
        setIsMuted(false);
        setIsSpeaker(false);
        setIsMinimized(false);
        setCallMode('idle');
        setCallId(null);
        callIdRef.current = null;
    }, []);

    const teardownEngine = useCallback(() => {
        engineRef.current?.leaveChannel();
        engineRef.current?.release();
        engineRef.current = null;
    }, []);

    /** Ends the current call — the ONLY place the Agora engine actually gets
     *  torn down. Never called just because a screen unmounted. */
    const endCall = useCallback(async () => {
        if (endedRef.current) return;
        endedRef.current = true;
        stopRing();
        const id = callIdRef.current;
        if (id) await clearIncomingCallNotification(id).catch(() => {});
        teardownEngine();
        if (tokenRef.current && id) await apiEndCall(tokenRef.current, id).catch(() => {});
        resetCallState();
    }, [stopRing, teardownEngine, resetCallState]);

    const joinChannel = useCallback(async (tkn: string, channel: string, appId: string) => {
        try {
            const hasPermission = await requestAudioPermission();
            if (!hasPermission) {
                Alert.alert('Permission Denied', 'Microphone access is required for calls.');
                await endCall();
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
                    stopRing();
                    setCallMode('active');
                    startTimer();
                },
                onUserOffline: () => { endCall(); },
            });
            engine.joinChannel(tkn, channel, 0, {
                channelProfile: ChannelProfileType.ChannelProfileCommunication,
                clientRoleType: ClientRoleType.ClientRoleBroadcaster,
            });
        } catch (err) {
            console.error('[Agora] Join error:', err);
            Alert.alert('Error', 'Could not connect to call');
            await endCall();
        }
    }, [endCall, startTimer, stopRing]);

    const startOutgoingCall = useCallback(async (params: OutgoingCallParams) => {
        endedRef.current = false;
        callIdRef.current = params.callId;
        setCallId(params.callId);
        setRemoteName(params.remoteName || 'User');
        setRemoteImage(params.remoteImage);
        setCallMode('outgoing');
        setIsMinimized(false);
        startRing();
        await joinChannel(params.agoraToken, params.channelName, params.appId);
    }, [joinChannel, startRing]);

    const startIncomingCall = useCallback((params: IncomingCallParams) => {
        endedRef.current = false;
        callIdRef.current = params.callId;
        setCallId(params.callId);
        setRemoteName(params.remoteName || 'User');
        setRemoteImage(params.remoteImage);
        setCallMode('incoming');
        setIsMinimized(false);
        startRing();
    }, [startRing]);

    const acceptCallFn = useCallback(async () => {
        const id = callIdRef.current;
        if (!tokenRef.current || !id) return;
        stopRing();
        await clearIncomingCallNotification(id).catch(() => {});
        const res = await apiAcceptCall(tokenRef.current, id);
        if (res.success && res.data) {
            await joinChannel(res.data.token, res.data.channelName, res.data.appId);
        } else {
            Alert.alert('Error', res.error || 'Could not accept call');
            await endCall();
        }
    }, [stopRing, joinChannel, endCall]);

    const declineCallFn = useCallback(async () => {
        if (endedRef.current) return;
        endedRef.current = true;
        stopRing();
        const id = callIdRef.current;
        if (id) await clearIncomingCallNotification(id).catch(() => {});
        if (tokenRef.current && id) await apiDeclineCall(tokenRef.current, id).catch(() => {});
        resetCallState();
    }, [stopRing, resetCallState]);

    // The caller's ringback is still playing when Agora joins the channel and
    // sets up its own (correct) audio route — stopping/unloading that expo-av
    // sound at that exact moment can disturb the OS audio session Agora
    // already configured, leaving the callee's voice near-silent on earpiece
    // until speaker is toggled. Re-assert the intended route once ringback is
    // gone so it never depends on the user finding the speaker button.
    useEffect(() => {
        if (callMode !== 'active') return;
        engineRef.current?.setEnableSpeakerphone(isSpeaker);
    }, [callMode, isSpeaker]);

    const toggleMute = useCallback(() => {
        setIsMuted(prev => { engineRef.current?.muteLocalAudioStream(!prev); return !prev; });
    }, []);

    const toggleSpeaker = useCallback(() => {
        setIsSpeaker(prev => { engineRef.current?.setEnableSpeakerphone(!prev); return !prev; });
    }, []);

    // Leaving the full-screen call UI (back button, tab switch) must not end
    // the call — it just hides the screen and shows the minimized bar instead.
    const minimize = useCallback(() => {
        if (callMode === 'idle') return;
        setIsMinimized(true);
    }, [callMode]);

    const resume = useCallback(() => {
        setIsMinimized(false);
        router.push({ pathname: '/call', params: { mode: 'resume' } } as any);
    }, [router]);

    const value: CallContextValue = {
        callMode,
        callId,
        remoteName,
        remoteImage,
        elapsedSeconds,
        isMuted,
        isSpeaker,
        isMinimized,
        startOutgoingCall,
        startIncomingCall,
        acceptCall: acceptCallFn,
        declineCall: declineCallFn,
        endCall,
        toggleMute,
        toggleSpeaker,
        minimize,
        resume,
    };

    return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

export function useCall() {
    const ctx = useContext(CallContext);
    if (!ctx) throw new Error('useCall must be used within a CallProvider');
    return ctx;
}
