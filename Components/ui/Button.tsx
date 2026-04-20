import React from 'react';
import {
    ActivityIndicator,
    StyleProp,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import { fonts, palette, radii, spacing } from '../../theme/colors';
import { Role } from '../../theme/colors';
import { getRoleTheme } from '../../theme/useRoleTheme';

export type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'subtle';

interface Props {
    title: string;
    onPress?: () => void;
    /** Role theme override. Defaults to the viewer's role via the theme hook. */
    role?: Role | string | null;
    variant?: ButtonVariant;
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    /** Stretches the button to fill its parent width. */
    fullWidth?: boolean;
}

/**
 * Shared button primitive. All CTAs in the app should use this instead of
 * rolling their own TouchableOpacity + styles.
 */
export default function Button({
    title,
    onPress,
    role,
    variant = 'solid',
    size = 'md',
    disabled,
    loading,
    leftIcon,
    rightIcon,
    style,
    textStyle,
    fullWidth = true,
}: Props) {
    const theme = getRoleTheme(role ?? null);

    const sizing = {
        sm: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 13, iconGap: 6 },
        md: { paddingVertical: 12, paddingHorizontal: 20, fontSize: 14, iconGap: 8 },
        lg: { paddingVertical: 15, paddingHorizontal: 24, fontSize: 15, iconGap: 10 },
    }[size];

    const surface: ViewStyle = (() => {
        switch (variant) {
            case 'outline':
                return { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.primary };
            case 'ghost':
                return { backgroundColor: 'transparent' };
            case 'subtle':
                return {
                    backgroundColor: theme.soft,
                    borderWidth: 1,
                    borderColor: theme.border,
                };
            case 'solid':
            default:
                return { backgroundColor: theme.primary };
        }
    })();

    const textColor = (() => {
        if (variant === 'solid') return theme.onPrimary;
        if (variant === 'outline' || variant === 'ghost' || variant === 'subtle') return theme.primary;
        return '#fff';
    })();

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={onPress}
            disabled={disabled || loading}
            style={[
                styles.base,
                surface,
                {
                    paddingVertical: sizing.paddingVertical,
                    paddingHorizontal: sizing.paddingHorizontal,
                    alignSelf: fullWidth ? 'stretch' : 'auto',
                    opacity: disabled ? 0.55 : 1,
                },
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={textColor} size="small" />
            ) : (
                <View style={[styles.inner, { gap: sizing.iconGap }]}>
                    {leftIcon}
                    <Text
                        style={[
                            styles.label,
                            { color: textColor, fontSize: sizing.fontSize },
                            textStyle,
                        ]}
                    >
                        {title}
                    </Text>
                    {rightIcon}
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    base: {
        borderRadius: radii.pill,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 44,
    },
    inner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    label: { fontFamily: fonts.semibold },
});

/** Convenience export of shared token groups for use in consumers. */
export { palette, spacing, radii, fonts };
