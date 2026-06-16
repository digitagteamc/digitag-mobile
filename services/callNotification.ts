import notifee, {
    AndroidCategory,
    AndroidImportance,
    AndroidVisibility,
    EventType,
} from '@notifee/react-native';
import { Platform } from 'react-native';

const CALL_CHANNEL_ID = 'incoming-calls';

let channelReady = false;

export async function ensureCallChannel() {
    if (Platform.OS !== 'android' || channelReady) return;
    await notifee.createChannel({
        id: CALL_CHANNEL_ID,
        name: 'Incoming Calls',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        visibility: AndroidVisibility.PUBLIC,
        vibration: true,
        vibrationPattern: [300, 500, 300, 500],
    });
    channelReady = true;
}

/**
 * Displays a full-screen incoming-call notification. On Android this launches
 * the app straight to the call screen even when the app is killed or the
 * device is locked — same mechanism WhatsApp/Truecaller use for ringing.
 */
export async function displayIncomingCallNotification(data: {
    callId: string;
    callerName?: string;
    callerId?: string;
}) {
    await ensureCallChannel();

    await notifee.displayNotification({
        id: `call-${data.callId}`,
        title: `${data.callerName || 'Someone'} is calling`,
        body: 'Tap to answer',
        data: { type: 'INCOMING_CALL', ...data },
        android: {
            channelId: CALL_CHANNEL_ID,
            category: AndroidCategory.CALL,
            importance: AndroidImportance.HIGH,
            visibility: AndroidVisibility.PUBLIC,
            ongoing: true,
            autoCancel: false,
            fullScreenAction: {
                id: 'default',
                launchActivity: 'default',
            },
            pressAction: {
                id: 'default',
                launchActivity: 'default',
            },
            timeoutAfter: 45000,
            actions: [
                { title: 'Decline', pressAction: { id: 'decline' } },
                { title: 'Answer', pressAction: { id: 'answer' } },
            ],
        },
    });
}

export async function clearIncomingCallNotification(callId: string) {
    try {
        await notifee.cancelNotification(`call-${callId}`);
    } catch { /* ignore */ }
}

export { EventType };
