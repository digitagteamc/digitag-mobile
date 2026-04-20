import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import {
    createFreelancerProfile,
    getCategories,
    getMyCreatorProfile,
    getMyFreelancerProfile,
    submitCreatorApplication,
    updateCreatorProfile,
    updateFreelancerProfile,
} from '../../services/userService';

type Role = 'CREATOR' | 'FREELANCER';
interface Props { role: Role; }

interface FormState {
    // Step 1 — shared
    name: string;
    email: string;
    categoryId: string | null;
    categoryLabel: string;
    languages: string[];   // multi-select; joined with ', ' before API call
    bio: string;
    location: string;
    // Step 2 — shared
    profilePicture: string;
    // Step 2 — creator
    instagramHandle: string;
    instagramFollowers: string;
    youtubeHandle: string;
    youtubeFollowers: string;
    twitterHandle: string;
    twitterFollowers: string;
    snapchatHandle: string;
    preferredCollabType: 'PAID' | 'UNPAID';
    isAvailableForCollab: boolean;
    // Step 2 — freelancer
    skillsInput: string;
    hourlyRate: string;
    experienceLevel: string;
    availabilityLabel: string;
    availability: string;
    portfolioUrl: string;
    servicesOffered: string;
}

const EMPTY_FORM: FormState = {
    name: '', email: '', categoryId: null, categoryLabel: '', languages: [],
    bio: '', location: '', profilePicture: '',
    instagramHandle: '', instagramFollowers: '', youtubeHandle: '', youtubeFollowers: '',
    twitterHandle: '', twitterFollowers: '', snapchatHandle: '',
    preferredCollabType: 'UNPAID', isAvailableForCollab: true,
    skillsInput: '', hourlyRate: '', experienceLevel: '', availabilityLabel: 'Available',
    availability: 'AVAILABLE', portfolioUrl: '', servicesOffered: '',
};

const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Marathi', 'Bengali', 'Gujarati', 'Punjabi', 'Other'];
const EXPERIENCE_OPTIONS = [
    { key: 'BEGINNER', label: 'Beginner' },
    { key: 'INTERMEDIATE', label: 'Intermediate' },
    { key: 'ADVANCED', label: 'Advanced' },
    { key: 'EXPERT', label: 'Expert' },
];
const AVAILABILITY_OPTIONS = [
    { key: 'AVAILABLE', label: 'Available' },
    { key: 'BUSY', label: 'Busy' },
    { key: 'NOT_AVAILABLE', label: 'Not Available' },
];

const ACCENT = '#F26930';
const CREATOR_ACCENT = '#A78BFA';
const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const validateHandle = (v: string) => /^[a-zA-Z0-9._]{1,50}$/.test(v);
const validateUrl = (v: string) => /^https?:\/\/.{4,}/.test(v.trim());
const validateFollowerCount = (v: string) => /^\d+$/.test(v.trim());
const validateRate = (v: string) => /^\d+(\.\d{1,2})?$/.test(v.trim()) && parseFloat(v.trim()) >= 0;
const stripHandle = (v: string) => v.trim().replace(/^@/, '');

