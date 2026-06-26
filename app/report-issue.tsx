import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type IssueType = 'bug' | 'performance' | 'ui' | 'account';
type Severity = 'low' | 'medium' | 'high';

const ISSUE_TYPES: { id: IssueType; icon: any; title: string; subtitle: string }[] = [
  { id: 'bug', icon: require('../assets/bug-icon.png'), title: 'Bug / Error', subtitle: 'App crashes or behaves unexpectedly' },
  { id: 'performance', icon: require('../assets/performance-icon.png'), title: 'Performance', subtitle: 'Slow loading or laggy experience' },
  { id: 'ui', icon: require('../assets/UI-icon.png'), title: 'UI / Design', subtitle: 'Visual glitch or layout issue' },
  { id: 'account', icon: require('../assets/account-icon.png'), title: 'Account / Auth', subtitle: 'Login, sign-up or access problem' },
];

export default function ReportIssueScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

  const [selectedIssue, setSelectedIssue] = useState<IssueType>('bug');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<Severity>('high');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Missing Info', 'Please describe the issue before submitting.');
      return;
    }
    setIsSubmitting(true);
    // Simulate submission
    await new Promise(res => setTimeout(res, 1200));
    setIsSubmitting(false);
    Alert.alert('Report Submitted', 'Thank you! Our team will look into this issue shortly.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  const severityConfig = {
    low:    { label: 'Low',    bg: '#0E4F4F', border: '#0D9488', text: '#2DD4BF' },
    medium: { label: 'Medium', bg: '#4A3200', border: '#B45309', text: '#F59E0B' },
    high:   { label: 'High',   bg: '#4C0519', border: '#E11D48', text: '#FB7185' },
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#060606' }}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
        {/* ── HEADER ── */}
        <View style={{
          paddingHorizontal: 20,
          paddingBottom: 4,
          paddingTop: Math.max(insets.top, statusBarHeight) + 16,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12, padding: 2 }}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={{ color: '#fff', fontSize: 24, fontFamily: 'Poppins_500Medium' }}>
              Report an Issue
            </Text>
          </View>
          <Text style={{ color: '#E2E2E2', fontSize: 12, fontFamily: 'Poppins_400Regular', marginLeft: 4 }}>
            Help us improve Digitag by sharing what went wrong.
          </Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── ISSUE TYPE ── */}
          <Text style={{ color: '#fff', fontSize: 14, fontFamily: 'Poppins_400Regular', marginBottom: 12 }}>
            Issue Type
          </Text>
          <View style={{ gap: 10, marginBottom: 28 }}>
            {ISSUE_TYPES.map(item => {
              const isSelected = selectedIssue === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  onPress={() => setSelectedIssue(item.id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#1A1A1A',
                    borderWidth: 1,
                    borderColor: isSelected ? '#3A3A3A' : '#2A2A2A',
                    borderRadius: 20,
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                  }}
                >
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#1E1E1E',
                     
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 14,
                  }}>
                    <Image 
                      source={item.icon} 
                      style={{ width: 38, height: 38 }} 
                      resizeMode="contain" 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#fff', fontSize: 14, fontFamily: 'Poppins_400Regular', marginBottom: 1 }}>
                      {item.title}
                    </Text>
                    <Text style={{ color: '#D6D6D6', fontSize: 10, fontFamily: 'Poppins_400Regular' }}>
                      {item.subtitle}
                    </Text>
                  </View>
                  {/* Radio button */}
                  <View style={{
                    width: 18,
                    height: 18,
                    borderRadius: 18,
                    borderWidth: 2,
                    borderColor: isSelected ? '#F026A2' : '#3A3A3A',
                    backgroundColor: isSelected ? '#F026A2' : 'transparent',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    {isSelected && (
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── DESCRIBE THE ISSUE ── */}
          <Text style={{ color: '#fff', fontSize: 14, fontFamily: 'Poppins_400Regular', marginBottom: 6 }}>
            Describe The Issue
          </Text>
          <View style={{
            backgroundColor: '#1A1A1A',
            borderWidth: 1,
            borderColor: '#2A2A2A',
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: 10,
            marginBottom: 28,
            minHeight: 148,
          }}>
            <TextInput
              value={description}
              onChangeText={t => setDescription(t.slice(0, 500))}
              placeholder="Tell us what happened in detail..."
              placeholderTextColor="#444"
              multiline
              textAlignVertical="top"
              style={{
                color: '#E0E0E0',
                fontSize: 14,
                fontFamily: 'Poppins_400Regular',
                flex: 1,
                minHeight: 110,
                lineHeight: 22,
              }}
            />
            <Text style={{ color: '#555', fontSize: 12, textAlign: 'right', fontFamily: 'Poppins_400Regular', marginTop: 6 }}>
              {description.length}/500
            </Text>
          </View>

          {/* ── SCREENSHOT ── */}
          <Text style={{ color: '#fff', fontSize: 14, fontFamily: 'Poppins_400Regular', marginBottom: 6 }}>
            Screenshot
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            style={{
              width: '100%',
              height: 90,
              backgroundColor: '#1A1A1A',
              borderWidth: 1,
              borderColor: '#404040',
              borderStyle: 'dashed',
              borderRadius: 20,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              marginBottom: 8,
            }}
          >
            <MaterialCommunityIcons name="upload-outline" size={24} color="#D0D0D0" style={{ marginLeft: 10 }} />
            <Text style={{ color: '#D6D6D6', fontSize: 14, fontFamily: 'Poppins_500Medium' }}>
              Upload Screenshot
            </Text>
          </TouchableOpacity>
          <Text style={{ color: '#555', fontSize: 12, fontFamily: 'Poppins_400Regular', marginBottom: 28 }}>
            Note: PNG/JPG up to 5MB
          </Text>

          {/* ── SEVERITY ── */}
          <Text style={{ color: '#fff', fontSize: 14, fontFamily: 'Poppins_400Regular', marginBottom: 10 }}>
            Severity
          </Text>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 40 }}>
            {(['low', 'medium', 'high'] as Severity[]).map(s => {
              const cfg = severityConfig[s];
              const isSelected = severity === s;
              return (
                <TouchableOpacity
                  key={s}
                  activeOpacity={0.8}
                  onPress={() => setSeverity(s)}
                  style={{
                    paddingHorizontal: 22,
                    paddingVertical: 6,
                    borderRadius: 30,
                    backgroundColor: isSelected ? cfg.bg : '#131313',
                    borderWidth: 1.5,
                    borderColor: isSelected ? cfg.border : '#2A2A2A',
                  }}
                >
                  <Text style={{
                    color: isSelected ? cfg.text : '#666',
                    fontSize: 13,
                    fontFamily: 'Poppins_600SemiBold',
                  }}>
                    {cfg.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── SUBMIT BUTTON ── */}
          <TouchableOpacity onPress={handleSubmit} activeOpacity={0.85} disabled={isSubmitting}>
            <LinearGradient
              colors={['#7C3AED', '#6D28D9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                height: 58,
                borderRadius: 30,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#7C3AED',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.4,
                shadowRadius: 16,
                elevation: 10,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 18, fontFamily: 'Poppins_500Medium' }}>
                {isSubmitting ? 'Submitting…' : 'Submit Report'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
