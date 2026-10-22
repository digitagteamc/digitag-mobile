import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getOpenRequirements, openConversationWith, sendCollaboration } from '../services/userService';
import { fonts, palette } from '../theme/colors';
import { useRoleTheme } from '../theme/useRoleTheme';
import BrandPostCard from './BrandPostCard';

/**
 * Sends a Creator/Freelancer's "I'm Interested" on a brand post and opens the
 * chat once the brand has accepted. Shared by the Home strip and the full
 * Brand Posts screen so both keep each card's interest status in sync.
 */
export function useBrandPostActions(setItems: React.Dispatch<React.SetStateAction<any[]>>) {
    const { token } = useAuth();
    const router = useRouter();
    const [busyId, setBusyId] = useState<string | null>(null);

    const sendInterest = async (requirement: any) => {
        if (!token || busyId) return;
        setBusyId(requirement.id);
        const res = await sendCollaboration(token, {
            receiverId: requirement.brandUser?.id,
            requirementId: requirement.id,
        });
        setBusyId(null);
        if (res.success) {
            setItems((prev) => prev.map((r) => (r.id === requirement.id ? { ...r, myInterestStatus: 'PENDING' } : r)));
        } else {
            Alert.alert('Could not send', res.error || 'Please try again.');
        }
    };

    const openChat = async (requirement: any) => {
        if (!token || !requirement.brandUser?.id) return;
        const res = await openConversationWith(token, requirement.brandUser.id);
        if (res.success && res.data?.id) router.push({ pathname: '/chat/[id]', params: { id: res.data.id } } as any);
    };

    return { busyId, sendInterest, openChat };
}

/**
 * "Brand Posts" — Creator/Freelancer-facing counterpart to the brand's
 * requirement composer. Only ever mounted from index.tsx, which itself only
 * renders for CREATOR/FREELANCER (BRAND dispatches to BrandHome earlier) —
 * the backend already limits the list to posts open to the viewer's role
 * (freelancers only see posts the brand ticked "Freelancers can also see").
 * Hidden entirely when there are no open posts, rather than showing a
 * permanent empty state on every Home screen.
 */
export default function OpportunitiesSection() {
    const { token } = useAuth();
    const router = useRouter();
    const theme = useRoleTheme();
    const [requirements, setRequirements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { busyId, sendInterest, openChat } = useBrandPostActions(setRequirements);

    const load = useCallback(async () => {
        if (!token) { setLoading(false); return; }
        const res = await getOpenRequirements(token);
        if (res.success) setRequirements(res.data);
        setLoading(false);
    }, [token]);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    if (loading || requirements.length === 0) return null;

    return (
        <View style={{ paddingHorizontal: 10, marginTop: 24 }}>
            <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>Brand Posts</Text>
                    <Text style={styles.subtitle}>Brands actively looking for people like you</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/brand-posts' as any)} style={styles.seeAll} activeOpacity={0.7}>
                    <Text style={[styles.seeAllText, { color: theme.primary }]}>See all</Text>
                    <Ionicons name="chevron-forward" size={14} color={theme.primary} />
                </TouchableOpacity>
            </View>
            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={requirements}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingTop: 12, gap: 12, paddingRight: 10 }}
                renderItem={({ item }) => (
                    <BrandPostCard
                        item={item}
                        width={230}
                        primaryColor={theme.primary}
                        busy={busyId === item.id}
                        onInterested={() => sendInterest(item)}
                        onOpenChat={() => openChat(item)}
                    />
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    headerRow: { flexDirection: 'row', alignItems: 'flex-end' },
    title: { color: '#fff', fontSize: 17, fontFamily: fonts.semibold },
    subtitle: { color: palette.textMuted, fontSize: 12, fontFamily: fonts.regular, marginTop: 2 },
    seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 4 },
    seeAllText: { fontSize: 12, fontFamily: fonts.medium },
});
