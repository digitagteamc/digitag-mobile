import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    Share,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { checkCollabStatus, submitCollabRequest } from '../services/userService';

export default function CreatorDetails() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { token, userRole, isGuest } = useAuth();

    console.log(`👤 CreatorDetails - Role: "${userRole}", isGuest: ${isGuest}`);

    const {
        id,
        name,
        category,
        city,
        state,
        instagram,
        email,
        phoneNumber
    } = params;

    // Collab Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [existingRequest, setExistingRequest] = useState<{ contacted: boolean; status: string | null }>({
        contacted: false,
        status: null
    });

    const [form, setForm] = useState({
        requirement: '',
        budget: '',
        timeline: '',
        message: ''
    });

    const isBrand = userRole?.toUpperCase() === 'BRAND';

    useEffect(() => {
        if (isBrand && token && id) {
            loadExistingRequest();
        }
    }, [id, token, isBrand]);

    const loadExistingRequest = async () => {
        const res = await checkCollabStatus(token!, id as string);
        if (res.success && res.data) {
            setExistingRequest(res.data);
        }
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out ${name} on Digitag! Category: ${category}`,
            });
        } catch (error: any) {
            Alert.alert(error.message);
        }
    };

    const handleInstagram = () => {
        if (instagram) {
            Linking.openURL(`https://instagram.com/${instagram}`);
        }
    };

    const handleEmail = () => {
        if (email) {
            Linking.openURL(`mailto:${email}`);
        }
    };

    const handleCollabSubmit = async () => {
        console.log("🚀 Submit attempt - isBrand:", isBrand, "Role:", userRole);

        if (!isBrand) {
            Alert.alert(
                "Permission Denied",
                `Only brand accounts can send requests. Your current role is: ${userRole || 'Guest'}`
            );
            return;
        }

        if (!form.requirement.trim()) {
            Alert.alert("Requirement Missing", "Please specify your requirements.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await submitCollabRequest(token || '', {
                creatorId: id as string,
                requirement: form.requirement.trim(),
                budget: form.budget.trim(),
                timeline: form.timeline.trim(),
                message: form.message.trim(),
            });

            if (res.success) {
                Alert.alert("Success 🎉", "Your collaboration request has been sent to the creator!");
                setIsModalOpen(false);
                setExistingRequest({ contacted: true, status: 'PENDING' });
                setForm({ requirement: '', budget: '', timeline: '', message: '' });
            } else {
                Alert.alert("Error", res.error || "Failed to send request.");
            }
        } catch (error) {
            console.error("Collab submission error:", error);
            Alert.alert("Error", "Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const getCollabBtnText = () => {
        if (!isBrand) return "Send Collaboration Proposal";
        if (existingRequest.contacted) {
            return `Invitation ${existingRequest.status}`;
        }
        return "Send Collaboration Proposal";
    };

    return (
        <SafeAreaView style={styles.wrapper}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Creator Profile</Text>
                <View style={styles.headerRight}>
                    {userRole?.toUpperCase() === 'CREATOR' && (
                        <TouchableOpacity
                            onPress={() => router.push('/creator-inbox')}
                            style={styles.headerIconBtn}
                        >
                            <Text style={styles.shareEmoji}>🔔</Text>
                            <View style={styles.headerNotifDot} />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={handleShare} style={styles.headerIconBtn}>
                        <Text style={styles.shareEmoji}>🔗</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {/* Profile Hero Section */}
                <View style={styles.profileHero}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarInitial}>
                            {name ? (name as string).charAt(0).toUpperCase() : '?'}
                        </Text>
                    </View>
                    <Text style={styles.name}>{name}</Text>
                    <Text style={styles.category}>{category}</Text>

                    {(city || state) && (
                        <View style={styles.locationBadge}>
                            <Text style={styles.locationText}>
                                📍 {[city, state].filter(Boolean).join(', ')}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Status Badge for Existing Request */}
                {existingRequest.contacted && (
                    <View style={[
                        styles.requestStatusBar,
                        existingRequest.status === 'APPROVED' ? styles.statusApproved :
                            existingRequest.status === 'REJECTED' ? styles.statusRejected : styles.statusPending
                    ]}>
                        <Text style={styles.requestStatusText}>
                            {existingRequest.status === 'PENDING' ? '⏳ Request Pending Approval' :
                                existingRequest.status === 'APPROVED' ? '✅ Collaboration Approved' :
                                    '❌ Invitation Rejected'}
                        </Text>
                    </View>
                )}

                {/* Details Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact & Socials</Text>

                    {instagram && (
                        <TouchableOpacity style={styles.detailCard} onPress={handleInstagram}>
                            <View style={styles.detailIconBg}>
                                <Text style={styles.detailEmoji}>📸</Text>
                            </View>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Instagram</Text>
                                <Text style={styles.detailValue}>@{instagram}</Text>
                            </View>
                            <Text style={styles.arrow}>→</Text>
                        </TouchableOpacity>
                    )}

                    {email && (
                        <TouchableOpacity style={styles.detailCard} onPress={handleEmail}>
                            <View style={styles.detailIconBg}>
                                <Text style={styles.detailEmoji}>📧</Text>
                            </View>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Email Address</Text>
                                <Text style={styles.detailValue}>{email}</Text>
                            </View>
                            <Text style={styles.arrow}>→</Text>
                        </TouchableOpacity>
                    )}

                    {phoneNumber && (
                        <View style={styles.detailCard}>
                            <View style={styles.detailIconBg}>
                                <Text style={styles.detailEmoji}>📱</Text>
                            </View>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Phone Number</Text>
                                <Text style={styles.detailValue}>{phoneNumber}</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* About/Stats Placeholder */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Performance</Text>
                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Reach</Text>
                            <Text style={styles.statValue}>10k+</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Engagement</Text>
                            <Text style={styles.statValue}>4.5%</Text>
                        </View>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.brandButton,
                        (!isBrand || existingRequest.contacted) && styles.brandButtonDisabled
                    ]}
                    onPress={() => setIsModalOpen(true)}
                    activeOpacity={0.8}
                    disabled={!isBrand || existingRequest.contacted}
                >
                    <Text style={styles.brandButtonText}>{getCollabBtnText()}</Text>
                </TouchableOpacity>
            </View>

            {/* Collaboration Request Modal */}
            <Modal
                visible={isModalOpen}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsModalOpen(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Collab Proposal</Text>
                            <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                                <Text style={styles.closeBtn}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalLabel}>Campaign Requirement *</Text>
                            <TextInput
                                style={[styles.modalInput, styles.textArea]}
                                placeholder="e.g. 2 Reels and 1 Story for brand launch"
                                placeholderTextColor="#555"
                                multiline
                                numberOfLines={3}
                                value={form.requirement}
                                onChangeText={v => setForm(f => ({ ...f, requirement: v }))}
                            />

                            <View style={styles.modalRow}>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <Text style={styles.modalLabel}>Budget ($)</Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        placeholder="e.g. 500"
                                        placeholderTextColor="#555"
                                        keyboardType="numeric"
                                        value={form.budget}
                                        onChangeText={v => setForm(f => ({ ...f, budget: v }))}
                                    />
                                </View>
                                <View style={{ flex: 1, marginLeft: 8 }}>
                                    <Text style={styles.modalLabel}>Timeline</Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        placeholder="e.g. 2 weeks"
                                        placeholderTextColor="#555"
                                        value={form.timeline}
                                        onChangeText={v => setForm(f => ({ ...f, timeline: v }))}
                                    />
                                </View>
                            </View>

                            <Text style={styles.modalLabel}>Message (Optional)</Text>
                            <TextInput
                                style={[styles.modalInput, styles.textArea]}
                                placeholder="Any specific notes or questions?"
                                placeholderTextColor="#555"
                                multiline
                                numberOfLines={3}
                                value={form.message}
                                onChangeText={v => setForm(f => ({ ...f, message: v }))}
                            />

                            <TouchableOpacity
                                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                                onPress={handleCollabSubmit}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.submitButtonText}>Submit Invite</Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: '#0f0f1e' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#1e1e30',
    },
    backBtn: {
        paddingVertical: 5,
        paddingHorizontal: 10,
    },
    backText: { color: '#4f46e5', fontSize: 16, fontWeight: '600' },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIconBtn: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        position: 'relative',
    },
    headerNotifDot: {
        position: 'absolute',
        top: 4,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ef4444',
    },
    shareEmoji: { fontSize: 18 },
    container: { padding: 20 },
    profileHero: {
        alignItems: 'center',
        paddingVertical: 30,
        backgroundColor: '#16162a',
        borderRadius: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#2e2e4e',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#312e81',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    avatarInitial: { color: '#818cf8', fontSize: 40, fontWeight: 'bold' },
    name: { color: '#fff', fontSize: 26, fontWeight: '800', marginBottom: 4 },
    category: { color: '#a78bfa', fontSize: 16, fontWeight: '600', marginBottom: 16 },
    locationBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    locationText: { color: '#94a3b8', fontSize: 13 },
    section: { marginBottom: 24 },
    sectionTitle: { color: '#64748b', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
    detailCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e1e30',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#2e2e4e',
    },
    detailIconBg: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    detailEmoji: { fontSize: 20 },
    detailContent: { flex: 1 },
    detailLabel: { color: '#64748b', fontSize: 12, marginBottom: 2 },
    detailValue: { color: '#fff', fontSize: 15, fontWeight: '600' },
    arrow: { color: '#444', fontSize: 18 },
    statsRow: { flexDirection: 'row', gap: 12 },
    statBox: {
        flex: 1,
        backgroundColor: '#1e1e30',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#2e2e4e',
        alignItems: 'center',
    },
    statLabel: { color: '#64748b', fontSize: 12, marginBottom: 4 },
    statValue: { color: '#4f46e5', fontSize: 20, fontWeight: '800' },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#1e1e30',
        backgroundColor: '#0f0f1e',
    },
    brandButton: {
        backgroundColor: '#4f46e5',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    brandButtonDisabled: {
        backgroundColor: '#1e1e30',
        borderColor: '#2e2e4e',
        borderWidth: 1,
    },
    brandButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#16162a',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
    closeBtn: { color: '#64748b', fontSize: 24, fontWeight: 'bold' },
    modalForm: { marginBottom: 20 },
    modalLabel: { color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
    modalInput: {
        backgroundColor: '#1e1e30',
        color: '#fff',
        padding: 16,
        borderRadius: 16,
        fontSize: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#2e2e4e',
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    modalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    submitButton: {
        backgroundColor: '#4f46e5',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 10,
    },
    submitButtonDisabled: { opacity: 0.6 },
    submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    // Collaboration Status Bar
    requestStatusBar: {
        marginHorizontal: 20,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 20,
        alignItems: 'center',
    },
    statusPending: {
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(234, 179, 8, 0.3)',
    },
    statusApproved: {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(34, 197, 94, 0.3)',
    },
    statusRejected: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    requestStatusText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
});
