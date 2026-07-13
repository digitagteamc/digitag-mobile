import notifee, { AndroidImportance, AndroidVisibility } from '@notifee/react-native';
import { Platform } from 'react-native';

// Separate from the call channel (services/callNotification.ts) — calls need
// max-priority full-screen/ringtone behavior; everything else (messages,
// collab requests, new posts) is a normal banner.
const GENERAL_CHANNEL_ID = 'general-v1';

async function ensureGeneralChannel() {
    if (Platform.OS !== 'android') return;
    await notifee.createChannel({
        id: GENERAL_CHANNEL_ID,
        name: 'Activity',
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
    });
}

/** Shows a local banner for a push that arrived while the app is in the
 *  foreground — FCM only auto-displays `notification`-type pushes when the
 *  app is backgrounded/killed, so foreground delivery needs this to be
 *  visible at all. */
export async function displayGeneralNotification(params: {
    title: string;
    body: string;
    data?: Record<string, string>;
}) {
    await ensureGeneralChannel();
    await notifee.displayNotification({
        title: params.title,
        body: params.body,
        data: params.data,
        android: {
            channelId: GENERAL_CHANNEL_ID,
            importance: AndroidImportance.HIGH,
            pressAction: { id: 'default', launchActivity: 'default' },
        },
        ios: {
            sound: 'default',
        },
    });
}
