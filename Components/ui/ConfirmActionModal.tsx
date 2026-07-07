import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

interface Props {
    visible: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    confirmColor?: string;
    busy?: boolean;
    onConfirm: () => void;
    onDismiss: () => void;
}

export default function ConfirmActionModal({
    visible,
    title,
    message,
    confirmLabel,
    confirmColor = '#E23744',
    busy = false,
    onConfirm,
    onDismiss,
}: Props) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss} statusBarTranslucent>
            <View style={styles.overlay}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
                <View style={styles.card}>
                    <TouchableOpacity style={styles.closeBtn} onPress={onDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <BlurView intensity={20} tint="light" style={styles.closeBtnInner}>
                            <Ionicons name="close" size={18} color="#fff" />
                        </BlurView>
                    </TouchableOpacity>

                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <TouchableOpacity
                        onPress={onConfirm}
                        activeOpacity={0.8}
                        disabled={busy}
                        style={[styles.confirmBtn, { backgroundColor: confirmColor, opacity: busy ? 0.6 : 1 }]}
                    >
                        <Text style={styles.confirmBtnText}>{busy ? 'Please wait…' : confirmLabel}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.cancelBtn} onPress={onDismiss} activeOpacity={0.7} disabled={busy}>
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
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
        borderRadius: 28,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        padding: 28,
        paddingTop: 36,
    },
    closeBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
    },
    closeBtnInner: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    title: {
        color: '#fff',
        fontSize: 20,
        fontFamily: 'Poppins_700Bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    message: {
        color: 'rgba(255,255,255,0.55)',
        fontSize: 14,
        fontFamily: 'Poppins_400Regular',
        lineHeight: 20,
        textAlign: 'center',
        marginBottom: 26,
    },
    confirmBtn: {
        width: '100%',
        paddingVertical: 15,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    confirmBtnText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Poppins_600SemiBold',
    },
    cancelBtn: {
        width: '100%',
        paddingVertical: 15,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    cancelBtnText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Poppins_500Medium',
    },
});
