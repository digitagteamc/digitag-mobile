import { AuthProvider } from '@/context/AuthContext';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} initialRouteName="index">
                    <Stack.Screen name="index" />
                    <Stack.Screen name="login" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="signup" />
                    <Stack.Screen name="role-selection" />
                    <Stack.Screen name="creator-details" />
                </Stack>
            </AuthProvider>
        </SafeAreaProvider>
    );
}
