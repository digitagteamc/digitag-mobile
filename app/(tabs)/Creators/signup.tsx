import { useAuth } from '@/context/AuthContext';
import { submitCreatorApplication } from '@/services/userService';
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

export default function CreatorSignup() {
    const router = useRouter();
    // Only need phone + token — no userId required
    const { userPhone, token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: '',
        email: '',
        instagram: '',
        category: ''
    });

    const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleSignup = async () => {
        if (!userPhone) {
            Alert.alert("Authentication Error", "Phone number missing. Please log in again.");
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

        const cleanPhone = userPhone.replace(/\s+/g, "");
        setLoading(true);

        try {
            // Backend creates User + Creator in one shot from phoneNumber + role
            // No pre-existing userId required — user is created only when this form is submitted
            const requestBody = {
                name: form.name.trim(),
                email: form.email.trim().toLowerCase(),
                instagram: form.instagram.trim().replace('@', ''),
                category: form.category.trim(),
                phoneNumber: cleanPhone,
                role: 'CREATOR',
            };

            console.log("📤 Creator signup payload:", JSON.stringify(requestBody, null, 2));

            const result = await submitCreatorApplication(requestBody, token || '');

            if (result.success) {
                Alert.alert(
                    "Application Submitted!",
                    "Your application is pending admin approval.",
                    [{ text: "OK", onPress: () => router.replace('/signup/pending') }]
                );
            } else {
                const errorMsg = result.error || "";
                if (errorMsg.includes("Unique constraint") || errorMsg.includes("already exists")) {
                    Alert.alert("Already Registered", "This email or phone is already registered as a creator.");
                } else {
                    Alert.alert("Submission Failed", errorMsg || "Something went wrong.");
                }
            }
        } catch (e: any) {
            console.error("Signup Flow Error:", e);
            Alert.alert("Network Error", "Unable to reach the server. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Creator Signup</Text>
                    <Text style={styles.subtitle}>Join the community. Your profile will be reviewed by our team.</Text>
                </View>

                <View style={styles.badge}>
                    <Text style={styles.badgeLabel}>VERIFIED PHONE</Text>
                    <Text style={styles.badgeText}>{userPhone}</Text>
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput
                        placeholder="John Doe"
                        placeholderTextColor="#555"
                        style={styles.input}
                        value={form.name}
                        onChangeText={v => setForm({ ...form, name: v })}
                    />

                    <Text style={styles.label}>Professional Email</Text>
                    <TextInput
                        placeholder="john@example.com"
                        placeholderTextColor="#555"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={styles.input}
                        value={form.email}
                        onChangeText={v => setForm({ ...form, email: v })}
                    />

                    <Text style={styles.label}>Instagram Handle</Text>
                    <TextInput
                        placeholder="@yourprofile"
                        placeholderTextColor="#555"
                        autoCapitalize="none"
                        style={styles.input}
                        value={form.instagram}
                        onChangeText={v => setForm({ ...form, instagram: v })}
                    />

                    <Text style={styles.label}>Category</Text>
                    <TextInput
                        placeholder="e.g., Tech, Fashion, Lifestyle"
                        placeholderTextColor="#555"
                        style={styles.input}
                        value={form.category}
                        onChangeText={v => setForm({ ...form, category: v })}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleSignup}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit for Approval</Text>}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, backgroundColor: '#0f0f1e', padding: 25, paddingTop: 60 },
    header: { marginBottom: 30 },
    title: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
    subtitle: { color: '#888', fontSize: 16, marginTop: 8 },
    badge: { backgroundColor: '#16162a', padding: 15, borderRadius: 12, marginBottom: 25, borderLeftWidth: 4, borderLeftColor: '#4f46e5' },
    badgeLabel: { color: '#4f46e5', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
    badgeText: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 2 },
    formSection: { marginBottom: 20 },
    label: { color: '#aaa', fontSize: 14, marginBottom: 8, marginLeft: 4 },
    input: { backgroundColor: '#16162a', color: '#fff', padding: 16, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#2e2e4e' },
    button: { backgroundColor: '#4f46e5', padding: 18, borderRadius: 12, alignItems: 'center', shadowColor: '#4f46e5', shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});