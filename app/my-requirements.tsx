import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getMyBrandRequirements } from '../services/userService';
import { fonts, palette } from '../theme/colors';

const BRAND_PRIMARY = '#4F46E5';

/** Destination for the Brand bottom nav's "requirements" tab — a Brand's own posted "Who are you looking for?" requirements. */
export default function MyRequirementsScreen() {
    const router = useRouter();
    const { token } = useAuth();

    const [requirements, setRequirements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        if (!token) { setLoading(false); return; }
        const res = await getMyBrandRequirements(token);
        if (res.success) setRequirements(res.data);
        setLoading(false);
    }, [token]);

    useEffect(() => { load(); }, [load]);

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={20} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Requirements</Text>
                <View style={{ width: 36 }} />
            </View>

            {loading ? (
                <View style={styles.centerFill}>
                    <ActivityIndicator color={BRAND_PRIMARY} size="large" />
                </View>
            ) : (
                <FlatList
                    data={requirements}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 16, gap: 12 }}
                    ListEmptyComponent={
                        <View style={styles.centerFill}>
                            <Ionicons name="document-text-outline" size={40} color={palette.borderStrong} />
                            <Text style={styles.emptyText}>You haven&apos;t posted any requirements yet</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.cardTopRow}>
                                <View style={[styles.statusPill, item.status === 'CLOSED' && styles.statusPillClosed]}>
                                    <View style={[styles.dot, item.status === 'CLOSED' && { backgroundColor: palette.textMuted }]} />
                                    <Text style={styles.statusText}>{item.status === 'CLOSED' ? 'Closed' : 'Actively Reviewing'}</Text>
                                </View>
                                <View style={styles.viewsRow}>
                                    <Ionicons name="eye-outline" size={13} color={palette.textMuted} />
                                    <Text style={styles.viewsText}>{item.viewCount ?? 0}</Text>
                                </View>
                            </View>
                            <Text style={styles.message} numberOfLines={4}>{item.message}</Text>
                            <Text style={styles.targetType}>
                                {item.targetType === 'AGENCIES' ? 'Looking for Agencies' : 'Looking for Creators'}
                            </Text>
                        </View>
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
    emptyText: { color: palette.textMuted, fontSize: 14, fontFamily: fonts.regular, textAlign: 'center', paddingHorizontal: 32 },

    card: { backgroundColor: palette.surface, borderRadius: 16, padding: 14, gap: 10 },
    cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statusPillClosed: {},
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.success },
    statusText: { color: palette.textSecondary, fontSize: 11, fontFamily: fonts.medium },
    viewsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    viewsText: { color: palette.textMuted, fontSize: 11, fontFamily: fonts.regular },
    message: { color: '#fff', fontSize: 13, fontFamily: fonts.regular, lineHeight: 19 },
    targetType: { color: BRAND_PRIMARY, fontSize: 12, fontFamily: fonts.medium },
});
