import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ProfileGateProvider } from '@/context/ProfileGateContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';
import {
    Poppins_200ExtraLight,
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    useFonts
} from '@expo-google-fonts/poppins';
import messaging, { onMessage, getToken } from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';
import { Stack, usePathname, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef } from 'react';
import { AppState, Image, Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearIncomingCallNotification } from '../services/callNotification';
import { routeNotificationData } from '../services/notificationRouting';
import { declineCall, registerFcmToken } from '../services/userService';

const PENDING_CALL_KEY = '@pending_incoming_call';

// Guards against double-navigation when AppState and onForegroundEvent both fire
// for the same tap (backgrounded body-tap case). JS is single-threaded so the
// synchronous set inside pushToCall wins the race.
let _callNavGuard = false;

SplashScreen.preventAutoHideAsync();

function NotificationHandler() {
    const router = useRouter();
    const { token } = useAuth();
    // Ref, not the value: the FCM listeners below live across renders, and a
    // captured pathname would go stale inside their closures.
    const pathname = usePathname();
    const pathnameRef = useRef(pathname);
    pathnameRef.current = pathname;

    // Single navigation entry point. Guard prevents double-navigation when
    // AppState and onForegroundEvent both fire for the same user tap.
    const pushToCall = useCallback((callId: string, callerName?: string) => {
        if (_callNavGuard) return;
        _callNavGuard = true;
        clearIncomingCallNotification(callId).catch(() => {});
        AsyncStorage.removeItem(PENDING_CALL_KEY).catch(() => {});
        router.push({
            pathname: '/call',
            params: { mode: 'incoming', callId, remoteName: callerName },
        } as any);
        // Reset after 5s so the next call works
        setTimeout(() => { _callNavGuard = false; }, 5000);
    }, [router]);

    // ── A. AppState listener — fires when app returns to foreground from background.
    //       Handles: Accept button tapped while backgrounded (onBackgroundEvent runs
    //       but nobody navigates until the app foregrounds and reads PENDING_CALL_KEY).
    useEffect(() => {
        const sub = AppState.addEventListener('change', async (nextState) => {
            if (nextState !== 'active') return;
            const stored = await AsyncStorage.getItem(PENDING_CALL_KEY);
            if (!stored) return;
            try {
                const parsed = JSON.parse(stored);
                if (parsed?.callId) pushToCall(parsed.callId, parsed.callerName);
            } catch {}
        });
        return () => sub.remove();
    }, [pushToCall]);

    // ── 1. FCM token registration + foreground message handler
    useEffect(() => {
        if (!token) return;
        notifee.requestPermission().catch(() => { });
        const msgInstance = messaging();
        getToken(msgInstance).then(fcmToken => {
            if (fcmToken) registerFcmToken(token, fcmToken, Platform.OS);
        }).catch(() => { });

        const unsubscribe = onMessage(msgInstance, remoteMessage => {
            const data = remoteMessage.data as Record<string, string> | undefined;
            if (!data) return;
            if (data.type === 'INCOMING_CALL' || data.type === 'CALL_ENDED' || data.type === 'CALL_DECLINED') {
                routeNotificationData(router, data, pathnameRef.current);
            }
        });

        return unsubscribe;
    }, [token]);

    // ── 2. Background FCM tap (app was backgrounded, not killed — non-call types)
    useEffect(() => {
        const unsubFcm = messaging().onNotificationOpenedApp(remoteMessage => {
            routeNotificationData(router, remoteMessage.data as Record<string, string> | undefined, pathnameRef.current);
        });
        return () => unsubFcm();
    }, []);

    // Killed-state (cold start) taps are handled by app/index.tsx, NOT here:
    // navigating from this component on mount raced the intro screen — the push
    // either fired before the navigator was ready (and was silently swallowed)
    // or got stomped 4s later when the intro's timer replaced the route with
    // /(tabs). The intro reads getInitialNotification/PENDING_CALL_KEY itself
    // and routes at the right moment instead.

    // ── 3. Notifee foreground events (body tap or action button while app is active/foregrounded)
    useEffect(() => {
        const handlePress = async (data: any, actionId?: string) => {
            const callId = data?.callId as string | undefined;
            if (!callId) return;
            if (actionId === 'decline') {
                clearIncomingCallNotification(callId).catch(() => {});
                AsyncStorage.removeItem(PENDING_CALL_KEY).catch(() => {});
                if (token) await declineCall(token, callId);
                return;
            }
            // Body tap or Answer: pushToCall handles guard + cleanup
            pushToCall(callId, data?.callerName);
        };

        const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
            if (type === EventType.PRESS) {
                handlePress(detail.notification?.data, 'default');
            } else if (type === EventType.ACTION_PRESS) {
                handlePress(detail.notification?.data, detail.pressAction?.id);
            }
        });

        return () => unsubscribe();
    }, [token, pushToCall]);

    return null;
}

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60 * 1000,
            gcTime: 5 * 60 * 1000,
            retry: 2,
            refetchOnWindowFocus: false,
        },
    },
});

