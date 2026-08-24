import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

const OBJECTIVES = ['Awareness', 'Engagement', 'Conversions', 'App Installs'] as const;

const NICHES = [
    'Tech & Gadgets',
    'Fashion & Lifestyle',
    'Beauty & Skincare',
    'Food & Beverage',
    'Fitness & Health',
    'Travel & Hospitality',
    'Gaming & Esports',
    'Education & Career',
    'Finance & Real Estate',
    'Entertainment & Music',
];

const CATEGORIES = [
    'Photography',
    'Videography',
    'Editor',
    'Script Writers',
    'Models',
    'Social Media Manager',
    'Styling & Makeup',
    'Growth Specialist',
    'Voice Over',
];

const BUDGET_RANGES = [
    '₹10,000 - ₹25,000',
    '₹25,000 - ₹50,000',
    '₹50,000 - ₹1,00,000',
    '₹1,00,000 - ₹2,50,000',
    '₹2,50,000 - ₹5,00,000',
    '₹5,00,000+',
];

const CREATOR_COUNTS = [
    '1 - 5 creators',
    '5 - 10 creators',
    '10 - 20 creators',
    '20 - 50 creators',
    '50+ creators',
];

export default function BrandCreateCampaign() {
    const router = useRouter();

    // Form state
    const [brief, setBrief] = useState('');
    const [targetNiche, setTargetNiche] = useState('');
    const [objective, setObjective] = useState<typeof OBJECTIVES[number]>('Awareness');
    const [budget, setBudget] = useState('₹50,000 - ₹1,00,000');
    const [category, setCategory] = useState('');
    const [numCreators, setNumCreators] = useState('5 - 10 creators');
    const [autoInvite, setAutoInvite] = useState(true);
    const [deliverables, setDeliverables] = useState<string[]>(['Story', 'Collab Reel', 'Non-Collab Reel']);

    // Modal pickers state
    const [activeModal, setActiveModal] = useState<'niche' | 'budget' | 'category' | 'creators' | null>(null);

    const toggleDeliverable = (item: string) => {
        if (deliverables.includes(item)) {
            setDeliverables(deliverables.filter((d) => d !== item));
        } else {
            setDeliverables([...deliverables, item]);
        }
    };

    const handleLaunchCampaign = () => {
        if (!category) {
            Alert.alert('Category Required', 'Please select a category for your campaign.');
            return;
        }
        Alert.alert(
            'Campaign Created!',
            'Your campaign has been successfully submitted and launched.',
            [{ text: 'OK', onPress: () => router.back() }]
        );
    };

    const handleSaveDraft = () => {
        Alert.alert(
            'Draft Saved',
            'Your campaign draft has been saved successfully.',
            [{ text: 'OK', onPress: () => router.back() }]
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-[#060606]">
            <StatusBar barStyle="light-content" backgroundColor="#060606" />

            {/* Header Bar */}
            <View className="flex-row items-center justify-between px-4 pt-3 pb-4 mt-10">
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => router.back()}
                    className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
                >
                    <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
                </TouchableOpacity>

                <Text className="text-white text-2xl font-medium tracking-tight text-center">
                    Create Campaign
                </Text>

                {/* Right spacer for symmetrical centering */}
                <View className="w-10" />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerClassName="px-4 pb-10 gap-5"
                keyboardShouldPersistTaps="handled"
            >
                {/* 1. Campaign Brief (Optional) */}
                <View className="gap-2">
                    <Text className="text-[#D6D6D6] text-sm tracking-tight">Campaign Brief (Optional)</Text>
                    <View className="bg-white/10 border border-neutral-700/50 rounded-xl h-40 p-3.5">
                        <TextInput
                            multiline
                            numberOfLines={5}
                            value={brief}
                            onChangeText={setBrief}
                            placeholder="Describe your campaign goals, brand context, or specific requirements..."
                            placeholderTextColor="#6E7180"
                            className="flex-1 text-white text-base leading-snug"
                            style={{ textAlignVertical: 'top' }}
                        />
                    </View>
                </View>

                {/* 2. Target Niche */}
                <View className="gap-2">
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setActiveModal('niche')}
                        className="bg-white/10 border border-neutral-700/50 rounded-xl h-14 px-4 flex-row items-center justify-between"
                    >
                        <View className="flex-row items-center gap-3">
                            <Ionicons name="location-outline" size={22} color="#FFFFFF" />
                            <Text className={targetNiche ? 'text-white text-base' : 'text-white text-base'}>
                                {targetNiche || 'Target Niche'}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                {/* 3. Campaign Objective */}
                <View className="gap-2">
                    <Text className="text-white text-sm tracking-tight mb-1">Campaign Objective</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerClassName="gap-2 py-1"
                    >
                        {OBJECTIVES.map((item) => {
                            const isSelected = objective === item;
                            return (
                                <TouchableOpacity
                                    key={item}
                                    activeOpacity={0.85}
                                    onPress={() => setObjective(item)}
                                    className="rounded-xl overflow-hidden"
                                >
                                    {isSelected ? (
                                        <LinearGradient
                                            colors={['#8E44FF', '#CC1AE5']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            className="h-10 px-4 rounded-xl items-center justify-center shadow-lg shadow-purple-600"
                                        >
                                            <Text className="text-white text-xs">{item}</Text>
                                        </LinearGradient>
                                    ) : (
                                        <View className="h-10 px-4 rounded-xl bg-[#24242E] border border-[#404052] items-center justify-center">
                                            <Text className="text-white text-xs">{item}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* 4. Budget * */}
                <View className="gap-2">
                    <Text className="text-[#D6D6D6] text-sm tracking-tight">
                        Budget <Text className="text-[#E92E4A]">*</Text>
                    </Text>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setActiveModal('budget')}
                        className="bg-white/10 border border-neutral-700/50 rounded-xl h-14 px-4 flex-row items-center justify-between"
                    >
                        <Text className="text-white text-base">{budget || 'Select Budget Range'}</Text>
                        <Ionicons name="chevron-down" size={18} color="#6E7180" />
                    </TouchableOpacity>
                </View>

                {/* 5. Category * */}
                <View className="gap-2">
                    <Text className="text-[#D6D6D6] text-sm tracking-tight">
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

                {/* 6. No. of Creators * */}
                <View className="gap-2">
                    <Text className="text-[#D6D6D6] text-sm tracking-tight">
                        No. of Creators <Text className="text-[#E92E4A]">*</Text>
                    </Text>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setActiveModal('creators')}
                        className="bg-white/10 border border-neutral-700/50 rounded-xl h-14 px-4 flex-row items-center justify-between"
                    >
                        <Text className="text-white text-base">{numCreators || 'Select Number of Creators'}</Text>
                        <Ionicons name="chevron-down" size={18} color="#6E7180" />
                    </TouchableOpacity>
                </View>

                {/* 7. Auto-invite matching creators */}
                <View className="gap-2">
                    <Text className="text-white text-base tracking-tight mb-1">Auto-invite matching creators</Text>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setAutoInvite(!autoInvite)}
                        className="flex-row items-center gap-2.5 mt-1"
                    >
                        <View className={autoInvite ? 'w-5 h-5 rounded bg-[#1A8CFF] border border-[#1A8CFF] items-center justify-center' : 'w-5 h-5 rounded border border-white/40 items-center justify-center bg-transparent'}>
                            {autoInvite && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                        </View>
                        <Text className="text-white text-base">Enabled</Text>
                    </TouchableOpacity>
                </View>

                {/* 8. Deliverables */}
                <View className="gap-2">
                    <Text className="text-white text-base tracking-tight mb-1">Deliverables</Text>
                    <View className="flex-row flex-wrap gap-4 mt-1">
                        {[
                            { id: 'Story', label: 'Story' },
                            { id: 'Collab Reel', label: 'Collab Reel' },
                            { id: 'Non-Collab Reel', label: 'Non-Collab Reel' },
                        ].map((item) => {
                            const isChecked = deliverables.includes(item.id);
                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    activeOpacity={0.8}
                                    onPress={() => toggleDeliverable(item.id)}
                                    className="flex-row items-center gap-2.5"
                                >
                                    <View className={isChecked ? 'w-5 h-5 rounded bg-[#1A8CFF] border border-[#1A8CFF] items-center justify-center' : 'w-5 h-5 rounded border border-white/40 items-center justify-center bg-transparent'}>
                                        {isChecked && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                                    </View>
                                    <Text className="text-white text-base">{item.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* CTA Action Buttons */}
                <View className="mt-5 gap-4">
                    {/* Primary Button: Launch Campaign */}
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={handleLaunchCampaign}
                        className="rounded-full overflow-hidden shadow-lg shadow-blue-500/40"
                    >
                        <LinearGradient
                            colors={['#1A8CFF', '#6633E5']}
                            start={{ x: 0.1, y: 0.5 }}
                            end={{ x: 0.9, y: 0.5 }}
                            className="h-14 items-center justify-center rounded-full"
                        >
                            <Text className="text-white text-lg font-medium">Launch Campaign</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Secondary Button: Save as Draft */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleSaveDraft}
                        className="h-14 rounded-full border-[1.5px] border-[#1A8CFF] items-center justify-center shadow-md shadow-blue-500/20"
                    >
                        <Text className="text-[#1A8CFF] text-lg font-medium">Save as Draft</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Selector Modal for Dropdowns */}
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
                                        {activeModal === 'niche' && 'Select Target Niche'}
                                        {activeModal === 'budget' && 'Select Budget Range'}
                                        {activeModal === 'category' && 'Select Category'}
                                        {activeModal === 'creators' && 'Select Number of Creators'}
                                    </Text>
                                    <TouchableOpacity onPress={() => setActiveModal(null)}>
                                        <Ionicons name="close" size={22} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView className="max-h-[320px]">
                                    {activeModal === 'niche' &&
                                        NICHES.map((n) => (
                                            <TouchableOpacity
                                                key={n}
                                                className="py-3.5 px-3 flex-row items-center justify-between border-b border-white/5"
                                                onPress={() => {
                                                    setTargetNiche(n);
                                                    setActiveModal(null);
                                                }}
                                            >
                                                <Text className={targetNiche === n ? 'text-[#1A8CFF] text-base font-medium' : 'text-[#B8B8C6] text-base'}>
                                                    {n}
                                                </Text>
                                                {targetNiche === n && <Ionicons name="checkmark" size={18} color="#1A8CFF" />}
                                            </TouchableOpacity>
                                        ))}

                                    {activeModal === 'budget' &&
                                        BUDGET_RANGES.map((b) => (
                                            <TouchableOpacity
                                                key={b}
                                                className="py-3.5 px-3 flex-row items-center justify-between border-b border-white/5"
                                                onPress={() => {
                                                    setBudget(b);
                                                    setActiveModal(null);
                                                }}
                                            >
                                                <Text className={budget === b ? 'text-[#1A8CFF] text-base font-medium' : 'text-[#B8B8C6] text-base'}>
                                                    {b}
                                                </Text>
                                                {budget === b && <Ionicons name="checkmark" size={18} color="#1A8CFF" />}
                                            </TouchableOpacity>
                                        ))}

                                    {activeModal === 'category' &&
                                        CATEGORIES.map((c) => (
                                            <TouchableOpacity
                                                key={c}
                                                className="py-3.5 px-3 flex-row items-center justify-between border-b border-white/5"
                                                onPress={() => {
                                                    setCategory(c);
                                                    setActiveModal(null);
                                                }}
                                            >
                                                <Text className={category === c ? 'text-[#1A8CFF] text-base font-medium' : 'text-[#B8B8C6] text-base'}>
                                                    {c}
                                                </Text>
                                                {category === c && <Ionicons name="checkmark" size={18} color="#1A8CFF" />}
                                            </TouchableOpacity>
                                        ))}

                                    {activeModal === 'creators' &&
                                        CREATOR_COUNTS.map((cnt) => (
                                            <TouchableOpacity
                                                key={cnt}
                                                className="py-3.5 px-3 flex-row items-center justify-between border-b border-white/5"
                                                onPress={() => {
                                                    setNumCreators(cnt);
                                                    setActiveModal(null);
                                                }}
                                            >
                                                <Text className={numCreators === cnt ? 'text-[#1A8CFF] text-base font-medium' : 'text-[#B8B8C6] text-base'}>
                                                    {cnt}
                                                </Text>
                                                {numCreators === cnt && <Ionicons name="checkmark" size={18} color="#1A8CFF" />}
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
