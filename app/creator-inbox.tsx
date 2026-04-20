import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function CreatorInbox() {
    const router = useRouter();
    const { token } = useAuth();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadInbox();
    }, []);

    const loadInbox = async () => {
        // Backend has no collaborations module yet — reconnect when
        // /collaborations endpoints are added.
        setRequests([]);
        setLoading(false);
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        setRequests([]);
        setRefreshing(false);
    };

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        Alert.alert("Coming Soon", "Collaboration responses are not yet available on the server.");
    };

    const StatusBadge = ({ status }: { status: string }) => {
        return (
            <View style={[
                styles.statusBadge,
                status === 'APPROVED' ? styles.statusApproved :
                    status === 'REJECTED' ? styles.statusRejected : styles.statusPending
            ]}>
                <Text style={styles.statusText}>{status}</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.wrapper}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Collaboration Inbox</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#4f46e5" />
                    <Text style={styles.loadingText}>Fetching your requests...</Text>
                </View>
            ) : requests.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.emptyIcon}>📩</Text>
                    <Text style={styles.emptyTitle}>Inboxes are empty</Text>
                    <Text style={styles.emptyDesc}>When brands reach out for collaborations, they will appear here.</Text>
                    <TouchableOpacity style={styles.refreshBtn} onPress={loadInbox}>
                        <Text style={styles.refreshBtnText}>Check Again</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={requests}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View>
                                    <Text style={styles.brandName}>{item.brand?.brandName || 'Brand Partner'}</Text>
                                    <Text style={styles.brandLocation}>
                                        📍 {[item.brand?.city, item.brand?.state].filter(Boolean).join(', ') || 'Global'}
                                    </Text>
                                </View>
                                <StatusBadge status={item.status} />
                            </View>

                            <View style={styles.requirementBox}>
                                <Text style={styles.label}>Campaign Requirement:</Text>
                                <Text style={styles.requirementText}>{item.requirement}</Text>
                            </View>

                            <View style={styles.detailsRow}>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Budget</Text>
                                    <Text style={styles.detailValue}>{item.budget ? `$${item.budget}` : 'TBD'}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Timeline</Text>
                                    <Text style={styles.detailValue}>{item.timeline || 'TBD'}</Text>
                                </View>
                            </View>

                            {item.message && (
                                <View style={styles.messageBox}>
                                    <Text style={styles.label}>Message:</Text>
                                    <Text style={styles.messageText}>{item.message}</Text>
                                </View>
                            )}

                            {item.status === 'PENDING' && (
                                <View style={styles.actions}>
                                    <TouchableOpacity
                                        style={styles.rejectBtn}
                                        onPress={() => handleAction(item.id, 'reject')}
                                    >
                                        <Text style={styles.rejectBtnText}>Decline</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.approveBtn}
                                        onPress={() => handleAction(item.id, 'approve')}
                                    >
                                        <Text style={styles.approveBtnText}>Accept Invitation</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    )}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: '#0b0b14' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#0f0f1e',
        borderBottomWidth: 1,
        borderBottomColor: '#1e1e30',
    },
    backBtn: { padding: 4 },
    backText: { color: '#4f46e5', fontSize: 16, fontWeight: '600' },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    loadingText: { color: '#888', marginTop: 12 },
    emptyIcon: { fontSize: 60, marginBottom: 20 },
    emptyTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
    emptyDesc: { color: '#64748b', textAlign: 'center', lineHeight: 22, fontSize: 15 },
    refreshBtn: { marginTop: 24, backgroundColor: '#4f46e5', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
    refreshBtnText: { color: '#fff', fontWeight: 'bold' },
    listContainer: { padding: 16, paddingBottom: 100 },
    card: {
        backgroundColor: '#16162a',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#232342',
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    brandName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    brandLocation: { color: '#64748b', fontSize: 13, marginTop: 4 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusPending: { backgroundColor: 'rgba(234, 179, 8, 0.1)' },
    statusApproved: { backgroundColor: 'rgba(34, 197, 94, 0.1)' },
    statusRejected: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
    statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    requirementBox: { marginBottom: 16 },
    label: { color: '#4f46e5', fontSize: 12, fontWeight: 'bold', marginBottom: 6, textTransform: 'uppercase' },
    requirementText: { color: '#fff', fontSize: 15, lineHeight: 22 },
    detailsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 12, marginBottom: 16 },
    detailItem: { flex: 1 },
    detailLabel: { color: '#64748b', fontSize: 11, marginBottom: 4 },
    detailValue: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
    messageBox: { backgroundColor: 'rgba(79, 70, 229, 0.05)', padding: 12, borderRadius: 12, marginBottom: 16 },
    messageText: { color: '#94a3b8', fontSize: 14, fontStyle: 'italic' },
    actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
    rejectBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', alignItems: 'center' },
    rejectBtnText: { color: '#ef4444', fontWeight: 'bold' },
    approveBtn: { flex: 2, backgroundColor: '#4f46e5', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    approveBtnText: { color: '#fff', fontWeight: 'bold' },
});