export default function RootLayout() {
    const [loaded, error] = useFonts({
        Poppins_200ExtraLight,
        Poppins_300Light,
        Poppins_400Regular,
        Poppins_500Medium,
        Poppins_600SemiBold,
        Poppins_700Bold,
        Poppins_800ExtraBold,
        Inter_400Regular,
        Inter_500Medium,
    });

    useEffect(() => {
        SplashScreen.hideAsync().catch(() => {});
    }, []);

    if (!loaded && !error) {
        return (
            <View style={{ flex: 1, backgroundColor: '#060606', alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 130, height: 130, borderRadius: 32, backgroundColor: '#020202' }} />
            </View>
        );
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    <ProfileGateProvider>
                        <NotificationHandler />
                        <Stack
                            screenOptions={{
                                headerShown: false,
                                animation: 'slide_from_right',
                                animationDuration: 250,
                                contentStyle: { backgroundColor: '#060606' }
                            }}
                            initialRouteName="index"
                        >
                            <Stack.Screen name="index" />
                            <Stack.Screen name="onboarding/splash1" options={{ animation: 'fade', animationDuration: 200 }} />
                            <Stack.Screen name="login" options={{ animation: 'fade', animationDuration: 280 }} />
                            <Stack.Screen name="(tabs)" options={{ animation: 'fade', animationDuration: 200, contentStyle: { backgroundColor: '#060606' } }} />
                            <Stack.Screen name="signup" options={{ animationDuration: 280 }} />
                            <Stack.Screen name="role-selection" options={{ animation: 'fade', animationDuration: 200 }} />
                            <Stack.Screen name="coming-soon" />
                            <Stack.Screen name="creator-details" />
                            <Stack.Screen name="settings" options={{ animation: 'slide_from_right', contentStyle: { backgroundColor: '#060606' } }} />
                            <Stack.Screen name="notifications" />
                            <Stack.Screen name="chat/[id]" options={{ animation: 'slide_from_right', animationDuration: 220 }} />
                            <Stack.Screen name="switch-role" />
                            <Stack.Screen name="call" options={{ animation: 'fade', gestureEnabled: false }} />
                            <Stack.Screen name="post-detail" options={{ animation: 'slide_from_right' }} />
                            <Stack.Screen name="create-post" options={{ animation: 'slide_from_right' }} />
                            <Stack.Screen name="my-posts" options={{ animation: 'slide_from_right' }} />
                            <Stack.Screen name="my-collabs" options={{ animation: 'slide_from_right' }} />
                            <Stack.Screen name="saved-posts" options={{ animation: 'slide_from_right' }} />
                            <Stack.Screen name="help-support" options={{ animation: 'slide_from_right' }} />
                            <Stack.Screen name="about-digitag" options={{ animation: 'slide_from_right' }} />
                            <Stack.Screen name="report-issue" options={{ animation: 'slide_from_right' }} />
                            <Stack.Screen name="privacysettings" options={{ animation: 'slide_from_right' }} />
                            <Stack.Screen name="analytics" options={{ animation: 'slide_from_right' }} />
                            <Stack.Screen name="brand-coming-soon" options={{ animation: 'slide_from_right' }} />
                            <Stack.Screen name="agency-coming-soon" options={{ animation: 'slide_from_right' }} />
                            <Stack.Screen name="followers" options={{ animation: 'slide_from_right' }} />
                            <Stack.Screen name="following" options={{ animation: 'slide_from_right' }} />
                            <Stack.Screen name="blocked-users" options={{ animation: 'slide_from_right' }} />
                            <Stack.Screen name="suggestions" options={{ animation: 'slide_from_right' }} />
                            <Stack.Screen name="searchbar" options={{ animation: 'slide_from_right' }} />
                            <Stack.Screen name="profile/[tagId]" options={{ animation: 'fade', animationDuration: 200 }} />
                            <Stack.Screen name="post/[postId]" options={{ animation: 'fade', animationDuration: 200 }} />
                        </Stack>
                    </ProfileGateProvider>
                </AuthProvider>
                </QueryClientProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
