import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
    <View className="mb-3 bg-[#121212] border border-[#2A2A2A] rounded-[24px] overflow-hidden">
      <TouchableOpacity
        className="px-5 py-4 flex-row items-center justify-between"
        activeOpacity={0.8}
        onPress={() => setExpanded(prev => !prev)}
      >
        <Text className="text-white text-[15px] font-poppins-regular flex-1 mr-4">
          {item.question}
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#fff"
        />
      </TouchableOpacity>

      {expanded && (
        <View className="px-5 pb-5 pt-1">
          <View className="h-[1px] bg-[#2A2A2A] mb-4" />
          <Text className="text-[#8A8A8A] text-[14px] font-poppins-regular leading-6">
            {item.answer}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function HelpSupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

  const CONTACT_ITEMS = [
    {
      id: 'email',
      icon: 'mail-outline' as const,
      label: 'Email',
      action: () => Linking.openURL('mailto:support@digitag.in').catch(() => {}),
    },
    {
      id: 'call',
      icon: 'call-outline' as const,
      label: 'Call',
      action: () => Linking.openURL('tel:+911800000000').catch(() => {}),
    },
    {
      id: 'chat',
      icon: 'chatbubble-outline' as const,
      label: 'Chat',
      action: () => {},
    },
  ];

  return (
    <View className="flex-1 bg-[#0A0A0A]">
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      {/* Top purple glow gradient */}
      <LinearGradient
        colors={['rgba(98, 50, 255, 0.15)', 'transparent']}
        className="absolute top-0 left-0 right-0 h-[250px]"
      />

      <SafeAreaView className="flex-1" edges={['bottom', 'left', 'right']}>
        
        {/* ── STICKY HEADER ── */}
        <View 
          className="px-5 mb-6"
          style={{ paddingTop: Math.max(insets.top, statusBarHeight) + 16 }}
        >
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text className="text-white text-[22px] font-poppins-semibold tracking-wide">Help & Support</Text>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── CONTACT US ── */}
          <View className="px-5 mb-8">
            <Text className="text-white text-[17px] font-poppins-semibold mb-4 ml-1">Contact Us</Text>
            <View className="bg-[#121212] border border-[#2A2A2A] rounded-3xl px-2 py-2">
              {CONTACT_ITEMS.map((item, index) => (
                <React.Fragment key={item.id}>
                  <TouchableOpacity
                    className="flex-row items-center py-3.5 px-3"
                    activeOpacity={0.7}
                    onPress={item.action}
                  >
                    <View className="w-10 h-10 rounded-full bg-[#1A1A1A] items-center justify-center border border-[#F26930]/30 mr-4">
                      <Ionicons name={item.icon} size={20} color="#E0E0E0" />
                    </View>
                    <Text className="text-[#E0E0E0] text-[15px] font-poppins-medium flex-1">{item.label}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#fff" />
                  </TouchableOpacity>
                  {index < CONTACT_ITEMS.length - 1 && (
                    <View className="h-[1px] bg-[#2A2A2A] mx-3" />
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>

          {/* ── FAQ ── */}
          <View className="px-5 mb-8">
            <Text className="text-white text-[17px] font-poppins-semibold mb-4 ml-1">
              Frequently Asked Questions
            </Text>
            <View>
              {FAQ_ITEMS.map(item => (
                <FaqAccordion key={item.id} item={item} />
              ))}
            </View>
          </View>

          {/* ── STILL NEED HELP ── */}
          <View className="px-5 mb-8">
            <View className="bg-[#121212]/50 border border-[#2A2A2A] rounded-3xl p-5 items-center">
              <Text className="text-white text-[18px] font-poppins-semibold mb-2 w-full text-left">Still Need Help?</Text>
              <Text className="text-[#8A8A8A] text-[13px] font-poppins-regular mb-5 w-full text-left">
                Our support team is available 24/7 to assist you
              </Text>
              <TouchableOpacity
                className="bg-[#7C5DFA] w-full py-4 rounded-full items-center shadow-lg shadow-[#7C5DFA]/30"
                activeOpacity={0.8}
                onPress={() => Linking.openURL('mailto:support@digitag.in').catch(() => {})}
              >
                <Text className="text-white text-[16px] font-poppins-bold">Contact Support</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
