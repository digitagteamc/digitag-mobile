import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function AgenciesScreen() {
    const { isGuest } = useAuth();

    if (isGuest) return <Redirect href="/login" />;

    return (
        <View style={styles.container}>
            <Text style={styles.text}>Agencies Directory</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f0f1e', justifyContent: 'center', alignItems: 'center' },
    text: { color: '#fff', fontSize: 20, fontWeight: 'bold' }
});
