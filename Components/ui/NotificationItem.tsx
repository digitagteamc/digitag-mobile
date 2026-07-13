import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts, palette, Role } from '../../theme/colors';
import { getRoleTheme } from '../../theme/useRoleTheme';
import Button from './Button';

export interface NotificationItemProps {
    name: string;
    subtitle: string;
    avatarUri?: string | null;
    /** Shown as a colored icon circle instead of a photo — for generic
     *  activity items (new message, collab accepted/declined, new post)
     *  that have no single "other person" avatar to show. Ignored if
     *  avatarUri is set. */
    icon?: keyof typeof Ionicons.glyphMap;
    /** Role of the other party — drives theme accents. */
    role?: Role | string | null;
    /** Variant picks which actions render. */
    variant: 'request' | 'suggestion' | 'info';
    busy?: boolean;
    /** Unread items get a subtle highlight + accent dot. */
    unread?: boolean;
    // Request actions
    onAccept?: () => void;
    onReject?: () => void;
    // Suggestion actions
    following?: boolean;
    onToggleFollow?: () => void;
    onDismiss?: () => void;
    // Info / tap
    onPress?: () => void;
    onNamePress?: () => void;
}

export default function NotificationItem({
    name,
    subtitle,
    avatarUri,
    icon,
    role,
    variant,
    busy,
    unread,
    onAccept,
    onReject,
    following,
    onToggleFollow,
    onDismiss,
    onPress,
    onNamePress,
}: NotificationItemProps) {
    const theme = getRoleTheme(role ?? null);

    const content = (
        <View style={[styles.row, unread && { backgroundColor: theme.primary + '0F' }]}>
            {icon && !avatarUri ? (
                <View style={[styles.iconCircle, { backgroundColor: theme.primary + '22' }]}>
                    <Ionicons name={icon} size={20} color={theme.primary} />
                </View>
            ) : (
                <Image source={avatarUri ? { uri: avatarUri } : require('../../assets/images/icon.png')} style={styles.avatar} resizeMode="cover" />
            )}

            <View style={styles.body}>
                {onNamePress ? (
                    <TouchableOpacity onPress={onNamePress} activeOpacity={0.7}>
                        <Text style={styles.name} numberOfLines={1}>{name}</Text>
                    </TouchableOpacity>
                ) : (
                    <Text style={styles.name} numberOfLines={1}>{name}</Text>
                )}
                <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
            </View>

            {unread ? <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} /> : null}

            {busy ? (
                <ActivityIndicator color={theme.primary} />
            ) : variant === 'request' ? (
                <View style={styles.actions}>
                    <Button title="Accept" role={role} variant="solid" size="sm" onPress={onAccept} fullWidth={false} style={styles.btn} />
                    <Button title="Reject" role={role} variant="outline" size="sm" onPress={onReject} fullWidth={false} style={styles.btn} />
                </View>
            ) : variant === 'suggestion' ? (
                <View style={styles.actions}>
                    <Button
                        title={following ? 'Following' : 'Follow'}
                        role={role}
                        variant={following ? 'outline' : 'solid'}
                        size="sm"
                        onPress={onToggleFollow}
                        fullWidth={false}
                        style={styles.btnWide}
                    />
                    {onDismiss ? (
                        <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn}>
                            <Ionicons name="close" size={18} color={palette.textMuted} />
                        </TouchableOpacity>
                    ) : null}
                </View>
            ) : null}
        </View>
    );

    if (onPress && variant === 'info') {
        return <TouchableOpacity onPress={onPress} activeOpacity={0.85}>{content}</TouchableOpacity>;
    }
    return content;
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        gap: 12,
    },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: palette.surface },
    iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    unreadDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 6 },
    initialsAvatar: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    initialsText: { fontFamily: fonts.semibold, fontSize: 13 },

    body: { flex: 1 },
    name: { color: palette.textPrimary, fontFamily: fonts.semibold, fontSize: 14 },
    subtitle: { color: palette.textMuted, fontFamily: fonts.regular, fontSize: 11, marginTop: 2 },

    actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    btn: { minHeight: 34, paddingHorizontal: 14 },
    btnWide: { minHeight: 34, paddingHorizontal: 20 },
    dismissBtn: { padding: 6 },
});
