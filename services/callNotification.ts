import notifee, {
    AndroidCategory,
    AndroidImportance,
    AndroidVisibility,
    EventType,
} from '@notifee/react-native';
import { Platform } from 'react-native';

// v5 — 60-second ringtone file so the channel plays long enough while app is killed
const CALL_CHANNEL_ID = 'incoming-calls-v5';

export async function ensureCallChannel() {
    if (Platform.OS !== 'android') return;
    // createChannel is idempotent — safe to call every time, no caching needed
    await notifee.createChannel({
        id: CALL_CHANNEL_ID,
        name: 'Incoming Calls',
        importance: AndroidImportance.HIGH,
        sound: 'ringtone',          // file: android/app/src/main/res/raw/ringtone.mp3
        visibility: AndroidVisibility.PUBLIC,
        vibration: true,
        vibrationPattern: [300, 500, 300, 500],  // all positive — no zeros
    });
}

export async function displayIncomingCallNotification(data: {
    callId: string;
    callerName?: string;
    callerId?: string;
}) {
    await ensureCallChannel();

    await notifee.displayNotification({
        id: `call-${data.callId}`,
        title: `📞 ${data.callerName || 'Someone'} is calling`,
        body: 'DigiTag · Tap to answer',
        data: { type: 'INCOMING_CALL', ...data },
        android: {
            channelId: CALL_CHANNEL_ID,
            category: AndroidCategory.CALL,
            importance: AndroidImportance.HIGH,
            visibility: AndroidVisibility.PUBLIC,
            ongoing: true,
            autoCancel: false,
            // Wake screen and show full-screen calling UI even when device is locked
            fullScreenAction: {
                id: 'default',
                launchActivity: 'default',
            },
            pressAction: {
                id: 'default',
                launchActivity: 'default',
            },
            actions: [
                {
                    title: '🔴 Decline',
                    pressAction: { id: 'decline' },
                },
                {
                    title: '🟢 Answer',
                    pressAction: { id: 'answer', launchActivity: 'default' },
                },
            ],
        },
    });
}

export async function clearIncomingCallNotification(callId: string) {
    try {
        await notifee.cancelNotification(`call-${callId}`);
    } catch { /* ignore */ }
    // Nuclear fallback: cancel every displayed notification that belongs to a call channel
    // so the ringtone always stops even if the callId doesn't match exactly.
    try {
        const displayed = await notifee.getDisplayedNotifications();
        await Promise.all(
            displayed
                .filter(n => n.notification?.android?.channelId === CALL_CHANNEL_ID)
                .map(n => notifee.cancelNotification(n.id!).catch(() => {}))
        );
    } catch { /* ignore */ }
}

export { EventType };
