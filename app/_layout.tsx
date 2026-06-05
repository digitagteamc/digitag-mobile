import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ProfileGateProvider } from '@/context/ProfileGateContext';
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
import messaging from '@react-native-firebase/messaging';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';
import { registerFcmToken } from '../services/userService';

SplashScreen.preventAutoHideAsync();

function routeNotification(router: ReturnType<typeof useRouter>, data: Record<string, string> | undefined) {
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
            try { router.back(); } catch { }
            break;
        case 'NEW_MESSAGE':
            if (data.conversationId) {
                router.push({ pathname: '/chat/[id]', params: { id: data.conversationId } } as any);
            }
            break;
        case 'COLLAB_REQUEST':
        case 'COLLAB_ACCEPTED':
        case 'COLLAB_DECLINED':
            router.push('/notifications' as any);
            break;
        case 'NEW_POST':
            router.push('/(tabs)/explore' as any);
            break;
        default:
            break;
    }
}

function NotificationHandler() {
    const router = useRouter();
    const { token } = useAuth();

    useEffect(() => {
        if (!token) return;
        messaging().getToken().then(fcmToken => {
            if (fcmToken) registerFcmToken(token, fcmToken);
        }).catch(() => { });

        // Foreground messages — silent data-only for calls, show banner for rest
        const unsubscribe = messaging().onMessage(async remoteMessage => {
            const data = remoteMessage.data as Record<string, string> | undefined;
            if (!data) return;
            // Calls need immediate full-screen routing, not a banner
            if (data.type === 'INCOMING_CALL' || data.type === 'CALL_ENDED' || data.type === 'CALL_DECLINED') {
                routeNotification(router, data);
            }
            // Other types: the FCM notification payload already shows a system banner
            // when the app is in foreground on Android with high-priority data messages.
        });

        return unsubscribe;
    }, [token]);

    // Background / quit-state notification taps
    useEffect(() => {
        messaging().onNotificationOpenedApp(remoteMessage => {
            routeNotification(router, remoteMessage.data as Record<string, string> | undefined);
        });

        messaging().getInitialNotification().then(remoteMessage => {
            if (remoteMessage) {
                routeNotification(router, remoteMessage.data as Record<string, string> | undefined);
            }
        });
    }, []);

    return null;
}

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
        if (loaded || error) {
            SplashScreen.hideAsync();
        }
    }, [loaded, error]);

    if (!loaded && !error) {
        return null;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
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
                            <Stack.Screen name="login" options={{ animationDuration: 250 }} />
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
                        </Stack>
                    </ProfileGateProvider>
                </AuthProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}