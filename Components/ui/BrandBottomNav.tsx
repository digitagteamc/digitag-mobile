/**
 * BrandBottomNav — Brand role's own bottom nav, matching the mock: a
 * floating indigo/purple gradient pill (not the dark bar Creator/Freelancer
 * use), icon-only tabs, and a raised dark "+" button in the middle.
 * Brand-only — mounted instead of AppBottomNav, never alongside it.
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BrandTabItem {
    key: string;
    icon: keyof typeof Ionicons.glyphMap;
}

const BRAND_TABS: BrandTabItem[] = [
    { key: 'home', icon: 'home' },
    { key: 'messages', icon: 'chatbubble-ellipses' },
    { key: 'create', icon: 'add' },
    { key: 'profile', icon: 'person' },
    { key: 'requirements', icon: 'document-text' },
];

// Same indigo pair as BrandHome's hero/CTA — kept local rather than widening
// theme/colors.ts's CREATOR|FREELANCER-only rolePalettes for one role.
const BAR_GRADIENT: [string, string] = ['#6D5EF5', '#4F46E5'];
const BAR_HEIGHT = 62;
const FAB_SIZE = 56;

export interface BrandBottomNavProps {
    activeKey: string;
    onTabPress: (key: string) => void;
}

export default function BrandBottomNav({ activeKey, onTabPress }: BrandBottomNavProps) {
    const insets = useSafeAreaInsets();
    const bottomPad = (insets.bottom > 0 ? insets.bottom : 12) + (Platform.OS === 'ios' ? 0 : 4);

    return (
        <View style={[styles.wrap, { paddingBottom: bottomPad }]}>
            <LinearGradient colors={BAR_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bar}>
                {BRAND_TABS.map((tab) => {
                    const isActive = tab.key === activeKey;

                    if (tab.key === 'create') {
                        return (
                            <TouchableOpacity key={tab.key} activeOpacity={0.85} onPress={() => onTabPress(tab.key)} style={styles.touch}>
                                <View style={styles.fab}>
                                    <Ionicons name="add" size={28} color="#fff" />
                                </View>
                            </TouchableOpacity>
                        );
                    }

                    const iconName = isActive ? tab.icon : (`${tab.icon}-outline` as keyof typeof Ionicons.glyphMap);
                    return (
                        <TouchableOpacity key={tab.key} activeOpacity={0.75} onPress={() => onTabPress(tab.key)} style={styles.touch}>
                            <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
                                <Ionicons name={iconName} size={22} color="#fff" />
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 18,
        paddingTop: 6,
    },
    bar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        height: BAR_HEIGHT,
        borderRadius: BAR_HEIGHT / 2,
        paddingHorizontal: 10,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 14,
    },
    touch: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    iconWrapActive: { backgroundColor: 'rgba(255,255,255,0.24)' },
    fab: {
        width: FAB_SIZE,
        height: FAB_SIZE,
        borderRadius: FAB_SIZE / 2,
        backgroundColor: '#15151c',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -14,
        borderWidth: 3,
        borderColor: '#7C6FF7',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 16,
    },
});
