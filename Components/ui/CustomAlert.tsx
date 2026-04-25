import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Modal, StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import GradientButton from './GradientButton';
import { palette } from '../../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CustomAlertProps {
    visible: boolean;
    title: string;
    message: string;
    onClose: () => void;
    primaryButtonText?: string;
    type?: 'success' | 'error' | 'info';
    role?: 'CREATOR' | 'FREELANCER';
}

export default function CustomAlert({
    visible,
    title,
    message,
    onClose,
    primaryButtonText = 'Okay',
    type = 'info',
    role = 'CREATOR'
}: CustomAlertProps) {
    // Role-based theme colors
    const isFreelancer = role === 'FREELANCER';
    const primaryGradient: [string, string, ...string[]] = isFreelancer 
        ? ['#F26930', '#FF832A', '#F26930'] 
        : ['#F02C8C', '#F15DAB', '#F02C8C'];
    
    const shadowColor = isFreelancer ? '#F26930' : '#F02C8C';

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Glassmorphism background effect */}
                    <View style={styles.blurBg} />
                    
                    <View style={styles.content}>
                        {/* Status Icon Indicator (optional) */}
                        <View style={[styles.iconIndicator, { backgroundColor: shadowColor + '20' }]}>
                            <View style={[styles.iconInner, { backgroundColor: shadowColor }]} />
                        </View>

                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.message}>{message}</Text>
                        
                        <GradientButton
                            title={primaryButtonText}
                            onPress={onClose}
                            colors={primaryGradient}
                            shadowColor={shadowColor}
                            className="w-full h-[56px]"
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    container: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 32,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: '#1A1A1A',
        position: 'relative',
    },
    blurBg: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(26, 26, 26, 0.95)',
    },
    content: {
        padding: 32,
        alignItems: 'center',
    },
    iconIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginBottom: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconInner: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 22,
        fontFamily: 'Poppins_600SemiBold',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    message: {
        color: '#A0A0B0',
        fontSize: 14,
        fontFamily: 'Poppins_400Regular',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
    },
});
