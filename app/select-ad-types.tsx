import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AdDurationSheet, { AdDuration } from '../Components/AdDurationSheet';
import { useAuth } from '../context/AuthContext';
import { getChannelById } from '../services/userService';
import { fonts } from '../theme/colors';

// Same ids as the Ad Types row on youtube-channel-detail.
const AD_TYPES = [
    {
        id: 'ad-1',
        name: 'Strip Ad',
        short: 'Appears before or during videos.',
        long: 'Appears before or during videos as a skippable ad.',
        image: require('../assets/ad-types/strip.png'),
        thumb: require('../assets/ad-types/strip-thumb.png'),
    },
    {
        id: 'ad-2',
        name: 'Banner Ad',
        short: 'Display banner on channel page or video page.',
        long: 'Display banner on channel page or video page.',
        image: require('../assets/ad-types/banner.png'),
    },
    {
        id: 'ad-3',
        name: 'Corner Ads',
        short: 'Small non-intrusive ad on the video corner.',
        long: 'Small non-intrusive ad on the video corner.',
        image: require('../assets/ad-types/corner.png'),
    },
    {
        id: 'ad-4',
        name: 'L - Shape Ads',
        short: 'Display ad on right side with video.',
        long: 'Display ad on right side with video.',
        image: require('../assets/ad-types/l-shape.png'),
    },
];

const PREVIEW_SECONDS = 30;
const PREVIEW_START = 12;

