import GradientButton from '@/Components/ui/GradientButton';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { BackHandler, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Path, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';

const creatorImg = require('../assets/images/creator.webp');
const brandImg = require('../assets/images/brand.webp');
const agencyImg = require('../assets/images/agency.webp');
const freelancerImg = require('../assets/images/freelancer.webp');

interface RoleData {
    id: string;
    title: string;
    desc: string;
    image: any;
    primaryColor: string;
    selectedBg: string;
    // Exact stops from Figma angular gradient data (8 stops, clockwise from top-left)
    gradientStops: { color: string; opacity: number }[];
}

// Exact stop colors and opacities from Figma SVG data-figma-gradient-fill
// Positions clockwise: topLeft, topCenter, topRight, rightCenter, bottomRight, bottomCenter, bottomLeft, leftCenter
const roles: RoleData[] = [
    {
        id: 'creator',
        title: 'Creator',
        desc: 'Individual content \nmakers and Influencers',
        image: creatorImg,
        primaryColor: '#ED2A91',
        selectedBg: '#ED2A9133',
        gradientStops: [
            { color: '#ED2A91', opacity: 0.2 },   // top-left (pos 0.029 = full)
            { color: '#ED2A91', opacity: 0.2 },   // top-center (pos 0.089)
            { color: '#FFFFFF', opacity: 0.2 },    // top-right (pos 0.167)
            { color: '#ED2A91', opacity: 0.2 },    // right-center (pos 0.299)
            { color: '#ED2A91', opacity: 0.2 },   // bottom-right (pos 0.521)
            { color: '#ED2A91', opacity: 0.1 },    // bottom-center (pos 0.577)
            { color: '#FFFFFF', opacity: 0.1 },    // bottom-left (pos 0.798)
            { color: '#ED2A91', opacity: 0.2 },    // left-center (pos 0.908)
        ],
    },
    {
        id: 'brand',
        title: 'Brand',
        desc: 'Company looking for \ncollaboration',
        image: brandImg,
        primaryColor: '#214EE7',
        selectedBg: '#253E934D',
        gradientStops: [
            { color: '#214EE7', opacity: 0.2 },
            { color: '#214EE7', opacity: 0.2 },
            { color: '#FFFFFF', opacity: 0.2 },
            { color: '#214EE7', opacity: 0.2 },
            { color: '#214EE7', opacity: 0.2 },
            { color: '#214EE7', opacity: 0.2 },
            { color: '#FFFFFF', opacity: 0.2 },
            { color: '#214EE7', opacity: 0.3 },
        ],
    },
    {
        id: 'agency',
        title: 'Agency',
        desc: 'Marketing & Creative \nManagement firms',
        image: agencyImg,
        primaryColor: '#E2F20F',
        selectedBg: '#E2F20F1A',
        gradientStops: [
            { color: '#E2F20F', opacity: 0.2 },
            { color: '#E2F20F', opacity: 0.2 },
            { color: '#FFFFFF', opacity: 0.2 },
            { color: '#E2F20F', opacity: 0.2 },
            { color: '#E2F20F', opacity: 0.2 },
            { color: '#E2F20F', opacity: 0.2 },
            { color: '#FFFFFF', opacity: 0.2 },
            { color: '#E2F20F', opacity: 0.3 },
        ],
    },
    {
        id: 'freelancer',
        title: 'Freelancer',
        desc: 'Independent Professional \n& Promoters',
        image: freelancerImg,
        primaryColor: '#F26930',
        selectedBg: '#F2693033',
        gradientStops: [
            { color: '#F26930', opacity: 0.2 },
            { color: '#F26930', opacity: 0.2 },
            { color: '#FFFFFF', opacity: 0.2 },
            { color: '#F26930', opacity: 0.2 },
            { color: '#F26930', opacity: 0.2 },
            { color: '#F26930', opacity: 0.2 },
            { color: '#FFFFFF', opacity: 0.2 },
            { color: '#F26930', opacity: 0.3 },
        ],
    },
];


function FigmaConicBorder({
    width,
    height,
    stops,
    uid,
}: {
    width: number;
    height: number;
    stops: { color: string; opacity: number }[];
    uid: string;
}) {
    const R = 20;    // corner radius matching card
    const BW = 1.0;  // border width (reduced from 1.5)
    const o = BW / 2;

    // Card boundary
    const left = o;
    const top = o;
    const right = width - o;
    const bottom = height - o;

    const [s0, s1, s2, s3, s4, s5, s6, s7] = stops;

    return (
        <Svg
            width={width}
            height={height}
            style={{ position: 'absolute', top: 0, left: 0, zIndex: 10 }}
            pointerEvents="none"
        >
            <Defs>
                {/* TOP: full primary → transparent white (left to right) */}
                <SvgLinearGradient id={`${uid}_top`} x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor={s0.color} stopOpacity={s0.opacity} />
                    <Stop offset="0.5" stopColor={s1.color} stopOpacity={s1.opacity} />
                    <Stop offset="1" stopColor={s2.color} stopOpacity={s2.opacity} />
                </SvgLinearGradient>

                {/* RIGHT: white → white (top to bottom, nearly invisible) */}
                <SvgLinearGradient id={`${uid}_right`} x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={s2.color} stopOpacity={s2.opacity} />
                    <Stop offset="1" stopColor={s3.color} stopOpacity={s3.opacity} />
                </SvgLinearGradient>

                {/* BOTTOM: primary(0.35) → primary(0.5) → primary(0.35) (right to left) */}
                <SvgLinearGradient id={`${uid}_bottom`} x1="1" y1="0" x2="0" y2="0">
                    <Stop offset="0" stopColor={s4.color} stopOpacity={s4.opacity} />
                    <Stop offset="0.5" stopColor={s5.color} stopOpacity={s5.opacity} />
                    <Stop offset="1" stopColor={s6.color} stopOpacity={s6.opacity} />
                </SvgLinearGradient>

                {/* LEFT: white(0.3) → primary(0.3) → primary(full) (bottom to top) */}
                <SvgLinearGradient id={`${uid}_left`} x1="0" y1="1" x2="0" y2="0">
                    <Stop offset="0" stopColor={s6.color} stopOpacity={s6.opacity} />
                    <Stop offset="0.5" stopColor={s7.color} stopOpacity={s7.opacity} />
                    <Stop offset="1" stopColor={s0.color} stopOpacity={s0.opacity} />
                </SvgLinearGradient>

                {/* TOP-LEFT corner: primary full */}
                <SvgLinearGradient id={`${uid}_tl`} x1="0" y1="1" x2="1" y2="0">
                    <Stop offset="0" stopColor={s0.color} stopOpacity={s0.opacity} />
                    <Stop offset="1" stopColor={s0.color} stopOpacity={s0.opacity} />
                </SvgLinearGradient>

                {/* TOP-RIGHT corner: fading to white */}
                <SvgLinearGradient id={`${uid}_tr`} x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor={s2.color} stopOpacity={s2.opacity} />
                    <Stop offset="1" stopColor={s3.color} stopOpacity={s3.opacity} />
                </SvgLinearGradient>

                {/* BOTTOM-RIGHT corner */}
                <SvgLinearGradient id={`${uid}_br`} x1="1" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={s3.color} stopOpacity={s3.opacity} />
                    <Stop offset="1" stopColor={s4.color} stopOpacity={s4.opacity} />
                </SvgLinearGradient>

                {/* BOTTOM-LEFT corner */}
                <SvgLinearGradient id={`${uid}_bl`} x1="1" y1="1" x2="0" y2="0">
                    <Stop offset="0" stopColor={s5.color} stopOpacity={s5.opacity} />
                    <Stop offset="1" stopColor={s6.color} stopOpacity={s6.opacity} />
                </SvgLinearGradient>
            </Defs>

            {/* TOP edge (straight line) */}
            <Path
                d={`M ${left + R} ${top} L ${right - R} ${top}`}
                stroke={`url(#${uid}_top)`}
                strokeWidth={BW}
                fill="none"
                strokeLinecap="butt"
            />

            {/* TOP-RIGHT corner arc */}
            <Path
                d={`M ${right - R} ${top} Q ${right} ${top} ${right} ${top + R}`}
                stroke={`url(#${uid}_tr)`}
                strokeWidth={BW}
                fill="none"
            />

            {/* RIGHT edge */}
            <Path
                d={`M ${right} ${top + R} L ${right} ${bottom - R}`}
                stroke={`url(#${uid}_right)`}
                strokeWidth={BW}
                fill="none"
                strokeLinecap="butt"
            />

            {/* BOTTOM-RIGHT corner arc */}
            <Path
                d={`M ${right} ${bottom - R} Q ${right} ${bottom} ${right - R} ${bottom}`}
                stroke={`url(#${uid}_br)`}
                strokeWidth={BW}
                fill="none"
            />

            {/* BOTTOM edge */}
            <Path
                d={`M ${right - R} ${bottom} L ${left + R} ${bottom}`}
                stroke={`url(#${uid}_bottom)`}
                strokeWidth={BW}
                fill="none"
                strokeLinecap="butt"
            />

            {/* BOTTOM-LEFT corner arc */}
            <Path
                d={`M ${left + R} ${bottom} Q ${left} ${bottom} ${left} ${bottom - R}`}
                stroke={`url(#${uid}_bl)`}
                strokeWidth={BW}
                fill="none"
            />

            {/* LEFT edge */}
            <Path
                d={`M ${left} ${bottom - R} L ${left} ${top + R}`}
                stroke={`url(#${uid}_left)`}
                strokeWidth={BW}
                fill="none"
                strokeLinecap="butt"
            />

            {/* TOP-LEFT corner arc */}
            <Path
                d={`M ${left} ${top + R} Q ${left} ${top} ${left + R} ${top}`}
                stroke={`url(#${uid}_tl)`}
                strokeWidth={BW}
                fill="none"
            />
        </Svg>
    );
}

export default function RoleSelectionScreen() {
    const router = useRouter();
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [cardSizes, setCardSizes] = useState<Record<string, { width: number; height: number }>>({});

    useEffect(() => {
        const backAction = () => {
            router.replace('/onboarding/splash1?step=4');
            return true;
        };
        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
    }, []);

    const handleNext = () => {
        if (!selectedRole) return;
        if (selectedRole === 'brand' || selectedRole === 'agency') {
            router.push('/coming-soon');
            return;
        }
        router.replace({ pathname: '/login', params: { role: selectedRole.toUpperCase() } });
    };

    return (
        <SafeAreaView className="flex-1 bg-[#0A0A10]" edges={['top', 'bottom', 'left', 'right']}>
            <LinearGradient
                colors={['rgba(115, 82, 221, 0.35)', 'rgba(115, 82, 221, 0.1)', 'transparent']}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 400 }}
                pointerEvents="none"
            />

            {/* Header - Back Button Only */}
            <View className="px-4 pt-4 pb-2 mt-2">
                <TouchableOpacity
                    onPress={() => router.replace('/onboarding/splash1?step=4')}
                    className="p-1 w-10"
                >
                    <ChevronLeft color="#FFFFFF" size={28} />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="px-5 pb-8">
                    {/* Big Header Section */}
                    <View className="mb-2 mt-0 gap-[2px]">
                        <Text className="text-white font-poppins-bold text-[26px] leading-[30px]">
                            One Platform.
                        </Text>
                        <Text className="text-[#7352DD] font-poppins-bold text-[26px] leading-[30px]">
                            Endless Opportunities.
                        </Text>
                        <Text className="text-[#88889D] font-poppins-regular text-[12px] mt-3 mb-3 leading-5">
                            Discover, connect & collaborate — everything you need to grow {'\n'}your brand, skills, or audience.
                        </Text>
                    </View>

                    {/* Feature Cards Row */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="mb-4"
                        contentContainerStyle={{ paddingRight: 20 }}
                    >
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            {[
                                { title: 'Grow Brand', desc: 'Expand your reach', emoji: '🌐', color: '#8F38FF', bg: 'rgba(143, 56, 255, 0.15)' },
                                { title: 'Collaborate', desc: 'Work with top pros', emoji: '🤝', color: '#FF618C', bg: 'rgba(255, 97, 140, 0.15)' },
                                { title: 'Monetize', desc: 'Earn from your skills', emoji: '💰', color: '#FFCC33', bg: 'rgba(255, 204, 51, 0.15)' },
                            ].map((feature, idx) => (
                                <View
                                    key={idx}
                                    style={{ backgroundColor: feature.bg, borderColor: `${feature.color}44` }}
                                    className="w-[120px] rounded-[14px] p-2 border-[1.1px]"
                                >
                                    <View className="mb-1 bg-black/20 w-7 h-7 rounded-[7px] items-center justify-center relative">
                                        {feature.title === 'Grow Brand' && (
                                            <View className="absolute w-4 h-4 bg-white rounded-full" />
                                        )}
                                        <Text className="text-[14px]">{feature.emoji}</Text>
                                    </View>
                                    <Text
                                        className="font-poppins-semibold text-[16px]"
                                        style={{ color: feature.color }}
                                    >
                                        {feature.title}
                                    </Text>
                                    <Text className="text-[#F2F2F2] font-poppins-regular text-[10px] mt-0.5 leading-[12px]">
                                        {feature.desc}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </ScrollView>

                    {/* Profile Type Selection Header */}
                    <View className="mb-0 mt-[20px]">
                        <Text className="text-white font-poppins-bold text-[18px] mb-0">
                            Select Your Profile Type
                        </Text>
                    </View>

                    {/* 2x2 Grid */}
                    <View className="flex-row flex-wrap justify-between gap-y-[0px] -mt-6">
                        {roles.map((role) => {
                            const isSelected = selectedRole === role.id;
                            const size = cardSizes[role.id];

                            return (
                                <TouchableOpacity
                                    key={role.id}
                                    activeOpacity={0.8}
                                    onPress={() => setSelectedRole(role.id)}
                                    className="w-[48%]"
                                >
                                    <View className="relative pt-[70px]">
                                        {/* Floating image */}
                                        <Image
                                            source={role.image}
                                            className="absolute top-0 w-[170px] h-[170px] z-10 self-center"
                                            resizeMode="contain"
                                        />

                                        {/* Card */}
                                        <View
                                            onLayout={(e) => {
                                                const { width, height } = e.nativeEvent.layout;
                                                setCardSizes(prev => ({
                                                    ...prev,
                                                    [role.id]: { width, height },
                                                }));
                                            }}
                                            style={{
                                                backgroundColor: isSelected ? role.selectedBg : '#FFFFFF0F',
                                                shadowColor: '#000',
                                                shadowOffset: { width: -3, height: 11 },
                                                shadowOpacity: 0.07,
                                                shadowRadius: 11,
                                                elevation: 6,
                                                borderBottomWidth: 0.3,
                                                borderBottomColor: isSelected ? role.primaryColor : 'transparent',
                                            }}
                                            className="rounded-[20px] pb-4 pt-[85px] px-3 items-center"
                                        >
                                            <Text
                                                className="font-poppins-bold text-[18px] mb-1 text-center"
                                                style={{ color: role.primaryColor }}
                                            >
                                                {role.title}
                                            </Text>
                                            <Text
                                                className={`font-poppins-regular text-[11px] text-center leading-[15px] ${isSelected ? 'text-white' : 'text-[#88889D]'}`}
                                                numberOfLines={3}
                                            >
                                                {role.desc}
                                            </Text>

                                            {/* Exact Figma gradient border */}
                                            {size && (
                                                <FigmaConicBorder
                                                    width={size.width}
                                                    height={size.height}
                                                    stops={role.gradientStops}
                                                    uid={`card_${role.id}`}
                                                />
                                            )}
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Actions */}
            <View className="px-5 pb-[14px] pt-2 bg-[#0A0A10]">
                {selectedRole ? (
                    <GradientButton title="Next" onPress={handleNext} />
                ) : (
                    <TouchableOpacity
                        activeOpacity={1}
                        className="w-full h-[60px] rounded-full bg-[#1C1C28] border border-white/5 items-center justify-center"
                    >
                        <Text className="text-[#5A5A6D] font-poppins-semibold text-[20px]">Next</Text>
                    </TouchableOpacity>
                )}
            </View>

        </SafeAreaView>
    );
}