import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronDownIcon, ChevronLeftIcon, ImageIcon } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    BackHandler,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { useAuth } from '../../context/AuthContext';
import {
    getMyCreatorProfile,
    submitCreatorApplication,
    updateCreatorProfile
} from '../../services/userService';

const LANGUAGES = ['English', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Marathi', 'Malayalam', 'Bengali'];
const LEVELS = ['Beginner', 'Intermediate', 'Pro'];
const CREATOR_CATEGORIES = [
    { id: 'Fashion & Lifestyle', name: 'Fashion & Lifestyle' },
    { id: 'Beauty & Skincare', name: 'Beauty & Skincare' },
    { id: 'Fitness & Health', name: 'Fitness & Health' },
    { id: 'Tech', name: 'Tech' },
    { id: 'Food & Cooking', name: 'Food & Cooking' },
    { id: 'Travel', name: 'Travel' },
    { id: 'Lifestyle', name: 'Lifestyle' },
    { id: 'Gaming', name: 'Gaming' },
    { id: 'Education', name: 'Education' },
    { id: 'Business & Finance', name: 'Business & Finance' },
    { id: 'Art & Creativity', name: 'Art & Creativity' },
    { id: 'Sports', name: 'Sports' },
    { id: 'Music', name: 'Music' },
    { id: 'Parenting', name: 'Parenting' },
    { id: 'Home & Garden', name: 'Home & Garden' },
    { id: 'Entertainment', name: 'Entertainment' }
];

// --- Sub-components ---

const CircularProgress = ({ current, total }: { current: number; total: number }) => {
    const size = 64;
    const strokeWidth = 4;
    const center = size / 2;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = (current / total) * circumference;

    return (
        <View className="items-center justify-center">
            <Svg width={size} height={size}>
                <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke="#2A2A2A"
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke="#F02C8C"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - progress}
                    strokeLinecap="round"
                    fill="none"
                    transform={`rotate(-90, ${center}, ${center})`}
                />
            </Svg>
            <View className="absolute">
                <Text className="text-white text-[16px] font-poppins-semibold">
                    {current}/{total}
                </Text>
            </View>
        </View>
    );
};

const FormField = ({
    label,
    required,
    placeholder,
    value,
    onChangeText,
    multiline,
    keyboardType = 'default',
}: any) => (
    <View className="mb-5">
        <Text className="text-white font-poppins-regular text-[13px] mb-2 ml-1">
            {label} {required && <Text className="text-red-500">*</Text>}
        </Text>
        <TextInput
            placeholder={placeholder}
            placeholderTextColor="#555"
            multiline={multiline}
            numberOfLines={multiline ? 4 : 1}
            textAlignVertical={multiline ? 'top' : 'auto'}
            keyboardType={keyboardType}
            value={value}
            onChangeText={onChangeText}
            className={`bg-[#1A1A1A] text-white px-4 rounded-[12px] font-poppins-regular ${multiline ? 'py-4 h-32' : 'h-[56px]'
                }`}
        />
    </View>
);

