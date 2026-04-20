import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
import { useProfileGate } from '../context/useProfileGate';
import { createPost } from '../services/userService';

type CollabChoice = 'UNPAID' | 'PAID';

export default function CreatePost() {
  const router = useRouter();
  const { token } = useAuth();
  const { requireProfile } = useProfileGate();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [location, setLocation] = useState('');
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [collab, setCollab] = useState<CollabChoice | null>(null);
  const [isCollabOpen, setIsCollabOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const collabLabel = collab === 'PAID' ? 'Paid Collab' : collab === 'UNPAID' ? 'Free Collab' : 'What do you want from creator';

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
        },
        token,
      );
      if (res.success) {
        Alert.alert('Posted 🎉', 'Your post is now live.', [
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

  const handleDraft = () => {
    Alert.alert('Drafts', 'Saving drafts locally is not yet implemented.');
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
              colors={['rgba(30, 30, 36, 0.95)', 'rgba(224, 47, 142, 0.45)']}
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
      </ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[styles.postBtn, submitting && styles.postBtnDisabled]}
          onPress={handlePost}
          disabled={submitting}
        >
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.postBtnText}>Post</Text>
          }
        </TouchableOpacity>
        <TouchableOpacity style={styles.draftBtn} onPress={handleDraft} disabled={submitting}>
          <Text style={styles.draftBtnText}>Save as Draft</Text>
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
    backgroundColor: '#e02f8eff',
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
    borderColor: '#e02f8eff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  draftBtnText: {
    color: '#e02f8eff',
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
});
