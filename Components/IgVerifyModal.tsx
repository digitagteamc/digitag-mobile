import * as Clipboard from 'expo-clipboard';
import React from 'react';
import { Linking, Modal, Text, TouchableOpacity, View } from 'react-native';

interface IgVerifyModalProps {
    visible: boolean;
    code?: string;
    instagramUsername?: string;
    digiTagInstagram?: string;
    expiresAt?: string;
    status: string;
    accentColor: string;
    onClose: () => void;
}

/** Shared Instagram DM-verification modal — used by both signup (first-time
 *  verification) and the Profile screen's "Add Instagram Account" flow, so
 *  the two entry points stay visually and behaviorally identical. */
export default function IgVerifyModal({ visible, code, instagramUsername, digiTagInstagram, expiresAt, status, accentColor, onClose }: IgVerifyModalProps) {
    const [secondsLeft, setSecondsLeft] = React.useState(0);
    React.useEffect(() => {
        if (!visible || !expiresAt) return;
        const update = () => setSecondsLeft(Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)));
        update();
        const t = setInterval(update, 1000);
        return () => clearInterval(t);
    }, [visible, expiresAt]);
    const mins = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;

    // Shown once per fresh verification attempt, before the code itself —
    // walks the user through what they're about to do so the code+DM screen
    // isn't the first thing they see with no context.
    const [showIntro, setShowIntro] = React.useState(true);
    React.useEffect(() => {
        if (visible && status === 'PENDING') setShowIntro(true);
    }, [visible, code]);
    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
                <View style={{ backgroundColor: '#111', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 40 }}>
                    {status === 'VERIFIED' ? (
                        <>
                            <Text style={{ color: '#16a34a', fontSize: 48, textAlign: 'center', marginBottom: 8 }}>✓</Text>
                            <Text style={{ color: '#fff', fontSize: 22, fontFamily: 'Poppins_700Bold', textAlign: 'center', marginBottom: 8 }}>Instagram Verified!</Text>
                            <Text style={{ color: '#aaa', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>@{instagramUsername} has been successfully verified.</Text>
                            <TouchableOpacity onPress={onClose} style={{ backgroundColor: '#16a34a', borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 16 }}>Done</Text>
                            </TouchableOpacity>
                        </>
                    ) : status === 'FAILED' ? (
                        <>
                            <Text style={{ color: '#ef4444', fontSize: 40, textAlign: 'center', marginBottom: 8 }}>✕</Text>
                            <Text style={{ color: '#fff', fontSize: 20, fontFamily: 'Poppins_700Bold', textAlign: 'center', marginBottom: 8 }}>Wrong Instagram Account</Text>
                            <Text style={{ color: '#aaa', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
                                That code was sent from a different Instagram account. Please DM it from @{instagramUsername} — the account you entered — then tap Try Again for a new code.
                            </Text>
                            <TouchableOpacity onPress={onClose} style={{ backgroundColor: accentColor, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 16 }}>Try Again</Text>
                            </TouchableOpacity>
                        </>
                    ) : status === 'EXPIRED' ? (
                        <>
                            <Text style={{ color: '#ef4444', fontSize: 40, textAlign: 'center', marginBottom: 8 }}>✕</Text>
                            <Text style={{ color: '#fff', fontSize: 20, fontFamily: 'Poppins_700Bold', textAlign: 'center', marginBottom: 8 }}>Code Expired</Text>
                            <Text style={{ color: '#aaa', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>The verification code expired. Tap Verify again to get a new code.</Text>
                            <TouchableOpacity onPress={onClose} style={{ backgroundColor: accentColor, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 16 }}>Try Again</Text>
                            </TouchableOpacity>
                        </>
                    ) : showIntro ? (
                        <>
                            <Text style={{ color: '#fff', fontSize: 20, fontFamily: 'Poppins_700Bold', marginBottom: 4 }}>How verification works</Text>
                            <Text style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>
                                A few quick steps to confirm this Instagram account is really yours:
                            </Text>
                            {[
                                `We'll show you a one-time 6-digit code`,
                                `Open Instagram and go to your DMs`,
                                `Send a new message containing just that code to @${digiTagInstagram}`,
                                `Come back here — we detect it automatically, usually within 30 seconds`,
                            ].map((step, i) => (
                                <View key={i} style={{ flexDirection: 'row', marginBottom: 14 }}>
                                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: accentColor, alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 1 }}>
                                        <Text style={{ color: '#fff', fontSize: 12, fontFamily: 'Poppins_700Bold' }}>{i + 1}</Text>
                                    </View>
                                    <Text style={{ color: '#ccc', fontSize: 13.5, flex: 1, lineHeight: 19 }}>{step}</Text>
                                </View>
                            ))}
                            <Text style={{ color: '#555', fontSize: 11.5, textAlign: 'center', marginTop: 4, marginBottom: 20 }}>
                                Only DMs from @{instagramUsername} are accepted — messages from any other account are ignored.
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShowIntro(false)}
                                style={{ backgroundColor: accentColor, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}
                            >
                                <Text style={{ color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 15 }}>Show my code</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onClose} style={{ borderWidth: 1, borderColor: '#333', borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ color: '#888', fontFamily: 'Poppins_500Medium', fontSize: 15 }}>Cancel</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text style={{ color: '#fff', fontSize: 20, fontFamily: 'Poppins_700Bold', marginBottom: 4 }}>Verify your Instagram</Text>
                            <Text style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>
                                Open Instagram and DM the code below to <Text style={{ color: '#fff', fontFamily: 'Poppins_600SemiBold' }}>@{digiTagInstagram}</Text>
                            </Text>
                            <View style={{ backgroundColor: '#1A1A1A', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 20 }}>
                                <Text style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>Your verification code</Text>
                                <Text style={{ color: accentColor, fontSize: 36, fontFamily: 'Poppins_700Bold', letterSpacing: 8 }}>{code}</Text>
                                <Text style={{ color: '#555', fontSize: 12, marginTop: 8 }}>
                                    Expires in {mins}:{String(secs).padStart(2, '0')}
                                </Text>
                            </View>
                            <Text style={{ color: '#666', fontSize: 12, textAlign: 'center', marginBottom: 16 }}>
                                Waiting for your DM… keep this screen open or send the DM then return here.
                            </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    if (code) Clipboard.setStringAsync(code);
                                    Linking.openURL(`https://ig.me/m/${digiTagInstagram}`);
                                }}
                                style={{ backgroundColor: accentColor, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}
                            >
                                <Text style={{ color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 15 }}>Open Instagram DM</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onClose} style={{ borderWidth: 1, borderColor: '#333', borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ color: '#888', fontFamily: 'Poppins_500Medium', fontSize: 15 }}>Close (verification continues)</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
}
