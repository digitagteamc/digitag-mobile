/**
 * BrandBottomNav — Brand role's custom bottom nav matching the design spec:
 * A purple notched top bar with rounded corners, a central dark FAB with a mint '+' icon,
 * and 4 tab icons (home, messages, profile, requirements) with an active underline indicator.
 */
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

export interface BrandBottomNavProps {
    activeKey: string;
    onTabPress: (key: string) => void;
}

const BAR_HEIGHT = 64;
const FAB_SIZE = 60;
const CORNER_RADIUS = 24;

export default function BrandBottomNav({ activeKey, onTabPress }: BrandBottomNavProps) {
    const insets = useSafeAreaInsets();
    const { width: screenWidth } = useWindowDimensions();

    const bottomPad = Platform.OS === 'ios' ? Math.max(insets.bottom, 12) : 8;
    const totalHeight = BAR_HEIGHT + bottomPad;
    const cx = screenWidth / 2;

    // Smooth U-notch math with gap around FAB
    const notchW = 104;
    const notchDepth = 48;
    const leftCurveStart = cx - notchW / 2;
    const rightCurveEnd = cx + notchW / 2;

    const notchPath = `
        M 0 ${CORNER_RADIUS}
        A ${CORNER_RADIUS} ${CORNER_RADIUS} 0 0 1 ${CORNER_RADIUS} 0
        L ${leftCurveStart} 0
        C ${leftCurveStart + 20} 0 ${cx - 30} ${notchDepth} ${cx} ${notchDepth}
        C ${cx + 30} ${notchDepth} ${rightCurveEnd - 20} 0 ${rightCurveEnd} 0
        L ${screenWidth - CORNER_RADIUS} 0
        A ${CORNER_RADIUS} ${CORNER_RADIUS} 0 0 1 ${screenWidth} ${CORNER_RADIUS}
        L ${screenWidth} ${totalHeight}
        L 0 ${totalHeight}
        Z
    `;

    return (
        <View style={[styles.container, { height: totalHeight }]}>
            {/* SVG Background Bar with Smooth U-Notch */}
            <Svg width={screenWidth} height={totalHeight} style={StyleSheet.absoluteFill}>
                <Defs>
                    <LinearGradient id="brandBarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#6C47FF" />
                        <Stop offset="100%" stopColor="#5129FF" />
                    </LinearGradient>
                </Defs>
                <Path d={notchPath} fill="url(#brandBarGrad)" />
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
                <View style={styles.tabGroup}>
                    {/* Home */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => onTabPress('home')}
                        style={styles.tabTouch}
                    >
                        <Ionicons
                            name="home"
                            size={21}
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
                            size={21}
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

                {/* Right Tabs (Profile, Requirements) */}
                <View style={styles.tabGroup}>
                    {/* Profile */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => onTabPress('profile')}
                        style={styles.tabTouch}
                    >
                        <Ionicons
                            name="person"
                            size={21}
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

                    {/* Requirements */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => onTabPress('requirements')}
                        style={styles.tabTouch}
                    >
                        <Ionicons
                            name="document-text"
                            size={21}
                            color="#FFFFFF"
                            style={{ opacity: activeKey === 'requirements' ? 1.0 : 0.8 }}
                        />
                        <View
                            style={[
                                styles.activeLine,
                                { opacity: activeKey === 'requirements' ? 1 : 0 },
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
    tabGroup: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    tabTouch: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    activeLine: {
        width: 14,
        height: 2.5,
        borderRadius: 1.25,
        backgroundColor: '#FFFFFF',
        marginTop: 3,
    },
});

