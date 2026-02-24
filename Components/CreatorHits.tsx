import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.2.3:3001';

interface Creator {
    id: number;
    name: string;
    category: string;
    city?: string;
    state?: string;
    phoneNumber?: string;
    instagram?: string;
    email?: string;
}

export default function CreatorHits() {
    const router = useRouter();
    const { token, userRole } = useAuth();
    const [creators, setCreators] = useState<Creator[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCreators();
    }, [token]);

    const fetchCreators = async () => {
        try {
            const url = `${API_BASE_URL}/creators`;
            const headers: any = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(url, { headers });
            const data = await response.json();

            let creatorsList = [];
            if (Array.isArray(data)) {
                creatorsList = data;
            } else if (data && typeof data === 'object' && Array.isArray((data as any).data)) {
                creatorsList = (data as any).data;
            }

            setCreators(creatorsList);
        } catch (error) {
            console.error("Error fetching creator hits:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewProfile = (creator: Creator) => {
        router.push({
            pathname: '/creator-details',
            params: {
                id: creator.id.toString(),
                name: creator.name,
                category: creator.category,
                city: creator.city || '',
                state: creator.state || '',
                instagram: creator.instagram || '',
                email: creator.email || '',
                phoneNumber: creator.phoneNumber || '',
            }
        });
    };

    if (loading && creators.length === 0) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator color="#4f46e5" size="large" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Creator Hits</Text>
                <Text style={styles.subtitle}>Top performing creators for your brand</Text>
            </View>

            {creators.length === 0 ? (
                <Text style={styles.emptyText}>No creators found at the moment.</Text>
            ) : (
                <View style={styles.grid}>
                    {creators.slice(0, 6).map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.card}
                            onPress={() => handleViewProfile(item)}
                            activeOpacity={0.8}
                        >
                            <View style={styles.avatarContainer}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>
                                        {item.name ? item.name.charAt(0).toUpperCase() : '?'}
                                    </Text>
                                </View>
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>HIT</Text>
                                </View>
                            </View>

                            <View style={styles.info}>
                                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                                <Text style={styles.category} numberOfLines={1}>{item.category || 'Creator'}</Text>

                                <View style={styles.statsRow}>
                                    <View style={styles.stat}>
                                        <Text style={styles.statValue}>4.8k</Text>
                                        <Text style={styles.statLabel}>Reach</Text>
                                    </View>
                                    <View style={styles.divider} />
                                    <View style={styles.stat}>
                                        <Text style={styles.statValue}>5.2%</Text>
                                        <Text style={styles.statLabel}>Eng.</Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={styles.viewBtn}
                                    onPress={() => handleViewProfile(item)}
                                >
                                    <Text style={styles.viewBtnText}>View Profile</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    loaderContainer: {
        padding: 40,
        alignItems: 'center',
    },
    header: {
        marginBottom: 20,
    },
    title: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    subtitle: {
        color: '#64748b',
        fontSize: 14,
        marginTop: 4,
    },
    emptyText: {
        color: '#475569',
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 20,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 16,
    },
    card: {
        width: '47%',
        backgroundColor: '#1e1e30',
        borderRadius: 20,
        padding: 12,
        borderWidth: 1,
        borderColor: '#2e2e4e',
        marginBottom: 8,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 12,
        position: 'relative',
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#312e81',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#4f46e5',
    },
    avatarText: {
        color: '#818cf8',
        fontSize: 24,
        fontWeight: 'bold',
    },
    badge: {
        position: 'absolute',
        bottom: -5,
        backgroundColor: '#4f46e5',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    badgeText: {
        color: '#fff',
        fontSize: 8,
        fontWeight: 'bold',
    },
    info: {
        alignItems: 'center',
    },
    name: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    category: {
        color: '#a78bfa',
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 12,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 12,
        marginBottom: 12,
        width: '100%',
    },
    stat: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    statLabel: {
        color: '#64748b',
        fontSize: 9,
    },
    divider: {
        width: 1,
        height: 15,
        backgroundColor: '#2e2e4e',
    },
    viewBtn: {
        width: '100%',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        paddingVertical: 8,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(79, 70, 229, 0.3)',
    },
    viewBtnText: {
        color: '#818cf8',
        fontSize: 11,
        fontWeight: 'bold',
    },
});
