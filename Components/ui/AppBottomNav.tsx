/**
 * AppBottomNav — exact Figma match (node 644-2812)
 *
 * Creator   → solid pink pill (#E91E8C) + pink FAB
 * Freelancer → solid orange pill + no FAB
 *
 * Transition: pill opens from the icon side (left → right) using
 * width animation + overflow:hidden. No bounce, no jump.
 * All 4 tabs are persistent (never unmount) so there is zero layout jump.
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import { fonts } from '../../theme/colors';
import { useRoleTheme } from '../../theme/useRoleTheme';

// ─── Types & constants ────────────────────────────────────────────────────────

interface TabItem {
    key: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
}

const TABS: TabItem[] = [
    { key: 'home', label: 'Home', icon: 'home' },
    { key: 'explore', label: 'Explore', icon: 'compass' },
    { key: 'messages', label: 'Messages', icon: 'chatbubble-ellipses' },
    { key: 'profile', label: 'Profile', icon: 'person' },
];

/**
 * Width when pill is collapsed to icon only.
 */
const PILL_CLOSED = 48;

/**
 * Full expanded width per tab (collapsed + gap + label).
 * Measured from Figma, tweak ±4px if needed.
 */
const PILL_OPEN: Record<string, number> = {
    home: 116,
    explore: 124,
    messages: 140,
    profile: 114,
};

const OPEN_MS = 220;
const CLOSE_MS = 180;
const EASE_OUT = Easing.out(Easing.cubic);
const EASE_IN = Easing.in(Easing.cubic);

const FAB_SIZE = 56;

// ─── TabButton (persistent – never unmounts) ──────────────────────────────────

function TabButton({
    tab,
    isActive,
    theme,
    onPress,
}: {
    tab: TabItem;
    isActive: boolean;
    theme: any; // Use RolePalette type if available
    onPress: () => void;
}) {
    const pillWidth = useSharedValue(isActive ? (PILL_OPEN[tab.key] ?? 120) : PILL_CLOSED);
    const bgOpacity = useSharedValue(isActive ? 1 : 0);
    const labelOpacity = useSharedValue(isActive ? 1 : 0);

    useEffect(() => {
        if (isActive) {
            pillWidth.value = withTiming(PILL_OPEN[tab.key] ?? 120, { duration: OPEN_MS, easing: EASE_OUT });
            bgOpacity.value = withTiming(1, { duration: OPEN_MS, easing: EASE_OUT });
            labelOpacity.value = withTiming(1, { duration: OPEN_MS, easing: EASE_OUT });
        } else {
            pillWidth.value = withTiming(PILL_CLOSED, { duration: CLOSE_MS, easing: EASE_IN });
            bgOpacity.value = withTiming(0, { duration: CLOSE_MS, easing: EASE_IN });
            labelOpacity.value = withTiming(0, { duration: 100, easing: EASE_IN });
        }
    }, [isActive]);

    const wrapStyle = useAnimatedStyle(() => ({ width: pillWidth.value }));
    const bgStyle = useAnimatedStyle(() => ({ opacity: bgOpacity.value }));
    const lblStyle = useAnimatedStyle(() => ({ opacity: labelOpacity.value }));

    // Active: primary color | Inactive: muted white
    const iconName = isActive
        ? tab.icon
        : (`${tab.icon}-outline` as keyof typeof Ionicons.glyphMap);
    const iconColor = isActive ? theme.primary : 'rgba(255,255,255,0.45)';

    return (
        <TouchableOpacity activeOpacity={0.75} onPress={onPress} style={styles.touch}>
            <Animated.View style={[styles.pill, wrapStyle]}>

                {/* Pill solid background — animates opacity. Using light solid color */}
                <Animated.View
                    style={[
                        StyleSheet.absoluteFillObject,
                        styles.pillBg,
                        { backgroundColor: theme.light },
                        bgStyle,
                    ]}
                />

                {/* Icon — color changes to primary when active */}
                <View style={styles.iconWrapper}>
                    <Ionicons name={iconName} size={22} color={iconColor} />
                </View>

                {/* Label — revealed by overflow:hidden. Using primary color for text. */}
                <Animated.Text style={[styles.label, { color: theme.primary }, lblStyle]}>
                    {tab.label}
                </Animated.Text>
            </Animated.View>
        </TouchableOpacity>
    );
}

