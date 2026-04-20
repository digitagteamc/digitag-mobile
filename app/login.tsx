import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
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
import { requestOtp, verifyOtp } from '../services/userService';
import { LinearGradient } from 'expo-linear-gradient';
import GradientButton from '../Components/ui/GradientButton';

type SignupRole = 'CREATOR' | 'FREELANCER';

export default function LoginScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ role?: string }>();
    const role: SignupRole = (params.role?.toUpperCase() === 'FREELANCER') ? 'FREELANCER' : 'CREATOR';

    const { login, loginAsGuest } = useAuth();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [devCode, setDevCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Phone, 2: OTP
    const [countdown, setCountdown] = useState(0);
    const otpInputRef = useRef<TextInput>(null);

    React.useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (countdown > 0) {
            interval = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [countdown]);

    const [phoneError, setPhoneError] = useState<string | null>(null);
    const [otpError, setOtpError] = useState<string | null>(null);

    const validatePhone = (v: string): string | null => {
        const digits = v.replace(/\D/g, '');
        if (!digits) return 'Mobile number is required';
        if (digits.length !== 10) return 'Enter a valid 10-digit mobile number';
        if (!/^[6-9]/.test(digits)) return 'Number must start with 6, 7, 8 or 9';
        return null;
    };

    const handleRequestOtp = async () => {
        const err = validatePhone(phoneNumber);
        if (err) { setPhoneError(err); return; }
        setPhoneError(null);

        setLoading(true);
        setOtpError(null);
        try {
            const res = await requestOtp(phoneNumber.replace(/\s+/g, ''), role);
            if (res.success) {
                // Backend returns `devCode` in non-production mode for testing.
                const code = (res as any).devCode as string | undefined;
                if (code) {
                    setDevCode(code);
                    setOtp(code); // prefill for convenience
                }
                setCountdown((res as any).resendCooldownSeconds ?? 30);
                setStep(2);
            } else {
                // If the backend told us to back off, keep the OTP step open so
                // a user who already received a previous code can still enter it.
                if ('retryAfterSeconds' in res && res.retryAfterSeconds) {
                    setCountdown(res.retryAfterSeconds as number);
                    setStep(2);
                    setOtpError(res.error || 'Please wait before requesting again.');
                } else {
                    Alert.alert('Error', res.error || 'Failed to send OTP.');
                }
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp.trim()) { setOtpError('Please enter the OTP.'); return; }
        if (!/^\d+$/.test(otp)) { setOtpError('OTP must contain digits only.'); return; }
        if (otp.length !== 6) { setOtpError('OTP must be exactly 6 digits.'); return; }

        setLoading(true);
        setOtpError(null);
        try {
            const cleanPhone = phoneNumber.replace(/\s+/g, '');
            const res = await verifyOtp(cleanPhone, otp, role);

            if (!res.success) {
                // Surface structured error (attempts remaining, etc.) inline
                // instead of a noisy alert so the user can try again quickly.
                setOtpError(res.error || 'Invalid OTP.');
                return;
            }

            const verifiedRole = (res.user?.role as string | undefined) ?? role;
            const userIdFromBackend = res.user?.id;

            const profileDone = Boolean(res.isProfileCompleted);

            login({
                phone: cleanPhone,
                token: res.token,
                refreshToken: res.refreshToken,
                role: verifiedRole,
                id: userIdFromBackend,
                isProfileCompleted: profileDone,
                profiles: res.profiles as any,
            });

            router.replace('/(tabs)');
        } catch (error: any) {
            setOtpError(error.message || 'Verification failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#000000', '#201242']} style={StyleSheet.absoluteFill} />
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
                    
                    {step === 1 ? (
                        <View style={styles.contentCentered}>
                            {/* Back to role selection */}
                            <TouchableOpacity
                                style={styles.step1BackButton}
                                onPress={() => (router.canGoBack() ? router.back() : router.replace('/role-selection'))}
                            >
                                <Text style={styles.backButtonIcon}>{'<'}</Text>
                            </TouchableOpacity>

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
 
                            <View style={[styles.inputContainer, phoneError ? styles.inputContainerError : null]}>
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
                                    onChangeText={v => {
                                        const digits = v.replace(/\D/g, '').slice(0, 10);
                                        setPhoneNumber(digits);
                                        if (phoneError) setPhoneError(null);
                                    }}
                                    maxLength={10}
                                    autoFocus
                                />
                            </View>
                            {phoneError ? <Text style={styles.fieldErrorText}>{phoneError}</Text> : null}

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

                            {devCode && (
                                <View style={styles.devCodeBanner}>
                                    <Text style={styles.devCodeLabel}>DEV OTP (no SMS yet)</Text>
                                    <Text style={styles.devCodeValue}>{devCode}</Text>
                                </View>
                            )}

                            {/* 6 Digit OTP Boxes */}
                            <TouchableOpacity activeOpacity={1} onPress={() => otpInputRef.current?.focus()} style={styles.otpRow}>
                                {[0, 1, 2, 3, 4, 5].map((index) => {
                                    const digit = otp[index];
                                    const isActive = otp.length === index;
                                    return (
                                        <View key={index} style={[styles.otpBox, isActive && styles.otpBoxActive]}>
                                            <Text style={styles.otpText}>{digit || ''}</Text>
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
                                maxLength={6}
                                autoFocus
                            />

                            {otpError ? (
                                <Text style={styles.otpErrorText}>{otpError}</Text>
                            ) : null}

                            {countdown > 0 ? (
                                <Text style={styles.resendInfo}>
                                    You can resend the code in {countdown} seconds
                                </Text>
                            ) : (
                                <Text style={styles.resendInfo}>
                                    Did not receive the code?
                                </Text>
                            )}

                            {loading ? (
                                <ActivityIndicator color="#C3CE21" style={{ marginVertical: 20 }} />
                            ) : (
                                <GradientButton title="Next" onPress={handleVerifyOtp} containerStyle={styles.buttonContainer} />
                            )}

                            <TouchableOpacity 
                                style={[styles.resendButton, countdown > 0 && { opacity: 0.5 }]} 
                                onPress={handleRequestOtp}
                                disabled={countdown > 0 || loading}
                            >
                                <Text style={styles.resendText}>Resend OTP</Text>
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
    
    inputContainer: { flexDirection: 'row', backgroundColor: '#34264A', borderRadius: 30, paddingHorizontal: 20, paddingVertical: 14, alignItems: 'center', marginBottom: 8, width: '100%', minHeight: 60 },
    inputContainerError: { borderWidth: 1.5, borderColor: '#EF4444' },
    fieldErrorText: { color: '#EF4444', fontSize: 12, textAlign: 'center', marginBottom: 16, fontWeight: '500' },
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
    step1BackButton: { position: 'absolute', top: 16, left: 16, width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#4d4d63', justifyContent: 'center', alignItems: 'center' },
    backButtonIcon: { color: '#fff', fontSize: 18, fontWeight: '600', paddingBottom: 2 },
    titleLeft: { fontSize: 30, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
    subtitleLeft: { fontSize: 14, color: '#A0A0B0', marginBottom: 40 },
    boldText: { color: '#fff', fontWeight: 'bold' },
    
    otpRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 30, paddingHorizontal: 10 },
    otpBox: { flex: 1, aspectRatio: 1, borderRadius: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
    otpBoxActive: { borderColor: '#fff' },
    otpText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    hiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0 },
    
    devCodeBanner: {
        backgroundColor: 'rgba(195, 206, 33, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(195, 206, 33, 0.45)',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 18,
        alignItems: 'center',
    },
    devCodeLabel: { color: '#C3CE21', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
    devCodeValue: { color: '#fff', fontSize: 22, fontWeight: '700', letterSpacing: 6, marginTop: 4 },
    otpErrorText: { color: '#EF4444', fontSize: 13, textAlign: 'center', marginBottom: 14, fontWeight: '500' },
    resendInfo: { color: '#D4D4D4', fontSize: 14, textAlign: 'center', marginBottom: 40 },
    resendButton: { marginTop: 24, alignItems: 'center' },
    resendText: { color: '#A58BFF', fontSize: 16, fontWeight: '600' },

    buttonContainer: { width: '100%', marginBottom: 20 },
    termsText: { color: '#A0A0B0', fontSize: 11, textAlign: 'center', marginTop: 20, lineHeight: 18 },
    termsHighlight: { color: '#D1E61A', fontWeight: 'bold' },
    skipButton: { marginTop: 24 },
    skipText: { color: '#6A5B80', fontSize: 14, textDecorationLine: 'underline' }
});