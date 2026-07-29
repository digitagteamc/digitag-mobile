import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCall } from '../context/CallContext';

function formatTime(s: number) {
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/** Persistent pill shown across the whole app whenever a call is running but
 *  the user has navigated away from the full-screen call UI — tapping it
 *  returns to that screen without re-dialing, since the call itself never
 *  stopped (owned by CallProvider, not by app/call.tsx). */
export default function OngoingCallBar() {
    const call = useCall();
    const insets = useSafeAreaInsets();

    if (call.callMode === 'idle' || !call.isMinimized) return null;

    const statusLabel =
        call.callMode === 'active' ? `Connected · ${formatTime(call.elapsedSeconds)}`
            : call.callMode === 'incoming' ? 'Incoming call'
            : 'Calling...';

    return (
        <TouchableOpacity
            style={[styles.bar, { top: insets.top + 6 }]}
            onPress={call.resume}
            activeOpacity={0.85}
        >
            <View style={styles.pulseDot} />
            <Text style={styles.label} numberOfLines={1}>
                {call.remoteName} · {statusLabel}
            </Text>
            <Ionicons name="chevron-up" size={16} color="#fff" />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    bar: {
        position: 'absolute',
        left: 12,
        right: 12,
        zIndex: 999,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#16213E',
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    pulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#22C55E',
    },
    label: {
        flex: 1,
        color: '#fff',
        fontSize: 13,
        fontFamily: 'Poppins_500Medium',
    },
});
