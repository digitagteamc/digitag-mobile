import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { fonts, palette, Role } from '../../theme/colors';
import { getRoleTheme } from '../../theme/useRoleTheme';

export type StatusTone = 'role' | 'neutral' | 'success' | 'warning' | 'danger' | 'info';

interface Props {
    label: string;
    tone?: StatusTone;
    role?: Role | string | null;
    style?: StyleProp<ViewStyle>;
    size?: 'sm' | 'md';
}

/** Inline status / tag pill. Reuse for “Paid Collab”, “Free Collab”,
 *  “Request Sent”, etc. to keep the vocabulary consistent. */
export default function StatusBadge({ label, tone = 'neutral', role, style, size = 'sm' }: Props) {
    const theme = getRoleTheme(role ?? null);

    const palettes: Record<StatusTone, { bg: string; border: string; text: string }> = {
        role: { bg: theme.soft, border: theme.border, text: theme.primary },
        neutral: {
            bg: 'rgba(255,255,255,0.06)',
            border: palette.borderSoft,
            text: palette.textSecondary,
        },
        success: { bg: 'rgba(0,164,1,0.15)', border: 'rgba(0,164,1,0.5)', text: palette.success },
        warning: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.5)', text: palette.warning },
        danger: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.5)', text: palette.danger },
        info: { bg: 'rgba(96,165,250,0.15)', border: 'rgba(96,165,250,0.5)', text: palette.info },
    };
    const p = palettes[tone];

    const dims = size === 'sm'
        ? { paddingVertical: 4, paddingHorizontal: 10, fontSize: 11 }
        : { paddingVertical: 6, paddingHorizontal: 12, fontSize: 12 };

    return (
        <View
            style={[
                styles.base,
                {
                    backgroundColor: p.bg,
                    borderColor: p.border,
                    paddingVertical: dims.paddingVertical,
                    paddingHorizontal: dims.paddingHorizontal,
                },
                style,
            ]}
        >
            <Text style={[styles.text, { color: p.text, fontSize: dims.fontSize }]}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    base: { borderRadius: 999, borderWidth: 1, alignSelf: 'flex-start' },
    text: { fontFamily: fonts.semibold },
});
