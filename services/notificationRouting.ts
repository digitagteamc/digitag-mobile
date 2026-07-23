import type { useRouter } from 'expo-router';
import { clearIncomingCallNotification } from './callNotification';

/**
 * Single source of truth for "a notification with this data was tapped —
 * where does the app go?". Used by _layout.tsx for warm-state taps and by
 * the intro screen (app/index.tsx) for cold-start taps, so killed-app opens
 * land on the same screens as backgrounded ones.
 */
export function routeNotificationData(router: ReturnType<typeof useRouter>, data: Record<string, string> | undefined, currentPath?: string) {
    if (!data?.type) return;
    switch (data.type) {
        case 'INCOMING_CALL':
            router.push({
                pathname: '/call',
                params: { mode: 'incoming', callId: data.callId, remoteName: data.callerName },
            } as any);
            break;
        case 'CALL_ENDED':
        case 'CALL_DECLINED':
            if (data.callId) clearIncomingCallNotification(data.callId);
            // Only dismiss a screen when the user is actually on the ringing call
            // screen — otherwise this push would yank them back from whatever
            // screen they're using (e.g. mid-chat) when a missed call ends.
            if (currentPath === '/call') {
                try {
                    if (router.canGoBack()) router.back();
                    else router.replace('/(tabs)' as any);
                } catch { }
            }
            break;
        case 'NEW_MESSAGE':
        case 'MESSAGE_REACTION':
            if (data.conversationId) {
                router.push({ pathname: '/chat/[id]', params: { id: data.conversationId } } as any);
            }
            break;
        case 'COLLAB_REQUEST':
            // A new request that landed in MY incoming list.
            router.push('/notifications' as any);
            break;
        case 'COLLAB_ACCEPTED':
        case 'COLLAB_COMPLETED':
            // This push goes to the person who SENT the request — /notifications only
            // shows requests sent TO me, which would be empty/irrelevant here. My Collabs
            // shows the status of requests I sent (and completed ones), so that's the
            // useful destination.
            router.push('/my-collabs' as any);
            break;
        case 'COLLAB_DECLINED':
            // Declined collabs live under My Collabs' Rejected tab — land there directly.
            router.push({ pathname: '/my-collabs', params: { tab: 'rejected' } } as any);
            break;
        case 'NEW_POST':
            if (data.postId) {
                router.push({ pathname: '/post-detail', params: { postId: data.postId } } as any);
            } else {
                router.push('/(tabs)/explore' as any);
            }
            break;
        case 'NEW_FOLLOWER':
            if (data.followerId) {
                router.push({ pathname: '/creator-details', params: { userId: data.followerId } } as any);
            }
            break;
        default:
            break;
    }
}
