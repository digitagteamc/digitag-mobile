import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useState } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { createReport } from '../../services/userService';

const { width } = Dimensions.get('window');

const QUICK_REASONS = ['Spam', 'Abusive or offensive', 'Fake profile', 'Inappropriate content', 'Other'];

interface Props {
    visible: boolean;
    type: 'USER' | 'POST';
    targetId: string;
    targetName: string;
    onClose: () => void;
    onSubmitted?: () => void;
}

export default function ReportModal({ visible, type, targetId, targetName, onClose, onSubmitted }: Props) {
    const { token } = useAuth();
    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [details, setDetails] = useState('');
    const [busy, setBusy] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const reset = () => {
        setSelectedReason(null);
        setDetails('');
        setSubmitted(false);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleSubmit = async () => {
        if (!token || !selectedReason || busy) return;
        setBusy(true);
        try {
            const reason = selectedReason === 'Other' && details.trim() ? details.trim() : selectedReason;
            const res = await createReport(token, { type, targetId, targetName, reason });
            if (res.success) setSubmitted(true);
        } finally {
            setBusy(false);
        }
    };

    if (submitted) {
        return (
            <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose} statusBarTranslucent>
                <View style={styles.overlay}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
                    <View style={styles.card}>
                        <Ionicons name="checkmark-circle" size={48} color="#4ADE80" style={{ alignSelf: 'center', marginBottom: 16 }} />
                        <Text style={styles.title}>Report Submitted</Text>
                        <Text style={styles.subtitle}>
                            Thank you. Our team reviews reports and takes action within 24 hours.
                        </Text>
                        <TouchableOpacity
                            style={styles.confirmBtn}
                            onPress={() => { handleClose(); onSubmitted?.(); }}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.confirmBtnText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose} statusBarTranslucent>
            <View style={styles.overlay}>
                <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
                <View style={styles.card}>
                    <TouchableOpacity style={styles.closeBtn} onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <BlurView intensity={20} tint="light" style={styles.closeBtnInner}>
                            <Ionicons name="close" size={18} color="#fff" />
                        </BlurView>
                    </TouchableOpacity>

                    <Text style={styles.title}>{type === 'POST' ? 'Report Post' : 'Report User'}</Text>
                    <Text style={styles.subtitle}>Let us know what's wrong. We review every report.</Text>

                    <View style={styles.chipsWrap}>
                        {QUICK_REASONS.map((reason) => {
                            const isSelected = selectedReason === reason;
                            return (
                                <TouchableOpacity
                                    key={reason}
                                    onPress={() => setSelectedReason(reason)}
                                    style={[styles.chip, isSelected && styles.chipSelected]}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{reason}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {selectedReason === 'Other' && (
                        <TextInput
                            style={styles.input}
                            placeholder="Describe the issue…"
                            placeholderTextColor="rgba(255,255,255,0.35)"
                            value={details}
                            onChangeText={setDetails}
                            multiline
                            maxLength={500}
                        />
                    )}

                    <TouchableOpacity
                        onPress={handleSubmit}
                        activeOpacity={0.8}
                        disabled={!selectedReason || busy || (selectedReason === 'Other' && !details.trim())}
                        style={[
                            styles.confirmBtn,
                            { opacity: !selectedReason || busy || (selectedReason === 'Other' && !details.trim()) ? 0.5 : 1 },
                        ]}
                    >
                        <Text style={styles.confirmBtnText}>{busy ? 'Submitting…' : 'Submit Report'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const CARD_WIDTH = width - 48;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    card: {
        width: CARD_WIDTH,
        backgroundColor: '#17171F',
        borderRadius: 28,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        padding: 28,
        paddingTop: 36,
    },
    closeBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
    },
    closeBtnInner: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    title: {
        color: '#fff',
        fontSize: 20,
        fontFamily: 'Poppins_700Bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 13,
        fontFamily: 'Poppins_400Regular',
        lineHeight: 19,
        textAlign: 'center',
        marginBottom: 20,
    },
    chipsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    chipSelected: {
        backgroundColor: 'rgba(226,55,68,0.15)',
        borderColor: '#E23744',
    },
    chipText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        fontFamily: 'Poppins_500Medium',
    },
    chipTextSelected: {
        color: '#FF6B78',
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        borderRadius: 14,
        padding: 14,
        color: '#fff',
        fontSize: 13,
        fontFamily: 'Poppins_400Regular',
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: 16,
    },
    confirmBtn: {
        width: '100%',
        paddingVertical: 15,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E23744',
    },
    confirmBtnText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Poppins_600SemiBold',
    },
});
