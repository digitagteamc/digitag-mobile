import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fonts, palette } from '../../theme/colors';
import { useRoleTheme } from '../../theme/useRoleTheme';

interface TabItem {
    key: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    route: string;
}

const TABS: TabItem[] = [
    { key: 'home', label: 'Home', icon: 'home', route: '/(tabs)' },
    { key: 'explore', label: 'Explore', icon: 'compass', route: '/(tabs)/explore' },
    { key: 'messages', label: 'Messages', icon: 'chatbubble-ellipses', route: '/(tabs)/messages' },
    { key: 'profile', label: 'Profile', icon: 'person', route: '/(tabs)/profile' },
];

/**
 * Persistent bottom nav. Rendered via the (tabs)/_layout.tsx custom tabBar so
 * it stays mounted across tab switches and feels consistent app-wide.
 *
 * Props intentionally match the react-navigation BottomTabBar signature so
 * expo-router's Tabs can drop it in.
 */
export interface AppBottomNavProps {
    activeKey: string;
    onTabPress: (tab: TabItem) => void;
    onFabPress?: () => void;
}

export default function AppBottomNav({ activeKey, onTabPress, onFabPress }: AppBottomNavProps) {
    const theme = useRoleTheme();

    return (
        <View style={styles.wrap}>
            <View style={styles.bar}>
                {TABS.map((tab) => {
                    const active = tab.key === activeKey;
                    if (active) {
                        return (
                            <TouchableOpacity
                                key={tab.key}
                                activeOpacity={0.85}
                                style={[styles.activePill, { backgroundColor: theme.soft, borderColor: theme.border }]}
                                onPress={() => onTabPress(tab)}
                            >
                                <Ionicons name={tab.icon} size={20} color={theme.primary} />
                                <Text style={[styles.activeLabel, { color: theme.primary }]}>{tab.label}</Text>
                            </TouchableOpacity>
                        );
                    }
                    return (
                        <TouchableOpacity
                            key={tab.key}
                            activeOpacity={0.7}
                            style={styles.tabBtn}
                            onPress={() => onTabPress(tab)}
                        >
                            <Ionicons name={`${tab.icon}-outline` as any} size={24} color={palette.textMuted} />
                        </TouchableOpacity>
                    );
                })}
            </View>

            {onFabPress ? (
                <TouchableOpacity
                    activeOpacity={0.85}
                    style={[styles.fab, { shadowColor: theme.primary }]}
                    onPress={onFabPress}
                >
                    <LinearGradient
                        colors={[theme.primary, theme.hover]}
                        start={{ x: 0.2, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.fabInner}
                    >
                        <Ionicons name="add" size={26} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
            ) : null}
        </View>
    );
}

/** Ordered tab definitions, exposed for the tabs layout. */
export const APP_TABS = TABS;

const styles = StyleSheet.create({
    wrap: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    bar: {
        backgroundColor: '#1E1E24',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 8,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 30 : 16,
        borderTopWidth: 1,
        borderTopColor: palette.borderSoft,
    },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 30 },
    activePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 30,
        borderWidth: 1,
    },
    activeLabel: { fontSize: 13, fontFamily: fonts.semibold },

    fab: {
        position: 'absolute',
        right: 16,
        bottom: Platform.OS === 'ios' ? 70 : 60,
        width: 54,
        height: 54,
        borderRadius: 27,
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius: 14,
        elevation: 14,
    },
    fabInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
