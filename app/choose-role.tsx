import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useAuth, Role } from '../context/AuthContext';
import { switchRole } from '../services/userService';
import { LinearGradient } from 'expo-linear-gradient';

const creatorImg = require('../assets/images/creator.png');
const freelancerImg = require('../assets/images/freelancer.png');

export default function ChooseRoleScreen() {
    const router = useRouter();
    const { token, userRole, setActiveRole } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleSelectRole = async (selected: Role) => {
        if (selected === userRole) {
            router.replace('/(tabs)');
            return;
        }

        if (!token) return;

        setLoading(true);
        try {
            const res = await switchRole(token, selected);
            if (res.success) {
                setActiveRole(selected);
                router.replace('/(tabs)');
            } else {
                // Ignore error and just go
                router.replace('/(tabs)');
            }
        } catch (e) {
            router.replace('/(tabs)');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <LinearGradient colors={['#000000', '#1a0b2e']} style={StyleSheet.absoluteFill} />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ChevronLeft color="#FFFFFF" size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Switch Profile</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.subtitle}>Which profile would you like to use right now?</Text>

                {loading ? (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="large" color="#ED2A91" />
                        <Text style={styles.loadingText}>Switching...</Text>
                    </View>
                ) : (
                    <View style={styles.cardsRow}>
                        {/* CREATOR CARD */}
                        <TouchableOpacity 
                            activeOpacity={0.8} 
                            style={[styles.card, userRole === 'CREATOR' && styles.cardActiveCreator]}
                            onPress={() => handleSelectRole('CREATOR')}
                        >
                            <Image source={creatorImg} style={styles.cardImg} resizeMode="contain" />
                            <View style={styles.cardBody}>
                                <Text style={[styles.cardTitle, { color: '#ED2A91' }]}>Creator</Text>
                                <Text style={styles.cardDesc}>Publish content and collaborate</Text>
                                {userRole === 'CREATOR' && (
                                    <View style={styles.activeBadgeCreator}>
                                        <Text style={styles.activeBadgeText}>Active</Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>

                        {/* FREELANCER CARD */}
                        <TouchableOpacity 
                            activeOpacity={0.8} 
                            style={[styles.card, userRole === 'FREELANCER' && styles.cardActiveFreelancer]}
                            onPress={() => handleSelectRole('FREELANCER')}
                        >
                            <Image source={freelancerImg} style={styles.cardImg} resizeMode="contain" />
                            <View style={styles.cardBody}>
                                <Text style={[styles.cardTitle, { color: '#F26930' }]}>Freelancer</Text>
                                <Text style={styles.cardDesc}>Offer services and find jobs</Text>
                                {userRole === 'FREELANCER' && (
                                    <View style={styles.activeBadgeFreelancer}>
                                        <Text style={styles.activeBadgeText}>Active</Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
    backBtn: { paddingRight: 15 },
    headerTitle: { color: '#fff', fontSize: 24, fontWeight: '700' },
    content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
    subtitle: { color: '#a0a0b0', fontSize: 16, marginBottom: 40, lineHeight: 24 },
    loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: '#ED2A91', marginTop: 15, fontSize: 16, fontWeight: '600' },
    cardsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    card: { 
        width: '48%', 
        backgroundColor: '#15151A', 
        borderRadius: 20, 
        paddingTop: 80, 
        paddingBottom: 20, 
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2A2A2A',
        position: 'relative'
    },
    cardActiveCreator: {
        borderColor: '#ED2A91',
        backgroundColor: 'rgba(237, 42, 145, 0.1)'
    },
    cardActiveFreelancer: {
        borderColor: '#F26930',
        backgroundColor: 'rgba(242, 105, 48, 0.1)'
    },
    cardImg: {
        position: 'absolute',
        top: -20,
        width: 140,
        height: 140,
        zIndex: 10
    },
    cardBody: {
        alignItems: 'center',
        paddingHorizontal: 15
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8
    },
    cardDesc: {
        fontSize: 12,
        color: '#88889D',
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 10
    },
    activeBadgeCreator: {
        backgroundColor: '#ED2A91',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 10,
        marginTop: 5
    },
    activeBadgeFreelancer: {
        backgroundColor: '#F26930',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 10,
        marginTop: 5
    },
    activeBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase'
    }
});
