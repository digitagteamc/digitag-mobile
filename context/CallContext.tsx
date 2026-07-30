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
import RNCallKeep from 'react-native-callkeep';
import RNVoipPushNotification from 'react-native-voip-push-notification';
import { useAuth } from './AuthContext';
import { clearIncomingCallNotification } from '../services/callNotification';
import {
    acceptCall as apiAcceptCall,
    declineCall as apiDeclineCall,
    endCall as apiEndCall,
    registerVoipToken as apiRegisterVoipToken,
} from '../services/userService';

const RING_ASSET = require('../assets/sounds/ringtone.mp3');
const IS_IOS = Platform.OS === 'ios';

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
    // True when this call was surfaced via a VoIP push (already reported to
    // CallKit natively) rather than the regular notifee flow — skips a
    // redundant displayIncomingCall.
    fromVoipPush?: boolean;
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
 *  Mounted once at the app root; app/call.tsx is just a view onto this state.
 *
 *  On iOS this also drives CallKit (native call UI, works from the lock
 *  screen) via PushKit VoIP pushes, so an incoming call reliably wakes the
 *  app and rings even when it's fully backgrounded or killed — a plain FCM
 *  push can't guarantee that on iOS. Android keeps using the existing
 *  notifee full-screen-intent ringing flow (already reliable there); this
 *  context doesn't touch that. */
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
    // CallKit's UUID for the call currently tracked with the OS — same value
    // as callId (backend ids are already UUIDs), kept separate in case that
    // ever changes.
    const callUUIDRef = useRef<string | null>(null);
    const isOutgoingRef = useRef(false);

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
        callUUIDRef.current = null;
        isOutgoingRef.current = false;
    }, []);

    const teardownEngine = useCallback(() => {
        engineRef.current?.leaveChannel();
        engineRef.current?.release();
        engineRef.current = null;
    }, []);

    /** Ends the current call — the ONLY place the Agora engine actually gets
     *  torn down. Never called just because a screen unmounted.
     *  `reportToCallKeep` is false when this runs AS A RESULT of CallKeep's
     *  own endCall event, so we don't tell it to end a call it already knows
     *  ended. */
    const endCall = useCallback(async (reportToCallKeep = true) => {
        if (endedRef.current) return;
        endedRef.current = true;
        stopRing();
        const id = callIdRef.current;
        const uuid = callUUIDRef.current;
        if (id) await clearIncomingCallNotification(id).catch(() => {});
        teardownEngine();
        if (tokenRef.current && id) await apiEndCall(tokenRef.current, id).catch(() => {});
        if (IS_IOS && reportToCallKeep && uuid) {
            try { RNCallKeep.endCall(uuid); } catch {}
        }
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
                    if (IS_IOS && callUUIDRef.current) {
                        try {
                            if (isOutgoingRef.current) RNCallKeep.reportConnectedOutgoingCallWithUUID(callUUIDRef.current);
                            RNCallKeep.setCurrentCallActive(callUUIDRef.current);
                        } catch {}
                    }
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
        callUUIDRef.current = params.callId;
        isOutgoingRef.current = true;
        setCallId(params.callId);
        setRemoteName(params.remoteName || 'User');
        setRemoteImage(params.remoteImage);
        setCallMode('outgoing');
        setIsMinimized(false);
        startRing();
        if (IS_IOS) {
            try { RNCallKeep.startCall(params.callId, params.remoteName || 'User', params.remoteName, 'generic', false); } catch {}
        }
        await joinChannel(params.agoraToken, params.channelName, params.appId);
    }, [joinChannel, startRing]);

    const startIncomingCall = useCallback((params: IncomingCallParams) => {
        endedRef.current = false;
        callIdRef.current = params.callId;
        callUUIDRef.current = params.callId;
        isOutgoingRef.current = false;
        setCallId(params.callId);
        setRemoteName(params.remoteName || 'User');
        setRemoteImage(params.remoteImage);
        setCallMode('incoming');
        setIsMinimized(false);
        startRing();
        // A VoIP push already reported this to CallKit before we got here
        // (Apple requires that to happen synchronously on receipt) — don't
        // double-report it.
        if (IS_IOS && !params.fromVoipPush) {
            try { RNCallKeep.displayIncomingCall(params.callId, params.remoteName || 'User', params.remoteName, 'generic', false); } catch {}
        }
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

    const declineCallFn = useCallback(async (reportToCallKeep = true) => {
        if (endedRef.current) return;
        endedRef.current = true;
        stopRing();
        const id = callIdRef.current;
        const uuid = callUUIDRef.current;
        if (id) await clearIncomingCallNotification(id).catch(() => {});
        if (tokenRef.current && id) await apiDeclineCall(tokenRef.current, id).catch(() => {});
        if (IS_IOS && reportToCallKeep && uuid) {
            try { RNCallKeep.endCall(uuid); } catch {}
        }
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
        setIsMuted(prev => {
            const next = !prev;
            engineRef.current?.muteLocalAudioStream(next);
            if (IS_IOS && callUUIDRef.current) {
                try { RNCallKeep.setMutedCall(callUUIDRef.current, next); } catch {}
            }
            return next;
        });
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

    // Refs so the CallKeep/VoIP-push listeners (registered once, empty dep
    // array) always call the CURRENT version of these — same reasoning as
    // tokenRef above.
    const acceptCallRef = useRef(acceptCallFn);
    acceptCallRef.current = acceptCallFn;
    const declineCallRef = useRef(declineCallFn);
    declineCallRef.current = declineCallFn;
    const endCallRef = useRef(endCall);
    endCallRef.current = endCall;
    const startIncomingCallRef = useRef(startIncomingCall);
    startIncomingCallRef.current = startIncomingCall;
    const callModeRef = useRef(callMode);
    callModeRef.current = callMode;

    // ── CallKit setup (iOS) — native call UI, works from the lock screen and
    // is what makes a call reliably ring even when the app is backgrounded or
    // killed. Registered once at the root regardless of whether a call is in
    // progress, same as a real phone's call-handling service. iOS only —
    // Android keeps using the existing notifee full-screen-intent ringing
    // flow (see class comment above), so setup() must not run there, or its
    // account-permission alert prompts on every single app launch.
    useEffect(() => {
        if (!IS_IOS) return;

        RNCallKeep.setup({
            ios: {
                appName: 'DigiTag',
                supportsVideo: false,
                includesCallsInRecents: false,
            },
        }).catch((err: any) => console.error('[CallKeep] setup failed', err));

        const onAnswer = RNCallKeep.addEventListener('answerCall', () => {
            acceptCallRef.current();
        });
        const onEnd = RNCallKeep.addEventListener('endCall', () => {
            // CallKit already knows the call ended (user hung up from the
            // native UI/lock screen) — don't report back to it.
            if (callModeRef.current === 'incoming') declineCallRef.current(false);
            else endCallRef.current(false);
        });
        const onMute = RNCallKeep.addEventListener('didPerformSetMutedCallAction', ({ muted }) => {
            setIsMuted(muted);
        });

        return () => {
            onAnswer.remove();
            onEnd.remove();
            onMute.remove();
        };
    }, []);

    // ── VoIP push registration (iOS only) — lets an incoming call wake the
    // app and ring even when it's fully backgrounded or killed, which a
    // regular FCM push can't guarantee on iOS.
    useEffect(() => {
        if (!IS_IOS || !token) return;

        RNVoipPushNotification.addEventListener('register', (voipToken: string) => {
            apiRegisterVoipToken(token, voipToken).catch(() => {});
        });

        RNVoipPushNotification.addEventListener('notification', (payload: any) => {
            const data = payload?.data ?? payload;
            const callIdFromPush = data?.callId;
            const callerName = data?.callerName;
            const uuid = payload?.uuid || callIdFromPush;
            if (!callIdFromPush || !uuid) return;

            // Apple requires reportNewIncomingCall (via displayIncomingCall)
            // synchronously on every VoIP push, or the app risks being cut
            // off from future ones — do this before anything else.
            try {
                RNCallKeep.displayIncomingCall(uuid, callerName || 'User', callerName, 'generic', false);
            } catch {}
            startIncomingCallRef.current({ callId: callIdFromPush, remoteName: callerName, fromVoipPush: true });
            RNVoipPushNotification.onVoipNotificationCompleted(uuid);
        });

        RNVoipPushNotification.registerVoipToken();

        return () => {
            RNVoipPushNotification.removeEventListener('register');
            RNVoipPushNotification.removeEventListener('notification');
        };
    }, [token]);

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
