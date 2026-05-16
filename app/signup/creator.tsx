import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronDownIcon, ChevronLeftIcon, ImageIcon } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    BackHandler,
    Image,
    KeyboardAvoidingView,
    Linking,
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
    getInstagramVerificationStatus,
    getMyCreatorProfile,
    startInstagramVerification,
    submitCreatorApplication,
    updateCreatorProfile,
    uploadImage,
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
                            {/* Close button */}
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/10 items-center justify-center"
                                activeOpacity={0.7}
                            >
                                <Text style={{ color: '#fff', fontSize: 14, lineHeight: 16 }}>✕</Text>
                            </TouchableOpacity>
                            <ScrollView showsVerticalScrollIndicator={true} persistentScrollbar={true} className="py-2" indicatorStyle="white">
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

// ── Instagram Verification ─────────────────────────────────────
type IgVerifyProps = {
    value: string;
    followersValue: string;
    onValueChange: (v: string) => void;
    onFollowersChange: (v: string) => void;
    verified: boolean;
    onVerifyPress: () => void;
    verifying: boolean;
};

const InstagramVerifyRow = ({
    value,
    followersValue,
    onValueChange,
    onFollowersChange,
    verified,
    onVerifyPress,
    verifying,
}: IgVerifyProps) => (
    <View className="mb-4">
        <Text className="text-white font-poppins-regular text-[13px] mb-2 ml-1">
            Instagram <Text className="text-red-500">*</Text>
        </Text>
        <View className="flex-row gap-2 mb-2">
            <View className="flex-[3] bg-[#1A1A1A] h-[56px] px-4 rounded-[12px] justify-center">
                <TextInput
                    placeholder="instagram.com/username or @handle"
                    placeholderTextColor="#555"
                    value={value}
                    onChangeText={onValueChange}
                    className="text-white font-poppins-regular"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!verified}
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
        <TouchableOpacity
            onPress={onVerifyPress}
            disabled={verified || verifying || !value.trim()}
            activeOpacity={0.8}
            style={{
                backgroundColor: verified ? '#16a34a' : verifying ? '#374151' : '#F02C8C',
                borderRadius: 10,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 6,
                opacity: !value.trim() && !verified ? 0.4 : 1,
            }}
        >
            {verifying ? (
                <ActivityIndicator size="small" color="#fff" />
            ) : (
                <Text className="text-white font-poppins-semibold text-[13px]">
                    {verified ? '✓ Verified' : 'Verify via Instagram DM'}
                </Text>
            )}
        </TouchableOpacity>
    </View>
);

// ── Instagram DM Code Modal ────────────────────────────────────
type IgModalProps = {
    visible: boolean;
    code: string;
    instagramUsername: string;
    digiTagInstagram: string;
    expiresAt: string | null;
    status: 'PENDING' | 'VERIFIED' | 'EXPIRED' | 'FAILED' | null;
    onClose: () => void;
};

