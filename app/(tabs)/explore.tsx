import { useAuth } from '@/context/AuthContext';
import { useProfileGate } from '@/context/ProfileGateContext';
import { getCreatorById, getFeed, getFreelancerById } from '@/services/userService';
import { getRoleTheme } from '@/theme/useRoleTheme';
import { Feather, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  InteractionManager,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Ellipse, FeGaussianBlur, Filter, G, Path, Stop, LinearGradient as SvgGradient, Text as SvgText } from 'react-native-svg';

const { width } = Dimensions.get('window');
const FALLBACK_BANNER = 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=1000&auto=format&fit=crop';

const ActiveTabGlow = React.memo(() => (
  <View style={{ position: 'absolute', top: -30, alignSelf: 'center', zIndex: -1, opacity: 0.3 }}>
    <Svg width="93" height="49" viewBox="0 0 93 49">
      <Defs>
        <Filter id="glow" x="0" y="0" width="93" height="69" filterUnits="userSpaceOnUse">
          <FeGaussianBlur stdDeviation="35.5" />
        </Filter>
      </Defs>
      <G filter="url(#glow)">
        <Ellipse cx="46.5" cy="24.5" rx="25.5" ry="3.5" fill="white" />
      </G>
    </Svg>
  </View>
));

const FolderShoulder = React.memo(({ colors, isLeft }: { colors: string[], isLeft: boolean }) => (
  <View style={{ position: 'absolute', bottom: 0, [isLeft ? 'left' : 'right']: -20, width: 20, height: 20, zIndex: -1 }}>
    <Svg width="20" height="20" viewBox="0 0 20 20" style={{ position: 'absolute' }}>
      <Path
        d={isLeft ? "M 20 20 L 20 0 A 20 20 0 0 1 0 20 Z" : "M 0 20 L 20 20 A 20 20 0 0 1 0 0 Z"}
        fill={colors[1]}
      />
    </Svg>
    <Svg width="20" height="20" viewBox="0 0 20 20" style={{ position: 'absolute', opacity: 0.6 }}>
      <Path
        d={isLeft ? "M 20 20 L 20 0 A 20 20 0 0 1 0 20 Z" : "M 0 20 L 20 20 A 20 20 0 0 1 0 0 Z"}
        fill={colors[0]}
      />
    </Svg>
  </View>
));

const imgPhotography = require('../../assets/tabs-gifs/tab1.gif');
const imgEditor = require('../../assets/tabs-gifs/editorgif.gif');
const imgVideography = require('../../assets/tabs-gifs/videographygif.gif');
const imgGrowth = require('../../assets/tabs-gifs/growthspecilistgif.gif');
const imgScriptWriters = require('../../assets/tabs-gifs/scriptgif.gif');
const imgStyling = require('../../assets/tabs-gifs/stylinggif.gif');
const imgFashion = require('../../assets/tabs-gifs/fashiongif.gif');
const imgProperty = require('../../assets/tabs-gifs/propertygif.gif');
const imgPhotographyicon = require('../../assets/tabs_icons/Photographyicon.webp');
const imgEditoricon = require('../../assets/tabs_icons/editoricon.webp');
const imgVideographyicon = require('../../assets/tabs_icons/Videographyicon.webp');
const imgGrowthicon = require('../../assets/tabs_icons/Growthicon.webp');
const imgScriptWritersicon = require('../../assets/tabs_icons/Scripticon.webp');
const imgStylingicon = require('../../assets/tabs_icons/Stylingicon.webp');
const imgFashionicon = require('../../assets/tabs_icons/fashionicon.webp');
const imgPropertyicon = require('../../assets/tabs_icons/Propertyicon.webp');
const imgVoiceicon = require('../../assets/tabs_icons/VoiceOvericon.webp');

const f_lifestyle = require('../../assets/freelancer-icons/Lifestyle-Living.webp');
const f_tech = require('../../assets/freelancer-icons/Tech.webp');
const f_education = require('../../assets/freelancer-icons/Education.webp');
const f_photography = require('../../assets/freelancer-icons/Photography.webp');
const f_food = require('../../assets/freelancer-icons/Food.webp');
const f_health = require('../../assets/freelancer-icons/Health.webp');
const f_automotive = require('../../assets/freelancer-icons/Automotive.webp');
const f_comedy = require('../../assets/freelancer-icons/Comedy-Memes.webp');
const f_entertainment = require('../../assets/freelancer-icons/Entertainment.webp');
const f_gaming = require('../../assets/freelancer-icons/Gaming-Anime.webp');
const f_learning = require('../../assets/freelancer-icons/Learning.webp');
const f_news = require('../../assets/freelancer-icons/News-Media-Magazins.webp');
const f_sports = require('../../assets/freelancer-icons/Sports.webp');
const f_travel = require('../../assets/freelancer-icons/Travel.webp');
const f_beauty = require('../../assets/freelancer-icons/Beauty.webp');
const f_fitness = require('../../assets/freelancer-icons/Fitness.webp');
const f_fashion = require('../../assets/freelancer-icons/Fashion.webp');
const f_finance = require('../../assets/freelancer-icons/Finance-Investments.webp');
const f_arts = require('../../assets/freelancer-icons/Arts.webp');
const f_business = require('../../assets/freelancer-icons/Business-Startups.webp');
const f_community = require('../../assets/freelancer-icons/communitypages.webp');
const f_family = require('../../assets/freelancer-icons/FamilyPets.webp');
const f_home = require('../../assets/freelancer-icons/modern-house.webp');
const f_law = require('../../assets/freelancer-icons/Law-Rights-Activism.webp');
const f_pets = require('../../assets/freelancer-icons/pets-animals.webp');
const f_politics = require('../../assets/freelancer-icons/Politics.webp');

const fh_lifestyle = require('../../assets/categories-freelancers/Lifestyle-Living1.webp');
const fh_tech = require('../../assets/categories-freelancers/Tech1.webp');
const fh_education = require('../../assets/categories-freelancers/Education1.webp');
const fh_photography = require('../../assets/categories-freelancers/Photography1.webp');
const fh_food = require('../../assets/categories-freelancers/Food1.webp');
const fh_health = require('../../assets/categories-freelancers/Health1.webp');
const fh_automotive = require('../../assets/categories-freelancers/Automotive.webp');
const fh_comedy = require('../../assets/categories-freelancers/Comedy-Memes1.webp');
const fh_entertainment = require('../../assets/categories-freelancers/Entertainment1.webp');
const fh_gaming = require('../../assets/categories-freelancers/Gaming-Anime1.webp');
const fh_learning = require('../../assets/categories-freelancers/Learning1.webp');
const fh_news = require('../../assets/categories-freelancers/NewsMedia-Magazins1.webp');
const fh_sports = require('../../assets/categories-freelancers/Sports1.webp');
const fh_travel = require('../../assets/categories-freelancers/Sports11.webp');
const fh_beauty = require('../../assets/categories-freelancers/Beauty1.webp');
const fh_fitness = require('../../assets/categories-freelancers/Fitness1.webp');
const fh_fashion = require('../../assets/categories-freelancers/Fashion1.webp');
const fh_finance = require('../../assets/categories-freelancers/Finance-Investments1.webp');
const fh_arts = require('../../assets/categories-freelancers/Arts1.webp');
const fh_business = require('../../assets/categories-freelancers/Business-Startups1.webp');
const fh_community = require('../../assets/categories-freelancers/Community-Pages1.webp');
const fh_family = require('../../assets/categories-freelancers/Family-Kids-Pets1.webp');
const fh_home = require('../../assets/categories-freelancers/Home-Decor1.webp');
const fh_law = require('../../assets/categories-freelancers/LawRights-Activism1.webp');
const fh_pets = require('../../assets/categories-freelancers/Pets-Animals1.webp');
const fh_politics = require('../../assets/categories-freelancers/Politics1.webp');


