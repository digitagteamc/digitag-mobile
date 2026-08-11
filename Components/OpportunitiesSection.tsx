import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, TextInput, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getOpenRequirements, sendCollaboration } from '../services/userService';
import { fonts, palette } from '../theme/colors';
import { useRoleTheme } from '../theme/useRoleTheme';

const imgDefaultAvatar = require('../assets/defaultavatar.png');

/**
 * "Opportunities For You" — Creator/Freelancer-facing counterpart to Brand's
 * requirement composer. Closes the loop BrandRequirement never had: without
 * this, a Brand's posted requirement was only ever visible to the Brand that
 * posted it (see brandRequirement.service.js's listOpenRequirements). Only
 * ever mounted from index.tsx, which itself only renders for CREATOR/
 * FREELANCER (BRAND dispatches to BrandHome earlier) — no role-gating needed
 * here. Hidden entirely when there are no open requirements, rather than
 * showing a permanent empty state on every Home screen.
 */
export default function OpportunitiesSection() {
    const { token } = useAuth();
    const theme = useRoleTheme();
    const [requirements, setRequirements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [pitchText, setPitchText] = useState('');
    const [sendingId, setSendingId] = useState<string | null>(null);
    const [sentIds, setSentIds] = useState<Set<string>>(new Set());

    const load = useCallback(async () => {
        if (!token) { setLoading(false); return; }
        const res = await getOpenRequirements(token);
        if (res.success) setRequirements(res.data);
        setLoading(false);
    }, [token]);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    const handleSendPitch = async (requirement: any) => {
        if (!token || sendingId) return;
        setSendingId(requirement.id);
        const res = await sendCollaboration(token, {
            receiverId: requirement.brandUser?.id,
            requirementId: requirement.id,
            message: pitchText.trim() || undefined,
        });
        setSendingId(null);
        if (res.success) {
            setSentIds((prev) => new Set(prev).add(requirement.id));
            setExpandedId(null);
            setPitchText('');
        }
    };

    if (loading || requirements.length === 0) return null;

    return (
        <View style={{ paddingHorizontal: 10, marginTop: 24 }}>
            <Text style={[styles.title]}>Opportunities For You</Text>
            <Text style={styles.subtitle}>Brands actively looking for people like you</Text>
            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={requirements}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingTop: 12, gap: 12, paddingRight: 10 }}
                renderItem={({ item }) => {
                    const isExpanded = expandedId === item.id;
                    const alreadySent = sentIds.has(item.id);
                    const brandName = item.brandUser?.brandProfile?.name || 'Brand';
                    const brandAvatar = item.brandUser?.brandProfile?.profilePicture;
                    return (
                        <View style={[styles.card, isExpanded && styles.cardExpanded]}>
                            <View style={styles.cardHeader}>
                                <Image source={brandAvatar ? { uri: brandAvatar } : imgDefaultAvatar} style={styles.avatar} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.brandName} numberOfLines={1}>{brandName}</Text>
                                    {!!item.category && <Text style={styles.category} numberOfLines={1}>{item.category}</Text>}
                                </View>
                            </View>
                            {!!item.deliverables && <Text style={styles.deliverables} numberOfLines={2}>{item.deliverables}</Text>}

                            {alreadySent ? (
                                <View style={styles.sentPill}>
                                    <Ionicons name="checkmark-circle" size={14} color={palette.success} />
                                    <Text style={styles.sentText}>Pitch sent</Text>
                                </View>
                            ) : isExpanded ? (
                                <View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Say why you're a good fit (optional)"
                                        placeholderTextColor="#6B6B7A"
                                        value={pitchText}
                                        onChangeText={setPitchText}
                                        multiline
                                    />
                                    <TouchableOpacity
                                        style={[styles.sendBtn, { backgroundColor: theme.primary }]}
                                        onPress={() => handleSendPitch(item)}
                                        disabled={sendingId === item.id}
                                    >
                                        {sendingId === item.id
                                            ? <ActivityIndicator size="small" color="#fff" />
                                            : <Text style={styles.sendBtnText}>Send Pitch</Text>}
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={[styles.pitchBtn, { backgroundColor: theme.primary }]}
                                    onPress={() => { setExpandedId(item.id); setPitchText(''); }}
                                >
                                    <Text style={styles.pitchBtnText}>Send Pitch</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    );
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    title: { color: '#fff', fontSize: 17, fontFamily: fonts.semibold },
    subtitle: { color: palette.textMuted, fontSize: 12, fontFamily: fonts.regular, marginTop: 2 },

    card: { width: 220, backgroundColor: palette.surface, borderRadius: 16, padding: 14 },
    cardExpanded: { width: 240 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: palette.surfaceAlt },
    brandName: { color: '#fff', fontSize: 13, fontFamily: fonts.semibold },
    category: { color: palette.textMuted, fontSize: 11, fontFamily: fonts.regular, marginTop: 1 },
    deliverables: { color: palette.textSecondary, fontSize: 12, fontFamily: fonts.regular, marginBottom: 10, lineHeight: 17 },

    pitchBtn: { borderRadius: 18, paddingVertical: 9, alignItems: 'center' },
    pitchBtnText: { color: '#fff', fontSize: 12, fontFamily: fonts.semibold },

    input: { color: '#fff', fontSize: 12, fontFamily: fonts.regular, backgroundColor: palette.surfaceAlt, borderRadius: 10, padding: 8, minHeight: 50, marginBottom: 8 },
    sendBtn: { borderRadius: 18, paddingVertical: 9, alignItems: 'center' },
    sendBtnText: { color: '#fff', fontSize: 12, fontFamily: fonts.semibold },

    sentPill: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', paddingVertical: 9 },
    sentText: { color: palette.success, fontSize: 12, fontFamily: fonts.medium },
});
