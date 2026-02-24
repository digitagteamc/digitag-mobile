import { AuthProvider } from '@/context/AuthContext';
import { Stack } from 'expo-router';

export default function RootLayout() {
    return (
        <AuthProvider>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="login" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="signup" />
                <Stack.Screen name="role-selection" />
                <Stack.Screen name="creator-details" />
            </Stack>
        </AuthProvider>
    );
}
