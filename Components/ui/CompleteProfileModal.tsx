import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

const creatorImg = require('../../assets/images/creator.png');
const freelancerImg = require('../../assets/images/freelancer.png');
const starsImg = require('../../assets/categories/stars.gif');

interface Props {
    visible: boolean;
    role: 'CREATOR' | 'FREELANCER' | string;
    action?: string;
    onComplete: () => void;
    onDismiss: () => void;
}

export default function CompleteProfileModal({ visible, role, action, onComplete, onDismiss }: Props) {
    const isFreelancer = role?.toUpperCase() === 'FREELANCER';
    const primary = isFreelancer ? '#F26930' : '#ED2A91';
    const soft = isFreelancer ? 'rgba(242,105,48,0.18)' : 'rgba(237,42,145,0.18)';
    const gradStart = isFreelancer ? '#F26930' : '#ED2A91';
    const gradEnd = isFreelancer ? '#7A2C08' : '#6B0038';

    const scaleAnim = useRef(new Animated.Value(0.88)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const floatAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
                Animated.timing(opacityAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
            ]).start();

            Animated.loop(
                Animated.sequence([
                    Animated.timing(floatAnim, { toValue: -8, duration: 1800, useNativeDriver: true }),
                    Animated.timing(floatAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
                ])
            ).start();
        } else {
            scaleAnim.setValue(0.88);
            opacityAnim.setValue(0);
            floatAnim.stopAnimation();
            floatAnim.setValue(0);
        }
    }, [visible]);

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss} statusBarTranslucent>
            <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
                <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>

                    {/* ── Gradient top section ─────────────────── */}
                    <LinearGradient
                        colors={[gradStart, gradEnd, '#0A0A10']}
                        locations={[0, 0.55, 1]}
                        style={styles.gradientTop}
                    >
                        {/* Decorative circles */}
                        <View style={[styles.decorCircle, styles.decorCircle1, { borderColor: primary + '55' }]} />
                        <View style={[styles.decorCircle, styles.decorCircle2, { borderColor: primary + '33' }]} />

                        {/* Stars sparkle */}
                        <Image source={starsImg} style={styles.starsImg} resizeMode="contain" />

                        {/* Role illustration */}
                        <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
                            <Image
                                source={isFreelancer ? freelancerImg : creatorImg}
                                style={styles.roleImg}
                                resizeMode="contain"
                            />
                        </Animated.View>

                        {/* Role badge */}
                        <View style={[styles.roleBadge, { backgroundColor: primary + '33', borderColor: primary + '66' }]}>
                            <Ionicons
                                name={isFreelancer ? 'briefcase-outline' : 'sparkles-outline'}
                                size={12}
                                color={primary}
                            />
                            <Text style={[styles.roleBadgeText, { color: primary }]}>
                                {isFreelancer ? 'Freelancer' : 'Creator'}
                            </Text>
                        </View>

                        {/* Close button */}
                        <TouchableOpacity style={styles.closeBtn} onPress={onDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
                        </TouchableOpacity>
                    </LinearGradient>

                    {/* ── Content ─────────────────────────────── */}
                    <View style={styles.content}>

                        {/* Progress dots */}
                        <View style={styles.progressRow}>
                            {[0, 1, 2].map((i) => (
                                <View
                                    key={i}
                                    style={[styles.progressDot, i === 0 && { backgroundColor: primary, width: 20 }]}
                                />
                            ))}
                        </View>

                        <Text style={styles.title}>Complete Your Profile</Text>
                        <Text style={styles.subtitle}>
                            {action
                                ? `To ${action}, please finish setting up your ${isFreelancer ? 'freelancer' : 'creator'} profile first.`
                                : `Set up your ${isFreelancer ? 'freelancer' : 'creator'} profile to unlock collaborations, chats, and more.`
                            }
                        </Text>

                        {/* Feature highlights */}
                        <View style={[styles.featureRow, { backgroundColor: soft }]}>
                            {[
                                { icon: 'people-outline', label: 'Collabs' },
                                { icon: 'chatbubble-ellipses-outline', label: 'Chats' },
                                { icon: 'call-outline', label: 'Calls' },
                            ].map(({ icon, label }) => (
                                <View key={label} style={styles.featureItem}>
                                    <Ionicons name={icon as any} size={18} color={primary} />
                                    <Text style={[styles.featureLabel, { color: primary }]}>{label}</Text>
                                </View>
                            ))}
                        </View>

                        {/* CTA */}
                        <TouchableOpacity onPress={onComplete} activeOpacity={0.85}>
                            <LinearGradient
                                colors={[primary, gradEnd]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.primaryBtn}
                            >
                                <Text style={styles.primaryBtnText}>Complete Profile</Text>
                                <Ionicons name="arrow-forward" size={17} color="#fff" />
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.laterBtn} onPress={onDismiss} activeOpacity={0.7}>
                            <Text style={styles.laterBtnText}>Maybe Later</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const CARD_WIDTH = width - 48;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.72)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    card: {
        width: CARD_WIDTH,
        backgroundColor: '#0E0E16',
        borderRadius: 28,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },

    // ── Gradient top ──
    gradientTop: {
        height: 200,
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 20,
        overflow: 'hidden',
    },
    decorCircle: {
        position: 'absolute',
        borderRadius: 999,
        borderWidth: 1,
    },
    decorCircle1: {
        width: 180,
        height: 180,
        top: -60,
        left: -40,
    },
    decorCircle2: {
        width: 220,
        height: 220,
        top: -90,
        right: -60,
    },
    starsImg: {
        position: 'absolute',
        width: 80,
        height: 80,
        top: 8,
        right: 24,
        opacity: 0.8,
    },
    roleImg: {
        width: 120,
        height: 120,
        marginBottom: 6,
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
    },
    roleBadgeText: {
        fontSize: 11,
        fontFamily: 'Poppins_600SemiBold',
        letterSpacing: 0.3,
    },
    closeBtn: {
        position: 'absolute',
        top: 14,
        right: 14,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ── Content ──
    content: {
        paddingHorizontal: 22,
        paddingTop: 20,
        paddingBottom: 24,
    },
    progressRow: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 14,
    },
    progressDot: {
        height: 4,
        width: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    title: {
        color: '#fff',
        fontSize: 20,
        fontFamily: 'Poppins_700Bold',
        lineHeight: 28,
        marginBottom: 8,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.55)',
        fontSize: 13,
        fontFamily: 'Poppins_400Regular',
        lineHeight: 20,
        marginBottom: 18,
    },
    featureRow: {
        flexDirection: 'row',
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 8,
        marginBottom: 20,
        justifyContent: 'space-around',
    },
    featureItem: {
        alignItems: 'center',
        gap: 5,
    },
    featureLabel: {
        fontSize: 11,
        fontFamily: 'Poppins_600SemiBold',
    },
    primaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 15,
        borderRadius: 50,
        marginBottom: 10,
    },
    primaryBtnText: {
        color: '#fff',
        fontSize: 15,
        fontFamily: 'Poppins_600SemiBold',
    },
    laterBtn: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    laterBtnText: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 13,
        fontFamily: 'Poppins_400Regular',
    },
});
