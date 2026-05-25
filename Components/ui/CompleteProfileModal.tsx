import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
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

const illustrationImg = require('../../assets/completepopup.png');

interface Props {
    visible: boolean;
    role: 'CREATOR' | 'FREELANCER' | string;
    action?: string;
    onComplete: () => void;
    onDismiss: () => void;
}

export default function CompleteProfileModal({ visible, role, action, onComplete, onDismiss }: Props) {
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
                    
                    {/* Close button */}
                    <TouchableOpacity style={styles.closeBtn} onPress={onDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <BlurView intensity={20} tint="light" style={styles.closeBtnInner}>
                            <Ionicons name="close" size={20} color="#fff" />
                        </BlurView>
                    </TouchableOpacity>

                    <View style={styles.content}>
                        {/* 3D Illustration */}
                        <Animated.View style={[styles.illustrationContainer, { transform: [{ translateY: floatAnim }] }]}>
                            <Image
                                source={illustrationImg}
                                style={styles.illustrationImg}
                                resizeMode="contain"
                            />
                        </Animated.View>

                        <Text style={styles.title}>Complete Your Profile</Text>
                        <Text style={styles.subtitle}>
                            Join the platform based on your goals and start building meaningful collaborations.
                        </Text>

                        {/* CTA Buttons */}
                        <TouchableOpacity onPress={onComplete} activeOpacity={0.8} style={styles.primaryBtnContainer}>
                            <LinearGradient
                                colors={['#ED2A91', '#ED2A51']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.primaryBtn}
                            >
                                <Text style={styles.primaryBtnText}>Next</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.laterBtn} onPress={onDismiss} activeOpacity={0.7}>
                            <BlurView intensity={10} tint="light" style={styles.laterBtnInner}>
                                <Text style={styles.laterBtnText}>Later</Text>
                            </BlurView>
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
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    card: {
        width: CARD_WIDTH,
        backgroundColor: '#17171F',
        borderRadius: 32,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        paddingBottom: 32,
    },
    closeBtn: {
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 10,
    },
    closeBtnInner: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    illustrationContainer: {
        marginTop: 40,
        marginBottom: 24,
    },
    illustrationImg: {
        width: 180,
        height: 180,
    },
    title: {
        color: '#fff',
        fontSize: 24,
        fontFamily: 'Poppins_700Bold',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 15,
        fontFamily: 'Poppins_400Regular',
        lineHeight: 22,
        textAlign: 'center',
        marginBottom: 32,
    },
    primaryBtnContainer: {
        width: '100%',
        marginBottom: 12,
    },
    primaryBtn: {
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryBtnText: {
        color: '#fff',
        fontSize: 17,
        fontFamily: 'Poppins_600SemiBold',
    },
    laterBtn: {
        width: '100%',
    },
    laterBtnInner: {
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    laterBtnText: {
        color: '#fff',
        fontSize: 17,
        fontFamily: 'Poppins_500Medium',
    },
});
