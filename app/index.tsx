import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, View } from 'react-native';

const GIF_DURATION_MS = 5000; // matches the 5s MP4 source

export default function Index() {
    const { isLoading, token, isGuest, hasOnboarded } = useAuth();
    const router = useRouter();
    const [gifDone, setGifDone] = useState(false);

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
