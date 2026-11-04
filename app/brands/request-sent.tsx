import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { cancelAdRequest } from '../../services/userService';

const RESPONSE_SECONDS = 23 * 3600 + 47 * 60 + 12;

function formatCountdown(seconds: number) {
    const parts = [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60];
    return parts.map((n) => String(n).padStart(2, '0')).join(' : ');
}

type StepState = 'done' | 'active' | 'pending';

const CHIP_COLORS: Record<StepState, { backgroundColor: string; borderColor: string; color: string }> = {
    done: { backgroundColor: 'rgba(0,229,195,0.14)', borderColor: 'transparent', color: '#00E5C3' },
    active: { backgroundColor: 'rgba(255,181,71,0.16)', borderColor: 'transparent', color: '#FFB547' },
    pending: { backgroundColor: '#0C0C24', borderColor: '#3D3D61', color: '#8B6DFF' },
};

function JourneyStep({ state, title, chips, last }: { state: StepState; title: string; chips: string[]; last?: boolean }) {
    const chip = CHIP_COLORS[state];
    return (
        <View style={{ flexDirection: 'row' }}>
            <View style={{ alignItems: 'center', width: 28 }}>
                {state === 'done' && (
                    <View style={[styles.stepDot, { backgroundColor: '#1FB89A' }]}>
                        <Ionicons name="checkmark" size={14} color="#070711" />
                    </View>
                )}
                {state === 'active' && (
                    <View style={[styles.stepDot, { backgroundColor: '#FFB547' }]}>
                        <View style={styles.stepTarget}>
                            <View style={styles.stepTargetCore} />
                        </View>
                    </View>
                )}
                {state === 'pending' && (
                    <View style={[styles.stepDot, { backgroundColor: '#1A1A36' }]}>
                        <View style={styles.stepHollow} />
                    </View>
                )}
                {!last && <View style={[styles.stepLine, { backgroundColor: state === 'done' ? '#6C47FF' : '#23233F' }]} />}
            </View>
            <View style={{ flex: 1, marginLeft: 12, paddingBottom: last ? 0 : 14 }}>
                <Text style={[styles.stepTitle, state === 'pending' && { color: '#6A6A9A' }]}>{title}</Text>
                <View style={styles.chips}>
                    {chips.map((text) => (
                        <View key={text} style={[styles.chip, { backgroundColor: chip.backgroundColor, borderColor: chip.borderColor }]}>
                            <Text style={[styles.chipText, { color: chip.color }]}>{text}</Text>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
}

export default function RequestSentPage() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { token } = useAuth();
    const { requestId, channelName, adTypes } = useLocalSearchParams<{
        requestId?: string;
        channelName?: string;
        adTypes?: string;
    }>();

    const [countdown, setCountdown] = useState(RESPONSE_SECONDS);
    const [cancelling, setCancelling] = useState(false);

    const creatorName = channelName || 'Arjun Mehta';
    const adTypeNames = (adTypes || 'Strip Ad').split('|');

    useEffect(() => {
        const timer = setInterval(() => setCountdown((s) => Math.max(s - 1, 0)), 1000);
        return () => clearInterval(timer);
    }, []);

    // Ad Design replaced itself with this screen, so two pops reach the channel.
    const leave = () => router.dismiss(2);

    const cancelRequest = async () => {
        if (!requestId || !token) {
            leave();
            return;
        }
        setCancelling(true);
        const res = await cancelAdRequest(token, requestId);
        setCancelling(false);
        if (!res.success) {
            Alert.alert('Could not cancel', res.error || 'Please try again.');
            return;
        }
        leave();
    };

    const confirmCancel = () => {
        Alert.alert('Cancel this request?', `${creatorName} will be told you no longer need this.`, [
            { text: 'Keep it', style: 'cancel' },
            { text: 'Cancel request', style: 'destructive', onPress: cancelRequest },
        ]);
    };

    return (
        <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
            <StatusBar barStyle="light-content" backgroundColor="#050507" />
            <View style={styles.blobTop} />
            <View style={styles.blobRight} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={leave} hitSlop={8}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Request Sent</Text>
                    <TouchableOpacity onPress={leave} activeOpacity={0.8} style={styles.closeBtn}>
                        <Ionicons name="close" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.statusCard}>
                    <View style={[styles.ring, { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(108,71,255,0.14)' }]}>
                        <View style={[styles.ring, { width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(108,71,255,0.22)' }]}>
                            <View style={[styles.ring, { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(108,71,255,0.55)' }]}>
                                <Text style={{ fontSize: 28 }}>⏳</Text>
                            </View>
                        </View>
                    </View>
                    <Text style={styles.statusTitle}>Awaiting Creator</Text>
                    <Text style={styles.statusText}>
                        {creatorName} has been notified.{'\n'}They must respond within the time limit.
                    </Text>
                    <View style={styles.countdown}>
                        <Text style={styles.countdownText}>{formatCountdown(countdown)}</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Journey Progress</Text>
                <JourneyStep state="done" title="Ad Type Selected" chips={adTypeNames} />
                <JourneyStep state="done" title="Creator Chosen" chips={[creatorName]} />
                <JourneyStep state="active" title="Awaiting Acceptance" chips={['In Progress']} />
                <JourneyStep state="pending" title="Payment" chips={['Pending']} last />

                <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={cancelling}
                    onPress={confirmCancel}
                    style={[styles.cancelBtn, cancelling && { opacity: 0.5 }]}
                >
                    <Text style={styles.cancelText}>Cancel Request</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#050507',
        overflow: 'hidden',
    },
    blobTop: {
        position: 'absolute',
        top: -110,
        left: -90,
        width: 280,
        height: 280,
        borderRadius: 140,
        backgroundColor: '#15112E',
    },
    blobRight: {
        position: 'absolute',
        top: '55%',
        right: -150,
        width: 310,
        height: 310,
        borderRadius: 155,
        backgroundColor: '#0B2826',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 12,
        marginBottom: 22,
    },
    headerTitle: {
        flex: 1,
        color: '#fff',
        fontSize: 22,
        fontFamily: 'Poppins_500Medium',
    },
    closeBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(255,255,255,0.22)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusCard: {
        alignItems: 'center',
        backgroundColor: '#17143A',
        borderRadius: 28,
        borderWidth: 1.5,
        borderColor: '#6C47FF',
        paddingTop: 22,
        paddingBottom: 26,
        paddingHorizontal: 16,
    },
    ring: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusTitle: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Poppins_500Medium',
        marginTop: 10,
    },
    statusText: {
        color: '#D2D2D2',
        fontSize: 13,
        fontFamily: 'Poppins_400Regular',
        textAlign: 'center',
        lineHeight: 19,
        marginTop: 4,
    },
    countdown: {
        marginTop: 16,
        paddingHorizontal: 44,
        paddingVertical: 10,
        borderRadius: 24,
        backgroundColor: 'rgba(255,181,71,0.14)',
    },
    countdownText: {
        color: '#FFB547',
        fontSize: 20,
        fontFamily: 'Poppins_600SemiBold',
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 15,
        fontFamily: 'Poppins_500Medium',
        marginTop: 44,
        marginBottom: 10,
    },
    stepDot: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepTarget: {
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: '#070711',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepTargetCore: {
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#070711',
    },
    stepHollow: {
        width: 8,
        height: 8,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: '#8A8AAA',
    },
    stepLine: {
        flex: 1,
        width: 2,
        minHeight: 16,
    },
    stepTitle: {
        color: '#C8C8E8',
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
    },
    chips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 2,
    },
    chip: {
        borderRadius: 11,
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 2,
    },
    chipText: {
        fontSize: 11,
        fontFamily: 'Poppins_500Medium',
    },
    cancelBtn: {
        marginTop: 24,
        height: 46,
        borderRadius: 23,
        borderWidth: 1,
        borderColor: '#3D3D61',
        backgroundColor: '#12122A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelText: {
        color: '#fff',
        fontSize: 15,
        fontFamily: 'Poppins_500Medium',
    },
});