export default function CompleteProfileForm({ role }: Props) {
    const router = useRouter();
    const { token, userPhone, setProfileCompleted, setProfiles } = useAuth();

    const [step, setStep] = useState<1 | 2>(1);
    const [showStep1Errors, setShowStep1Errors] = useState(false);
    const [showStep2Errors, setShowStep2Errors] = useState(false);
    const [loadingPrefill, setLoadingPrefill] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [mode, setMode] = useState<'create' | 'update'>('create');
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);
    const [showLanguagePicker, setShowLanguagePicker] = useState(false);
    const [showExperiencePicker, setShowExperiencePicker] = useState(false);
    const [showAvailabilityPicker, setShowAvailabilityPicker] = useState(false);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);

    const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const accent = role === 'CREATOR' ? CREATOR_ACCENT : ACCENT;

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const catsRes = await getCategories({ role });
            if (!cancelled && catsRes.success && Array.isArray(catsRes.data)) {
                setCategories(catsRes.data.map((c: any) => ({ id: c.id, name: c.name })));
            }
            if (token) {
                const existing = role === 'CREATOR'
                    ? await getMyCreatorProfile(token)
                    : await getMyFreelancerProfile(token);
                if (!cancelled && existing.success && existing.data) {
                    const p = existing.data;
                    setMode('update');
                    if (role === 'CREATOR') {
                        setForm(prev => ({
                            ...prev,
                            name: p.name || '',
                            email: p.email || '',
                            categoryId: p.categoryId || null,
                            categoryLabel: p.category?.name || '',
                            languages: p.language ? p.language.split(',').map((l: string) => l.trim()).filter(Boolean) : [],
                            bio: p.bio || '',
                            location: p.location || '',
                            profilePicture: p.profilePicture || '',
                            instagramHandle: p.instagramHandle || '',
                            instagramFollowers: p.instagramFollowers?.toString() || '',
                            youtubeHandle: p.youtubeHandle || '',
                            youtubeFollowers: p.youtubeFollowers?.toString() || '',
                            twitterHandle: p.twitterHandle || '',
                            twitterFollowers: p.twitterFollowers?.toString() || '',
                            snapchatHandle: p.snapchatHandle || '',
                            preferredCollabType: p.preferredCollabType || 'UNPAID',
                            isAvailableForCollab: p.isAvailableForCollab ?? true,
                        }));
                    } else {
                        const skills = Array.isArray(p.skills) ? p.skills : [];
                        const availOption = AVAILABILITY_OPTIONS.find(o => o.key === p.availability);
                        setForm(prev => ({
                            ...prev,
                            name: p.name || '',
                            email: p.email || '',
                            categoryId: p.categoryId || null,
                            categoryLabel: p.category?.name || '',
                            languages: p.language ? p.language.split(',').map((l: string) => l.trim()).filter(Boolean) : [],
                            bio: p.bio || '',
                            location: p.location || '',
                            profilePicture: p.profilePicture || '',
                            skillsInput: skills.join(', '),
                            hourlyRate: p.hourlyRate?.toString() || '',
                            experienceLevel: p.experienceLevel || '',
                            availability: p.availability || 'AVAILABLE',
                            availabilityLabel: availOption?.label || 'Available',
                            portfolioUrl: p.portfolioUrl || '',
                            servicesOffered: p.servicesOffered || '',
                        }));
                    }
                }
            }
            if (!cancelled) setLoadingPrefill(false);
        })();
        return () => { cancelled = true; };
    }, [role, token]);

    const step1FieldErrors = useMemo((): Record<string, string> => ({
        name: !form.name.trim() ? 'Name is required'
            : form.name.trim().length < 2 ? 'At least 2 characters required'
            : form.name.trim().length > 100 ? 'Max 100 characters'
            : '',
        email: !form.email.trim() ? 'Email is required'
            : !validateEmail(form.email.trim()) ? 'Enter a valid email address'
            : '',
        categoryId: !form.categoryId ? 'Please select a category' : '',
        language: form.languages.length === 0 ? 'Please select at least one language' : '',
        bio: !form.bio.trim() ? 'Bio is required'
            : form.bio.trim().length < 10 ? 'Describe yourself in at least 10 characters'
            : '',
        location: form.location.trim().length > 120 ? 'Max 120 characters' : '',
    }), [form]);

    const step2FieldErrors = useMemo((): Record<string, string> => {
        const errs: Record<string, string> = {};
        if (role === 'CREATOR') {
            const igHandle = stripHandle(form.instagramHandle);
            if (!igHandle) errs.instagramHandle = 'Instagram handle is required';
            else if (!validateHandle(igHandle)) errs.instagramHandle = 'Letters, numbers, dots or underscores only (max 50)';
            if (form.instagramFollowers.trim() && !validateFollowerCount(form.instagramFollowers))
                errs.instagramFollowers = 'Must be a whole number';
            if (form.youtubeHandle.trim() && !validateHandle(stripHandle(form.youtubeHandle)))
                errs.youtubeHandle = 'Invalid handle format';
            if (form.youtubeFollowers.trim() && !validateFollowerCount(form.youtubeFollowers))
                errs.youtubeFollowers = 'Must be a whole number';
            if (form.twitterHandle.trim() && !validateHandle(stripHandle(form.twitterHandle)))
                errs.twitterHandle = 'Invalid handle format';
            if (form.twitterFollowers.trim() && !validateFollowerCount(form.twitterFollowers))
                errs.twitterFollowers = 'Must be a whole number';
            if (form.profilePicture.trim() && !validateUrl(form.profilePicture))
                errs.profilePicture = 'Must be a valid URL starting with https://';
        } else {
            const skills = form.skillsInput.split(',').map(s => s.trim()).filter(Boolean);
            if (!form.skillsInput.trim() || skills.length === 0) errs.skillsInput = 'At least one skill is required';
            if (!form.experienceLevel) errs.experienceLevel = 'Please select your experience level';
            if (form.hourlyRate.trim() && !validateRate(form.hourlyRate))
                errs.hourlyRate = 'Enter a valid positive number (e.g. 500)';
            if (form.portfolioUrl.trim() && !validateUrl(form.portfolioUrl))
                errs.portfolioUrl = 'Must be a valid URL starting with https://';
            if (form.profilePicture.trim() && !validateUrl(form.profilePicture))
                errs.profilePicture = 'Must be a valid URL starting with https://';
        }
        return errs;
    }, [form, role]);

    const handleNext = () => {
        setShowStep1Errors(true);
        if (Object.values(step1FieldErrors).some(Boolean)) {
            Alert.alert('Fill Required Fields', 'Please correct the highlighted fields before continuing.');
            return;
        }
        setStep(2);
    };

    const handleBack = () => {
        if (step === 2) { setStep(1); return; }
        if (router.canGoBack()) router.back();
        else router.replace('/(tabs)');
    };

    const handleSubmit = async () => {
        if (!token) {
            Alert.alert('Sign In Required', 'Please sign in again.');
            router.replace('/role-selection');
            return;
        }
        setShowStep2Errors(true);
        if (Object.values(step2FieldErrors).some(Boolean)) {
            Alert.alert('Fill Required Fields', 'Please correct the highlighted fields before submitting.');
            return;
        }

        const base: Record<string, any> = {
            name: form.name.trim(),
            email: form.email.trim().toLowerCase(),
            categoryId: form.categoryId,
            language: form.languages.join(', '),
            bio: form.bio.trim(),
        };
        if (form.location.trim()) base.location = form.location.trim();
        if (form.profilePicture.trim()) base.profilePicture = form.profilePicture.trim();

        let payload: Record<string, any>;
        if (role === 'CREATOR') {
            payload = { ...base, preferredCollabType: form.preferredCollabType, isAvailableForCollab: form.isAvailableForCollab };
            const ig = stripHandle(form.instagramHandle);
            if (ig) payload.instagramHandle = ig;
            const igF = parseInt(form.instagramFollowers);
            if (!isNaN(igF)) payload.instagramFollowers = igF;
            const yt = stripHandle(form.youtubeHandle);
            if (yt) payload.youtubeHandle = yt;
            const ytF = parseInt(form.youtubeFollowers);
            if (!isNaN(ytF)) payload.youtubeFollowers = ytF;
            const tw = stripHandle(form.twitterHandle);
            if (tw) payload.twitterHandle = tw;
            const twF = parseInt(form.twitterFollowers);
            if (!isNaN(twF)) payload.twitterFollowers = twF;
            const sc = stripHandle(form.snapchatHandle);
            if (sc) payload.snapchatHandle = sc;
        } else {
            const skills = form.skillsInput.split(',').map(s => s.trim()).filter(Boolean);
            const hourlyRate = parseFloat(form.hourlyRate);
            payload = { ...base, skills, availability: form.availability };
            if (form.experienceLevel) payload.experienceLevel = form.experienceLevel;
            if (!isNaN(hourlyRate)) payload.hourlyRate = hourlyRate;
            if (form.portfolioUrl.trim()) payload.portfolioUrl = form.portfolioUrl.trim();
            if (form.servicesOffered.trim()) payload.servicesOffered = form.servicesOffered.trim();
        }

        setSubmitting(true);
        try {
            let result;
            if (role === 'CREATOR') {
                result = mode === 'update'
                    ? await updateCreatorProfile(payload, token)
                    : await submitCreatorApplication(payload, token);
                if (!result.success && /already/i.test(result.error || '') && mode === 'create')
                    result = await updateCreatorProfile(payload, token);
            } else {
                result = mode === 'update'
                    ? await updateFreelancerProfile(payload, token)
                    : await createFreelancerProfile(payload, token);
                if (!result.success && /already/i.test(result.error || '') && mode === 'create')
                    result = await updateFreelancerProfile(payload, token);
            }

            if (result.success) {
                setProfileCompleted(true);
                setProfiles({ [role]: true });
                Alert.alert(
                    mode === 'update' ? 'Profile Updated' : 'Profile Complete!',
                    mode === 'update' ? 'Your profile has been saved.' : "You're all set to start collaborating.",
                    [{ text: 'OK', onPress: () => router.replace('/(tabs)') }],
                );
            } else {
                Alert.alert('Submission Failed', result.error || 'Something went wrong.');
            }
        } catch (e: any) {
            Alert.alert('Network Error', e.message || 'Could not reach the server.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingPrefill) {
        return (
            <SafeAreaView style={styles.loadingWrap}>
                <ActivityIndicator color={accent} size="large" />
            </SafeAreaView>
        );
    }

    const roleLabel = role === 'CREATOR' ? 'Creator' : 'Freelancer';
    const step2Title = role === 'CREATOR' ? 'Social & Collab' : 'Work Details';

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={22} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{roleLabel} Profile</Text>
                    <View style={{ width: 36 }} />
                </View>

                <ScrollView
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.progressRow}>
                        <View style={[styles.progressRing, { borderColor: accent }]}>
                            <Text style={styles.progressText}>{step}/2</Text>
                        </View>
                        <View style={styles.progressCopy}>
                            <Text style={styles.progressTitle}>
                                {step === 1 ? 'Basic Info' : step2Title}
                            </Text>
                            <Text style={styles.progressSubtitle}>
                                {step === 1
                                    ? 'Tell us about yourself'
                                    : role === 'CREATOR'
                                        ? 'Your audience and collab preferences'
                                        : 'Your skills and work details'}
                            </Text>
                        </View>
                    </View>

                    {userPhone && step === 1 ? (
                        <View style={[styles.phoneBadge, { borderColor: `${accent}45`, backgroundColor: `${accent}12` }]}>
                            <Text style={[styles.phoneBadgeLabel, { color: accent }]}>VERIFIED NUMBER</Text>
                            <Text style={styles.phoneBadgeValue}>+91 {userPhone}</Text>
                        </View>
                    ) : null}

                    {step === 1 ? (
                        <Step1
                            form={form} set={set}
                            errors={step1FieldErrors} showErrors={showStep1Errors}
                            onCategoryPress={() => setShowCategoryPicker(true)}
                            onLanguagePress={() => setShowLanguagePicker(true)}
                        />
                    ) : role === 'CREATOR' ? (
                        <CreatorStep2 form={form} set={set} errors={step2FieldErrors} showErrors={showStep2Errors} />
                    ) : (
                        <FreelancerStep2
                            form={form} set={set}
                            errors={step2FieldErrors} showErrors={showStep2Errors}
                            onExperiencePress={() => setShowExperiencePicker(true)}
                            onAvailabilityPress={() => setShowAvailabilityPicker(true)}
                        />
                    )}

                    <TouchableOpacity
                        style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                        onPress={step === 1 ? handleNext : handleSubmit}
                        disabled={submitting}
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={role === 'CREATOR'
                                ? ['#9B7EFA', '#7352DD', '#5B3ABB']
                                : ['#FF7A3D', '#F26930', '#DE5518']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            style={styles.submitGradient}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitText}>
                                    {step === 1 ? 'Next →' : 'Complete Profile'}
                                </Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            <PickerModal visible={showCategoryPicker} onClose={() => setShowCategoryPicker(false)}
                title="Select Category" items={categories.map(c => ({ key: c.id, label: c.name }))}
                emptyText={`No ${role.toLowerCase()} categories yet`}
                onSelect={item => { set('categoryId', item.key); set('categoryLabel', item.label); setShowCategoryPicker(false); }} />
            <MultiPickerModal
                visible={showLanguagePicker}
                onClose={() => setShowLanguagePicker(false)}
                title="Select Languages"
                items={LANGUAGES.map(l => ({ key: l, label: l }))}
                selected={form.languages}
                onToggle={key => {
                    set('languages', form.languages.includes(key)
                        ? form.languages.filter(l => l !== key)
                        : [...form.languages, key]);
                }}
            />
            <PickerModal visible={showExperiencePicker} onClose={() => setShowExperiencePicker(false)}
                title="Select Experience Level" items={EXPERIENCE_OPTIONS}
                onSelect={item => { set('experienceLevel', item.key); setShowExperiencePicker(false); }} />
            <PickerModal visible={showAvailabilityPicker} onClose={() => setShowAvailabilityPicker(false)}
                title="Select Availability" items={AVAILABILITY_OPTIONS}
                onSelect={item => { set('availability', item.key); set('availabilityLabel', item.label); setShowAvailabilityPicker(false); }} />
        </SafeAreaView>
    );
}

