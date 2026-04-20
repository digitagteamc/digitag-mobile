import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Image, Text, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';

// Min vertical space we must leave for the onboarding title/subtitle/button/terms.
// Derived from the tallest layout (step 0 hero) plus SafeArea + Skip header.
const MIN_CONTENT_HEIGHT = 340;

// Baseline avatar/pill metrics — designed against a 400 dp wide phone. Screens
// narrower than that scale everything down proportionally (never below 78%).
const BASE_REFERENCE_WIDTH = 400;
const MIN_SCALE = 0.78;

const Pill = ({
    label,
    style,
    width,
    scale,
}: {
    label: string;
    style?: any;
    width: number;
    scale: number;
}) => (
    <Animated.View
        style={[
            {
                width,
                position: 'absolute',
                backgroundColor: 'rgba(44,44,62,0.8)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)',
                borderRadius: 9999,
                paddingHorizontal: 24 * scale,
                paddingVertical: 8 * scale,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 20,
                shadowColor: '#000',
                shadowOpacity: 0.25,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
                elevation: 4,
            },
            style,
        ]}
    >
        <Text
            numberOfLines={1}
            style={{ flexShrink: 0, fontSize: 13 * scale, color: '#fff' }}
            className="font-poppins-regular"
        >
            {label}
        </Text>
    </Animated.View>
);

const Stars = ({ style, starSize }: { style?: any; starSize: number }) => (
    <Animated.View style={[{ flexDirection: 'row', position: 'absolute', zIndex: 20 }, style]}>
        {[1, 2, 3, 4, 5].map((_, i) => (
            <Text key={i} style={{ fontSize: starSize, color: '#FFD700' }}>
                ★
            </Text>
        ))}
    </Animated.View>
);