const CATEGORIES = [
  {
    id: 'all',
    label: 'All',
    icon: imgGrowthicon,
    image: imgPhotography,
    heroLine1: 'Explore Our Creators', heroLine2: ' ', heroLine3: '',
    heroDesc: 'Discover top talents and connect with the right people for any project.',
    gradient: ['#3b82f6', '#2563eb'] as [string, string],
    charStyle: { right: -45, bottom: -65, width: 230, height: 230, }
  },
  {
    id: 'photography',
    label: 'Photography',
    icon: imgPhotographyicon,
    image: imgPhotography,
    heroLine1: 'Capture Every Moment', heroLine2: 'Beautifully', heroLine3: '',
    heroDesc: 'Turning moments into timeless visual stories with creativity and emotion.',
    gradient: ['#6366f1', '#4f46e5'] as [string, string],
    charStyle: { right: -45, bottom: -65, width: 230, height: 230, }
  },
  {
    id: 'editor',
    label: 'Editor',
    icon: imgEditoricon,
    image: imgEditor,
    heroLine1: 'Editing That Brings', heroLine2: 'Stories to Life', heroLine3: '',
    heroDesc: 'High-quality edits designed to make your content stand out across every platform.',
    gradient: ['#9D174D', '#831843'] as [string, string],
    charStyle: { right: -57, bottom: -67, width: 220, height: 220 }
  },
  {
    id: 'videography',
    label: 'Videography',
    icon: imgVideographyicon,
    image: imgVideography,
    heroLine1: 'Bringing Ideas to Life', heroLine2: 'on Screen', heroLine3: '',
    heroDesc: 'High-quality edits designed to make your content stand out across every platform.',
    gradient: ['#0284C7', '#075985'] as [string, string],
    charStyle: { right: -55, bottom: -50, width: 230, height: 230 }
  },
  {
    id: 'growth',
    label: 'Growth\nSpecialist',
    icon: imgGrowthicon,
    image: imgGrowth,
    heroLine1: 'Accelerate Your', heroLine2: 'Brand Growth', heroLine3: '',
    heroDesc: 'Growth-focused solutions tailored for modern creators, brands, and agencies.',
    gradient: ['#4338CA', '#3730A3'] as [string, string],
    charStyle: { right: -40, bottom: -60, width: 240, height: 240 }
  },
  {
    id: 'script',
    label: 'Script Writers',
    icon: imgScriptWritersicon,
    image: imgScriptWriters,
    heroLine1: 'Turning Ideas into ', heroLine2: 'Powerful Scripts', heroLine3: '',
    heroDesc: 'Creative scripts crafted for films, ads, reels, podcasts, and digital content.',
    gradient: ['#1E3A8A', '#1E40AF'] as [string, string],
    charStyle: { right: -30, bottom: -55, width: 220, height: 220 }
  },
  {
    id: 'styling',
    label: 'Styling &\nmakeup',
    icon: imgStylingicon,
    image: imgStyling,
    heroLine1: 'Beauty Styled to ', heroLine2: 'Perfection', heroLine3: '',
    heroDesc: 'Expert makeup and styling designed to elevate every look with elegance and precision.',
    gradient: ['#7E22CE', '#6B21A8'] as [string, string],
    charStyle: { right: -35, bottom: -45, width: 230, height: 230 }
  },
  {
    id: 'fashion',
    label: 'Fashion\nDesigners',
    icon: imgFashionicon,
    image: imgFashion,
    heroLine1: 'Where Style Meets ', heroLine2: 'Creativity', heroLine3: '',
    heroDesc: 'From modern trends to timeless looks, discover fashion designs made to stand out.',
    gradient: ['#BE185D', '#9D174D'] as [string, string],
    charStyle: { right: -35, bottom: -55, width: 192, height: 190 }
  },
  {
    id: 'voice',
    label: 'Voice\nOver',
    icon: imgVoiceicon,
    image: imgVoiceicon,
    heroLine1: 'The Perfect Voice for', heroLine2: '  Your Content', heroLine3: '',
    heroDesc: 'From reels to commercials, discover voice artists who make every script unforgettable.',
    gradient: ['rgba(7, 184, 201, 1)', 'rgba(4, 91, 99, 1)'] as [string, string],
    charStyle: { right: -40, bottom: -63, width: 200, height: 200 }
  },
  {
    id: 'property',
    label: 'Property\nRental',
    icon: imgPropertyicon,
    image: imgProperty,
    heroLine1: 'Spaces Designed for   ', heroLine2: ' Better Living', heroLine3: '',
    heroDesc: 'Explore premium rental homes, apartments, and workspaces tailored to your needs.',
    gradient: ['#B45309', '#92400E'] as [string, string],
    charStyle: { right: -40, bottom: -63, width: 225, height: 225 }
  },
];

