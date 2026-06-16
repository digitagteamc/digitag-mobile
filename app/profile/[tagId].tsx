import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { searchProfiles } from '../../services/userService';

// Deep link handler: digitag://profile/[tagId] or https://thedigitag.ai/profile/[tagId]
// Resolves the tagId (public handle) to a userId then opens creator-details.
export default function ProfileDeepLink() {
    const { tagId } = useLocalSearchParams<{ tagId: string }>();
    const { token, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        if (!token) {
            router.replace('/login' as any);
            return;
        }

        if (!tagId) {
            router.replace('/(tabs)' as any);
            return;
        }

        searchProfiles(token, tagId as string, 20)
            .then(res => {
                const handle = (tagId as string).toLowerCase();
                const exact = res.data?.find(
                    (u: any) => (u.tagId ?? '').toLowerCase() === handle
                ) ?? res.data?.[0];

                if (exact?.id) {
                    router.replace({
                        pathname: '/creator-details',
                        params: { userId: exact.id },
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
