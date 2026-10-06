import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BG, BRAND, Card, Chip, Field, PrimaryButton, ScreenHeader, inputStyle } from '../../Components/brand/ui';
import { useAuth } from '../../context/AuthContext';
import { createRequirement } from '../../services/brandService';
import { fonts, palette } from '../../theme/colors';

const SUGGESTED_CATEGORIES = ['Fashion & Lifestyle', 'Beauty & Skincare', 'Food & Cooking', 'Tech', 'Fitness & Health', 'Travel', 'Entertainment', 'Video Editing', 'Photography'];

/** A brand's requirement post. Always shown to Creators; also to Freelancers
 *  when "Freelancer required" is on. They respond with "Collab". */
export default function CreateRequirementScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [collaborationType, setCollaborationType] = useState<'PAID' | 'UNPAID'>('PAID');
    const [budget, setBudget] = useState('');
    const [location, setLocation] = useState('');
    const [freelancerRequired, setFreelancerRequired] = useState(false);
    const [saving, setSaving] = useState(false);

    const submit = async () => {
        if (!token) return;
        if (title.trim().length < 3) { Alert.alert('Add a title', 'e.g. "Food creators for Diwali reels".'); return; }
        if (description.trim().length < 10) { Alert.alert('Describe the requirement', 'Add deliverables, timeline and who you are looking for.'); return; }
        setSaving(true);
        const res = await createRequirement(token, {
            title: title.trim(),
            description: description.trim(),
            category: category.trim() || undefined,
            collaborationType,
            budget: budget.trim() || undefined,
            location: location.trim() || undefined,
            freelancerRequired,
        });
        setSaving(false);
        if (!res.success) {
            if (res.code?.startsWith('BRAND_')) {
                Alert.alert('Approval needed', res.error, [{ text: 'View status', onPress: () => router.push('/signup/pending?role=BRAND' as any) }, { text: 'OK' }]);
                return;
            }
            Alert.alert('Could not post', res.error);
            return;
        }
        Alert.alert('Requirement posted', freelancerRequired ? 'Creators and freelancers can now see it and send collab requests.' : 'Creators can now see it and send collab requests.');
        router.replace('/brand/my-posts' as any);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={['top', 'bottom']}>
            <ScreenHeader title="Post a requirement" subtitle="Creators respond with collab requests" />
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
                    <Field label="Title *">
                        <TextInput value={title} onChangeText={setTitle} maxLength={150} placeholder="Food creators for Diwali reels" placeholderTextColor="#555" style={inputStyle} />
                    </Field>
                    <Field label="Description *" hint="Deliverables, timeline, platforms, who you're looking for.">
                        <TextInput
                            value={description}
                            onChangeText={setDescription}
                            maxLength={2000}
                            placeholder="We need 5 creators to make 2 reels each featuring our new masala range…"
                            placeholderTextColor="#555"
                            multiline
                            style={{ ...inputStyle, minHeight: 130, textAlignVertical: 'top' }}
                        />
                    </Field>

                    <Field label="Category">
                        <TextInput value={category} onChangeText={setCategory} placeholder="e.g. Food & Cooking" placeholderTextColor="#555" style={inputStyle} />
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                            {SUGGESTED_CATEGORIES.map((c) => <Chip key={c} label={c} active={category === c} onPress={() => setCategory(category === c ? '' : c)} />)}
                        </ScrollView>
                    </Field>

                    <Field label="Collaboration">
                        <View style={{ flexDirection: 'row' }}>
                            <Chip label="Paid" active={collaborationType === 'PAID'} onPress={() => setCollaborationType('PAID')} />
                            <Chip label="Barter / Unpaid" active={collaborationType === 'UNPAID'} onPress={() => setCollaborationType('UNPAID')} />
                        </View>
                    </Field>

                    <View style={{ flexDirection: 'row' }}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <Field label="Budget">
                                <TextInput value={budget} onChangeText={setBudget} maxLength={100} placeholder="₹20k per creator" placeholderTextColor="#555" style={inputStyle} />
                            </Field>
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                            <Field label="Location">
                                <TextInput value={location} onChangeText={setLocation} maxLength={120} placeholder="Hyderabad / Remote" placeholderTextColor="#555" style={inputStyle} />
                            </Field>
                        </View>
                    </View>

                    <Card style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, borderColor: freelancerRequired ? BRAND.border : 'rgba(255,255,255,0.08)' }}>
                        <Ionicons name="briefcase-outline" size={22} color={BRAND.primary} />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={{ color: '#fff', fontSize: 14, fontFamily: fonts.semibold }}>Freelancer required</Text>
                            <Text style={{ color: palette.textMuted, fontSize: 12, fontFamily: fonts.regular, marginTop: 2 }}>
                                Also show this to freelancers (editors, photographers…). Creators always see it.
                            </Text>
                        </View>
                        <Switch value={freelancerRequired} onValueChange={setFreelancerRequired} trackColor={{ true: BRAND.primary, false: '#333' }} thumbColor="#fff" />
                    </Card>

                    <PrimaryButton title="Post requirement" onPress={submit} loading={saving} />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