/* ─────────────────────── STEP 1 — shared ─────────────────────── */
function Step1({ form, set, errors, showErrors, onCategoryPress, onLanguagePress }: {
    form: FormState;
    set: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
    errors: Record<string, string>;
    showErrors: boolean;
    onCategoryPress: () => void;
    onLanguagePress: () => void;
}) {
    return (
        <>
            <Field label="Full Name" required error={errors.name} showError={showErrors}>
                <TextInput
                    style={[styles.input, showErrors && errors.name ? styles.inputError : null]}
                    placeholder="Full Name" placeholderTextColor="#6B6B7A"
                    value={form.name} onChangeText={v => set('name', v)} maxLength={100} />
            </Field>
            <Field label="Email" required error={errors.email} showError={showErrors}>
                <TextInput
                    style={[styles.input, showErrors && errors.email ? styles.inputError : null]}
                    placeholder="Email address" placeholderTextColor="#6B6B7A"
                    value={form.email} onChangeText={v => set('email', v)} keyboardType="email-address" autoCapitalize="none" />
            </Field>
            <Field label="Category" required error={errors.categoryId} showError={showErrors}>
                <TouchableOpacity
                    style={[styles.input, showErrors && errors.categoryId ? styles.inputError : null]}
                    onPress={onCategoryPress} activeOpacity={0.7}>
                    <View style={styles.dropdownRow}>
                        <Text style={[styles.dropdownText, !form.categoryLabel && styles.placeholder]}>
                            {form.categoryLabel || 'Select Category'}
                        </Text>
                        <Ionicons name="chevron-down" size={16} color="#8A8A99" />
                    </View>
                </TouchableOpacity>
            </Field>
            <Field label="Languages" required error={errors.language} showError={showErrors}>
                <TouchableOpacity
                    style={[styles.input, showErrors && errors.language ? styles.inputError : null]}
                    onPress={onLanguagePress} activeOpacity={0.7}>
                    <View style={styles.dropdownRow}>
                        <Text style={[styles.dropdownText, form.languages.length === 0 && styles.placeholder]} numberOfLines={1}>
                            {form.languages.length > 0 ? form.languages.join(', ') : 'Select Languages'}
                        </Text>
                        <Ionicons name="chevron-down" size={16} color="#8A8A99" />
                    </View>
                </TouchableOpacity>
                {form.languages.length > 0 && (
                    <View style={styles.chipsRow}>
                        {form.languages.map((lang, i) => (
                            <View key={i} style={[styles.chip, { backgroundColor: 'rgba(115,82,221,0.15)', borderColor: 'rgba(115,82,221,0.4)' }]}>
                                <Text style={[styles.chipText, { color: '#A78BFA' }]}>{lang}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </Field>
            <Field label="Bio / Description" required error={errors.bio} showError={showErrors}>
                <TextInput
                    style={[styles.input, styles.multiline, showErrors && errors.bio ? styles.inputError : null]}
                    placeholder="Tell people about yourself…" placeholderTextColor="#6B6B7A"
                    value={form.bio} onChangeText={v => set('bio', v)} multiline maxLength={1000} />
                <Text style={styles.inputHint}>{form.bio.length}/1000</Text>
            </Field>
            <Field label="Location" error={errors.location} showError={showErrors}>
                <TextInput
                    style={[styles.input, showErrors && errors.location ? styles.inputError : null]}
                    placeholder="City, Country (optional)" placeholderTextColor="#6B6B7A"
                    value={form.location} onChangeText={v => set('location', v)} maxLength={120} />
            </Field>
        </>
    );
}

/* ─────────────────────── CREATOR STEP 2 ─────────────────────── */
function CreatorStep2({ form, set, errors, showErrors }: {
    form: FormState;
    set: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
    errors: Record<string, string>;
    showErrors: boolean;
}) {
    return (
        <>
            <Text style={styles.sectionTitle}>Profile Photo</Text>
            <Field label="" error={errors.profilePicture} showError={showErrors}>
                <TouchableOpacity style={styles.photoBox}
                    onPress={() => Alert.alert('Coming Soon', 'Image upload coming soon. Paste a URL below.')} activeOpacity={0.7}>
                    <Ionicons name="image-outline" size={34} color="#5A5A6A" />
                    <Text style={styles.photoTitle}>Upload a Photo</Text>
                    <Text style={styles.photoHint}>JPG, PNG — Max 2MB</Text>
                </TouchableOpacity>
                <TextInput
                    style={[styles.input, { marginTop: 10 }, showErrors && errors.profilePicture ? styles.inputError : null]}
                    placeholder="…or paste a photo URL"
                    placeholderTextColor="#6B6B7A" value={form.profilePicture} onChangeText={v => set('profilePicture', v)} autoCapitalize="none" />
            </Field>

            <Text style={styles.sectionTitle}>Social Media Presence</Text>
            <SocialHandleRow platform="Instagram" required icon="logo-instagram" iconColor="#E1306C"
                handleValue={form.instagramHandle} onHandleChange={v => set('instagramHandle', v)}
                followersValue={form.instagramFollowers} onFollowersChange={v => set('instagramFollowers', v)}
                handleError={showErrors ? errors.instagramHandle : ''}
                followersError={showErrors ? errors.instagramFollowers : ''} />
            <SocialHandleRow platform="YouTube" icon="logo-youtube" iconColor="#FF0000"
                handleValue={form.youtubeHandle} onHandleChange={v => set('youtubeHandle', v)}
                followersValue={form.youtubeFollowers} onFollowersChange={v => set('youtubeFollowers', v)} followersLabel="Subscribers"
                handleError={showErrors ? errors.youtubeHandle : ''}
                followersError={showErrors ? errors.youtubeFollowers : ''} />
            <SocialHandleRow platform="Twitter / X" icon="logo-twitter" iconColor="#1DA1F2"
                handleValue={form.twitterHandle} onHandleChange={v => set('twitterHandle', v)}
                followersValue={form.twitterFollowers} onFollowersChange={v => set('twitterFollowers', v)}
                handleError={showErrors ? errors.twitterHandle : ''}
                followersError={showErrors ? errors.twitterFollowers : ''} />
            <Field label="Snapchat">
                <TextInput style={styles.input} placeholder="@username" placeholderTextColor="#6B6B7A"
                    value={form.snapchatHandle} onChangeText={v => set('snapchatHandle', v)} autoCapitalize="none" />
            </Field>

            <Text style={styles.sectionTitle}>Collaboration Preferences</Text>
            <Field label="Preferred Collab Type">
                <View style={styles.toggleRow}>
                    <TouchableOpacity
                        style={[styles.toggleBtn, form.preferredCollabType === 'UNPAID' && styles.toggleBtnActive]}
                        onPress={() => set('preferredCollabType', 'UNPAID')}>
                        <Text style={[styles.toggleBtnText, form.preferredCollabType === 'UNPAID' && styles.toggleBtnTextActive]}>
                            Unpaid / Barter
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleBtn, form.preferredCollabType === 'PAID' && styles.toggleBtnActive]}
                        onPress={() => set('preferredCollabType', 'PAID')}>
                        <Text style={[styles.toggleBtnText, form.preferredCollabType === 'PAID' && styles.toggleBtnTextActive]}>
                            Paid
                        </Text>
                    </TouchableOpacity>
                </View>
            </Field>
            <Field label="Available for Collaboration">
                <View style={styles.switchRow}>
                    <Text style={[styles.dropdownText, { flex: 1 }]}>
                        {form.isAvailableForCollab ? "Open to collabs" : "Not accepting collabs"}
                    </Text>
                    <Switch
                        value={form.isAvailableForCollab}
                        onValueChange={v => set('isAvailableForCollab', v)}
                        trackColor={{ false: '#333', true: '#7352DD' }}
                        thumbColor={form.isAvailableForCollab ? '#A78BFA' : '#888'}
                    />
                </View>
            </Field>
        </>
    );
}

/* ─────────────────────── FREELANCER STEP 2 ─────────────────────── */
function FreelancerStep2({ form, set, errors, showErrors, onExperiencePress, onAvailabilityPress }: {
    form: FormState;
    set: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
    errors: Record<string, string>;
    showErrors: boolean;
    onExperiencePress: () => void;
    onAvailabilityPress: () => void;
}) {
    const chips = form.skillsInput.split(',').map(s => s.trim()).filter(Boolean);

    return (
        <>
            <Text style={styles.sectionTitle}>Profile Photo</Text>
            <Field label="" error={errors.profilePicture} showError={showErrors}>
                <TouchableOpacity style={styles.photoBox}
                    onPress={() => Alert.alert('Coming Soon', 'Image upload coming soon. Paste a URL below.')} activeOpacity={0.7}>
                    <Ionicons name="image-outline" size={34} color="#5A5A6A" />
                    <Text style={styles.photoTitle}>Upload a Photo</Text>
                    <Text style={styles.photoHint}>JPG, PNG — Max 2MB</Text>
                </TouchableOpacity>
                <TextInput
                    style={[styles.input, { marginTop: 10 }, showErrors && errors.profilePicture ? styles.inputError : null]}
                    placeholder="…or paste a photo URL"
                    placeholderTextColor="#6B6B7A" value={form.profilePicture} onChangeText={v => set('profilePicture', v)} autoCapitalize="none" />
            </Field>

            <Text style={styles.sectionTitle}>Skills & Expertise</Text>
            <Field label="Skills" required error={errors.skillsInput} showError={showErrors}>
                <TextInput
                    style={[styles.input, showErrors && errors.skillsInput ? styles.inputError : null]}
                    placeholder="e.g. Video Editing, Motion Graphics, Colour Grading"
                    placeholderTextColor="#6B6B7A" value={form.skillsInput}
                    onChangeText={v => set('skillsInput', v)} maxLength={300} />
                <Text style={styles.inputHint}>Separate skills with commas</Text>
                {chips.length > 0 && (
                    <View style={styles.chipsRow}>
                        {chips.map((skill, i) => (
                            <View key={i} style={styles.chip}>
                                <Text style={styles.chipText}>{skill}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </Field>
            <Field label="Experience Level" required error={errors.experienceLevel} showError={showErrors}>
                <TouchableOpacity
                    style={[styles.input, showErrors && errors.experienceLevel ? styles.inputError : null]}
                    onPress={onExperiencePress} activeOpacity={0.7}>
                    <View style={styles.dropdownRow}>
                        <Text style={[styles.dropdownText, !form.experienceLevel && styles.placeholder]}>
                            {EXPERIENCE_OPTIONS.find(o => o.key === form.experienceLevel)?.label || 'Select Level'}
                        </Text>
                        <Ionicons name="chevron-down" size={16} color="#8A8A99" />
                    </View>
                </TouchableOpacity>
            </Field>

            <Text style={styles.sectionTitle}>Work Details</Text>
            <Field label="Hourly Rate (₹)" error={errors.hourlyRate} showError={showErrors}>
                <TextInput
                    style={[styles.input, showErrors && errors.hourlyRate ? styles.inputError : null]}
                    placeholder="e.g. 500" placeholderTextColor="#6B6B7A"
                    value={form.hourlyRate} onChangeText={v => set('hourlyRate', v)} keyboardType="numeric" />
            </Field>
            <Field label="Portfolio URL" error={errors.portfolioUrl} showError={showErrors}>
                <TextInput
                    style={[styles.input, showErrors && errors.portfolioUrl ? styles.inputError : null]}
                    placeholder="https://your-portfolio.com" placeholderTextColor="#6B6B7A"
                    value={form.portfolioUrl} onChangeText={v => set('portfolioUrl', v)}
                    autoCapitalize="none" keyboardType="url" />
            </Field>
            <Field label="Services Offered">
                <TextInput style={[styles.input, styles.multiline]}
                    placeholder="Describe the services you offer…"
                    placeholderTextColor="#6B6B7A" value={form.servicesOffered}
                    onChangeText={v => set('servicesOffered', v)} multiline maxLength={500} />
            </Field>
            <Field label="Availability">
                <TouchableOpacity style={styles.input} onPress={onAvailabilityPress} activeOpacity={0.7}>
                    <View style={styles.dropdownRow}>
                        <Text style={styles.dropdownText}>{form.availabilityLabel}</Text>
                        <Ionicons name="chevron-down" size={16} color="#8A8A99" />
                    </View>
                </TouchableOpacity>
            </Field>
        </>
    );
}

/* ─────────────────────── HELPERS ─────────────────────── */
function SocialHandleRow({ platform, required, icon, iconColor, handleValue, onHandleChange, followersValue, onFollowersChange, followersLabel = 'Followers', handleError, followersError }: {
    platform: string; required?: boolean; icon: any; iconColor: string;
    handleValue: string; onHandleChange: (v: string) => void;
    followersValue: string; onFollowersChange: (v: string) => void;
    followersLabel?: string;
    handleError?: string;
    followersError?: string;
}) {
    return (
        <View style={styles.field}>
            <View style={styles.socialLabelRow}>
                <Ionicons name={icon} size={16} color={iconColor} />
                <Text style={styles.label}>
                    {platform}{required ? <Text style={styles.requiredMark}> *</Text> : null}
                </Text>
            </View>
            <View style={styles.socialHandleRow}>
                <TextInput
                    style={[styles.input, styles.handleInput, handleError ? styles.inputError : null]}
                    placeholder="@handle"
                    placeholderTextColor="#6B6B7A" value={handleValue} onChangeText={onHandleChange} autoCapitalize="none" />
                <TextInput
                    style={[styles.input, styles.followersInput, followersError ? styles.inputError : null]}
                    placeholder={followersLabel}
                    placeholderTextColor="#6B6B7A" value={followersValue} onChangeText={onFollowersChange} keyboardType="numeric" />
            </View>
            {handleError ? <Text style={styles.fieldError}>{handleError}</Text> : null}
            {followersError ? <Text style={styles.fieldError}>{followersError}</Text> : null}
        </View>
    );
}

function Field({ label, required, children, error, showError }: {
    label: string; required?: boolean; children: React.ReactNode;
    error?: string; showError?: boolean;
}) {
    const err = showError && error ? error : null;
    if (!label) return (
        <View style={styles.field}>
            {children}
            {err ? <Text style={styles.fieldError}>{err}</Text> : null}
        </View>
    );
    return (
        <View style={styles.field}>
            <Text style={styles.label}>{label}{required ? <Text style={styles.requiredMark}> *</Text> : null}</Text>
            {children}
            {err ? <Text style={styles.fieldError}>{err}</Text> : null}
        </View>
    );
}

function MultiPickerModal({ visible, onClose, title, items, selected, onToggle }: {
    visible: boolean; onClose: () => void; title: string;
    items: { key: string; label: string }[];
    selected: string[];
    onToggle: (key: string) => void;
}) {
    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <Pressable style={styles.modalBackdrop} onPress={onClose}>
                <Pressable style={styles.modalSheet} onPress={() => {}}>
                    <View style={styles.modalHandle} />
                    <Text style={styles.modalTitle}>{title}</Text>
                    <ScrollView style={{ maxHeight: 400 }}>
                        {items.map(item => {
                            const isSelected = selected.includes(item.key);
                            return (
                                <TouchableOpacity key={item.key} style={styles.modalItem} onPress={() => onToggle(item.key)} activeOpacity={0.7}>
                                    <Text style={[styles.modalItemText, isSelected && { color: '#A78BFA' }]}>{item.label}</Text>
                                    {isSelected ? <Ionicons name="checkmark" size={18} color="#A78BFA" /> : null}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                    <TouchableOpacity style={styles.modalCancel} onPress={onClose}>
                        <Text style={[styles.modalCancelText, { color: '#A78BFA' }]}>Done ({selected.length} selected)</Text>
                    </TouchableOpacity>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

function PickerModal({ visible, onClose, title, items, onSelect, emptyText }: {
    visible: boolean; onClose: () => void; title: string;
    items: { key: string; label: string }[];
    onSelect: (item: { key: string; label: string }) => void;
    emptyText?: string;
}) {
    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <Pressable style={styles.modalBackdrop} onPress={onClose}>
                <Pressable style={styles.modalSheet} onPress={() => {}}>
                    <View style={styles.modalHandle} />
                    <Text style={styles.modalTitle}>{title}</Text>
                    <ScrollView style={{ maxHeight: 400 }}>
                        {items.length === 0 ? (
                            <Text style={styles.modalEmpty}>{emptyText || 'No options available'}</Text>
                        ) : items.map(item => (
                            <TouchableOpacity key={item.key} style={styles.modalItem} onPress={() => onSelect(item)} activeOpacity={0.7}>
                                <Text style={styles.modalItemText}>{item.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <TouchableOpacity style={styles.modalCancel} onPress={onClose}>
                        <Text style={styles.modalCancelText}>Cancel</Text>
                    </TouchableOpacity>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#0A0A10' },
    loadingWrap: { flex: 1, backgroundColor: '#0A0A10', alignItems: 'center', justifyContent: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 12, paddingTop: 6, paddingBottom: 12,
    },
    backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: '#fff', fontSize: 17, fontFamily: 'Poppins_600SemiBold' },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    progressRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8, marginBottom: 18 },
    progressRing: {
        width: 56, height: 56, borderRadius: 28, borderWidth: 3,
        alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A0E10',
    },
    progressText: { color: '#fff', fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
    progressCopy: { flex: 1 },
    progressTitle: { color: '#fff', fontSize: 17, fontFamily: 'Poppins_600SemiBold' },
    progressSubtitle: { color: '#8A8A99', fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },
    phoneBadge: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 20 },
    phoneBadgeLabel: { fontSize: 10, letterSpacing: 1, fontFamily: 'Poppins_600SemiBold' },
    phoneBadgeValue: { color: '#fff', fontSize: 14, marginTop: 2, fontFamily: 'Poppins_600SemiBold' },
    sectionTitle: { color: '#fff', fontSize: 16, fontFamily: 'Poppins_700Bold', marginTop: 16, marginBottom: 8 },
    field: { marginBottom: 14 },
    label: { color: '#C0C0CC', fontSize: 13, marginBottom: 8, fontFamily: 'Poppins_400Regular' },
    requiredMark: { color: '#ED2A91' },
    input: {
        backgroundColor: '#1C1C24', borderWidth: 1, borderColor: '#262631', borderRadius: 10,
        paddingHorizontal: 14, paddingVertical: 12, color: '#fff', fontSize: 14,
        fontFamily: 'Poppins_400Regular', minHeight: 46,
    },
    multiline: { minHeight: 90, textAlignVertical: 'top', paddingTop: 12 },
    inputHint: { color: '#6B6B7A', fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 4 },
    fieldError: { color: '#EF4444', fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 4 },
    inputError: { borderColor: '#EF4444' },
    dropdownRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    dropdownText: { color: '#fff', fontSize: 14, fontFamily: 'Poppins_400Regular' },
    placeholder: { color: '#6B6B7A' },
    socialLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    socialHandleRow: { flexDirection: 'row', gap: 8 },
    handleInput: { flex: 2 },
    followersInput: { flex: 1 },
    toggleRow: { flexDirection: 'row', gap: 10 },
    toggleBtn: {
        flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1,
        borderColor: '#262631', backgroundColor: '#1C1C24', alignItems: 'center',
    },
    toggleBtnActive: { borderColor: '#7352DD', backgroundColor: 'rgba(115,82,221,0.15)' },
    toggleBtnText: { color: '#8A8A99', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
    toggleBtnTextActive: { color: '#A78BFA' },
    switchRow: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C24',
        borderWidth: 1, borderColor: '#262631', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, minHeight: 46,
    },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    chip: {
        backgroundColor: 'rgba(242,105,48,0.15)', borderWidth: 1,
        borderColor: 'rgba(242,105,48,0.4)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    },
    chipText: { color: '#F26930', fontSize: 12, fontFamily: 'Poppins_400Regular' },
    photoBox: {
        backgroundColor: '#1C1C24', borderWidth: 1.5, borderColor: '#30303A',
        borderStyle: 'dashed', borderRadius: 12, paddingVertical: 36,
        alignItems: 'center', justifyContent: 'center', gap: 4,
    },
    photoTitle: { color: '#fff', fontSize: 14, fontFamily: 'Poppins_600SemiBold', marginTop: 8 },
    photoHint: { color: '#6B6B7A', fontSize: 11, fontFamily: 'Poppins_400Regular' },
    submitBtn: { marginTop: 18, borderRadius: 999, overflow: 'hidden' },
    submitBtnDisabled: { opacity: 0.7 },
    submitGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
    submitText: { color: '#fff', fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalSheet: {
        backgroundColor: '#14141C', borderTopLeftRadius: 20, borderTopRightRadius: 20,
        paddingHorizontal: 20, paddingBottom: 30, paddingTop: 10,
    },
    modalHandle: { width: 48, height: 4, borderRadius: 2, backgroundColor: '#3A3A47', alignSelf: 'center', marginBottom: 10 },
    modalTitle: { color: '#fff', fontSize: 16, fontFamily: 'Poppins_600SemiBold', marginBottom: 8 },
    modalItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#242431', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    modalItemText: { color: '#fff', fontSize: 15, fontFamily: 'Poppins_400Regular' },
    modalEmpty: { color: '#8A8A99', textAlign: 'center', paddingVertical: 30, fontFamily: 'Poppins_400Regular' },
    modalCancel: { marginTop: 12, alignItems: 'center', paddingVertical: 12 },
    modalCancelText: { color: ACCENT, fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
});
