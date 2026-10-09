import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NotificationItem from '../Components/ui/NotificationItem';
import { useAuth } from '../context/AuthContext';
import { listCollaborations, openConversationWith, respondCollaboration } from '../services/userService';
import { fonts, palette } from '../theme/colors';

function getSenderName(sender: any) {
    if (!sender) return 'Someone';
    const profile = sender.creatorProfile || sender.freelancerProfile;
    if (profile?.name) return profile.name;
    return sender.role === 'FREELANCER' ? 'Freelancer' : 'Creator';
}

function getSenderPic(sender: any) {
    const profile = sender?.creatorProfile || sender?.freelancerProfile;
    return profile?.profilePicture || null;
}

/** Brand's "View Responses" for one posted requirement — the pitches Creators/
 *  Freelancers sent via OpportunitiesSection's "Send Pitch". Mirrors
 *  notifications.tsx's Requests tab (same NotificationItem + respond flow),
 *  scoped to a single requirementId instead of all incoming requests. */
export default function RequirementResponsesScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const { requirementId } = useLocalSearchParams<{ requirementId: string }>();

    const [collabs, setCollabs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!token || !requirementId) { setLoading(false); return; }
        const res = await listCollaborations(token, { direction: 'incoming', requirementId });
        if (res.success) setCollabs(res.data);
        setLoading(false);
    }, [token, requirementId]);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    const handleRespond = async (id: string, action: 'ACCEPT' | 'DECLINE') => {
        if (!token) return;
        setBusyId(id);
        const res = await respondCollaboration(token, id, action);
        if (res.success) {
            const updated = res.data;
            setCollabs((prev) => prev.map((c) => (c.id === id ? updated : c)));
            if (action === 'ACCEPT' && updated) {
                const openRes = await openConversationWith(token, updated.senderId);
                if (openRes.success && openRes.data?.id) {
                    router.push({ pathname: '/chat/[id]', params: { id: openRes.data.id } } as any);
                }
            }
        }
        setBusyId(null);
    };

    const pending = collabs.filter((c) => c.status === 'PENDING');
    const others = collabs.filter((c) => c.status !== 'PENDING');

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }} edges={['top']}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10 }}>
                <TouchableOpacity onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="chevron-back" size={20} color="#fff" />
                </TouchableOpacity>
                <Text style={{ color: '#fff', fontSize: 16, fontFamily: fonts.semibold, flex: 1, textAlign: 'center' }}>Responses</Text>
                <View style={{ width: 36 }} />
            </View>

            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator color={palette.textPrimary} size="large" />
                </View>
            ) : (
                <FlatList
                    data={[...pending, ...others]}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingBottom: 40 }}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 80, gap: 10 }}>
                            <Ionicons name="mail-open-outline" size={40} color={palette.borderStrong} />
                            <Text style={{ color: palette.textMuted, fontSize: 14, fontFamily: fonts.regular }}>No pitches yet</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <NotificationItem
                            name={getSenderName(item.sender)}
                            subtitle={item.message || 'Sent a pitch'}
                            avatarUri={getSenderPic(item.sender)}
                            role={item.sender?.role}
                            variant={item.status === 'PENDING' ? 'request' : 'info'}
                            busy={busyId === item.id}
                            onAccept={() => handleRespond(item.id, 'ACCEPT')}
                            onReject={() => handleRespond(item.id, 'DECLINE')}
                            onNamePress={item.sender?.id ? () => router.push({ pathname: '/creator-details', params: { userId: item.sender.id } } as any) : undefined}
                        />
                    )}
                />
            )}
        </SafeAreaView>
    );
}
