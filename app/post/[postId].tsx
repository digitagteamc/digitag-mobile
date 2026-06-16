import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

// Deep link handler: digitag://post/[postId] or https://thedigitag.ai/post/[postId]
// Redirects to post-detail which handles auth gating itself.
export default function PostDeepLink() {
    const { postId } = useLocalSearchParams<{ postId: string }>();
    const router = useRouter();

    useEffect(() => {
        if (!postId) {
            router.replace('/(tabs)' as any);
            return;
        }
        router.replace({
            pathname: '/post-detail',
            params: { postId },
        } as any);
    }, [postId]);

    return (
        <View style={{ flex: 1, backgroundColor: '#060606', alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color="#ED2A91" size="large" />
        </View>
    );
}
