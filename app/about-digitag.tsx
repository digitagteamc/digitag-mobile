import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const FEATURES = [
  {
    id: 1,
    icon: 'people-outline' as const,
    title: 'Connect with Professionals',
    description: 'Network with agencies, creators, and brands in the digital marketing space',
  },
  {
    id: 2,
    icon: 'document-text-outline' as const,
    title: 'Post Requirements',
    description: 'Create and share your collaboration needs with the right audience',
  },
  {
    id: 3,
    icon: 'settings-outline' as const,
    title: 'Real-time Updates',
    description: 'Stay updated with instant notifications and live chat features',
  },
];

export default function AboutDigitagScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      {/* Top purple glow gradient */}
      <LinearGradient
        colors={['rgba(98, 50, 255, 0.20)', 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 280 }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>

        {/* ── HEADER ── */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingBottom: 16,
            paddingTop: Math.max(insets.top, statusBarHeight) + 16,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginRight: 12, padding: 4 }}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 22, fontFamily: 'Poppins_600SemiBold' }}>
            About Digitag
          </Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── OUR MISSION ── */}
          <View style={{ paddingHorizontal: 20, marginBottom: 36 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontFamily: 'Poppins_600SemiBold', marginBottom: 14 }}>
              Our Mission
            </Text>
            <Text style={{ color: '#8A8A8A', fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 22, marginBottom: 14 }}>
              Digitag is a revolutionary platform designed to bridge the gap between agencies, content creators, and brands. We're building a community where collaboration happens seamlessly and opportunities are just a tap away.
            </Text>
            <Text style={{ color: '#8A8A8A', fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 22 }}>
              Our vision is to create the most trusted and efficient marketplace for digital collaborations, empowering professionals to grow their network and business.
            </Text>
          </View>

          {/* ── KEY FEATURES ── */}
          <View style={{ paddingHorizontal: 20, marginBottom: 36 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontFamily: 'Poppins_600SemiBold', marginBottom: 14 }}>
              Key Features
            </Text>
            <View style={{
              backgroundColor: '#111',
              borderWidth: 1,
              borderColor: '#2A2A2A',
              borderRadius: 24,
              overflow: 'hidden',
            }}>
              {FEATURES.map((feature, index) => (
                <React.Fragment key={feature.id}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 18 }}>
                    <View style={{
                      width: 42,
                      height: 42,
                      borderRadius: 21,
                      backgroundColor: '#1A1A1A',
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.1)',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 14,
                    }}>
                      <Ionicons name={feature.icon} size={20} color="#E0E0E0" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#E0E0E0', fontSize: 15, fontFamily: 'Poppins_600SemiBold', marginBottom: 3 }}>
                        {feature.title}
                      </Text>
                      <Text style={{ color: '#666', fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 19 }}>
                        {feature.description}
                      </Text>
                    </View>
                  </View>
                  {index < FEATURES.length - 1 && (
                    <View style={{ height: 0.5, backgroundColor: '#2A2A2A', marginHorizontal: 16 }} />
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>

          {/* ── LEGAL & PRIVACY ── */}
          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontFamily: 'Poppins_600SemiBold', marginBottom: 14 }}>
              Legal & Privacy
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: '#111',
                borderWidth: 1,
                borderColor: '#2A2A2A',
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
              activeOpacity={0.8}
              onPress={() => router.push('/privacysettings')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: '#1A1A1A',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 14,
                }}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#E0E0E0" />
                </View>
                <Text style={{ color: '#E0E0E0', fontSize: 15, fontFamily: 'Poppins_500Medium' }}>
                  Legal & Privacy
                </Text>
              </View>
              <Ionicons name="arrow-up-outline" size={22} color="#7352DD" style={{ transform: [{ rotate: '45deg' }] }} />
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
