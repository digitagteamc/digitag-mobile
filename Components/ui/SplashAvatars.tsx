import React, { useEffect } from 'react';
import { Image, Text, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';

const Pill = ({ label, style, className }: { label: string; style?: any; className?: string }) => (
    <Animated.View
        style={style}
        className={`bg-[#2c2c3e]/80 border border-white/10 px-6 py-2 rounded-full absolute shadow-lg z-20 flex-row justify-center items-center ${className}`}
    >
        <Text numberOfLines={1} style={{ flexShrink: 0 }} className="text-white text-[13px] font-poppins-regular">{label}</Text>
    </Animated.View>
);

const Stars = ({ style, className }: { style?: any; className?: string }) => (
    <Animated.View style={style} className={`flex-row absolute z-20 ${className}`}>
        {[1, 2, 3, 4, 5].map((_, i) => (
            <Text key={i} className="text-[#FFD700] text-[14px]">
                ★
            </Text>
        ))}
    </Animated.View>
);

export default function SplashAvatars() {
    const { height: screenH } = useWindowDimensions();
    const isSmall = screenH < 750;

    const durationIn = 600;
    const durationOut = 600;
    const step = 800;
    const zoom = 1.9;
    const ease = Easing.out(Easing.quad);
    const linear = Easing.linear;

    const scale1 = useSharedValue(1);
    const scale4 = useSharedValue(1);
    const scale2 = useSharedValue(1);
    const scale8 = useSharedValue(1);
    const scale7 = useSharedValue(1);
    const scale3 = useSharedValue(1);
    const transY3 = useSharedValue(0);

    const transY1 = useSharedValue(0);
    const transY4 = useSharedValue(0);
    const transY7 = useSharedValue(0);

    useEffect(() => {
        const initialDelay = 500;
        const fullCycleTime = step * 6;

        const runSequence = () => {
            let t = 0;

            const stayTime = step - durationIn > 0 ? step - durationIn : 0;

            // 1. 1.jpg (Brand)
            scale1.value = withDelay(t, withSequence(
                withTiming(zoom, { duration: durationIn, easing: ease }),
                withDelay(stayTime, withTiming(1, { duration: durationOut, easing: linear }))
            ));
            transY1.value = withDelay(t, withSequence(
                withTiming(30, { duration: durationIn, easing: ease }),
                withDelay(stayTime, withTiming(0, { duration: durationOut, easing: linear }))
            ));
            t += step;

            // 2. 4.jpg (Collaboration)
            scale4.value = withDelay(t, withSequence(
                withTiming(zoom, { duration: durationIn, easing: ease }),
                withDelay(stayTime, withTiming(1, { duration: durationOut, easing: linear }))
            ));
            transY4.value = withDelay(t, withSequence(
                withTiming(30, { duration: durationIn, easing: ease }),
                withDelay(stayTime, withTiming(0, { duration: durationOut, easing: linear }))
            ));
            t += step;

            // 3. 2.jpg (Agency)
            scale2.value = withDelay(t, withSequence(
                withTiming(zoom, { duration: durationIn, easing: ease }),
                withDelay(stayTime, withTiming(1, { duration: durationOut, easing: linear }))
            ));
            t += step;

            // 4. 8.jpg (No text)
            scale8.value = withDelay(t, withSequence(
                withTiming(zoom, { duration: durationIn, easing: ease }),
                withDelay(stayTime, withTiming(1, { duration: durationOut, easing: linear }))
            ));
            t += step;

            // 5. 7.jpg (Stars)
            scale7.value = withDelay(t, withSequence(
                withTiming(zoom, { duration: durationIn, easing: ease }),
                withDelay(stayTime, withTiming(1, { duration: durationOut, easing: linear }))
            ));
            transY7.value = withDelay(t, withSequence(
                withTiming(25, { duration: durationIn, easing: ease }),
                withDelay(stayTime, withTiming(0, { duration: durationOut, easing: linear }))
            ));
            t += step;

            // 6. 3.jpg (Content Creator)
            // Fix: ensure the zoom-out of the previous cycle completes before starting the next delay
            scale3.value = withSequence(
                withTiming(1, { duration: durationOut, easing: linear }),
                withDelay(t - durationOut, withSequence(
                    withTiming(zoom, { duration: durationIn, easing: ease }),
                    withDelay(stayTime, withTiming(1, { duration: durationOut, easing: linear }))
                ))
            );
            transY3.value = withSequence(
                withTiming(0, { duration: durationOut, easing: linear }),
                withDelay(t - durationOut, withSequence(
                    withTiming(30, { duration: durationIn, easing: ease }),
                    withDelay(stayTime, withTiming(0, { duration: durationOut, easing: linear }))
                ))
            );
        };

        // Initial run
        setTimeout(runSequence, initialDelay);

        // Continuous loop
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
    const stPill3 = useAnimatedStyle(() => ({ transform: [{ translateY: transY3.value }] }));

    // Responsive container height and top offsets
    // Reduced height to pull all avatars upward, clearing the bottom content zone
    const containerHeight = isSmall ? '50%' : '60%';
    const avatarScale = isSmall ? 0.8 : 0.95;

    return (
        <View style={{ height: containerHeight }} className="absolute top-0 left-0 w-full z-10" pointerEvents="none">
            {/* 2.jpg - Agency */}
            <View style={{ top: isSmall ? '28%' : '32%', left: '15%', transform: [{ scale: avatarScale }] }} className="absolute items-center">
                <Animated.Image style={stImg2} source={require('../../assets/images/2.jpg')} className="w-[65px] h-[65px] rounded-full" />
                <Pill label="Agency" className="right-[25px] top-[53px] w-[95px]" />
            </View>

            {/* 1.jpg - Brand (Branding) */}
            <View style={{ top: isSmall ? '12%' : '18%', left: '40%', transform: [{ scale: avatarScale }] }} className="absolute items-center">
                <Animated.Image style={stImg1} source={require('../../assets/images/1.jpg')} className="w-[68px] h-[68px] rounded-full" />
                <Pill label="Branding" style={stPill1} className="right-[57px] top-2 w-[105px]" />
            </View>

            {/* 3.jpg - Content Creator */}
            <View style={{ top: isSmall ? '25%' : '30%', right: '14%', transform: [{ scale: avatarScale }] }} className="absolute items-end">
                <Animated.Image style={stImg3} source={require('../../assets/images/3.jpg')} className="w-[75px] h-[75px] rounded-full mr-2" />
                <Pill label="Content Creator" style={stPill3} className="top-[75px] left-[-12px] w-[153px]" />
            </View>

            {/* 4.jpg - Collaboration */}
            <View style={{ top: isSmall ? '38%' : '42%', left: '38%', transform: [{ scale: avatarScale }] }} className="absolute items-center">
                <Animated.Image style={stImg4} source={require('../../assets/images/4.jpg')} className="w-[75px] h-[75px] rounded-full" />
                <Pill label="Collaboration" style={stPill4} className="top-[80px] left-[2px] w-[135px]" />
            </View>

            {/* 5.jpg & 6.jpg - Very large Avatar overlapping bottom left */}
            <View style={{ top: isSmall ? '50%' : '58%', left: '12%', transform: [{ scale: avatarScale }] }} className="absolute">
                <Image source={require('../../assets/images/5.jpg')} className="w-[110px] h-[110px] rounded-full" />
                <Image source={require('../../assets/images/6.jpg')} className="absolute -bottom-8 right-3 w-14 h-14 rounded-full z-20" />
            </View>

            {/* 8.jpg - No text, right middle */}
            <View style={{ top: isSmall ? '54%' : '62%', right: '10%', transform: [{ scale: avatarScale }] }} className="absolute">
                <Animated.Image style={stImg8} source={require('../../assets/images/8.jpg')} className="w-[75px] h-[75px] rounded-full" />
            </View>

            {/* 7.jpg - Stars, bottom center right */}
            <View style={{ top: isSmall ? '60%' : '68%', left: '45%', transform: [{ scale: avatarScale }] }} className="absolute items-center">
                <Animated.Image style={stImg7} source={require('../../assets/images/7.jpg')} className="w-[75px] h-[75px] rounded-full" />
                <Stars style={stStars7} className="top-[55px] left-[50px]" />
            </View>
        </View>
    );
}
