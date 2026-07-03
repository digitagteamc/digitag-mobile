import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    withSequence,
    withDelay,
    withSpring,
    withRepeat,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee from '@notifee/react-native';

const PENDING_CALL_KEY = '@pending_incoming_call';
const INTRO_DURATION_MS = 4000;

// Box dimensions
const BOX_SIZE = 130;
const BOX_RADIUS = 32;
const WAVE_H = 37;
const SVG_W = 637;

// ─────────────────────────────────────────────────────────────────
// Exact SVG wave paths extracted from Figma node 6736-9195
// ─────────────────────────────────────────────────────────────────
const WAVE_PATH_WHITE =
    'M0 0V36.2487L637 36.8333V0L603.796 6.43263C597.811 7.59214 591.67 7.70035 585.648 6.7524L550.528 1.2243C545.371 0.412638 540.123 0.374524 534.955 1.11121L492.544 7.15723C487.76 7.83927 482.904 7.85746 478.115 7.21129L431.956 0.983507C427.12 0.331022 422.217 0.355977 417.388 1.05765L375.676 7.11826C370.805 7.82603 365.859 7.84524 360.982 7.17535L316.502 1.06493C311.362 0.358877 306.147 0.418531 301.024 1.24195L266.661 6.76604C260.818 7.70537 254.858 7.64995 249.033 6.60211L222.117 1.76001C215.652 0.597004 209.026 0.657566 202.584 1.93856L179.269 6.57415C173.901 7.64161 168.398 7.8629 162.961 7.23002L121.928 2.45375C117.934 1.98877 113.899 1.98431 109.903 2.44047L66.1427 7.43634C61.7869 7.93361 57.3861 7.88334 53.0428 7.28669L0 0Z';

const WAVE_PATH_GRADIENT =
    'M0.75 0.909244V37.1579L637.75 37.7426V0.909244L604.546 7.34188C598.561 8.50138 592.42 8.60959 586.398 7.66164L551.278 2.13354C546.121 1.32188 540.873 1.28377 535.705 2.02046L493.294 8.06647C488.51 8.74851 483.654 8.7667 478.865 8.12053L432.706 1.89275C427.87 1.24027 422.967 1.26522 418.138 1.9669L376.426 8.02751C371.555 8.73527 366.609 8.75449 361.732 8.08459L317.252 1.97417C312.112 1.26812 306.896 1.32778 301.774 2.1512L267.411 7.67528C261.568 8.61462 255.608 8.55919 249.783 7.51135L222.867 2.66926C216.402 1.50625 209.776 1.56681 203.334 2.8478L180.019 7.4834C174.651 8.55085 169.148 8.77215 163.711 8.13926L122.678 3.36299C118.684 2.89801 114.649 2.89356 110.653 3.34971L66.8927 8.34559C62.5369 8.84286 58.1361 8.79258 53.7928 8.19593L0.75 0.909244Z';

