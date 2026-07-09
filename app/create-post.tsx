import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
 import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
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
import { useLocationSuggestions } from '../hooks/useLocationSuggestions';
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
  const { requireProfile, isProfileCompleted } = useProfileGate();
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
  const { suggestions: locationSuggestions } = useLocationSuggestions(location);
  const [collab, setCollab] = useState<CollabChoice | null>(null);
  const [isCollabOpen, setIsCollabOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [budget, setBudget] = useState('');
  // null = user's choice not to boost — the post stays visible forever.
  const [boostDuration, setBoostDuration] = useState<number | null>(null);
  const [instantRequirement, setInstantRequirement] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Popup state
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupType, setPopupType] = useState<'success' | 'error'>('success');
  const [popupMessage, setPopupMessage] = useState('');

  useEffect(() => {
    if (!isProfileCompleted) {
      requireProfile('create a post');
      router.back();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProfileCompleted]);

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

  // Silent debounced autosave — if the OS kills the app while the user is away
  // (e.g. switched apps to grab a reference photo), the manual "Save Draft"
  // button alone wouldn't have caught it, so persist on every change too.
  useEffect(() => {
    if (!title.trim() && !body.trim()) return;
    const t = setTimeout(() => {
      AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ title, body, location, collab, category: selectedCategory })).catch(() => {});
    }, 500);
    return () => clearTimeout(t);
  }, [title, body, location, collab, selectedCategory]);

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
        {
          description,
          location: location.trim() || undefined,
          collaborationType: collab ?? 'UNPAID',
          category: selectedCategory || undefined,
          budget: budget.trim() || undefined,
          boostHours: (boostDuration ?? undefined) as 4 | 12 | 24 | 48 | undefined,
        },
        token,
      );
      if (res.success) {
        await AsyncStorage.removeItem(DRAFT_KEY);
        setPopupType('success');
        setPopupMessage('Your post is now live.');
        setPopupVisible(true);
      } else {
        setPopupType('error');
        setPopupMessage(res.error || 'Something went wrong.');
        setPopupVisible(true);
      }
    } catch (e: any) {
      setPopupType('error');
      setPopupMessage(e.message || 'Could not reach the server.');
      setPopupVisible(true);
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
          {/* <Ionicons name="chevron-back" size={20} color="#fff" /> */}
          <Image source={require('../assets/backicon.png')} style={styles.backBtn} />
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
            placeholderTextColor="#fffafaff"
            value={title}
            onChangeText={setTitle}
            maxLength={120}
          />
          <TextInput
            style={styles.bodyInput}
            placeholder="Body Text (Optional)"
            placeholderTextColor="#d6d6d6"
            value={body}
            onChangeText={setBody}
            multiline
            textAlignVertical="top"
            maxLength={1800}
          />
        </View>

        {/* ── Location ── */}
        <TouchableOpacity
          style={[styles.listBtn, isLocationOpen && { borderColor: theme.primary }]}
          onPress={() => setIsLocationOpen(v => !v)}
        >
          <View style={styles.listBtnLeft}>
            {/* <Ionicons name="location-outline" size={20} color="#fff" /> */}
            <Image
              source={require('../assets/location.png')}
              style={{ width: 20, height: 20 }}
            />
            <Text style={[styles.listBtnText, { marginLeft: 12 }]}>
              {location.trim() ? location : 'Add Location'}
            </Text>
          </View>
          <Ionicons name={isLocationOpen ? 'chevron-up' : 'chevron-forward'} size={20} color="#fff" />
        </TouchableOpacity>
        {isLocationOpen && (
          <>
            <TextInput
              style={[styles.inlineInput, { borderColor: theme.primary }]}
              placeholder="e.g. Mumbai, IN"
              placeholderTextColor="#555"
              value={location}
              onChangeText={setLocation}
              maxLength={120}
            />
            {locationSuggestions.length > 0 && (
              <LinearGradient colors={['rgba(30,30,36,0.98)', theme.softStrong]} style={styles.dropdownOptions}>
                {locationSuggestions.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.optionItem}
                    onPress={() => { setLocation(s.label); setIsLocationOpen(false); }}
                  >
                    <Ionicons name="location-outline" size={16} color={theme.primary} />
                    <Text style={styles.optionText} numberOfLines={1}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </LinearGradient>
            )}
          </>
        )}

        {/* ── Collab Type ── */}
        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={[styles.listBtn, isCollabOpen && { borderColor: theme.primary }]}
            onPress={() => setIsCollabOpen(v => !v)}
          >
            <View style={styles.listBtnLeft}>
              {/* <Ionicons name="people-outline" size={20} color="#fff" /> */}
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
                <TouchableOpacity key={opt.value} style={styles.optionItem} onPress={() => { setCollab(opt.value); if (opt.value === 'UNPAID') setBudget(''); setIsCollabOpen(false); }}>
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

        {/* ── Budget (Paid Collab only) ── */}
        {collab === 'PAID' && (
          <>
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
          </>
        )}

        {/* ── Boost Duration (Creator only) ── */}
        {isCreator && (
        <View style={styles.boostCard}>
          {/* Background Blobs (Clipped to card shape) */}
          <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', borderRadius: 24 }]}>
            <View style={styles.blob1} />
            <View style={styles.blob2} />
          </View>
          
          <View style={styles.boostHeader}>
            <View style={styles.boostIconContainer}>
              {/* <Ionicons name="flash" size={18} color="#9632FF" /> */}
              <Image 
                source={require('../assets/spark.gif')} 
                style={{ width: 34, height: 34 }} 
              />
            </View>
            <View>
              <Text style={styles.boostTitle}>Boost Duration</Text>
              <Text style={styles.boostSubtitle}>How long should your post stay live?</Text>
            </View>
          </View>

          <View style={styles.durationRow}>
            {[
              { h: 4, label: '4 hr', sub: 'Quick boost', icon: '🚀' },
              { h: 12, label: '12 hr', sub: 'Half day', icon: '☀️' },
              { h: 24, label: '24 hr', sub: 'Full day', icon: '🌕' },
              { h: 48, label: '48 hr', sub: 'Extended reach', icon: '🔥' },
            ].map(item => {
              const active = boostDuration === item.h;
              return (
                <TouchableOpacity
                  key={item.h}
                  onPress={() => setBoostDuration(active ? null : item.h)}
                  style={[styles.durationPill, active && styles.activeDurationPill]}
                >
                  {active ? (
                    <LinearGradient
                      colors={['#CC00FF', '#7000FF']}
                      style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                    />
                  ) : null}
                  <Text style={styles.durationIcon}>{item.icon}</Text>
                  <Text style={[styles.durationText, active && styles.activeDurationText]}>{item.label}</Text>
                  <Text style={[styles.durationSub, active && styles.activeDurationSub]}>{item.sub}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {boostDuration === null ? (
            <View style={styles.boostFooter}>
              <Text style={styles.footerLabel}>No duration selected — this post will stay visible forever until you delete it.</Text>
            </View>
          ) : (
            <>
              <View style={styles.sliderContainer}>
                <View style={styles.sliderLine}>
                  <LinearGradient
                    colors={['#CC00FF', '#7000FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.sliderFill, { width: `${(boostDuration / 48) * 100}%` }]}
                  />
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
            </>
          )}

          {/* ── Instant Requirement Checkbox (Commented out as requested) ── */}
          {/* <TouchableOpacity 
            style={styles.requirementContainer} 
            onPress={() => setInstantRequirement(!instantRequirement)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, instantRequirement && styles.checkboxActive]}>
              {instantRequirement && <Ionicons name="checkmark" size={16} color="#000" />}
            </View>
            <Text style={styles.requirementText}>Instant Requirement</Text>
          </TouchableOpacity> */}
        </View>
        )}

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

      {/* ── Custom Success/Error Popup ── */}
      <Modal
        visible={popupVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPopupVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconCircle}>
              {popupType === 'success' ? (
                <>
                   
                  <Image 
                    source={require('../assets/images/success.gif')} 
                    style={{ width: 60, height: 60 }} 
                  />
                </>
              ) : (
                <Ionicons name="alert-circle" size={44} color="#FF4D4D" />
              )}
            </View>
            
            <Text style={styles.modalTitle}>
              {popupType === 'success' ? 'Collab Sent!' : 'Failed'}
            </Text>
            
            <Text style={styles.modalMessage}>{popupMessage}</Text>
            
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => {
                setPopupVisible(false);
                if (popupType === 'success') {
                  router.replace('/(tabs)');
                }
              }}
            >
              <LinearGradient
                colors={popupType === 'success' ? [theme.primary, theme.primary + 'CC'] : ['#FF4D4D', '#FF8080']}
                style={styles.modalButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.modalButtonText}>OK</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    marginBottom: 10,
  },
  titleInput: { color: '#fff', fontSize: 20, fontWeight: '600',  },
  bodyInput: {  color: '#E0E0E0', fontSize: 15, minHeight: 100 },
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

  boostCard: {
    width: 370,
    height: 313,
    alignSelf: 'center',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(150, 50, 255, 0.2)', // Subtle purple border
    padding: 15,
    
    marginVertical: 16,
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: '#14141a', // Slightly darker background
  },
  blob1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(100, 50, 255, 0.08)', // More subtle purple/blue
  },
  blob2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 50, 255, 0.05)', // Very subtle magenta
  },
  boostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  boostIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#27272a',
  },
  boostTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
  },
  boostSubtitle: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },

  durationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  durationPill: {
    width: 78,
    height: 72,
    backgroundColor: '#24242e',
    borderWidth: 1,
    borderColor: '#404052',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDurationPill: {
    borderColor: 'transparent',
    // box-shadow: 0 4px 16px 0 rgba(142, 68, 255, 0.60);
    shadowColor: '#8E44FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8, // For Android
  },
  durationIcon: {
    fontSize: 16,
    marginBottom: 6,
  },
  durationText: {
    color: '#fffefeff',
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
  },
  durationSub: {
    color: '#808099',
    fontSize: 8,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  activeDurationText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    
  },
  activeDurationSub: {
    color: 'rgba(255,255,255,0.8)',
  },

  sliderContainer: {
    marginVertical: 12,
    marginBottom: 20,
  },
  sliderLine: {
    height: 6,
    backgroundColor: '#1A1A24',
    borderRadius: 3,
    position: 'relative',
    justifyContent: 'center',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 0,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
    transform: [{ translateX: -10 }],
  },

  boostFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
     
    marginBottom: 20,
  },
  footerLabel: {
    color: '#808099',
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    marginBottom: 4,
  },
  footerValue: {
    color: '#fff',
    fontSize: 20, // Decreased from 28 
    fontFamily: 'Poppins_700Bold',
  },
  endsAtPill: {
    backgroundColor: '#292933',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    
    borderWidth: 1,
    borderColor: '#4d4d61',
  },
  endsAtLabel: {
    color: '#808099',
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    
  },
  endsAtValue: {
    color: '#fff',
    fontSize: 14,

    fontFamily: 'Poppins_600SemiBold',
  },

  requirementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  requirementText: {
    color: '#E0E0E0',
    fontSize: 17,
    fontFamily: 'Poppins_500Medium',
  },

  actionButtons: { gap: 12, marginTop: 8 },
  postBtn: { borderRadius: 30, alignItems: 'center', justifyContent: 'center', paddingVertical: 17 },
  postBtnDisabled: { opacity: 0.6 },
  postBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Poppins_500Medium' },
  draftBtn: {
    borderRadius: 30, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', paddingVertical: 17,
  },
  draftBtnText: { fontSize: 16, fontFamily: 'Poppins_500Medium' },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#1C1C24',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 30,
    alignItems: 'center',
  },
  modalIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#272730',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalMessage: {
    color: '#A0A0AB',
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  modalButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  modalButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
});
