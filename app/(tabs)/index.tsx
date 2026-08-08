import { matchesPortfolioCategory } from '@/constants/portfolioCategories';
import { useProfileGate } from '@/context/ProfileGateContext';
import { Feather, Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Linking,
  Modal,
  Platform,
  RefreshControl,
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
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Carousel from 'react-native-reanimated-carousel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Circle, Defs, Path, RadialGradient, Stop, Svg, LinearGradient as SvgGradient, Text as SvgText, SvgXml } from 'react-native-svg';
import { CREATOR_CAT_SVGS } from '../../assets/creator-cat';
import CustomAlert from '../../Components/ui/CustomAlert';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import { useNotificationCount } from '../../context/NotificationCountContext';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { buildCreatorSocialLinks, SocialLink } from '../../services/socialLinks';
import { cancelCollaboration, getFeed, getFullProfile, getSavedPostIds, getUserById, initiateCall, joinWaitlist, listCollaborations, openConversationWith, sendCollaboration, toggleSavePost } from '../../services/userService';
import { getRoleTheme, useRoleTheme } from '../../theme/useRoleTheme';

const { width } = Dimensions.get('window');

const CARD_WIDTH = 250;
const SPACING = 0;
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
const imgSocialMediaManager = require('../../assets/tabs-icons-freelancer/SocialMediaManager.png');
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


// Hero carousel images for Creator role and guest mode only — Freelancer
// keeps the original local slide images (see CAROUSEL_DATA below).
const CREATOR_HERO_IMAGES = [
  'https://digitag-web-media.s3.ap-south-1.amazonaws.com/Creator+1.png',
  'https://digitag-web-media.s3.ap-south-1.amazonaws.com/Creator+2.png',
  'https://digitag-web-media.s3.ap-south-1.amazonaws.com/Creator+3.png',
  'https://digitag-web-media.s3.ap-south-1.amazonaws.com/Creator+4.png',
];

// Hero carousel images for Freelancer role only. Title/description content
// for these is still the original CAROUSEL_DATA copy — pending replacement.
const FREELANCER_HERO_IMAGES = [
  'https://digitag-web-media.s3.ap-south-1.amazonaws.com/Freelancer+1.png',
  'https://digitag-web-media.s3.ap-south-1.amazonaws.com/Freelancer+2.png',
  'https://digitag-web-media.s3.ap-south-1.amazonaws.com/Freelancer+3.png',
  'https://digitag-web-media.s3.ap-south-1.amazonaws.com/Freelancer+4.png',
];

// Title/description text paired with the Creator hero images above — index
// for index, same as CREATOR_HERO_IMAGES. titleLine3 is intentionally
// omitted (these are 2-line headlines, unlike Freelancer's 3-line ones).
const CREATOR_HERO_CONTENT = [
  {
    titleLine1: 'Turn Content Into',
    titleLine2: 'Opportunities',
    desc1: 'Discover paid collaborations, grow your audience, and',
    desc2: 'make every post count with Digitag.',
  },
  {
    titleLine1: 'Collaborate With 100%',
    titleLine2: 'Verified Brands',
    desc1: 'Discover paid collaborations, grow your audience and',
    desc2: 'make every post count with Digitag.',
  },
  {
    titleLine1: 'Your Creator',
    titleLine2: 'Journey Starts Here',
    desc1: 'Build your profile, showcase your talent, and connect with',
    desc2: 'brands looking for creators like you.',
  },
  {
    titleLine1: 'Create Connect',
    titleLine2: 'Collaborate',
    desc1: 'Find the right brand partnerships, expand your reach and',
    desc2: 'unlock new opportunities.',
  },
];

// Title/description text paired with the Freelancer hero images above —
// index for index, same as FREELANCER_HERO_IMAGES. These titles are single
// line (titleLine2 left empty, guarded in render), unlike Creator's 2-line
// headlines.
const FREELANCER_HERO_CONTENT = [
  {
    titleLine1: 'Why Get Verified?',
    titleLine2: '',
    desc1: 'Unlock exclusive benefits with your Verified Badge.',
    desc2: '',
  },
  {
    titleLine1: 'Get Verified. Get Noticed.',
    titleLine2: '',
    desc1: 'Build trust, stand out from the crowd, and let clients',
    desc2: "know you're a genuine professional.",
  },
  {
    titleLine1: 'Find. Collaborate. Create.',
    titleLine2: '',
    desc1: 'Create your first post and showcase your talent.',
    desc2: '',
  },
  {
    titleLine1: 'Work Without Boundaries',
    titleLine2: '',
    desc1: 'Find freelance opportunities from anywhere, anytime.',
    desc2: '',
  },
];

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
  { id: 'social-media-manager', label: 'Social Media\nManager', image: imgSocialMediaManager, icon: 'share-social-outline' as const },
];

const FREELANCER_CATEGORIES = [
  { id: 'f1', label: 'Lifestyle &\nLiving', svgXml: CREATOR_CAT_SVGS['Lifestyle-Living'] },
  { id: 'f2', label: 'Tech', svgXml: CREATOR_CAT_SVGS['Tech'] },
  { id: 'f3', label: 'Education', svgXml: CREATOR_CAT_SVGS['Education'] },
  { id: 'f4', label: 'Photography', svgXml: CREATOR_CAT_SVGS['Photography'] },
  { id: 'f5', label: 'Food', svgXml: CREATOR_CAT_SVGS['Food'] },
  { id: 'f6', label: 'Health', svgXml: CREATOR_CAT_SVGS['Health'] },
  { id: 'f7', label: 'Automotive', svgXml: CREATOR_CAT_SVGS['Automotive'] },
  { id: 'f8', label: 'Comedy &\nMemes', svgXml: CREATOR_CAT_SVGS['Comedy-Memes'] },
  { id: 'f9', label: 'Entertainment', svgXml: CREATOR_CAT_SVGS['Entertainment'] },
  { id: 'f10', label: 'Gaming &\nAnime', svgXml: CREATOR_CAT_SVGS['Gaming-Anime'] },
  { id: 'f11', label: 'Learning', svgXml: CREATOR_CAT_SVGS['Learning'] },
  { id: 'f12', label: 'News, Media\n& Magazins', svgXml: CREATOR_CAT_SVGS['News-Media-Magazins'] },
  { id: 'f13', label: 'Sports', svgXml: CREATOR_CAT_SVGS['Sports'] },
  { id: 'f14', label: 'Travel', svgXml: CREATOR_CAT_SVGS['Travel'] },
  { id: 'f15', label: 'Beauty', svgXml: CREATOR_CAT_SVGS['Beauty'] },
  { id: 'f16', label: 'Fitness', svgXml: CREATOR_CAT_SVGS['Fitness'] },
  { id: 'f17', label: 'Fashion', svgXml: CREATOR_CAT_SVGS['Fashion'] },
  { id: 'f18', label: 'Finance &\nInvestments', svgXml: CREATOR_CAT_SVGS['Finance-Investments'] },
  { id: 'f19', label: 'Arts', svgXml: CREATOR_CAT_SVGS['Arts'] },
  { id: 'f20', label: 'Business &\nStartups', svgXml: CREATOR_CAT_SVGS['Business-Startups'] },
  { id: 'f21', label: 'Community\nPages', svgXml: CREATOR_CAT_SVGS['Community-Pages'] },
  { id: 'f22', label: 'Family, Kids\n& Pets', svgXml: CREATOR_CAT_SVGS['Family-Kids-Pets'] },
  { id: 'f23', label: 'Home &\nDecor', svgXml: CREATOR_CAT_SVGS['Home-Decor'] },
  { id: 'f24', label: 'Law, Rights\n& Activism', svgXml: CREATOR_CAT_SVGS['Law-Rights-Activism'] },
  { id: 'f25', label: 'Pets &\nAnimals', svgXml: CREATOR_CAT_SVGS['Pets-Animals'] },
  { id: 'f26', label: 'Politics', svgXml: CREATOR_CAT_SVGS['Politics'] },
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

// Ambient glow behind the hero carousel, pinned to its top-right corner.
// Figma: 551x551 circle, rgba(<role color>, 0.20), blur(132.5px).
// iOS only — RN's shadowRadius/shadowColor blur (the only way to get a
// soft colored glow like this) doesn't render the same way via Android's
// elevation-based shadow model, so this would look wrong there.
const GLOW_SIZE = 551;
const HeroGlow = ({ color }: { color: string }) => {
  if (Platform.OS !== 'ios') return null;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: -GLOW_SIZE / 2,
        right: -GLOW_SIZE / 2,
        width: GLOW_SIZE,
        height: GLOW_SIZE,
        borderRadius: GLOW_SIZE / 2,
        backgroundColor: color,
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 132.5,
      }}
    />
  );
};

