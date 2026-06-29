import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
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
    icon: require('../assets/connect-icon.png'),
    title: 'Connect with Professionals',
    description: 'Network with agencies, creators, and brands in the digital marketing space',
  },
  {
    id: 2,
    icon: require('../assets/post-req.png'),
    title: 'Post Requirements',
    description: 'Create and share your collaboration needs with the right audience',
  },
  {
    id: 3,
    icon: require('../assets/real-time.png'),
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
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 400 }}
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
            style={{ marginRight: 12, padding: 2 }}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 24, fontFamily: 'Poppins_500Medium' }}>
            About Digitag
          </Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 55 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── OUR MISSION ── */}
          <View style={{ paddingHorizontal: 20, marginBottom: 40 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontFamily: 'Poppins_500Medium', marginBottom: 14 }}>
              Our Mission
            </Text>
            <Text style={{ color: '#E1E1E1', fontSize: 12, fontFamily: 'Poppins_300Light', lineHeight: 18, marginBottom: 4 }}>
              Digitag is a revolutionary platform designed to bridge the gap between agencies, content creators, and brands. We're building a community where collaboration happens seamlessly and opportunities are just a tap away.
            </Text>
            <Text style={{ color: '#E1E1E1', fontSize: 12, fontFamily: 'Poppins_300Light', lineHeight: 18 }}>
              Our vision is to create the most trusted and efficient marketplace for digital collaborations, empowering professionals to grow their network and business.
            </Text>
          </View>

          {/* ── KEY FEATURES ── */}
          <View style={{ paddingHorizontal: 20, marginBottom: 36 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontFamily: 'Poppins_500Medium', marginBottom: 10 }}>
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
                      
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 14,
                    }}>
                      <Image 
                        source={feature.icon} 
                        style={{ width: 38, height: 38 }} 
                        resizeMode="contain" 
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#E0E0E0', fontSize: 16, fontFamily: 'Poppins_500Medium', marginBottom: 3 }}>
                        {feature.title}
                      </Text>
                      <Text style={{ color: '#5A5E60', fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight:18 }}>
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
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 14,
                }}>
                  <Image 
                    source={require('../assets/legal-icon.png')} 
                    style={{ width: 38, height: 38 }} 
                    resizeMode="contain" 
                  />
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
