import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { checkBrandStatus, checkCreatorStatus, requestOtp, verifyOtp } from '../services/userService';

export default function LoginScreen() {
    const router = useRouter();
    const { login, loginAsGuest } = useAuth();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Phone, 2: OTP

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
                Alert.alert("OTP Sent", "Check your phone. Dev OTP: 1234");
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
                // Try every common token field name
                const resAny = res as any;
                const token = resAny.token || resAny.accessToken || resAny.access_token || resAny.jwt || '';

                if (!token) {
                    console.warn("⚠️ NO TOKEN returned from verify-otp! Backend response keys:", Object.keys(res));
                    console.warn("⚠️ Proceeding without token — backend may use cookies or the token field name is different.");
                }

                // Save to context (role determined later, but if user object has it, set it now)
                const userRoleFromBackend = res.user?.role || (res as any).role;
                login(cleanPhone, token || 'session-active', userRoleFromBackend);

                if (res.needsRegistration || res.isNewUser) {
                    console.log("🆕 New user → role selection");
                    router.replace('/signup/role-selection');
                } else {
                    // Existing user → check their status
                    console.log("👤 Existing user → checking status...");
                    await checkStatusAndNavigate(cleanPhone, token || 'session-active');
                }
            } else {
                Alert.alert("Login Failed", res.error || "Invalid OTP.");
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "Verification failed.");
        } finally {
            setLoading(false);
        }
    };

    const checkStatusAndNavigate = async (phone: string, authToken: string) => {
        try {
            // Fetch status from the backend
            // Since both creator/me/status and brands/me/status return the user's current role
            const creatorRes = await checkCreatorStatus(authToken);

            if (creatorRes.success && creatorRes.data) {
                const actualRole = creatorRes.data.role; // This is the source of truth
                console.log(`📊 Backend reported role: ${actualRole}`);

                if (actualRole === 'BRAND') {
                    // It's a brand — now check brand-specific status
                    const brandRes = await checkBrandStatus(authToken);
                    const brandStatus = brandRes.success && brandRes.data
                        ? (brandRes.data.brandStatus || brandRes.data.status)
                        : 'NOT_REGISTERED';

                    console.log("🏢 Brand status:", brandStatus);
                    login(phone, authToken, 'BRAND');

                    if (brandStatus === 'APPROVED') {
                        router.replace('/(tabs)');
                    } else {
                        router.replace({ pathname: '/signup/pending', params: { role: 'BRAND' } });
                    }
                } else {
                    // It's a creator
                    const creatorStatus = creatorRes.data.creatorStatus || creatorRes.data.status;
                    console.log("📊 Creator status:", creatorStatus);
                    login(phone, authToken, 'CREATOR');

                    if (creatorStatus === 'APPROVED') {
                        router.replace('/(tabs)');
                    } else {
                        router.replace('/signup/pending');
                    }
                }
                return;
            }

            // Fallback
            router.replace('/(tabs)');
        } catch (e) {
            console.error("Status check error:", e);
            router.replace('/(tabs)');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.content}>
                    <Text style={styles.logo}>Digitag</Text>
                    <View style={styles.formCard}>
                        {step === 1 ? (
                            <>
                                <Text style={styles.label}>Mobile Number</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="9876543210"
                                    placeholderTextColor="#666"
                                    keyboardType="phone-pad"
                                    value={phoneNumber}
                                    onChangeText={setPhoneNumber}
                                    maxLength={15}
                                />
                                <TouchableOpacity
                                    style={styles.button}
                                    onPress={handleRequestOtp}
                                    disabled={loading}
                                >
                                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Get OTP</Text>}
                                </TouchableOpacity>
                                <Text style={styles.hint}>We'll send a verification code.</Text>
                            </>
                        ) : (
                            <>
                                <Text style={styles.label}>Enter OTP</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="1234"
                                    placeholderTextColor="#666"
                                    keyboardType="number-pad"
                                    value={otp}
                                    onChangeText={setOtp}
                                    maxLength={6}
                                />
                                <View style={styles.buttonRow}>
                                    <TouchableOpacity
                                        style={[styles.outlineButton, { flex: 1, marginRight: 10 }]}
                                        onPress={() => setStep(1)}
                                    >
                                        <Text style={styles.outlineButtonText}>Change Number</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.button, { flex: 1.5 }]}
                                        onPress={handleVerifyOtp}
                                        disabled={loading}
                                    >
                                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify</Text>}
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>

                    {step === 1 && (
                        <TouchableOpacity
                            style={styles.skipButton}
                            onPress={() => {
                                loginAsGuest();
                                router.replace('/(tabs)');
                            }}
                        >
                            <Text style={styles.skipText}>Skip for now</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f0f1e' },
    keyboardView: { flex: 1 },
    content: { flex: 1, justifyContent: 'center', padding: 24 },
    logo: { fontSize: 42, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 40, letterSpacing: 2 },
    formCard: {
        backgroundColor: '#1e1e30',
        padding: 24,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10
    },
    label: { color: '#aaa', marginBottom: 12, fontSize: 14, fontWeight: '600', marginLeft: 4 },
    input: {
        backgroundColor: '#16162a',
        color: '#fff',
        padding: 16,
        borderRadius: 12,
        fontSize: 18,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#2e2e4e'
    },
    button: {
        backgroundColor: '#4f46e5',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    outlineButton: {
        backgroundColor: 'transparent',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#4f46e5'
    },
    outlineButtonText: { color: '#4f46e5', fontWeight: 'bold', fontSize: 16 },
    buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
    hint: { color: '#666', marginTop: 16, textAlign: 'center', fontSize: 12 },
    skipButton: { marginTop: 24, alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 20 },
    skipText: { color: '#555', fontSize: 14, textDecorationLine: 'underline' },
});