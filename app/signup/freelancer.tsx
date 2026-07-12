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
    createFreelancerProfile,
    getCategories,
    getInstagramVerificationStatus,
    getMyFreelancerProfile,
    getSocialVerificationStatus,
    startInstagramVerification,
    startSocialVerification,
    updateFreelancerProfile,
    uploadImage,
} from '../../services/userService';

const LANGUAGES = ['English', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Marathi', 'Malayalam', 'Bengali'];
const LEVELS = [
    { key: 'BEGINNER', label: '1-2 yrs exp' },
    { key: 'INTERMEDIATE', label: '2-5 yrs exp' },
    { key: 'EXPERT', label: '5+ yrs experience' },
];
const AVAILABILITY_OPTIONS = [
    { key: 'AVAILABLE', label: 'Available' },
    { key: 'BUSY', label: 'Busy' },
    { key: 'NOT_AVAILABLE', label: 'Not Available' },
];

const ACCENT = '#F26930';

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
                    stroke={ACCENT}
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
        return found ? itemLabel(found) : (typeof selected === 'string' ? selected : placeholder);
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
                                            style={{ paddingHorizontal: 16, paddingVertical: 14, marginBottom: 2, borderRadius: 10, backgroundColor: sel ? 'rgba(242,105,48,0.15)' : 'transparent' }}
                                        >
                                            <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 15, color: sel ? '#F26930' : '#fff' }}>
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

