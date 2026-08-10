import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getFollowSuggestions } from '../services/userService';
import { fonts, palette } from '../theme/colors';

const imgDefaultAvatar = require('../assets/defaultavatar.png');

/**
 * Generic "browse people" results screen — used by Brand Home's Creators-by-
 * Location and Freelancers-by-Category tiles (and reusable for any other
 * role/location/category-filtered listing later). Reuses
 * getFollowSuggestions with its optional filters rather than a bespoke
 * endpoint, since that's already exactly "browse opposite-role users".
 */
export default function PeopleResultsScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const params = useLocalSearchParams<{ title?: string; role?: 'CREATOR' | 'FREELANCER'; location?: string; categorySlug?: string }>();

    const [people, setPeople] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        if (!token) { setLoading(false); return; }
        const res = await getFollowSuggestions(token, 50, {
            role: params.role,
            location: params.location,
            categorySlug: params.categorySlug,
        });
        if (res.success) setPeople(res.data);
        setLoading(false);
    }, [token, params.role, params.location, params.categorySlug]);

    useEffect(() => { load(); }, [load]);

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={20} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{params.title || 'Results'}</Text>
                <View style={{ width: 36 }} />
            </View>

            {loading ? (
                <View style={styles.centerFill}>
                    <ActivityIndicator color={palette.textPrimary} size="large" />
                </View>
            ) : (
                <FlatList
                    data={people}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    columnWrapperStyle={{ gap: 12 }}
                    contentContainerStyle={{ padding: 16, gap: 12 }}
                    ListEmptyComponent={
                        <View style={styles.centerFill}>
                            <Ionicons name="people-outline" size={40} color={palette.borderStrong} />
                            <Text style={styles.emptyText}>No one here yet</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.card}
                            activeOpacity={0.85}
                            onPress={() => router.push({ pathname: '/creator-details', params: { userId: item.id } } as any)}
                        >
                            <Image source={item.profilePicture ? { uri: item.profilePicture } : imgDefaultAvatar} style={styles.avatar} />
                            <Text style={styles.name} numberOfLines={1}>{item.name || (item.role === 'FREELANCER' ? 'Freelancer' : 'Creator')}</Text>
                            <Text style={styles.sub} numberOfLines={1}>{item.categoryNames?.[0] || item.location || ''}</Text>
                        </TouchableOpacity>
                    )}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: palette.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: '#fff', fontSize: 16, fontFamily: fonts.semibold, flex: 1, textAlign: 'center' },
    centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 60, gap: 10 },
    emptyText: { color: palette.textMuted, fontSize: 14, fontFamily: fonts.regular },
    card: { flex: 1, backgroundColor: palette.surface, borderRadius: 16, padding: 14, alignItems: 'center' },
    avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: palette.surfaceAlt },
    name: { color: '#fff', fontSize: 13, fontFamily: fonts.semibold, marginTop: 8 },
    sub: { color: palette.textMuted, fontSize: 11, fontFamily: fonts.regular, marginTop: 2 },
});
