import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { checkBrandStatus, checkCreatorStatus } from '../../services/userService';

type Status = 'PENDING' | 'APPROVED' | 'REJECTED';
type Role = 'CREATOR' | 'BRAND';

export default function PendingScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ role?: string }>();
    const { token } = useAuth();

    // Determine role from params or default to CREATOR
    const role: Role = (params.role?.toUpperCase() as Role) || 'CREATOR';

    const [status, setStatus] = useState<Status>('PENDING');
    const [loading, setLoading] = useState(true);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Pulse animation for the dot
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.4, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const fetchStatus = async () => {
        if (!token) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const result = role === 'BRAND'
                ? await checkBrandStatus(token)
                : await checkCreatorStatus(token);

            if (result.success && result.data) {
                // Backend may return status under various field names
                const s = result.data.status || result.data.creatorStatus || result.data.brandStatus || 'PENDING';
                const normalized = s.toUpperCase() as Status;
                setStatus(normalized);

                if (normalized === 'APPROVED') {
                    // Auto-navigate to home on approval
                    router.replace('/(tabs)');
                }
            }
        } catch (e) {
            console.error("Failed to fetch status:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        // Auto-check every 30 seconds
        const interval = setInterval(fetchStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    const roleLabel = role === 'BRAND' ? 'Brand' : 'Creator';

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    <ActivityIndicator size="large" color="#4f46e5" />
                    <Text style={styles.loadingText}>Checking status...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (status === 'REJECTED') {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    <View style={[styles.iconCircle, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
                        <Text style={{ fontSize: 40 }}>❌</Text>
                    </View>
                    <Text style={styles.title}>Application Rejected</Text>
                    <Text style={styles.desc}>
                        Your {roleLabel} application was not approved.
                        Please update your details and re-apply.
                    </Text>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => router.replace(role === 'BRAND' ? '/signup/brand' : '/signup/creator')}
                    >
                        <Text style={styles.primaryButtonText}>Re-apply Now</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.ghostButton} onPress={() => router.replace('/(tabs)')}>
                        <Text style={styles.ghostButtonText}>Go to Home</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Animated status icon */}
                <View style={styles.iconCircle}>
                    <Text style={{ fontSize: 44 }}>{role === 'BRAND' ? '🏢' : '🎨'}</Text>
                </View>

                {/* Status badge */}
                <View style={styles.badge}>
                    <Animated.View style={[styles.dot, { transform: [{ scale: pulseAnim }] }]} />
                    <Text style={styles.badgeText}>Under Review</Text>
                </View>

                <Text style={styles.title}>Waiting for Approval</Text>
                <Text style={styles.desc}>
                    Your {roleLabel.toLowerCase()} application has been submitted and is currently under review.
                    {'\n\n'}We'll notify you once admin approves your account.
                </Text>

                {/* Auto check indicator */}
                <Text style={styles.autoCheckNote}>Auto-checking every 30 seconds</Text>

                <TouchableOpacity style={styles.primaryButton} onPress={fetchStatus}>
                    <Text style={styles.primaryButtonText}>Check Status Now</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.ghostButton} onPress={() => router.replace('/(tabs)')}>
                    <Text style={styles.ghostButtonText}>Go to Home</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0b0b14' },
    content: { flex: 1, padding: 32, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: '#aaa', marginTop: 16, fontSize: 15 },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(79,70,229,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 28,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 18,
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderRadius: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    dot: {
        width: 9,
        height: 9,
        borderRadius: 5,
        backgroundColor: '#f59e0b',
        marginRight: 8,
    },
    badgeText: { color: '#f59e0b', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
    title: { fontSize: 26, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 14 },
    desc: { fontSize: 15, color: '#888', textAlign: 'center', lineHeight: 24, marginBottom: 12 },
    autoCheckNote: { color: '#555', fontSize: 12, marginBottom: 32, fontStyle: 'italic' },
    primaryButton: {
        backgroundColor: '#4f46e5',
        paddingVertical: 15,
        paddingHorizontal: 32,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        marginBottom: 12,
    },
    primaryButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
    ghostButton: {
        paddingVertical: 14,
        width: '100%',
        alignItems: 'center',
    },
    ghostButtonText: { color: '#666', fontSize: 15 },
});
