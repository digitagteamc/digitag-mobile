import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function PendingApproval() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Application Pending</Text>
            <Text style={styles.message}>Admin is reviewing your profile. We will notify you once approved.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f0f1e', justifyContent: 'center', alignItems: 'center', padding: 30 },
    title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    message: { color: '#888', textAlign: 'center', marginTop: 15, lineHeight: 22 }
});