function formatTime(seconds: number) {
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function formatPrice(val: any): string | null {
    const n = Number(val);
    if (val === null || val === undefined || !Number.isFinite(n)) return null;
    return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

// "Strip Ad", "strip-ads" and "L - Shape Ads" all reduce to the same key, so
// the local cards match the admin-managed ad types the channel returns.
function adTypeKey(name?: string) {
    return (name || '').toLowerCase().replace(/[^a-z0-9]/g, '').replace(/ads?$/, '');
}

export default function SelectAdTypesScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { channelId, channelName, adType } = useLocalSearchParams<{ channelId?: string; channelName?: string; adType?: string }>();

    const [selected, setSelected] = useState<string[]>([adType || AD_TYPES[0].id]);
    const [previewId, setPreviewId] = useState(adType || AD_TYPES[0].id);
    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(false);
    const [elapsed, setElapsed] = useState(PREVIEW_START);
    const [durationOpen, setDurationOpen] = useState(false);
    const { token } = useAuth();
    // Starting price per ad type for this channel, keyed by adTypeKey().
    const [prices, setPrices] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!token || !channelId) return;
        let active = true;
        getChannelById(token, channelId).then((res) => {
            if (!active || !res.success || !res.data) return;
            const map: Record<string, string> = {};
            for (const a of res.data.adTypes || []) {
                const price = formatPrice(a.startingPrice);
                if (!price) continue;
                map[adTypeKey(a.name)] = price;
                if (a.slug) map[adTypeKey(a.slug)] = price;
            }
            setPrices(map);
        });
        return () => { active = false; };
    }, [token, channelId]);

    const priceFor = (name: string) => prices[adTypeKey(name)];

    // Keeps the design's order rather than the order they were tapped in.
    const selectedTypes = AD_TYPES.filter((a) => selected.includes(a.id));
    const previewIndex = selectedTypes.findIndex((a) => a.id === previewId);
    const preview = selectedTypes[previewIndex];

    useEffect(() => {
        if (!playing) return;
        const timer = setInterval(() => setElapsed((s) => (s + 1) % (PREVIEW_SECONDS + 1)), 1000);
        return () => clearInterval(timer);
    }, [playing]);

    const showPreview = (id: string) => {
        setPreviewId(id);
        setElapsed(PREVIEW_START);
    };

    const toggle = (id: string) => {
        if (selected.includes(id)) {
            const rest = selectedTypes.filter((a) => a.id !== id);
            setSelected(rest.map((a) => a.id));
            if (id === previewId && rest.length) showPreview(rest[0].id);
            if (!rest.length) setPlaying(false);
        } else {
            setSelected([...selected, id]);
            showPreview(id);
        }
    };

    const step = (delta: number) => {
        const next = selectedTypes[previewIndex + delta];
        if (next) showPreview(next.id);
    };

    const handleDuration = ({ from, to, location, language }: AdDuration) => {
        setDurationOpen(false);
        router.push({
            pathname: '/brands/ad-design',
            params: {
                channelId: channelId ?? '',
                channelName: channelName ?? '',
                adTypes: selectedTypes.map((a) => a.name).join('|'),
                from: from.toISOString(),
                to: to.toISOString(),
                location,
                language,
            },
        } as any);
    };

    const canGoBack = previewIndex > 0;
    const canGoNext = previewIndex >= 0 && previewIndex < selectedTypes.length - 1;

    return (
        <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
            <StatusBar barStyle="light-content" backgroundColor="#08080D" />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 92 }}
            >
                <View style={styles.titleRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.title}>Select Ad Types</Text>
                        <Text style={styles.subtitle}>Choose one or more ad types to preview</Text>
                    </View>
                    <TouchableOpacity style={styles.closeBtn} activeOpacity={0.8} onPress={() => router.back()}>
                        <Ionicons name="close" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Preview */}
                <View style={styles.previewCard}>
                    <View style={styles.previewHeader}>
                        <Text style={styles.previewTitle}>
                            Preview <Text style={styles.previewCount}>({selectedTypes.length} selected)</Text>
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity
                                style={[styles.stepBtn, !canGoBack && styles.stepBtnOff]}
                                disabled={!canGoBack}
                                onPress={() => step(-1)}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="chevron-back" size={16} color={canGoBack ? '#fff' : '#77778A'} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.stepBtn, !canGoNext && styles.stepBtnOff]}
                                disabled={!canGoNext}
                                onPress={() => step(1)}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="chevron-forward" size={16} color={canGoNext ? '#fff' : '#77778A'} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.player}>
                        {preview ? (
                            <View style={styles.playerImage}>
                                <Image source={preview.image} style={styles.fill} resizeMode="cover" />
                            </View>
                        ) : (
                            <View style={[styles.playerImage, styles.playerEmpty]}>
                                <Text style={styles.playerEmptyText}>Select an ad type to preview</Text>
                            </View>
                        )}
                        <View style={styles.progressTrack}>
                            <View style={[styles.progressFill, { width: `${(elapsed / PREVIEW_SECONDS) * 100}%` }]} />
                        </View>
                        <View style={styles.controls}>
                            <TouchableOpacity onPress={() => setPlaying((p) => !p)} disabled={!preview} activeOpacity={0.7}>
                                <Ionicons name={playing ? 'pause' : 'play'} size={20} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setMuted((m) => !m)} activeOpacity={0.7}>
                                <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={20} color="#fff" />
                            </TouchableOpacity>
                            <Text style={styles.time}>{formatTime(elapsed)} / {formatTime(PREVIEW_SECONDS)}</Text>
                            <View style={{ flex: 1 }} />
                            <Ionicons name="tablet-landscape-outline" size={18} color="#fff" />
                            <Ionicons name="scan-outline" size={20} color="#fff" />
                        </View>
                    </View>

                    {!!preview && (
                        <View style={styles.previewInfo}>
                            <LinearGradient colors={['#6C47FF', '#8B5CF6']} style={styles.previewIcon}>
                                <Ionicons name="play" size={16} color="#fff" />
                            </LinearGradient>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.previewName}>
                                    {preview.name}
                                    {!!priceFor(preview.name) && (
                                        <Text style={styles.previewPrice}>  ·  From {priceFor(preview.name)}</Text>
                                    )}
                                </Text>
                                <Text style={styles.previewText} numberOfLines={2}>{preview.long}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.learnBtn}
                                activeOpacity={0.8}
                                onPress={() => Alert.alert(preview.name, preview.long)}
                            >
                                <Text style={styles.learnText}>Learn more</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Ad Types */}
                <View style={styles.sectionRow}>
                    <Text style={styles.sectionTitle}>Ad Types</Text>
                    <View style={styles.countPill}>
                        <Text style={styles.countText}>{selectedTypes.length} selected</Text>
                    </View>
                </View>

                <View style={styles.grid}>
                    {AD_TYPES.map((item) => {
                        const isOn = selected.includes(item.id);
                        return (
                            <TouchableOpacity
                                key={item.id}
                                activeOpacity={0.85}
                                onPress={() => toggle(item.id)}
                                style={[styles.card, isOn && styles.cardOn]}
                            >
                                <View style={styles.cardImage}>
                                    <Image source={item.thumb ?? item.image} style={styles.fill} resizeMode="cover" />
                                </View>
                                <View style={[styles.check, isOn && styles.checkOn]}>
                                    {isOn && <Ionicons name="checkmark" size={16} color="#fff" />}
                                </View>
                                <Text style={styles.cardTitle}>{item.name}</Text>
                                <Text style={styles.cardText}>{item.short}</Text>
                                {!!priceFor(item.name) && (
                                    <Text style={styles.cardPrice}>
                                        <Text style={styles.cardPriceLabel}>From </Text>
                                        {priceFor(item.name)}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            <View style={[styles.footer, { bottom: insets.bottom + 12 }]}>
                <TouchableOpacity
                    onPress={() => setDurationOpen(true)}
                    disabled={selectedTypes.length === 0}
                    activeOpacity={0.85}
                    style={[styles.footerBtn, selectedTypes.length === 0 && { opacity: 0.5 }]}
                >
                    <LinearGradient
                        colors={['#1A8CFF', '#6633E5']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.footerGradient}
                    >
                        <Text style={styles.footerText}>Selected Ads ({selectedTypes.length})</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            <AdDurationSheet
                visible={durationOpen}
                onClose={() => setDurationOpen(false)}
                onContinue={handleDuration}
            />
        </View>
    );
}

const CARD_BORDER = 'rgba(255,255,255,0.1)';

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#08080D',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        color: '#fff',
        fontSize: 20,
        fontFamily: fonts.bold,
    },
    subtitle: {
        color: '#C5C5D2',
        fontSize: 12,
        fontFamily: fonts.regular,
        marginTop: 2,
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.14)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    previewCard: {
        backgroundColor: '#12121A',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: CARD_BORDER,
        padding: 12,
    },
    previewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    previewTitle: {
        color: '#fff',
        fontSize: 13,
        fontFamily: fonts.semibold,
    },
    previewCount: {
        color: '#8B6DFF',
    },
    stepBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#6C47FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepBtnOff: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    player: {
        backgroundColor: '#050508',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: CARD_BORDER,
        padding: 8,
    },
    fill: {
        width: '100%',
        height: '100%',
    },
    playerImage: {
        width: '100%',
        aspectRatio: 345 / 124,
        borderRadius: 6,
        overflow: 'hidden',
    },
    playerEmpty: {
        backgroundColor: '#14141E',
        alignItems: 'center',
        justifyContent: 'center',
    },
    playerEmptyText: {
        color: '#8A8A9A',
        fontSize: 12,
        fontFamily: fonts.regular,
    },
    progressTrack: {
        height: 3,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginTop: 10,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#8B5CF6',
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 8,
        paddingHorizontal: 4,
    },
    time: {
        color: '#fff',
        fontSize: 10,
        fontFamily: fonts.regular,
    },
    previewInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 12,
        paddingHorizontal: 4,
    },
    previewIcon: {
        width: 30,
        height: 30,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    previewName: {
        color: '#fff',
        fontSize: 12,
        fontFamily: fonts.semibold,
    },
    previewPrice: {
        color: '#A78BFA',
        fontFamily: fonts.medium,
    },
    previewText: {
        color: '#A1A2A4',
        fontSize: 10,
        fontFamily: fonts.regular,
    },
    learnBtn: {
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    learnText: {
        color: '#fff',
        fontSize: 10,
        fontFamily: fonts.medium,
    },
    sectionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 20,
        marginBottom: 10,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 16,
        fontFamily: fonts.semibold,
    },
    countPill: {
        paddingHorizontal: 12,
        paddingVertical: 3,
        borderRadius: 12,
        backgroundColor: 'rgba(108,71,255,0.22)',
    },
    countText: {
        color: '#A78BFA',
        fontSize: 11,
        fontFamily: fonts.medium,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 10,
    },
    card: {
        width: '48.5%',
        backgroundColor: '#12121A',
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: CARD_BORDER,
        padding: 12,
    },
    cardOn: {
        backgroundColor: '#14112A',
        borderColor: '#6C47FF',
    },
    cardImage: {
        width: '100%',
        aspectRatio: 150 / 66,
        borderRadius: 6,
        overflow: 'hidden',
    },
    check: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.75)',
        backgroundColor: '#12121A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkOn: {
        backgroundColor: '#6C47FF',
        borderColor: '#6C47FF',
    },
    cardTitle: {
        color: '#fff',
        fontSize: 13,
        fontFamily: fonts.semibold,
        marginTop: 10,
    },
    cardText: {
        color: '#B5B5C3',
        fontSize: 11,
        fontFamily: fonts.regular,
        lineHeight: 15,
        marginTop: 3,
    },
    cardPrice: {
        color: '#fff',
        fontSize: 13,
        fontFamily: fonts.semibold,
        marginTop: 8,
    },
    cardPriceLabel: {
        color: '#A78BFA',
        fontSize: 11,
        fontFamily: fonts.medium,
    },
    footer: {
        position: 'absolute',
        left: 16,
        right: 16,
    },
    footerBtn: {
        borderRadius: 26,
        overflow: 'hidden',
    },
    footerGradient: {
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerText: {
        color: '#fff',
        fontSize: 15,
        fontFamily: fonts.semibold,
    },
});
