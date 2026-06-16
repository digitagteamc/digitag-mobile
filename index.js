// Registered before the app entry so Android can run this in a headless JS
// context when the app is killed — this is what makes incoming calls ring
// even when DigiTag isn't open.
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';
import { clearIncomingCallNotification, displayIncomingCallNotification } from './services/callNotification';

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || '').trim().replace(/\/+$/, '');

// Key used to pass call data from background handler → app on open
const PENDING_CALL_KEY = '@pending_incoming_call';

async function declineCallHeadless(callId) {
    try {
        const token = await AsyncStorage.getItem('@auth_token');
        if (!token || !callId) return;
        await fetch(`${API_BASE_URL}/calls/${callId}/decline`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        });
    } catch { /* best-effort */ }
}

messaging().setBackgroundMessageHandler(async remoteMessage => {
    const data = remoteMessage.data;
    if (data?.type === 'INCOMING_CALL') {
        // Store call data so _layout.tsx can navigate even if getInitialNotification fails
        await AsyncStorage.setItem(PENDING_CALL_KEY, JSON.stringify({
            callId: String(data.callId || ''),
            callerName: data.callerName ? String(data.callerName) : 'User',
        }));
        await displayIncomingCallNotification({
            callId: String(data.callId || ''),
            callerName: data.callerName ? String(data.callerName) : undefined,
            callerId: data.callerId ? String(data.callerId) : undefined,
        });
    } else if (data?.type === 'CALL_ENDED' || data?.type === 'CALL_DECLINED') {
        if (data.callId) {
            await clearIncomingCallNotification(String(data.callId));
            await AsyncStorage.removeItem(PENDING_CALL_KEY);
        }
    }
});

// Handles notification button taps (Answer/Decline) while app is backgrounded/killed.
notifee.onBackgroundEvent(async ({ type, detail }) => {
    const callId = detail.notification?.data?.callId;
    if (type !== EventType.ACTION_PRESS) return;

    if (detail.pressAction?.id === 'decline') {
        if (callId) {
            await clearIncomingCallNotification(String(callId));
            await AsyncStorage.removeItem(PENDING_CALL_KEY);
            await declineCallHeadless(String(callId));
        }
    } else if (detail.pressAction?.id === 'answer') {
        if (callId) await clearIncomingCallNotification(String(callId));
        // PENDING_CALL_KEY stays set — _layout.tsx reads it and routes to /call
    }
});

require('expo-router/entry');
