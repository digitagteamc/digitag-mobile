import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function CreatePost() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [collabType, setCollabType] = useState('What do you want from creator');
  const [isCollabOpen, setIsCollabOpen] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create a post</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Input Card */}
        <View style={styles.inputCard}>
          <TextInput
            style={styles.titleInput}
            placeholder="Title"
            placeholderTextColor="#A1A1A1"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={styles.bodyInput}
            placeholder="Body Text (Optional)"
            placeholderTextColor="#7A7A7A"
            value={body}
            onChangeText={setBody}
            multiline
            textAlignVertical="top"
          />
          {/* Media Actions */}
          <View style={styles.mediaActions}>
            <TouchableOpacity style={styles.mediaIconBtn}>
              <Ionicons name="image-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.mediaIconBtn}>
              <Feather name="youtube" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* List Buttons */}
        <TouchableOpacity style={styles.listBtn}>
          <View style={styles.listBtnLeft}>
            <Ionicons name="location-outline" size={20} color="#fff" />
            <Text style={[styles.listBtnText, { marginLeft: 12 }]}>Add Location</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={[styles.listBtn, isCollabOpen && styles.listBtnActive]}
            onPress={() => setIsCollabOpen(!isCollabOpen)}
          >
            <View style={styles.listBtnLeft}>
              <Text style={styles.listBtnText}>{collabType}</Text>
            </View>
            <Ionicons name={isCollabOpen ? "chevron-up" : "chevron-forward"} size={20} color="#fff" />
          </TouchableOpacity>

          {isCollabOpen && (
            <LinearGradient
              colors={['rgba(30, 30, 36, 0.95)', 'rgba(224, 47, 142, 0.45)']}
              style={styles.dropdownOptions}
            >
              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => {
                  setCollabType('Paid Collab');
                  setIsCollabOpen(false);
                }}
              >
                <Text style={styles.optionText}>Paid Collab</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => {
                  setCollabType('Free Collab');
                  setIsCollabOpen(false);
                }}
              >
                <Text style={styles.optionText}>Free Collab</Text>
              </TouchableOpacity>
            </LinearGradient>
          )}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.postBtn}>
          <Text style={styles.postBtnText}>Post</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.draftBtn}>
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
    fontFamily: 'Poppins ',
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
    fontFamily: 'Poppins-SemiBold',
    fontWeight: '600',
    marginBottom: 4,
  },
  bodyInput: {
    flex: 1,
    color: '#E0E0E0',
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
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
    fontFamily: 'Poppins',
    fontWeight: '500',
  },
  bottomActions: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 100, // Lifts the buttons up and adds space at the bottom
  },
  postBtn: {
    backgroundColor: '#e02f8eff',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    marginBottom: 16,
  },
  postBtnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins ',
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
    fontFamily: 'Poppins ',
    fontWeight: '400',
  },
  dropdownContainer: {
    marginBottom: 16,
    fontFamily: 'Poppins ',
    fontWeight: '400',

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
    fontFamily: 'Poppins-Regular',
  },
});