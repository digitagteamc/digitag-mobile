/**
 * GlassSearchBar — the app's search field: a translucent glass bar with a
 * silver edge, search icon on the left and mic on the right. The width comes
 * from the parent, so it fits any screen. Any TextInput prop passes through,
 * and each screen keeps its own search state.
 */
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { ReactNode } from 'react';
import { StyleProp, StyleSheet, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { fonts } from '../../theme/colors';

const RADIUS = 13;

interface GlassSearchBarProps extends TextInputProps {
    containerStyle?: StyleProp<ViewStyle>;
    height?: number;
    /** Shown on the right instead of the mic, e.g. a clear button once there's text. */
    trailing?: ReactNode;
    /** For narrow spots where the mic would crowd the placeholder. */
    showMic?: boolean;
    /** Drawn over the input, e.g. an animated placeholder. */
    children?: ReactNode;
}

export default function GlassSearchBar({
    containerStyle, height = 48, trailing, showMic = true, children, style, ...inputProps
}: GlassSearchBarProps) {
    return (
        <View style={[styles.bar, { height }, containerStyle]}>
            <View style={styles.glass} pointerEvents="none">
                <BlurView intensity={12} tint="dark" style={StyleSheet.absoluteFill} />
                <LinearGradient
                    colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.16)', 'rgba(255,255,255,0.18)']}
                    style={StyleSheet.absoluteFill}
                />
            </View>
            <View style={styles.row}>
                <Ionicons name="search-outline" size={16} color="#C6C6CA" />
                <TextInput
                    placeholderTextColor="#C6C6CA"
                    cursorColor="#fff"
                    {...inputProps}
                    style={[styles.input, style]}
                />
                {children}
                {trailing || (showMic ? <Ionicons name="mic" size={16} color="#A09FB0" /> : null)}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    bar: {
        borderRadius: RADIUS,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.27)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), inset 0 0 10px rgba(255,255,255,0.15), 0 0 3px rgba(255,255,255,0.16), 0 7px 16px rgba(0,0,0,0.5)',
    },
    glass: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: RADIUS - 1,
        overflow: 'hidden',
    },
    row: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingLeft: 12,
        paddingRight: 14,
    },
    input: {
        flex: 1,
        height: '100%',
        paddingVertical: 0,
        color: '#fff',
        fontFamily: fonts.regular,
        fontSize: 11,
        textAlignVertical: 'center',
        includeFontPadding: false,
    },
});
