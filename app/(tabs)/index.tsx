import { useProfileGate } from '@/context/ProfileGateContext';
import { Feather, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  Linking,
  Modal,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Reanimated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Carousel from 'react-native-reanimated-carousel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Circle, Defs, Path, Rect, Stop, Svg, LinearGradient as SvgGradient, Text as SvgText, TSpan } from 'react-native-svg';
import CustomAlert from '../../Components/ui/CustomAlert';
import { useAuth } from '../../context/AuthContext';
import { useNotificationCount } from '../../context/NotificationCountContext';
import { getFeed, getFullProfile, getSavedPostIds, getUserById, initiateCall, listCollaborations, openConversationWith, sendCollaboration, toggleSavePost } from '../../services/userService';
import { getRoleTheme, useRoleTheme } from '../../theme/useRoleTheme';

const { width } = Dimensions.get('window');

const CARD_WIDTH = 250;
const SPACING = 10;
const ITEM_SIZE = CARD_WIDTH + SPACING;

const FALLBACK_BANNER = null;
// Category images from freelancer tabs icons
const imgPhotography = require('../../assets/tabs-icons-freelancer/Photography.png');
const imgEditor = require('../../assets/tabs-icons-freelancer/editors.png');
const imgVideography = require('../../assets/tabs-icons-freelancer/Videography.png');
const imgGrowth = require('../../assets/tabs-icons-freelancer/GrowthSpecialist.png');
const imgScriptWriters = require('../../assets/tabs-icons-freelancer/ScriptWriters.png');
const imgStyling = require('../../assets/tabs-icons-freelancer/Stylingmakeup.png');
const imgFashion = require('../../assets/tabs-icons-freelancer/FashionDesigners.png');
const imgProperty = require('../../assets/tabs-icons-freelancer/PropertyRental.png');
const imgVoiceOver = require('../../assets/tabs-icons-freelancer/VoiceOver.png');
const imgModal = require('../../assets/tabs-icons-freelancer/Modals.png');
// Preload prevention - images will be required lazily

// const imgStars = require('../../assets/categories/stars.gif');
// const imgStarsOrange = require('../../assets/categories/star-orange.gif');
// const imgPost = require('../../assets/categories/post.gif');
// const imgNewPost = require('../../assets/categories/newpost.gif');
// const imgLove = require('../../assets/categories/love.gif');
// const imgLoveOrange = require('../../assets/categories/love-orange.gif');
const imgTargetNew = require('../../assets/categories/targetnew.png');
const slide1 = require('../../assets/slides/slide1.webp');
const slide2 = require('../../assets/slides/slide2.webp');
const slide3 = require('../../assets/slides/slide3.webp');
const slide4 = require('../../assets/slides/slide4.webp');


const CAROUSEL_DATA = [
  {
    id: '1',
    titleLine1: 'Book',
    titleLine2: 'Expert',
    titleLine3: 'Creators',
    desc1: 'Find makeup, hair & creative  ',
    desc2: ' professionals. ',
    image: slide1,
    gradient: ['rgba(6,6,6,0.2)', '#ed2a91'],
    strokeColor: '#ED2A91',
  },
  {
    id: '2',
    titleLine1: 'Hire',
    titleLine2: 'Expert',
    titleLine3: 'Freelancers',
    desc1: 'Find makeup, hair & creative  ',
    desc2: ' professionals. ',
    image: slide2,
    gradient: ['rgba(6,6,6,0.2)', '#F26930'],
    strokeColor: '#F26930',
  },
  {
    id: '3',
    titleLine1: 'Discover',
    titleLine2: 'Trusted',
    titleLine3: 'Brands',
    desc1: 'Find makeup, hair & creative  ',
    desc2: ' professionals. ',
    image: slide3,
    gradient: ['rgba(6,6,6,0.2)', '#253E93'],
    strokeColor: '#253E93',
  },
  {
    id: '4',
    titleLine1: 'Connect',
    titleLine2: 'With',
    titleLine3: 'Agencies',
    desc1: 'Find makeup, hair & creative  ',
    desc2: ' professionals. ',
    image: slide4,
    gradient: ['rgba(6,6,6,0.2)', '#FFFFFF'],
    strokeColor: '#FFFFFF',
  },
];

const CATEGORIES = [
  { id: 'photography', label: 'Photography', image: imgPhotography, icon: 'camera-outline' as const },
  { id: 'editor', label: 'Editors', image: imgEditor, icon: 'desktop-outline' as const },
  { id: 'videography', label: 'Videography', image: imgVideography, icon: 'videocam-outline' as const },
  { id: 'growth', label: 'Growth\nSpecialist', image: imgGrowth, icon: 'trending-up-outline' as const },
  { id: 'script', label: 'Script Writers', image: imgScriptWriters, icon: 'document-text-outline' as const },
  { id: 'styling', label: 'Styling &\nmakeup', image: imgStyling, icon: 'color-palette-outline' as const },
  { id: 'fashion', label: 'Fashion\nDesigners', image: imgFashion, icon: 'shirt-outline' as const },
  { id: 'property', label: 'Property\nRental', image: imgProperty, icon: 'home-outline' as const },
  { id: 'voice', label: 'Voice Over', image: imgVoiceOver, icon: 'mic-outline' as const },
  { id: 'models', label: 'Models', image: imgModal, icon: 'walk-outline' as const },
];

const f_lifestyle = require('../../assets/creator-categories/Lifestyle-Living.png');
const f_tech = require('../../assets/creator-categories/Tech.png');
const f_education = require('../../assets/creator-categories/Education.png');
const f_photography = require('../../assets/creator-categories/Photography.png');
const f_food = require('../../assets/creator-categories/Food.png');
const f_health = require('../../assets/creator-categories/Health.png');
const f_automotive = require('../../assets/creator-categories/Automotive.png');
const f_comedy = require('../../assets/creator-categories/Comedy-Memes.png');
const f_entertainment = require('../../assets/creator-categories/Entertainment.png');
const f_gaming = require('../../assets/creator-categories/Gaming-Anime.png');
const f_learning = require('../../assets/creator-categories/Learning.png');
const f_news = require('../../assets/creator-categories/News-Media-Magazins.png');
const f_sports = require('../../assets/creator-categories/Sports.png');

const f_travel = require('../../assets/creator-categories/Travel.png');
const f_beauty = require('../../assets/creator-categories/Beauty.png');
const f_fitness = require('../../assets/creator-categories/Fitness.png');
const f_fashion = require('../../assets/creator-categories/Fashion.png');
const f_finance = require('../../assets/creator-categories/Finance-Investments.png');
const f_arts = require('../../assets/creator-categories/Arts.png');
const f_business = require('../../assets/creator-categories/Business-Startups.png');
const f_community = require('../../assets/creator-categories/Community-Pages.png');
const f_family = require('../../assets/creator-categories/Family-Kids-Pets.png');
const f_home = require('../../assets/creator-categories/Home-Decor.png');
const f_law = require('../../assets/creator-categories/Law-Rights-Activism.png');
const f_pets = require('../../assets/creator-categories/Pets-Animals.png');
const f_politics = require('../../assets/creator-categories/Politics.png');

const FREELANCER_CATEGORIES = [
  { id: 'f1', label: 'Lifestyle &\nLiving', image: f_lifestyle },
  { id: 'f2', label: 'Tech', image: f_tech },
  { id: 'f3', label: 'Education', image: f_education },
  { id: 'f4', label: 'Photography', image: f_photography },
  { id: 'f5', label: 'Food', image: f_food },
  { id: 'f6', label: 'Health', image: f_health },
  { id: 'f7', label: 'Automotive', image: f_automotive },
  { id: 'f8', label: 'Comedy &\nMemes', image: f_comedy },
  { id: 'f9', label: 'Entertainment', image: f_entertainment },
  { id: 'f10', label: 'Gaming &\nAnime', image: f_gaming },
  { id: 'f11', label: 'Learning', image: f_learning },
  { id: 'f12', label: 'News, Media\n& Magazins', image: f_news },
  { id: 'f13', label: 'Sports', image: f_sports },
  { id: 'f14', label: 'Travel', image: f_travel },
  { id: 'f15', label: 'Beauty', image: f_beauty },
  { id: 'f16', label: 'Fitness', image: f_fitness },
  { id: 'f17', label: 'Fashion', image: f_fashion },
  { id: 'f18', label: 'Finance &\nInvestments', image: f_finance },
  { id: 'f19', label: 'Arts', image: f_arts },
  { id: 'f20', label: 'Business &\nStartups', image: f_business },
  { id: 'f21', label: 'Community\nPages', image: f_community },
  { id: 'f22', label: 'Family, Kids\n& Pets', image: f_family },
  { id: 'f23', label: 'Home &\nDecor', image: f_home },
  { id: 'f24', label: 'Law, Rights\n& Activism', image: f_law },
  { id: 'f25', label: 'Pets &\nAnimals', image: f_pets },
  { id: 'f26', label: 'Politics', image: f_politics },
];

const CAT_BORDER_COLORS = [
  ['rgba(52, 52, 52, 1)', 'rgba(255, 51, 0, 0.5)'],
  ['rgba(52, 52, 52, 1)', 'rgba(0, 183, 255, 0.5)'],
  ['rgba(52, 52, 52, 1)', 'rgba(255, 238, 1, 0.5)'],
  ['rgba(52, 52, 52, 1)', 'rgba(1, 255, 35, 0.5)'],
  ['rgba(52, 52, 52, 1)', 'rgba(12, 62, 179, 0.5)'],
  ['rgba(52, 52, 52, 1)', 'rgba(143, 12, 229, 0.5)'],
  ['rgba(52, 52, 52, 1)', 'rgba(240, 0, 160, 0.5)'],
  ['rgba(52, 52, 52, 1)', 'rgba(250, 71, 0, 0.5)'],
  ['rgba(52, 52, 52, 1)', 'rgba(255, 51, 0, 0.5)'],
  ['rgba(52, 52, 52, 1)', 'rgba(0, 183, 255, 0.5)'],
];

const StrokeText = ({ text, strokeColor, style }: { text: string, strokeColor: string, style?: any }) => {
  const flattenedStyle = StyleSheet.flatten(style) || {};
  const fontSize = flattenedStyle.fontSize || 38;
  const fontFamily = flattenedStyle.fontFamily || 'Poppins_700ExtraBold';
  const widthVal = width - 32;
  const heightVal = flattenedStyle.lineHeight || fontSize * 1.4;

  return (
    <View style={{ height: heightVal, width: widthVal }}>
      <Svg height="100%" width="100%" viewBox={`0 0 ${widthVal} ${heightVal}`}>
        {/* Layer 1: The Stroke (Bottom Layer) */}
        <SvgText
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          fontSize={fontSize}
          fontFamily={fontFamily}
          fontWeight="800"
          x="1"
          y={fontSize}
        >
          {text}
        </SvgText>
        {/* Layer 2: The Fill (Top Layer) */}
        <SvgText
          fill={flattenedStyle.color || "#FFFFFF"}
          fontSize={fontSize}
          fontFamily={fontFamily}
          fontWeight="800"
          x="1"
          y={fontSize}
        >
          {text}
        </SvgText>
      </Svg>
    </View>
  );
};

const HeroGradientText = ({
  text,
  color,
  gradientColors,
  fontSize = 14,
  fontFamily = 'Poppins_600SemiBold',
  height,
  style,
}: {
  text: string;
  color?: string;
  gradientColors?: string[];
  fontSize?: number;
  fontFamily?: string;
  height?: number;
  style?: any;
}) => {
  const widthVal = text.length * fontSize * 0.6;
  const heightVal = height ?? fontSize * 1.5;
  const gradId = React.useMemo(() => `heroGrad_${text.replace(/[^a-zA-Z0-9]/g, '')}`, [text]);

  const stops = React.useMemo(() => {
    if (gradientColors && gradientColors.length >= 2) {
      return gradientColors.map((col, idx) => (
        <Stop key={idx} offset={`${idx / (gradientColors.length - 1)}`} stopColor={col} stopOpacity="1" />
      ));
    }
    return [
      <Stop key="0" offset="0" stopColor="#FFFFFF" stopOpacity="1" />,
      <Stop key="1" offset={color ? "1" : "0"} stopColor={color || '#FFFFFF'} stopOpacity="1" />
    ];
  }, [gradientColors, color]);

  return (
    <View style={[{ width: widthVal, height: heightVal }, style]}>
      <Svg height="100%" width="100%" viewBox={`0 0 ${widthVal} ${heightVal}`}>
        <Defs>
          <SvgGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
            {stops}
          </SvgGradient>
        </Defs>
        <SvgText
          fill={`url(#${gradId})`}
          fontSize={fontSize}
          fontFamily={fontFamily}
          x="0"
          y={fontSize}
        >
          {text}
        </SvgText>
      </Svg>
    </View>
  );
};

const BlinkingStar = React.memo(({ style, size = 20 }: { style?: any, size?: number }) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    const duration = 1000 + Math.random() * 1500;
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration }),
        withTiming(0, { duration })
      ),
      -1,
      true
    );
    return () => cancelAnimation(opacity);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: opacity.value * 0.3 + 0.7 }]
  }));

  return (
    <Reanimated.View style={[style, animatedStyle]}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M9.93694 14.9996C9.84766 14.6535 9.66728 14.3377 9.41456 14.085C9.16184 13.8323 8.84601 13.6519 8.49994 13.5626L2.36494 11.9806C2.26027 11.9509 2.16815 11.8878 2.10255 11.801C2.03696 11.7142 2.00146 11.6084 2.00146 11.4996C2.00146 11.3908 2.03696 11.285 2.00146 11.4996C2.00146 11.3908 2.03696 11.285 2.10255 11.1981C2.16815 11.1113 2.26027 11.0483 2.36494 11.0186L8.49994 9.43559C8.84589 9.3464 9.16163 9.16617 9.41434 8.91363C9.66705 8.6611 9.84751 8.34548 9.93694 7.99959L11.5189 1.86459C11.5483 1.75951 11.6113 1.66693 11.6983 1.60099C11.7852 1.53504 11.8913 1.49934 12.0004 1.49934C12.1096 1.49934 12.2157 1.53504 12.3026 1.60099C12.3896 1.66693 12.4525 1.75951 12.4819 1.86459L14.0629 7.99959C14.1522 8.34566 14.3326 8.66149 14.5853 8.91421C14.838 9.16693 15.1539 9.34731 15.4999 9.43659L21.6349 11.0176C21.7404 11.0467 21.8335 11.1096 21.8998 11.1967C21.9661 11.2837 22.002 11.3902 22.002 11.4996C22.002 11.609 21.9661 11.7154 21.8998 11.8025C21.8335 11.8896 21.7404 11.9525 21.6349 11.9816L15.4999 13.5626C15.1539 13.6519 14.838 13.8323 14.5853 14.085C14.3326 14.3377 14.1522 14.6535 14.0629 14.9996L12.4809 21.1346C12.4515 21.2397 12.3886 21.3322 12.3016 21.3982C12.2147 21.4641 12.1086 21.4998 11.9994 21.4998C11.8903 21.4998 11.7842 21.4641 11.6973 21.3982C11.6103 21.3322 11.5473 21.2397 11.5179 21.1346L9.93694 14.9996Z"
          stroke="#FFDF20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        />
        <Path d="M20 2.875V6.70833" stroke="#FFDF20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M22 5.00034H18" stroke="#FFDF20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M4 16.292V18.2087" stroke="#FFDF20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </Reanimated.View>
  );
});