// Hero carousel pagination dot — driven continuously by the carousel's
// onProgressChange value (not the discrete onSnapToItem index), so it stays
// in sync while dragging instead of only updating once a snap completes.
// Handles the circular wrap for loop={true} (e.g. dot 0 should also light up
// as progress approaches the end and wraps back to the start).
const HeroDot = ({ index, total, progress }: { index: number; total: number; progress: SharedValue<number> }) => {
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const p = ((progress.value % total) + total) % total;
    const rawDiff = Math.abs(p - index);
    const diff = Math.min(rawDiff, total - rawDiff, 1);
    return {
      opacity: 1 - diff * 0.7,
      transform: [{ scale: 1.2 - diff * 0.4 }],
    };
  });
  return <Reanimated.View style={[styles.dot, animatedStyle]} />;
};

const HeroGradientText = ({
  text,
  color,
  gradientColors,
  gradientStops,
  deg = 90,
  fontSize = 14,
  fontFamily = 'Poppins_600SemiBold',
  height,
  style,
}: {
  text: string;
  color?: string;
  gradientColors?: string[];
  gradientStops?: { offset: string; color: string }[];
  deg?: number;
  fontSize?: number;
  fontFamily?: string;
  height?: number;
  style?: any;
}) => {
  const widthVal = text.length * fontSize * 0.6;
  const heightVal = height ?? fontSize * 1.5;
  const gradId = React.useMemo(() => `heroGrad_${text.replace(/[^a-zA-Z0-9]/g, '')}`, [text]);

  const { x1, y1, x2, y2 } = React.useMemo(() => {
    const angleInRad = ((deg - 90) * Math.PI) / 180;
    const x = Math.cos(angleInRad);
    const y = Math.sin(angleInRad);
    return {
      x1: `${((0.5 - x / 2) * 100).toFixed(2)}%`,
      y1: `${((0.5 - y / 2) * 100).toFixed(2)}%`,
      x2: `${((0.5 + x / 2) * 100).toFixed(2)}%`,
      y2: `${((0.5 + y / 2) * 100).toFixed(2)}%`,
    };
  }, [deg]);

  const stops = React.useMemo(() => {
    if (gradientStops && gradientStops.length >= 2) {
      return gradientStops.map((st, idx) => (
        <Stop key={idx} offset={st.offset} stopColor={st.color} stopOpacity="1" />
      ));
    }
    if (gradientColors && gradientColors.length >= 2) {
      return gradientColors.map((col, idx) => (
        <Stop key={idx} offset={`${idx / (gradientColors.length - 1)}`} stopColor={col} stopOpacity="1" />
      ));
    }
    return [
      <Stop key="0" offset="0" stopColor="#FFFFFF" stopOpacity="1" />,
      <Stop key="1" offset={color ? "1" : "0"} stopColor={color || '#FFFFFF'} stopOpacity="1" />
    ];
  }, [gradientStops, gradientColors, color]);

  return (
    <View style={[{ width: widthVal, height: heightVal }, style]}>
      <Svg height="100%" width="100%" viewBox={`0 0 ${widthVal} ${heightVal}`}>
        <Defs>
          <SvgGradient id={gradId} x1={x1} y1={y1} x2={x2} y2={y2}>
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

// Soft circular glow — an SVG radial gradient fading to transparent, instead of
// a solid circle + CSS `filter: blur()`. RN's `filter` style is web-only and
// silently no-ops on iOS, which rendered these as hard-edged solid circles
// ("bulbs") instead of a soft glow. This works identically on iOS and Android.
const GlowCircle = ({ size, color, opacity = 1, style }: { size: number; color: string; opacity?: number; style?: any }) => {
  const gradId = React.useMemo(() => `glow_${Math.random().toString(36).slice(2, 10)}`, []);
  return (
    <View pointerEvents="none" style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={gradId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
            <Stop offset="55%" stopColor={color} stopOpacity={opacity * 0.45} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${gradId})`} />
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
  const { token } = useAuth();
  const [notifyNumber, setNotifyNumber] = useState('');
  const [notifyBusy, setNotifyBusy] = useState(false);
  const [notifyJoined, setNotifyJoined] = useState(false);

  const handleNotifyMe = async () => {
    const number = notifyNumber.trim();
    if (!/^[0-9]{10}$/.test(number)) {
      Alert.alert('Invalid Number', 'Enter a valid 10-digit mobile number.');
      return;
    }
    setNotifyBusy(true);
    const res = await joinWaitlist(number, token);
    setNotifyBusy(false);
    if (res.success) {
      setNotifyJoined(true);
      setNotifyNumber('');
    } else {
      Alert.alert('Could Not Join', res.error || 'Please try again.');
    }
  };

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
                placeholder={notifyJoined ? "You're on the list!" : 'Enter your number for updates'}
                placeholderTextColor="rgba(255,255,255,0.4)"
                style={{ flex: 1, marginLeft: 10, color: '#fff', fontFamily: 'Poppins_400Regular', fontSize: 13 }}
                keyboardType="numeric"
                maxLength={10}
                value={notifyNumber}
                onChangeText={setNotifyNumber}
              />
            </View>
            <TouchableOpacity
              style={{ height: 56, borderRadius: 16, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#6C63FF', opacity: notifyBusy ? 0.6 : 1 }}
              onPress={handleNotifyMe}
              disabled={notifyBusy || notifyJoined}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'Poppins_600SemiBold' }}>
                {notifyJoined ? '✓ Added' : notifyBusy ? '...' : 'Notify Me'}
              </Text>
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

// Display-only formatting for the price pill's budget figure — turns each
// run of digits into "K" notation (5000 -> 5K, 12500 -> 12.5K) so a range
// like "5000-10000" becomes "5K-10K". Doesn't touch the underlying budget
// value anywhere else, purely how this one pill renders it.
const formatBudgetK = (value: string | number) => {
  return String(value).replace(/\d+/g, (match) => {
    const num = parseInt(match, 10);
    if (num < 1000) return match;
    const k = num / 1000;
    return `${Number.isInteger(k) ? k : k.toFixed(1)}K`;
  });
};

// Optimization: Memoized Carousel Card component to prevent re-renders
const CarouselCard = React.memo(({ item, index, scrollX, ITEM_SIZE, CARD_WIDTH, handlePostTap, handleBookmark, handleMessage, handleCall, handleShare, handleCollab, handleCancelCollab, collabSentPostIds, cancellingCollabPostId, acceptedCollabPostIds, completedCollabPostIds, savedPostIds, userRole }: any) => {
  const [descMeasured, setDescMeasured] = React.useState(false);
  const [descTruncated, setDescTruncated] = React.useState(false);
  const [descCutLength, setDescCutLength] = React.useState(0);

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
  const isCreatorOwner = (item.ownerRole || '').toUpperCase() === 'CREATOR';
  const expertBadgeBg = isCreatorOwner ? '#460628' : '#4C2409';
  const expertBadgeGradient = isCreatorOwner
    ? ['rgba(237, 42, 145, 1)', 'rgba(206, 10, 113, 1)', 'rgba(175, 4, 95, 1)']
    : ['rgba(255, 152, 42, 1)', 'rgba(245, 136, 92, 1)', 'rgba(227, 86, 28, 1)'];

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

            {/* Bookmark */}
            <TouchableOpacity
              style={styles.figmaCardBookmarkBtn}
              onPress={() => handleBookmark(item.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Image
                source={require('../../assets/Save.png')}
                style={styles.figmaCardBookmarkIcon}
                resizeMode="contain"
              />
              {/* Filled bookmark (transparent bg, flood-filled from Save.png's
                  outline) layered on top so the "saved" state reads as a
                  solid filled icon, not just a recolored outline — the dark
                  circle underneath stays untouched. */}
              {savedPostIds?.has(item.id) && (
                <Image
                  source={require('../../assets/SaveFilled.png')}
                  style={[styles.figmaCardBookmarkIcon, { position: 'absolute', tintColor: postColor }]}
                  resizeMode="contain"
                />
              )}
            </TouchableOpacity>

            {/* Avatar */}
            <View style={styles.figmaCardAvatarWrap}>
              <Image
                source={item.isInitials ? require('../../assets/images/icon.png') : { uri: item.avatarUri }}
                style={styles.figmaCardAvatarImg}
                resizeMode="cover"
              />
              {/* Portfolio work-sample thumbnail badge — freelancer portfolio
                  categories only, see portfolioThumb in the cards mapping. */}
              {!!item.portfolioThumb && (
                <Image source={{ uri: item.portfolioThumb }} style={styles.figmaCardPortfolioBadge} resizeMode="cover" />
              )}
            </View>

            {/* Name */}
            <Text style={styles.figmaCardName} numberOfLines={1} ellipsizeMode="tail">
              {item.name}
            </Text>

            {/* Role + Experience badge */}
            <View style={styles.figmaCardRoleRow}>
              <Text style={styles.figmaCardRoleText} numberOfLines={1}>{item.role}</Text>
              {!!item.experience && (
                <LinearGradient
                  colors={expertBadgeGradient as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.figmaCardExpertBadgeGradient}
                >
                  <View style={[styles.figmaCardExpertBadge, { backgroundColor: expertBadgeBg }]}>
                    <MaskedView
                      style={{ width: 12, height: 12, marginBottom:3 }}
                      maskElement={<Ionicons name="star" size={12} color="#000" />}
                    >
                      <LinearGradient
                        colors={expertBadgeGradient as any}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ width: 12, height: 12 }}
                      />
                    </MaskedView>
                    <Text style={[styles.figmaCardExpertText, { color: '#fff' }]} numberOfLines={1}>{item.experience}</Text>
                  </View>
                </LinearGradient>
              )}
            </View>

            {/* A Freelancer's post shows their own profile category ("I'm a
                Videographer"); a Creator's post shows the category of
                freelancer they want ("I'm Looking for a Videographer") —
                same rule as Explore/post-detail. */}
            {(() => {
              const isFreelancerOwner = item.ownerRole === 'FREELANCER';
              const displayCategory = isFreelancerOwner ? (item.ownerCategoryNames?.[0] || '') : item.postCategory;
              if (!displayCategory) return null;
              return (
                <View style={styles.lookingForRow}>
                  <Text style={styles.lookingForLabel}>{isFreelancerOwner ? "I'm a" : "I'm Looking for"}</Text>
                  <View style={styles.lookingForPill}>
                    <Text style={styles.lookingForPillText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{displayCategory}</Text>
                  </View>
                </View>
              );
            })()}

            {/* Description (body only — the post title is never shown here).
                Capped at 3 lines. The bottom action row is no longer
                position:absolute (see the flexible spacer below), so a
                full 3-line description no longer overlaps it — content and
                the button now share the card's height via normal flow
                instead of competing for the same fixed offset. "See more"
                only appears when the text actually overflows 3 lines —
                measured via a hidden, unclamped layer since onTextLayout
                reports already-clamped lines once numberOfLines is set. The
                visible text is then cut by character count (not
                numberOfLines) once truncated, because numberOfLines' own
                ellipsis clamp would cut the whole Text tree at the line
                limit — including the nested "See more" Text appended after
                it — silently swallowing the link. */}
            {!!item.desc && (
              <View>
                {!descMeasured && (
                  <Text
                    style={[styles.figmaCardDesc, { position: 'absolute', left: 0, right: 0, opacity: 0 }]}
                    onTextLayout={(e) => {
                      const lines = e.nativeEvent.lines;
                      if (lines.length > 3) {
                        let len = 0;
                        for (let i = 0; i < 3; i++) len += lines[i].text.length;
                        setDescCutLength(len);
                        setDescTruncated(true);
                      }
                      setDescMeasured(true);
                    }}
                  >
                    {item.desc}
                  </Text>
                )}
                <Text style={styles.figmaCardDesc} numberOfLines={descTruncated ? undefined : 3}>
                  {descTruncated
                    ? `${item.desc.slice(0, Math.max(0, descCutLength - 12)).trimEnd()}... `
                    : item.desc}
                  {descTruncated && (
                    <Text style={[styles.figmaCardSeeMore, { color: postColor }]}>See more</Text>
                  )}
                </Text>
              </View>
            )}

            {/* Meta pills: price + time */}
            <View style={styles.figmaCardPillRow}>
              <View style={[styles.figmaCardPricePill, { backgroundColor: item.price === 'Paid Collab' ? 'rgba(90,191,57,0.16)' : 'rgba(167,139,250,0.16)', borderColor: item.price === 'Paid Collab' ? 'rgba(90,191,57,1)' : 'rgba(167,139,250,0.16)' }]}>
                <Ionicons name={item.price === 'Paid Collab' ? 'wallet' : 'gift-outline'} size={12} color={item.price === 'Paid Collab' ? '#5abf39' : '#a78bfa'} />
                <Text
                  style={[styles.figmaCardPricePillText, { color: item.price === 'Paid Collab' ? '#5abf39' : '#a78bfa' }]}
                  numberOfLines={1}
                >
                  {item.price === 'Paid Collab' && item.budget ? `Starts from ₹${formatBudgetK(String(item.budget).replace(/^₹\s*/, ''))}` : (item.price === 'Paid Collab' ? 'Paid Collab' : 'Free Collab')}
                </Text>
              </View>
              <View style={styles.figmaCardTimePill}>
                <Ionicons name="time-outline" size={12} color="#a1a2a4" />
                <Text style={styles.figmaCardTimePillText} numberOfLines={1}>{item.time}</Text>
              </View>
            </View>

            {/* Flexible spacer — pushes the bottom action row to the card's
                bottom edge regardless of how tall the content above it is,
                so short descriptions don't leave a big dead gap and long
                ones never overlap the button (both were happening with the
                old position:absolute bottom row, which sat at a fixed
                offset no matter what). */}
            <View style={{ flex: 1 }} />

            {/* Bottom Actions */}
            <View style={styles.figmaCardBottomRow}>
              {completedCollabPostIds?.has(item.id) ? (
                <View style={[styles.figmaCardRequestBtn, { backgroundColor: '#246307' }]}>
                  <Ionicons name="checkmark-circle-outline" size={14} color="#fff" />
                  <Text style={styles.figmaCardRequestBtnText}>Collaborated</Text>
                </View>
              ) : acceptedCollabPostIds?.has(item.id) ? (
                <View style={styles.figmaCardIconActionsRow}>
                  <TouchableOpacity onPress={() => handleMessage(item.ownerId)} activeOpacity={0.75} style={styles.figmaCardIconAction}>
                    <Ionicons name="chatbubble-ellipses-outline" size={16} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleCall(item.ownerId)} activeOpacity={0.75} style={styles.figmaCardIconAction}>
                    <Ionicons name="call-outline" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : collabSentPostIds?.has(item.id) ? (
                <TouchableOpacity
                  style={[styles.figmaCardRequestBtn, { backgroundColor: postColor, opacity: cancellingCollabPostId === item.id ? 0.6 : 1 }]}
                  onPress={() => handleCancelCollab(item.id)}
                  activeOpacity={0.8}
                  disabled={cancellingCollabPostId === item.id}
                >
                  <Ionicons name="close-circle-outline" size={14} color="#fff" />
                  <Text style={styles.figmaCardRequestBtnText} numberOfLines={1}>
                    Sent · Tap to Cancel
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.figmaCardRequestBtn, { backgroundColor: postColor }]}
                  onPress={() => handleCollab(item.ownerId, item.id)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={require('../../assets/collaborate.png')}
                    style={{ width: 14, height: 14, tintColor: '#fff' }}
                    resizeMode="contain"
                  />
                  <Text style={styles.figmaCardRequestBtnText} numberOfLines={1}>
                    Collaborate
                  </Text>
                </TouchableOpacity>
              )}
            </View>
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
  const call = useCall();
  const theme = useRoleTheme();
  const insets = useSafeAreaInsets();

  // Hero carousel: Creator role and guest mode show the S3 creator images
  // with their matching headline/description; Freelancer shows the S3
  // freelancer images with its own matching headline/description.
  const heroCarouselData = useMemo(() => {
    if (userRole === 'FREELANCER') {
      return CAROUSEL_DATA.map((item, i) => ({
        ...item,
        ...FREELANCER_HERO_CONTENT[i],
        titleLine3: '',
        image: { uri: FREELANCER_HERO_IMAGES[i] },
      }));
    }
    return CAROUSEL_DATA.map((item, i) => ({
      ...item,
      ...CREATOR_HERO_CONTENT[i],
      titleLine3: '',
      image: { uri: CREATOR_HERO_IMAGES[i] },
    }));
  }, [userRole]);

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>('');
  const [userTagId, setUserTagId] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const { unreadCount } = useNotificationCount();
  const [acceptedCollabPostIds, setAcceptedCollabPostIds] = useState<Set<string>>(new Set());
  // Maps postId -> collaboration id, not just a Set, so a pending request can
  // be cancelled (DELETE /collaborations/:id) directly from this card.
  const [collabSentPostIds, setCollabSentPostIds] = useState<Map<string, string>>(new Map());
  const [cancellingCollabPostId, setCancellingCollabPostId] = useState<string | null>(null);
  const [completedCollabPostIds, setCompletedCollabPostIds] = useState<Set<string>>(new Set());
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const [portfolioModalVisible, setPortfolioModalVisible] = useState(false);
  const [selectedPortfolioLink, setSelectedPortfolioLink] = useState<string | null>(null);
  const [selectedSocialLinks, setSelectedSocialLinks] = useState<SocialLink[] | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);

  // Continuous carousel scroll position (via onProgressChange), driving the
  // pagination dots in real time instead of only on snap completion.
  const heroProgress = useSharedValue(0);
  const [communityModalVisible, setCommunityModalVisible] = useState(false);

  // Filter categories based on role: show only first 4 for Freelancers, all 8 for others.
  const availableCategoryColumns = useMemo((): any[][] => {
    if (userRole === 'FREELANCER') {
      const cols: any[][] = [];
      const mid = Math.ceil(FREELANCER_CATEGORIES.length / 2);
      for (let i = 0; i < mid; i++) {
        cols.push([
          FREELANCER_CATEGORIES[i],
          FREELANCER_CATEGORIES[i + mid]
        ].filter(Boolean));
      }
      return cols;
    }
    const cols: any[][] = [];
    const mid = Math.ceil(CATEGORIES.length / 2);
    for (let i = 0; i < mid; i++) {
      cols.push([
        CATEGORIES[i],
        CATEGORIES[i + mid]
      ].filter(Boolean));
    }
    return cols;
  }, [userRole]);

  const catGap = userRole === 'FREELANCER' ? 2 : 2;
  const colWidth = 100;
  const snapInterval = userRole === 'FREELANCER' ? colWidth + catGap : colWidth * 2 + 14 * 2;

  const scrollXCat = useRef(new Animated.Value(0)).current;
  // Memoized so the node keeps a stable identity across re-renders — this
  // component re-renders often, and Animated.divide() would otherwise
  // produce a brand-new node every time, constantly retriggering the
  // listener effect below and starving catPageIndex of real updates.
  const activeCatPage = useMemo(() => Animated.divide(scrollXCat, snapInterval), [scrollXCat, snapInterval]);

  // Instagram-style paginator: only CAT_MAX_DOTS dots fit in the visible
  // "viewport"; the rest of the strip sits clipped outside it. Rather than
  // discretely swapping which dots are rendered (which pops instead of
  // scrolling), the whole dot row is one Animated.View whose translateX is
  // interpolated straight off activeCatPage — so as you drag the category
  // list, the next dot smoothly slides into view exactly in step with the
  // scroll, like a real scrolling pagination strip.
  // Creator/guest's "Freelancers by Category" list (5 pages) shows a tighter
  // 2-dot strip; Freelancer's "Creators by Category" list (13 pages) keeps 4.
  const CAT_MAX_DOTS = userRole === 'FREELANCER' ? 4 : 2;
  const CAT_DOT_SIZE = 8;
  const CAT_DOT_GAP = 6;

  const totalCatPages = availableCategoryColumns.length;
  const catViewportWidth = CAT_MAX_DOTS * CAT_DOT_SIZE + (CAT_MAX_DOTS - 1) * CAT_DOT_GAP;
  const catFullRowWidth = totalCatPages * CAT_DOT_SIZE + Math.max(0, totalCatPages - 1) * CAT_DOT_GAP;
  const catMaxScroll = Math.max(0, catFullRowWidth - catViewportWidth);
  const catNeedsScroll = totalCatPages > CAT_MAX_DOTS;
  const catDotsTranslateX = catNeedsScroll
    ? activeCatPage.interpolate({
      inputRange: [0, CAT_MAX_DOTS - 1, totalCatPages - 1],
      outputRange: [0, 0, -catMaxScroll],
      extrapolate: 'clamp',
    })
    : 0;
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

  const fetchPosts = useCallback(async () => {
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
  }, [token, isGuest, isProfileCompleted]);

  const fetchUser = useCallback(async () => {
    if (isGuest || !token) { setUserName('Guest'); return; }
    const res = await getFullProfile(token);
    if (res.success && res.data?.profile) {
      const p = res.data.profile;
      setUserName(p.name || '');
      setUserTagId(p.tagId || null);
      setUserAvatar(p.profilePicture || null);
    }
  }, [isGuest, token]);

  const fetchCollabInfo = useCallback(async () => {
    if (!token || isGuest) return;
    const res = await listCollaborations(token, { direction: 'all' });
    if (res.success && Array.isArray(res.data)) {
      const accepted = new Set<string>();
      const sent = new Map<string, string>();
      const completed = new Set<string>();
      res.data.forEach((r: any) => {
        // Post-scoped — a Creator can have multiple posts, and an accepted
        // collaboration on one of them must only unlock chat/call for that
        // specific post, not every other post they've made (a single post's
        // collaboration isn't a blanket relationship across all their posts).
        if (r.status === 'ACCEPTED' && r.postId) accepted.add(r.postId);
        // Post-scoped, same reasoning — a pending request on one post
        // must not show "Request Sent" on that owner's other posts too.
        if (r.status === 'PENDING' && r.senderId === userId && r.postId) sent.set(r.postId, r.id);
        // Also post-scoped — once the Creator marks this specific
        // collaboration complete, this card must show "Collaborated"
        // instead of falling back to the plain Collaborate button (which
        // otherwise looks like the request never happened, since
        // completed collabs drop out of `accepted` above).
        if (r.status === 'COMPLETED' && r.postId) completed.add(r.postId);
      });
      setAcceptedCollabPostIds(accepted);
      setCollabSentPostIds(sent);
      setCompletedCollabPostIds(completed);
    }
  }, [token, isGuest, userId]);

  const fetchSavedIds = useCallback(async () => {
    if (!token || isGuest) return;
    const res = await getSavedPostIds(token);
    if (res.success && Array.isArray(res.data)) {
      setSavedPostIds(new Set(res.data));
    }
  }, [token, isGuest]);

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
      fetchUser();
      fetchCollabInfo();
      fetchSavedIds();
    }, [fetchPosts, fetchUser, fetchCollabInfo, fetchSavedIds])
  );

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchPosts(), fetchUser(), fetchCollabInfo(), fetchSavedIds()]);
    setRefreshing(false);
  }, [fetchPosts, fetchUser, fetchCollabInfo, fetchSavedIds]);
  const pullToRefresh = usePullToRefresh(onRefresh, refreshing);

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
    if (!requireProfile('save this post') || !token) return;
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
    if (!requireProfile('message this user') || !token) return;
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
    if (!requireProfile('call this user') || !token) return;
    if (!calleeId) return;
    if (call.callMode !== 'idle') { call.resume(); return; }
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
    setSelectedSocialLinks(null);
    setPortfolioLoading(true);
    setPortfolioModalVisible(true);
    try {
      if (!ownerId) { setPortfolioLoading(false); return; }
      const res = await getUserById(ownerId, token);
      if (!res.success) return;
      // Creators don't have a real portfolio (no portfolio-image upload, no
      // portfolio URL field in creator signup) — show their social accounts
      // instead of an always-empty portfolio-link modal.
      if (ownerRole === 'CREATOR') {
        setSelectedSocialLinks(buildCreatorSocialLinks(res.data));
        return;
      }
      const profileData = res.data?.creatorProfile || res.data?.freelancerProfile;
      const link = profileData?.portfolioUrl || profileData?.portfolio || profileData?.portfolioLink || null;
      setSelectedPortfolioLink(link);
    } catch (e) {
      setSelectedPortfolioLink(null);
    } finally {
      setPortfolioLoading(false);
    }
  };

  const handleCollab = async (ownerId?: string, postId?: string) => {
    if (!requireProfile('send a collaboration') || !token) return;
    if (!ownerId) return;
    if (postId && collabSentPostIds.has(postId)) return;
    try {
      const res = await sendCollaboration(token, { receiverId: ownerId, postId, message: 'I would love to collaborate with you!' });
      if (res.success) {
        if (postId && (res as any).data?.id) {
          setCollabSentPostIds(prev => new Map(prev).set(postId, (res as any).data.id));
        }
      } else {
        showAlert('Collab Error', res.error || 'Could not send collaboration request.');
      }
    } catch {
      showAlert('Error', 'Failed to send collaboration request.');
    }
  };

  const handleCancelCollab = (postId?: string) => {
    if (!token || !postId) return;
    const collabId = collabSentPostIds.get(postId);
    if (!collabId || cancellingCollabPostId) return;
    Alert.alert(
      'Cancel request?',
      'This will withdraw your collaboration request. You can send a new one later.',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel Request',
          style: 'destructive',
          onPress: async () => {
            setCancellingCollabPostId(postId);
            try {
              const res = await cancelCollaboration(token, collabId);
              if (res.success !== false) {
                setCollabSentPostIds(prev => {
                  const next = new Map(prev);
                  next.delete(postId);
                  return next;
                });
              } else {
                showAlert('Error', (res as any).error || 'Could not cancel the request.');
              }
            } catch {
              showAlert('Error', 'Could not cancel the request.');
            } finally {
              setCancellingCollabPostId(null);
            }
          },
        },
      ],
    );
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
    // create-post.tsx no longer has a separate Title field — description is
    // just the post body now, shown as-is.
    const descBody = String(post.description || '');
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
      experience: owner.experience || '',
      // A Freelancer's post shows their own profile category ("I'm a
      // Videographer"); a Creator's post shows the post's own selected
      // category — the category of freelancer they want ("I'm Looking for
      // a Videographer"). Same rule as Explore/post-detail.
      postCategory: post.category || '',
      ownerCategoryNames: Array.isArray(owner.categoryNames) ? owner.categoryNames : [],
      desc: descBody,
      price: post.collaborationType === 'PAID' ? 'Paid Collab' : 'Free Collab',
      budget: post.budget || null,
      time: getTimeAgo(post.createdAt),
      portfolioLink: owner.portfolio || owner.portfolioLink || owner.portfolioUrl || null,
      // Small thumbnail badge on the avatar — freelancer portfolio categories
      // only (Photography, Property Rental, Fashion Designers, Models,
      // Styling & Makeup), same gating as Explore's card carousel.
      portfolioThumb: owner.role === 'FREELANCER' && matchesPortfolioCategory(owner.categoryNames)
        ? ((Array.isArray(post.imageUrls) && post.imageUrls[0]) || post.imageUrl || null)
        : null,
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

      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 70 }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        scrollEventThrottle={16}
        {...(Platform.OS === 'ios'
          ? { onScroll: pullToRefresh.onScroll, onScrollEndDrag: pullToRefresh.onScrollEndDrag }
          : { refreshControl: <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ED2A91" /> })}
      >
        {Platform.OS === 'ios' && (
          <Animated.View
            pointerEvents="none"
            style={[{ position: 'absolute', top: 14, left: 0, right: 0, alignItems: 'center', zIndex: 50 }, pullToRefresh.indicatorStyle]}
          >
            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(20,20,20,0.85)', alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color="#ED2A91" size="small" />
            </View>
          </Animated.View>
        )}
        <Animated.View style={Platform.OS === 'ios' ? pullToRefresh.contentStyle : undefined}>
        {/* ══════════════ HERO CAROUSEL ══════════════ */}
        <View style={{ height: 432, position: 'relative' }}>
          {/* <HeroGlow color={theme.softStrong} /> */}
          <Carousel
            loop={true}
            width={width}
            height={432}
            autoPlay={true}
            windowSize={2}
            data={heroCarouselData}
            scrollAnimationDuration={800}
            onProgressChange={(_, absoluteProgress) => {
              heroProgress.value = absoluteProgress;
            }}
            renderItem={({ item }) => (
              <View style={{ flex: 1 }}>
                <Image
                  source={item.image}
                  style={{ position: 'absolute', width: '100%', height: '100%' }}
                  resizeMode="cover"
                />

                {/* Same centered placement/styling for both roles. */}
                <View style={{ position: 'absolute', bottom: 25, left: 0, right: 0, alignItems: 'center', paddingHorizontal: 24 }}>
                  <View style={{ alignItems: 'center', width: '100%' }}>
                    <Text style={[styles.heroTitle, { textAlign: 'center', width: '100%' }]}>{item.titleLine1} </Text>
                    {!!item.titleLine2 && <Text style={[styles.heroTitle, { textAlign: 'center', width: '100%' }]}>{item.titleLine2} </Text>}
                    {!!item.titleLine3 && <Text style={[styles.heroTitle, { textAlign: 'center', width: '100%' }]}>{item.titleLine3} </Text>}
                  </View>
                  <View style={{ marginTop: 12, alignItems: 'center', width: '100%' }}>
                    <Text style={[styles.heroDesc, { textAlign: 'center', width: '100%' }]}>{item.desc1}</Text>
                    {!!item.desc2 && <Text style={[styles.heroDesc, { textAlign: 'center', width: '100%' }]}>{item.desc2}</Text>}
                  </View>
                  {/* Contact + Create Community — commented out for both Freelancer and
                      Creator roles per request. Do not delete; functionality (help-support
                      link, CommunityModal) is left intact for a future re-enable. */}
                  {/* <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20 }}>
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
                  </View> */}
                </View>
              </View>
            )}
          />
          {/* Pagination Dots */}
          <View style={styles.paginationContainer}>
            {heroCarouselData.map((_, index) => (
              <HeroDot key={index} index={index} total={heroCarouselData.length} progress={heroProgress} />
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
              {/* Search Button */}
              <TouchableOpacity onPress={() => router.push('/searchbar' as any)} activeOpacity={0.75}>
                <Image source={require('../../assets/search.png')} style={{ width: 36, height: 36 }} />
              </TouchableOpacity>

              {/* Analytics Button - from Figma SVG */}
              <TouchableOpacity onPress={() => { if (requireProfile('view analytics')) router.push('/analytics' as any); }} activeOpacity={0.75}>
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
          {/* <LinearGradient
            colors={['transparent', '#060606']}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 }}
            pointerEvents="none"
          /> */}
        </View>

        <View style={{ paddingHorizontal: 10, paddingTop: 32 }}>
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
                  <View style={[styles.catColumn, { gap: 10, width: 100 }]}>
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
                              {(cat as any).svgXml ? (
                                <SvgXml xml={(cat as any).svgXml} width={25} height={25} style={styles.catGridImgFreelancerChip} />
                              ) : (cat as any).image ? (
                                <Image source={(cat as any).image} style={styles.catGridImgCreator} resizeMode="contain" />
                              ) : (
                                <Ionicons name={(cat as any).icon} size={28} color="#aaa" />
                              )}
                              <Text
                                style={styles.catGridLabel}
                                numberOfLines={/[\n ]/.test(cat.label) ? 2 : 1}
                                adjustsFontSizeToFit
                                minimumFontScale={0.6}
                              >
                                {cat.label}
                              </Text>
                            </View>
                          </LinearGradient>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              }}
            />
            {/* Pagination Dots — only CAT_MAX_DOTS worth of width is visible
                (overflow hidden); the full-length dot row scrolls inside it
                via a single translateX interpolated directly off
                activeCatPage, so the next dot slides smoothly into view in
                real time as the category list is dragged, instead of
                popping in once some threshold is crossed. */}
            <View style={[styles.catPagination, { width: catViewportWidth, overflow: 'hidden' }]}>
              <Animated.View
                style={{
                  flexDirection: 'row',
                  gap: CAT_DOT_GAP,
                  transform: [{ translateX: catDotsTranslateX }],
                }}
              >
                {Array.from({ length: totalCatPages }, (_, i) => i).map((i) => {
                  const opacity = activeCatPage.interpolate({
                    inputRange: [i - 1, i, i + 1],
                    outputRange: [0.3, 1, 0.3],
                    extrapolate: 'clamp',
                  });
                  return (
                    <Animated.View
                      key={i}
                      style={[styles.catDot, { opacity }]}
                    />
                  );
                })}
              </Animated.View>
            </View>
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
          <View style={{ paddingVertical: 10, position: 'relative' }}>
            <GlowCircle

              size={551}
              color={userRole === 'FREELANCER' ? '#F26930' : '#ED2A91'}
              opacity={0.12}
              style={{ position: 'absolute', right: -150, top: '50%', marginTop: -270.5, width: 551, height: 551, borderRadius: 551 }}
            />
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
                  handleMessage={handleMessage}
                  handleCall={handleCall}
                  handleShare={handleShare}
                  handleCollab={handleCollab}
                  handleCancelCollab={handleCancelCollab}
                  collabSentPostIds={collabSentPostIds}
                  cancellingCollabPostId={cancellingCollabPostId}
                  acceptedCollabPostIds={acceptedCollabPostIds}
                  completedCollabPostIds={completedCollabPostIds}
                  savedPostIds={savedPostIds}
                  userRole={userRole}
                />
              )}
            />
          </View>
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
              colors={['rgba(255, 97, 26, 1)', 'rgba(229, 38, 166, 1)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.exploreNowBtnGrad}
            >
              <Text style={styles.exploreNowBtnText}>Explore Now</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* ══════════════ CREATE POST ══════════════ */}
          <View style={{ marginTop: 20, marginBottom: 6 }}>
            <View
              style={[
                styles.createPostFrame,
                { borderColor: userRole === 'FREELANCER' ? 'rgba(242,105,48,0.36)' : 'rgba(232,51,128,0.35)' },
              ]}
            >
              {/* <LinearGradient
                colors={userRole === 'FREELANCER' ? ['#3a1c08', '#0a0a0a'] : ['#3a0a20', '#0a0a0a']}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              /> */}
              {/* Top-Right Glow Accent */}
              <GlowCircle
                size={220}
                color={userRole === 'FREELANCER' ? '#F26930' : '#E80A70'}
                opacity={0.35}
                style={{ position: 'absolute', top: -90, right: -68 }}
              />
              {/* Bottom-Left Glow Accent */}
              <GlowCircle
                size={190}
                color={userRole === 'FREELANCER' ? '#F26930' : '#E80A70'}
                opacity={0.4}
                style={{ position: 'absolute', left: -90, bottom: -100 }}
              />
              <View style={{ flexDirection: 'row', alignItems: 'center',   }}>
                <Text style={{ fontSize: 18, marginRight: 6 }}>✨</Text>
                <Text style={[styles.gradientHeadingText, { color: '#fff' }]}>Create Post</Text>
              </View>
              <TouchableOpacity
                style={styles.createPostCard}
                activeOpacity={0.85}
                onPress={() => {
                  if (!requireProfile('create a post')) return;
                  router.push('/create-post' as any);
                }}
              >
                {userRole === 'FREELANCER' ? (
                  <LinearGradient
                    colors={['#FF9A4D', '#F2611D']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.createPostIconWrap}
                  >
                    <Image source={require('../../assets/Pencil-Icon.png')} style={{ width: 24, height: 24 }} resizeMode="contain" />
                  </LinearGradient>
                ) : (
                  <LinearGradient
                    colors={['rgba(237, 69, 153, 1)', 'rgba(232, 10, 112, 1)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.createPostIconWrap}
                  >
                    <Image source={require('../../assets/Pencil-Icon.png')} style={{ width: 24, height: 24 }} resizeMode="contain" />
                  </LinearGradient>
                )}
                <View style={styles.createPostTextWrap}>
                  <Text style={styles.createPostTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                    Post Your Opportunity
                  </Text>
                  <Text style={styles.createPostSubtitle} numberOfLines={2}>
                    Create a post and reach the right audience.
                  </Text>
                </View>
                {userRole === 'FREELANCER' ? (
                  <LinearGradient
                    colors={['#FF9A4D', '#F2611D']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.createPostArrowBtn}
                  >
                    <Image source={require('../../assets/arrow.png')} style={{ width: 18, height: 18 }} resizeMode="contain" />
                  </LinearGradient>
                ) : (
                  <LinearGradient
                    colors={['#ED4599', '#E80A70']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.createPostArrowBtn}
                  >
                    <Image source={require('../../assets/arrow.png')} style={{ width: 18, height: 18 }} resizeMode="contain" />
                  </LinearGradient>
                )}
              </TouchableOpacity>
            </View>
          </View>

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
          {userRole === 'FREELANCER' ? (
            <Image source={require('../../assets/love-freelancer.png')} style={{ width: 48, height: 48, marginBottom: 4 }} resizeMode="contain" />
          ) : (
            <Image source={require('../../assets/love-creator.png')} style={{ width: 48, height: 48, marginBottom: 4 }} resizeMode="contain" />
          )}
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.bharatTitleLine}>Bharat First</Text>
            <HeroGradientText
              text="Collaboration"
              deg={90}
              gradientStops={[
                { offset: '14.08%', color: 'rgba(237, 42, 145, 1)' },
                { offset: '110.25%', color: 'rgba(252, 97, 33, 1)' },
              ]}
              fontSize={32}
              fontFamily="Poppins_700Bold"
              height={40}
              style={{ marginTop: 6 }}
            />
            <View style={{ flexDirection:'row', alignItems: 'center', marginTop: 6 }}>
              <Text style={styles.bharatTitleLine}>Network For </Text>
              <HeroGradientText
                text={userRole === 'FREELANCER' ? 'Freelancers' : 'Creators'}
                deg={90}
                gradientStops={[
                  { offset: '14.08%', color: '#ED2A91' },
                  { offset: '110.25%', color: '#FC6121' },
                ]}
                fontSize={32}
                fontFamily="Poppins_700Bold"
                height={40}
              />
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', }}>
            <Text style={styles.bharatSubtitle}>All-in-one space for {userRole === 'FREELANCER' ? 'Freelancers' : 'creators'} </Text>
            <Image source={imgTargetNew} style={{ width: 16, height: 16, marginBottom: 4 }} />
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
              style={[styles.bharatPinkBtn, { backgroundColor: userRole === 'FREELANCER' ? 'rgba(242, 105, 48, 1)' : 'rgba(237, 42, 145, 1)' }]}
              onPress={() => Linking.openURL('https://www.instagram.com/digitagapp/')}
            >
              <Text style={styles.bharatPinkBtnText}>Digitag_official</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bharatOutlineBtn, { borderColor: userRole === 'FREELANCER' ? '#f26930' : '#ed2a91' }]}
              onPress={() => Linking.openURL('https://wa.me/917680805720')}
            >
              <Ionicons name="logo-whatsapp" size={14} color="#ffffffff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bharatOutlineBtn, { borderColor: userRole === 'FREELANCER' ? '#f26930' : '#ed2a91', }]}
              onPress={() => Linking.openURL('tel:+917680805720')}
            >
              <Ionicons name="call-outline" size={14} color={userRole === 'FREELANCER' ? '#ffffffff' : '#ffffffff'} />
            </TouchableOpacity>
          </View>
        </View>

        </Animated.View>

        <CommunityModal visible={communityModalVisible} onClose={() => setCommunityModalVisible(false)} />
      </Animated.ScrollView>

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
                <Text style={styles.modalTitle}>{selectedSocialLinks ? 'Social Links' : 'Portfolio Links'}</Text>
              </View>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setPortfolioModalVisible(false)}>
                <Feather name="x" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
            {portfolioLoading ? (
              <ActivityIndicator color="#A78BFA" style={{ marginTop: 16 }} />
            ) : selectedSocialLinks ? (
              selectedSocialLinks.length > 0 ? (
                selectedSocialLinks.map((link) => (
                  <TouchableOpacity
                    key={link.key}
                    style={styles.portfolioLinkContainer}
                    onPress={async () => {
                      try {
                        await WebBrowser.openBrowserAsync(link.url);
                      } catch {
                        try {
                          await Linking.openURL(link.url);
                        } catch {
                          Alert.alert('Could not open link', 'This link could not be opened.');
                        }
                      }
                    }}
                  >
                    <Ionicons name={link.icon as any} size={20} color={link.color} />
                    <Text style={[styles.portfolioLinkText, { marginLeft: 10 }]} numberOfLines={1}>{link.url}</Text>
                    <Feather name="arrow-up-right" size={20} color="#A78BFA" />
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noPortfolioText}>No social links provided.</Text>
              )
            ) : selectedPortfolioLink ? (
              <TouchableOpacity
                style={styles.portfolioLinkContainer}
                onPress={async () => {
                  let url = selectedPortfolioLink.trim();
                  if (!url) return;
                  if (!url.startsWith('http://') && !url.startsWith('https://')) { url = 'https://' + url; }
                  try {
                    await WebBrowser.openBrowserAsync(url);
                  } catch {
                    try {
                      await Linking.openURL(url);
                    } catch {
                      Alert.alert('Could not open link', 'This portfolio link could not be opened.');
                    }
                  }
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
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
    marginTop: 4,
  },
  floatingHeader: {
    borderRadius: 999,
    paddingVertical: 6,
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
    fontSize: 12,
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
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 36,
    alignContent: 'center',
    textTransform: 'uppercase',
  },
  heroDesc: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',

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
    backgroundColor: '#f9f4f6ff',
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
    alignSelf: 'center',
    marginTop: -10,
  },
  catDot: {
    width: 8,
    height: 8,
    aspectRatio: 1,
    borderRadius: 99,
    backgroundColor: '#fff',
  },
  catGradientBorder: {
    width: 90,
    height: 86,
    borderRadius: 24,
    padding: 1,

  },
  catGridCard: {
    backgroundColor: '#050404',
    borderRadius: 22.8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 1,
    paddingHorizontal: 1,
    width: '100%',
    height: '100%',
  },
  catGridImgCreator: {
    width: 26,
    height: 20,
    marginBottom: 8,
  },
  catGridLabel: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    lineHeight: 14,
    width: '100%',
    alignSelf: 'stretch',
  },
  catGridImgFreelancerChip: {
    width: 26,
    height: 24,
    marginBottom: 4,
  },

  // RECENT UPDATES CARDS
  cardsList: {
    paddingHorizontal: (width - 280) / 2,
    gap: 10,
  },
  figmaCardGradientBorder: {
    width: 251,
    height: 350,
    borderRadius: 24,
    padding: 0.4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  figmaCard: {
    width: 248,
    height: 347,
    backgroundColor: '#121212',
    borderRadius: 23.6,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  figmaCardBookmarkBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  figmaCardBookmarkIcon: {
    width: 30,
    height: 30,
  },
  figmaCardAvatarWrap: {
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#303340',
    position: 'relative',
  },
  figmaCardAvatarImg: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  figmaCardPortfolioBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#0A0A0A',
  },
  figmaCardName: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 6,
    width: '85%',
    textAlign: 'center',
  },
  figmaCardRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    maxWidth: '90%',
  },
  lookingForRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, marginBottom: 6, maxWidth: '90%' },
  lookingForLabel: { color: '#fff', fontSize: 12, fontFamily: 'Poppins_500Medium', flexShrink: 0 },
  lookingForPill: {
    backgroundColor: '#FFC10A',
    borderRadius: 99,
    paddingHorizontal: 4,
    paddingVertical: 0,
    alignSelf: 'flex-start',
    flexShrink: 1,
    minWidth: 0,
  },
  lookingForPillText: { color: '#000', fontSize: 10, fontFamily: 'Poppins_700Bold', alignSelf: 'center', paddingHorizontal: 4, paddingVertical: 3, marginTop: 2 },
  figmaCardRoleText: {
    color: '#9ca3af',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    flexShrink: 1,
  },
  figmaCardExpertBadgeGradient: {
    borderRadius: 99,
    padding: 1,
    flexShrink: 0,
  },
  figmaCardExpertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
    flexShrink: 0,
  },
  figmaCardExpertText: {
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',

  },
  figmaCardDesc: {
    color: '#d1d2d4',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  figmaCardSeeMore: {
    fontFamily: 'Poppins_500Medium',
  },
  figmaCardPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  figmaCardPricePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    maxWidth: '58%',
    borderColor: '#1d410e',
    borderWidth: 1,

  },
  figmaCardPricePillText: {
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
  },
  figmaCardTimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#141315',
    borderColor: '#3e3d3d',
    borderWidth: 1,
    justifyContent: 'center',

  },
  figmaCardTimePillText: {
    color: '#a1a2a4',
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
  },
  figmaCardBottomRow: {
    width: '100%',
    paddingHorizontal: 14,
    marginBottom: 14,
    flexDirection: 'row',
    gap: 4,
  },
  figmaCardRequestBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 99,
    paddingVertical: 9,
  },
  figmaCardRequestBtnText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  figmaCardIconActionsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  figmaCardIconAction: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  exploreNowContainer: {
    marginTop: 12,
    marginBottom: 20,
    alignSelf: 'center',



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
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
  },

  // CREATE POST
  createPostFrame: {
    width: '100%',
    maxWidth: 408,
    minHeight: 170,
    alignSelf: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    overflow: 'hidden',
    backgroundColor: '#050409',
  },
  createPostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  createPostIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createPostTextWrap: {
    flex: 1,
    minWidth: 0,

    padding: 10,
  },
  createPostTitle: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 4,
    flexDirection: "row"
  },
  createPostSubtitle: {
    color: '#9e9ca8',
    fontSize: 10.5,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 17,
  },
  createPostArrowBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // BHARAT FIRST SECTION
  bharatSection: {
    marginTop: 30,
    backgroundColor: '#111111',
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 60,
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
    color: '#fff',
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
