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
import { createPost, getFullProfile } from '../services/userService';
import { useRoleTheme } from '../theme/useRoleTheme';

const DRAFT_KEY = '@digitag_post_draft';

type CollabChoice = 'UNPAID' | 'PAID';

export default function CreatePost() {
  const router = useRouter();
  const { token } = useAuth();
  const { requireProfile } = useProfileGate();
  const theme = useRoleTheme();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [location, setLocation] = useState('');
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [collab, setCollab] = useState<CollabChoice | null>(null);
  const [isCollabOpen, setIsCollabOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [profileCategories, setProfileCategories] = useState<string[]>([]);
  const [budget, setBudget] = useState('');
  const [isMonthly, setIsMonthly] = useState(false);
  const [boostDuration, setBoostDuration] = useState(4);
  const [submitting, setSubmitting] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  useEffect(() => {
    if (token) {
      getFullProfile(token).then(res => {
        if (res.success && res.data?.profile) {
          const cats: string[] = res.data.profile.categories ?? [];
          setProfileCategories(cats);
        }
      });
    }
  }, [token]);

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
                  setDraftRestored(true);
                }
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
    Alert.alert('Draft Saved', 'Your draft has been saved and will be restored next time you open this screen.');
  };

  const collabLabel = collab === 'PAID' ? 'Paid Collab' : collab === 'UNPAID' ? 'Free Collab' : 'What do you want from creator';
  const categoryLabel = selectedCategory ?? 'Select Category';

  const handlePost = async () => {
    if (!requireProfile('create a post')) return;
    if (!token) {
      Alert.alert('Sign In Required', 'Please sign in to post.');
      return;
    }

    const description = [title.trim(), body.trim()].filter(Boolean).join('\n\n');
    if (!description) {
      Alert.alert('Missing Content', 'Add a title or body before posting.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await createPost(
        {
          description,
          location: location.trim() || undefined,
          collaborationType: collab ?? 'UNPAID',
          category: selectedCategory || undefined,
        },
        token,
      );
      if (res.success) {
        await AsyncStorage.removeItem(DRAFT_KEY);
        Alert.alert('Posted!', 'Your post is now live.', [
          { text: 'OK', onPress: () => router.replace('/(tabs)') },
        ]);
      } else {
        Alert.alert('Post Failed', res.error || 'Something went wrong.');
      }
    } catch (e: any) {
      Alert.alert('Network Error', e.message || 'Could not reach the server.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDraft = () => saveDraft();

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
        <Text style={styles.headerTitle}>Create a post</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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
            <TouchableOpacity
              style={styles.mediaIconBtn}
              onPress={() => Alert.alert('Coming Soon', 'Image uploads are not yet wired up.')}
            >
              <Ionicons name="image-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.mediaIconBtn}
              onPress={() => Alert.alert('Coming Soon', 'Video uploads are not yet wired up.')}
            >
              <Feather name="youtube" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Location input */}
        <TouchableOpacity
          style={[styles.listBtn, isLocationOpen && styles.listBtnActive]}
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
            style={styles.inlineInput}
            placeholder="e.g. Mumbai, IN"
            placeholderTextColor="#555"
            value={location}
            onChangeText={setLocation}
            maxLength={120}
          />
        )}

        {/* Collab type dropdown */}
        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={[styles.listBtn, isCollabOpen && styles.listBtnActive]}
            onPress={() => setIsCollabOpen(v => !v)}
          >
            <View style={styles.listBtnLeft}>
              <Text style={styles.listBtnText}>{collabLabel}</Text>
            </View>
            <Ionicons name={isCollabOpen ? 'chevron-up' : 'chevron-forward'} size={20} color="#fff" />
          </TouchableOpacity>

          {isCollabOpen && (
            <LinearGradient
              colors={['rgba(30, 30, 36, 0.95)', theme.softStrong]}
              style={styles.dropdownOptions}
            >
              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => {
                  setCollab('PAID');
                  setIsCollabOpen(false);
                }}
              >
                <Text style={styles.optionText}>Paid Collab</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => {
                  setCollab('UNPAID');
                  setIsCollabOpen(false);
                }}
              >
                <Text style={styles.optionText}>Free Collab</Text>
              </TouchableOpacity>
            </LinearGradient>
          )}
        </View>

        {/* Category dropdown — only visible when profile categories are loaded */}
        {profileCategories.length > 0 && (
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={[styles.listBtn, isCategoryOpen && styles.listBtnActive]}
              onPress={() => setIsCategoryOpen(v => !v)}
            >
              <View style={styles.listBtnLeft}>
                <Text style={styles.listBtnText}>{categoryLabel}</Text>
              </View>
              <Ionicons name={isCategoryOpen ? 'chevron-up' : 'chevron-forward'} size={20} color="#fff" />
            </TouchableOpacity>

            {isCategoryOpen && (
              <LinearGradient
                colors={['rgba(30, 30, 36, 0.95)', theme.softStrong]}
                style={styles.dropdownOptions}
              >
                {profileCategories.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={styles.optionItem}
                    onPress={() => {
                      setSelectedCategory(cat);
                      setIsCategoryOpen(false);
                    }}
                  >
                    <Text style={styles.optionText}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </LinearGradient>
            )}
          </View>
        )}

        {/* ── BUDGET INPUT ── */}
        <Text style={styles.sectionTitle}>Budget *</Text>
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

        {/* ── READY TO COLLAB ── */}
        <Text style={styles.sectionTitle}>Ready to collab with Brand</Text>
        <TouchableOpacity 
          style={styles.checkboxRow} 
          activeOpacity={0.7}
          onPress={() => setIsMonthly(v => !v)}
        >
          <View style={[styles.checkbox, isMonthly && styles.checkboxActive]}>
            {isMonthly && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={styles.checkboxLabel}>Monthly</Text>
        </TouchableOpacity>

        {/* ── BOOST DURATION CARD ── */}
        <LinearGradient
          colors={['#1A1A1A', '#0D0D0D']}
          style={styles.boostCard}
        >
          <View style={styles.boostHeader}>
            <View style={styles.boostIconContainer}>
              <Ionicons name="flash" size={14} color="#7C3AED" />
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
                  style={[styles.durationPill, active && styles.durationPillActive]}
                >
                  <Ionicons name={item.icon as any} size={18} color={active ? '#fff' : '#888'} />
                  <Text style={[styles.durationText, active && styles.durationTextActive]}>{item.label}</Text>
                  <Text style={[styles.durationSub, active && styles.durationSubActive]}>{item.sub}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.sliderContainer}>
            <View style={styles.sliderLine}>
              <View style={[styles.sliderFill, { width: `${(boostDuration / 48) * 100}%` }]} />
              <View style={[styles.sliderThumb, { left: `${(boostDuration / 48) * 100}%` }]} />
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
      </ScrollView>

      <View style={styles.bottomActions}>
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
        <TouchableOpacity style={[styles.draftBtn, { borderColor: theme.primary }]} onPress={handleDraft} disabled={submitting}>
          <Text style={[styles.draftBtnText, { color: theme.primary }]}>Save as Draft</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#060606',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    gap: 20,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E1E24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '500',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  inputCard: {
    backgroundColor: '#1E1E24',
    borderRadius: 16,
    padding: 20,
    minHeight: 280,
    marginBottom: 20,
  },
  titleInput: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  bodyInput: {
    flex: 1,
    color: '#E0E0E0',
    fontSize: 16,
    minHeight: 120,
  },
  mediaActions: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 16,
  },
  mediaIconBtn: {
    opacity: 0.9,
  },
  listBtn: {
    backgroundColor: '#1E1E24',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  listBtnActive: {
    borderColor: '#2196F3',
  },
  listBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  inlineInput: {
    backgroundColor: '#1E1E24',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    color: '#fff',
    fontSize: 15,
    marginBottom: 16,
    marginTop: -8,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  bottomActions: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 100,
  },
  postBtn: {
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    marginBottom: 16,
  },
  postBtnDisabled: {
    opacity: 0.6,
  },
  postBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
  },
  draftBtn: {
    backgroundColor: 'transparent',
    borderRadius: 30,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  draftBtnText: {
    fontSize: 16,
    fontWeight: '400',
  },
  dropdownContainer: {
    marginBottom: 16,
  },
  dropdownOptions: {
    borderRadius: 16,
    marginTop: -8,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 10,
    overflow: 'hidden',
  },
  optionItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  optionText: {
    color: '#fff',
    fontSize: 15,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins_400Medium',
    marginTop: 14,
    marginBottom: 14,
  },
  budgetInputContainer: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  budgetInput: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  checkboxLabel: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
  },
  boostCard: {
    marginTop: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    padding: 20,
  },
  boostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  boostIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  boostTitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  boostSubtitle: {
    color: '#888',
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  durationPill: {
    width: '23%',
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationPillActive: {
    backgroundColor: '#A855F7',
    borderColor: '#C084FC',
  },
  durationText: {
    color: '#888',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 4,
  },
  durationTextActive: {
    color: '#fff',
  },
  durationSub: {
    color: '#555',
    fontSize: 8,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  durationSubActive: {
    color: 'rgba(255,255,255,0.7)',
  },
  sliderContainer: {
    marginVertical: 12,
  },
  sliderLine: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#A855F7',
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#A855F7',
    transform: [{ translateX: -8 }],
  },
  boostFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  footerLabel: {
    color: '#888',
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
  },
  footerValue: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
  },
  endsAtPill: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  endsAtLabel: {
    color: '#888',
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
  },
  endsAtValue: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
});
