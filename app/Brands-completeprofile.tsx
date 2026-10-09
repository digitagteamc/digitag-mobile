import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const LANGUAGES = [
    'English',
    'Hindi',
    'Punjabi',
    'Bengali',
    'Tamil',
    'Telugu',
    'Marathi',
    'Gujarati',
    'Kannada',
    'Malayalam',
    'Odia',
];

const CATEGORIES = [
    'E-commerce & Retail',
    'Fashion & Apparel',
    'Tech & Electronics',
    'Beauty & Personal Care',
    'Food & Beverage',
    'Health & Fitness',
    'Travel & Hospitality',
    'Education & EdTech',
    'Entertainment & Media',
    'Finance & Fintech',
];

export default function BrandsCompleteProfile() {
    const router = useRouter();
    const { setProfileCompleted, setProfiles } = useAuth();

    // Form fields
    const [firstName, setFirstName] = useState('');
    const [email, setEmail] = useState('');
    const [primaryLanguage, setPrimaryLanguage] = useState('');
    const [secondaryLanguage, setSecondaryLanguage] = useState('');
    const [category, setCategory] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [gstNumber, setGstNumber] = useState('');
    const [isGstVerified, setIsGstVerified] = useState(false);

    // Social Media Platforms
    const [instagramLink, setInstagramLink] = useState('');
    const [instagramFollowers, setInstagramFollowers] = useState('');
    const [youtubeLink, setYoutubeLink] = useState('');
    const [youtubeFollowers, setYoutubeFollowers] = useState('');
    const [snapchatLink, setSnapchatLink] = useState('');
    const [snapchatFollowers, setSnapchatFollowers] = useState('');
    const [twitterLink, setTwitterLink] = useState('');
    const [twitterFollowers, setTwitterFollowers] = useState('');

    // Modal state
    const [activeModal, setActiveModal] = useState<'primaryLang' | 'secLang' | 'category' | null>(null);
    const [loading, setLoading] = useState(false);

    const handleVerifyGst = () => {
        if (!gstNumber.trim()) {
            Alert.alert('GST Number Required', 'Please enter your GST number to verify.');
            return;
        }
        if (gstNumber.trim().length < 8) {
            Alert.alert('Invalid GST Number', 'Please enter a valid GST number.');
            return;
        }
        setIsGstVerified(true);
        Alert.alert('GST Verified', 'Your GST number has been verified successfully!');
    };

    const handleContinue = () => {
        if (!firstName.trim()) {
            Alert.alert('First Name Required', 'Please enter your first name.');
            return;
        }
        if (!email.trim() || !email.includes('@')) {
            Alert.alert('Valid Email Required', 'Please enter a valid email address.');
            return;
        }
        if (!primaryLanguage) {
            Alert.alert('Primary Language Required', 'Please select your primary language.');
            return;
        }
        if (!languageChoice) {
            Alert.alert('Language Required', 'Please select a language.');
            return;
        }
        if (!category) {
            Alert.alert('Category Required', 'Please select a business category.');
            return;
        }
        if (!businessName.trim()) {
            Alert.alert('Business Name Required', 'Please enter your business name.');
            return;
        }
        if (!gstNumber.trim()) {
            Alert.alert('GST Number Required', 'Please enter your GST number.');
            return;
        }
        if (!instagramLink.trim()) {
            Alert.alert('Instagram Link Required', 'Please enter your Instagram link.');
            return;
        }

        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setProfileCompleted(true);
            setProfiles({ BRAND: true });
            Alert.alert('Profile Completed', 'Your brand profile has been completed successfully!', [
                {
                    text: 'OK',
                    onPress: () => router.replace('/(tabs)'),
                },
            ]);
        }, 800);
    };

    const languageChoice = secondaryLanguage || primaryLanguage;

    return (
        <SafeAreaView className="flex-1 bg-[#060606]">
            <StatusBar barStyle="light-content" backgroundColor="#060606" />

            {/* Header */}
            <View className="flex-row items-center justify-between px-4 pt-3 pb-4 mt-10">
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => router.back()}
                    className="w-[42px] h-[42px] rounded-full bg-white/[0.08] items-center justify-center"
                >
                    <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
                </TouchableOpacity>
                <Text className="text-white text-2xl font-medium tracking-tight text-center">
                    Complete Profile
                </Text>
                <View className="w-[42px]" />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
            >
                <ScrollView
                    contentContainerClassName="px-4 pb-10 gap-4"
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* First Name * */}
                    <View className="gap-2">
                        <Text className="text-white text-sm">
                            First Name <Text className="text-[#E92E4A]">*</Text>
                        </Text>
                        <View className="bg-white/10 border border-neutral-700/50 rounded-xl h-14 px-4 justify-center">
                            <TextInput
                                className="text-white text-base flex-1"
                                value={firstName}
                                onChangeText={setFirstName}
                                placeholder="First Name"
                                placeholderTextColor="#6E7180"
                            />
                        </View>
                    </View>

                    {/* Email Id * */}
                    <View className="gap-2">
                        <Text className="text-white text-sm">
                            Email Id <Text className="text-[#E92E4A]">*</Text>
                        </Text>
                        <View className="bg-white/10 border border-neutral-700/50 rounded-xl h-14 px-4 justify-center">
                            <TextInput
                                className="text-white text-base flex-1"
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Email Id"
                                placeholderTextColor="#6E7180"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    {/* Primary Language * */}
                    <View className="gap-2">
                        <Text className="text-white text-sm">
                            Primary Language <Text className="text-[#E92E4A]">*</Text>
                        </Text>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setActiveModal('primaryLang')}
                            className="bg-white/10 border border-neutral-700/50 rounded-xl h-14 px-4 flex-row items-center justify-between"
                        >
                            <Text className={primaryLanguage ? 'text-white text-base' : 'text-[#6E7180] text-base'}>
                                {primaryLanguage || 'Select Language'}
                            </Text>
                            <Ionicons name="chevron-down" size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    {/* Language * */}
                    <View className="gap-2">
                        <Text className="text-white text-sm">
                            Language <Text className="text-[#E92E4A]">*</Text>
                        </Text>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setActiveModal('secLang')}
                            className="bg-white/10 border border-neutral-700/50 rounded-xl h-14 px-4 flex-row items-center justify-between"
                        >
                            <Text className={secondaryLanguage ? 'text-white text-base' : 'text-[#6E7180] text-base'}>
                                {secondaryLanguage || 'Select Language'}
                            </Text>
                            <Ionicons name="chevron-down" size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    {/* Category * */}
                    <View className="gap-2">
                        <Text className="text-white text-sm">
                            Category <Text className="text-[#E92E4A]">*</Text>
                        </Text>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setActiveModal('category')}
                            className="bg-white/10 border border-neutral-700/50 rounded-xl h-14 px-4 flex-row items-center justify-between"
                        >
                            <Text className={category ? 'text-white text-base' : 'text-[#6E7180] text-base'}>
                                {category || 'Select category'}
                            </Text>
                            <Ionicons name="chevron-down" size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    {/* Business Name * */}
                    <View className="gap-2">
                        <Text className="text-white text-sm">
                            Business Name <Text className="text-[#E92E4A]">*</Text>
                        </Text>
                        <View className="bg-white/10 border border-neutral-700/50 rounded-xl h-14 px-4 justify-center">
                            <TextInput
                                className="text-white text-base flex-1"
                                value={businessName}
                                onChangeText={setBusinessName}
                                placeholder="Business Name"
                                placeholderTextColor="#6E7180"
                            />
                        </View>
                    </View>

                    {/* GST Number * */}
                    <View className="gap-2">
                        <Text className="text-white text-sm">
                            GST Number <Text className="text-[#E92E4A]">*</Text>
                        </Text>
                        <View className="flex-row gap-3 items-center">
                            <View className="flex-1 bg-white/10 border border-neutral-700/50 rounded-xl h-14 px-4 justify-center">
                                <TextInput
                                    className="text-white text-base flex-1"
                                    value={gstNumber}
                                    onChangeText={(val) => {
                                        setGstNumber(val);
                                        setIsGstVerified(false);
                                    }}
                                    placeholder="GST Number"
                                    placeholderTextColor="#6E7180"
                                    autoCapitalize="characters"
                                />
                            </View>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={handleVerifyGst}
                                className={isGstVerified
                                    ? 'bg-[#10B981] border border-[#059669] h-14 rounded-xl px-5 items-center justify-center'
                                    : 'bg-[#6C47FF] border border-[#253E93] h-14 rounded-xl px-5 items-center justify-center'}
                            >
                                <Text className="text-white text-base font-medium">
                                    {isGstVerified ? 'Verified ✓' : 'Verify'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Social media Platforms Section */}
                    <Text className="text-white text-2xl font-semibold tracking-tight mt-3 mb-1">
                        Social media Platforms
                    </Text>

                    {/* Instagram * */}
                    <View className="gap-2">
                        <Text className="text-white text-sm">
                            Instagram <Text className="text-[#E92E4A]">*</Text>
                        </Text>
                        <View className="flex-row gap-3">
                            <View className="flex-[3] bg-white/10 border border-neutral-700/50 rounded-xl h-14 px-4 justify-center">
                                <TextInput
                                    className="text-white text-base flex-1"
                                    value={instagramLink}
                                    onChangeText={setInstagramLink}
                                    placeholder="Instagram links"
                                    placeholderTextColor="#6E7180"
                                    autoCapitalize="none"
                                />
                            </View>
                            <View className="flex-1 bg-white/10 border border-neutral-700/50 rounded-xl h-14 px-4 justify-center">
                                <TextInput
                                    className="text-white text-center text-[13px] flex-1"
                                    value={instagramFollowers}
                                    onChangeText={setInstagramFollowers}
                                    placeholder="Followers"
                                    placeholderTextColor="#6E7180"
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Youtube */}
                    <View className="gap-2">
                        <Text className="text-white text-sm">Youtube</Text>
                        <View className="flex-row gap-3">
                            <View className="flex-[3] bg-white/10 border border-neutral-700/50 rounded-xl h-14 px-4 justify-center">
                                <TextInput
                                    className="text-white text-base flex-1"
                                    value={youtubeLink}
                                    onChangeText={setYoutubeLink}
                                    placeholder="Youtube links"
                                    placeholderTextColor="#6E7180"
                                    autoCapitalize="none"
                                />
                            </View>
                            <View className="flex-1 bg-white/10 border border-neutral-700/50 rounded-xl h-14 px-4 justify-center">
                                <TextInput
                                    className="text-white text-center text-[13px] flex-1"
                                    value={youtubeFollowers}
                                    onChangeText={setYoutubeFollowers}
                                    placeholder="Followers"
                                    placeholderTextColor="#6E7180"
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Snapchat */}
                    <View className="gap-2">
                        <Text className="text-white text-sm">Snapchat</Text>
                        <View className="flex-row gap-3">
                            <View className="flex-[3] bg-white/10 border border-neutral-700/50 rounded-xl h-14 px-4 justify-center">
                                <TextInput
                                    className="text-white text-base flex-1"
                                    value={snapchatLink}
                                    onChangeText={setSnapchatLink}
                                    placeholder="Snapchat links"
                                    placeholderTextColor="#6E7180"
                                    autoCapitalize="none"
                                />
                            </View>
                            <View className="flex-1 bg-white/10 border border-neutral-700/50 rounded-xl h-14 px-4 justify-center">
                                <TextInput
                                    className="text-white text-center text-[13px] flex-1"
                                    value={snapchatFollowers}
                                    onChangeText={setSnapchatFollowers}
                                    placeholder="Followers"
                                    placeholderTextColor="#6E7180"
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Twitter */}
                    <View className="gap-2">
                        <Text className="text-white text-sm">Twitter</Text>
                        <View className="flex-row gap-3">
                            <View className="flex-[3] bg-white/10 border border-neutral-700/50 rounded-xl h-14 px-4 justify-center">
                                <TextInput
                                    className="text-white text-base flex-1"
                                    value={twitterLink}
                                    onChangeText={setTwitterLink}
                                    placeholder="Twitter links"
                                    placeholderTextColor="#6E7180"
                                    autoCapitalize="none"
                                />
                            </View>
                            <View className="flex-1 bg-white/10 border border-neutral-700/50 rounded-xl h-14 px-4 justify-center">
                                <TextInput
                                    className="text-white text-center text-[13px] flex-1"
                                    value={twitterFollowers}
                                    onChangeText={setTwitterFollowers}
                                    placeholder="Followers"
                                    placeholderTextColor="#6E7180"
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Continue Button */}
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={handleContinue}
                        disabled={loading}
                        className="mt-6 rounded-full overflow-hidden shadow-lg shadow-blue-500/40"
                    >
                        <LinearGradient
                            colors={['#1A8CFF', '#6633E5']}
                            start={{ x: 0.1, y: 0.5 }}
                            end={{ x: 0.9, y: 0.5 }}
                            className="h-14 items-center justify-center rounded-full"
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text className="text-white text-lg font-medium">Continue</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Modal Selectors */}
            <Modal
                visible={activeModal !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setActiveModal(null)}
            >
                <TouchableWithoutFeedback onPress={() => setActiveModal(null)}>
                    <View className="flex-1 bg-black/75 justify-center items-center px-5">
                        <TouchableWithoutFeedback>
                            <View className="w-full bg-[#181820] rounded-2xl p-5 border border-white/10">
                                <View className="flex-row items-center justify-between mb-4 pb-3 border-b border-white/10">
                                    <Text className="text-white text-lg font-medium">
                                        {activeModal === 'primaryLang' && 'Select Primary Language'}
                                        {activeModal === 'secLang' && 'Select Language'}
                                        {activeModal === 'category' && 'Select Category'}
                                    </Text>
                                    <TouchableOpacity onPress={() => setActiveModal(null)}>
                                        <Ionicons name="close" size={22} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView className="max-h-[320px]">
                                    {(activeModal === 'primaryLang' || activeModal === 'secLang') &&
                                        LANGUAGES.map((lang) => {
                                            const current = activeModal === 'primaryLang' ? primaryLanguage : secondaryLanguage;
                                            const isSelected = current === lang;
                                            return (
                                                <TouchableOpacity
                                                    key={lang}
                                                    className="py-3.5 px-3 flex-row items-center justify-between border-b border-white/5"
                                                    onPress={() => {
                                                        if (activeModal === 'primaryLang') setPrimaryLanguage(lang);
                                                        else setSecondaryLanguage(lang);
                                                        setActiveModal(null);
                                                    }}
                                                >
                                                    <Text className={isSelected ? 'text-[#1A8CFF] text-base font-medium' : 'text-[#B8B8C6] text-base'}>
                                                        {lang}
                                                    </Text>
                                                    {isSelected && <Ionicons name="checkmark" size={18} color="#1A8CFF" />}
                                                </TouchableOpacity>
                                            );
                                        })}

                                    {activeModal === 'category' &&
                                        CATEGORIES.map((cat) => (
                                            <TouchableOpacity
                                                key={cat}
                                                className="py-3.5 px-3 flex-row items-center justify-between border-b border-white/5"
                                                onPress={() => {
                                                    setCategory(cat);
                                                    setActiveModal(null);
                                                }}
                                            >
                                                <Text className={category === cat ? 'text-[#1A8CFF] text-base font-medium' : 'text-[#B8B8C6] text-base'}>
                                                    {cat}
                                                </Text>
                                                {category === cat && <Ionicons name="checkmark" size={18} color="#1A8CFF" />}
                                            </TouchableOpacity>
                                        ))}
                                </ScrollView>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </SafeAreaView>
    );
}
