import GradientButton from '@/Components/ui/GradientButton';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Image assets mapping
const creatorImg = require('../assets/images/creator.png');
const brandImg = require('../assets/images/brand.png');
const agencyImg = require('../assets/images/agency.png');
const freelancerImg = require('../assets/images/freelancer.png');

interface RoleData {
    id: string;
    title: string;
    desc: string;
    image: any;
    gradient: readonly [string, string, ...string[]];
    primaryColor: string;
    selectedBg: string;
}

const roles: RoleData[] = [
    {
        id: 'creator',
        title: 'Creator',
        desc: 'Individual content \nmakers and Influencers',
        image: creatorImg,
        gradient: ['rgba(237, 42, 145, 0.3)', '#ED2A91', 'rgba(255, 255, 255, 0.3)'],
        primaryColor: '#ED2A91',
        selectedBg: '#ED2A9133',
    },
    {
        id: 'brand',
        title: 'Brand',
        desc: 'Company looking for \ncollaboration',
        image: brandImg,
        gradient: ['rgba(33, 78, 231, 0.3)', '#214EE7', 'rgba(255, 255, 255, 0.3)'],
        primaryColor: '#214EE7',
        selectedBg: '#253E934D',
    },
    {
        id: 'agency',
        title: 'Agency',
        desc: 'Marketing & Creative \nManagement firms',
        image: agencyImg,
        gradient: ['rgba(226, 242, 15, 0.3)', '#E2F20F', 'rgba(255, 255, 255, 0.3)'],
        primaryColor: '#E2F20F',
        selectedBg: '#E2F20F1A',
    },
    {
        id: 'freelancer',
        title: 'Freelancer',
        desc: 'Independent Professional \n& Promoters',
        image: freelancerImg,
        gradient: ['rgba(242, 105, 48, 0.3)', '#F26930', 'rgba(255, 255, 255, 0.3)'],
        primaryColor: '#F26930',
        selectedBg: '#F2693033',
    }
];

export default function RoleSelectionScreen() {
    const router = useRouter();
    const [selectedRole, setSelectedRole] = useState<string | null>(null);

    const handleNext = () => {
        if (!selectedRole) return;
        if (selectedRole === 'brand' || selectedRole === 'agency') {
            Alert.alert('Coming Soon', 'Brand and Agency flows are not yet available. Please choose Creator or Freelancer.');
            return;
        }
        router.push({ pathname: '/login', params: { role: selectedRole.toUpperCase() } });
    };

    return (
        <SafeAreaView className="flex-1 bg-[#0A0A10]" edges={['top', 'bottom', 'left', 'right']}>
            {/* Header */}
            <View className="flex-row items-center px-4 pt-4 pb-6 mt-4">
                <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
                    <ChevronLeft color="#FFFFFF" size={24} />
                </TouchableOpacity>
                <Text className="text-white font-poppins-semibold text-[22px]">Select Your Profile Type</Text>
                {/* <Text className="text-white font-poppins-semibold text-[22px]">Complete Profile</Text> */}
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="px-5 pb-10">

                    {/* Progress Indicators */}
                    {/* <View className="flex-row items-center mb-8 pr-2"> */}
                    {/* Fake Ring Graphic */}
                    {/* <View className="w-[65px] h-[65px] rounded-full border-4 border-[#2A2A38] border-t-[#7352DD] items-center justify-center mr-4">
                            <Text className="text-[#6E7180] font-poppins-semibold text-[18px]">1<Text className="text-[#6E7180]">/2</Text></Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-white font-poppins-semibold text-[20px] text-right mb-1">Personal Information</Text>
                            <Text className="text-[#88889D] font-poppins-regular text-[12px] text-right">Next: Personal Address</Text>
                        </View>
                    </View> */}

                    {/* Sub-Header block */}
                    <View className="mb-4 mt-0">
                        {/* <Text className="text-white font-poppins-semibold text-[22px] mb-1">Select Your Profile Type</Text> */}
                        <Text className="text-[#88889D] font-poppins-regular text-[13px] leading-5">
                            Tell us about yourself to get the right experience.
                        </Text>
                    </View>

                    {/* 2x2 Grid using Wrap Flexbox */}
                    <View className="flex-row flex-wrap justify-between gap-y-1">
                        {roles.map((role) => {
                            const isSelected = selectedRole === role.id;
                            return (
                                <TouchableOpacity
                                    key={role.id}
                                    activeOpacity={0.8}
                                    onPress={() => setSelectedRole(role.id)}
                                    className="w-[48%]"
                                    style={{
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 10 },
                                        shadowOpacity: 0.15,
                                        shadowRadius: 15,
                                        elevation: 5,
                                    }}
                                >
                                    {/* Outer wrapper gives room for the overflowing image */}
                                    <View className="relative pt-[70px]">
                                        {/* Floating image above the card */}
                                        <Image
                                            source={role.image}
                                            className="absolute top-0 w-[170px] h-[170px] z-10 self-center"
                                            resizeMode="contain"
                                        />
                                        {/* Card body — only title + desc */}
                                        <View
                                            className="rounded-[20px] pb-4 pt-[85px] px-3 items-center border border-[#2A2A2A] overflow-hidden"
                                            style={{ backgroundColor: isSelected ? role.selectedBg : '#1A1A1A' }}
                                        >
                                            <Text
                                                className="font-poppins-bold text-[18px] mb-1 text-center"
                                                style={{ color: role.primaryColor }}
                                            >
                                                {role.title}
                                            </Text>
                                            <Text
                                                className="font-poppins-regular text-[11px] text-center text-[#88889D] leading-[15px]"
                                                numberOfLines={3}
                                            >
                                                {role.desc}
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Actions Container */}
            <View className="px-5 pb-[40px] pt-4 bg-[#0A0A10]">
                {selectedRole ? (
                    <GradientButton title="Next" onPress={handleNext} />
                ) : (
                    <TouchableOpacity activeOpacity={1} className="w-full h-[60px] rounded-full bg-[#1C1C28] border border-white/5 items-center justify-center">
                        <Text className="text-[#5A5A6D] font-poppins-semibold text-[20px]">Next</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}
