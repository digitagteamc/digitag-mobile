import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee from '@notifee/react-native';

const GIF_DURATION_MS = 5000;
const PENDING_CALL_KEY = '@pending_incoming_call';

export default function Index() {
    const { isLoading, token, isGuest, hasOnboarded } = useAuth();
    const router = useRouter();
    const [gifDone, setGifDone] = useState(false);

    // Check for a pending incoming call immediately on mount.
    // If found, skip the GIF and go straight to the call screen.
    useEffect(() => {
        const checkPendingCall = async () => {
            // Primary: AsyncStorage written by background FCM handler
            const stored = await AsyncStorage.getItem(PENDING_CALL_KEY);
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    if (parsed?.callId) {
                        await AsyncStorage.removeItem(PENDING_CALL_KEY);
                        router.replace({
                            pathname: '/call',
                            params: { mode: 'incoming', callId: parsed.callId, remoteName: parsed.callerName },
                        } as any);
                        return;
                    }
                } catch {}
            }
            // Fallback: notifee initial notification (covers edge cases)
            const initial = await notifee.getInitialNotification();
            const data = initial?.notification?.data as Record<string, string> | undefined;
            if (data?.type === 'INCOMING_CALL' && data.callId) {
                router.replace({
                    pathname: '/call',
                    params: { mode: 'incoming', callId: data.callId, remoteName: data.callerName },
                } as any);
            }
        };
        checkPendingCall();
    }, []);

    // Mark GIF complete after one full play-through
    useEffect(() => {
        const timer = setTimeout(() => setGifDone(true), GIF_DURATION_MS);
        return () => clearTimeout(timer);
    }, []);

    // Navigate only when both GIF is done AND session is restored
    useEffect(() => {
        if (!gifDone || isLoading) return;
        if (token || isGuest) {
            router.replace('/(tabs)');
        } else if (hasOnboarded) {
            router.replace('/role-selection');
        } else {
            router.replace('/onboarding/splash1');
        }
    }, [gifDone, isLoading]);

    return (
        <View style={{ flex: 1, backgroundColor: '#060606', alignItems: 'center', justifyContent: 'center' }}>
            <Image
                source={require('../assets/videos/digitag-intro.gif')}
                style={{ width: 210, height: 210 }}
                resizeMode="contain"
            />
        </View>
    );
}