// ─────────────────────────────────────────────────────────────────
// PerfectLiquidWave
// A completely realistic liquid fill using the actual SVG shapes.
// Features horizontal swashing (panning) while vertically filling.
// ─────────────────────────────────────────────────────────────────
const PerfectLiquidWave = ({
    color = 'rgba(255, 255, 255, 1)',
    delay = 0,
    fillDuration = 2400,
    isGradient = false,
}: {
    color?: string;
    delay?: number;
    fillDuration?: number;
    isGradient?: boolean;
}) => {
    const translateY = useSharedValue(0); // Starts below the box
    const translateX = useSharedValue(0); // Swashes left/right

    useEffect(() => {
        // Vertical Fill: Rise from below to the top of the box
        // - (BOX_SIZE + WAVE_H) ensures the top edge of the liquid reaches the top edge of the box
        translateY.value = withDelay(
            delay,
            withTiming(-(BOX_SIZE + WAVE_H), { duration: fillDuration, easing: Easing.inOut(Easing.cubic) })
        );

        // Horizontal Swash: Ping-pong the SVG path left and right to simulate liquid moving
        // We have 637px of SVG, moving it by -150px gives plenty of room without clipping
        translateX.value = withDelay(
            delay,
            withRepeat(
                withSequence(
                    withTiming(isGradient ? -150 : 150, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
                    withTiming(isGradient ? 50 : -50, { duration: 1200, easing: Easing.inOut(Easing.sin) })
                ),
                -1,
                true // reverse automatically
            )
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
            { translateX: translateX.value },
        ],
    }));

    return (
        <Animated.View
            style={[
                {
                    position: 'absolute',
                    // Total width is SVG width. Center it so we can pan left and right.
                    width: SVG_W,
                    left: -(SVG_W - BOX_SIZE) / 2, // Centered inside the 130px box
                    
                    // Height is the box size PLUS wave height so it can fully cover the background
                    height: BOX_SIZE + WAVE_H,
                    
                    // Start positioned perfectly beneath the box
                    top: BOX_SIZE,
                },
                animatedStyle,
            ]}
        >
            {/* SVG Wave Peak */}
            <Svg viewBox={`0 0 ${isGradient ? '638.5 38.5' : '637 36.84'}`} width={SVG_W} height={WAVE_H}>
                {isGradient && (
                    <Defs>
                        <SvgLinearGradient id="waveGrad" x1="0" y1="0" x2="1" y2="0">
                            <Stop offset="0" stopColor="#ED2A91" />
                            <Stop offset="1" stopColor="#F26930" />
                        </SvgLinearGradient>
                    </Defs>
                )}
                <Path
                    d={isGradient ? WAVE_PATH_GRADIENT : WAVE_PATH_WHITE}
                    fill={isGradient ? 'url(#waveGrad)' : color}
                    stroke={isGradient ? '#F26930' : 'none'}
                    strokeWidth={isGradient ? 1.5 : 0}
                />
            </Svg>

            {/* Solid liquid body sitting below the wave peak */}
            {isGradient ? (
                <LinearGradient
                    colors={['#ED2A91', '#F26930']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ position: 'absolute', top: WAVE_H - 1, bottom: 0, width: SVG_W }}
                />
            ) : (
                <View style={{ backgroundColor: color, position: 'absolute', top: WAVE_H - 1, bottom: 0, width: SVG_W }} />
            )}
        </Animated.View>
    );
};