export default function SplashAvatars() {
    const { width: screenW, height: screenH } = useWindowDimensions();

    // Reserve bottom area for content; avatars stretch across the remaining top.
    const containerHeight = Math.max(
        260,
        Math.min(screenH * 0.62, screenH - MIN_CONTENT_HEIGHT),
    );

    // Uniformly scale avatars + pills with screen width so they fit on narrow phones.
    const scale = Math.max(MIN_SCALE, Math.min(1, screenW / BASE_REFERENCE_WIDTH));
    const r = (n: number) => Math.round(n * scale);
    const avatar = (px: number) => {
        const size = r(px);
        return { width: size, height: size, borderRadius: size / 2 };
    };

    const duration = 600;
    const ease = Easing.out(Easing.linear);

    const scale1 = useSharedValue(1);
    const scale4 = useSharedValue(1);
    const scale2 = useSharedValue(1);
    const scale8 = useSharedValue(1);
    const scale7 = useSharedValue(1);
    const scale3 = useSharedValue(1);

    const transY1 = useSharedValue(0);
    const transY4 = useSharedValue(0);
    const transY7 = useSharedValue(0);

    useEffect(() => {
        const initialDelay = 500;
        const totalStep = duration * 2;
        const fullCycleTime = totalStep * 6;

        const runSequence = () => {
            let t = 0;
            const zoom = 1.6;

            scale1.value = withDelay(t, withSequence(withTiming(zoom, { duration, easing: ease }), withTiming(1, { duration, easing: ease })));
            transY1.value = withDelay(t, withSequence(withTiming(30, { duration, easing: ease }), withTiming(0, { duration, easing: ease })));
            t += totalStep;

            scale4.value = withDelay(t, withSequence(withTiming(zoom, { duration, easing: ease }), withTiming(1, { duration, easing: ease })));
            transY4.value = withDelay(t, withSequence(withTiming(30, { duration, easing: ease }), withTiming(0, { duration, easing: ease })));
            t += totalStep;

            scale2.value = withDelay(t, withSequence(withTiming(zoom, { duration, easing: ease }), withTiming(1, { duration, easing: ease })));
            t += totalStep;

            scale8.value = withDelay(t, withSequence(withTiming(zoom, { duration, easing: ease }), withTiming(1, { duration, easing: ease })));
            t += totalStep;

            scale7.value = withDelay(t, withSequence(withTiming(zoom, { duration, easing: ease }), withTiming(1, { duration, easing: ease })));
            transY7.value = withDelay(t, withSequence(withTiming(25, { duration, easing: ease }), withTiming(0, { duration, easing: ease })));
            t += totalStep;

            scale3.value = withDelay(t, withSequence(withTiming(zoom, { duration, easing: ease }), withTiming(1, { duration, easing: ease })));
        };

        setTimeout(runSequence, initialDelay);
        const intervalId = setInterval(runSequence, fullCycleTime);
        return () => clearInterval(intervalId);
    }, []);

    const stImg1 = useAnimatedStyle(() => ({ transform: [{ scale: scale1.value }] }));
    const stPill1 = useAnimatedStyle(() => ({ transform: [{ translateY: transY1.value }] }));
    const stImg4 = useAnimatedStyle(() => ({ transform: [{ scale: scale4.value }] }));
    const stPill4 = useAnimatedStyle(() => ({ transform: [{ translateY: transY4.value }] }));
    const stImg2 = useAnimatedStyle(() => ({ transform: [{ scale: scale2.value }] }));
    const stImg8 = useAnimatedStyle(() => ({ transform: [{ scale: scale8.value }] }));
    const stImg7 = useAnimatedStyle(() => ({ transform: [{ scale: scale7.value }] }));
    const stStars7 = useAnimatedStyle(() => ({ transform: [{ translateY: transY7.value }] }));
    const stImg3 = useAnimatedStyle(() => ({ transform: [{ scale: scale3.value }] }));

    return (
        <View
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: containerHeight, zIndex: 10 }}
            pointerEvents="none"
        >
            {/* 2.jpg - Agency */}
            <View style={{ position: 'absolute', top: '35%', left: '15%', alignItems: 'center' }}>
                <Animated.Image style={[stImg2, avatar(65)]} source={require('../../assets/images/2.jpg')} />
                <Pill label="Agency" width={r(95)} scale={scale} style={{ right: r(25), top: r(53) }} />
            </View>

            {/* 1.jpg - Brand (Branding) */}
            <View style={{ position: 'absolute', top: '20%', left: '40%', alignItems: 'center' }}>
                <Animated.Image style={[stImg1, avatar(68)]} source={require('../../assets/images/1.jpg')} />
                <Pill label="Branding" width={r(105)} scale={scale} style={[stPill1, { right: r(57), top: 8 }]} />
            </View>

            {/* 3.jpg - Content Creator */}
            <View style={{ position: 'absolute', top: '32%', right: '14%', alignItems: 'flex-end' }}>
                <Animated.Image style={[stImg3, avatar(75), { marginRight: 8 }]} source={require('../../assets/images/3.jpg')} />
                <Pill label="Content Creator" width={r(153)} scale={scale} style={{ top: r(75), left: -12 }} />
            </View>

            {/* 4.jpg - Collaboration */}
            <View style={{ position: 'absolute', top: '45%', left: '38%', alignItems: 'center' }}>
                <Animated.Image style={[stImg4, avatar(75)]} source={require('../../assets/images/4.jpg')} />
                <Pill label="Collaboration" width={r(135)} scale={scale} style={[stPill4, { top: r(80), left: 2 }]} />
            </View>

            {/* 5.jpg & 6.jpg - Stacked avatars, bottom-left */}
            <View style={{ position: 'absolute', top: '62%', left: '12%' }}>
                <Image source={require('../../assets/images/5.jpg')} style={avatar(110)} />
                <Image
                    source={require('../../assets/images/6.jpg')}
                    style={[avatar(56), { position: 'absolute', bottom: -r(32), right: r(12), zIndex: 20 }]}
                />
            </View>

            {/* 8.jpg - Bare avatar on the right */}
            <View style={{ position: 'absolute', top: '65%', right: '10%' }}>
                <Animated.Image style={[stImg8, avatar(75)]} source={require('../../assets/images/8.jpg')} />
            </View>

            {/* 7.jpg - Stars */}
            <View style={{ position: 'absolute', top: '70%', left: '45%', alignItems: 'center' }}>
                <Animated.Image style={[stImg7, avatar(75)]} source={require('../../assets/images/7.jpg')} />
                <Stars style={[stStars7, { top: r(55), left: r(50) }]} starSize={14 * scale} />
            </View>

            {/* Bottom gradient fade — dissolves avatars into the page background so
                the band reads as part of the same screen instead of a detached block.
                Stretches into the content zone slightly to soften the seam. */}
            <LinearGradient
                colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.95)']}
                locations={[0, 0.55, 1]}
                style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: -Math.round(containerHeight * 0.06),
                    height: Math.round(containerHeight * 0.42),
                    zIndex: 15,
                }}
                pointerEvents="none"
            />
        </View>
    );
}
