import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BG, BRAND, Card, EmptyState, ErrorState, Loading, Pill, ScreenHeader, timeAgo } from '../../Components/brand/ui';
import { useAuth } from '../../context/AuthContext';
import { listMyRequirements } from '../../services/brandService';
import { updatePostStatus } from '../../services/userService';
import { fonts, palette } from '../../theme/colors';

const STATUS_COLOR: Record<string, string> = { OPEN: '#22C55E', COMPLETED: '#60A5FA', CLOSED: '#8A8A99' };

/** The brand's requirement posts with applicant counts. Tap a post to review
 *  the creators/freelancers who sent a collab request on it. */
export default function BrandMyPostsScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!token) return;
        const res = await listMyRequirements(token);
        if (res.success) { setItems(res.data.items); setError(null); } else setError(res.error);
        setLoading(false);
    }, [token]);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    const changeStatus = (post: any) => {
        const options = (['OPEN', 'COMPLETED', 'CLOSED'] as const).filter((s) => s !== post.status);
        const label = { OPEN: 'Reopen', COMPLETED: 'Mark as filled', CLOSED: 'Close (hide)' };
        Alert.alert('Update post', post.title || 'Requirement', [
            ...options.map((s) => ({
                text: label[s],
                onPress: async () => {
                    const res = await updatePostStatus(token!, post.id, s);
                    if (res.success) setItems((prev) => prev.map((p) => (p.id === post.id ? { ...p, status: s } : p)));
                    else Alert.alert('Could not update', res.error || 'Try again.');
                },
            })),
            { text: 'Cancel', style: 'cancel' as const },
        ]);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={['top', 'bottom']}>
            <ScreenHeader
                title="My Posts"
                subtitle="Requirements & applicants"
                right={
                    <TouchableOpacity onPress={() => router.push('/brand/create-requirement' as any)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: BRAND.primary, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="add" size={22} color="#fff" />
                    </TouchableOpacity>
                }
            />
            {loading ? <Loading /> : error && !items.length ? <ErrorState message={error} onRetry={load} /> : (
                <FlatList
                    data={items}
                    keyExtractor={(p) => p.id}
                    contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={BRAND.primary} />}
                    ListEmptyComponent={
                        <EmptyState
                            icon="megaphone-outline"
                            title="No requirements posted"
                            message="Post what you need — creators (and freelancers, if you choose) will send collab requests."
                            action="Post a requirement"
                            onAction={() => router.push('/brand/create-requirement' as any)}
                        />
                    }
                    renderItem={({ item }) => {
                        const a = item.applicants || {};
                        return (
                            <Card
                                style={{ marginBottom: 12 }}
                                onPress={() => router.push({ pathname: '/brand/applicants/[postId]', params: { postId: item.id, title: item.title || '' } } as any)}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: '#fff', fontSize: 15, fontFamily: fonts.semibold }}>{item.title || item.description?.slice(0, 60)}</Text>
                                        <Text numberOfLines={2} style={{ color: palette.textMuted, fontSize: 12, fontFamily: fonts.regular, marginTop: 3, lineHeight: 17 }}>{item.description}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => changeStatus(item)} hitSlop={10} style={{ marginLeft: 8 }}>
                                        <Ionicons name="ellipsis-vertical" size={18} color={palette.textMuted} />
                                    </TouchableOpacity>
                                </View>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 10, gap: 6 }}>
                                    <Pill label={item.status === 'COMPLETED' ? 'Filled' : item.status === 'CLOSED' ? 'Closed' : 'Open'} color={STATUS_COLOR[item.status] || '#8A8A99'} />
                                    <Pill label={(item.targetRoles || []).includes('FREELANCER') ? 'Creators + Freelancers' : 'Creators'} color={BRAND.primary} />
                                    {!!item.budget && <Pill label={item.budget} color="#F59E0B" />}
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }}>
                                    <Ionicons name="people-outline" size={15} color={BRAND.light} />
                                    <Text style={{ color: '#fff', fontSize: 13, fontFamily: fonts.semibold, marginLeft: 6 }}>{a.total || 0} applicant{a.total === 1 ? '' : 's'}</Text>
                                    {!!a.PENDING && (
                                        <View style={{ marginLeft: 8, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: '#ED2A91' }}>
                                            <Text style={{ color: '#fff', fontSize: 11, fontFamily: fonts.semibold }}>{a.PENDING} new</Text>
                                        </View>
                                    )}
                                    <Text style={{ color: palette.textSubtle, fontSize: 11, fontFamily: fonts.regular, marginLeft: 'auto' }}>{timeAgo(item.createdAt)}</Text>
                                </View>
                            </Card>
                        );
                    }}
                />
            )}
        </SafeAreaView>
    );
}