// ─── FAB ─────────────────────────────────────────────────────────────────────

function FabButton({
    isFreelancer,
    onPress,
}: {
    isFreelancer: boolean;
    onPress: () => void;
}) {
    const creatorColors = ['#F15DAB', '#E91E8C'] as const; // rgba(241, 93, 171, 1) + shade
    const freelancerColors = ['rgba(255, 131, 42, 1)', 'rgba(203, 104, 50, 1)'] as const;

    return (
        <View style={[styles.fab, { shadowColor: isFreelancer ? 'rgba(255, 87, 0, 0.4)' : 'rgba(241, 93, 171, 0.4)' }]}>
            <TouchableOpacity
                activeOpacity={0.82}
                style={styles.fabTouchable}
                onPress={onPress}
            >
                <LinearGradient
                    colors={isFreelancer ? freelancerColors : creatorColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.fabBackground}
                >
                    <Ionicons name="add" size={32} color="#fff" />
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export interface AppBottomNavProps {
    activeKey: string;
    onTabPress: (tab: TabItem) => void;
    onFabPress?: () => void;
}

export default function AppBottomNav({
    activeKey,
    onTabPress,
    onFabPress,
}: AppBottomNavProps) {
    const theme = useRoleTheme();
    const { userRole } = useAuth();

    // FAB is visible only on Home and Explore tabs
    const isHomeOrExplore = activeKey === 'home' || activeKey === 'explore';
    const showFab = isHomeOrExplore && !!onFabPress;
    const isFreelancer = userRole === 'FREELANCER';

    return (
        <View style={styles.wrap}>
            {/* Create Post FAB — floats above bar top-right */}
            {showFab && (
                <FabButton
                    isFreelancer={isFreelancer}
                    onPress={onFabPress!}
                />
            )}

            {/* Nav bar */}
            <View style={styles.bar}>
                {TABS.map((tab) => (
                    <TabButton
                        key={tab.key}
                        tab={tab}
                        isActive={tab.key === activeKey}
                        theme={theme}
                        onPress={() => onTabPress(tab)}
                    />
                ))}
            </View>
        </View>
    );
}

export const APP_TABS = TABS;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    wrap: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },

    /* ── Bar: Figma #1E1E24, radius-tl/tr 20, FIXED 80px height */
    bar: {
        backgroundColor: '#1E1E24',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 8,
        /* Fixed height — never changes when switching tabs */
        height: Platform.OS === 'ios' ? 110 : 80,  // 80px + 30px iOS home indicator
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
    },

    /* Touchable wrapper — left-anchored so pill grows rightward */
    touch: {
        alignItems: 'flex-start',
        justifyContent: 'center',
    },

    /* Animated width container — overflow:hidden reveals the label */
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
        paddingHorizontal: 12,
        height: 48, // Fixed height for all tabs
        borderRadius: 999,
        gap: 8,
    },

    /* Absolute fill background (opacity animated separately) */
    pillBg: {
        borderRadius: 999,
    },

    /* Icon container inside the pill */
    iconWrapper: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },

    label: {
        fontSize: 14,
        fontFamily: fonts.semibold,
        color: '#fff',
        letterSpacing: -0.3,
        flexShrink: 0,
        marginRight: 4,
    },

    /* ── FAB: 56px circle, top-right, floats above the bar */
    fab: {
        position: 'absolute',
        right: 20,
        bottom: Platform.OS === 'ios' ? 125 : 95, // Increased to float above the bar
        width: FAB_SIZE,
        height: FAB_SIZE,
        borderRadius: FAB_SIZE / 2,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.6,
        shadowRadius: 14,
        elevation: 18,
    },

    fabTouchable: {
        width: FAB_SIZE,
        height: FAB_SIZE,
        borderRadius: FAB_SIZE / 2,
        overflow: 'hidden',
    },

    fabBackground: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4.5, // Thick white border as per image
        borderColor: '#fff',
        borderRadius: FAB_SIZE / 2,
        
    },
});