// ─────────────────────────────────────────────────────────────────
// Main Intro Screen
// ─────────────────────────────────────────────────────────────────
export default function Index() {
    const { isLoading, token, isGuest, hasOnboarded } = useAuth();
    const router = useRouter();
    const [introDone, setIntroDone] = useState(false);

    // ── Logo box collapse after fill ──
    const boxScale = useSharedValue(1);
    const boxOpacity = useSharedValue(1);

    // ── App icon (logo-animate.png) ──
    const logoScale = useSharedValue(0);
    const logoOpacity = useSharedValue(0);
    const flashOpacity = useSharedValue(0);

    // ── "digitag" text (digitag-animate.png) ──
    const textOpacity = useSharedValue(0);
    const textTranslateY = useSharedValue(18);

    // ── Full screen fade-out ──
    const screenOpacity = useSharedValue(1);

    useEffect(() => {
        // Phase 1: Liquid filling takes ~2600ms
        const FILL_DONE_TIME = 2600;

        // ── Phase 2: Box fades & scales down slowly ──
        const COLLAPSE_START = FILL_DONE_TIME + 200;
        boxOpacity.value = withDelay(COLLAPSE_START, withTiming(0, { duration: 250 }));
        boxScale.value = withDelay(COLLAPSE_START, withTiming(0.8, { duration: 250 }));

        // ── Phase 3: App icon bounces in ──
        const LOGO_START = COLLAPSE_START + 100;
        logoOpacity.value = withDelay(LOGO_START, withTiming(1, { duration: 220 }));
        logoScale.value = withDelay(
            LOGO_START,
            withSpring(1, { damping: 10, stiffness: 180, mass: 0.8 })
        );

        // Flash burst when logo pops to full size
        flashOpacity.value = withDelay(
            LOGO_START + 200,
            withSequence(
                withTiming(0.8, { duration: 60, easing: Easing.linear }),
                withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) })
            )
        );

        // ── Phase 4: "digitag" text slides up ──
        const TEXT_START = LOGO_START + 150;
        textOpacity.value = withDelay(TEXT_START, withTiming(1, { duration: 400 }));
        textTranslateY.value = withDelay(
            TEXT_START,
            withTiming(0, { duration: 450, easing: Easing.out(Easing.cubic) })
        );

        // ── Phase 5: Fade whole screen to black before navigate ──
        const fadeTimer = setTimeout(() => {
            screenOpacity.value = withTiming(0, { duration: 400 });
        }, INTRO_DURATION_MS - 420);

        return () => clearTimeout(fadeTimer);
    }, []);

    // ── Navigation ──
    useEffect(() => {
        const checkPendingCall = async () => {
            const stored = await AsyncStorage.getItem(PENDING_CALL_KEY);
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    if (parsed?.callId) {
                        await AsyncStorage.removeItem(PENDING_CALL_KEY);
                        router.replace({
                            pathname: '/call',
                            params: { mode: 'incoming', callId: parsed.callId, remoteName: parsed.callerName },
                        } as any);
                        return;
                    }
                } catch {}
            }
            const initial = await notifee.getInitialNotification();
            const data = initial?.notification?.data as Record<string, string> | undefined;
            if (data?.type === 'INCOMING_CALL' && data.callId) {
                router.replace({
                    pathname: '/call',
                    params: { mode: 'incoming', callId: data.callId, remoteName: data.callerName },
                } as any);
            }
        };
        checkPendingCall();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setIntroDone(true), INTRO_DURATION_MS);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!introDone || isLoading) return;
        if (token || isGuest) {
            router.replace('/(tabs)');
        } else if (hasOnboarded) {
            router.replace('/role-selection');
        } else {
            router.replace('/onboarding/splash1');
        }
    }, [introDone, isLoading]);

    // ── Animated styles ──
    const screenStyle = useAnimatedStyle(() => ({
        flex: 1,
        width: '100%',
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        opacity: screenOpacity.value,
    }));

    const boxStyle = useAnimatedStyle(() => ({
        transform: [{ scale: boxScale.value }],
        opacity: boxOpacity.value,
    }));

    const logoStyle = useAnimatedStyle(() => ({
        opacity: logoOpacity.value,
        transform: [{ scale: logoScale.value }],
    }));

    const flashStyle = useAnimatedStyle(() => ({
        opacity: flashOpacity.value,
    }));

    const textStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
        transform: [{ translateY: textTranslateY.value }],
    }));

    return (
        <View style={styles.root}>
            <Animated.View style={screenStyle}>

                {/* ── Liquid fill box ── */}
                <Animated.View style={[styles.logoBox, boxStyle]}>
                    <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: '#020202' }} />
                    
                    {/* White wave (slightly faster, peaks out from behind) */}
                    <PerfectLiquidWave 
                        color="rgba(255, 255, 255, 1)" 
                        fillDuration={2600} 
                        delay={120} 
                    />
                    
                    {/* Pink → Orange gradient wave */}
                    <PerfectLiquidWave 
                        isGradient={true} 
                        fillDuration={2600} 
                        delay={150} 
                    />
                </Animated.View>

                {/* ── Stage 2: App icon with bounce + flash ── */}
                <Animated.View style={[styles.logoIcon, logoStyle]}>
                    <Animated.Image
                        source={require('../assets/logo-animate.png')}
                        style={styles.logoIconImage}
                        resizeMode="contain"
                    />
                    <Animated.View style={[StyleSheet.absoluteFill, styles.flashOverlay, flashStyle]} />
                </Animated.View>

                {/* ── Stage 3: "digitag" brand text ── */}
                <Animated.Image
                    source={require('../assets/digitag-animate.png')}
                    style={[styles.digiTagText, textStyle]}
                    resizeMode="contain"
                />

            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#060606',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoBox: {
        width: BOX_SIZE,
        height: BOX_SIZE,
        borderRadius: BOX_RADIUS,
        overflow: 'hidden',
        position: 'absolute',
    },
    logoIcon: {
        width: 110,
        height: 110,
        marginTop: -60,
        position: 'absolute',
    },
    logoIconImage: {
        width: '100%',
        height: '100%',
        marginTop: -40,
    },
    flashOverlay: {
        backgroundColor: 'white',
        borderRadius: BOX_RADIUS - 4,
    },
    digiTagText: {
        width: 300,
        height: 68,
        marginTop: 70,
        position: 'absolute',
    },
});
