import { useAuth } from '@/context/AuthContext';
import { useProfileGate } from '@/context/ProfileGateContext';
import { getCreatorById, getFeed, getFreelancerById } from '@/services/userService';
import { useRoleTheme } from '@/theme/useRoleTheme';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedScrollHandler,
  useSharedValue
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Ellipse, FeGaussianBlur, Filter, G, Path, Stop, LinearGradient as SvgGradient, Text as SvgText } from 'react-native-svg';
import Svg, { Defs, Path, Stop, LinearGradient as SvgGradient, Text as SvgText } from 'react-native-svg';

const { width } = Dimensions.get('window');

const FALLBACK_BANNER = 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=1000&auto=format&fit=crop';

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

const imgPhotography = require('../../assets/categories/Photography.gif');
const imgEditor = require('../../assets/categories/editor.gif');
const imgVideography = require('../../assets/categories/Videography.gif');
const imgGrowth = require('../../assets/categories/growth spcielist.gif');
const imgScriptWriters = require('../../assets/categories/script-writing.gif');
const imgStyling = require('../../assets/categories/Styling-makeup.gif');
const imgFashion = require('../../assets/categories/Fashion-Designers.gif');
const imgProperty = require('../../assets/categories/property-rental.gif');

const CATEGORIES = [
  {
    id: 'photography',
    label: 'Photography',
    image: imgPhotography,
    heroLine1: 'Every', heroLine2: 'Moment', heroLine3: '',
    heroDesc: 'Turning moments into timeless visual stories with creativity and emotion.',
    gradient: ['#7C3AED', '#4C1D95'] as [string, string]
  },
  {
    id: 'editor',
    label: 'Editor',
    image: imgEditor,
    heroLine1: 'Editing That Brings', heroLine2: 'Stories to Life', heroLine3: '',
    heroDesc: 'High-quality edits designed to make your content stand out across every platform.',
    gradient: ['#9D174D', '#831843'] as [string, string]
  },
  {
    id: 'videography',
    label: 'Videography',
    image: imgVideography,
    heroLine1: 'Bringing Ideas to Life', heroLine2: 'on Screen', heroLine3: '',
    heroDesc: 'High-quality edits designed to make your content stand out across every platform.',
    gradient: ['#0284C7', '#075985'] as [string, string]
  },
  {
    id: 'growth',
    label: 'Growth\nSpecialist',
    image: imgGrowth,
    heroLine1: 'Accelerate Your', heroLine2: 'Brand Growth', heroLine3: '',
    heroDesc: 'Growth-focused solutions tailored for modern creators, brands, and agencies.',
    gradient: ['#4338CA', '#3730A3'] as [string, string]
  },
  {
    id: 'script',
    label: 'Script Writers',
    image: imgScriptWriters,
    heroLine1: 'Crafting Compelling', heroLine2: 'Narratives', heroLine3: '',
    heroDesc: 'Engaging scripts that drive your story forward and captivate your audience.',
    gradient: ['#1E3A8A', '#1E40AF'] as [string, string]
  },
  {
    id: 'styling',
    label: 'Styling &\nmakeup',
    image: imgStyling,
    heroLine1: 'The Art of', heroLine2: 'Visual Style', heroLine3: '',
    heroDesc: 'Professional makeup and styling to ensure you look your best on camera.',
    gradient: ['#7E22CE', '#6B21A8'] as [string, string]
  },
  {
    id: 'fashion',
    label: 'Fashion\nDesigners',
    image: imgFashion,
    heroLine1: 'Innovative', heroLine2: 'Fashion Design', heroLine3: '',
    heroDesc: 'Custom clothing and style consulting for high-impact visual productions.',
    gradient: ['#BE185D', '#9D174D'] as [string, string]
  },
  {
    id: 'property',
    label: 'Property\nRental',
    image: imgProperty,
    heroLine1: 'Perfect Locations', heroLine2: 'for Your Vision', heroLine3: '',
    heroDesc: 'Premium properties and studio spaces for rent for any type of production.',
    gradient: ['#B45309', '#92400E'] as [string, string]
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

const GradientTitle = ({ text, accentColor }: { text: string; accentColor: string }) => {
  const fontSize = 28;
  const w = text.length * fontSize * 0.58;
  const h = fontSize * 1.4;
  return (
    <View style={{ width: w, height: h }}>
      <Svg height="100%" width="100%" viewBox={`0 0 ${w} ${h}`}>
        <Defs>
          <SvgGradient id="titleGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="1" />
            <Stop offset="1" stopColor={accentColor} stopOpacity="1" />
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
const AnimatedPath = Animated.createAnimatedComponent(Path);

const FolderBackground = ({ scrollX, activeIndexAnim, width, height, tabWidth, tabHeight, radius, colors }: any) => {
  const r = radius || 24;
  const tw = tabWidth || 110;
  const th = tabHeight || 90;
  const w = width;
  const h = height;

  const animatedProps = useAnimatedProps(() => {
    const tx = 8 + activeIndexAnim.value * 120 - scrollX.value; // 8 padding + (120 width + 0 gap)

    const d = `
      M 0 ${th + r}
      ${tx > r ? `
        A ${r} ${r} 0 0 1 ${r} ${th}
        L ${tx - r} ${th}
        A ${r} ${r} 0 0 0 ${tx} ${th - r}
        L ${tx} ${r}
        A ${r} ${r} 0 0 1 ${tx + r} 0
      ` : tx > 0 ? `
        M 0 ${th + (r - tx)}
        A ${tx} ${tx} 0 0 1 ${tx} ${th}
        A ${r} ${r} 0 0 0 ${tx} ${th - r}
        L ${tx} ${r}
        A ${r} ${r} 0 0 1 ${tx + r} 0
      ` : `
        M 0 ${r}
        A ${r} ${r} 0 0 1 ${r} 0
      `}
      L ${Math.min(w - r, tx + tw - r)} 0
      ${tx + tw < w - r ? `
        A ${r} ${r} 0 0 1 ${tx + tw} ${r}
        L ${tx + tw} ${th - r}
        A ${r} ${r} 0 0 0 ${tx + tw + r} ${th}
        L ${w - r} ${th}
        A ${r} ${r} 0 0 1 ${w} ${th + r}
      ` : `
        A ${r} ${r} 0 0 1 ${w} ${r}
      `}
      L ${w} ${h}
      L 0 ${h}
      Z
    `;
    return { d };
  });

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, width: w, height: h }}>
      <Svg width={w} height={h}>
        <Defs>
          <SvgGradient id="folderGrad" x1="0" y1="0" x2="0.5" y2="1">
            <Stop offset="0" stopColor={colors[0]} />
            <Stop offset="1" stopColor={colors[1]} />
          </SvgGradient>
        </Defs>
        <AnimatedPath animatedProps={animatedProps} fill="url(#folderGrad)" />
      </Svg>
      {/* Sparkles Overlay */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Sparkles />
      </View>
    </View>
  );
};

const Sparkles = () => {
  return (
    <>
      <Ionicons name="sparkles" size={16} color="rgba(255,255,255,0.2)" style={{ position: 'absolute', top: 40, left: 80 }} />
      <Ionicons name="sparkles" size={12} color="rgba(255,255,255,0.1)" style={{ position: 'absolute', top: 120, right: 40 }} />
      <Ionicons name="sparkles" size={20} color="rgba(255,255,255,0.15)" style={{ position: 'absolute', bottom: 60, left: 30 }} />
      <View style={[s.sparkleDot, { width: 4, height: 4, top: 100, left: 120, opacity: 0.3 }]} />
      <View style={[s.sparkleDot, { width: 2, height: 2, top: 150, right: 100, opacity: 0.2 }]} />
      <View style={[s.sparkleDot, { width: 3, height: 3, bottom: 80, right: 150, opacity: 0.4 }]} />
    </>
  );
};

export default function ExploreTab() {
  const router = useRouter();
  const { category: paramCategory } = useLocalSearchParams<{ category?: string }>();
  const insets = useSafeAreaInsets();
  const { token, isGuest, userRole } = useAuth();
  const { requireProfile } = useProfileGate();
  const theme = useRoleTheme();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState(
    paramCategory && CATEGORIES.find(c => c.id === paramCategory) ? paramCategory : CATEGORIES[0].id
  );
  const [portfolioModalVisible, setPortfolioModalVisible] = useState(false);
  const [selectedPortfolioLink, setSelectedPortfolioLink] = useState<string | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [collabSentIds, setCollabSentIds] = useState<Set<string>>(new Set());

  const fetchPosts = useCallback(async () => {
    if (!token) { setPosts([]); setLoading(false); return; }
    try {
      const res = await getFeed(token);
      setPosts(Array.isArray(res.data) ? res.data : []);
    } catch { setPosts([]); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  useEffect(() => {
    if (paramCategory && CATEGORIES.find(c => c.id === paramCategory)) {
      setActiveCategory(paramCategory);
    }
  }, [paramCategory]);

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
    // If user is a Freelancer, only show the first 4 categories
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
    // Otherwise (Creator or Guest), show all
    return CATEGORIES;
  }, [userRole]);

  const activeCat = availableCategories.find(c => c.id === activeCategory) || availableCategories[0];
  const activeIndex = Math.max(0, availableCategories.findIndex(c => c.id === activeCategory));

  const scrollX = useSharedValue(0);
  const activeIndexAnim = useSharedValue(activeIndex);

  useEffect(() => {
    // Instantly snap the folder tab when the active index changes (no effects)
    activeIndexAnim.value = activeIndex;
  }, [activeIndex]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      // Synchronize the scroll position with zero-lag on the UI thread
      scrollX.value = event.contentOffset.x;
    },
  });

  useEffect(() => {
    if (!availableCategories.find(c => c.id === activeCategory)) {
      setActiveCategory(availableCategories[0].id);
    }
  }, [availableCategories]);

  // Constants for tab layout
  const TAB_ACTIVE_WIDTH = 120;
  const TAB_INACTIVE_WIDTH = 120;
  const TAB_GAP = 0;

  const allCards = posts.map((p) => {
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
      category: owner.category || p.category || '',
    };
  });

  const cards = allCards.filter((item) => {
    if (!activeCategory) return true;
    return true;
  });

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

  const handleCall = () => {
    if (isGuest || !token) { router.push('/role-selection'); return; }
    if (!requireProfile('call this user')) return;
    Alert.alert('Contact', 'Phone contact is not available yet.');
  };

  return (
    <View style={s.root}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {/* ═══ HEADER ═══ */}
        <View style={[s.header, { paddingTop: insets.top + 16 }]}>
          <GradientTitle text="Explore All" accentColor={theme.primary} />
          <Text style={s.subtitle}>Discover & Connect with the right people</Text>
        </View>

        {/* ═══ HERO SECTION (FOLDER STYLE) ═══ */}
        <View style={s.heroWrapper}>
          <FolderBackground
            width={width}
            height={380}
            scrollX={scrollX}
            activeIndexAnim={activeIndexAnim}
            tabWidth={TAB_ACTIVE_WIDTH}
            tabHeight={100}
            colors={activeCat.gradient}
          />

          {/* ═══ CATEGORY TABS ═══ */}
          <View style={s.catTabsContainer}>
            <Animated.ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.catTabsRow}
              onScroll={scrollHandler}
              scrollEventThrottle={16}
            >
              {availableCategories.map((cat) => {
                const isActive = cat.id === activeCategory;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    activeOpacity={0.8}
                    onPress={() => setActiveCategory(cat.id)}
                    style={[
                      isActive ? s.catTabActive : s.catTabInactive,
                      { width: isActive ? TAB_ACTIVE_WIDTH : TAB_INACTIVE_WIDTH }
                    ]}
                  >
                    <Image source={cat.image} style={s.catTabImg} resizeMode="contain" />
                    <Text style={isActive ? s.catTabLabelActive : s.catTabLabel}>{cat.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </Animated.ScrollView>
          </View>

          {/* ═══ HERO CONTENT ═══ */}
          <View style={s.heroContentContainer}>
            <View style={s.heroContent}>
              <View style={s.heroTextArea}>
                <Text style={s.heroTitle}>
                  <Text style={s.heroTitleBold}>{activeCat.heroLine1} </Text>
                  <Text style={s.heroTitleFaded}>{activeCat.heroLine2}{"\n"}</Text>
                  <Text style={s.heroTitleFaded}>{activeCat.heroLine3}</Text>
                </Text>
                <Text style={s.heroDesc}>{activeCat.heroDesc}</Text>
              </View>
              <Image source={activeCat.image} style={s.heroCharacter} resizeMode="contain" />
            </View>
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

        {/* ═══ FEED CARDS ═══ */}
        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
        ) : cards.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="compass-outline" size={48} color="#3A3A47" />
            <Text style={s.emptyTitle}>Nothing to explore yet</Text>
            <Text style={s.emptySubtitle}>Pull down to refresh — new posts will appear here.</Text>
          </View>
        ) : (
          <View style={s.feedList}>
            {cards.map((item) => {
              const accent = theme.primary;
              return (
                <TouchableOpacity key={item.id} style={s.card} activeOpacity={0.9} onPress={() => handleCardTap(item.id, item.ownerId)}>
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
                        <Ionicons name="shield-checkmark" size={14} color={theme.primary} style={{ marginLeft: 6 }} />
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
                  <Text style={s.cardDesc} numberOfLines={2}>
                    {item.desc || 'Looking for a Photographer experienced in creating engaging short-form content...'}
                    <Text style={{ color: accent }}> See more</Text>
                  </Text>

                  {/* Info Grid */}
                  <View style={s.infoGrid}>
                    {/* Row 1 */}
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
                            <Text key={i} style={{ color: theme.primary, fontSize: 14 }}>₹</Text>
                          ))}
                        </View>
                      </View>
                    </View>
                    {/* Row 2 */}
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
                      <TouchableOpacity style={s.actionCircle} onPress={() => handleMessage(item.ownerId)}>
                        <Ionicons name="chatbubble-ellipses-outline" size={16} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity style={s.actionCircle} onPress={handleCall}>
                        <Ionicons name="call-outline" size={16} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity style={s.actionCircle} onPress={() => handleShare(item.id)}>
                        <Ionicons name="share-social-outline" size={16} color="#fff" />
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
        )}
      </ScrollView>

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
  header: { paddingHorizontal: 16, paddingBottom: 20 },
  subtitle: { color: '#E2E2E2', fontSize: 12, marginTop: 4, fontFamily: 'Poppins_400Regular', lineHeight: 18 },

  // Hero wrapper
  heroWrapper: { marginHorizontal: 0, marginBottom: 0, position: 'relative', height: 380 },
  catTabsContainer: { flexDirection: 'row', zIndex: 1, height: 100 },
  catTabsRow: { gap: 0, paddingHorizontal: 8 },

  catTabActive: {
    alignItems: 'center', justifyContent: 'center', height: 100,
  },
  catTabInactive: {
    alignItems: 'center', justifyContent: 'center', height: 100,
    backgroundColor: '#1A1A1A', borderTopLeftRadius: 24, borderTopRightRadius: 24, alignSelf: 'flex-end',
  },
  catTabImg: { width: 28, height: 28, marginBottom: 4 },
  catTabLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: 'Poppins_600SemiBold', textAlign: 'center' },
  catTabLabelActive: { color: '#fff', fontSize: 11, fontFamily: 'Poppins_600SemiBold', textAlign: 'center' },

  heroContentContainer: { flex: 1, paddingHorizontal: 20, paddingBottom: 24, justifyContent: 'flex-end' },

  // Sparkle dots
  sparkleDot: { position: 'absolute', borderRadius: 99, backgroundColor: '#fff' },

  // Hero text + character
  heroContent: { flex: 1, position: 'relative' },
  heroTextArea: { maxWidth: '78%', marginTop: 35, },
  heroTitle: { fontSize: 20, lineHeight: 30, fontFamily: 'Poppins_700Bold', },
  heroTitleBold: { color: '#fff' },
  heroTitleFaded: { color: 'rgba(255,255,255,0.3)' },
  heroDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 18, marginTop: 8 },
  heroCharacter: { flex: 1, height: 160, marginLeft: 10 },

  // Filters
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 16, marginBottom: 24 },
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
  feedList: { paddingHorizontal: 16, gap: 16 },

  // Card
  card: {
    backgroundColor: '#1a1a1a', borderRadius: 24, padding: 16,
    borderWidth: 1, borderColor: '#000',
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
  infoLabel: { color: '#fff', fontSize: 11, fontFamily: 'Poppins_400Regular', marginBottom: 4 },
  infoLabelSub: { color: '#d1d2d4' },
  infoValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoValue: { color: '#a1a2a4', fontSize: 11, fontFamily: 'Poppins_400Regular' },

  // Bottom
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionCircle: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  cardBottomRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  seePortfolioBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99,
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
