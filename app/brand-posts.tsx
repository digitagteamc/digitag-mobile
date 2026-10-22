import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BrandPostCard from '../Components/BrandPostCard';
import { useBrandPostActions } from '../Components/OpportunitiesSection';
import { useAuth } from '../context/AuthContext';
import { getOpenRequirements } from '../services/userService';
import { fonts, palette } from '../theme/colors';
import { useRoleTheme } from '../theme/useRoleTheme';

/** Full list behind Home's "Brand Posts" strip (Creator/Freelancer). */
export default function BrandPostsScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const theme = useRoleTheme();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { busyId, sendInterest, openChat } = useBrandPostActions(setItems);

    const load = useCallback(async () => {
        if (!token) { setLoading(false); return; }
        const res = await getOpenRequirements(token);
        if (res.success) setItems(res.data);
        setLoading(false);
        setRefreshing(false);
    }, [token]);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }} edges={['top']}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10 }}>
                <TouchableOpacity onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="chevron-back" size={20} color="#fff" />
                </TouchableOpacity>
                <Text style={{ color: '#fff', fontSize: 16, fontFamily: fonts.semibold, flex: 1, textAlign: 'center' }}>Brand Posts</Text>
                <View style={{ width: 36 }} />
            </View>

            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator color={theme.primary} size="large" />
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={theme.primary} />}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 80, gap: 10 }}>
                            <Ionicons name="megaphone-outline" size={40} color={palette.borderStrong} />
                            <Text style={{ color: palette.textMuted, fontSize: 14, fontFamily: fonts.regular }}>No brand posts right now</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <BrandPostCard
                            item={item}
                            primaryColor={theme.primary}
                            busy={busyId === item.id}
                            onInterested={() => sendInterest(item)}
                            onOpenChat={() => openChat(item)}
                        />
                    )}
                />
            )}
        </SafeAreaView>
    );
}
