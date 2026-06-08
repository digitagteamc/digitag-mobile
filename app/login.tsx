import auth from '@react-native-firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronDownIcon, ChevronLeftIcon } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    BackHandler,
    Dimensions,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Linking,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomAlert from '../Components/ui/CustomAlert';
import GradientButton from '../Components/ui/GradientButton';
import { useAuth } from '../context/AuthContext';
import { verifyFirebaseToken } from '../services/userService';

type SignupRole = 'CREATOR' | 'FREELANCER';

export default function LoginScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ role?: string }>();
    const role: SignupRole = (params.role?.toUpperCase() === 'FREELANCER') ? 'FREELANCER' : 'CREATOR';

    const { login, loginAsGuest } = useAuth();

    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [confirm, setConfirm] = useState<any>(null);
    const [devCode, setDevCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Phone, 2: OTP
    const [countdown, setCountdown] = useState(0);
    const otpInputRef = useRef<TextInput>(null);

    // Inline validation errors
    const [phoneError, setPhoneError] = useState<string | null>(null);
    const [otpError, setOtpError] = useState<string | null>(null);

    // Status Modal state
    const [statusModal, setStatusModal] = useState({
        visible: false,
        title: '',
        message: '',
    });

    const showStatus = (title: string, message: string) => {
        setStatusModal({ visible: true, title, message });
    };

    // Countdown timer
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (countdown > 0) {
            interval = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [countdown]);


    const { height: windowHeight } = useWindowDimensions();
    const screenHeight = Dimensions.get('screen').height;
    const offScreenY = screenHeight + 100;
    const otpTranslateY = useSharedValue(offScreenY);

    const animatedSetStep = (newStep: number) => {
        if (newStep === 2) {
            setStep(2);
            otpTranslateY.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) });
        } else if (newStep === 1) {
            otpTranslateY.value = withTiming(offScreenY, { duration: 350, easing: Easing.in(Easing.cubic) });
            setTimeout(() => setStep(1), 350);
        }
    };

    const otpAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: otpTranslateY.value }],
    }));

    // Android back button
    useEffect(() => {
        const backAction = () => {
            if (step === 2) {
                animatedSetStep(1);
                return true;
            } else {
                router.replace('/role-selection');
                return true;
            }
        };
        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
    }, [step, screenHeight]);

    // ── Validation ──
    const validatePhone = (v: string): string | null => {
        const digits = v.replace(/\D/g, '');
        if (!digits) return 'Mobile number is required';
        if (digits.length !== 10) return 'Enter a valid 10-digit mobile number';
        if (!/^[6-9]/.test(digits)) return 'Number must start with 6, 7, 8 or 9';
        return null;
    };

    // ── Handlers ──
    const handleRequestOtp = async () => {
        const err = validatePhone(phoneNumber);
        if (err) { setPhoneError(err); return; }
        setPhoneError(null);
        setOtpError(null);

        // Navigate to OTP screen immediately — no loading spinner shown
        Keyboard.dismiss();
        animatedSetStep(2);

        try {
            const cleanPhone = phoneNumber.replace(/\s+/g, '');
            const confirmation = await auth().signInWithPhoneNumber(`+91${cleanPhone}`);
            setConfirm(confirmation);
            setCountdown(60);
        } catch (error: any) {
            // If Firebase fails, slide back to phone screen and surface the error
            animatedSetStep(1);
            showStatus('Error', error.message || 'Failed to send OTP.');
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp.trim()) { setOtpError('Please enter the OTP.'); return; }
        if (!/^\d+$/.test(otp)) { setOtpError('OTP must contain digits only.'); return; }
        if (otp.length !== 6) { setOtpError('OTP must be exactly 6 digits.'); return; }

        setLoading(true);
        setOtpError(null);
        try {
            if (!confirm) {
                setOtpError('Session expired. Request OTP again.');
                return;
            }

            await confirm.confirm(otp);
            const currentUser = auth().currentUser;
            if (!currentUser) throw new Error("Verification failed.");

            const idToken = await currentUser.getIdToken();
            const cleanPhone = phoneNumber.replace(/\s+/g, '');
            const res = await verifyFirebaseToken(idToken, role);

            if (!res.success) {
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
        <View className="flex-1 bg-black">
            <LinearGradient
                colors={['#000000', '#201242']}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
                {/* ── STEP 1: Phone ── */}
                <View className="flex-1">
                    {/* Fixed Header Area */}
                    <View className="px-[30px] pt-[5%] pb-4">
                        {/* Back to role selection */}
                        <TouchableOpacity
                            className="w-11 h-11 rounded-full border border-[#4d4d63] justify-center items-center mb-6"
                            onPress={() => router.replace('/role-selection')}
                        >
                            <ChevronLeftIcon color="white" size={22} />
                        </TouchableOpacity>

                        {/* Animated intro GIF */}
                        <View className="justify-center items-center h-[160px]">
                            <Image
                                source={require('../assets/videos/digitag-intro.gif')}
                                style={{ width: 210, height: 160 }}
                                resizeMode="contain"
                            />
                        </View>
                    </View>

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                    >
                        <ScrollView
                            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 30 }}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            <Text className="text-white font-poppins-bold text-[36px] text-center mb-4 mt-6">Login</Text>
                            <Text className="text-[#A0A0B0] font-poppins-regular text-[13px] text-center mb-9 leading-5 px-3">
                                Enter your mobile number and we'll send {`\n`}you a verification code to get started
                            </Text>

                    {/* Phone Input */}
                    <View
                        className={`flex-row bg-[#34264A] rounded-full px-5 py-[14px] items-center mb-2 w-full min-h-[60px] ${phoneError ? 'border border-red-500' : ''}`}
                    >
                        {/* Country Code */}
                        <View className="flex-row items-center border-r border-[#4f4066] pr-[10px] mr-[10px]">
                            <View className="w-7 h-7 rounded-full overflow-hidden mr-2 items-center justify-center bg-white">
                                <Text style={{ fontSize: 18, lineHeight: 22 }}>🇮🇳</Text>
                            </View>
                            <Text className="text-white font-poppins-semibold text-[14px] mr-1">+91</Text>
                            <ChevronDownIcon color="white" size={16} />
                        </View>
                        <TextInput
                            className="flex-1 text-white text-[16px] min-h-[30px]"
                            placeholder="Enter Mobile Number"
                            placeholderTextColor="#888"
                            keyboardType="phone-pad"
                            value={phoneNumber}
                            onChangeText={(v) => {
                                const digits = v.replace(/\D/g, '').slice(0, 10);
                                setPhoneNumber(digits);
                                if (phoneError) setPhoneError(null);
                            }}
                            maxLength={10}
                        />
                    </View>

                            {/* Phone inline error */}
                            {phoneError ? (
                                <Text className="text-red-400 font-poppins-regular text-[12px] text-center mb-3">
                                    {phoneError}
                                </Text>
                            ) : <View className="mb-3" />}

                            {loading ? (
                                <ActivityIndicator color="#C3CE21" className="my-5" />
                            ) : (
                                <GradientButton title="Get OTP" onPress={handleRequestOtp} className="w-full mb-5" />
                            )}

                            <Text className="text-[#A0A0B0] font-poppins-regular text-[11px] text-center mt-5 leading-[18px]">
                                By continuing, I confirm that i am at least 18 years old, and agree to{' '}
                                <Text
                                    className="text-[#D1E61A] font-poppins-bold"
                                    onPress={() => Linking.openURL('https://thedigitag.ai/terms-and-conditions').catch(() => {})}
                                >Terms &amp; Conditions</Text>
                                {' '}and{' '}
                                <Text
                                    className="text-[#D1E61A] font-poppins-bold"
                                    onPress={() => Linking.openURL('https://thedigitag.ai/privacy-policy').catch(() => {})}
                                >Privacy Policy</Text>
                            </Text>

                            <TouchableOpacity
                                className="mt-6 mb-10"
                                onPress={() => { loginAsGuest(); router.replace('/(tabs)'); }}
                            >
                                <Text className="text-[#6A5B80] font-poppins-regular text-[14px] underline text-center">Skip for now</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>

                {/* ── STEP 2: OTP (Animated Slide-In Overlay) ── */}
                <Animated.View
                    style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: '#000000' }, otpAnimatedStyle]}
                >
                    <LinearGradient colors={['#000000', '#201242']} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
                    <View className="flex-1">
                        {/* Fixed Header Area for Step 2 */}
                        <View className="pt-10 px-6">
                            {/* Back Button */}
                            <TouchableOpacity
                                className="w-11 h-11 rounded-full border border-[#4d4d63] justify-center items-center mb-6 mt-[40px]"
                                onPress={() => animatedSetStep(1)}
                            >
                                <ChevronLeftIcon color="white" size={22} />
                            </TouchableOpacity>
                        </View>

                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={{ flex: 1 }}
                        >
                            <ScrollView
                                contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }}
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={false}
                            >
                                <View className="px-6">
                                    <Text className="text-white font-poppins-semibold text-[26px] mb-[10px]">Enter the Code</Text>
                                    <Text className="text-[#A0A0B0] font-poppins-regular text-[14px] mb-6">
                                        Enter OTP Received on{' '}
                                        <Text className="text-white font-poppins-semibold">+91 {phoneNumber}</Text>
                                    </Text>

                                    {/* Dev OTP Banner */}
                                    {devCode && (
                                        <View
                                            style={{
                                                backgroundColor: 'rgba(195,206,33,0.12)',
                                                borderWidth: 1,
                                                borderColor: 'rgba(195,206,33,0.45)',
                                                borderRadius: 12,
                                                paddingHorizontal: 14,
                                                paddingVertical: 10,
                                                marginBottom: 18,
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Text style={{ color: '#C3CE21', fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>
                                                DEV OTP (no SMS yet)
                                            </Text>
                                            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700', letterSpacing: 6, marginTop: 4 }}>
                                                {devCode}
                                            </Text>
                                        </View>
                                    )}

                                    {/* 6-Digit OTP Boxes */}
                                    <TouchableOpacity
                                        activeOpacity={1}
                                        onPress={() => otpInputRef.current?.focus()}
                                        className="flex-row justify-between gap-[8px] mb-[20px] px-[4px]"
                                    >
                                        {[0, 1, 2, 3, 4, 5].map((index) => {
                                            const digit = otp[index];
                                            const isActive = otp.length === index;
                                            return (
                                                <View
                                                    key={index}
                                                    className={`flex-1 aspect-square rounded-[18px] border justify-center items-center ${isActive ? 'border-white' : 'border-white/10'}`}
                                                >
                                                    <Text className="text-white text-[22px] font-poppins-semibold">{digit || ''}</Text>
                                                </View>
                                            );
                                        })}
                                    </TouchableOpacity>

                                    {/* Hidden real input — editable only when OTP screen is active */}
                                    <TextInput
                                        ref={otpInputRef}
                                        className="absolute w-[1px] h-[1px] opacity-0"
                                        value={otp}
                                        onChangeText={setOtp}
                                        keyboardType="number-pad"
                                        maxLength={6}
                                        editable={step === 2}
                                    />

                                    {/* OTP inline error */}
                                    {otpError ? (
                                        <Text className="text-red-400 font-poppins-regular text-[13px] text-center mb-4">
                                            {otpError}
                                        </Text>
                                    ) : null}

                                    {/* Countdown / resend info */}
                                    {countdown > 0 ? (
                                        <Text className="text-[#D4D4D4] font-poppins-regular text-[14px] text-center mb-8">
                                            You can resend the code in {countdown} seconds
                                        </Text>
                                    ) : (
                                        <Text className="text-[#D4D4D4] font-poppins-regular text-[14px] text-center mb-8">
                                            Did not receive the code?
                                        </Text>
                                    )}

                                    {loading ? (
                                        <ActivityIndicator color="#C3CE21" className="my-5" />
                                    ) : (
                                        <GradientButton title="Next" onPress={handleVerifyOtp} className="w-full mb-5" />
                                    )}

                                    <TouchableOpacity
                                        className="mt-6 mb-10 items-center"
                                        onPress={handleRequestOtp}
                                        disabled={countdown > 0 || loading}
                                        style={{ opacity: countdown > 0 ? 0.5 : 1 }}
                                    >
                                        <Text className="text-[#A58BFF] font-poppins-semibold text-[16px]">Resend OTP</Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </KeyboardAvoidingView>
                    </View>
                </Animated.View>
            </SafeAreaView>

            {/* ── Custom Status Modal ── */}
            <CustomAlert
                visible={statusModal.visible}
                title={statusModal.title}
                message={statusModal.message}
                onClose={() => setStatusModal({ ...statusModal, visible: false })}
                role={role as any}
            />
        </View>
    );
}