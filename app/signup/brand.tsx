import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { registerBrand, registerUserRole } from '../../services/userService';

export default function BrandSignup() {
    const router = useRouter();
    const { userPhone, token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'idle' | 'registering_role' | 'submitting'>('idle');

    const [form, setForm] = useState({
        brandName: '',
        pan: '',
        gstin: '',
        city: '',
        state: '',
    });

    const validatePan = (pan: string) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase());

    const handleSubmit = async () => {
        if (!userPhone) {
            Alert.alert("Error", "Phone number missing. Please log in again.");
            router.replace('/');
            return;
        }

        if (!form.brandName.trim()) {
            Alert.alert("Validation Error", "Brand / Company Name is required.");
            return;
        }

        if (!form.pan.trim()) {
            Alert.alert("Validation Error", "PAN Number is required.");
            return;
        }

        if (!validatePan(form.pan.trim())) {
            Alert.alert("Invalid PAN", "PAN must be in format: ABCDE1234F");
            return;
        }

        setLoading(true);

        try {
            const cleanPhone = userPhone.replace(/\s+/g, '');
            const authToken = token || 'session-active';

            // Step 1: Register User with BRAND role (backend requires this FIRST)
            // The brands/register endpoint checks that user exists with BRAND role
            setStep('registering_role');
            console.log("📝 Step 1: Registering BRAND role...");
            try {
                await registerUserRole(cleanPhone, 'BRAND', authToken);
            } catch (roleErr: any) {
                // If user already has this role, that's fine — proceed
                if (!roleErr.message?.includes('already') && !roleErr.message?.includes('exists')) {
                    throw roleErr;
                }
                console.log("ℹ️ Role already registered, continuing...");
            }

            // Step 2: Submit brand profile
            setStep('submitting');
            console.log("📝 Step 2: Submitting brand profile...");
            const brandPayload = {
                phoneNumber: cleanPhone,
                brandName: form.brandName.trim(),
                pan: form.pan.trim().toUpperCase(),
                gstin: form.gstin.trim().toUpperCase() || undefined,
                city: form.city.trim() || undefined,
                state: form.state.trim() || undefined,
            };

            const result = await registerBrand(brandPayload, authToken);

            if (result.success) {
                Alert.alert(
                    "Application Submitted! 🏢",
                    "Your brand details have been submitted for admin verification. You will be notified once approved.",
                    [{ text: "OK", onPress: () => router.replace({ pathname: '/signup/pending', params: { role: 'BRAND' } }) }]
                );
            } else {
                Alert.alert("Registration Failed", result.error || "Something went wrong. Please try again.");
            }
        } catch (e: any) {
            console.error("Brand signup error:", e);
            Alert.alert("Error", e.message || "Failed to submit brand details. Please try again.");
        } finally {
            setLoading(false);
            setStep('idle');
        }
    };

    const getLoadingText = () => {
        if (step === 'registering_role') return 'Setting up account...';
        if (step === 'submitting') return 'Submitting details...';
        return 'Submit for Approval';
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, backgroundColor: '#0b0b14' }}
        >
            <ScrollView contentContainerStyle={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Brand Registration</Text>
                    <Text style={styles.subtitle}>
                        Submit your brand's KYC details. Our admin team will verify and approve your account.
                    </Text>
                </View>

                {/* Phone badge */}
                <View style={styles.phoneBadge}>
                    <Text style={styles.phoneBadgeLabel}>📱 VERIFIED NUMBER</Text>
                    <Text style={styles.phoneBadgeValue}>{userPhone}</Text>
                </View>

                {/* Form */}
                <View style={styles.formSection}>

                    {/* Required Fields */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Required Details</Text>
                    </View>

                    <Text style={styles.label}>Brand / Company Name *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="My Awesome Brand Pvt. Ltd."
                        placeholderTextColor="#555"
                        value={form.brandName}
                        onChangeText={v => setForm(f => ({ ...f, brandName: v }))}
                    />

                    <Text style={styles.label}>PAN Number *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="ABCDE1234F"
                        placeholderTextColor="#555"
                        autoCapitalize="characters"
                        maxLength={10}
                        value={form.pan}
                        onChangeText={v => setForm(f => ({ ...f, pan: v.toUpperCase() }))}
                    />

                    {/* Optional Fields */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Optional Details</Text>
                    </View>

                    <Text style={styles.label}>GSTIN</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="22AAAAA0000A1Z5"
                        placeholderTextColor="#555"
                        autoCapitalize="characters"
                        maxLength={15}
                        value={form.gstin}
                        onChangeText={v => setForm(f => ({ ...f, gstin: v.toUpperCase() }))}
                    />

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>City</Text>
                            <TextInput
                                style={[styles.input, { marginRight: 8 }]}
                                placeholder="Mumbai"
                                placeholderTextColor="#555"
                                value={form.city}
                                onChangeText={v => setForm(f => ({ ...f, city: v }))}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>State</Text>
                            <TextInput
                                style={[styles.input, { marginLeft: 8 }]}
                                placeholder="Maharashtra"
                                placeholderTextColor="#555"
                                value={form.state}
                                onChangeText={v => setForm(f => ({ ...f, state: v }))}
                            />
                        </View>
                    </View>
                </View>

                {/* Submit */}
                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.buttonText}>{getLoadingText()}</Text>
                    }
                </TouchableOpacity>
                {loading && (
                    <Text style={styles.loadingHint}>{getLoadingText()}</Text>
                )}

                <Text style={styles.note}>
                    Your information is secure and will only be reviewed by our admin team.
                </Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, padding: 24, paddingBottom: 60 },
    header: { marginBottom: 28, marginTop: 50 },
    backBtn: { marginBottom: 16 },
    backText: { color: '#4f46e5', fontSize: 15 },
    title: { fontSize: 30, fontWeight: 'bold', color: '#fff' },
    subtitle: { fontSize: 14, color: '#888', marginTop: 8, lineHeight: 20 },
    phoneBadge: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 14,
        borderRadius: 12,
        marginBottom: 28,
        borderLeftWidth: 3,
        borderLeftColor: '#4f46e5',
    },
    phoneBadgeLabel: { color: '#4f46e5', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
    phoneBadgeValue: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 3 },
    formSection: { marginBottom: 24 },
    sectionHeader: { marginBottom: 16, marginTop: 8 },
    sectionTitle: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
    label: { color: '#aaa', fontSize: 13, marginBottom: 8, marginLeft: 2 },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        color: '#fff',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 16,
        fontSize: 16,
    },
    row: { flexDirection: 'row' },
    button: {
        backgroundColor: '#4f46e5',
        padding: 17,
        borderRadius: 13,
        alignItems: 'center',
        marginBottom: 12,
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    loadingHint: { color: '#888', textAlign: 'center', fontSize: 13, marginBottom: 12 },
    note: { color: '#444', fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
