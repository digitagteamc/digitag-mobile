import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useAuth } from '../../context/AuthContext';
import { useRoleTheme } from '../../theme/useRoleTheme';

/**
 * In-app video/audio call screen powered by Jitsi Meet.
 * roomId is derived from the collaboration ID so both parties land
 * in the same room automatically.
 *
 * Usage: router.push({ pathname: '/call/[roomId]', params: { roomId, peerName } })
 */
export default function CallScreen() {
    const router = useRouter();
    const { roomId, peerName } = useLocalSearchParams<{ roomId: string; peerName?: string }>();
    const { userPhone } = useAuth();
    const theme = useRoleTheme();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const webRef = useRef<WebView>(null);

    // Sanitise room name — Jitsi needs alphanumeric only
    const room = `digitag-${(roomId || 'room').replace(/[^a-zA-Z0-9]/g, '')}`;
    const displayName = encodeURIComponent(userPhone ? `User ${userPhone.slice(-4)}` : 'User');

    // Jitsi Meet URL with pre-joined config via URL params
    const jitsiUrl =
        `https://meet.jit.si/${room}` +
        `#userInfo.displayName="${displayName}"` +
        `&config.startWithVideoMuted=false` +
        `&config.startWithAudioMuted=false` +
        `&config.prejoinPageEnabled=false` +
        `&interfaceConfig.SHOW_JITSI_WATERMARK=false` +
        `&interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false`;

    const handleEnd = () => {
        Alert.alert('End Call', 'Are you sure you want to end the call?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'End Call', style: 'destructive', onPress: () => router.back() },
        ]);
    };

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />
            <SafeAreaView style={styles.safe} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={20} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>{peerName || 'In Call'}</Text>
                        <Text style={styles.headerSub}>Digitag Call</Text>
                    </View>
                    <TouchableOpacity style={[styles.endBtn, { backgroundColor: '#EF4444' }]} onPress={handleEnd}>
                        <Ionicons name="call" size={16} color="#fff" />
                        <Text style={styles.endBtnText}>End</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {/* WebView with Jitsi */}
            {error ? (
                <View style={styles.errorWrap}>
                    <Ionicons name="wifi-outline" size={48} color="#555" />
                    <Text style={styles.errorText}>Could not connect to call</Text>
                    <TouchableOpacity
                        style={[styles.retryBtn, { backgroundColor: theme.primary }]}
                        onPress={() => { setError(false); setLoading(true); webRef.current?.reload(); }}
                    >
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.webContainer}>
                    {loading && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color={theme.primary} />
                            <Text style={styles.loadingText}>Connecting to call…</Text>
                        </View>
                    )}
                    <WebView
                        ref={webRef}
                        source={{ uri: jitsiUrl }}
                        style={styles.webview}
                        mediaPlaybackRequiresUserAction={false}
                        allowsInlineMediaPlayback
                        javaScriptEnabled
                        domStorageEnabled
                        allowsFullscreenVideo
                        onLoadEnd={() => setLoading(false)}
                        onError={() => { setLoading(false); setError(true); }}
                        onHttpError={() => { setLoading(false); setError(true); }}
                        userAgent={
                            Platform.OS === 'android'
                                ? 'Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36 Chrome/96.0 Mobile Safari/537.36'
                                : undefined
                        }
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#000' },
    safe: { backgroundColor: '#111' },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 12, paddingVertical: 10, gap: 10,
        backgroundColor: '#111',
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center', justifyContent: 'center',
    },
    headerCenter: { flex: 1 },
    headerTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
    headerSub: { color: '#8A8A99', fontSize: 11, marginTop: 1 },
    endBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    },
    endBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    webContainer: { flex: 1 },
    webview: { flex: 1 },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000',
        alignItems: 'center', justifyContent: 'center', gap: 12,
        zIndex: 10,
    },
    loadingText: { color: '#8A8A99', fontSize: 14 },
    errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, backgroundColor: '#0A0A10' },
    errorText: { color: '#8A8A99', fontSize: 15 },
    retryBtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 30 },
    retryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
