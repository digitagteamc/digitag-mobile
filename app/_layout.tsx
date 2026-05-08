import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { registerFcmToken } from '../services/userService';
import '../global.css';

SplashScreen.preventAutoHideAsync();

function NotificationHandler() {
    const router = useRouter();
    const { token } = useAuth();

    useEffect(() => {
        // Register FCM token with backend when logged in
        if (!token) return;
        messaging().getToken().then(fcmToken => {
            if (fcmToken) registerFcmToken(token, fcmToken);
        }).catch(() => {});

        // Foreground messages
        const unsubscribe = messaging().onMessage(async remoteMessage => {
            const data = remoteMessage.data as Record<string, string> | undefined;
            if (data?.type === 'INCOMING_CALL') {
                router.push({
                    pathname: '/call',
                    params: {
                        mode: 'incoming',
                        callId: data.callId,
                        remoteName: data.callerName,
                    },
                });
            } else if (data?.type === 'CALL_ENDED' || data?.type === 'CALL_DECLINED') {
                router.back();
            }
        });

        return unsubscribe;
    }, [token]);

    // Handle notification tap when app was in background
    useEffect(() => {
        messaging().onNotificationOpenedApp(remoteMessage => {
            const data = remoteMessage.data as Record<string, string> | undefined;
            if (data?.type === 'INCOMING_CALL') {
                router.push({
                    pathname: '/call',
                    params: {
                        mode: 'incoming',
                        callId: data.callId,
                        remoteName: data.callerName,
                    },
                });
            }
        });

        // App opened from quit state via notification
        messaging().getInitialNotification().then(remoteMessage => {
            if (!remoteMessage) return;
            const data = remoteMessage.data as Record<string, string> | undefined;
            if (data?.type === 'INCOMING_CALL') {
                router.push({
                    pathname: '/call',
                    params: {
                        mode: 'incoming',
                        callId: data.callId,
                        remoteName: data.callerName,
                    },
                });
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
            </AuthProvider>
        </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}