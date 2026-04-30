import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import IconButton from '../Components/ui/IconButton';
import NotificationItem from '../Components/ui/NotificationItem';
import { useAuth } from '../context/AuthContext';
import { fonts, palette, spacing } from '../theme/colors';
import { useRoleTheme } from '../theme/useRoleTheme';
import {
    followUser,
    getFollowStatus,
    getFollowSuggestions,
    unfollowUser,
} from '../services/userService';

export default function SuggestionsScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const theme = useRoleTheme();

    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!token) {
            setErrorMsg('You need to sign in to see suggestions');
            setLoading(false);
            return;
        }
        setErrorMsg(null);
        try {
            const sugRes = await getFollowSuggestions(token, 50); // Load more for this screen
            const sugs = sugRes.success ? (sugRes.data || []) : [];
            setSuggestions(sugs);

            if (sugs.length > 0) {
                const followChecks = await Promise.all(
                    sugs.map((s: any) => getFollowStatus(token, s.id).then((r) => ({
                        id: s.id,
                        following: r.success ? Boolean(r.data?.isFollowing) : false,
                    }))),
                );
                setFollowingIds(new Set(followChecks.filter((f) => f.following).map((f) => f.id)));
            }

            if (!sugRes.success) {
                setErrorMsg('Could not load suggestions. Pull to try again.');
            }
        } catch (e) {
            setErrorMsg('Something went wrong');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { load(); }, [load]);

    const onRefresh = async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    };

    const handleToggleFollow = async (userId: string) => {
        if (!token) return;
        setBusyId(userId);
        const alreadyFollowing = followingIds.has(userId);
        try {
            const res = alreadyFollowing
                ? await unfollowUser(token, userId)
                : await followUser(token, userId);
            if (res.success) {
                setFollowingIds((prev) => {
                    const next = new Set(prev);
                    if (alreadyFollowing) next.delete(userId);
                    else next.add(userId);
                    return next;
                });
            }
        } finally {
            setBusyId(null);
        }
    };

    const handleDismissSuggestion = (userId: string) => {
        setSuggestions((prev) => prev.filter((s) => s.id !== userId));
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <IconButton onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={20} color="#fff" />
                </IconButton>
                <Text style={styles.headerTitle}>Suggested for you</Text>
                <View style={{ width: 40 }} /> 
            </View>

            {loading ? (
                <View style={styles.centerWrap}>
                    <ActivityIndicator color={theme.primary} size="large" />
                </View>
            ) : (
                <FlatList
                    data={suggestions}
                    keyExtractor={(item) => item.id}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
                    contentContainerStyle={{ paddingBottom: 40 }}
                    ListEmptyComponent={
                        !errorMsg ? (
                            <View style={styles.emptyBox}>
                                <Ionicons name="people-outline" size={40} color={palette.borderStrong} />
                                <Text style={styles.emptyText}>No suggestions right now</Text>
                            </View>
                        ) : null
                    }
                    ListHeaderComponent={
                        errorMsg ? (
                            <View style={styles.errorBanner}>
                                <Ionicons name="warning-outline" size={16} color={palette.warning} />
                                <Text style={styles.errorText}>{errorMsg}</Text>
                            </View>
                        ) : null
                    }
                    renderItem={({ item: s }) => (
                        <NotificationItem
                            key={s.id}
                            name={s.name || (s.role === 'FREELANCER' ? 'Freelancer' : 'Creator')}
                            subtitle="Suggested for you"
                            avatarUri={s.profilePicture || null}
                            role={s.role}
                            variant="suggestion"
                            busy={busyId === s.id}
                            following={followingIds.has(s.id)}
                            onToggleFollow={() => handleToggleFollow(s.id)}
                            onDismiss={() => handleDismissSuggestion(s.id)}
                            onNamePress={() => router.push({ pathname: '/creator-details', params: { userId: s.id } } as any)}
                        />
                    )}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: palette.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        gap: 10,
    },
    headerTitle: { color: palette.textPrimary, fontSize: 17, fontFamily: fonts.semibold, flex: 1, textAlign: 'center' },
    
    centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(255, 179, 0, 0.1)',
        padding: 12,
        margin: 20,
        borderRadius: 8,
    },
    errorText: { color: palette.warning, fontSize: 13, fontFamily: fonts.regular, flex: 1 },

    emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100, gap: 12 },
    emptyText: { color: palette.textMuted, fontSize: 15, fontFamily: fonts.regular },
});
