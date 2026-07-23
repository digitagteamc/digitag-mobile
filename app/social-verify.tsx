import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts, palette } from '../theme/colors';

/** Landing screen for the YouTube/Facebook OAuth redirect (digitag://social-verify).
 *  WebBrowser.openAuthSessionAsync is supposed to intercept this redirect inside the
 *  auth-session tab itself and never actually navigate the app here — but on some
 *  Android browsers the redirect falls through to a real deep-link open instead, which
 *  used to hit Expo Router's "Unmatched Route" screen. This gives that fallback case a
 *  real destination. The signup screen's own polling (handleSocialVerify) is what
 *  actually updates verified status; this screen is just a safe landing pad. */
export default function SocialVerifyScreen() {
    const { status } = useLocalSearchParams<{ status?: string }>();
    const verified = status === 'VERIFIED';

    useEffect(() => {
        const t = setTimeout(() => {
            if (router.canGoBack()) router.back();
            else router.replace('/');
        }, 1400);
        return () => clearTimeout(t);
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <Ionicons
                name={verified ? 'checkmark-circle' : 'close-circle'}
                size={64}
                color={verified ? palette.success : palette.danger}
            />
            <Text style={styles.title}>{verified ? 'Account verified' : 'Verification failed'}</Text>
            <Text style={styles.subtitle}>Returning to the app…</Text>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingHorizontal: 24,
    },
    title: {
        fontFamily: fonts.semibold,
        fontSize: 18,
        color: palette.textPrimary,
        textAlign: 'center',
    },
    subtitle: {
        fontFamily: fonts.regular,
        fontSize: 14,
        color: palette.textMuted,
        textAlign: 'center',
    },
});
