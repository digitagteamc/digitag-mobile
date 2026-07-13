import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as ExpoLinking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
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
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { useAuth } from '../../context/AuthContext';
import { useLocationSuggestions } from '../../hooks/useLocationSuggestions';
import { prepareImageForUpload } from '../../services/imageResize';
import {
    getCategories,
    getInstagramVerificationStatus,
    getMyCreatorProfile,
    getSocialVerificationStatus,
    startInstagramVerification,
    startSocialVerification,
    submitCreatorApplication,
    updateCreatorProfile,
    uploadImage,
} from '../../services/userService';

const LANGUAGES = ['English', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Marathi', 'Malayalam', 'Bengali'];
const LEVELS = ['Beginner', 'Intermediate', 'Pro'];

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

const LocationField = ({ label = 'Location', required, placeholder, value, onChangeText }: any) => {
    const [focused, setFocused] = useState(false);
    const { suggestions } = useLocationSuggestions(value);

    return (
        <View className="mb-5" style={{ zIndex: focused ? 1000 : 1 }}>
            <Text className="text-white font-poppins-regular text-[13px] mb-2 ml-1">
                {label} {required && <Text className="text-red-500">*</Text>}
            </Text>
            <TextInput
                placeholder={placeholder}
                placeholderTextColor="#555"
                value={value}
                onChangeText={onChangeText}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 150)}
                className="bg-[#1A1A1A] text-white px-4 rounded-[12px] font-poppins-regular h-[56px]"
            />
            {focused && suggestions.length > 0 && (
                <View
                    style={{
                        position: 'absolute', top: 86, left: 0, right: 0, maxHeight: 220,
                        backgroundColor: '#1E1E1E', borderRadius: 16, borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.15)', overflow: 'hidden', zIndex: 1000,
                    }}
                >
                    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                        {suggestions.map((place) => (
                            <TouchableOpacity
                                key={place.id}
                                onPress={() => { onChangeText(place.label); setFocused(false); }}
                                activeOpacity={0.7}
                                style={{ paddingHorizontal: 16, paddingVertical: 12 }}
                            >
                                <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 15, color: '#fff' }} numberOfLines={1}>{place.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );
};

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
            triggerRef.current.measureInWindow((x, y, width, height) => {
                setLayout({ x, y, width, height });
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

            <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
                <Pressable
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
                    onPress={() => setModalVisible(false)}
                >
                    <Pressable
                        onPress={(e) => e.stopPropagation()}
                        style={{
                            position: 'absolute',
                            top: layout.y + layout.height + 4,
                            left: layout.x,
                            width: layout.width,
                            maxHeight: 260,
                            borderRadius: 16,
                            overflow: 'hidden',
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.15)',
                            backgroundColor: '#1E1E1E',
                        }}
                    >
                        <LinearGradient
                            colors={['rgba(40,40,40,0.98)', 'rgba(20,20,20,1)']}
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                        />
                        <View style={{ padding: 8 }}>
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}
                                activeOpacity={0.7}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Text style={{ color: '#fff', fontSize: 14, lineHeight: 16 }}>✕</Text>
                            </TouchableOpacity>
                            <ScrollView showsVerticalScrollIndicator={false} style={{ paddingTop: 8, maxHeight: 220 }} indicatorStyle="white">
                                {options.map((option: any) => {
                                    const key = itemKey(option);
                                    const lbl = itemLabel(option);
                                    const sel = isSelected(option);
                                    return (
                                        <TouchableOpacity
                                            key={key}
                                            onPress={() => handleSelect(option)}
                                            activeOpacity={0.7}
                                            style={{ paddingHorizontal: 16, paddingVertical: 14, marginBottom: 2, borderRadius: 10, backgroundColor: sel ? 'rgba(240,44,140,0.15)' : 'transparent' }}
                                        >
                                            <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 15, color: sel ? '#F02C8C' : '#fff' }}>
                                                {lbl}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
};

const SocialRow = ({ platform, linkValue, followersValue, onLinkChange, onFollowersChange }: any) => (
    <View className="mb-4">
        <Text className="text-white font-poppins-regular text-[13px] mb-2 ml-1">
            {platform}
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
    onValueChange: (v: string) => void;
    verified: boolean;
    onVerifyPress: () => void;
    verifying: boolean;
};

const InstagramVerifyRow = ({
    value,
    onValueChange,
    verified,
    onVerifyPress,
    verifying,
}: IgVerifyProps) => (
    <View className="mb-4">
        <Text className="text-white font-poppins-regular text-[13px] mb-2 ml-1">
            Instagram
        </Text>
        <View className={`h-[56px] px-4 rounded-[12px] justify-center mb-2 ${verified ? 'bg-[#0f2a0f]' : 'bg-[#1A1A1A]'}`}>
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

// ── YouTube / Facebook OAuth Verification ──────────────────────
// No manual inputs — the OAuth flow fills the handle (and follower count where
// the platform provides it) automatically, so the row is just a Verify button
// that turns into a "connected account" chip once verified.
type SocialVerifyRowProps = {
    platform: 'YouTube' | 'Facebook';
    verified: boolean;
    verifying: boolean;
    accountLabel?: string;
    onVerifyPress: () => void;
};

const SocialVerifyRow = ({
    platform,
    verified,
    verifying,
    accountLabel,
    onVerifyPress,
}: SocialVerifyRowProps) => (
    <View className="mb-4">
        <Text className="text-white font-poppins-regular text-[13px] mb-2 ml-1">
            {platform}
        </Text>
        {verified ? (
            <View className="bg-[#0f2a0f] h-[56px] px-4 rounded-[12px] flex-row items-center justify-between">
                <Text className="text-white font-poppins-regular flex-1" numberOfLines={1}>
                    {accountLabel || `${platform} account connected`}
                </Text>
                <Text className="text-[#16a34a] font-poppins-semibold text-[13px] ml-2">✓ Verified</Text>
            </View>
        ) : (
            <TouchableOpacity
                onPress={onVerifyPress}
                disabled={verifying}
                activeOpacity={0.8}
                style={{
                    backgroundColor: verifying ? '#374151' : '#F02C8C',
                    borderRadius: 12,
                    height: 48,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 6,
                }}
            >
                {verifying ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Text className="text-white font-poppins-semibold text-[13px]">
                        {`Verify with ${platform}`}
                    </Text>
                )}
            </TouchableOpacity>
        )}
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

const CREATOR_DRAFT_KEY = '@draft_creator_profile';

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
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

    useEffect(() => {
        getCategories({ role: 'CREATOR' }).then(res => {
            if (res.success && Array.isArray(res.data)) {
                setCategories(res.data.map((c: any) => ({ id: c.id, name: c.name })));
            }
        });
    }, []);

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

    // YouTube / Facebook OAuth verification state
    const [socialVerified, setSocialVerified] = useState<{ YOUTUBE: boolean; FACEBOOK: boolean }>({ YOUTUBE: false, FACEBOOK: false });
    const [socialVerifying, setSocialVerifying] = useState<{ YOUTUBE: boolean; FACEBOOK: boolean }>({ YOUTUBE: false, FACEBOOK: false });
    const [socialAccountNames, setSocialAccountNames] = useState<{ YOUTUBE: string; FACEBOOK: string }>({ YOUTUBE: '', FACEBOOK: '' });

    const [form, setForm] = useState({
        name: '',
        email: '',
        primaryLanguage: '',
        otherLanguages: [] as string[],
        category: '',
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

    // Restores in-progress signup data after the OS kills/reloads the app (e.g. while
    // the user is away taking an IG screenshot or backgrounded mid-form) so they don't
    // have to retype everything. Only applies when no server profile is found below.
    const draftRestoredRef = useRef(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            // Prefill existing profile
            if (token) {
                const existing = await getMyCreatorProfile(token);
                if (!cancelled && existing.success && existing.data) {
                    const p = existing.data;
                    setMode('update');
                    draftRestoredRef.current = true; // editing real data — never overwrite with a stale draft
                    AsyncStorage.removeItem(CREATOR_DRAFT_KEY).catch(() => {});
                    setForm(prev => ({
                        ...prev,
                        name: p.name || '',
                        email: p.email || '',
                        category: p.categories?.[0] || '',
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
                } else if (!cancelled) {
                    // No server profile — restore an in-progress draft, if any.
                    try {
                        const raw = await AsyncStorage.getItem(CREATOR_DRAFT_KEY);
                        if (raw && !cancelled) {
                            const draft = JSON.parse(raw);
                            if (draft?.form) setForm(prev => ({ ...prev, ...draft.form }));
                            if (draft?.step) setStep(draft.step);
                        }
                    } catch {}
                    draftRestoredRef.current = true;
                }
            }
            if (!cancelled) setPrefilling(false);
        })();

        return () => {
            cancelled = true;
        };
    }, [token]);

    // Debounced draft autosave — only while creating a brand-new profile, so an
    // app kill (backgrounding for the IG verify flow, low-memory reclaim, etc.)
    // doesn't wipe out everything the user already typed.
    useEffect(() => {
        if (prefilling || mode !== 'create' || !draftRestoredRef.current) return;
        const t = setTimeout(() => {
            AsyncStorage.setItem(CREATOR_DRAFT_KEY, JSON.stringify({ form, step })).catch(() => {});
        }, 500);
        return () => clearTimeout(t);
    }, [form, step, prefilling, mode]);

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
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) &&
            form.primaryLanguage !== '' &&
            form.category !== '' &&
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
                            const asset = result.assets[0];
                            const uri = await prepareImageForUpload(asset.uri, asset.width, asset.height);
                            setForm(prev => ({ ...prev, profilePicture: uri }));
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
                            const asset = result.assets[0];
                            const uri = await prepareImageForUpload(asset.uri, asset.width, asset.height);
                            setForm(prev => ({ ...prev, profilePicture: uri }));
                        }
                    },
                },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const stripHandle = (v: string) => v.trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?(instagram|youtube|twitter|x|facebook|snapchat)\.com\//i, '').replace(/[/?#].*$/, '');

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
        if (!form.category) { Alert.alert('Validation', 'Please select a category.'); return; }
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
                    Alert.alert('Upload Failed', (upRes as any).error || 'Could not upload profile picture. Please try again.');
                    setLoading(false);
                    return;
                }
            }

            const payload: any = {
                name: form.name.trim(),
                email: form.email.trim().toLowerCase(),
                categories: form.category ? [form.category] : [],
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
                AsyncStorage.removeItem(CREATOR_DRAFT_KEY).catch(() => {});
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
                            setIgVerifyModalVisible(true);
                            // Re-fetch profile so auto-filled follower count appears
                            if (token) {
                                const profileRes = await getMyCreatorProfile(token);
                                if (profileRes.success && profileRes.data?.instagramFollowers != null) {
                                    setForm(prev => ({ ...prev, instagramFollowers: String(profileRes.data.instagramFollowers) }));
                                }
                            }
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

    // ── YouTube / Facebook OAuth verification ──
    // Unlike Instagram's DM flow, the OAuth callback completes server-side before the
    // browser redirects back to the app, so a short bounded retry loop is enough —
    // no need for a long-lived poll interval.
    const handleSocialVerify = async (platform: 'YOUTUBE' | 'FACEBOOK') => {
        if (!token) return;
        const label = platform === 'YOUTUBE' ? 'YouTube' : 'Facebook';
        setSocialVerifying(prev => ({ ...prev, [platform]: true }));
        try {
            const res = await startSocialVerification(token, platform);
            if (!res.success || !res.data) {
                Alert.alert('Error', res.error || `${label} verification is not available right now`);
                return;
            }
            const { id, authorizationUrl } = res.data;
            const redirectUrl = ExpoLinking.createURL('social-verify');
            const result = await WebBrowser.openAuthSessionAsync(authorizationUrl, redirectUrl);
            // Android's auth session often reports "dismiss" even when the OAuth
            // redirect fired and the server finished verifying — poll the server
            // for the real outcome instead of trusting result.type. A genuine
            // cancel just polls briefly and gives up silently.
            const completed = result.type === 'success';
            const maxAttempts = completed ? 6 : 2;

            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                await new Promise(r => setTimeout(r, 1200));
                const statusRes = await getSocialVerificationStatus(token, id);
                if (!statusRes.success || !statusRes.data) continue;
                const s = statusRes.data.status;
                if (s === 'VERIFIED') {
                    setSocialVerified(prev => ({ ...prev, [platform]: true }));
                    if (statusRes.data.accountName) {
                        setSocialAccountNames(prev => ({ ...prev, [platform]: statusRes.data.accountName }));
                    }
                    const profileRes = await getMyCreatorProfile(token);
                    if (profileRes.success && profileRes.data) {
                        if (platform === 'YOUTUBE') {
                            setForm(prev => ({
                                ...prev,
                                youtubeHandle: profileRes.data.youtubeHandle || prev.youtubeHandle,
                                youtubeFollowers: profileRes.data.youtubeFollowers != null ? String(profileRes.data.youtubeFollowers) : prev.youtubeFollowers,
                            }));
                        } else {
                            setForm(prev => ({ ...prev, facebookHandle: profileRes.data.facebookHandle || prev.facebookHandle }));
                        }
                    }
                    return;
                }
                if (s === 'EXPIRED' || s === 'FAILED') {
                    Alert.alert('Verification failed', `We couldn't verify your ${label} account. Please try again.`);
                    return;
                }
            }
            if (completed) {
                Alert.alert('Still verifying', `We're still confirming your ${label} account. This can take a moment — try reopening this screen shortly.`);
            } else {
                // Browser closed/dismissed before reaching our server (user backed out,
                // or the platform itself blocked the dialog) — say so instead of
                // silently reverting the button with no explanation.
                Alert.alert('Verification not completed', `${label} login didn't finish. If ${label} showed an error, please try again in a few minutes.`);
            }
        } finally {
            setSocialVerifying(prev => ({ ...prev, [platform]: false }));
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
                keyboardVerticalOffset={0}
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
                                selected={form.category}
                                onSelect={(v: string) => setForm({ ...form, category: v })}
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

                                {mode === 'update' ? (
                                    <View className="mb-4">
                                        <Text className="text-white font-poppins-regular text-[13px] mb-2 ml-1">Instagram</Text>
                                        <View className="bg-[#1A1A1A] h-[56px] px-4 rounded-[12px] justify-center flex-row items-center">
                                            <Text className="text-[#888] font-poppins-regular flex-1">@{form.instagramHandle || '—'}</Text>
                                            <Text className="text-[#555] text-[11px] font-poppins-regular">Verified · Not editable</Text>
                                        </View>
                                    </View>
                                ) : (
                                    <InstagramVerifyRow
                                        value={form.instagramHandle}
                                        onValueChange={(v: string) => {
                                            setForm({ ...form, instagramHandle: v });
                                            if (igVerified) setIgVerified(false);
                                        }}
                                        verified={igVerified}
                                        onVerifyPress={handleIgVerify}
                                        verifying={igVerifying}
                                    />
                                )}
                                <SocialVerifyRow
                                    platform="YouTube"
                                    verified={socialVerified.YOUTUBE || !!form.youtubeHandle}
                                    verifying={socialVerifying.YOUTUBE}
                                    accountLabel={socialAccountNames.YOUTUBE || form.youtubeHandle}
                                    onVerifyPress={() => handleSocialVerify('YOUTUBE')}
                                />
                                <SocialVerifyRow
                                    platform="Facebook"
                                    verified={socialVerified.FACEBOOK || !!form.facebookHandle}
                                    verifying={socialVerifying.FACEBOOK}
                                    accountLabel={socialAccountNames.FACEBOOK || form.facebookHandle}
                                    onVerifyPress={() => handleSocialVerify('FACEBOOK')}
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
                                disabled={!isStep1Valid || (mode === 'create' && !igVerified)}
                                className={`h-[60px] rounded-full items-center justify-center mb-0 shadow-lg mt-8 ${isStep1Valid && (mode === 'update' || igVerified) ? 'bg-[#F02C8C]' : 'bg-[#2A2A2A]'}`}
                                activeOpacity={0.8}
                            >
                                <Text className={`font-poppins-bold text-lg ${isStep1Valid && (mode === 'update' || igVerified) ? 'text-white' : 'text-[#666]'}`}>Next</Text>
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
                            <LocationField
                                label="Location"
                                required
                                placeholder="Start typing your city"
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