function getInitials(name: string | null | undefined) {
  if (!name) return 'U';
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

function timeAgo(dateStr: string | null | undefined) {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.max(0, Math.round(diffMs / 60000));
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.round(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.round(diffHrs / 24)}d ago`;
}

const GradientTitle = ({ text }: { text: string }) => {
  const fontSize = 28;
  const w = text.length * fontSize * 0.58;
  const h = fontSize * 1.4;
  return (
    <View style={{ width: w, height: h }}>
      <Svg height="100%" width="100%" viewBox={`0 0 ${w} ${h}`}>
        <Defs>
          <SvgGradient id="titleGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="1" />
            <Stop offset="1" stopColor="#ff6ab9" stopOpacity="1" />
          </SvgGradient>
        </Defs>
        <SvgText fill="url(#titleGrad)" fontSize={fontSize} fontFamily="Poppins_600SemiBold" x="0" y={fontSize}>
          {text}
        </SvgText>
      </Svg>
    </View>
  );
};

const AnimatedText = Animated.createAnimatedComponent(Text);

const FadeLetter = React.memo(({ char, index, total, style }: { char: string; index: number; total: number; style?: any }) => {
  const opacity = useSharedValue(1);
  const delay = index * 80;

  useEffect(() => {
    opacity.value = 1;
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 800 }),
          withTiming(1, { duration: 800 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        false
      )
    );
    return () => cancelAnimation(opacity);
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <AnimatedText style={[style, animatedStyle]}>
      {char === ' ' ? '\u00A0' : char}
    </AnimatedText>
  );
});

const FadeText = React.memo(({
  text,
  style,
}: {
  text: string;
  style?: any;
}) => {
  const chars = text.split('');
  return (
    <View style={[style, { flexDirection: 'row', flexWrap: 'wrap' }]}>
      {chars.map((char, index) => (
        <FadeLetter key={`${text}-${index}`} char={char} index={index} total={chars.length} style={style} />
      ))}
    </View>
  );
});

const AnimatedImage = Animated.createAnimatedComponent(Image);

const HeroAnimatedImage = React.memo(({ source, style, activeCatId, isFreelancer }: { source: any; style: any; activeCatId: string; isFreelancer: boolean }) => {
  const translateX = useSharedValue(isFreelancer ? 300 : 0);
  const opacity = useSharedValue(isFreelancer ? 0 : 1);

  useEffect(() => {
    if (isFreelancer) {
      translateX.value = 200;
      opacity.value = 0;
      translateX.value = withTiming(0, { duration: 500 });
      opacity.value = withTiming(1, { duration: 500 });
    } else {
      translateX.value = 0;
      opacity.value = 1;
    }
  }, [activeCatId, isFreelancer]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <AnimatedImage source={source} style={[style, animStyle]} resizeMode="contain" />
  );
});

const SimpleFolderBg = React.memo(({ width: w, height: h, tabWidth, activeIndex, colors }: {
  width: number; height: number; tabWidth: number; activeIndex: number; colors: [string, string];
}) => {
  const r = 24;
  const tw = tabWidth;
  const th = 100;
  const tx = 8 + activeIndex * tabWidth;

  const d = `
    M 0 ${th}
    ${tx > r ? `L ${tx - r} ${th} A ${r} ${r} 0 0 0 ${tx} ${th - r} L ${tx} ${r} A ${r} ${r} 0 0 1 ${tx + r} 0`
      : `A ${r} ${r} 0 0 1 ${tx + r} 0`}
    L ${Math.min(w - r, tx + tw - r)} 0
    ${tx + tw < w - r
      ? `A ${r} ${r} 0 0 1 ${tx + tw} ${r} L ${tx + tw} ${th - r} A ${r} ${r} 0 0 0 ${tx + tw + r} ${th} L ${w} ${th}`
      : `A ${r} ${r} 0 0 1 ${w} 0`}
    L ${w} ${h - r}
    A ${r} ${r} 0 0 1 ${w - r} ${h}
    L ${r} ${h}
    A ${r} ${r} 0 0 1 0 ${h - r}
    Z
  `;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, width: w, height: h }}>
      <Svg width={w} height={h}>
        <Defs>
          <SvgGradient id="simpleFolderGrad" x1="0" y1="0" x2="0.5" y2="1">
            <Stop offset="0" stopColor={colors[0]} />
            <Stop offset="1" stopColor={colors[1]} />
          </SvgGradient>
        </Defs>
        <Path d={d} fill="url(#simpleFolderGrad)" />
      </Svg>
    </View>
  );
});



const BlinkingStar = React.memo(({ style, size = 20, delay = 0 }: { style?: any, size?: number, delay?: number }) => {
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
    <Animated.View style={[style, animatedStyle]}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M9.93694 14.9996C9.84766 14.6535 9.66728 14.3377 9.41456 14.085C9.16184 13.8323 8.84601 13.6519 8.49994 13.5626L2.36494 11.9806C2.26027 11.9509 2.16815 11.8878 2.10255 11.801C2.03696 11.7142 2.00146 11.6084 2.00146 11.4996C2.00146 11.3908 2.03696 11.285 2.10255 11.1981C2.16815 11.1113 2.26027 11.0483 2.36494 11.0186L8.49994 9.43559C8.84589 9.3464 9.16163 9.16617 9.41434 8.91363C9.66705 8.6611 9.84751 8.34548 9.93694 7.99959L11.5189 1.86459C11.5483 1.75951 11.6113 1.66693 11.6983 1.60099C11.7852 1.53504 11.8913 1.49934 12.0004 1.49934C12.1096 1.49934 12.2157 1.53504 12.3026 1.60099C12.3896 1.66693 12.4525 1.75951 12.4819 1.86459L14.0629 7.99959C14.1522 8.34566 14.3326 8.66149 14.5853 8.91421C14.838 9.16693 15.1539 9.34731 15.4999 9.43659L21.6349 11.0176C21.7404 11.0467 21.8335 11.1096 21.8998 11.1967C21.9661 11.2837 22.002 11.3902 22.002 11.4996C22.002 11.609 21.9661 11.7154 21.8998 11.8025C21.8335 11.8896 21.7404 11.9525 21.6349 11.9816L15.4999 13.5626C15.1539 13.6519 14.838 13.8323 14.5853 14.085C14.3326 14.3377 14.1522 14.6535 14.0629 14.9996L12.4809 21.1346C12.4515 21.2397 12.3886 21.3322 12.3016 21.3982C12.2147 21.4641 12.1086 21.4998 11.9994 21.4998C11.8903 21.4998 11.7842 21.4641 11.6973 21.3982C11.6103 21.3322 11.5473 21.2397 11.5179 21.1346L9.93694 14.9996Z"
          stroke="#FFDF20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        />
        <Path d="M20 2.875V6.70833" stroke="#FFDF20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M22 5.00034H18" stroke="#FFDF20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M4 16.292V18.2087" stroke="#FFDF20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M5 18H3" stroke="#FFDF20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </Animated.View>
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
    <Animated.View style={[style, animatedStyle]}>
      <Svg width={size} height={size} viewBox="0 0 5 5" fill="none">
        <Circle cx="2.5" cy="2.5" r="2.5" fill="#D9D9D9" />
      </Svg>
    </Animated.View>
  );
});

const Sparkles = React.memo(({ count = 3 }: { count?: number }) => {
  return (
    <>
      <BlinkingStar style={{ position: 'absolute', top: 10, left: 120 }} size={24} />
      <BlinkingStar style={{ position: 'absolute', top: 100, right: 10 }} size={16} />
      <BlinkingStar style={{ position: 'absolute', bottom: 60, left: 40 }} size={20} />

      {/* Tiny Blinking Dots */}
      <BlinkingDot style={{ position: 'absolute', top: 40, left: 40 }} />
      <BlinkingDot style={{ position: 'absolute', top: 140, left: 180 }} />
      <BlinkingDot style={{ position: 'absolute', top: 60, right: 100 }} />
      <BlinkingDot style={{ position: 'absolute', bottom: 100, right: 150 }} />
      <BlinkingDot style={{ position: 'absolute', bottom: 40, right: 50 }} />
      <BlinkingDot style={{ position: 'absolute', top: 200, left: 20 }} />
      <BlinkingDot style={{ position: 'absolute', top: 20, right: 200 }} />
      <BlinkingDot style={{ position: 'absolute', bottom: 150, left: 100 }} />
      <BlinkingDot style={{ position: 'absolute', top: 100, left: '50%' }} />
      <BlinkingDot style={{ position: 'absolute', bottom: 20, left: 200 }} />
    </>
  );
});

export default function ExploreTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, isGuest, userRole } = useAuth();
  const { requireProfile } = useProfileGate();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { category: paramCategory } = useLocalSearchParams<{ category?: string }>();
  const [activeCategory, setActiveCategory] = useState(
    paramCategory && CATEGORIES.find(c => c.id === paramCategory) ? paramCategory : CATEGORIES[0].id
  );

  useEffect(() => {
    if (paramCategory && CATEGORIES.find(c => c.id === paramCategory)) {
      setActiveCategory(paramCategory);
    }
  }, [paramCategory]);
  const [portfolioModalVisible, setPortfolioModalVisible] = useState(false);
  const [selectedPortfolioLink, setSelectedPortfolioLink] = useState<string | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [collabSentIds, setCollabSentIds] = useState<Set<string>>(new Set());
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const interaction = InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
    });
    return () => interaction.cancel();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedPosts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const fetchPosts = useCallback(async () => {
    if (!token) { setPosts([]); setLoading(false); return; }
    try {
      const res = await getFeed(token);
      setPosts(Array.isArray(res.data) ? res.data : []);
    } catch { setPosts([]); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const onRefresh = async () => { setRefreshing(true); await fetchPosts(); setRefreshing(false); };

  const FREELANCER_CATEGORIES = [
    {
      id: 'f1',
      label: 'Lifestyle &\nLiving',
      icon: f_lifestyle,
      image: fh_lifestyle,
      heroLine1: 'Elevate Your Everyday  ', heroLine2: 'Lifestyle ', heroLine3: '',
      heroDesc: 'Modern lifestyle inspiration for fashion, wellness, travel, home, and everyday living.',
      gradient: ['rgba(136, 21, 250, 1)', 'rgba(136, 21, 250, 1)'] as [string, string],
      charStyle: { right: -25, bottom: -45, width: 180, height: 180, opacity: 1 }
    },
    {
      id: 'f2',
      label: 'Tech',
      icon: f_tech,
      image: fh_tech,
      heroLine1: 'Technology That Powers  ', heroLine2: ' the Future ', heroLine3: '',
      heroDesc: 'Modern technology experiences crafted for speed, creativity, and growth.',
      gradient: ['rgba(170, 7, 121, 1)', 'rgba(68, 3, 48, 1))'] as [string, string],
      charStyle: { right: -25, bottom: -45, width: 180, height: 180, opacity: 1 }
    },
    {
      id: 'f3',
      label: 'Education',
      icon: f_education,
      image: fh_education,
      heroLine1: 'Unlock Your Learning ', heroLine2: ' Potential ', heroLine3: '',
      heroDesc: 'Modern education experiences designed for ambitious learners and future creators.',
      gradient: ['rgba(11, 145, 212, 1) ', 'rgba(4, 97, 144, 1)'] as [string, string],
      charStyle: { right: -25, bottom: -45, width: 180, height: 180, opacity: 1 }
    },
    {
      id: 'f4',
      label: 'Photography',
      icon: f_photography,
      image: fh_photography,
      heroLine1: 'Where Creativity ', heroLine2: ' Meets Photography', heroLine3: '',
      heroDesc: 'From portraits to brand shoots, every frame is crafted to stand out beautifully.',
      gradient: ['#D97706', '#B45309'] as [string, string],
      charStyle: { right: -25, bottom: -45, width: 180, height: 180, opacity: 1 }
    },
    {
      id: 'f5',
      label: 'Food',
      icon: f_food,
      image: fh_food,
      heroLine1: 'Eat Fresh. Feel Happy.', heroLine2: ' ', heroLine3: '',
      heroDesc: 'Tasty food experiences crafted for every foodie and every occasion.',
      gradient: ['rgba(68, 7, 201, 1)', 'rgba(68, 7, 201, 1)'] as [string, string],
      charStyle: { right: -25, bottom: -45, width: 180, height: 180, opacity: 1 }
    },
    {
      id: 'f6',
      label: 'Health',
      icon: f_health,
      image: fh_health,
      heroLine1: 'Your Health, Your  ', heroLine2: '  Priority', heroLine3: '',
      heroDesc: 'Smart wellness solutions designed for modern lifestyles and everyday care.',
      gradient: ['#0D9488', '#0F766E'] as [string, string],
      charStyle: { right: -25, bottom: -45, width: 180, height: 180, opacity: 1 }
    },
    {
      id: 'f7',
      label: 'Automotive',
      icon: f_automotive,
      image: fh_automotive,
      heroLine1: 'Performance Meets ', heroLine2: '  Innovation', heroLine3: '',
      heroDesc: 'Automotive experiences crafted for passionate drivers and modern lifestyles.',
      gradient: ['rgba(244, 102, 13, 1)', 'rgba(99, 40, 4, 1)'] as [string, string],
      charStyle: { right: -25, bottom: -45, width: 180, height: 180, opacity: 1 }
    },
    {
      id: 'f8',
      label: 'Comedy &\nMemes',
      icon: f_comedy,
      image: fh_comedy,
      heroLine1: 'Scroll Less, Laugh More', heroLine2: ' ', heroLine3: '',
      heroDesc: 'Your daily dose of humor, memes, and endless entertainment.',
      gradient: ['rgba(4, 63, 96, 1)', 'rgba(8, 130, 198, 1)'] as [string, string],
      charStyle: { right: -25, bottom: -45, width: 180, height: 180, opacity: 1 }
    },
    {
      id: 'f9',
      label: 'Entertainment',
      icon: f_entertainment,
      image: fh_entertainment,
      heroLine1: 'Endless Entertainment', heroLine2: ' Starts Here', heroLine3: '',
      heroDesc: 'Trending content, creators, music, and media all in one exciting experience.',
      gradient: ['rgba(13, 121, 244, 1)', 'rgba(8, 71, 142, 1)'] as [string, string],
      charStyle: { right: -25, bottom: -45, width: 180, height: 180, opacity: 1 }
    },
    {
      id: 'f10',
      label: 'Gaming &\nAnime',
      icon: f_gaming,
      image: fh_gaming,
      heroLine1: 'Game. Stream. Anime.', heroLine2: ' Repeat.', heroLine3: '',
      heroDesc: 'Everything you love about gaming and anime in one exciting experience.',
      gradient: ['rgba(136, 21, 250, 1)', 'rgba(53, 10, 97, 1)'] as [string, string],
      charStyle: { right: -25, bottom: -45, width: 180, height: 180, opacity: 1 }
    },
    {
      id: 'f11',
      label: 'Learning',
      icon: f_learning,
      image: fh_learning,
      heroLine1: 'Keep Learning, Keep  ', heroLine2: ' Growing', heroLine3: '',
      heroDesc: 'Modern learning experiences for ambitious minds and future creators.',
      gradient: ['rgba(170, 7, 121, 1)', 'rgba(170, 7, 121, 1)'] as [string, string],
      charStyle: { right: -25, bottom: -45, width: 180, height: 180, opacity: 1 }
    },
    {
      id: 'f12',
      label: 'News, Media\n& Magazins',
      icon: f_news,
      image: fh_news,
      heroLine1: 'Delivering Powerful', heroLine2: ' Headlines & Stories', heroLine3: '',
      heroDesc: 'Collaborate with experienced journalists, editors, and digital publishers.',
      gradient: ['rgba(11, 145, 212, 1)', 'rgba(4, 97, 144, 1)'] as [string, string],
      charStyle: { right: -25, bottom: -45, width: 180, height: 180, opacity: 1 }
    },
    {
      id: 'f13',
      label: 'Sports',
      icon: f_sports,
      image: fh_sports,
      heroLine1: 'Unleash Peak Athletic', heroLine2: ' Performance', heroLine3: '',
      heroDesc: 'Connect with sports analysts, personal trainers, athletes, and fitness influencers.',
      gradient: ['rgba(68, 7, 201, 1)', 'rgba(68, 7, 201, 1)'] as [string, string],
      charStyle: { right: -25, bottom: -45, width: 180, height: 180, opacity: 1 }
    },
    {
      id: 'f14',
      label: 'Travel',
      icon: f_travel,
      image: fh_travel,
      heroLine1: 'Explore Breathtaking', heroLine2: ' Destinations Across Earth', heroLine3: '',
      heroDesc: 'Partner with travel vloggers, itinerary planners, and adventure storytellers.',
      gradient: ['rgba(244, 102, 13, 1)', 'rgba(244, 102, 13, 1)'] as [string, string],
      charStyle: { right: -20, bottom: -30, width: 170, height: 170, opacity: 1 }
    },
    {
      id: 'f15',
      label: 'Beauty',
      icon: f_beauty,
      image: fh_beauty,
      heroLine1: 'Redefining Aesthetics and', heroLine2: ' Modern Glamour', heroLine3: '',
      heroDesc: 'Work with makeup artists, skincare experts, beauty influencers, and stylists.',
      gradient: ['rgba(13, 121, 244, 1)', 'rgba(13, 121, 244, 1)'] as [string, string],
      charStyle: { right: -25, bottom: -40, width: 180, height: 180, opacity: 1 }
    },
    {
      id: 'f16',
      label: 'Fitness',
      icon: f_fitness,
      image: fh_fitness,
      heroLine1: 'Transform Your Body and', heroLine2: ' Push Your Limits', heroLine3: '',
      heroDesc: 'Discover elite coaches, workout programmers, and physique transformation experts.',
      gradient: ['rgba(156, 13, 244, 1)', 'rgba(91, 8, 142, 1)'] as [string, string],
      charStyle: { right: -25, bottom: -40, width: 180, height: 180, opacity: 1 }
    },
    {
      id: 'f17',
      label: 'Fashion',
      icon: f_fashion,
      image: fh_fashion,
      heroLine1: 'Setting the Trend with', heroLine2: ' Impeccable Style', heroLine3: '',
      heroDesc: 'Hire wardrobe stylists, fashion designers, models, and trendsetters for your campaign.',
      gradient: ['rgba(4, 63, 96, 1)', 'rgba(8, 130, 198, 1)'] as [string, string],
      charStyle: { right: -25, bottom: -45, width: 180, height: 180, opacity: 1 }
    },
    {
      id: 'f18',
      label: 'Finance &\nInvestments',
      icon: f_finance,
      image: fh_finance,
      heroLine1: 'Securing Wealth and', heroLine2: ' Financial Freedom', heroLine3: '',
      heroDesc: 'Connect with certified financial planners, market analysts, and investment advisors.',
      gradient: ['rgba(7, 184, 201, 1)', 'rgba(4, 91, 99, 1)'] as [string, string],
      charStyle: { right: -25, bottom: -35, width: 180, height: 180, opacity: 1 }
    },
    {
      id: 'f19',
      label: 'Arts',
      icon: f_arts,
      image: fh_arts,
      heroLine1: 'Expressive Masterpieces', heroLine2: ' Crafted with Soul', heroLine3: '',
      heroDesc: 'Discover traditional painters, digital illustrators, sculptors, and creative visionaries.',
      gradient: ['rgba(136, 21, 250, 1)', 'rgba(53, 10, 97, 1)'] as [string, string],
      charStyle: { right: -25, bottom: -35, width: 180, height: 180, opacity: 1 }
    },
    {
      id: 'f20',
      label: 'Business &\nStartups',
      icon: f_business,
      image: fh_business,
      heroLine1: 'Scaling Enterprises to', heroLine2: ' Unprecedented Heights', heroLine3: '',
      heroDesc: 'Collaborate with startup consultants, business strategists, and visionary entrepreneurs.',
      gradient: ['rgba(170, 7, 121, 1)', 'rgba(68, 3, 48, 1)'] as [string, string],
      charStyle: { right: -25, bottom: -30, width: 180, height: 180, opacity: 1 }
    },
    {
      id: 'f21',
      label: 'Community\nPages',
      icon: f_community,
      image: fh_community,
      heroLine1: 'Building Meaningful', heroLine2: ' Connections Together', heroLine3: '',
      heroDesc: 'Engage with community managers, moderators, and active group organizers.',
      gradient: ['#D946EF', '#A21CAF'] as [string, string],
      charStyle: { right: -25, bottom: -30, width: 180, height: 180, opacity: 1 }
    },
    {
      id: 'f22',
      label: 'Family, Kids\n& Pets',
      icon: f_family,
      image: fh_family,
      heroLine1: 'Heartwarming Content', heroLine2: ' for the Whole Family', heroLine3: '',
      heroDesc: 'Partner with parenting bloggers, family lifestyle creators, and child development experts.',
      gradient: ['rgba(11, 145, 212, 1)', 'rgba(4, 97, 144, 1)'] as [string, string],
      charStyle: { right: -25, bottom: -40, width: 180, height: 180, opacity: 1 }
    },
    {
      id: 'f23',
      label: 'Home &\nDecor',
      icon: f_home,
      image: fh_home,
      heroLine1: 'Transforming Spaces into', heroLine2: ' Beautiful Sanctuaries', heroLine3: '',
      heroDesc: 'Work with interior designers, DIY experts, home organizers, and decor specialists.',
      gradient: ['rgba(68, 7, 201, 1)', 'rgba(34, 4, 99, 1)'] as [string, string],
      charStyle: { right: -25, bottom: -30, width: 180, height: 180, opacity: 1 }
    },
    {
      id: 'f24',
      label: 'Law, Rights\n& Activism',
      icon: f_law,
      image: fh_law,
      heroLine1: 'Standing for Justice and', heroLine2: ' Powerful Advocacy', heroLine3: '',
      heroDesc: 'Connect with legal consultants, human rights advocates, and policy commentators.',
      gradient: ['rgba(244, 102, 13, 1)', 'rgba(99, 40, 4, 1)'] as [string, string],
      charStyle: { right: -25, bottom: -30, width: 180, height: 180, opacity: 1 }
    },
    {
      id: 'f25',
      label: 'Pets &\nAnimals',
      icon: f_pets,
      image: fh_pets,
      heroLine1: 'Celebrating Our Beloved', heroLine2: ' Animal Companions', heroLine3: '',
      heroDesc: 'Discover expert pet trainers, veterinarians, animal photographers, and pet influencers.',
      gradient: ['rgba(13, 121, 244, 1)', 'rgba(8, 71, 142, 1)'] as [string, string],
      charStyle: { right: -25, bottom: -30, width: 180, height: 180, opacity: 1 }
    },
    {
      id: 'f26',
      label: 'Politics',
      icon: f_politics,
      image: fh_politics,
      heroLine1: 'Informed Perspectives and', heroLine2: ' Civic Discourse', heroLine3: '',
      heroDesc: 'Engage with political analysts, commentators, debate hosts, and campaign strategists.',
      gradient: ['rgba(7, 184, 201, 1)', 'rgba(4, 91, 99, 1)'] as [string, string],
      charStyle: { right: -25, bottom: -30, width: 180, height: 180, opacity: 1 }
    },
  ];

  const availableCategories = useMemo(() => {
    if (userRole === 'FREELANCER') {
      return [
        {
          id: 'all',
          label: 'All',
          icon: imgGrowthicon,
          image: imgPhotography,
          heroLine1: 'Explore Our Freelancers', heroLine2: ' ', heroLine3: '',
          heroDesc: 'Discover top talents and connect with the right people for any project.',
          gradient: ['#f26930', '#c2410c'] as [string, string],
          charStyle: { right: -25, bottom: -30, width: 180, height: 180, opacity: 1 }
        },
        ...FREELANCER_CATEGORIES
      ];
    }
    return CATEGORIES;
  }, [userRole]);

  const activeCat = availableCategories.find(c => c.id === activeCategory) || availableCategories[0];
  const activeIndex = Math.max(0, availableCategories.findIndex(c => c.id === activeCategory));

  const tabScrollRef = React.useRef<ScrollView>(null);

  // When activeCategory changes, scroll the tab into view
  useEffect(() => {
    const idx = availableCategories.findIndex(c => c.id === activeCategory);
    if (idx >= 0 && tabScrollRef.current) {
      tabScrollRef.current.scrollTo({ x: idx * 112, animated: true });
    }
  }, [activeCategory, availableCategories]);

  useEffect(() => {
    if (!availableCategories.find(c => c.id === activeCategory)) {
      setActiveCategory(availableCategories[0].id);
    }
  }, [availableCategories]);

  // Constants for tab layout
  const TAB_WIDTH = 108;

  const allCards = useMemo(() => posts.map((p) => {
    const owner = p.owner || {};
    const name = owner.name || (owner.role === 'FREELANCER' ? 'Freelancer' : 'Creator');
    return {
      id: p.id, ownerId: owner.id, ownerRole: owner.role, name,
      role: owner.role ? owner.role.charAt(0) + owner.role.slice(1).toLowerCase() : 'User',
      desc: p.description || '',
      price: p.collaborationType === 'PAID' ? 'Paid Collab' : 'Free Collab',
      time: timeAgo(p.createdAt),
      avatarUri: owner.profilePicture || null,
      isInitials: !owner.profilePicture,
      initials: getInitials(name),
      experience: owner.experience || '5 years',
      languages: owner.languages || 'Telugu, English, Tamil',
      location: owner.location || owner.city || 'Hyderabad',
      category: owner.category?.slug || p.category?.slug || '',
    };
  }), [posts]);

  // Map explore tab IDs → backend category slugs
  const CATEGORY_SLUG_MAP: Record<string, string[]> = {
    photography: ['photography'],
    editor: ['video-editing', 'graphic-design'],
    videography: ['video-editing', 'videography'],
    growth: ['social-media', 'growth'],
    script: ['content-writing', 'script-writing'],
    styling: ['styling', 'makeup', 'beauty'],
    fashion: ['fashion', 'graphic-design'],
    property: ['property', 'real-estate'],
    voice: ['music-production', 'voice-over'],
  };

  const cards = useMemo(() => allCards.filter((item) => {
    if (!activeCategory || activeCategory === 'all') return true;
    const slugs = CATEGORY_SLUG_MAP[activeCategory] || [activeCategory];
    return slugs.some(s => item.category?.toLowerCase().includes(s));
  }), [allCards, activeCategory]);

  const handleCardTap = (postId: string, ownerId?: string) => {
    if (isGuest || !token) { router.push('/role-selection'); return; }
    if (!requireProfile('view this profile')) return;
    router.push({ pathname: '/creator-details', params: { postId, ...(ownerId ? { userId: ownerId } : {}) } } as any);
  };

  const handlePortfolio = async (ownerId?: string, ownerRole?: string) => {
    setSelectedPortfolioLink(null); setPortfolioLoading(true); setPortfolioModalVisible(true);
    try {
      if (!token || !ownerId) { setPortfolioLoading(false); return; }
      let profileData: any = null;
      if (ownerRole === 'FREELANCER') {
        const res = await getFreelancerById(ownerId, token);
        profileData = res.success ? res.data : null;
      } else {
        const res = await getCreatorById(ownerId, token);
        profileData = res.success ? res.data : null;
      }
      setSelectedPortfolioLink(profileData?.portfolioUrl || profileData?.portfolio || profileData?.portfolioLink || null);
    } catch { setSelectedPortfolioLink(null); } finally { setPortfolioLoading(false); }
  };

  const handleShare = async (postId: string) => {
    try {
      await Share.share({ message: `Check out this post on Digitag! https://digitag.com/post/${postId}`, title: 'Digitag Post' });
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const handleMessage = (ownerId?: string) => {
    if (isGuest || !token) { router.push('/role-selection'); return; }
    if (!requireProfile('message this user')) return;
  };

  const handleCall = useCallback(() => {
    if (isGuest || !token) { router.push('/role-selection'); return; }
    if (!requireProfile('call this user')) return;
    Alert.alert('Contact', 'Phone contact is not available yet.');
  }, [isGuest, token, router, requireProfile]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    const postTheme = getRoleTheme(item.ownerRole);
    const accent = postTheme.primary;
    return (
      <View style={{ paddingHorizontal: 8, paddingBottom: 20 }}>
        <TouchableOpacity
          style={[s.card, { borderColor: accent + '5D', borderTopColor: accent, borderTopWidth: 0, borderLeftWidth: 0.5, borderRightWidth: 0.5 }]}
          activeOpacity={0.10}
          onPress={() => handleCardTap(item.id, item.ownerId)}
        >
          {/* Avatar + Name */}
          <View style={s.cardTop}>
            <View style={s.cardAvatarWrap}>
              {item.isInitials ? (
                <View style={[s.cardAvatar, { backgroundColor: accent + '33' }]}>
                  <Text style={[s.cardInitials, { color: accent }]}>{item.initials}</Text>
                </View>
              ) : (
                <Image source={{ uri: item.avatarUri }} style={s.cardAvatar} resizeMode="cover" />
              )}
            </View>
            <View style={s.cardNameArea}>
              <View style={s.cardNameRow}>
                <Text style={s.cardName}>{item.name}</Text>
                <Ionicons name="shield-checkmark" size={14} color="#f26930" style={{ marginLeft: 6 }} />
              </View>
              <TouchableOpacity onPress={() => handlePortfolio(item.ownerId, item.ownerRole)}>
                <Text style={[s.cardPortfolioLink, { color: accent }]}>See Portfolio ▾</Text>
              </TouchableOpacity>
            </View>
            {/* Bookmark */}
            <TouchableOpacity style={s.bookmarkBtn}>
              <Ionicons name="bookmark-outline" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Description */}
          <TouchableOpacity onPress={() => toggleExpand(item.id)} activeOpacity={0.7}>
            <Text style={s.cardDesc} numberOfLines={expandedPosts.has(item.id) ? undefined : 2}>
              {item.desc || 'Looking for a Photographer experienced in creating engaging short-form content'}
              {!expandedPosts.has(item.id) && <Text style={{ color: accent }}>... See more</Text>}
            </Text>
          </TouchableOpacity>

          {/* Info Grid */}
          <View style={s.infoGrid}>
            <View style={s.infoRow}>
              <View style={s.infoCell}>
                <Text style={s.infoLabel}>Experience</Text>
                <View style={s.infoValueRow}>
                  <Ionicons name="briefcase-outline" size={13} color="#a1a2a4" />
                  <Text style={s.infoValue}>{item.experience}</Text>
                </View>
              </View>
              <View style={s.infoCell}>
                <Text style={s.infoLabel}>Price Level <Text style={s.infoLabelSub}>(Primary)</Text></Text>
                <View style={s.infoValueRow}>
                  {[1, 2, 3, 4].map(i => (
                    <Text key={i} style={{ color: '#22c55e', fontSize: 14 }}>₹</Text>
                  ))}
                </View>
              </View>
            </View>
            <View style={s.infoRow}>
              <View style={s.infoCell}>
                <Text style={s.infoLabel}>Language</Text>
                <View style={s.infoValueRow}>
                  <Ionicons name="language-outline" size={13} color="#a1a2a4" />
                  <Text style={s.infoValue}>{item.languages}</Text>
                </View>
              </View>
              <View style={s.infoCell}>
                <Text style={s.infoLabel}>Location <Text style={s.infoLabelSub}>(Primary)</Text></Text>
                <View style={s.infoValueRow}>
                  <Ionicons name="location-outline" size={13} color="#a1a2a4" />
                  <Text style={s.infoValue}>{item.location}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Bottom Actions */}
          <View style={s.cardBottom}>
            <View style={s.cardActions}>
              <TouchableOpacity onPress={() => handleMessage(item.ownerId)} activeOpacity={0.75}>
                <ImageBackground source={require('../../assets/bg-icons.png')} style={s.iconCircleDark} imageStyle={{ borderRadius: 19 }}>
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
                </ImageBackground>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCall} activeOpacity={0.75}>
                <ImageBackground source={require('../../assets/bg-icons.png')} style={s.iconCircleDark} imageStyle={{ borderRadius: 19 }}>
                  <Ionicons name="call-outline" size={18} color="#fff" />
                </ImageBackground>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleShare(item.id)} activeOpacity={0.75}>
                <ImageBackground source={require('../../assets/bg-icons.png')} style={s.iconCircleDark} imageStyle={{ borderRadius: 19 }}>
                  <Ionicons name="share-social-outline" size={18} color="#fff" />
                </ImageBackground>
              </TouchableOpacity>
            </View>
            <View style={s.cardBottomRight}>
              <TouchableOpacity
                style={[s.seePortfolioBtn, { backgroundColor: accent }]}
                onPress={() => handlePortfolio(item.ownerId, item.ownerRole)}
              >
                <Text style={s.seePortfolioBtnText}>See Portfolio</Text>
              </TouchableOpacity>
              <View style={s.timeRow}>
                <Ionicons name="time-outline" size={12} color="#a1a2a4" />
                <Text style={s.timeText}>{item.time || '4h ago'}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  }, [expandedPosts, handleCardTap, handlePortfolio, handleMessage, handleCall, handleShare]);

  const listHeader = useMemo(() => (
    <View>
      {/* ═══ HEADER ═══ */}
      <View style={[s.header, { paddingTop: insets.top + 16 }]}>
        <GradientTitle text="Explore All" />
        <Text style={s.subtitle}>Discover & Connect with the right people</Text>
      </View>

      {/* ═══ HERO SECTION ═══ */}
      <View style={s.heroWrapper}>

        {/* Gradient background — ONLY behind hero content, below the tab row */}
        <View style={[StyleSheet.absoluteFill, { top: 106, backgroundColor: activeCat.gradient[1] }]} />
        <View style={[StyleSheet.absoluteFill, { top: 106, opacity: 0.6, backgroundColor: activeCat.gradient[0] }]} />

        {/* ── TABS: pinned to the very top ── */}
        <View style={s.tabRowWrapper}>
          <ScrollView
            ref={tabScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.catTabsRow}
            scrollEventThrottle={16}
            snapToInterval={TAB_WIDTH}
            decelerationRate="fast"
            nestedScrollEnabled={true}
          >
            {availableCategories.map((cat) => {
              const isActive = cat.id === activeCategory;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setActiveCategory(cat.id)}
                  activeOpacity={0.8}
                  style={[s.catTab, isActive ? [s.catTabActive, { zIndex: 10 }] : s.catTabInactive]}
                >
                  {/* Active tab: hero gradient bg + shoulders */}
                  {isActive && (
                    <View style={[StyleSheet.absoluteFill, { zIndex: 5 }]}>
                      {/* Inner wrapper for border radius clipping */}
                      <View style={[StyleSheet.absoluteFill, {
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        overflow: 'hidden',
                      }]}>
                        <View style={[StyleSheet.absoluteFill, { backgroundColor: activeCat.gradient[1] }]} />
                        <View style={[StyleSheet.absoluteFill, { backgroundColor: activeCat.gradient[0], opacity: 0.6 }]} />
                      </View>
                      {/* Shoulders placed outside the overflow: hidden wrapper */}
                      <FolderShoulder colors={activeCat.gradient} isLeft={true} />
                      <FolderShoulder colors={activeCat.gradient} isLeft={false} />
                    </View>
                  )}
                  {/* Inactive tab: #999 base + rgba(51,51,51,0.40) overlay */}
                  {!isActive && (
                    <View style={[StyleSheet.absoluteFill, {
                      backgroundColor: 'rgba(51, 51, 51, 0.40)',
                      borderTopLeftRadius: 20,
                      borderTopRightRadius: 20,
                    }]} />
                  )}
                  {/* Icon and Text wrapped to stay above absolute backgrounds */}
                  <View style={{ zIndex: 10, alignItems: 'center' }}>
                    {isActive && <ActiveTabGlow />}
                    <Image source={cat.icon} style={isActive ? s.catTabImgActive : s.catTabImg} resizeMode="contain" />
                    <Text style={isActive ? s.catTabLabelActive : s.catTabLabel} numberOfLines={2}>{cat.label}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── HERO CONTENT: sits below the tab row ── */}
        <View style={s.heroContentContainer} pointerEvents="none">
          <View style={s.heroContent}>
            <View style={s.heroTextArea}>
              <FadeText text={activeCat.heroLine1} style={[s.heroTitle, s.heroTitleBold]} />
              {!!activeCat.heroLine2 && activeCat.heroLine2.trim().length > 0 && (
                <FadeText text={activeCat.heroLine2} style={[s.heroTitle, s.heroTitleFaded]} />
              )}
              {!!activeCat.heroLine3 && activeCat.heroLine3.trim().length > 0 && (
                <FadeText text={activeCat.heroLine3} style={[s.heroTitle, s.heroTitleFaded]} />
              )}
              <Text style={s.heroDesc}>{activeCat.heroDesc}</Text>
            </View>
            <HeroAnimatedImage source={activeCat.image} style={[s.heroCharacter, activeCat.charStyle]} activeCatId={activeCat.id} isFreelancer={userRole === 'FREELANCER'} />
          </View>
          <Sparkles count={12} />
        </View>
      </View>

      <View style={s.filterRow}>
        <View style={s.filterCol}>
          <Text style={s.filterLabel}>Price Range</Text>
          <TouchableOpacity style={s.filterDropdown} activeOpacity={0.7}>
            <Text style={s.filterPlaceholder}>Select Price Range</Text>
            <Ionicons name="filter" size={16} color="#6e7180" />
          </TouchableOpacity>
        </View>
        <View style={s.filterCol}>
          <Text style={s.filterLabel}>Experience</Text>
          <TouchableOpacity style={s.filterDropdown} activeOpacity={0.7}>
            <Text style={s.filterPlaceholder}>Select experience</Text>
            <Ionicons name="chevron-down" size={20} color="#6e7180" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  ), [insets.top, activeCat, availableCategories, activeCategory]);

  if (!isReady) {
    return (
      <View style={[s.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#ED2A91" />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />
      <FlatList
        data={cards}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          !loading ? (
            <View style={s.emptyState}>
              <Ionicons name="compass-outline" size={48} color="#3A3A47" />
              <Text style={s.emptyTitle}>Nothing to explore yet</Text>
              <Text style={s.emptySubtitle}>Pull down to refresh — new posts will appear here.</Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ED2A91" />}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        initialNumToRender={4}
        windowSize={7}
        nestedScrollEnabled={true}
      />


      {/* ═══ PORTFOLIO MODAL ═══ */}
      <Modal visible={portfolioModalVisible} transparent animationType="slide" onRequestClose={() => setPortfolioModalVisible(false)}>
        <View style={s.modalOverlay}>
          <TouchableOpacity style={s.modalDismiss} activeOpacity={1} onPress={() => setPortfolioModalVisible(false)} />
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Feather name="link" size={20} color="#fff" />
                <Text style={s.modalTitle}>Portfolio Links</Text>
              </View>
              <TouchableOpacity style={s.modalClose} onPress={() => setPortfolioModalVisible(false)}>
                <Feather name="x" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
            {portfolioLoading ? (
              <ActivityIndicator color="#A78BFA" style={{ marginTop: 16 }} />
            ) : selectedPortfolioLink ? (
              <TouchableOpacity style={s.portfolioRow} onPress={() => {
                let url = selectedPortfolioLink;
                if (!url.startsWith('http')) url = 'https://' + url;
                Linking.openURL(url);
              }}>
                <Text style={s.portfolioLinkText}>{selectedPortfolioLink}</Text>
                <Feather name="arrow-up-right" size={20} color="#A78BFA" />
              </TouchableOpacity>
            ) : (
              <Text style={s.noPortfolio}>No portfolio link provided.</Text>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  scroll: { flex: 1 },

  // Header
  header: { paddingHorizontal: 16, paddingBottom: 20, },
  subtitle: { color: '#E2E2E2', fontSize: 12, marginTop: 4, fontFamily: 'Poppins_400Regular', lineHeight: 18 },

  // Hero wrapper
  heroWrapper: {
    height: 403,
    overflow: 'hidden',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  // Wraps the horizontal scroll, pinned at the very top of heroWrapper
  tabRowWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 106,
    zIndex: 2,
    backgroundColor: '#000',
  },
  catTabsRow: { gap: 0, paddingHorizontal: 8, alignItems: 'flex-end', flexGrow: 1 },

  catTab: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 6,
    paddingTop: 14,
    paddingBottom: 8,
  },
  catTabActive: {
    width: 108,
    height: 106,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  catTabInactive: {
    width: 108,
    height: 106,
    backgroundColor: 'rgba(19, 19, 19, 1)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  catTabImg: { width: 29, height: 30, marginBottom: 5, marginTop: 10 },
  catTabImgActive: { width: 49, height: 40, marginBottom: 6, marginTop: 10 },
  catTabLabel: { color: '#fff', fontSize: 10, fontFamily: 'Poppins_600SemiBold', textAlign: 'center' },
  catTabLabelActive: { color: '#fff', fontSize: 11, fontFamily: 'Poppins_600SemiBold', textAlign: 'center' },

  heroContentContainer: {
    position: 'absolute',
    top: 106,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    overflow: 'hidden',
    zIndex: 1,
  },

  // Sparkle dots
  sparkleDot: { position: 'absolute', borderRadius: 99, backgroundColor: '#fff' },

  // Hero text + character
  heroContent: { flex: 1, position: 'relative' },
  heroTextArea: { maxWidth: '78%', marginTop: 35, },
  heroTitle: { fontSize: 20, lineHeight: 30, fontFamily: 'Poppins_700Bold', },
  heroTitleBold: { color: '#fff' },
  heroTitleFaded: { color: 'rgba(255,255,255,0.8)' },
  heroDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 20, marginTop: 10 },
  heroCharacter: {
    position: 'absolute',
    // Default values if not specified in category
    right: -40,
    bottom: -55,
    width: 210,
    height: 210,
  },

  // Filters
  filterRow: { flexDirection: 'row', paddingHorizontal: 8, gap: 16, marginBottom: 24, marginTop: 40 },
  filterCol: { flex: 1 },
  filterLabel: { color: '#fff', fontSize: 14, fontFamily: 'Poppins_400Regular', marginBottom: 6 },
  filterDropdown: {
    height: 46, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(64,64,64,0.5)',
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, justifyContent: 'space-between',
  },
  filterPlaceholder: { color: '#6e7180', fontSize: 13, fontFamily: 'Poppins_400Regular' },

  // Empty
  emptyState: { paddingHorizontal: 40, paddingTop: 60, alignItems: 'center', gap: 10 },
  emptyTitle: { color: '#fff', fontSize: 17, fontWeight: '600', marginTop: 10 },
  emptySubtitle: { color: '#888', fontSize: 13, textAlign: 'center', lineHeight: 20 },

  // Feed
  feedList: { paddingHorizontal: 8, gap: 20 },

  // Card
  card: {
    backgroundColor: '#1a1a1a', borderRadius: 24, padding: 16,
    borderWidth: 1,


  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  cardAvatarWrap: { marginRight: 14 },
  cardAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#333', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  cardInitials: { fontSize: 20, fontWeight: '700' },
  cardNameArea: { flex: 1, paddingTop: 4 },
  cardNameRow: { flexDirection: 'row', alignItems: 'center' },
  cardName: { color: '#fff', fontSize: 18, fontFamily: 'Poppins_500Medium' },
  cardPortfolioLink: { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  bookmarkBtn: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(39,39,42,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Description
  cardDesc: { color: '#d1d2d4', fontSize: 12, fontFamily: 'Poppins_300Light', lineHeight: 18, marginBottom: 14 },

  // Info Grid
  infoGrid: { gap: 12, marginBottom: 14 },
  infoRow: { flexDirection: 'row', gap: 16 },
  infoCell: { flex: 1 },
  infoLabel: { color: '#fff', fontSize: 11, fontFamily: 'Poppins_400Regular', marginBottom: 6 },
  infoLabelSub: { color: '#d1d2d4' },
  infoValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: 'Poppins_400Regular' },
  infoValue: { color: '#a1a2a4', fontSize: 11, fontFamily: 'Poppins_400Regular' },

  // Bottom
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardActions: { flexDirection: 'row', gap: 12 },
  iconCircleDark: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cardBottomRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  seePortfolioBtn: {
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: 99,
    alignItems: 'center', justifyContent: 'center',
  },
  seePortfolioBtnText: { color: '#fff', fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  timeText: { color: '#a1a2a4', fontSize: 10, fontFamily: 'Poppins_500Medium' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalDismiss: { flex: 1 },
  modalContent: {
    height: '30%', backgroundColor: '#1E1E24', borderTopLeftRadius: 30, borderTopRightRadius: 30,
    padding: 24, borderTopWidth: 1, borderColor: 'rgba(156,156,156,0.3)',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 },
  modalTitle: { color: '#fff', fontSize: 18, fontFamily: 'Poppins_600SemiBold' },
  modalClose: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  portfolioRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  portfolioLinkText: { color: '#fff', fontSize: 16, fontFamily: 'Poppins_500Medium', flex: 1, marginRight: 12 },
  noPortfolio: { color: '#8A8A99', fontSize: 14, fontFamily: 'Poppins_400Regular', marginTop: 10 },
});
