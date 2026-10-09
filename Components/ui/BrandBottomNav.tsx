/**
 * BrandBottomNav — Brand role's custom bottom nav matching the design spec:
 * A purple notched top bar with rounded corners, a central dark FAB with a mint '+' icon,
 * and 4 tab icons (home, messages, profile, campaign) with an active underline indicator.
 */
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

export interface BrandBottomNavProps {
    activeKey: string;
    onTabPress: (key: string) => void;
}

const BAR_HEIGHT = 64;
const FAB_SIZE = 60;
const TOP_CORNER_RADIUS = 10;
const BOTTOM_CORNER_RADIUS = 50;

export default function BrandBottomNav({ activeKey, onTabPress }: BrandBottomNavProps) {
    const insets = useSafeAreaInsets();
    const { width: screenWidth } = useWindowDimensions();

    // Android devices with an on-screen system nav bar (3-button or gesture
    // pill) report that height via insets.bottom — this was hardcoded to a
    // flat 8px before, so the bar sat under that system bar instead of above
    // it. Falls back to the original flat 8 only when there's no inset to
    // respect (fully gesture-nav-hidden devices), so nothing shifts there.
    const bottomPad = Platform.OS === 'ios'
        ? Math.max(insets.bottom, 12)
        : (insets.bottom > 0 ? insets.bottom : 8);
    const totalHeight = BAR_HEIGHT + bottomPad;
    const cx = screenWidth / 2;

    // Smooth U-notch math wrapping around circular FAB
    const notchRadius = 36;
    const shoulderRadius = 16;
    const notchDepth = 50;
    const leftCurveStart = cx - notchRadius - shoulderRadius;
    const rightCurveEnd = cx + notchRadius + shoulderRadius;
    const notchW = rightCurveEnd - leftCurveStart; // 104

    const notchPath = `
        M 0 ${TOP_CORNER_RADIUS}
        A ${TOP_CORNER_RADIUS} ${TOP_CORNER_RADIUS} 0 0 1 ${TOP_CORNER_RADIUS} 0
        L ${leftCurveStart} 0
        C ${leftCurveStart + 9} 0 ${cx - notchRadius} 5 ${cx - notchRadius} 15
        C ${cx - notchRadius} 34 ${cx - 20} ${notchDepth} ${cx} ${notchDepth}
        C ${cx + 20} ${notchDepth} ${cx + notchRadius} 34 ${cx + notchRadius} 15
        C ${cx + notchRadius} 5 ${rightCurveEnd - 9} 0 ${rightCurveEnd} 0
        L ${screenWidth - TOP_CORNER_RADIUS} 0
        A ${TOP_CORNER_RADIUS} ${TOP_CORNER_RADIUS} 0 0 1 ${screenWidth} ${TOP_CORNER_RADIUS}
        L ${screenWidth} ${totalHeight - BOTTOM_CORNER_RADIUS}
        A ${BOTTOM_CORNER_RADIUS} ${BOTTOM_CORNER_RADIUS} 0 0 1 ${screenWidth - BOTTOM_CORNER_RADIUS} ${totalHeight}
        L ${BOTTOM_CORNER_RADIUS} ${totalHeight}
        A ${BOTTOM_CORNER_RADIUS} ${BOTTOM_CORNER_RADIUS} 0 0 1 0 ${totalHeight - BOTTOM_CORNER_RADIUS}
        Z
    `;

    return (
        <View style={[styles.container, { height: totalHeight }]}>
            {/* SVG Background Bar with Smooth U-Notch */}
            <Svg width={screenWidth} height={totalHeight} style={StyleSheet.absoluteFill}>
                <Path d={notchPath} fill="#6C47FF" />
            </Svg>

            {/* Glassmorphic Central Floating Plus Button */}
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => onTabPress('create')}
                style={[
                    styles.fab,
                    {
                        left: cx - FAB_SIZE / 2,
                        top: -15,
                    },
                ]}
            >
                <BlurView
                    intensity={60}
                    tint="dark"
                    style={styles.fabBlur}
                >
                    {/* Glass top reflection sheen */}
                    <ExpoLinearGradient
                        colors={['rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0.08)', 'transparent']}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 0.7 }}
                        style={styles.fabGloss}
                    />
                    <Ionicons name="add" size={24} color="#BFF7E5" />
                </BlurView>
            </TouchableOpacity>

            {/* Tab Buttons Content Overlay */}
            <View style={[styles.tabsRow, { paddingBottom: bottomPad / 2 }]}>
                {/* Left Tabs (Home, Messages) */}
                <View style={styles.leftTabGroup}>
                    {/* Home */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => onTabPress('home')}
                        style={styles.tabTouch}
                    >
                        <Ionicons
                            name="home"
                            size={15}
                            color="#FFFFFF"
                            style={{ opacity: activeKey === 'home' ? 1.0 : 0.8 }}
                        />
                        <View
                            style={[
                                styles.activeLine,
                                { opacity: activeKey === 'home' ? 1 : 0 },
                            ]}
                        />
                    </TouchableOpacity>

                    {/* Messages */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => onTabPress('messages')}
                        style={styles.tabTouch}
                    >
                        <Ionicons
                            name="chatbubbles"
                            size={15}
                            color="#FFFFFF"
                            style={{ opacity: activeKey === 'messages' ? 1.0 : 0.8 }}
                        />
                        <View
                            style={[
                                styles.activeLine,
                                { opacity: activeKey === 'messages' ? 1 : 0 },
                            ]}
                        />
                    </TouchableOpacity>
                </View>

                {/* Center Notch Spacer */}
                <View style={{ width: notchW }} />

                {/* Right Tabs (Profile, Campaign) */}
                <View style={styles.rightTabGroup}>
                    {/* Profile */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => onTabPress('profile')}
                        style={styles.tabTouch}
                    >
                        <Ionicons
                            name="person"
                            size={15}
                            color="#FFFFFF"
                            style={{ opacity: activeKey === 'profile' ? 1.0 : 0.8 }}
                        />
                        <View
                            style={[
                                styles.activeLine,
                                { opacity: activeKey === 'profile' ? 1 : 0 },
                            ]}
                        />
                    </TouchableOpacity>

                    {/* Campaign */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => onTabPress('campaign')}
                        style={styles.tabTouch}
                    >
                        <Ionicons
                            name="megaphone"
                            size={15}
                            color="#FFFFFF"
                            style={{ opacity: activeKey === 'campaign' ? 1.0 : 0.8 }}
                        />
                        <View
                            style={[
                                styles.activeLine,
                                { opacity: activeKey === 'campaign' ? 1 : 0 },
                            ]}
                        />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 99,
    },
    fab: {
        position: 'absolute',
        width: FAB_SIZE,
        height: FAB_SIZE,
        borderRadius: FAB_SIZE / 2,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.35)',
        zIndex: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
    },
    fabBlur: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(18, 18, 28, 0.65)',
    },
    fabGloss: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '55%',
        borderTopLeftRadius: FAB_SIZE / 2,
        borderTopRightRadius: FAB_SIZE / 2,
    },
    tabsRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    leftTabGroup: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 20,
        paddingRight: 8,
    },
    rightTabGroup: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 20,
        paddingLeft: 8,
    },
    tabTouch: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 8,
    },
    activeLine: {
        width: 14,
        height: 2.5,
        borderRadius: 1.25,
        backgroundColor: '#FFFFFF',
        marginTop: 3,
    },
});

