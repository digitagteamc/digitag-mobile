import React from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, View, ViewProps, ViewStyle } from 'react-native';
import { palette, radii, spacing } from '../../theme/colors';

interface CardProps extends ViewProps {
    padded?: boolean;
    onPress?: () => void;
    elevated?: boolean;
    style?: StyleProp<ViewStyle>;
    children: React.ReactNode;
}

/** Dark surface card used across feed, profile sections, and lists. */
export default function Card({ padded = true, onPress, elevated, style, children, ...rest }: CardProps) {
    const body = (
        <View
            {...rest}
            style={[
                styles.base,
                elevated && styles.elevated,
                padded && styles.padded,
                style,
            ]}
        >
            {children}
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
                {body}
            </TouchableOpacity>
        );
    }
    return body;
}

const styles = StyleSheet.create({
    base: {
        backgroundColor: palette.surface,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: palette.border,
        overflow: 'hidden',
    },
    elevated: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 4,
    },
    padded: { padding: spacing.lg },
});
