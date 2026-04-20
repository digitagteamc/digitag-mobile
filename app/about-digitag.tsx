import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface FeatureItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

const FEATURES: FeatureItem[] = [
  {
    id: 'connect',
    icon: 'people-outline',
    title: 'Connect with Professionals',
    description: 'Network with agencies, creators, and brands in the digital marketing space',
  },
  {
    id: 'post',
    icon: 'document-text-outline',
    title: 'Post Requirements',
    description: 'Create and share your collaboration needs with the right audience',
  },
  {
    id: 'updates',
    icon: 'refresh-outline',
    title: 'Real-time Updates',
    description: 'Stay updated with instant notifications and live chat features',
  },
];

export default function AboutDigitagScreen() {
  const router = useRouter();
  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

  return (
    <View style={styles.root}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      <SafeAreaView style={styles.safe}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingTop: statusBarHeight }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── HEADER ── */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>About Digitag</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* ── OUR MISSION ── */}
          <Text style={styles.sectionTitle}>Our Mission</Text>

          <Text style={styles.missionParagraph}>
            {`Digitag is a revolutionary platform designed to bridge the gap between agencies, content creators, and brands. We're building a community where collaboration happens seamlessly and opportunities are just a tap away.`}
          </Text>

          <Text style={styles.missionParagraph}>
            Our vision is to create the most trusted and efficient marketplace for digital collaborations, empowering professionals to grow their network and business.
          </Text>

          {/* ── KEY FEATURES ── */}
          <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Key Features</Text>

          <View style={styles.featuresCard}>
            <View style={styles.cardBlur} />

            {FEATURES.map((feature, index) => (
              <React.Fragment key={feature.id}>
                <View style={styles.featureRow}>
                  {/* Icon pill */}
                  <View style={styles.featureIconPill}>
                    <Ionicons name={feature.icon} size={20} color="#F26930" />
                  </View>

                  {/* Text block */}
                  <View style={styles.featureTextBlock}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                  </View>
                </View>

                {/* Divider (not after last item) */}
                {index < FEATURES.length - 1 && <View style={styles.featureDivider} />}
              </React.Fragment>
            ))}
          </View>

          {/* ── LEGAL & PRIVACY ── */}
          <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Legal &amp; Privacy</Text>

          <TouchableOpacity
            style={styles.legalCard}
            activeOpacity={0.8}
            onPress={() =>
              Linking.openURL('https://digitag.in/privacy-policy').catch(() => {})
            }
          >
            <View style={styles.cardBlur} />

            <View style={styles.legalRow}>
              {/* Icon pill */}
              <View style={styles.featureIconPill}>
                <Ionicons name="shield-outline" size={20} color="#F26930" />
              </View>

              {/* Label */}
              <Text style={styles.legalLabel}>Legal &amp; Privacy</Text>

              {/* External link arrow */}
              <View style={styles.arrowCircle}>
                <Ionicons name="arrow-forward" size={16} color="#7352DD" />
              </View>
            </View>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#060606',
  },
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
    paddingHorizontal: 16,
  },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 32,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '500',
    letterSpacing: -0.3,
  },

  // ── Section title
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 16,
  },

  // ── Mission paragraphs
  missionParagraph: {
    color: '#e1e1e1',
    fontSize: 12,
    fontWeight: '300',
    lineHeight: 18,
    marginBottom: 16,
  },

  // ── Features card
  featuresCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(156,156,156,0.5)',
    overflow: 'hidden',
    position: 'relative',
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#323232',
    shadowOffset: { width: -7, height: 17 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 4,
  },
  cardBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },

  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
  },
  featureIconPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(50,50,50,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(242,105,48,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  featureTextBlock: {
    flex: 1,
    gap: 6,
  },
  featureTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  featureDescription: {
    color: '#5a5e60',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
  },
  featureDivider: {
    height: 1,
    backgroundColor: 'rgba(156,156,156,0.25)',
  },

  // ── Legal card
  legalCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(156,156,156,0.5)',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#323232',
    shadowOffset: { width: -7, height: 17 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 4,
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  legalLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(115,82,221,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