const InstagramVerifyRow = ({
    value, followersValue, onValueChange, onFollowersChange, verified, onVerifyPress, verifying,
}: any) => (
    <View className="mb-4">
        <Text className="text-white font-poppins-regular text-[13px] mb-2 ml-1">Instagram</Text>
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
            <View className={`flex-1 h-[56px] px-3 rounded-[12px] justify-center items-center ${verified ? 'bg-[#1a1200] border border-[#F26930]/30' : 'bg-[#1A1A1A]'}`}>
                <TextInput
                    placeholder="Followers"
                    placeholderTextColor="#555"
                    keyboardType="numeric"
                    value={followersValue}
                    onChangeText={onFollowersChange}
                    className="text-white font-poppins-regular text-[12px] text-center"
                    editable={true}
                />
            </View>
        </View>
        <TouchableOpacity
            onPress={onVerifyPress}
            disabled={verified || verifying || !value.trim()}
            activeOpacity={0.8}
            style={{
                backgroundColor: verified ? '#16a34a' : verifying ? '#374151' : ACCENT,
                borderRadius: 10, height: 40,
                alignItems: 'center', justifyContent: 'center',
                flexDirection: 'row', gap: 6,
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

const IgVerifyModal = ({ visible, code, instagramUsername, digiTagInstagram, expiresAt, status, onClose }: any) => {
    const [secondsLeft, setSecondsLeft] = React.useState(0);
    React.useEffect(() => {
        if (!visible || !expiresAt) return;
        const update = () => setSecondsLeft(Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)));
        update();
        const t = setInterval(update, 1000);
        return () => clearInterval(t);
    }, [visible, expiresAt]);
    const mins = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
                <View style={{ backgroundColor: '#111', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 40 }}>
                    {status === 'VERIFIED' ? (
                        <>
                            <Text style={{ color: '#16a34a', fontSize: 48, textAlign: 'center', marginBottom: 8 }}>✓</Text>
                            <Text style={{ color: '#fff', fontSize: 22, fontFamily: 'Poppins_700Bold', textAlign: 'center', marginBottom: 8 }}>Instagram Verified!</Text>
                            <Text style={{ color: '#aaa', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>@{instagramUsername} has been successfully verified.</Text>
                            <TouchableOpacity onPress={onClose} style={{ backgroundColor: '#16a34a', borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 16 }}>Done</Text>
                            </TouchableOpacity>
                        </>
                    ) : status === 'EXPIRED' || status === 'FAILED' ? (
                        <>
                            <Text style={{ color: '#ef4444', fontSize: 40, textAlign: 'center', marginBottom: 8 }}>✕</Text>
                            <Text style={{ color: '#fff', fontSize: 20, fontFamily: 'Poppins_700Bold', textAlign: 'center', marginBottom: 8 }}>Code Expired</Text>
                            <Text style={{ color: '#aaa', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>The verification code expired. Tap Verify again to get a new code.</Text>
                            <TouchableOpacity onPress={onClose} style={{ backgroundColor: ACCENT, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 16 }}>Try Again</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text style={{ color: '#fff', fontSize: 20, fontFamily: 'Poppins_700Bold', marginBottom: 4 }}>Verify your Instagram</Text>
                            <Text style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>
                                Open Instagram and DM the code below to <Text style={{ color: '#fff', fontFamily: 'Poppins_600SemiBold' }}>@{digiTagInstagram}</Text>
                            </Text>
                            <View style={{ backgroundColor: '#1A1A1A', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 20 }}>
                                <Text style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>Your verification code</Text>
                                <Text style={{ color: ACCENT, fontSize: 36, fontFamily: 'Poppins_700Bold', letterSpacing: 8 }}>{code}</Text>
                                <Text style={{ color: '#555', fontSize: 12, marginTop: 8 }}>
                                    Expires in {mins}:{String(secs).padStart(2, '0')}
                                </Text>
                            </View>
                            <Text style={{ color: '#666', fontSize: 12, textAlign: 'center', marginBottom: 16 }}>
                                Waiting for your DM… keep this screen open or send the DM then return here.
                            </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    Clipboard.setStringAsync(code);
                                    Linking.openURL(`https://ig.me/m/${digiTagInstagram}`);
                                }}
                                style={{ backgroundColor: ACCENT, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}
                            >
                                <Text style={{ color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 15 }}>Open Instagram DM</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onClose} style={{ borderWidth: 1, borderColor: '#333', borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ color: '#888', fontFamily: 'Poppins_500Medium', fontSize: 15 }}>Close (verification continues)</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        </Modal>
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

// --- Main Component ---

const FREELANCER_DRAFT_KEY = '@draft_freelancer_profile';

export default function FreelancerSignup() {
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

    // Instagram verification states
    const [igVerified, setIgVerified] = useState(false);
    const [igVerifying, setIgVerifying] = useState(false);
    const [igVerification, setIgVerification] = useState<{ id: string; code: string; instagramUsername: string; digiTagInstagram: string; expiresAt: string } | null>(null);
    const [igVerifyModalVisible, setIgVerifyModalVisible] = useState(false);
    const [igModalStatus, setIgModalStatus] = useState<string>('PENDING');
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
        portfolioUrl: '',
        skillsInput: '',
        experienceLevel: '',
        availability: 'AVAILABLE',
        location: '',
        profilePicture: null as string | null,
        profilePictureMimeType: 'image/jpeg',
        // Socials (if backend supports)
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
    });

    // Restores in-progress signup data after the OS kills/reloads the app (e.g. while
    // the user is away taking an IG screenshot or backgrounded mid-form) so they don't
    // have to retype everything. Only applies when no server profile is found below.
    const draftRestoredRef = useRef(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            // Fetch categories
            const catsRes = await getCategories({ role: 'FREELANCER' });
            if (!cancelled && catsRes.success && Array.isArray(catsRes.data)) {
                setCategories(catsRes.data.map((c: any) => ({ id: c.id, name: c.name })));
            }

            // Prefill existing profile
            if (token) {
                const existing = await getMyFreelancerProfile(token);
                if (!cancelled && existing.success && existing.data) {
                    const p = existing.data;
                    setMode('update');
                    draftRestoredRef.current = true; // editing real data — never overwrite with a stale draft
                    AsyncStorage.removeItem(FREELANCER_DRAFT_KEY).catch(() => {});
                    const skills = Array.isArray(p.skills) ? p.skills : [];
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
                        location: p.location || '',
                        profilePicture: p.profilePicture || null,
                        skillsInput: skills.join(', '),
                        experienceLevel: p.experienceLevel || '',
                        availability: p.availability || 'AVAILABLE',
                        portfolioUrl: p.portfolioUrl || '',
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
                        const raw = await AsyncStorage.getItem(FREELANCER_DRAFT_KEY);
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
            AsyncStorage.setItem(FREELANCER_DRAFT_KEY, JSON.stringify({ form, step })).catch(() => {});
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

    const handleIgVerify = async () => {
        if (!form.instagramHandle.trim() || !token) return;
        setIgVerifying(true);
        try {
            const res = await startInstagramVerification(token, form.instagramHandle.trim());
            if (res.success && res.data) {
                setIgVerification(res.data);
                setIgModalStatus('PENDING');
                setIgVerifyModalVisible(true);
                igPollRef.current = setInterval(async () => {
                    if (!res.data?.id) return;
                    const statusRes = await getInstagramVerificationStatus(token, res.data.id);
                    if (statusRes.success && statusRes.data) {
                        const s = statusRes.data.status;
                        setIgModalStatus(s);
                        if (s === 'VERIFIED') {
                            clearInterval(igPollRef.current!);
                            igPollRef.current = null;
                            setIgVerified(true);
                            setIgVerifyModalVisible(true);
                            const profileRes = await getMyFreelancerProfile(token);
                            if (profileRes.success && profileRes.data?.instagramFollowers != null) {
                                setForm(prev => ({ ...prev, instagramFollowers: String(profileRes.data.instagramFollowers) }));
                            }
                        } else if (s === 'EXPIRED' || s === 'FAILED') {
                            clearInterval(igPollRef.current!);
                            igPollRef.current = null;
                        }
                    }
                }, 4000);
            } else {
                Alert.alert('Error', res.error || 'Could not start verification');
            }
        } catch (e: any) {
            Alert.alert('Error', e?.message || 'Could not start verification');
        } finally {
            setIgVerifying(false);
        }
    };

    const handleIgModalClose = () => {
        setIgVerifyModalVisible(false);
        if (igModalStatus === 'EXPIRED' || igModalStatus === 'FAILED') {
            setIgVerification(null);
            setIgModalStatus('PENDING');
        }
    };

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
                    const profileRes = await getMyFreelancerProfile(token);
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
            if (completed) Alert.alert('Still verifying', `We're still confirming your ${label} account. This can take a moment — try reopening this screen shortly.`);
        } finally {
            setSocialVerifying(prev => ({ ...prev, [platform]: false }));
        }
    };

    const isStep1Valid = useMemo(() => {
        return (
            form.name.trim() !== '' &&
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) &&
            form.primaryLanguage !== '' &&
            form.category !== '' &&
            form.bio.trim() !== '' &&
            form.portfolioUrl.trim() !== ''
        );
    }, [form]);

    const isStep2Valid = useMemo(() => {
        return (
            form.profilePicture !== null &&
            form.experienceLevel !== '' &&
            form.skillsInput.trim() !== '' &&
            form.location.trim() !== '' &&
            form.availability !== ''
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
                            setForm(prev => ({ ...prev, profilePicture: uri, profilePictureMimeType: 'image/jpeg' }));
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
                            setForm(prev => ({ ...prev, profilePicture: uri, profilePictureMimeType: 'image/jpeg' }));
                        }
                    },
                },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const stripHandle = (v: string) => v.trim().replace(/^@/, '');

    const handleNext = () => {
        if (!form.name || !form.email || !form.primaryLanguage || !form.category || !form.bio || !form.portfolioUrl) {
            Alert.alert('Incomplete Form', 'Please fill in all required fields including primary language, bio and portfolio.');
            return;
        }
        setStep(2);
    };

    const handleSignup = async () => {
        if (!token) return;
        if (!form.experienceLevel || !form.profilePicture) {
            Alert.alert('Incomplete Profile', 'Please select experience level and upload a photo');
            return;
        }

        setLoading(true);
        try {
            let profilePictureUrl = form.profilePicture;
            if (profilePictureUrl && !profilePictureUrl.startsWith('http')) {
                const upRes = await uploadImage(
                    { uri: profilePictureUrl, name: `profile_${Date.now()}.jpg`, type: form.profilePictureMimeType },
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

            const skills = form.skillsInput.split(',').map(s => s.trim()).filter(Boolean);
            const payload: any = {
                name: form.name.trim(),
                email: form.email.trim().toLowerCase(),
                categories: form.category ? [form.category] : [],
                language: form.primaryLanguage,
                languages: form.primaryLanguage
                    ? [form.primaryLanguage, ...form.otherLanguages.filter(l => l !== form.primaryLanguage)]
                    : form.otherLanguages,
                bio: form.bio.trim(),
                location: form.location.trim(),
                profilePicture: profilePictureUrl,
                skills,
                experienceLevel: form.experienceLevel,
                availability: form.availability,
                portfolioUrl: form.portfolioUrl.trim(),
            };

            // Add socials if backend supports them for freelancers
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
                ? await updateFreelancerProfile(payload, token)
                : await createFreelancerProfile(payload, token);

            if (result.success) {
                AsyncStorage.removeItem(FREELANCER_DRAFT_KEY).catch(() => {});
                setProfileCompleted(true);
                setProfiles({ FREELANCER: true });
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
        router.replace('/(tabs)');
    };

    if (prefilling) {
        return (
            <SafeAreaView className="flex-1 bg-black items-center justify-center">
                <ActivityIndicator color={ACCENT} size="large" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-black" edges={['top', 'left', 'right', 'bottom']}>
            <LinearGradient colors={['#3B1F13', '#000000']} className="absolute inset-0 h-[33%]" />

            {/* Header */}
            <View className="flex-row items-center px-4 py-2 border-b border-white/5">
                <TouchableOpacity onPress={handleBack} className="p-2">
                    <ChevronLeftIcon color="white" size={24} />
                </TouchableOpacity>
                <Text className="text-white font-poppins-semibold text-lg ml-2">Complete Profile</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView
                    className="flex-1 px-6"
                    contentContainerStyle={{   }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Progress Header */}
                    <View className="flex-row items-center gap-6 mt-8 mb-10">
                        <CircularProgress current={step} total={2} />
                        <View className="flex-1">
                            <Text className="text-white font-poppins-bold text-2xl">Complete Your Profile</Text>
                            <Text className="text-white/60 font-poppins-regular text-sm">
                                Fill in your details to start collaborating
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
                                placeholder="Tell us about your services..."
                                multiline
                                value={form.bio}
                                onChangeText={(v: string) => setForm({ ...form, bio: v })}
                            />
                            <FormField
                                label="Portfolio URL"
                                required
                                placeholder="https://yourportfolio.com"
                                value={form.portfolioUrl}
                                onChangeText={(v: string) => setForm({ ...form, portfolioUrl: v })}
                            />

                            {/* Social Media Section */}
                            <View className="mt-4 mb-8">
                                <Text className="text-white font-poppins-bold text-xl mb-6">Social media Platforms</Text>

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
                                        followersValue={form.instagramFollowers}
                                        onValueChange={(v: string) => setForm({ ...form, instagramHandle: v })}
                                        onFollowersChange={(v: string) => setForm({ ...form, instagramFollowers: v.replace(/[^0-9]/g, '') })}
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
                                className={`h-[60px] rounded-full items-center justify-center mb-0 shadow-lg mt-2 mb-5 ${isStep1Valid && (mode === 'update' || igVerified) ? 'bg-[#F26930] shadow-orange-500/30' : 'bg-[#2A2A2A]'
                                    }`}
                            >
                                <Text className={`font-poppins-bold text-lg  ${isStep1Valid && (mode === 'update' || igVerified) ? 'text-white' : 'text-[#F5F5F5]'}`}>Next</Text>
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
                                itemKey={(i: any) => i.key}
                                itemLabel={(i: any) => i.label}
                            />

                            <SelectField
                                label="Availability"
                                required
                                placeholder="Select Availability"
                                options={AVAILABILITY_OPTIONS}
                                selected={form.availability}
                                onSelect={(v: string) => setForm({ ...form, availability: v })}
                                itemKey={(i: any) => i.key}
                                itemLabel={(i: any) => i.label}
                            />

                            <FormField
                                label="Skills"
                                required
                                placeholder="e.g. Logo Design, Copywriting (comma separated)"
                                value={form.skillsInput}
                                onChangeText={(v: string) => setForm({ ...form, skillsInput: v })}
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
                                className={`h-[60px] rounded-full items-center justify-center mb-0 shadow-lg mt-8 ${isStep2Valid && !loading ? 'bg-[#F26930] shadow-orange-500/30' : 'bg-[#2A2A2A]'
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
            <IgVerifyModal
                visible={igVerifyModalVisible}
                code={igVerification?.code}
                instagramUsername={igVerification?.instagramUsername}
                digiTagInstagram={igVerification?.digiTagInstagram}
                expiresAt={igVerification?.expiresAt}
                status={igModalStatus}
                onClose={handleIgModalClose}
            />
        </SafeAreaView>
    );
}

const SuccessModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
    useEffect(() => {
        if (visible) {
            const timer = setTimeout(() => {
                onClose();
            }, 1400);
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
                        className="bg-[#F9D1C5] px-8 py-2 rounded-full"
                    >
                        <Text className="text-[#F26930] font-poppins-semibold text-lg">Freelancer</Text>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};