const IgVerifyModal = ({
    visible,
    code,
    instagramUsername,
    digiTagInstagram,
    expiresAt,
    status,
    onClose,
}: IgModalProps) => {
    const [secondsLeft, setSecondsLeft] = React.useState(0);

    React.useEffect(() => {
        if (!visible || !expiresAt) return;
        const update = () => {
            const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
            setSecondsLeft(diff);
        };
        update();
        const t = setInterval(update, 1000);
        return () => clearInterval(t);
    }, [visible, expiresAt]);

    const mins = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    const timeStr = `${mins}:${String(secs).padStart(2, '0')}`;

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
                <View style={{ backgroundColor: '#111', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 40 }}>
                    {status === 'VERIFIED' ? (
                        <>
                            <Text style={{ color: '#16a34a', fontSize: 48, textAlign: 'center', marginBottom: 8 }}>✓</Text>
                            <Text style={{ color: '#fff', fontSize: 22, fontFamily: 'Poppins_700Bold', textAlign: 'center', marginBottom: 8 }}>
                                Instagram Verified!
                            </Text>
                            <Text style={{ color: '#aaa', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
                                @{instagramUsername} has been successfully verified.
                            </Text>
                            <TouchableOpacity
                                onPress={onClose}
                                style={{ backgroundColor: '#16a34a', borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'Poppins_600SemiBold' }}>Continue</Text>
                            </TouchableOpacity>
                        </>
                    ) : status === 'EXPIRED' ? (
                        <>
                            <Text style={{ color: '#ef4444', fontSize: 36, textAlign: 'center', marginBottom: 8 }}>⏱</Text>
                            <Text style={{ color: '#fff', fontSize: 20, fontFamily: 'Poppins_700Bold', textAlign: 'center', marginBottom: 8 }}>
                                Code Expired
                            </Text>
                            <Text style={{ color: '#aaa', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
                                The code has expired. Please close and try again.
                            </Text>
                            <TouchableOpacity
                                onPress={onClose}
                                style={{ backgroundColor: '#374151', borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'Poppins_600SemiBold' }}>Close</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text style={{ color: '#F02C8C', fontSize: 13, fontFamily: 'Poppins_600SemiBold', letterSpacing: 1, marginBottom: 4 }}>
                                INSTAGRAM VERIFICATION
                            </Text>
                            <Text style={{ color: '#fff', fontSize: 20, fontFamily: 'Poppins_700Bold', marginBottom: 6 }}>
                                DM this code to us
                            </Text>
                            <Text style={{ color: '#aaa', fontSize: 13, lineHeight: 20, marginBottom: 20 }}>
                                Open Instagram and send a DM from{' '}
                                <Text style={{ color: '#fff', fontFamily: 'Poppins_600SemiBold' }}>@{instagramUsername}</Text>
                                {' '}to{' '}
                                <Text style={{ color: '#F02C8C', fontFamily: 'Poppins_600SemiBold' }}>@{digiTagInstagram}</Text>
                                {' '}with exactly this code:
                            </Text>

                            {/* Code display */}
                            <View style={{ backgroundColor: '#1A1A2E', borderRadius: 16, paddingVertical: 20, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#F02C8C44' }}>
                                <Text style={{ color: '#F02C8C', fontSize: 11, letterSpacing: 2, marginBottom: 6 }}>YOUR VERIFICATION CODE</Text>
                                <Text style={{ color: '#fff', fontSize: 40, fontFamily: 'Poppins_700Bold', letterSpacing: 10 }}>{code}</Text>
                            </View>

                            {/* Countdown */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
                                <Text style={{ color: secondsLeft < 60 ? '#ef4444' : '#aaa', fontSize: 13 }}>
                                    Code expires in{' '}
                                    <Text style={{ fontFamily: 'Poppins_600SemiBold' }}>{timeStr}</Text>
                                </Text>
                            </View>

                            {/* Open Instagram button */}
                            <TouchableOpacity
                                onPress={async () => {
                                    await Clipboard.setStringAsync(code);
                                    Linking.openURL(`https://ig.me/m/${digiTagInstagram}`);
                                }}
                                style={{ backgroundColor: '#F02C8C', borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}
                            >
                                <Text style={{ color: '#fff', fontSize: 15, fontFamily: 'Poppins_600SemiBold' }}>
                                    Open Instagram DM
                                </Text>
                            </TouchableOpacity>
                            <Text style={{ color: '#888', fontSize: 11, textAlign: 'center', marginBottom: 12 }}>
                                Code <Text style={{ color: '#fff', fontFamily: 'Poppins_600SemiBold' }}>{code}</Text> is copied — just paste and send
                            </Text>

                            <TouchableOpacity
                                onPress={onClose}
                                style={{ backgroundColor: '#1f1f1f', borderRadius: 14, height: 48, alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Text style={{ color: '#888', fontSize: 14 }}>Cancel</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
};

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
    const params = useLocalSearchParams();
    const initialStep = params.step ? parseInt(params.step as string) : 1;

    const { userPhone, token, setProfileCompleted, setProfiles } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [prefilling, setPrefilling] = useState(true);
    const [step, setStep] = useState(initialStep);
    const [mode, setMode] = useState<'create' | 'update'>('create');
    const [categories] = useState<{ id: string; name: string }[]>(CREATOR_CATEGORIES);

    // Instagram verification state
    const [igVerified, setIgVerified] = useState(false);
    const [igVerifying, setIgVerifying] = useState(false);
    const [igVerifyModalVisible, setIgVerifyModalVisible] = useState(false);
    const [igVerification, setIgVerification] = useState<{
        id: string;
        code: string;
        instagramUsername: string;
        digiTagInstagram: string;
        expiresAt: string;
        status: 'PENDING' | 'VERIFIED' | 'EXPIRED' | 'FAILED';
    } | null>(null);
    const igPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [form, setForm] = useState({
        name: '',
        email: '',
        primaryLanguage: '',
        otherLanguages: [] as string[],
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
        location: '',
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
                        primaryLanguage: p.language || p.languages?.[0] || '',
                        otherLanguages: p.language
                            ? (p.languages || []).filter((l: string) => l !== p.language)
                            : (p.languages?.slice(1) || []),
                        bio: p.bio || '',
                        profilePicture: p.profilePicture || null,
                        location: p.location || '',
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
            form.primaryLanguage !== '' &&
            form.categoryIds.length > 0 &&
            form.bio.trim() !== ''
        );
    }, [form]);

    const isStep2Valid = useMemo(() => {
        return (
            form.profilePicture !== null &&
            form.experienceLevel !== '' &&
            form.location.trim() !== ''
        );
    }, [form]);

    const pickImage = async () => {
        Alert.alert(
            'Profile Photo',
            'Choose a source',
            [
                {
                    text: 'Camera',
                    onPress: async () => {
                        const { status } = await ImagePicker.requestCameraPermissionsAsync();
                        if (status !== 'granted') {
                            Alert.alert('Permission Required', 'Camera access is needed to take a photo.');
                            return;
                        }
                        const result = await ImagePicker.launchCameraAsync({
                            allowsEditing: true,
                            aspect: [1, 1],
                            quality: 0.8,
                        });
                        if (!result.canceled && result.assets?.[0]) {
                            setForm(prev => ({ ...prev, profilePicture: result.assets[0].uri }));
                        }
                    },
                },
                {
                    text: 'Gallery',
                    onPress: async () => {
                        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                        if (status !== 'granted') {
                            Alert.alert('Permission Required', 'Gallery access is needed to pick a photo.');
                            return;
                        }
                        const result = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ['images'],
                            allowsEditing: true,
                            aspect: [1, 1],
                            quality: 0.8,
                        });
                        if (!result.canceled && result.assets?.[0]) {
                            setForm(prev => ({ ...prev, profilePicture: result.assets[0].uri }));
                        }
                    },
                },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const stripHandle = (v: string) => v.trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?(instagram|youtube|twitter|x|facebook|snapchat)\.com\//i, '');

    const isValidUrl = (v: string) => {
        try { new URL(v); return true; } catch { return false; }
    };

    const isValidHandle = (v: string) => /^[a-zA-Z0-9._\-]{1,50}$/.test(v);

    const handleNext = () => {
        if (!form.name.trim()) { Alert.alert('Validation', 'Full name is required.'); return; }
        if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
            Alert.alert('Validation', 'Please enter a valid email address.'); return;
        }
        if (!form.primaryLanguage) { Alert.alert('Validation', 'Please select a primary language.'); return; }
        if (form.categoryIds.length === 0) { Alert.alert('Validation', 'Please select at least one category.'); return; }
        if (!form.bio.trim()) { Alert.alert('Validation', 'Bio is required.'); return; }
        setStep(2);
    };

    const handleSignup = async () => {
        if (!token) return;
        const ig = stripHandle(form.instagramHandle);
        if (ig && !isValidHandle(ig)) { Alert.alert('Validation', 'Instagram handle can only contain letters, numbers, dots, hyphens and underscores.'); return; }
        const yt = stripHandle(form.youtubeHandle);
        const fb = stripHandle(form.facebookHandle);
        const tw = stripHandle(form.twitterHandle);
        const sc = stripHandle(form.snapchatHandle);
        if (sc && !isValidHandle(sc)) { Alert.alert('Validation', 'Snapchat username can only contain letters, numbers, hyphens and underscores.'); return; }
        setLoading(true);
        try {
            let profilePictureUrl = form.profilePicture;
            if (profilePictureUrl && !profilePictureUrl.startsWith('http')) {
                const upRes = await uploadImage(
                    { uri: profilePictureUrl, name: `profile_${Date.now()}.jpg`, type: 'image/jpeg' },
                    token,
                    'profiles',
                );
                if (upRes.success && upRes.data?.url) {
                    profilePictureUrl = upRes.data.url;
                } else {
                    Alert.alert('Upload Failed', 'Could not upload profile picture. Please try again.');
                    setLoading(false);
                    return;
                }
            }

            const payload: any = {
                name: form.name.trim(),
                email: form.email.trim().toLowerCase(),
                categories: form.categoryIds,
                language: form.primaryLanguage,
                languages: form.primaryLanguage
                    ? [form.primaryLanguage, ...form.otherLanguages.filter(l => l !== form.primaryLanguage)]
                    : form.otherLanguages,
                bio: form.bio.trim(),
                profilePicture: profilePictureUrl,
                portfolioUrl: form.portfolio.trim(),
                experienceLevel: form.experienceLevel,
                location: form.location.trim(),
            };

            if (ig) payload.instagramHandle = ig;
            const igF = parseInt(form.instagramFollowers);
            if (!isNaN(igF)) payload.instagramFollowers = igF;

            if (yt) payload.youtubeHandle = yt;
            const ytF = parseInt(form.youtubeFollowers);
            if (!isNaN(ytF)) payload.youtubeFollowers = ytF;

            if (fb) payload.facebookHandle = fb;
            const fbF = parseInt(form.facebookFollowers);
            if (!isNaN(fbF)) payload.facebookFollowers = fbF;

            if (tw) payload.twitterHandle = tw;
            const twF = parseInt(form.twitterFollowers);
            if (!isNaN(twF)) payload.twitterFollowers = twF;

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

    // ── Instagram DM verification ──
    const handleIgVerify = async () => {
        if (!token || !form.instagramHandle.trim()) return;
        setIgVerifying(true);
        try {
            const res = await startInstagramVerification(token, form.instagramHandle.trim());
            if (res.success && res.data) {
                setIgVerification({
                    id: res.data.id,
                    code: res.data.code,
                    instagramUsername: res.data.instagramUsername,
                    digiTagInstagram: res.data.digiTagInstagram,
                    expiresAt: res.data.expiresAt,
                    status: 'PENDING',
                });
                setIgVerifyModalVisible(true);
                // Start polling every 4 seconds
                igPollRef.current = setInterval(async () => {
                    if (!token || !res.data?.id) return;
                    const statusRes = await getInstagramVerificationStatus(token, res.data.id);
                    if (statusRes.success && statusRes.data) {
                        const s = statusRes.data.status as 'PENDING' | 'VERIFIED' | 'EXPIRED' | 'FAILED';
                        setIgVerification((prev) => prev ? { ...prev, status: s } : prev);
                        if (s === 'VERIFIED') {
                            clearInterval(igPollRef.current!);
                            igPollRef.current = null;
                            setIgVerified(true);
                            setIgVerifyModalVisible(true); // reopen modal to show success screen
                        } else if (s === 'EXPIRED' || s === 'FAILED') {
                            clearInterval(igPollRef.current!);
                            igPollRef.current = null;
                            setIgVerifyModalVisible(true); // reopen modal to show expired screen
                        }
                    }
                }, 4000);
            } else {
                Alert.alert('Error', res.error || 'Could not start verification');
            }
        } finally {
            setIgVerifying(false);
        }
    };

    const handleIgModalClose = () => {
        // Don't stop polling — user may close modal to go send the DM in Instagram
        // Polling continues in background until VERIFIED or EXPIRED
        setIgVerifyModalVisible(false);
    };

    // Clean up poll on unmount
    useEffect(() => {
        return () => {
            if (igPollRef.current) clearInterval(igPollRef.current);
        };
    }, []);

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
        <SafeAreaView className="flex-1 bg-black" edges={['top', 'left', 'right', 'bottom']}>
            <LinearGradient colors={['#300A1F', '#000000']} className="absolute inset-0 h-[33%]" />

            {/* Header */}
            <View className="flex-row items-center px-4 py-2 border-b border-white/5">
                <TouchableOpacity onPress={handleBack} className="p-2">
                    <ChevronLeftIcon color="white" size={24} />
                </TouchableOpacity>
                <Text className="text-white font-poppins-semibold text-lg ml-2">Complete Profile</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
            >
                <ScrollView
                    className="flex-1 px-6"
                    contentContainerStyle={{ paddingBottom: 0 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
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
                                label="Primary Language"
                                required
                                placeholder="Select primary language"
                                options={LANGUAGES}
                                selected={form.primaryLanguage}
                                onSelect={(v: string) => setForm({ ...form, primaryLanguage: v, otherLanguages: form.otherLanguages.filter(l => l !== v) })}
                            />
                            <SelectField
                                label="Other Languages"
                                placeholder="Select other languages (optional)"
                                options={LANGUAGES.filter(l => l !== form.primaryLanguage)}
                                selected={form.otherLanguages}
                                onSelect={(v: string[]) => setForm({ ...form, otherLanguages: v })}
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
                            {/* Social Media Section */}
                            <View className="mt-4 mb-8">
                                <Text className="text-white font-poppins-bold text-xl mb-6">Social Media Presence</Text>

                                <InstagramVerifyRow
                                    value={form.instagramHandle}
                                    followersValue={form.instagramFollowers}
                                    onValueChange={(v: string) => {
                                        setForm({ ...form, instagramHandle: v });
                                        if (igVerified) setIgVerified(false);
                                    }}
                                    onFollowersChange={(v: string) => setForm({ ...form, instagramFollowers: v.replace(/[^0-9]/g, '') })}
                                    verified={igVerified}
                                    onVerifyPress={handleIgVerify}
                                    verifying={igVerifying}
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
                                className="h-[60px] rounded-full items-center justify-center mb-0 shadow-lg mt-8 bg-[#F02C8C]"
                                activeOpacity={0.8}
                            >
                                <Text className="font-poppins-bold text-lg text-white">Next</Text>
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
                            <FormField
                                label="Location"
                                placeholder="City, Country"
                                value={form.location}
                                onChangeText={(v: string) => setForm({ ...form, location: v })}
                            />
                            <TouchableOpacity
                                onPress={handleSignup}
                                disabled={!isStep2Valid || loading}
                                className={`h-[60px] rounded-full items-center justify-center mb-0 shadow-lg mt-8 ${isStep2Valid && !loading ? 'bg-[#F02C8C] shadow-pink-500/30' : 'bg-[#2A2A2A]'
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
            {igVerification && (
                <IgVerifyModal
                    visible={igVerifyModalVisible}
                    code={igVerification.code}
                    instagramUsername={igVerification.instagramUsername}
                    digiTagInstagram={igVerification.digiTagInstagram}
                    expiresAt={igVerification.expiresAt}
                    status={igVerification.status}
                    onClose={handleIgModalClose}
                />
            )}
        </SafeAreaView>
    );
}