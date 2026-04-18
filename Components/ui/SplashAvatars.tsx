import React, { useEffect } from 'react';
import { Image, Text, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, withSequence, Easing } from 'react-native-reanimated';

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

      // 1. 1.jpg (Brand)
      scale1.value = withDelay(t, withSequence(withTiming(zoom, { duration, easing: ease }), withTiming(1, { duration, easing: ease })));
      transY1.value = withDelay(t, withSequence(withTiming(30, { duration, easing: ease }), withTiming(0, { duration, easing: ease })));
      t += totalStep;

      // 2. 4.jpg (Collaboration)
      scale4.value = withDelay(t, withSequence(withTiming(zoom, { duration, easing: ease }), withTiming(1, { duration, easing: ease })));
      transY4.value = withDelay(t, withSequence(withTiming(30, { duration, easing: ease }), withTiming(0, { duration, easing: ease })));
      t += totalStep;

      // 3. 2.jpg (Agency)
      scale2.value = withDelay(t, withSequence(withTiming(zoom, { duration, easing: ease }), withTiming(1, { duration, easing: ease })));
      t += totalStep;

      // 4. 8.jpg (No text)
      scale8.value = withDelay(t, withSequence(withTiming(zoom, { duration, easing: ease }), withTiming(1, { duration, easing: ease })));
      t += totalStep;

      // 5. 7.jpg (Stars)
      scale7.value = withDelay(t, withSequence(withTiming(zoom, { duration, easing: ease }), withTiming(1, { duration, easing: ease })));
      transY7.value = withDelay(t, withSequence(withTiming(25, { duration, easing: ease }), withTiming(0, { duration, easing: ease })));
      t += totalStep;

      // 6. 3.jpg (Content Creator)
      scale3.value = withDelay(t, withSequence(withTiming(zoom, { duration, easing: ease }), withTiming(1, { duration, easing: ease })));
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

  return (
    <View className="absolute top-0 left-0 w-full h-[65%] z-10" pointerEvents="none">
      {/* 2.jpg - Agency */}
      <View className="absolute top-[35%] left-[15%] items-center">
        <Animated.Image style={stImg2} source={require('../../assets/images/2.jpg')} className="w-[65px] h-[65px] rounded-full" />
        <Pill label="Agency" className="right-[25px] top-[53px] w-[95px]" />
      </View>

      {/* 1.jpg - Brand (Branding) */}
      <View className="absolute top-[20%] left-[40%] items-center">
        <Animated.Image style={stImg1} source={require('../../assets/images/1.jpg')} className="w-[68px] h-[68px] rounded-full" />
        <Pill label="Branding" style={stPill1} className="right-[57px] top-2 w-[105px]" />
      </View>

      {/* 3.jpg - Content Creator */}
      <View className="absolute top-[32%] right-[14%] items-end">
        <Animated.Image style={stImg3} source={require('../../assets/images/3.jpg')} className="w-[75px] h-[75px] rounded-full mr-2" />
        <Pill label="Content Creator" className="top-[75px] left-[-12px] w-[153px]" />
      </View>

      {/* 4.jpg - Collaboration */}
      <View className="absolute top-[45%] left-[38%] items-center">
        <Animated.Image style={stImg4} source={require('../../assets/images/4.jpg')} className="w-[75px] h-[75px] rounded-full" />
        <Pill label="Collaboration" style={stPill4} className="top-[80px] left-[2px] w-[135px]" />
      </View>

      {/* 5.jpg & 6.jpg - Very large Avatar overlapping bottom left */}
      <View className="absolute top-[62%] left-[12%]">
        <Image source={require('../../assets/images/5.jpg')} className="w-[110px] h-[110px] rounded-full" />
        <Image source={require('../../assets/images/6.jpg')} className="absolute -bottom-8 right-3 w-14 h-14 rounded-full z-20" />
      </View>

      {/* 8.jpg - No text, right middle */}
      <View className="absolute top-[65%] right-[10%]">
        <Animated.Image style={stImg8} source={require('../../assets/images/8.jpg')} className="w-[75px] h-[75px] rounded-full" />
      </View>

      {/* 7.jpg - Stars, bottom center right */}
      <View className="absolute top-[70%] left-[45%] items-center">
        <Animated.Image style={stImg7} source={require('../../assets/images/7.jpg')} className="w-[75px] h-[75px] rounded-full" />
        <Stars style={stStars7} className="top-[55px] left-[50px]" />
      </View>
    </View>
  );
}