const SelectField = ({ label, required, placeholder, options, selected, onSelect, multiSelect, itemKey = (i: any) => i, itemLabel = (i: any) => i }: any) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [layout, setLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const triggerRef = useRef<View>(null);

    const isSelected = (option: any) => {
        const key = itemKey(option);
        if (multiSelect) return (selected as any[]).includes(key);
        return selected === key;
    };

    const handleSelect = (option: any) => {
        const key = itemKey(option);
        if (multiSelect) {
            const current = [...(selected as any[])];
            if (current.includes(key)) {
                onSelect(current.filter((item) => item !== key));
            } else {
                onSelect([...current, key]);
            }
        } else {
            onSelect(key);
            setModalVisible(false);
        }
    };

    const handleOpen = () => {
        if (triggerRef.current) {
            triggerRef.current.measure((x, y, width, height, pageX, pageY) => {
                setLayout({ x: pageX, y: pageY, width, height });
                setModalVisible(true);
            });
        }
    };

    const displayValue = useMemo(() => {
        if (multiSelect) {
            if (!selected || selected.length === 0) return placeholder;
            return options
                .filter((o: any) => selected.includes(itemKey(o)))
                .map((o: any) => itemLabel(o))
                .join(', ');
        }
        if (!selected) return placeholder;
        const found = options.find((o: any) => itemKey(o) === selected);
        return found ? itemLabel(found) : placeholder;
    }, [selected, options, placeholder]);

    return (
        <View className="mb-5" style={{ zIndex: modalVisible ? 1000 : 1 }}>
            <Text className="text-white font-poppins-regular text-[13px] mb-2 ml-1">
                {label} {required && <Text className="text-red-500">*</Text>}
            </Text>
            <TouchableOpacity
                ref={triggerRef}
                activeOpacity={0.8}
                onPress={handleOpen}
                className="bg-[#131313] h-[64px] px-5 rounded-[16px] border border-[#1E1E1E] flex-row items-center justify-between"
            >
                <Text className={`font-poppins-regular text-[15px] ${selected && (multiSelect ? selected.length > 0 : true) ? 'text-white' : 'text-[#555]'}`} numberOfLines={1}>
                    {displayValue}
                </Text>
                <ChevronDownIcon color="#FFFFFF" size={24} />
            </TouchableOpacity>

            <Modal visible={modalVisible} transparent animationType="none">
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}
                    className="flex-1 bg-black/40"
                >
                    <View
                        className="absolute rounded-[24px] overflow-hidden border border-white/20 shadow-2xl elevation-10 bg-white/10"
                        style={{
                            top: layout.y + layout.height - 30,
                            left: layout.x,
                            width: layout.width,
                            maxHeight: 200,
                        }}
                    >
                        <LinearGradient
                            colors={['rgba(40, 40, 40, 0.95)', 'rgba(20, 20, 20, 0.98)']}
                            className="absolute inset-0"
                        />
                        <View className="bg-white/10 p-2 flex-1">
                            <ScrollView showsVerticalScrollIndicator={false} className="py-2">
                                {options.map((option: any) => {
                                    const key = itemKey(option);
                                    const label = itemLabel(option);
                                    return (
                                        <TouchableOpacity
                                            key={key}
                                            onPress={() => handleSelect(option)}
                                            activeOpacity={0.7}
                                            className="px-6 py-4 mb-1 rounded-xl"
                                        >
                                            <View className="flex-row items-center">
                                                {isSelected(option) && (
                                                    <View className="absolute left-0 right-0 h-full bg-[#F02C8C22] rounded-lg" style={{ width: '110%', height: '150%', marginLeft: '-5%' }} />
                                                )}
                                                <Text
                                                    className={`font-poppins-medium text-[16px] ${isSelected(option) ? 'text-[#F02C8C]' : 'text-white'
                                                        }`}
                                                >
                                                    {label}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const SocialRow = ({ platform, linkValue, followersValue, onLinkChange, onFollowersChange }: any) => (
    <View className="mb-4">
        <Text className="text-white font-poppins-regular text-[13px] mb-2 ml-1">
            {platform} <Text className="text-red-500">*</Text>
        </Text>
        <View className="flex-row gap-2">
            <View className="flex-[3] bg-[#1A1A1A] h-[56px] px-4 rounded-[12px] justify-center">
                <TextInput
                    placeholder={`${platform} links`}
                    placeholderTextColor="#555"
                    value={linkValue}
                    onChangeText={onLinkChange}
                    className="text-white font-poppins-regular"
                    autoCapitalize="none"
                />
            </View>
            <View className="flex-1 bg-[#1A1A1A] h-[56px] px-3 rounded-[12px] justify-center items-center">
                <TextInput
                    placeholder="Followers"
                    placeholderTextColor="#555"
                    keyboardType="numeric"
                    value={followersValue}
                    onChangeText={onFollowersChange}
                    className="text-white font-poppins-regular text-[12px] text-center"
                />
            </View>
        </View>
    </View>
);

const SuccessModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
    useEffect(() => {
        if (visible) {
            const timer = setTimeout(() => {
                onClose();
            }, 1400); // 1.4 seconds total (1s GIF play + 0.4s wait)
            return () => clearTimeout(timer);
        }
    }, [visible, onClose]);

    return (
        <Modal visible={visible} transparent animationType="fade">
            <TouchableOpacity
                activeOpacity={1}
                onPress={onClose}
                className="flex-1 bg-black/80 items-center justify-center px-6"
            >
                <TouchableOpacity
                    activeOpacity={1}
                    className="bg-[#1A1A1A] w-full rounded-[32px] p-8 items-center border border-white/10"
                >
                    <View className="w-56 h-56 mb-2 items-center justify-center">
                        <Image
                            source={require('../../assets/images/success.gif')}
                            className="w-full h-full"
                            resizeMode="contain"
                        />
                    </View>

                    <Text className="text-white font-poppins-bold text-[32px] mb-2 text-center leading-tight">
                        You're all set!
                    </Text>

                    <Text className="text-white/60 font-poppins-regular text-center text-[16px] mb-8">
                        You are ready to collaborate as
                    </Text>

                    <View
                        className="bg-[#F7C2DE] px-8 py-2 rounded-full"
                    >
                        <Text className="text-[#D01E7E] font-poppins-semibold text-lg">Creator</Text>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

// --- Main Component ---

export default function CreatorSignup() {
    const router = useRouter();
    const { userPhone, token, setProfileCompleted, setProfiles } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [prefilling, setPrefilling] = useState(true);
    const [step, setStep] = useState(1);
    const [mode, setMode] = useState<'create' | 'update'>('create');
    const [categories] = useState<{ id: string; name: string }[]>(CREATOR_CATEGORIES);

    const [form, setForm] = useState({
        name: '',
        email: '',
        languages: [] as string[],
        categoryIds: [] as string[],
        bio: '',
        portfolio: '',
        instagramHandle: '',
        instagramFollowers: '',
        youtubeHandle: '',
        youtubeFollowers: '',
        facebookHandle: '',
        facebookFollowers: '',
        snapchatHandle: '',
        snapchatFollowers: '',
        twitterHandle: '',
        twitterFollowers: '',
        experienceLevel: '',
        profilePicture: null as string | null,
    });

    useEffect(() => {
        let cancelled = false;
        (async () => {
            // Prefill existing profile
            if (token) {
                const existing = await getMyCreatorProfile(token);
                if (!cancelled && existing.success && existing.data) {
                    const p = existing.data;
                    setMode('update');
                    setForm(prev => ({
                        ...prev,
                        name: p.name || '',
                        email: p.email || '',
                        categoryIds: p.categories?.length > 0 ? p.categories : (p.categoryId ? p.categoryId.split(',').map((id: string) => id.trim()).filter(Boolean) : []),
                        languages: p.languages?.length > 0 ? p.languages : (p.language ? [p.language] : []),
                        bio: p.bio || '',
                        profilePicture: p.profilePicture || null,
                        portfolio: p.portfolioUrl || '',
                        experienceLevel: p.experienceLevel || '',
                        instagramHandle: p.instagramHandle || '',
                        instagramFollowers: p.instagramFollowers?.toString() || '',
                        youtubeHandle: p.youtubeHandle || '',
                        youtubeFollowers: p.youtubeFollowers?.toString() || '',
                        facebookHandle: p.facebookHandle || '',
                        facebookFollowers: p.facebookFollowers?.toString() || '',
                        twitterHandle: p.twitterHandle || '',
                        twitterFollowers: p.twitterFollowers?.toString() || '',
                        snapchatHandle: p.snapchatHandle || '',
                        snapchatFollowers: p.snapchatFollowers?.toString() || '',
                    }));
                }
            }
            if (!cancelled) setPrefilling(false);
        })();

        return () => {
            cancelled = true;
        };
    }, [token]);

    useEffect(() => {
        const backAction = () => {
            if (step === 2) {
                setStep(1);
                return true;
            }
            return false;
        };
        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
    }, [step]);

    const isStep1Valid = useMemo(() => {
        return (
            form.name.trim() !== '' &&
            form.email.trim() !== '' &&
            form.languages.length > 0 &&
            form.categoryIds.length > 0 &&
            form.bio.trim() !== '' &&
            form.portfolio.trim() !== ''
        );
    }, [form]);

    const isStep2Valid = useMemo(() => {
        return (
            form.profilePicture !== null &&
            form.experienceLevel !== ''
        );
    }, [form]);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            setForm({ ...form, profilePicture: result.assets[0].uri });
        }
    };

    const stripHandle = (v: string) => v.trim().replace(/^@/, '');

    const handleNext = () => {
        if (!form.name || !form.email || form.languages.length === 0 || form.categoryIds.length === 0 || !form.bio || !form.portfolio) {
            Alert.alert('Incomplete Form', 'Please fill in all required fields including bio and portfolio.');
            return;
        }
        setStep(2);
    };

    const handleSignup = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const payload: any = {
                name: form.name.trim(),
                email: form.email.trim().toLowerCase(),
                categories: form.categoryIds,
                languages: form.languages,
                bio: form.bio.trim(),
                profilePicture: form.profilePicture,
                portfolioUrl: form.portfolio.trim(),
                experienceLevel: form.experienceLevel,
            };

            const ig = stripHandle(form.instagramHandle);
            if (ig) payload.instagramHandle = ig;
            const igF = parseInt(form.instagramFollowers);
            if (!isNaN(igF)) payload.instagramFollowers = igF;

            const yt = stripHandle(form.youtubeHandle);
            if (yt) payload.youtubeHandle = yt;
            const ytF = parseInt(form.youtubeFollowers);
            if (!isNaN(ytF)) payload.youtubeFollowers = ytF;

            const fb = stripHandle(form.facebookHandle);
            if (fb) payload.facebookHandle = fb;
            const fbF = parseInt(form.facebookFollowers);
            if (!isNaN(fbF)) payload.facebookFollowers = fbF;

            const tw = stripHandle(form.twitterHandle);
            if (tw) payload.twitterHandle = tw;
            const twF = parseInt(form.twitterFollowers);
            if (!isNaN(twF)) payload.twitterFollowers = twF;

            const sc = stripHandle(form.snapchatHandle);
            if (sc) payload.snapchatHandle = sc;
            const scF = parseInt(form.snapchatFollowers);
            if (!isNaN(scF)) payload.snapchatFollowers = scF;

            const result = mode === 'update'
                ? await updateCreatorProfile(payload, token)
                : await submitCreatorApplication(payload, token);

            if (result.success) {
                setProfileCompleted(true);
                setProfiles({ CREATOR: true });
                setShowSuccessModal(true);
            } else {
                Alert.alert('Error', result.error || 'Failed to save profile');
            }
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (step === 2) {
            setStep(1);
        } else {
            router.back();
        }
    };

    const handleSuccessClose = () => {
        setShowSuccessModal(false);
        if (mode === 'update') {
            router.replace('/(tabs)');
        } else {
            router.replace('/signup/pending');
        }
    };

    if (prefilling) {
        return (
            <SafeAreaView className="flex-1 bg-black items-center justify-center">
                <ActivityIndicator color="#F02C8C" size="large" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-black" edges={['top', 'left', 'right']}>
            <LinearGradient colors={['#300A1F', '#000000']} className="absolute inset-0 h-[33%]" />

            {/* Header */}
            <View className="flex-row items-center px-4 py-2 border-b border-white/5">
                <TouchableOpacity onPress={handleBack} className="p-2">
                    <ChevronLeftIcon color="white" size={24} />
                </TouchableOpacity>
                <Text className="text-white font-poppins-semibold text-lg ml-2">Complete Profile</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView
                    className="flex-1 px-6"
                    contentContainerStyle={{ paddingBottom: 20 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Progress Header */}
                    <View className="flex-row items-center gap-6 mt-8 mb-10">
                        <CircularProgress current={step} total={2} />
                        <View className="flex-1">
                            <Text className="text-white font-poppins-bold text-2xl">Complete Your Profile</Text>
                            <Text className="text-white/60 font-poppins-regular text-sm">
                                {step === 1 ? 'Basic Info' : 'Social Media & Photo'}
                            </Text>
                        </View>
                    </View>

                    {step === 1 ? (
                        <>
                            {/* Basic Info */}
                            <FormField
                                label="Full Name"
                                required
                                placeholder="Full Name"
                                value={form.name}
                                onChangeText={(v: string) => setForm({ ...form, name: v })}
                            />
                            <FormField
                                label="Email Id"
                                required
                                placeholder="Email Id"
                                keyboardType="email-address"
                                value={form.email}
                                onChangeText={(v: string) => setForm({ ...form, email: v })}
                            />
                            <SelectField
                                label="Language"
                                required
                                placeholder="Select Language(s)"
                                options={LANGUAGES}
                                selected={form.languages}
                                onSelect={(v: string[]) => setForm({ ...form, languages: v })}
                                multiSelect
                            />
                            <SelectField
                                label="Category"
                                required
                                placeholder="Select category"
                                options={categories}
                                selected={form.categoryIds}
                                onSelect={(v: string[]) => setForm({ ...form, categoryIds: v })}
                                multiSelect
                                itemKey={(i: any) => i.id}
                                itemLabel={(i: any) => i.name}
                            />
                            <FormField
                                label="Bio / Description"
                                required
                                placeholder="Tell people about yourself..."
                                multiline
                                value={form.bio}
                                onChangeText={(v: string) => setForm({ ...form, bio: v })}
                            />
                            <FormField
                                label="Portfolio"
                                required
                                placeholder="Enter Portfolio"
                                value={form.portfolio}
                                onChangeText={(v: string) => setForm({ ...form, portfolio: v })}
                            />

                            {/* Social Media Section */}
                            <View className="mt-4 mb-8">
                                <Text className="text-white font-poppins-bold text-xl mb-6">Social Media Presence</Text>

                                <SocialRow
                                    platform="Instagram"
                                    linkValue={form.instagramHandle}
                                    followersValue={form.instagramFollowers}
                                    onLinkChange={(v: string) => setForm({ ...form, instagramHandle: v })}
                                    onFollowersChange={(v: string) => setForm({ ...form, instagramFollowers: v.replace(/[^0-9]/g, '') })}
                                />
                                <SocialRow
                                    platform="YouTube"
                                    linkValue={form.youtubeHandle}
                                    followersValue={form.youtubeFollowers}
                                    onLinkChange={(v: string) => setForm({ ...form, youtubeHandle: v })}
                                    onFollowersChange={(v: string) => setForm({ ...form, youtubeFollowers: v.replace(/[^0-9]/g, '') })}
                                />
                                <SocialRow
                                    platform="Facebook"
                                    linkValue={form.facebookHandle}
                                    followersValue={form.facebookFollowers}
                                    onLinkChange={(v: string) => setForm({ ...form, facebookHandle: v })}
                                    onFollowersChange={(v: string) => setForm({ ...form, facebookFollowers: v.replace(/[^0-9]/g, '') })}
                                />
                                <SocialRow
                                    platform="Twitter / X"
                                    linkValue={form.twitterHandle}
                                    followersValue={form.twitterFollowers}
                                    onLinkChange={(v: string) => setForm({ ...form, twitterHandle: v })}
                                    onFollowersChange={(v: string) => setForm({ ...form, twitterFollowers: v.replace(/[^0-9]/g, '') })}
                                />
                                <SocialRow
                                    platform="Snapchat"
                                    linkValue={form.snapchatHandle}
                                    followersValue={form.snapchatFollowers}
                                    onLinkChange={(v: string) => setForm({ ...form, snapchatHandle: v })}
                                    onFollowersChange={(v: string) => setForm({ ...form, snapchatFollowers: v.replace(/[^0-9]/g, '') })}
                                />
                            </View>

                            <TouchableOpacity
                                onPress={handleNext}
                                disabled={!isStep1Valid}
                                className={`h-[60px] rounded-full items-center justify-center mb-10 shadow-lg mt-8 ${isStep1Valid ? 'bg-[#F02C8C] shadow-pink-500/30' : 'bg-[#2A2A2A]'
                                    }`}
                            >
                                <Text className={`font-poppins-bold text-lg ${isStep1Valid ? 'text-white' : 'text-[#F5F5F5]'}`}>Next</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            {/* Step 2 View */}
                            <View className="mb-4">
                                <Text className="text-white font-poppins-regular text-[13px] mb-4 ml-1 -mt-6">
                                    Profile Photo <Text className="text-red-500">*</Text>
                                </Text>

                                <View className="items-center">
                                    <TouchableOpacity
                                        onPress={pickImage}
                                        activeOpacity={0.8}
                                        className="w-full aspect-square bg-[#1A1A1A] rounded-[32px] items-center justify-center overflow-hidden border-2 border-dashed border-[#333]"
                                    >
                                        {form.profilePicture ? (
                                            <Image source={{ uri: form.profilePicture }} className="w-full h-full" />
                                        ) : (
                                            <View className="items-center">
                                                <ImageIcon color="#555" size={48} />
                                                <Text className="text-white font-poppins-semibold text-lg mt-4">Upload a Photo</Text>
                                                <Text className="text-[#555] font-poppins-regular text-sm mt-2 text-center px-6">
                                                    Support Formats: jpg, png{"\n"}Maximum Size: 2MB
                                                </Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>

                                    {form.profilePicture && (
                                        <View className="flex-row justify-between w-full mt-4 px-2">
                                            <TouchableOpacity onPress={pickImage}>
                                                <Text className="text-white font-poppins-medium text-[16px]">Re-Upload</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => setForm({ ...form, profilePicture: null })}>
                                                <Text className="text-white font-poppins-medium text-[16px]">Delete</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            </View>

                            <SelectField
                                label="Experience Level"
                                required
                                placeholder="Select Your level"
                                options={LEVELS}
                                selected={form.experienceLevel}
                                onSelect={(v: string) => setForm({ ...form, experienceLevel: v })}
                            />
                            <TouchableOpacity
                                onPress={handleSignup}
                                disabled={!isStep2Valid || loading}
                                className={`h-[60px] rounded-full items-center justify-center mb-10 shadow-lg mt-8 ${isStep2Valid && !loading ? 'bg-[#F02C8C] shadow-pink-500/30' : 'bg-[#2A2A2A]'
                                    }`}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className={`font-poppins-bold text-lg ${isStep2Valid ? 'text-white' : 'text-[#F5F5F5]'}`}>
                                        {mode === 'update' ? 'Update Profile' : 'Complete Profile'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
            <SuccessModal visible={showSuccessModal} onClose={handleSuccessClose} />
        </SafeAreaView>
    );
}