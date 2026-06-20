import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useProfileGate } from '../context/ProfileGateContext';
import { createPost } from '../services/userService';
import { useRoleTheme } from '../theme/useRoleTheme';

const DRAFT_KEY = '@digitag_post_draft';

type CollabChoice = 'UNPAID' | 'PAID';

const CREATOR_CATEGORIES = [
  'Photography',
  'Editors',
  'Videography',
  'Growth Specialist',
  'Script Writers',
  'Styling & makeup',
  'Fashion Designers',
  'Property Rental',
  'Voice Over',
  'Models',
];

const FREELANCER_CATEGORIES = [
  'Lifestyle & Living',
  'Tech',
  'Education',
  'Photography',
  'Food',
  'Health',
  'Automotive',
  'Comedy & Memes',
  'Entertainment',
  'Gaming & Anime',
  'Learning',
  'News/Media/Magazins',
  'Sports',
  'Travel',
  'Beauty',
  'Fitness',
  'Fashion',
  'Finance & Investments',
  'Arts',
  'Business & Startups',
  'Community Pages',
  'Family/Kids/Pets',
  'Home & Decor',
  'Law/Rights/Activism',
  'Pets & Animals',
  'Politics',
];

export default function CreatePost() {
  const router = useRouter();
  const { token, userRole } = useAuth();
  const { requireProfile } = useProfileGate();
  const theme = useRoleTheme();

  const isCreator = userRole === 'CREATOR';

  // Role-specific copy
  const collabPlaceholder = isCreator
    ? 'What do you want from freelancer?'
    : 'What do you want from creator?';

  const categoryOptions = isCreator ? CREATOR_CATEGORIES : FREELANCER_CATEGORIES;

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [location, setLocation] = useState('');
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [collab, setCollab] = useState<CollabChoice | null>(null);
  const [isCollabOpen, setIsCollabOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [budget, setBudget] = useState('');
  const [boostDuration, setBoostDuration] = useState(4);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(DRAFT_KEY).then(raw => {
      if (!raw) return;
      try {
        const draft = JSON.parse(raw);
        if (draft.title || draft.body) {
          Alert.alert(
            'Restore Draft?',
            'You have an unsaved draft. Would you like to continue editing it?',
            [
              { text: 'Discard', style: 'destructive', onPress: () => AsyncStorage.removeItem(DRAFT_KEY) },
              {
                text: 'Restore', onPress: () => {
                  setTitle(draft.title || '');
                  setBody(draft.body || '');
                  setLocation(draft.location || '');
                  if (draft.collab) setCollab(draft.collab);
                  if (draft.category) setSelectedCategory(draft.category);
                },
              },
            ]
          );
        }
      } catch { /* corrupted draft */ }
    });
  }, []);

  const saveDraft = async () => {
    if (!title.trim() && !body.trim()) {
      Alert.alert('Nothing to save', 'Add some content before saving a draft.');
      return;
    }
    await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ title, body, location, collab, category: selectedCategory }));
    Alert.alert('Draft Saved', 'Your draft has been saved.');
  };

  const collabLabel = collab === 'PAID' ? 'Paid Collab' : collab === 'UNPAID' ? 'Free Collab' : collabPlaceholder;
  const categoryLabel = selectedCategory ?? 'Select Category';

  const handlePost = async () => {
    if (!requireProfile('create a post')) return;
    if (!token) { Alert.alert('Sign In Required', 'Please sign in to post.'); return; }

    const description = [title.trim(), body.trim()].filter(Boolean).join('\n\n');
    if (!description) { Alert.alert('Missing Content', 'Add a title or body before posting.'); return; }

    setSubmitting(true);
    try {
      const res = await createPost(
        { description, location: location.trim() || undefined, collaborationType: collab ?? 'UNPAID', category: selectedCategory || undefined, budget: budget.trim() || undefined },
        token,
      );
      if (res.success) {
        await AsyncStorage.removeItem(DRAFT_KEY);
        Alert.alert('Posted!', 'Your post is now live.', [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]);
      } else {
        Alert.alert('Post Failed', res.error || 'Something went wrong.');
      }
    } catch (e: any) {
      Alert.alert('Network Error', e.message || 'Could not reach the server.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimeEndsAt = (hours: number) => {
    const end = new Date(Date.now() + hours * 60 * 60 * 1000);
    return end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isCreator ? 'Create a post' : 'Create a post'}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Role label ── */}
        <View style={[styles.roleBadge, { backgroundColor: theme.soft, borderColor: theme.border }]}>
          <Ionicons name={isCreator ? 'person-outline' : 'briefcase-outline'} size={14} color={theme.primary} />
          <Text style={[styles.roleText, { color: theme.primary }]}>
            {isCreator ? 'Posting as Creator' : 'Posting as Freelancer'}
          </Text>
        </View>

        {/* ── Text Input Card ── */}
        <View style={styles.inputCard}>
          <TextInput
            style={styles.titleInput}
            placeholder="Title"
            placeholderTextColor="#A1A1A1"
            value={title}
            onChangeText={setTitle}
            maxLength={120}
          />
          <TextInput
            style={styles.bodyInput}
            placeholder="Body Text (Optional)"
            placeholderTextColor="#7A7A7A"
            value={body}
            onChangeText={setBody}
            multiline
            textAlignVertical="top"
            maxLength={1800}
          />
          <View style={styles.mediaActions}>
            <TouchableOpacity style={styles.mediaIconBtn} onPress={() => Alert.alert('Coming Soon', 'Image uploads coming soon.')}>
              <Ionicons name="image-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.mediaIconBtn} onPress={() => Alert.alert('Coming Soon', 'Video uploads coming soon.')}>
              <Feather name="youtube" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Location ── */}
        <TouchableOpacity
          style={[styles.listBtn, isLocationOpen && { borderColor: theme.primary }]}
          onPress={() => setIsLocationOpen(v => !v)}
        >
          <View style={styles.listBtnLeft}>
            <Ionicons name="location-outline" size={20} color="#fff" />
            <Text style={[styles.listBtnText, { marginLeft: 12 }]}>
              {location.trim() ? location : 'Add Location'}
            </Text>
          </View>
          <Ionicons name={isLocationOpen ? 'chevron-up' : 'chevron-forward'} size={20} color="#fff" />
        </TouchableOpacity>
        {isLocationOpen && (
          <TextInput
            style={[styles.inlineInput, { borderColor: theme.primary }]}
            placeholder="e.g. Mumbai, IN"
            placeholderTextColor="#555"
            value={location}
            onChangeText={setLocation}
            maxLength={120}
          />
        )}

        {/* ── Collab Type ── */}
        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={[styles.listBtn, isCollabOpen && { borderColor: theme.primary }]}
            onPress={() => setIsCollabOpen(v => !v)}
          >
            <View style={styles.listBtnLeft}>
              <Ionicons name="people-outline" size={20} color="#fff" />
              <Text style={[styles.listBtnText, { marginLeft: 12 }]}>{collabLabel}</Text>
            </View>
            <Ionicons name={isCollabOpen ? 'chevron-up' : 'chevron-forward'} size={20} color="#fff" />
          </TouchableOpacity>
          {isCollabOpen && (
            <LinearGradient colors={['rgba(30,30,36,0.98)', theme.softStrong]} style={styles.dropdownOptions}>
              {[
                { value: 'PAID' as CollabChoice, label: 'Paid Collab', icon: 'cash-outline' },
                { value: 'UNPAID' as CollabChoice, label: 'Free Collab', icon: 'gift-outline' },
              ].map(opt => (
                <TouchableOpacity key={opt.value} style={styles.optionItem} onPress={() => { setCollab(opt.value); setIsCollabOpen(false); }}>
                  <Ionicons name={opt.icon as any} size={16} color={theme.primary} />
                  <Text style={styles.optionText}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </LinearGradient>
          )}
        </View>

        {/* ── Category (opposite role) ── */}
        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={[styles.listBtn, isCategoryOpen && { borderColor: theme.primary }]}
            onPress={() => setIsCategoryOpen(v => !v)}
          >
            <View style={styles.listBtnLeft}>
              <Ionicons name="pricetag-outline" size={20} color="#fff" />
              <Text style={[styles.listBtnText, { marginLeft: 12, color: selectedCategory ? '#fff' : '#A1A1A1' }]}>
                {categoryLabel}
              </Text>
            </View>
            <Ionicons name={isCategoryOpen ? 'chevron-up' : 'chevron-forward'} size={20} color="#fff" />
          </TouchableOpacity>
          {isCategoryOpen && (
            <LinearGradient colors={['rgba(30,30,36,0.98)', theme.softStrong]} style={styles.dropdownOptions}>
              {categoryOptions.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.optionItem, selectedCategory === cat && { backgroundColor: theme.soft }]}
                  onPress={() => { setSelectedCategory(cat); setIsCategoryOpen(false); }}
                >
                  {selectedCategory === cat && <Ionicons name="checkmark" size={14} color={theme.primary} />}
                  <Text style={[styles.optionText, selectedCategory === cat && { color: theme.primary }]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </LinearGradient>
          )}
        </View>

        {/* ── Budget ── */}
        <Text style={styles.sectionTitle}>Budget</Text>
        <View style={styles.budgetInputContainer}>
          <TextInput
            style={styles.budgetInput}
            placeholder="₹1000-5000"
            placeholderTextColor="#555"
            value={budget}
            onChangeText={setBudget}
            keyboardType="numeric"
          />
        </View>

        {/* ── Boost Duration ── */}
        <LinearGradient colors={['#1A1A1A', '#0D0D0D']} style={styles.boostCard}>
          <View style={styles.boostHeader}>
            <View style={[styles.boostIconContainer, { backgroundColor: theme.soft }]}>
              <Ionicons name="flash" size={14} color={theme.primary} />
            </View>
            <View>
              <Text style={styles.boostTitle}>Boost Duration</Text>
              <Text style={styles.boostSubtitle}>How long should your post stay live?</Text>
            </View>
          </View>

          <View style={styles.durationRow}>
            {[
              { h: 4, label: '4 hr', sub: 'Quick boost', icon: 'rocket' },
              { h: 12, label: '12 hr', sub: 'Half day', icon: 'sunny' },
              { h: 24, label: '24 hr', sub: 'Full day', icon: 'sunny-outline' },
              { h: 48, label: '48 hr', sub: 'Extended reach', icon: 'flame' },
            ].map(item => {
              const active = boostDuration === item.h;
              return (
                <TouchableOpacity
                  key={item.h}
                  onPress={() => setBoostDuration(item.h)}
                  style={[styles.durationPill, active && { backgroundColor: theme.primary, borderColor: theme.hover }]}
                >
                  <Ionicons name={item.icon as any} size={18} color={active ? '#fff' : '#888'} />
                  <Text style={[styles.durationText, active && { color: '#fff' }]}>{item.label}</Text>
                  <Text style={[styles.durationSub, active && { color: 'rgba(255,255,255,0.7)' }]}>{item.sub}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.sliderContainer}>
            <View style={styles.sliderLine}>
              <View style={[styles.sliderFill, { width: `${(boostDuration / 48) * 100}%`, backgroundColor: theme.primary }]} />
              <View style={[styles.sliderThumb, { left: `${(boostDuration / 48) * 100}%`, borderColor: theme.primary }]} />
            </View>
          </View>

          <View style={styles.boostFooter}>
            <View>
              <Text style={styles.footerLabel}>Active for</Text>
              <Text style={styles.footerValue}>{boostDuration} hours</Text>
            </View>
            <View style={styles.endsAtPill}>
              <Text style={styles.endsAtLabel}>Ends at</Text>
              <Text style={styles.endsAtValue}>{formatTimeEndsAt(boostDuration)}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Post + Draft buttons (inside scroll so nothing is hidden) ── */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.postBtn, { backgroundColor: theme.primary }, submitting && styles.postBtnDisabled]}
            onPress={handlePost}
            disabled={submitting}
          >
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.postBtnText}>Post</Text>
            }
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.draftBtn, { borderColor: theme.primary }]}
            onPress={saveDraft}
            disabled={submitting}
          >
            <Text style={[styles.draftBtnText, { color: theme.primary }]}>Save as Draft</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#060606' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    gap: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E1E24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '600' },

  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },

  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  roleText: { fontSize: 12, fontFamily: 'Poppins_500Medium' },

  inputCard: {
    backgroundColor: '#1E1E24',
    borderRadius: 16,
    padding: 20,
    minHeight: 260,
    marginBottom: 16,
  },
  titleInput: { color: '#fff', fontSize: 20, fontWeight: '600', marginBottom: 4 },
  bodyInput: { flex: 1, color: '#E0E0E0', fontSize: 15, minHeight: 100 },
  mediaActions: { flexDirection: 'row', marginTop: 16, gap: 16 },
  mediaIconBtn: { opacity: 0.9 },

  listBtn: {
    backgroundColor: '#1E1E24',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  listBtnLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  listBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Poppins_400Regular', flexShrink: 1 },

  inlineInput: {
    backgroundColor: '#1E1E24',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 14,
    marginBottom: 12,
    marginTop: -4,
    borderWidth: 1,
  },

  dropdownContainer: { marginBottom: 4 },
  dropdownOptions: {
    borderRadius: 14,
    marginTop: -4,
    marginBottom: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  optionText: { color: '#fff', fontSize: 14, fontFamily: 'Poppins_400Regular' },

  sectionTitle: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    marginTop: 8,
    marginBottom: 10,
    opacity: 0.8,
  },

  budgetInputContainer: {
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 16,
  },
  budgetInput: { color: '#fff', fontSize: 14, fontFamily: 'Poppins_400Regular', paddingVertical: 10 },

  boostCard: { borderRadius: 20, borderWidth: 1, borderColor: '#2A2A2A', padding: 20, marginBottom: 24 },
  boostHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  boostIconContainer: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  boostTitle: { color: '#fff', fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  boostSubtitle: { color: '#888', fontSize: 11, fontFamily: 'Poppins_400Regular' },

  durationRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  durationPill: {
    width: '23%', backgroundColor: '#121212',
    borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12,
    paddingVertical: 12, alignItems: 'center', justifyContent: 'center',
  },
  durationText: { color: '#888', fontSize: 12, fontFamily: 'Poppins_600SemiBold', marginTop: 4 },
  durationSub: { color: '#555', fontSize: 8, fontFamily: 'Poppins_400Regular', marginTop: 2 },

  sliderContainer: { marginVertical: 8 },
  sliderLine: { height: 4, backgroundColor: '#333', borderRadius: 2, position: 'relative' },
  sliderFill: { height: '100%', borderRadius: 2 },
  sliderThumb: {
    position: 'absolute', top: -6, width: 16, height: 16,
    borderRadius: 8, backgroundColor: '#fff', borderWidth: 3,
    transform: [{ translateX: -8 }],
  },

  boostFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  footerLabel: { color: '#888', fontSize: 11, fontFamily: 'Poppins_400Regular' },
  footerValue: { color: '#fff', fontSize: 18, fontFamily: 'Poppins_700Bold' },
  endsAtPill: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' },
  endsAtLabel: { color: '#888', fontSize: 10, fontFamily: 'Poppins_400Regular' },
  endsAtValue: { color: '#fff', fontSize: 14, fontFamily: 'Poppins_600SemiBold' },

  actionButtons: { gap: 12, marginTop: 8 },
  postBtn: { borderRadius: 30, alignItems: 'center', justifyContent: 'center', paddingVertical: 17 },
  postBtnDisabled: { opacity: 0.6 },
  postBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Poppins_500Medium' },
  draftBtn: {
    borderRadius: 30, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', paddingVertical: 17,
  },
  draftBtnText: { fontSize: 16, fontFamily: 'Poppins_500Medium' },
});