const BlinkingDot = React.memo(({ style, size = 5 }: { style?: any, size?: number }) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    const duration = 800 + Math.random() * 1200;
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration }),
        withTiming(0, { duration })
      ),
      -1,
      true
    );
    return () => cancelAnimation(opacity);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Reanimated.View style={[style, animatedStyle]}>
      <Svg width={size} height={size} viewBox="0 0 5 5" fill="none">
        <Circle cx="2.5" cy="2.5" r="2.5" fill="#D9D9D9" />
      </Svg>
    </Reanimated.View>
  );
});

const Sparkles = React.memo(() => {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <BlinkingStar style={{ position: 'absolute', top: 10, left: 120 }} size={24} />
      <BlinkingDot style={{ position: 'absolute', top: 40, left: 40 }} />
      <BlinkingDot style={{ position: 'absolute', top: 140, left: 180 }} />
      <BlinkingDot style={{ position: 'absolute', bottom: 100, right: 150 }} />
      <BlinkingDot style={{ position: 'absolute', bottom: 40, right: 50 }} />
    </View>
  );
});

const CommunityModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 15,
    hours: 8,
    minutes: 42,
    seconds: 19
  });

  const translateY = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      cancelAnimation(translateY);
      return;
    }
    translateY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 1500 }),
        withTiming(0, { duration: 1500 })
      ),
      -1,
      true
    );

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => {
      clearInterval(timer);
      cancelAnimation(translateY);
    };
  }, [visible]);

  const animatedRocketStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }]
  }));

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <LinearGradient
          colors={['#1E1C5B', '#1E1C5B', '#921B66', '#E91E63']}
          locations={[0, 0.45, 0.75, 1]}
          style={{
            width: Math.min(400, width - 32),
            height: 647,
            borderRadius: 32,
            padding: 24,
            paddingBottom: 40,
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {visible && <Sparkles />}

          <TouchableOpacity
            onPress={onClose}
            style={{ position: 'absolute', top: 20, right: 20, width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)' }}
          >
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>

          <Reanimated.View style={[{ width: 100, height: 100, borderRadius: 24, backgroundColor: '#C2185B', justifyContent: 'center', alignItems: 'center', marginTop: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 10 }, animatedRocketStyle]}>
            <Ionicons name="rocket-outline" size={56} color="#fff" />
          </Reanimated.View>

          <Text style={{ color: '#fff', fontSize: 36, fontFamily: 'Poppins_700Bold', marginTop: 20 }}>Launching Soon</Text>
          <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'Poppins_400Regular', opacity: 0.8, marginTop: 3 }}>Something amazing is on the way</Text>

          {/* Countdown timer */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
            {[
              { val: timeLeft.days, label: 'DAYS' },
              { val: timeLeft.hours, label: 'HOURS' },
              { val: timeLeft.minutes, label: 'MINUTES' },
              { val: timeLeft.seconds, label: 'SECONDS' }
            ].map((item, idx) => (
              <View key={idx} style={{ width: 70, height: 80, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 28, fontFamily: 'Poppins_700Bold' }}>{String(item.val).padStart(2, '0')}</Text>
                <Text style={{ color: '#fff', fontSize: 12, fontFamily: 'Poppins_400Regular', opacity: 0.6, marginTop: 0 }}>{item.label}</Text>
              </View>
            ))}
          </View>

          {/* Notification Input */}
          <View style={{ width: '100%', marginTop: 40, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
              <Ionicons name="notifications-outline" size={20} color="rgba(255,255,255,0.6)" />
              <TextInput
                placeholder="Enter your number for updates"
                placeholderTextColor="rgba(255,255,255,0.4)"
                style={{ flex: 1, marginLeft: 10, color: '#fff', fontFamily: 'Poppins_400Regular', fontSize: 13 }}
                keyboardType="numeric"
              />
            </View>
            <TouchableOpacity style={{ height: 56, borderRadius: 16, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#6C63FF' }}>
              <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'Poppins_600SemiBold' }}>Notify Me</Text>
            </TouchableOpacity>
          </View>

          <View style={{ width: '100%', height: 1.5, backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 40 }} />

          {/* Footer Icons */}
          <View style={{ width: '100%', marginTop: 30, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10 }}>
            {[
              { icon: 'calendar-outline', label: 'Early Access' },
              { icon: 'sparkles-outline', label: 'Exclusive Features' },
              { icon: 'notifications-outline', label: 'Launch Updates' }
            ].map((item, idx) => (
              <View key={idx} style={{ alignItems: 'center', width: '30%' }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                  <Ionicons name={item.icon as any} size={20} color="#fff" />
                </View>
                <Text style={{ color: '#fff', fontSize: 10, fontFamily: 'Poppins_400Regular', textAlign: 'center' }}>{item.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

// Optimization: Memoized Carousel Card component to prevent re-renders
const CarouselCard = React.memo(({ item, index, scrollX, ITEM_SIZE, CARD_WIDTH, handlePostTap, handleBookmark, handleSeePortfolio, handleMessage, handleCall, handleShare, handleCollab, collabSentOwnerIds, acceptedCollabOwnerIds, savedPostIds, userRole }: any) => {
  const inputRange = [
    (index - 1) * ITEM_SIZE,
    index * ITEM_SIZE,
    (index + 1) * ITEM_SIZE,
  ];

  // Removed rotateY for performance

  const scale = scrollX.interpolate({
    inputRange,
    outputRange: [0.85, 1, 0.85],
    extrapolate: 'clamp',
  });

  const opacity = scrollX.interpolate({
    inputRange,
    outputRange: [1, 1, 1], // Keeps cards solid so background doesn't bleed through
    extrapolate: 'clamp',
  });

  const postTheme = getRoleTheme(item.ownerRole);
  const postColor = postTheme.primary;

  return (
    <View style={{ width: ITEM_SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          width: CARD_WIDTH,
          transform: [{ scale }],
          opacity,
        }}
      >
        <LinearGradient
          colors={['transparent', userRole === 'FREELANCER' ? 'rgba(237, 42, 145, 0.70)' : 'rgba(242, 105, 48, 0.70)']}
          style={styles.figmaCardGradientBorder}
        >
          <TouchableOpacity style={styles.figmaCard} activeOpacity={1} onPress={() => handlePostTap(item.id, item.ownerId)}>
            {/* Top Opacity Overlay */}
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.05)', 'transparent']}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%' }}
            />
            {/* Top Absolute Row */}
            <View style={styles.figmaCardTopRow}>
              <View style={styles.figmaCardRoleBadge}>
                <Text style={styles.figmaCardRoleText}>{item.role}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity style={styles.figmaCardBookmarkBtn} onPress={() => handleShare(item.id)}>
                  <Ionicons name="share-social-outline" size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.figmaCardBookmarkBtn} onPress={() => handleBookmark(item.id)}>
                  <Ionicons name={savedPostIds?.has(item.id) ? 'bookmark' : 'bookmark-outline'} size={18} color={savedPostIds?.has(item.id) ? postColor : '#fff'} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Avatar */}
            <View style={styles.figmaCardAvatarWrap}>
              <Image
                source={item.isInitials ? require('../../assets/images/icon.png') : { uri: item.avatarUri }}
                style={styles.figmaCardAvatarImg}
                resizeMode="cover"
              />
            </View>

            {/* Name & Details */}
            <Text style={styles.figmaCardName} numberOfLines={1} ellipsizeMode="tail">
              {item.name}
            </Text>

            <View style={styles.figmaCardMetaRow}>
              <TouchableOpacity
                style={[styles.figmaCardPortfolioBtn, { backgroundColor: postColor }]}
                onPress={() => handleSeePortfolio(item.ownerId, item.ownerRole)}
              >
                <Text style={styles.figmaCardPortfolioText}>See Portfolio</Text>
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
                <Ionicons name="time-outline" size={14} color="#a1a2a4" />
                <Text style={styles.figmaCardTimeText}> {item.time}</Text>
              </View>
            </View>

            <Text style={styles.figmaCardDesc} numberOfLines={3}>{item.desc}</Text>

            <Text style={styles.figmaCardPrice}>{item.price === 'Paid Collab' ? '₹ 10K-15K/Month' : 'Free Collab'}</Text>

            {/* Bottom Actions */}
            {acceptedCollabOwnerIds?.has(item.ownerId) ? (
              <View style={styles.figmaCardActions}>
                <TouchableOpacity onPress={() => handleMessage(item.ownerId)} activeOpacity={0.75}>
                  <ImageBackground source={require('../../assets/bg-icons.png')} style={styles.iconCircleDark} imageStyle={{ borderRadius: 19 }}>
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
                  </ImageBackground>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleCall(item.ownerId)} activeOpacity={0.75}>
                  <ImageBackground source={require('../../assets/bg-icons.png')} style={styles.iconCircleDark} imageStyle={{ borderRadius: 19 }}>
                    <Ionicons name="call-outline" size={18} color="#fff" />
                  </ImageBackground>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.figmaCollabBtn, { backgroundColor: postColor, opacity: collabSentOwnerIds?.has(item.ownerId) ? 0.6 : 1 }]}
                onPress={() => handleCollab(item.ownerId, item.id)}
                activeOpacity={0.8}
                disabled={collabSentOwnerIds?.has(item.ownerId)}
              >
                <Ionicons
                  name={collabSentOwnerIds?.has(item.ownerId) ? 'checkmark-circle-outline' : 'people-outline'}
                  size={15}
                  color="#fff"
                />
                <Text style={styles.figmaCollabBtnText}>
                  {collabSentOwnerIds?.has(item.ownerId) ? 'Request Sent' : 'Collaborate'}
                </Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    </View>
  );
});

export default function Homepage() {
  const router = useRouter();
  const { token, isGuest, userRole, userId, isProfileCompleted } = useAuth();
  const { requireProfile } = useProfileGate();
  const theme = useRoleTheme();
  const insets = useSafeAreaInsets();

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createPostWidth, setCreatePostWidth] = useState(0);
  const [userName, setUserName] = useState<string>('');
  const [userTagId, setUserTagId] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const { unreadCount } = useNotificationCount();
  const [acceptedCollabOwnerIds, setAcceptedCollabOwnerIds] = useState<Set<string>>(new Set());
  const [collabSentOwnerIds, setCollabSentOwnerIds] = useState<Set<string>>(new Set());
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const [portfolioModalVisible, setPortfolioModalVisible] = useState(false);
  const [selectedPortfolioLink, setSelectedPortfolioLink] = useState<string | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [communityModalVisible, setCommunityModalVisible] = useState(false);

  // Filter categories based on role: show only first 4 for Freelancers, all 8 for others.
  const availableCategoryColumns = useMemo(() => {
    if (userRole === 'FREELANCER') {
      const cols = [];
      const mid = Math.ceil(FREELANCER_CATEGORIES.length / 2);
      for (let i = 0; i < mid; i++) {
        cols.push([
          FREELANCER_CATEGORIES[i],
          FREELANCER_CATEGORIES[i + mid]
        ].filter(Boolean));
      }
      return cols;
    }
    return [
      [CATEGORIES[0], CATEGORIES[5]],
      [CATEGORIES[1], CATEGORIES[6]],
      [CATEGORIES[2], CATEGORIES[7]],
      [CATEGORIES[3], CATEGORIES[8]],
      [CATEGORIES[4], CATEGORIES[9]],
    ];
  }, [userRole]);

  const catGap = userRole === 'FREELANCER' ? 12 : 12;
  const colWidth = 100;
  const snapInterval = userRole === 'FREELANCER' ? colWidth + catGap : colWidth * 2 + 14 * 2;

  const scrollXCat = useRef(new Animated.Value(0)).current;
  const activeCatPage = Animated.divide(scrollXCat, snapInterval);
  const scrollX = useRef(new Animated.Value(0)).current;
  // Matches the carousel FlatList's initialScrollIndex, which itself only applies
  // once on first mount — so this must also only run once. Without this guard,
  // returning from post-detail re-runs fetchPosts (useFocusEffect) and snaps
  // scrollX back to the initial card, desyncing it from wherever the FlatList
  // was actually scrolled and causing the carousel to visually misalign/glitch.
  const hasSetInitialCarouselScroll = useRef(false);

  const showAlert = (title: string, message: string) => {
    setAlertConfig({ visible: true, title, message });
  };

  useFocusEffect(
    useCallback(() => {
      const fetchPosts = async () => {
        try {
          // Browsing the feed doesn't require an account — token is optional here.
          const res = await getFeed(token);
          const allPosts: any[] = Array.isArray(res.data) ? res.data : [];
          // Center on the middle post so its left/right neighbors both peek into
          // view on open, showing all 3 preview posts at once (per design).
          if (!hasSetInitialCarouselScroll.current) {
            const visibleCount = (isGuest || isProfileCompleted) ? allPosts.length : Math.min(allPosts.length, 3);
            const initialIndex = visibleCount >= 3 ? 1 : 0;
            scrollX.setValue(initialIndex * ITEM_SIZE);
            hasSetInitialCarouselScroll.current = true;
          }
          setPosts(allPosts);
        } catch {
          setPosts([]);
        } finally {
          setLoading(false);
        }
      };

      const fetchUser = async () => {
        if (isGuest || !token) { setUserName('Guest'); return; }
        const res = await getFullProfile(token);
        if (res.success && res.data?.profile) {
          const p = res.data.profile;
          setUserName(p.name || '');
          setUserTagId(p.tagId || null);
          setUserAvatar(p.profilePicture || null);
        }
      };

      const fetchCollabInfo = async () => {
        if (!token || isGuest) return;
        const res = await listCollaborations(token, { direction: 'all' });
        if (res.success && Array.isArray(res.data)) {
          const accepted = new Set<string>();
          const sent = new Set<string>();
          res.data.forEach((r: any) => {
            if (r.status === 'ACCEPTED') {
              const otherId = r.senderId === userId ? r.receiverId : r.senderId;
              if (otherId) accepted.add(otherId);
            }
            if (r.status === 'PENDING' && r.senderId === userId) sent.add(r.receiverId);
          });
          setAcceptedCollabOwnerIds(accepted);
          setCollabSentOwnerIds(sent);
        }
      };

      const fetchSavedIds = async () => {
        if (!token || isGuest) return;
        const res = await getSavedPostIds(token);
        if (res.success && Array.isArray(res.data)) {
          setSavedPostIds(new Set(res.data));
        }
      };

      fetchPosts();
      fetchUser();
      fetchCollabInfo();
      fetchSavedIds();
    }, [token, isGuest, userRole, userId])
  );

  const getOwnerName = (owner: any) => {
    if (owner?.name) return owner.name;
    if (owner?.role === 'CREATOR') return 'Creator';
    if (owner?.role === 'FREELANCER') return 'Freelancer';
    return 'User';
  };

  const getTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.round(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.round(diffHrs / 24);
    return `${diffDays}d ago`;
  };

  const handleBookmark = async (postId: string) => {
    if (isGuest || !token) { router.push('/role-selection'); return; }
    const isSaved = savedPostIds.has(postId);
    // Optimistic update
    setSavedPostIds(prev => {
      const next = new Set(prev);
      if (isSaved) next.delete(postId); else next.add(postId);
      return next;
    });
    const res = await toggleSavePost(postId, token, isSaved);
    if (!res.success) {
      // Revert on failure
      setSavedPostIds(prev => {
        const next = new Set(prev);
        if (isSaved) next.add(postId); else next.delete(postId);
        return next;
      });
    }
  };

  const handleShare = async (postId: string) => {
    try {
      const url = `https://thedigitag.ai/post/${postId}`;
      await Share.share({
        message: `Check out this post on digitag: ${url}`,
        url: url,
        title: 'digitag Post',
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handlePostTap = (postId: string, ownerId?: string) => {
    // Viewing a post is browsing, not an account action — guests can open it freely.
    // Logged-in users with an incomplete profile still get the completion nudge.
    if (token && !requireProfile('view this post')) return;
    router.push({ pathname: '/post-detail', params: { postId } } as any);
  };

  const handleMessage = async (ownerId?: string) => {
    if (isGuest || !token) { router.push('/role-selection'); return; }
    if (!requireProfile('message this user')) return;
    if (!ownerId) return;

    try {
      const res = await openConversationWith(token, ownerId);
      if (res.success && res.data?.id) {
        router.push(`/chat/${res.data.id}` as any);
      } else {
        showAlert('Chat Error', res.error || 'Could not open conversation. Make sure you have an active collaboration or try again.');
      }
    } catch (err) {
      showAlert('Error', 'Failed to open chat.');
    }
  };

  const handleCall = async (calleeId?: string) => {
    if (isGuest || !token) { router.push('/role-selection'); return; }
    if (!requireProfile('call this user')) return;
    if (!calleeId) return;
    const callee = cards.find(c => c.ownerId === calleeId);
    try {
      const res = await initiateCall(token, calleeId);
      if (res.success && res.data) {
        router.push({
          pathname: '/call',
          params: {
            mode: 'outgoing',
            callId: res.data.callId,
            channelName: res.data.channelName,
            agoraToken: res.data.token,
            appId: res.data.appId,
            remoteName: callee?.name || 'User',
            remoteImage: callee?.avatarUri || '',
          },
        } as any);
      } else {
        showAlert('Call Failed', (res as any).error || 'Could not start call. Please try again.');
      }
    } catch (err: any) {
      showAlert('Call Failed', err?.message || 'Network error.');
    }
  };

  const handleSeePortfolio = async (ownerId?: string, ownerRole?: string) => {
    // Uses the public profile endpoint — viewing a portfolio link is browsing,
    // same as the rest of the profile, so it works for guests too.
    setSelectedPortfolioLink(null);
    setPortfolioLoading(true);
    setPortfolioModalVisible(true);
    try {
      if (!ownerId) { setPortfolioLoading(false); return; }
      const res = await getUserById(ownerId, token);
      const profileData = res.success ? (res.data?.creatorProfile || res.data?.freelancerProfile) : null;
      const link = profileData?.portfolioUrl || profileData?.portfolio || profileData?.portfolioLink || null;
      setSelectedPortfolioLink(link);
    } catch (e) {
      setSelectedPortfolioLink(null);
    } finally {
      setPortfolioLoading(false);
    }
  };

  const handleCollab = async (ownerId?: string, postId?: string) => {
    if (isGuest || !token) { router.push('/role-selection'); return; }
    if (!requireProfile('send a collaboration')) return;
    if (!ownerId) return;
    if (collabSentOwnerIds.has(ownerId)) return;
    try {
      const res = await sendCollaboration(token, { receiverId: ownerId, postId, message: 'I would love to collaborate with you!' });
      if (res.success) {
        setCollabSentOwnerIds(prev => new Set([...prev, ownerId]));
      } else {
        showAlert('Collab Error', res.error || 'Could not send collaboration request.');
      }
    } catch {
      showAlert('Error', 'Failed to send collaboration request.');
    }
  };

  const PREVIEW_POST_LIMIT = 3;
  // The preview cap is a "finish your profile to see more" nudge for logged-in users —
  // it doesn't apply to guests, who have no profile to complete and would otherwise hit
  // a dead-end wall after 3 posts (exactly what Apple 5.1.1 flagged).
  const isCapped = !isGuest && !isProfileCompleted;
  const visiblePosts = isCapped ? posts.slice(0, PREVIEW_POST_LIMIT) : posts;
  const hasMoreHiddenPosts = isCapped && posts.length > PREVIEW_POST_LIMIT;

  const cards = React.useMemo(() => visiblePosts.map(post => {
    const owner = post.owner || {};
    const name = getOwnerName(owner);
    const pic = owner.profilePicture || null;
    const roleLabel = owner.role
      ? owner.role.charAt(0) + owner.role.slice(1).toLowerCase()
      : 'User';
    return {
      id: post.id,
      owner: owner,
      ownerId: owner.id as string | undefined,
      ownerRole: owner.role as string | undefined,
      bannerUri: post.imageUrl || FALLBACK_BANNER,
      isInitials: !pic,
      initials: name.slice(0, 2).toUpperCase(),
      avatarUri: pic,
      name,
      role: roleLabel,
      desc: post.description,
      price: post.collaborationType === 'PAID' ? 'Paid Collab' : 'Free Collab',
      time: getTimeAgo(post.createdAt),
      portfolioLink: owner.portfolio || owner.portfolioLink || owner.portfolioUrl || null,
    };
  }), [visiblePosts]);

  const carouselData = React.useMemo(() => {
    const copies = 1;
    return Array(copies).fill(cards).flat().map((item, idx) => ({ ...item, _loopId: `${item.id}-${idx}` }));
  }, [cards]);

  const carouselOffsets = React.useMemo(() =>
    carouselData.map((_, i) => i * ITEM_SIZE),
    [carouselData, ITEM_SIZE]
  );

  return (
    <View style={styles.root}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 70 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
        removeClippedSubviews={true}
      >
        {/* ══════════════ HERO CAROUSEL ══════════════ */}
        <View style={{ height: 432, position: 'relative' }}>
          <Carousel
            loop={true}
            width={width}
            height={432}
            autoPlay={true}
            windowSize={2}
            data={CAROUSEL_DATA}
            scrollAnimationDuration={800}
            onSnapToItem={(index) => setCurrentSlide(index)}
            renderItem={({ item }) => (
              <View style={{ flex: 1 }}>
                <Image
                  source={item.image}
                  style={{ position: 'absolute', width: '100%', height: '100%' }}
                  resizeMode="cover"
                />

                <View style={{ position: 'absolute', bottom: 25, left: 16 }}>
                  <View>
                    <Text style={styles.heroTitle} >{item.titleLine1} </Text>
                    <Text style={styles.heroTitle} >{item.titleLine2} </Text>
                    <Text style={styles.heroTitle}  >{item.titleLine3} </Text>
                  </View>
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.heroDesc}>{item.desc1}</Text>
                    <Text style={styles.heroDesc}>{item.desc2}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20 }}>
                    <TouchableOpacity style={[styles.contactBtn, { backgroundColor: item.gradient[1], marginTop: 0 }]} activeOpacity={0.8} onPress={() => router.push('/help-support' as any)}>
                      <Text style={[styles.contactBtnText, item.id === '4' && { color: '#000' }]}>Contact</Text>
                    </TouchableOpacity>

                    {userRole === 'CREATOR' && (
                      <TouchableOpacity
                        style={styles.communityBtn}
                        activeOpacity={0.8}
                        onPress={() => setCommunityModalVisible(true)}
                      >
                        <View style={styles.communityBtnInner}>
                          <HeroGradientText text="Creator Community" color={item.strokeColor} fontSize={14} />
                          <Feather name="arrow-up-right" size={20} color={item.gradient[1]} style={{ marginLeft: -4 }} />
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            )}
          />
          {/* Pagination Dots */}
          <View style={styles.paginationContainer}>
            {CAROUSEL_DATA.map((_, index) => (
              <View key={index} style={[styles.dot, currentSlide === index ? styles.activeDot : null]} />
            ))}
          </View>

          {/* ══════════════ FLOATING HEADER ══════════════ */}
          <View style={[styles.headerWrapper, { paddingTop: insets.top + 10 }]}>
            <BlurView intensity={15} tint="default" style={styles.floatingHeader}>
              {/* Subtle white glass sheen - top edge only */}
              <LinearGradient
                colors={['rgba(255,255,255,0.00)', 'rgba(255,255,255,0.00)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[StyleSheet.absoluteFillObject, { borderRadius: 999 }]}
              />
              {/* Inner glow ring */}
              <View style={styles.glassInnerGlow} pointerEvents="none" />
              <TouchableOpacity
                style={styles.floatingHeaderInner}
                activeOpacity={0.75}
                onPress={() => router.push('/(tabs)/profile' as any)}
              >
                <View style={styles.headerAvatarWrap}>
                  {userAvatar ? (
                    <Image source={{ uri: userAvatar }} style={styles.headerAvatar} />
                  ) : (
                    <Image source={require('../../assets/defaultavatar.png')} style={styles.headerAvatar} />
                  )}
                </View>
                <View style={{ marginLeft: 10, flexShrink: 1 }}>
                  <Text style={styles.headerName} numberOfLines={1} ellipsizeMode="tail">{userName || 'Hi, User'}</Text>
                  {userTagId ? (
                    <Text style={styles.headerTag} numberOfLines={1} ellipsizeMode="tail"><Text style={{ fontWeight: '600', color: '#fff' }}>{userTagId}</Text></Text>
                  ) : (
                    !userName ? <Text style={[styles.headerTag, { color: '#fff' }]}>Welcome To Digitag</Text> : null
                  )}
                </View>
              </TouchableOpacity>
            </BlurView>

            <View style={styles.headerRightIcons}>
              {/* Analytics Button - from Figma SVG */}
              <TouchableOpacity onPress={() => router.push('/analytics' as any)} activeOpacity={0.75}>
                {/* <Svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <G data-figma-bg-blur-radius="15">
                    <Mask id="path-1-inside-1_4770_5356" fill="white">
                      <Path d="M36 18C36 27.9411 27.9411 36 18 36C8.05887 36 0 27.9411 0 18C0 8.05887 8.05887 0 18 0C27.9411 0 36 8.05887 36 18Z" />
                    </Mask>
                    <Path d="M36 18C36 27.9411 27.9411 36 18 36C8.05887 36 0 27.9411 0 18C0 8.05887 8.05887 0 18 0C27.9411 0 36 8.05887 36 18Z" fill="white" fillOpacity={0.1} />
                    <Path
                      d="M36 18H35C35 27.3888 27.3888 35 18 35V36V37C28.4934 37 37 28.4934 37 18H36ZM18 36V35C8.61116 35 1 27.3888 1 18H0H-1C-1 28.4934 7.50659 37 18 37V36ZM0 18H1C1 8.61116 8.61116 1 18 1V0V-1C7.50659 -1 -1 7.50659 -1 18H0ZM18 0V1C27.3888 1 35 8.61116 35 18H36H37C37 7.50659 28.4934 -1 18 -1V0Z"
                      fill="white"
                      fillOpacity={0.5}
                      mask="url(#path-1-inside-1_4770_5356)"
                    />
                  </G>
                  <Path d="M9.42847 24.6392V20.4258" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  <Path d="M15.0447 24.6404V16.2136" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  <Path d="M20.6633 24.6393V11.9991" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  <Path d="M26.2793 24.6379V24.6499" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg> */}

                <Image source={require('../../assets/Analytics.png')} style={{ width: 36, height: 36 }} />
              </TouchableOpacity>

              {/* Notifications Button - from Figma SVG */}
              <TouchableOpacity onPress={() => router.push('/notifications' as any)} activeOpacity={0.75}>
                {/* <Svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <G data-figma-bg-blur-radius="15">
                    <Mask id="path-1-inside-1_4770_5352" fill="white">
                      <Path d="M36 18C36 27.9411 27.9411 36 18 36C8.05887 36 0 27.9411 0 18C0 8.05887 8.05887 0 18 0C27.9411 0 36 8.05887 36 18Z" />
                    </Mask>
                    <Path d="M36 18C36 27.9411 27.9411 36 18 36C8.05887 36 0 27.9411 0 18C0 8.05887 8.05887 0 18 0C27.9411 0 36 8.05887 36 18Z" fill="white" fillOpacity={0.1} />
                    <Path
                      d="M36 18H35C35 27.3888 27.3888 35 18 35V36V37C28.4934 37 37 28.4934 37 18H36ZM18 36V35C8.61116 35 1 27.3888 1 18H0H-1C-1 28.4934 7.50659 37 18 37V36ZM0 18H1C1 8.61116 8.61116 1 18 1V0V-1C7.50659 -1 -1 7.50659 -1 18H0ZM18 0V1C27.3888 1 35 8.61116 35 18H36H37C37 7.50659 28.4934 -1 18 -1V0Z"
                      fill="white"
                      fillOpacity={0.5}
                      mask="url(#path-1-inside-1_4770_5352)"
                    />
                  </G>
                  <G transform="translate(-31, -3)">
                    <Path d="M50.8879 29.4863C50.186 30.1058 49.2641 30.4816 48.2544 30.4816C47.2446 30.4816 46.3227 30.1058 45.6208 29.4863M54.2241 22.6986V19.5324C54.2241 16.2254 51.5613 13.5601 48.2544 13.5601C44.9474 13.5601 42.2485 16.1118 42.2485 19.5324V22.6771C42.2485 23.1581 42.1736 23.6358 42.0265 24.0921L41.2915 26.3731C41.2714 26.4355 41.3163 26.4355 41.3799 26.4355H55.0859C55.1532 26.4355 55.201 26.4344 55.1803 26.3704L54.4403 24.074C54.2971 23.6295 54.2241 23.1655 54.2241 22.6986Z" stroke="white" strokeWidth={1.2} strokeLinecap="round" />
                  </G>
                  {unreadCount > 0 && (
                    <Circle cx="22.7273" cy="12.0549" r="3" fill="#E43E3E" />
                  )}
                </Svg> */}

                <View>
                  <Image source={require('../../assets/notification.png')} style={{ width: 36, height: 36 }} />
                  {unreadCount > 0 && (
                    <View style={styles.notifBadge}>
                      <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Fade the hero carousel into the page background before the category section */}
          <LinearGradient
            colors={['transparent', '#060606']}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 }}
            pointerEvents="none"
          />
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 32 }}>
          {/* ══════════════ CATEGORIES BY ROLE ══════════════ */}
          <View style={{ marginBottom: 10 }}>
            <Text style={[styles.gradientHeadingText, { color: '#fff' }]}>
              {userRole === 'FREELANCER' ? 'Creators by Category' : 'Freelancers by Category'}
            </Text>
          </View>
          <View style={[styles.catCarouselContainer, { height: 230 }]}>
            <Animated.FlatList
              data={availableCategoryColumns}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={snapInterval}
              decelerationRate="fast"
              initialNumToRender={2}
              maxToRenderPerBatch={2}
              windowSize={3}
              contentContainerStyle={{ paddingHorizontal: 2, gap: catGap }}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollXCat } } }],
                { useNativeDriver: true }
              )}
              keyExtractor={(_, i) => `col-${i}`}
              renderItem={({ item: colItems }) => {
                const isFreelancer = userRole === 'FREELANCER';
                return (
                  <View style={[styles.catColumn, { gap: 14, width: 100 }]}>
                    {colItems.map((cat) => {
                      const globalIdx = isFreelancer
                        ? FREELANCER_CATEGORIES.findIndex(c => c.id === cat.id)
                        : CATEGORIES.findIndex(c => c.id === cat.id);
                      const borderColors = CAT_BORDER_COLORS[globalIdx % CAT_BORDER_COLORS.length] || ['#333', '#333'];

                      return (
                        <TouchableOpacity key={cat.id} style={styles.catGridItem} onPress={() => router.push({ pathname: '/(tabs)/explore', params: { category: cat.id } } as any)} activeOpacity={0.8}>
                          <LinearGradient
                            colors={borderColors as [string, string]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.catGradientBorder}
                          >
                            <View style={styles.catGridCard}>
                              {cat.image ? (
                                <Image source={cat.image} style={isFreelancer ? styles.catGridImgFreelancerChip : styles.catGridImgCreator} resizeMode="contain" />
                              ) : (
                                <Ionicons name={(cat as any).icon} size={28} color="#aaa" />
                              )}
                              <Text style={styles.catGridLabel}>{cat.label}</Text>
                            </View>
                          </LinearGradient>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              }}
            />
            {/* Pagination Dots */}
            {userRole !== 'FREELANCER' && (
              <View style={styles.catPagination}>
                {[0, 1].map((i) => {
                  const opacity = activeCatPage.interpolate({
                    inputRange: [i - 1, i, i + 1],
                    outputRange: [0.3, 1, 0.3],
                    extrapolate: 'clamp',
                  });
                  const scale = activeCatPage.interpolate({
                    inputRange: [i - 1, i, i + 1],
                    outputRange: [0.8, 1.2, 0.8],
                    extrapolate: 'clamp',
                  });
                  return (
                    <Animated.View
                      key={i}
                      style={[
                        styles.catDot,
                        { opacity, transform: [{ scale }] }
                      ]}
                    />
                  );
                })}
              </View>
            )}
          </View>
        </View>

        <View style={{ marginTop: 20, marginBottom: 10, paddingHorizontal: 16 }}>
          <Text style={[styles.gradientHeadingText, { color: '#fff' }]}>Recent Updates</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
        ) : cards.length === 0 ? (
          <Text style={{ color: '#fff', textAlign: 'center', marginTop: 30 }}>No posts found</Text>
        ) : (
          <LinearGradient
            colors={['transparent', userRole === 'FREELANCER' ? 'rgba(242, 105, 48, 0.10)' : 'rgba(237, 42, 145, 0.10)', userRole === 'FREELANCER' ? 'rgba(242, 105, 48, 0.15)' : 'rgba(237, 42, 145, 0.15)', 'transparent']}
            locations={[0, 0.3, 0.7, 1]}
            style={{ paddingVertical: 10 }}
          >
            <Animated.FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={ITEM_SIZE}
              snapToOffsets={carouselOffsets}
              decelerationRate="fast"
              snapToAlignment="center"
              disableIntervalMomentum={true}
              scrollEventThrottle={16}
              windowSize={21}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              removeClippedSubviews={true}
              contentContainerStyle={{ paddingHorizontal: (width - ITEM_SIZE) / 2 }}
              data={carouselData}
              keyExtractor={(item: any) => item._loopId}
              getItemLayout={(_, index) => ({
                length: ITEM_SIZE,
                offset: ITEM_SIZE * index,
                index,
              })}
              initialScrollIndex={cards.length >= 3 ? 1 : 0}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                { useNativeDriver: true }
              )}
              renderItem={({ item, index }) => (
                <CarouselCard
                  item={item}
                  index={index}
                  scrollX={scrollX}
                  ITEM_SIZE={ITEM_SIZE}
                  CARD_WIDTH={CARD_WIDTH}
                  handlePostTap={handlePostTap}
                  handleBookmark={handleBookmark}
                  handleSeePortfolio={handleSeePortfolio}
                  handleMessage={handleMessage}
                  handleCall={handleCall}
                  handleShare={handleShare}
                  handleCollab={handleCollab}
                  collabSentOwnerIds={collabSentOwnerIds}
                  acceptedCollabOwnerIds={acceptedCollabOwnerIds}
                  savedPostIds={savedPostIds}
                  userRole={userRole}
                />
              )}
            />
          </LinearGradient>
        )}

        {hasMoreHiddenPosts && (
          <View style={{ paddingHorizontal: 16, marginTop: 4, marginBottom: 12 }}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => requireProfile('see more posts')}
              style={{
                backgroundColor: '#0A0A0A',
                borderWidth: 1,
                borderColor: (userRole === 'FREELANCER' ? '#f26930' : '#ed2a91') + '55',
                borderRadius: 18,
                paddingVertical: 16,
                paddingHorizontal: 18,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text style={{ color: '#fff', fontFamily: 'Poppins_500Medium', fontSize: 14, flex: 1 }}>
                Complete your profile to see more posts
              </Text>
              <Ionicons name="chevron-forward" size={18} color={userRole === 'FREELANCER' ? '#f26930' : '#ed2a91'} />
            </TouchableOpacity>
          </View>
        )}

        <View style={{ paddingHorizontal: 16 }}>
          <TouchableOpacity
            style={styles.exploreNowContainer}
            onPress={() => router.push('/explore')}
          >
            <LinearGradient
              colors={['#FF611A', '#E526A6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.exploreNowBtnGrad}
            >
              <Text style={styles.exploreNowBtnText}>Explore now</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* ══════════════ CREATE POST ══════════════ */}
          {(userRole === 'CREATOR' || userRole === 'FREELANCER') && (
            <View style={{ marginTop: 20, marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Text style={[styles.gradientHeadingText, { color: '#fff' }]}>Create Post</Text>
                <Image
                  source={
                    userRole === 'FREELANCER'
                      ? require('../../assets/star-freelancer.png')
                      : require('../../assets/star-creator.png')
                  }
                  style={{ width: 28, height: 28, marginLeft: 6, marginTop: -6 }}
                  resizeMode="contain"
                />
              </View>
              <TouchableOpacity
                style={styles.createPostCard}
                activeOpacity={0.8}
                onPress={() => {
                  if (!requireProfile('create a post')) return;
                  router.push('/create-post' as any);
                }}
                onLayout={(e) => setCreatePostWidth(e.nativeEvent.layout.width)}
              >
                {createPostWidth > 0 && (
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                    <Svg height="100%" width="100%">
                      <Defs>
                        <SvgGradient id="dashedGrad" x1="0" y1="0" x2="1" y2="1">
                          <Stop offset="0" stopColor={userRole === 'FREELANCER' ? '#f26930' : '#ed2a91'} stopOpacity="1" />
                          <Stop offset="1" stopColor="#3b82f6" stopOpacity="1" />
                        </SvgGradient>
                      </Defs>
                      <Rect
                        x="0.5"
                        y="0.5"
                        width={createPostWidth - 1.5}
                        height={178.5}
                        rx={36}
                        ry={36}
                        stroke="url(#dashedGrad)"
                        strokeWidth="0.4"
                        strokeDasharray="8, 6"
                        fill="transparent"
                      />
                    </Svg>
                  </View>
                )}
                <Image
                  source={
                    userRole === 'FREELANCER'
                      ? require('../../assets/newpost-freelancer.png')
                      : require('../../assets/newpost.png')
                  }
                  style={{ width: 64, height: 64, marginBottom: 12 }}
                  resizeMode="contain"
                />
                <Text style={styles.createPostText}>Create Your Post</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>

        {/* ══════════════ BHARAT FIRST SECTION ══════════════ */}
        <View style={styles.bharatSection}>
          {/* Background SVG Lines */}
          <View style={{ position: 'absolute', top: -100, right: -80, bottom: 10, left: 50, opacity: 0.15 }}>
            <Svg width="100%" height="100%" viewBox="0 0 400 500" fill="none" preserveAspectRatio="none">
              <Path
                d="M0.000465703 500.92C0.000465703 500.92 153.908 500.666 210.353 423.461C268.027 344.577 147.742 288.158 206.128 209.733C257.903 140.188 352.938 201.986 395.598 127.761C423.42 79.3532 408.426 0.0919289 408.426 0.0919289"
                stroke="#F2AF1A"
                strokeWidth="1"
                transform="translate(0, 0)"
              />
              <Path
                d="M0.000465703 500.92C0.000465703 500.92 153.908 500.666 210.353 423.461C268.027 344.577 147.742 288.158 206.128 209.733C257.903 140.188 352.938 201.986 395.598 127.761C423.42 79.3532 408.426 0.0919289 408.426 0.0919289"
                stroke="#48D4A5"
                strokeWidth="1"
                transform="translate(25, 25)"
              />
              <Path
                d="M0.000465703 500.92C0.000465703 500.92 153.908 500.666 210.353 423.461C268.027 344.577 147.742 288.158 206.128 209.733C257.903 140.188 352.938 201.986 395.598 127.761C423.42 79.3532 408.426 0.0919289 408.426 0.0919289"
                stroke="#326CF9"
                strokeWidth="1"
                transform="translate(50, 50)"
              />
            </Svg>
          </View>
          {userRole === 'CREATOR' ? (
            <Image source={require('../../assets/love-creator.png')} style={{ width: 48, height: 48, marginBottom: 4 }} resizeMode="contain" />
          ) : userRole === 'FREELANCER' ? (
            <Image source={require('../../assets/love-freelancer.png')} style={{ width: 48, height: 48, marginBottom: 4 }} resizeMode="contain" />
          ) : (
            <Ionicons name="heart-outline" size={48} color={userRole === 'FREELANCER' ? '#f26930' : '#ed2a91'} style={{ marginBottom: 4 }} />
          )}
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.bharatTitleLine}>Bharat First</Text>
            <HeroGradientText
              text="Collaboration"
              gradientColors={['rgba(237, 42, 145, 1)', 'rgba(252, 97, 33, 1)']}
              fontSize={32}
              fontFamily="Poppins_700Bold"
              height={40}
              style={{ marginTop: 6 }}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
              <Text style={styles.bharatTitleLine}>Network For </Text>
              <HeroGradientText
                text={userRole === 'FREELANCER' ? 'Freelancers' : 'Creators'}
                gradientColors={['rgba(237, 42, 145, 1)', 'rgba(252, 97, 33, 1)']}
                fontSize={32}
                fontFamily="Poppins_700Bold"
                height={40}
              />
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', }}>
            <Text style={styles.bharatSubtitle}>All-in-one space for {userRole === 'FREELANCER' ? 'Freelancers' : 'creators'} </Text>
            <Image source={imgTargetNew} style={{ width: 22, height: 22, marginBottom: 10 }} />
          </View>
          <View style={{ flexDirection: 'row', marginVertical: 10 }}>
            <Text style={[styles.bharatDivider, { opacity: 0.6 }]}>----</Text>
            <Text style={[styles.bharatDivider, { opacity: 0.5 }]}>----</Text>
            <Text style={[styles.bharatDivider, { opacity: 0.4 }]}>----</Text>
            <Text style={[styles.bharatDivider, { opacity: 0.3 }]}>----------</Text>
            <Text style={[styles.bharatDivider, { opacity: 0.2 }]}>----</Text>
            <Text style={[styles.bharatDivider, { opacity: 0.1 }]}>----</Text>
            <Text style={[styles.bharatDivider, { opacity: 0 }]}>----</Text>
          </View>
          <Text style={styles.bharatSubtitle}>This is only the start</Text>

          <View style={styles.bharatBtnRow}>
            <TouchableOpacity
              style={[styles.bharatPinkBtn, { backgroundColor: userRole === 'FREELANCER' ? '#f26930' : '#ed2a91' }]}
              onPress={() => Linking.openURL('https://www.instagram.com/digitagapp/')}
            >
              <Text style={styles.bharatPinkBtnText}>Digitag_official</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bharatOutlineBtn, { borderColor: userRole === 'FREELANCER' ? '#f26930' : '#ed2a91' }]}
              onPress={() => Linking.openURL('https://wa.me/917680805720')}
            >
              <Ionicons name="logo-whatsapp" size={14} color="#ffffffff" />
              <Text style={styles.bharatOutlineBtnText}> </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bharatOutlineBtn, { borderColor: userRole === 'FREELANCER' ? '#f26930' : '#ed2a91', }]}
              onPress={() => Linking.openURL('tel:+917680805720')}
            >
              <Ionicons name="call-outline" size={18} color={userRole === 'FREELANCER' ? '#ffffffff' : '#ffffffff'} />
            </TouchableOpacity>
          </View>
        </View>

        <CommunityModal visible={communityModalVisible} onClose={() => setCommunityModalVisible(false)} />
      </ScrollView>

      {/* ══════════════ PORTFOLIO MODAL ══════════════ */}
      <Modal
        visible={portfolioModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPortfolioModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalDismissArea} activeOpacity={1} onPress={() => setPortfolioModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Feather name="link" size={20} color="#fff" />
                <Text style={styles.modalTitle}>Portfolio Links</Text>
              </View>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setPortfolioModalVisible(false)}>
                <Feather name="x" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
            {portfolioLoading ? (
              <ActivityIndicator color="#A78BFA" style={{ marginTop: 16 }} />
            ) : selectedPortfolioLink ? (
              <TouchableOpacity
                style={styles.portfolioLinkContainer}
                onPress={() => {
                  let url = selectedPortfolioLink;
                  if (!url.startsWith('http://') && !url.startsWith('https://')) { url = 'https://' + url; }
                  Linking.openURL(url);
                }}
              >
                <Text style={styles.portfolioLinkText}>{selectedPortfolioLink}</Text>
                <Feather name="arrow-up-right" size={20} color="#A78BFA" />
              </TouchableOpacity>
            ) : (
              <Text style={styles.noPortfolioText}>No portfolio link provided.</Text>
            )}
          </View>
        </View>
      </Modal>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
        role={userRole as any}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#060606',
  },
  scroll: {
    flex: 1,
  },
  notifBadge: {
    position: 'absolute', top: -2, right: -2,
    minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 3,
    backgroundColor: '#E43E3E', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#060606',
  },
  notifBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700', lineHeight: 11 },

  // HERO & HEADER
  headerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
    marginTop: 15,
  },
  floatingHeader: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    overflow: 'hidden',
    flexShrink: 1,
    marginRight: 10,
    // Clear glass: near-transparent white
    backgroundColor: 'rgba(255, 255, 255, 0)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  floatingHeaderInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,

    overflow: 'hidden',

    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',

    shadowColor: '#ed2a91',
    shadowOpacity: 0.2,
    shadowRadius: 10,

    elevation: 1,
  },
  headerAvatar: {
    width: '100%',
    height: '100%',

  },
  headerName: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    lineHeight: 16,
  },
  headerTag: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  headerRightIcons: {
    flexDirection: 'row',
    gap: 12,
    flexShrink: 0,
  },
  iconCircleDark: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 0,


  },
  glassInnerGlow: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: 999,

    borderColor: 'rgba(179,179,179,0.4)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 11,
  },
  glassInnerGlowCircle: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    borderRadius: 99,

    borderColor: 'rgba(179,179,179,0.4)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 11,
  },
  badge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,

  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },

  heroTitle: {
    color: '#fff',
    fontSize: 38,
    fontFamily: 'Poppins_800ExtraBold',
    lineHeight: 48,
  },
  heroDesc: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',

    lineHeight: 18,
  },
  contactBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 99,
    alignSelf: 'flex-start',
    marginTop: 20,

  },
  contactBtnText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',

  },
  communityBtn: {
    paddingHorizontal: 0,
    paddingVertical: 8,
    borderRadius: 99,
    alignSelf: 'flex-start',
  },
  communityBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  communityBtnText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,

  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 10,
    backgroundColor: '#828282',
  },
  activeDot: {
    width: 12,
    backgroundColor: '#ffffffff',
  },

  // CATEGORIES GRID
  gradientHeadingText: {
    color: '#ff6ab9',
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',

  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  catCarouselContainer: {
    height: 300,
  },
  catColumn: {
    gap: 14,
    width: 100,
  },
  catGridItem: {
    width: 100,
    height: 96,
  },
  catPagination: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 0,
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f9f4f6ff',
  },
  catGradientBorder: {
    width: 100,
    height: 96,
    borderRadius: 24,
    padding: 1,

  },
  catGridCard: {
    backgroundColor: '#050404',
    borderRadius: 22.8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 13,
    width: '100%',
    height: '100%',
  },
  catGridImgCreator: {
    width: 28,
    height: 24,
    marginBottom: 8,
  },
  catGridLabel: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    lineHeight: 14,
  },
  catGridImgFreelancerChip: {
    width: 26,
    height: 24,
    marginBottom: 4,
  },

  // RECENT UPDATES CARDS
  cardsList: {
    paddingHorizontal: (width - 280) / 2,
    gap: 16,
  },
  figmaCardGradientBorder: {
    width: 251,
    height: 350,
    borderRadius: 24,
    padding: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  figmaCard: {
    width: 248,
    height: 347,
    backgroundColor: '#28282a',
    borderRadius: 23.6,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  figmaCardTopRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  figmaCardRoleBadge: {
    backgroundColor: '#10151e',
    borderBottomRightRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  figmaCardRoleText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
  },
  figmaCardBookmarkBtn: {
    padding: 12,
  },
  figmaCardAvatarWrap: {
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2A2A32',
  },
  figmaCardAvatarImg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#1E1E24',
  },
  figmaCardName: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Poppins_500Medium',
    marginTop: 8,
  },
  figmaCardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  figmaCardPortfolioBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 99,
  },
  figmaCardPortfolioText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  figmaCardTimeText: {
    color: '#a1a2a4',
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
  },
  figmaCardDesc: {
    color: '#d1d2d4',
    fontSize: 11,
    fontFamily: 'Poppins_300Light',
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    lineHeight: 16,
  },
  figmaCardPrice: {
    color: '#00a401',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    marginTop: 12,
  },
  figmaCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    position: 'absolute',
    bottom: 20,
  },
  figmaCollabBtn: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ed2a91',
    borderRadius: 99,
    paddingVertical: 10,
  },
  figmaCollabBtnText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  figmaCardActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#373839',
    justifyContent: 'center',
    alignItems: 'center',
  },

  exploreNowContainer: {
    marginTop: 15,
    marginBottom: 40,
    alignSelf: 'center',
    shadowColor: '#FF4D66',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  exploreNowBtnGrad: {
    width: 224,
    height: 42,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exploreNowBtnText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Poppins_500Medium',
  },

  // CREATE POST
  createPostCard: {
    backgroundColor: '#1E1E24',
    borderRadius: 36,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
  },
  createPostIconWrap: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  createPostHeartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  createPostText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
  },

  // BHARAT FIRST SECTION
  bharatSection: {
    marginTop: 40,
    backgroundColor: '#111111',
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 120,
    marginBottom: 0,
  },
  bharatTitleLine: {
    color: '#fff',
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 40,
    letterSpacing: 0,
  },
  bharatSubtitle: {
    color: '#bbb',
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',

  },
  bharatDivider: {
    color: '#787474ff',
    fontSize: 14,
    fontFamily: 'Poppins_300Light',
    marginBottom: 8,
  },
  bharatBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
  },
  bharatPinkBtn: {
    backgroundColor: '#f26930',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  bharatPinkBtnText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  bharatOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f26930',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,


  },
  bharatOutlineBtnText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // CONTACT SECTION
  contactSection: {
    marginTop: 8,
    backgroundColor: '#111',
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 40,
  },
  contactSectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 4,
  },
  contactSectionSub: {
    color: '#888',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    marginBottom: 20,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 6,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1E1E24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: {
    color: '#888',
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
  },
  contactValue: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
  },
  contactDivider: {
    height: 1,
    backgroundColor: '#222',
    marginVertical: 10,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalContent: {
    height: '30%',
    backgroundColor: '#1E1E24',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    borderTopWidth: 1,
    borderColor: 'rgba(156,156,156,0.3)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  portfolioLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  portfolioLinkText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
  },
  noPortfolioText: {
    color: '#8A8A99',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    marginTop: 10,
  },
});
