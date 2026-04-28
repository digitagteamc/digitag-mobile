import { AuthProvider } from '@/context/AuthContext';
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
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';

SplashScreen.preventAutoHideAsync();

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
        <SafeAreaProvider>
            <AuthProvider>
                <Stack
                    screenOptions={{
                        headerShown: false,
                        animation: 'slide_from_right',
                        contentStyle: { backgroundColor: '#060606' }
                    }}
                    initialRouteName="index"
                >
                    <Stack.Screen name="index" />
                    <Stack.Screen name="login" />
                    <Stack.Screen name="(tabs)" options={{ contentStyle: { backgroundColor: '#060606' } }} />
                    <Stack.Screen name="signup" />
                    <Stack.Screen name="role-selection" />
                    <Stack.Screen name="creator-details" />
                    <Stack.Screen name="settings" options={{ animation: 'slide_from_right', contentStyle: { backgroundColor: '#060606' } }} />
                    <Stack.Screen name="notifications" />
                    <Stack.Screen name="chat/[id]" />
                    <Stack.Screen name="switch-role" />
                </Stack>
            </AuthProvider>
        </SafeAreaProvider>
    );
}