import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, Mail } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Assets
const logoImg = require('../assets/Brands/Asset 11.png');
const agencyMockupImg = require('../assets/Brands/angencycommingsoon.png');

export default function AgencyComingSoonScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleNotifyMe = () => {
        if (!email) return;
        setLoading(true);
        // Simulate subscription
        setTimeout(() => {
            setLoading(false);
            alert('Thank you! We will notify you when we launch.');
            setEmail('');
        }, 1500);
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Top Glow Gradient - Unified Agency Theme (Lime/Yellow) */}
            <View style={styles.topGlowContainer} pointerEvents="none">
                <LinearGradient
                    colors={['rgba(223, 255, 0, 0.16)', 'rgba(223, 255, 0, 0.08)', 'transparent']}
                    style={styles.topGlow}
                />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.contentWrapper}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.backButton}
                        >
                            <ChevronLeft color="#FFFFFF" size={24} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.mainContent}>
                        {/* Logo and Brand Name */}
                        <Image
                            source={logoImg}
                            style={styles.logo}
                            resizeMode="contain"
                        />

                        {/* Title Section */}
                        <View style={styles.titleContainer}>
                            <Text style={styles.comingSoonText}>Coming Soon</Text>
                            <Text style={styles.subText}>
                                Something amazing is on the way. We're building the ultimate creator marketing platform for agencies.
                            </Text>
                        </View>

                        {/* Dashboard Mockup - This will grow to fill available space */}
                        <View style={styles.mockupContainer}>
                            <Image
                                source={agencyMockupImg}
                                style={styles.mockupImage}
                                resizeMode="contain"
                            />
                        </View>

                        {/* Bottom Section with unified background */}
                        <View style={styles.bottomContainer}>
                            {/* Subscription Section */}
                            <View style={styles.subscribeSection}>
                                <Text style={styles.subscribeTitle}>Be the first to know!</Text>
                                <Text style={styles.subscribeSubtext}>
                                    Subscribe and get notified when we launch.
                                </Text>

                                <View style={styles.inputContainer}>
                                    <View style={styles.inputWrapper}>
                                        <Mail color="rgba(255, 255, 255, 0.6)" size={18} style={styles.mailIcon} />
                                        <TextInput
                                            placeholder="Enter your agency email"
                                            placeholderTextColor="rgba(255, 255, 255, 0.4)"
                                            style={styles.input}
                                            value={email}
                                            onChangeText={setEmail}
                                            autoCapitalize="none"
                                            keyboardType="email-address"
                                        />
                                    </View>

                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        onPress={handleNotifyMe}
                                        disabled={loading}
                                        style={styles.buttonContainer}
                                    >
                                        <LinearGradient
                                            colors={['#DFFF00', '#BFFF00']}
                                            style={styles.button}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        >
                                            {loading ? (
                                                <ActivityIndicator color="#000000" />
                                            ) : (
                                                <Text style={styles.buttonText}>Notify Me</Text>
                                            )}
                                        </LinearGradient>
                                        <View style={styles.buttonShadow} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Social Links */}
                            <View style={styles.socialContainer}>
                                <Text style={styles.followText}>Follow us for updates</Text>
                                <View style={styles.socialIconsRow}>
                                    <TouchableOpacity style={styles.socialIconCircle}>
                                        <FontAwesome5 name="instagram" size={18} color="#FFFFFF" />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.socialIconCircle}>
                                        <FontAwesome5 name="twitter" size={16} color="#FFFFFF" />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.socialIconCircle}>
                                        <FontAwesome5 name="linkedin-in" size={16} color="#FFFFFF" />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.socialIconCircle}>
                                        <FontAwesome5 name="facebook-f" size={16} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A10',
    },
    topGlowContainer: {
        position: 'absolute',
        top: -150,
        left: (width - 600) / 2,
        width: 600,
        height: 400,
        zIndex: 0,
    },
    topGlow: {
        width: 600,
        height: 600,
        borderRadius: 300,
        overflow: 'hidden',
    },
    contentWrapper: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 8,
        height: 50,
        justifyContent: 'center',
    },
    backButton: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainContent: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 0,
        justifyContent: 'space-between',
    },
    logo: {
        width: 180,
        height: 72,
        marginTop: 10,
    },
    titleContainer: {
        alignItems: 'center',
        marginTop: 8,
        paddingHorizontal: 24,
    },
    comingSoonText: {
        fontSize: 46,
        fontFamily: 'poppins-bold',
        fontWeight: '900',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 4,
    },
    subText: {
        fontSize: 12,
        fontFamily: 'poppins-regular',
        color: '#88889D',
        textAlign: 'center',
        lineHeight: 18,
        fontWeight: '400',
        paddingHorizontal: 20,
        
    },
    mockupContainer: {
        flex: 1,
        width: width * 0.9,
        alignItems: 'center',
        justifyContent: 'center',
        
        position: 'relative',
    },
    mockupImage: {
        width: '100%',
        height: '100%',
        zIndex: 2,
    },
    bottomContainer: {
        width: '100%',
        backgroundColor: '#0B0F1B',
        paddingTop: 30,
        paddingBottom: 20,
        paddingHorizontal: 24,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        alignItems: 'center',
    },
    subscribeSection: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 15,
    },
    subscribeTitle: {
        fontSize: 18,
        fontFamily: 'poppins-bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    subscribeSubtext: {
        fontSize: 12,
        fontFamily: 'poppins-regular',
        color: 'rgba(255, 255, 255, 0.5)',
        marginBottom: 16,
        fontWeight: '600',
    },
    inputContainer: {
        width: '100%',
        gap: 12,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 14,
        paddingHorizontal: 16,
        height: 54,
    },
    mailIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'poppins-regular',
    },
    buttonContainer: {
        position: 'relative',
    },
    button: {
        height: 54,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    buttonText: {
        color: '#000000', // Black text on lime button
        fontSize: 16,
        fontFamily: 'poppins-semibold',
    },
    buttonShadow: {
        position: 'absolute',
        top: 2,
        left: 0,
        right: 0,
        bottom: -2,
        backgroundColor: '#DFFF00',
        borderRadius: 14,
        opacity: 0.2,
        zIndex: 1,
    },
    socialContainer: {
        alignItems: 'center',
        marginTop: 10,
    },
    followText: {
        fontSize: 12,
        fontFamily: 'poppins-regular',
        color: 'rgba(255, 255, 255, 0.4)',
        marginBottom: 12,
    },
    socialIconsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    socialIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
