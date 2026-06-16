// Registered before the app entry so Android can run this in a headless JS
// context when the app is killed — this is what makes incoming calls ring
// even when DigiTag isn't open.
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';
import { clearIncomingCallNotification, displayIncomingCallNotification } from './services/callNotification';

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || '').trim().replace(/\/+$/, '');

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
        await displayIncomingCallNotification({
            callId: String(data.callId || ''),
            callerName: data.callerName ? String(data.callerName) : undefined,
            callerId: data.callerId ? String(data.callerId) : undefined,
        });
    } else if (data?.type === 'CALL_ENDED' || data?.type === 'CALL_DECLINED') {
        if (data.callId) await clearIncomingCallNotification(String(data.callId));
    }
});

// Handles notification button taps (Answer/Decline) while app is backgrounded/killed.
notifee.onBackgroundEvent(async ({ type, detail }) => {
    const callId = detail.notification?.data?.callId;
    if (type === EventType.ACTION_PRESS && detail.pressAction?.id === 'decline') {
        if (callId) {
            await clearIncomingCallNotification(String(callId));
            await declineCallHeadless(String(callId));
        }
    }
    // 'answer' and default press both use launchActivity, which already
    // brings the app to the foreground — routing happens once JS boots.
});

require('expo-router/entry');
