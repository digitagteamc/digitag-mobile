import React from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { startEmailVerification, verifyEmailCode } from '../services/userService';

interface EmailVerifyModalProps {
    visible: boolean;
    token: string;
    email: string;
    accentColor: string;
    onVerified: (email: string) => void;
    onClose: () => void;
}

const RESEND_COOLDOWN_SECONDS = 30;

/** Self-contained email OTP modal — sends the code itself as soon as it
 *  opens, then owns code entry, verify, and resend. Mirrors IgVerifyModal's
 *  bottom-sheet look, but the flow here is a single synchronous code entry
 *  rather than an async DM-polling machine, so it manages its own request
 *  lifecycle instead of taking pre-fetched status props. */
export default function EmailVerifyModal({ visible, token, email, accentColor, onVerified, onClose }: EmailVerifyModalProps) {
    const [verificationId, setVerificationId] = React.useState<string | null>(null);
    const [sending, setSending] = React.useState(false);
    const [code, setCode] = React.useState('');
    const [error, setError] = React.useState<string | null>(null);
    const [verifying, setVerifying] = React.useState(false);
    const [verified, setVerified] = React.useState(false);
    const [cooldown, setCooldown] = React.useState(0);

    const send = React.useCallback(async () => {
        setSending(true);
        setError(null);
        setCode('');
        const res = await startEmailVerification(token, email);
        setSending(false);
        if (res.success && res.data) {
            setVerificationId(res.data.id);
            setCooldown(RESEND_COOLDOWN_SECONDS);
        } else {
            setError(res.error || 'Could not send the verification email.');
        }
    }, [token, email]);

    React.useEffect(() => {
        if (visible) {
            setVerified(false);
            setVerificationId(null);
            send();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, email]);

    React.useEffect(() => {
        if (cooldown <= 0) return;
        const t = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
        return () => clearInterval(t);
    }, [cooldown]);

    const handleVerify = async () => {
        if (!verificationId) return;
        if (!/^\d{4,10}$/.test(code.trim())) {
            setError('Enter the 6-digit code.');
            return;
        }
        setVerifying(true);
        setError(null);
        const res = await verifyEmailCode(token, verificationId, code.trim());
        setVerifying(false);
        if (res.success) {
            setVerified(true);
            setTimeout(() => onVerified(email), 900);
        } else {
            setError(res.error || 'Incorrect code.');
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}
            >
                <View style={{ backgroundColor: '#111', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 40 }}>
                    {verified ? (
                        <>
                            <Text style={{ color: '#16a34a', fontSize: 48, textAlign: 'center', marginBottom: 8 }}>✓</Text>
                            <Text style={{ color: '#fff', fontSize: 22, fontFamily: 'Poppins_700Bold', textAlign: 'center', marginBottom: 8 }}>Email Verified!</Text>
                            <Text style={{ color: '#aaa', fontSize: 14, textAlign: 'center' }}>{email}</Text>
                        </>
                    ) : (
                        <>
                            <Text style={{ color: '#fff', fontSize: 20, fontFamily: 'Poppins_700Bold', marginBottom: 4 }}>Verify your email</Text>
                            <Text style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>
                                {sending && !verificationId
                                    ? 'Sending a code to your email…'
                                    : (<>We sent a 6-digit code to <Text style={{ color: '#fff', fontFamily: 'Poppins_600SemiBold' }}>{email}</Text></>)}
                            </Text>

                            {sending && !verificationId ? (
                                <ActivityIndicator color={accentColor} style={{ marginBottom: 20 }} />
                            ) : (
                                <>
                                    <TextInput
                                        value={code}
                                        onChangeText={(t) => { setCode(t.replace(/\D/g, '').slice(0, 6)); setError(null); }}
                                        keyboardType="number-pad"
                                        maxLength={6}
                                        placeholder="000000"
                                        placeholderTextColor="#444"
                                        autoFocus
                                        style={{
                                            backgroundColor: '#1A1A1A',
                                            borderRadius: 16,
                                            color: '#fff',
                                            fontSize: 28,
                                            fontFamily: 'Poppins_700Bold',
                                            letterSpacing: 10,
                                            textAlign: 'center',
                                            paddingVertical: 18,
                                            marginBottom: 12,
                                        }}
                                    />
                                    {error ? (
                                        <Text style={{ color: '#ef4444', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</Text>
                                    ) : null}

                                    <TouchableOpacity
                                        onPress={handleVerify}
                                        disabled={verifying || code.length < 6}
                                        style={{
                                            backgroundColor: accentColor,
                                            opacity: verifying || code.length < 6 ? 0.6 : 1,
                                            borderRadius: 14,
                                            height: 52,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: 12,
                                        }}
                                    >
                                        {verifying ? <ActivityIndicator color="#fff" /> : (
                                            <Text style={{ color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 15 }}>Verify</Text>
                                        )}
                                    </TouchableOpacity>

                                    <TouchableOpacity onPress={send} disabled={cooldown > 0 || sending}>
                                        <Text style={{ color: cooldown > 0 ? '#555' : accentColor, fontSize: 13, textAlign: 'center', marginBottom: 16, fontFamily: 'Poppins_500Medium' }}>
                                            {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            )}

                            <TouchableOpacity onPress={onClose} style={{ borderWidth: 1, borderColor: '#333', borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ color: '#888', fontFamily: 'Poppins_500Medium', fontSize: 15 }}>Cancel</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
