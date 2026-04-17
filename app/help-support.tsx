import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Animated,
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

// ── Contact options
interface ContactItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  action: () => void;
}

// ── FAQ item
interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'q1',
    question: 'How do i create a requirement post?',
    answer:
      'Navigate to the Home tab and tap the "+" button. Fill in your project details, budget, and timeline, then hit Publish. Your post will be visible to all creators on the platform.',
  },
  {
    id: 'q2',
    question: 'How do i save Posts for later?',
    answer:
      'Tap the bookmark icon on any post card. You can find all your saved posts in the Profile tab under "Saved Posts".',
  },
  {
    id: 'q3',
    question: 'What are the different user types?',
    answer:
      'Digitag supports three user types: Brands (companies looking for creators), Creators (influencers and content professionals), and Freelancers (independent marketing experts).',
  },
  {
    id: 'q4',
    question: 'How do i contact someone about a post?',
    answer:
      'Open the post and tap "Send Request". The brand or creator will receive your inquiry and can respond via the in-app chat.',
  },
];

function FaqAccordion({ item }: { item: FaqItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.faqCard}>
      <View style={styles.cardBlur} />
      <TouchableOpacity
        style={styles.faqRow}
        activeOpacity={0.8}
        onPress={() => setExpanded(prev => !prev)}
      >
        <Text style={styles.faqQuestion} numberOfLines={expanded ? undefined : 1}>
          {item.question}
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color="#9a9a9a"
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.faqAnswer}>
          <View style={styles.faqDivider} />
          <Text style={styles.faqAnswerText}>{item.answer}</Text>
        </View>
      )}
    </View>
  );
}

export default function HelpSupportScreen() {
  const router = useRouter();
  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

  const CONTACT_ITEMS: ContactItem[] = [
    {
      id: 'email',
      icon: 'mail-outline',
      label: 'Email',
      action: () => Linking.openURL('mailto:support@digitag.in').catch(() => {}),
    },
    {
      id: 'call',
      icon: 'call-outline',
      label: 'Call',
      action: () => Linking.openURL('tel:+911800000000').catch(() => {}),
    },
    {
      id: 'chat',
      icon: 'chatbubble-outline',
      label: 'Chat',
      action: () => {},
    },
  ];

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
            <Text style={styles.headerTitle}>Help &amp; Support</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* ── CONTACT US ── */}
          <Text style={styles.sectionTitle}>Contact Us</Text>

          <View style={styles.contactCard}>
            <View style={styles.cardBlur} />

            {CONTACT_ITEMS.map((item, index) => (
              <React.Fragment key={item.id}>
                <TouchableOpacity
                  style={styles.contactRow}
                  activeOpacity={0.7}
                  onPress={item.action}
                >
                  <View style={styles.iconPill}>
                    <Ionicons name={item.icon} size={18} color="#F26930" />
                  </View>
                  <Text style={styles.contactLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={14} color="#9a9a9a" />
                </TouchableOpacity>

                {index < CONTACT_ITEMS.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>

          {/* ── FAQ ── */}
          <Text style={[styles.sectionTitle, { marginTop: 32 }]}>
            Frequently Asked Questions
          </Text>

          <View style={styles.faqList}>
            {FAQ_ITEMS.map(item => (
              <FaqAccordion key={item.id} item={item} />
            ))}
          </View>

          {/* ── STILL NEED HELP ── */}
          <View style={styles.helpCard}>
            <View style={styles.helpCardBlur} />
            <Text style={styles.helpTitle}>Still Need Help?</Text>
            <Text style={styles.helpSubtitle}>
              Our support team is available 24/7 to assist you
            </Text>
            <TouchableOpacity
              style={styles.contactSupportBtn}
              activeOpacity={0.85}
              onPress={() => Linking.openURL('mailto:support@digitag.in').catch(() => {})}
            >
              <Text style={styles.contactSupportText}>Contact Support</Text>
            </TouchableOpacity>
          </View>

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

  // ── Shared card blur
  cardBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },

  // ── Contact card
  contactCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(156,156,156,0.5)',
    overflow: 'hidden',
    position: 'relative',
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#323232',
    shadowOffset: { width: -7, height: 17 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  iconPill: {
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
  contactLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(156,156,156,0.25)',
  },

  // ── FAQ list
  faqList: {
    gap: 10,
  },
  faqCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(156,156,156,0.5)',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#323232',
    shadowOffset: { width: -7, height: 17 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 3,
  },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  faqQuestion: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
    flex: 1,
    lineHeight: 22,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  faqDivider: {
    height: 1,
    backgroundColor: 'rgba(156,156,156,0.25)',
    marginBottom: 12,
  },
  faqAnswerText: {
    color: '#9a9a9a',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 20,
  },

  // ── Still need help card
  helpCard: {
    marginTop: 32,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#171717',
    padding: 24,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  helpCardBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#171717',
  },
  helpTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  helpSubtitle: {
    color: '#e1e1e1',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
    marginBottom: 16,
  },
  contactSupportBtn: {
    backgroundColor: '#7352DD',
    height: 56,
    borderRadius: 99,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  contactSupportText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
});
