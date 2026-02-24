
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function RoleSelectionScreen() {
    const router = useRouter();

    const handleSelectRole = (role: 'creator' | 'brand') => {
        if (role === 'creator') {
            router.push('/signup/creator');
        } else {
            router.push('/signup/brand');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Join Digitag</Text>
            <Text style={styles.subtitle}>Choose your role to get started</Text>

            <TouchableOpacity style={styles.card} onPress={() => handleSelectRole('creator')}>
                <Text style={styles.cardTitle}>Become a Creator</Text>
                <Text style={styles.cardDesc}>Create content, collaborate, get paid.</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.card} onPress={() => handleSelectRole('brand')}>
                <Text style={styles.cardTitle}>Become a Brand</Text>
                <Text style={styles.cardDesc}>Find creators, run campaigns.</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f0f1e', justifyContent: 'center', alignItems: 'center', padding: 20 },
    title: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginBottom: 10 },
    subtitle: { color: '#aaa', fontSize: 16, marginBottom: 40 },

    card: {
        backgroundColor: '#1e1e30',
        padding: 24,
        borderRadius: 20,
        width: '100%',
        marginBottom: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2e2e4e'
    },
    cardTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
    cardDesc: { color: '#888', fontSize: 14 }
});
