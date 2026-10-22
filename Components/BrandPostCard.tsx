import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fonts, palette } from '../theme/colors';

const imgDefaultAvatar = require('../assets/defaultavatar.png');

/** Labels for the creator's own interest in a brand post (Collaboration status). */
const INTEREST_LABEL: Record<string, string> = {
    PENDING: 'Interest sent',
    ACCEPTED: 'Brand accepted · chat open',
    COMPLETED: 'Collab completed',
    DECLINED: 'Not selected',
};

type Props = {
    item: any;
    primaryColor: string;
    busy: boolean;
    /** Card width for the horizontal Home strip; omit for full-width lists. */
    width?: number;
    onInterested: () => void;
    onOpenChat?: () => void;
};

/**
 * One brand requirement as a Creator/Freelancer sees it under "Brand Posts".
 * "I'm Interested" sends a collaboration request on the post; the brand sees
 * it in its Campaign tab and accepting it opens chat between the two.
 */
export default function BrandPostCard({ item, primaryColor, busy, width, onInterested, onOpenChat }: Props) {
    const brandName = item.brandUser?.brandProfile?.name || 'Brand';
    const brandAvatar = item.brandUser?.brandProfile?.profilePicture;
    const status: string | null = item.myInterestStatus || null;
    // A cancelled request can be sent again; anything else is settled.
    const canSend = !status || status === 'CANCELLED';
    const countLabel = item.creatorCountMin && item.creatorCountMax
        ? `${item.creatorCountMin}-${item.creatorCountMax} needed`
        : item.creatorCountMin ? `${item.creatorCountMin}+ needed` : null;

    return (
        <View style={[styles.card, width ? { width } : null]}>
            <View style={styles.cardHeader}>
                <Image source={brandAvatar ? { uri: brandAvatar } : imgDefaultAvatar} style={styles.avatar} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.brandName} numberOfLines={1}>{brandName}</Text>
                    {!!item.category && <Text style={styles.category} numberOfLines={1}>{item.category}</Text>}
                </View>
            </View>

            {!!item.title && <Text style={styles.title} numberOfLines={2}>{item.title}</Text>}
            {!!item.message && <Text style={styles.message} numberOfLines={width ? 2 : 4}>{item.message}</Text>}

            <View style={styles.metaRow}>
                {!!item.budget && (
                    <View style={styles.metaPill}>
                        <Ionicons name="cash-outline" size={12} color={palette.textSecondary} />
                        <Text style={styles.metaText} numberOfLines={1}>{item.budget}</Text>
                    </View>
                )}
                {!!countLabel && (
                    <View style={styles.metaPill}>
                        <Ionicons name="people-outline" size={12} color={palette.textSecondary} />
                        <Text style={styles.metaText}>{countLabel}</Text>
                    </View>
                )}
            </View>
            {!!item.deliverables && <Text style={styles.deliverables} numberOfLines={2}>{item.deliverables}</Text>}

            {canSend ? (
                <TouchableOpacity
                    style={[styles.interestBtn, { backgroundColor: primaryColor }]}
                    onPress={onInterested}
                    disabled={busy}
                    activeOpacity={0.85}
                >
                    {busy
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={styles.interestBtnText}>I&apos;m Interested</Text>}
                </TouchableOpacity>
            ) : status === 'ACCEPTED' && onOpenChat ? (
                <TouchableOpacity style={[styles.interestBtn, styles.chatBtn]} onPress={onOpenChat} activeOpacity={0.85}>
                    <Ionicons name="chatbubble-ellipses-outline" size={14} color="#fff" />
                    <Text style={styles.interestBtnText}>Open Chat</Text>
                </TouchableOpacity>
            ) : (
                <View style={styles.statusPill}>
                    <Ionicons
                        name={status === 'DECLINED' ? 'close-circle-outline' : 'checkmark-circle'}
                        size={14}
                        color={status === 'DECLINED' ? palette.textMuted : palette.success}
                    />
                    <Text style={[styles.statusText, status === 'DECLINED' && { color: palette.textMuted }]}>
                        {INTEREST_LABEL[status || ''] || 'Interest sent'}
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: { backgroundColor: palette.surface, borderRadius: 16, padding: 14 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: palette.surfaceAlt },
    brandName: { color: '#fff', fontSize: 13, fontFamily: fonts.semibold },
    category: { color: palette.textMuted, fontSize: 11, fontFamily: fonts.regular, marginTop: 1 },
    title: { color: '#fff', fontSize: 13, fontFamily: fonts.semibold, marginBottom: 4 },
    message: { color: palette.textSecondary, fontSize: 12, fontFamily: fonts.regular, lineHeight: 17, marginBottom: 8 },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
    metaPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: palette.surfaceAlt, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, maxWidth: '100%' },
    metaText: { color: palette.textSecondary, fontSize: 11, fontFamily: fonts.regular },
    deliverables: { color: palette.textMuted, fontSize: 11, fontFamily: fonts.regular, marginBottom: 10, lineHeight: 16 },

    interestBtn: { borderRadius: 18, paddingVertical: 9, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, marginTop: 2 },
    chatBtn: { backgroundColor: '#1A8CFF' },
    interestBtnText: { color: '#fff', fontSize: 12, fontFamily: fonts.semibold },

    statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', paddingVertical: 9, marginTop: 2 },
    statusText: { color: palette.success, fontSize: 12, fontFamily: fonts.medium },
});
