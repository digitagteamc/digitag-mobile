import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getUserIdByTag } from '../../services/userService';

// Deep link handler: digitag://profile/[tagId] or https://thedigitag.ai/profile/[tagId]
// Resolves the tagId (public handle) to a userId then opens creator-details.
export default function ProfileDeepLink() {
    const { tagId } = useLocalSearchParams<{ tagId: string }>();
    const { token, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        // Resolving a shared profile link is browsing, not an account action —
        // works the same for a guest as for a logged-in user.
        if (!tagId) {
            router.replace('/(tabs)' as any);
            return;
        }

        getUserIdByTag(token, tagId as string)
            .then(res => {
                if (res.success && res.data?.userId) {
                    router.replace({
                        pathname: '/creator-details',
                        params: { userId: res.data.userId },
                    } as any);
                } else {
                    router.replace('/(tabs)' as any);
                }
            })
            .catch(() => router.replace('/(tabs)' as any));
    }, [token, isLoading, tagId]);

    return (
        <View style={{ flex: 1, backgroundColor: '#060606', alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color="#ED2A91" size="large" />
        </View>
    );
}
