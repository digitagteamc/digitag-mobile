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
    View
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { submitCreatorApplication } from '../../services/userService';

export default function CreatorSignup() {
    const router = useRouter();
    const { userPhone, token } = useAuth();  // Only need phone + token
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: '',
        email: '',
        instagram: '',
        category: ''
    });

    const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleSignup = async () => {
        // Validation
        if (!userPhone) {
            Alert.alert("Error", "Phone number missing. Please log in again.");
            router.replace('/');
            return;
        }

        if (!form.name.trim() || !form.email.trim() || !form.instagram.trim() || !form.category.trim()) {
            Alert.alert("Validation Error", "Please fill in all fields.");
            return;
        }

        if (!validateEmail(form.email.trim())) {
            Alert.alert("Invalid Email", "Please enter a valid email address.");
            return;
        }

        setLoading(true);
        try {
            const cleanPhone = userPhone.replace(/\s+/g, '');

            // The backend will create the User record automatically from phoneNumber
            // No need for a pre-existing userId
            const payload = {
                name: form.name.trim(),
                email: form.email.trim().toLowerCase(),
                instagram: form.instagram.trim().replace('@', ''),
                category: form.category.trim(),
                phoneNumber: cleanPhone,
                role: 'CREATOR',       // Tell backend the role so it can create the User + Creator application
            };

            console.log("📤 Submitting creator application:", JSON.stringify(payload, null, 2));

            const result = await submitCreatorApplication(payload, token || '');

            if (result.success) {
                Alert.alert(
                    "Application Submitted! 🎉",
                    "Your creator application is now pending admin approval. We'll notify you once reviewed.",
                    [{ text: "OK", onPress: () => router.replace('/signup/pending') }]
                );
            } else {
                const err = result.error || '';
                if (err.includes("Unique constraint") || err.includes("already exists")) {
                    Alert.alert("Already Registered", "This email or phone is already registered as a creator.");
                } else {
                    Alert.alert("Submission Failed", err || "Something went wrong. Please try again.");
                }
            }
        } catch (e: any) {
            console.error("Creator signup error:", e);
            Alert.alert("Network Error", "Could not reach the server. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Creator Application</Text>
                    <Text style={styles.subtitle}>
                        Fill in your details below. An admin will review and approve your application.
                    </Text>
                </View>

                {/* Phone badge */}
                <View style={styles.phoneBadge}>
                    <Text style={styles.phoneBadgeLabel}>📱 VERIFIED NUMBER</Text>
                    <Text style={styles.phoneBadgeValue}>{userPhone}</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <Text style={styles.label}>Full Name *</Text>
                    <TextInput
                        placeholder="e.g. Priya Sharma"
                        placeholderTextColor="#555"
                        style={styles.input}
                        value={form.name}
                        onChangeText={v => setForm(f => ({ ...f, name: v }))}
                    />

                    <Text style={styles.label}>Email Address *</Text>
                    <TextInput
                        placeholder="you@email.com"
                        placeholderTextColor="#555"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={styles.input}
                        value={form.email}
                        onChangeText={v => setForm(f => ({ ...f, email: v }))}
                    />

                    <Text style={styles.label}>Instagram Handle *</Text>
                    <TextInput
                        placeholder="@yourhandle"
                        placeholderTextColor="#555"
                        autoCapitalize="none"
                        style={styles.input}
                        value={form.instagram}
                        onChangeText={v => setForm(f => ({ ...f, instagram: v }))}
                    />

                    <Text style={styles.label}>Category *</Text>
                    <TextInput
                        placeholder="e.g. Fashion, Tech, Food, Travel"
                        placeholderTextColor="#555"
                        style={styles.input}
                        value={form.category}
                        onChangeText={v => setForm(f => ({ ...f, category: v }))}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitDisabled]}
                    onPress={handleSignup}
                    disabled={loading}
                >
                    {loading
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.submitText}>Submit for Approval</Text>
                    }
                </TouchableOpacity>

                <Text style={styles.note}>
                    By submitting, you agree that your details will be reviewed by our admin team before your profile goes live.
                </Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, backgroundColor: '#0f0f1e', padding: 24, paddingTop: 56 },
    header: { marginBottom: 28 },
    backBtn: { marginBottom: 16 },
    backText: { color: '#4f46e5', fontSize: 15 },
    title: { color: '#fff', fontSize: 30, fontWeight: 'bold' },
    subtitle: { color: '#888', fontSize: 15, marginTop: 8, lineHeight: 22 },
    phoneBadge: {
        backgroundColor: '#16162a',
        padding: 14,
        borderRadius: 12,
        marginBottom: 28,
        borderLeftWidth: 3,
        borderLeftColor: '#4f46e5',
    },
    phoneBadgeLabel: { color: '#4f46e5', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
    phoneBadgeValue: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 3 },
    form: { marginBottom: 24 },
    label: { color: '#aaa', fontSize: 13, marginBottom: 8, marginLeft: 2 },
    input: {
        backgroundColor: '#16162a',
        color: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 16,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#2a2a42',
    },
    submitButton: {
        backgroundColor: '#4f46e5',
        padding: 17,
        borderRadius: 13,
        alignItems: 'center',
        marginBottom: 20,
    },
    submitDisabled: { opacity: 0.6 },
    submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    note: { color: '#555', fontSize: 12, textAlign: 'center', lineHeight: 18 },
});