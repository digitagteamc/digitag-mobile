import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { createBrandProfile, getMyBrandProfile, updateBrandProfile } from '../../services/brandService';

export default function BrandSignup() {
    const router = useRouter();
    const { userPhone, token, setProfiles, setProfileCompleted } = useAuth();
    const { mode } = useLocalSearchParams<{ mode?: string }>();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'idle' | 'registering_role' | 'submitting'>('idle');
    // Set once an existing profile is found: re-applying after a rejection,
    // or editing details later — the form then updates instead of creating.
    const [existing, setExisting] = useState(false);
    const [prefilling, setPrefilling] = useState(true);

    const [form, setForm] = useState({
        brandName: '',
        pan: '',
        gstin: '',
        city: '',
        state: '',
        industry: '',
        website: '',
    });

    useEffect(() => {
        if (!token) { setPrefilling(false); return; }
        getMyBrandProfile(token)
            .then((res) => {
                if (!res.success) return;
                const p = res.data;
                setExisting(true);
                setForm({
                    brandName: p.name || '',
                    pan: p.pan || '',
                    gstin: p.gstin || '',
                    city: p.city || '',
                    state: p.state || '',
                    industry: p.industry || '',
                    website: p.website || '',
                });
            })
            .finally(() => setPrefilling(false));
    }, [token]);

    const validatePan = (pan: string) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase());
    const validateGstin = (gstin: string) => /^[0-9]{2}[A-Z0-9]{13}$/.test(gstin.toUpperCase());

    const handleSubmit = async () => {
        if (!token) {
            Alert.alert('Session expired', 'Please log in again.');
            router.replace({ pathname: '/login', params: { role: 'BRAND' } } as any);
            return;
        }
        if (form.brandName.trim().length < 2) { Alert.alert('Brand name required', 'Enter your brand or company name.'); return; }
        if (!validatePan(form.pan)) { Alert.alert('Invalid PAN', 'Enter a valid PAN, e.g. ABCDE1234F.'); return; }
        if (form.gstin && !validateGstin(form.gstin)) { Alert.alert('Invalid GSTIN', 'GSTIN must be 15 characters, e.g. 22AAAAA0000A1Z5.'); return; }

        const payload = {
            name: form.brandName.trim(),
            pan: form.pan.trim().toUpperCase(),
            gstin: form.gstin.trim().toUpperCase() || null,
            city: form.city.trim() || null,
            state: form.state.trim() || null,
            industry: form.industry.trim() || null,
            website: form.website.trim() || null,
        };

        setLoading(true);
        setStep('submitting');
        const res = existing ? await updateBrandProfile(token, payload) : await createBrandProfile(token, payload);
        setLoading(false);
        setStep('idle');

        if (!res.success) {
            Alert.alert('Could not submit', res.error);
            return;
        }
        setProfiles({ BRAND: true });
        setProfileCompleted(true);
        // Approved brands editing non-KYC details stay approved; anything else waits for review.
        router.replace((res.data.approvalStatus === 'APPROVED' ? '/(tabs)' : '/signup/pending?role=BRAND') as any);
    };

    const getLoadingText = () => {
        if (step === 'registering_role') return 'Setting up account...';
        if (step === 'submitting') return 'Submitting details...';
        return existing && mode !== 'edit' ? 'Save Changes' : 'Submit for Approval';
    };

    if (prefilling) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#0b0b14', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator color="#7352DD" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0b0b14' }} edges={['top', 'left', 'right', 'bottom']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView 
                    contentContainerStyle={styles.container}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={() => (router.canGoBack() ? router.back() : router.replace('/role-selection'))}
                            style={styles.backBtn}
                        >
                            <Text style={styles.backText}>← Back</Text>
                        </TouchableOpacity>
                        <Text style={styles.title}>{existing ? 'Update Brand Details' : 'Brand Registration'}</Text>
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

                        <Text style={styles.label}>Industry</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="FMCG, Fashion, Tech..."
                            placeholderTextColor="#555"
                            value={form.industry}
                            onChangeText={v => setForm(f => ({ ...f, industry: v }))}
                        />

                        <Text style={styles.label}>Website</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="https://mybrand.com"
                            placeholderTextColor="#555"
                            autoCapitalize="none"
                            keyboardType="url"
                            value={form.website}
                            onChangeText={v => setForm(f => ({ ...f, website: v }))}
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, padding: 24, paddingBottom: 0 },
    header: { marginBottom: 28, marginTop: 50 },
    backBtn: { marginBottom: 16 },
    backText: { color: '#7352DD', fontSize: 15 },
    title: { fontSize: 30, fontWeight: 'bold', color: '#fff' },
    subtitle: { fontSize: 14, color: '#888', marginTop: 8, lineHeight: 20 },
    phoneBadge: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 14,
        borderRadius: 12,
        marginBottom: 28,
        borderLeftWidth: 3,
        borderLeftColor: '#7352DD',
    },
    phoneBadgeLabel: { color: '#7352DD', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
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
        backgroundColor: '#7352DD',
        padding: 17,
        borderRadius: 13,
        alignItems: 'center',
        marginBottom: 0,
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    loadingHint: { color: '#888', textAlign: 'center', fontSize: 13, marginBottom: 12 },
    note: { color: '#444', fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
