import React from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { palette } from '../../theme/colors';
import { Role } from '../../theme/colors';
import { getRoleTheme } from '../../theme/useRoleTheme';

export type IconButtonTone = 'surface' | 'primary' | 'subtle' | 'transparent';

interface Props {
    onPress?: () => void;
    children: React.ReactNode;
    size?: number;
    tone?: IconButtonTone;
    role?: Role | string | null;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    accessibilityLabel?: string;
}

export default function IconButton({
    onPress,
    children,
    size = 36,
    tone = 'surface',
    role,
    disabled,
    style,
    accessibilityLabel,
}: Props) {
    const theme = getRoleTheme(role ?? null);

    const surface: ViewStyle = (() => {
        switch (tone) {
            case 'primary': return { backgroundColor: theme.primary };
            case 'subtle': return { backgroundColor: theme.soft, borderWidth: 1, borderColor: theme.border };
            case 'transparent': return { backgroundColor: 'transparent' };
            case 'surface':
            default: return { backgroundColor: palette.surface };
        }
    })();

    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            onPress={onPress}
            activeOpacity={0.8}
            disabled={disabled}
            style={[
                styles.base,
                { width: size, height: size, borderRadius: size / 2, opacity: disabled ? 0.5 : 1 },
                surface,
                style,
            ]}
        >
            {children}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    base: { alignItems: 'center', justifyContent: 'center' },
});
