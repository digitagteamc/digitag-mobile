import { useRouter } from 'expo-router';
import React, { useState, useRef } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { checkBrandStatus, checkCreatorStatus, requestOtp, verifyOtp } from '../services/userService';
import { LinearGradient } from 'expo-linear-gradient';
import GradientButton from '../Components/ui/GradientButton';

export default function LoginScreen() {
    const router = useRouter();
    const { login, loginAsGuest } = useAuth();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Phone, 2: OTP
    const otpInputRef = useRef<TextInput>(null);

    const handleRequestOtp = async () => {
        if (phoneNumber.trim().length < 10) {
            Alert.alert("Invalid Number", "Please enter a valid phone number.");
            return;
        }

        setLoading(true);
        try {
            const res = await requestOtp(phoneNumber.replace(/\s+/g, ''));
            if (res.success) {
                setStep(2);
                // We'll focus the hidden OTP input automatically in Step 2 rendering
            } else {
                Alert.alert("Error", res.error || "Failed to send OTP.");
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (otp.length < 4) {
            Alert.alert("Invalid OTP", "Please enter the 4-digit code.");
            return;
        }

        setLoading(true);
        try {
            const cleanPhone = phoneNumber.replace(/\s+/g, '');
            const res = await verifyOtp(cleanPhone, otp);

            console.log("🔐 verifyOtp FULL result:", JSON.stringify(res, null, 2));

            if (res.success) {
                const resAny = res as any;
                const token = resAny.token || resAny.accessToken || resAny.access_token || resAny.jwt || '';
                const userRoleFromBackend = res.user?.role || (res as any).role;
                const userIdFromBackend = res.user?.id || (res as any).id;
                if (res.needsRegistration || res.isNewUser) {
                    Alert.alert("User Not Existed", "This number is not registered yet. Later I will implement the signup page. Please use an available user.");
                    return;
                }
                
                login(cleanPhone, token || 'session-active', userRoleFromBackend, userIdFromBackend);
                await checkStatusAndNavigate(cleanPhone, token || 'session-active', userRoleFromBackend);
            } else {
                Alert.alert("Login Failed", res.error || "Invalid OTP.");
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "Verification failed.");
        } finally {
            setLoading(false);
        }
    };

    const checkStatusAndNavigate = async (phone: string, authToken: string, role: string) => {
        try {
            const normalizedRole = role?.toUpperCase();

            // ── FREELANCER: no approval flow, go straight to home ──
            if (normalizedRole === 'FREELANCER') {
                router.replace('/(tabs)');
                return;
            }

            // ── BRAND: check brand approval status ──
            if (normalizedRole === 'BRAND') {
                const brandRes = await checkBrandStatus(authToken);
                const brandStatus = brandRes.success && brandRes.data
                    ? (brandRes.data.brandStatus || brandRes.data.status)
                    : 'NOT_REGISTERED';
                if (brandStatus === 'APPROVED') {
                    router.replace('/(tabs)');
                } else {
                    router.replace({ pathname: '/signup/pending', params: { role: 'BRAND' } });
                }
                return;
            }

            // ── CREATOR: check creator approval status ──
            if (normalizedRole === 'CREATOR') {
                const creatorRes = await checkCreatorStatus(authToken);
                const creatorStatus = creatorRes.success && creatorRes.data
                    ? (creatorRes.data.creatorStatus || creatorRes.data.status)
                    : 'NOT_APPLIED';
                if (creatorStatus === 'APPROVED') {
                    router.replace('/(tabs)');
                } else {
                    router.replace('/signup/pending');
                }
                return;
            }

            // ── Unknown role ──
            router.replace('/(tabs)');
        } catch (e) {
            console.error("Status check error:", e);
            router.replace('/(tabs)');
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#000000', '#201242']} style={StyleSheet.absoluteFill} />
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
                    
                    {step === 1 ? (
                        <View style={styles.contentCentered}>
                            {/* Visual Logo for Step 1 */}
                            <View style={styles.logoContainer}>
                                <View style={styles.chevronTopContainer}>
                                    <View style={styles.chevronPart1} />
                                    <View style={styles.chevronPart2} />
                                </View>
                                <View style={styles.chevronBottomContainer}>
                                    <View style={styles.chevronPart1b} />
                                    <View style={styles.chevronPart2b} />
                                </View>
                            </View>
                            
                            <Text style={styles.titleCentered}>Login</Text>
                            <Text style={styles.subtitleCentered}>
                                Enter your mobile number and we'll send you a verification code to get started
                            </Text>
 
                            <View style={styles.inputContainer}>
                                <View style={styles.countryCode}>
                                    <View style={styles.flagCircle}>
                                        <View style={styles.flagStripeOrange} />
                                        <View style={styles.flagStripeWhite}><View style={styles.chakra} /></View>
                                        <View style={styles.flagStripeGreen} />
                                    </View>
                                    <Text style={styles.countryText}>India +91</Text>
                                    <Text style={styles.dropdownIcon}>v</Text>
                                </View>
                                <TextInput
                                    style={styles.inputExpanded}
                                    placeholder="Enter Mobile Number"
                                    placeholderTextColor="#888"
                                    keyboardType="phone-pad"
                                    value={phoneNumber}
                                    onChangeText={setPhoneNumber}
                                    maxLength={15}
                                    autoFocus
                                />
                            </View>

                            {loading ? (
                                <ActivityIndicator color="#C3CE21" style={{ marginVertical: 20 }} />
                            ) : (
                                <GradientButton title="Get OTP" onPress={handleRequestOtp} containerStyle={styles.buttonContainer} />
                            )}

                            <Text style={styles.termsText}>
                                By continuing, I confirm that i am at least 18 years old, and agree to{' '}
                                <Text style={styles.termsHighlight}>Terms & Conditions</Text> and{' '}
                                <Text style={styles.termsHighlight}>Privacy Policy</Text>
                            </Text>
                            
                            <TouchableOpacity style={styles.skipButton} onPress={() => { loginAsGuest(); router.replace('/(tabs)'); }}>
                                <Text style={styles.skipText}>Skip for now</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.contentTopAligned}>
                            <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
                                <Text style={styles.backButtonIcon}>{'<'}</Text>
                            </TouchableOpacity>

                            <Text style={styles.titleLeft}>Enter the Code</Text>
                            <Text style={styles.subtitleLeft}>
                                Enter OTP Received on <Text style={styles.boldText}>+91 {phoneNumber}</Text>
                            </Text>

                            {/* 4 Digit OTP Boxes */}
                            <TouchableOpacity activeOpacity={1} onPress={() => otpInputRef.current?.focus()} style={styles.otpRow}>
                                {[0, 1, 2, 3].map((index) => {
                                    const digit = otp[index];
                                    const isActive = otp.length === index;
                                    return (
                                        <View key={index} style={[styles.otpBox, isActive && styles.otpBoxActive]}>
                                            <Text style={styles.otpText}>{digit ? '•' : ''}</Text>
                                        </View>
                                    );
                                })}
                            </TouchableOpacity>

                            {/* Hidden TextInput handling real input */}
                            <TextInput
                                ref={otpInputRef}
                                style={styles.hiddenInput}
                                value={otp}
                                onChangeText={setOtp}
                                keyboardType="number-pad"
                                maxLength={4}
                                autoFocus
                            />

                            <Text style={styles.resendInfo}>
                                You can resend the code in 24 seconds
                            </Text>

                            {loading ? (
                                <ActivityIndicator color="#C3CE21" style={{ marginVertical: 20 }} />
                            ) : (
                                <GradientButton title="Next" onPress={handleVerifyOtp} containerStyle={styles.buttonContainer} />
                            )}

                            <TouchableOpacity style={styles.resendButton} onPress={handleRequestOtp}>
                                <Text style={styles.resendText}>Resend</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    keyboardView: { flex: 1 },
    
    // Step 1 styling
    contentCentered: { flex: 1, justifyContent: 'center', paddingHorizontal: 30, alignItems: 'center' },
    logoContainer: { height: 120, width: 80, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    chevronTopContainer: { transform: [{ rotate: '45deg' }, { translateX: -10 }, { translateY: 0 }] },
    chevronPart1: { width: 30, height: 14, backgroundColor: '#D1E61A', borderRadius: 7 },
    chevronPart2: { width: 14, height: 30, backgroundColor: '#D1E61A', borderRadius: 7, position: 'absolute', right: 0, top: 0 },
    chevronBottomContainer: { transform: [{ rotate: '-135deg' }, { translateX: -10 }, { translateY: -25 }] },
    chevronPart1b: { width: 30, height: 14, backgroundColor: '#D1E61A', borderRadius: 7 },
    chevronPart2b: { width: 14, height: 30, backgroundColor: '#D1E61A', borderRadius: 7, position: 'absolute', right: 0, top: 0 },
    
    titleCentered: { fontSize: 36, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 16 },
    subtitleCentered: { fontSize: 13, color: '#A0A0B0', textAlign: 'center', marginBottom: 36, lineHeight: 20, paddingHorizontal: 10 },
    
    inputContainer: { flexDirection: 'row', backgroundColor: '#34264A', borderRadius: 30, paddingHorizontal: 20, paddingVertical: 14, alignItems: 'center', marginBottom: 24, width: '100%', minHeight: 60 },
    countryCode: { flexDirection: 'row', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#4f4066', paddingRight: 10, marginRight: 10 },
    flagCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', overflow: 'hidden', marginRight: 8 },
    flagStripeOrange: { flex: 1, backgroundColor: '#FF9933' },
    flagStripeWhite: { flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
    flagStripeGreen: { flex: 1, backgroundColor: '#138808' },
    chakra: { width: 6, height: 6, borderRadius: 3, borderWidth: 1, borderColor: '#000080' },
    countryText: { color: '#fff', fontSize: 14, fontWeight: '600', marginRight: 6 },
    dropdownIcon: { color: '#B0A0C0', fontSize: 12, transform: [{ scaleX: 1.5 }, { scaleY: 0.8 }], marginLeft: 4, fontWeight: '900' },
    inputExpanded: { flex: 1, color: '#fff', fontSize: 16, minHeight: 30 },
    
    // Step 2 styling (OTP)
    contentTopAligned: { flex: 1, paddingTop: 40, paddingHorizontal: 24 },
    backButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#4d4d63', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
    backButtonIcon: { color: '#fff', fontSize: 18, fontWeight: '600', paddingBottom: 2 },
    titleLeft: { fontSize: 30, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
    subtitleLeft: { fontSize: 14, color: '#A0A0B0', marginBottom: 40 },
    boldText: { color: '#fff', fontWeight: 'bold' },
    
    otpRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 30, paddingHorizontal: 10 },
    otpBox: { flex: 1, aspectRatio: 1, borderRadius: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
    otpBoxActive: { borderColor: '#fff' },
    otpText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    hiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0 },
    
    resendInfo: { color: '#D4D4D4', fontSize: 14, textAlign: 'center', marginBottom: 40 },
    resendButton: { marginTop: 24, alignItems: 'center' },
    resendText: { color: '#A58BFF', fontSize: 16, fontWeight: '600' },

    buttonContainer: { width: '100%', marginBottom: 20 },
    termsText: { color: '#A0A0B0', fontSize: 11, textAlign: 'center', marginTop: 20, lineHeight: 18 },
    termsHighlight: { color: '#D1E61A', fontWeight: 'bold' },
    skipButton: { marginTop: 24 },
    skipText: { color: '#6A5B80', fontSize: 14, textDecorationLine: 'underline' }
});