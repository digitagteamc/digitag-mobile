import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Role = 'CREATOR' | 'BRAND';

export default function RoleSelectionScreen() {
    const router = useRouter();
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);

    const handleContinue = () => {
        if (!selectedRole) {
            return;
        }
        // No API call here — just navigate to the correct form
        // The form submission itself will create the user on the backend
        if (selectedRole === 'CREATOR') {
            router.push('/signup/creator');
        } else {
            router.push('/signup/brand');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <TouchableOpacity style={styles.closeButton} onPress={() => router.replace('/')}>
                    <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>

                <Text style={styles.title}>Who are you?</Text>
                <Text style={styles.subtitle}>
                    Choose your role. Your account will be created when you submit your details.
                </Text>

                <View style={styles.optionsContainer}>
                    <TouchableOpacity
                        style={[styles.optionCard, selectedRole === 'CREATOR' && styles.optionSelected]}
                        onPress={() => setSelectedRole('CREATOR')}
                    >
                        <Text style={styles.optionIcon}>🎨</Text>
                        <Text style={styles.optionTitle}>Creator</Text>
                        <Text style={styles.optionDesc}>
                            Apply to get listed. Submit your details for admin approval.
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.optionCard, selectedRole === 'BRAND' && styles.optionSelected]}
                        onPress={() => setSelectedRole('BRAND')}
                    >
                        <Text style={styles.optionIcon}>🏢</Text>
                        <Text style={styles.optionTitle}>Brand</Text>
                        <Text style={styles.optionDesc}>
                            Register your brand with KYC details for admin approval.
                        </Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.continueButton, !selectedRole && styles.disabledButton]}
                    onPress={handleContinue}
                    disabled={!selectedRole}
                >
                    <Text style={styles.continueText}>Continue →</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0b0b14' },
    content: { flex: 1, padding: 24, justifyContent: 'center' },
    closeButton: { position: 'absolute', top: 50, right: 20, padding: 10 },
    closeText: { color: '#fff', fontSize: 24 },
    title: { fontSize: 30, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
    subtitle: { fontSize: 15, color: '#888', marginBottom: 36, lineHeight: 22 },
    optionsContainer: { gap: 16, marginBottom: 32 },
    optionCard: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        padding: 22,
        borderRadius: 16,
    },
    optionSelected: {
        backgroundColor: 'rgba(79,70,229,0.15)',
        borderColor: '#4f46e5',
    },
    optionIcon: { fontSize: 28, marginBottom: 8 },
    optionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
    optionDesc: { fontSize: 13, color: '#aaa', lineHeight: 18 },
    continueButton: {
        backgroundColor: '#4f46e5',
        padding: 17,
        borderRadius: 14,
        alignItems: 'center',
    },
    disabledButton: { opacity: 0.35 },
    continueText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
