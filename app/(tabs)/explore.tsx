import { useAuth } from '@/context/AuthContext';
import { useProfileGate } from '@/context/ProfileGateContext';
import { getFeed, getSavedPostIds, getUserById, initiateCall, listCollaborations, openConversationWith, sendCollaboration, toggleSavePost } from '@/services/userService';
import { getRoleTheme } from '@/theme/useRoleTheme';
import { Feather, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
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
import { SvgXml } from 'react-native-svg';
import { CREATOR_CAT_SVGS } from '../../assets/creator-cat';

const { width } = Dimensions.get('window');
const FALLBACK_BANNER = null;

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

const tf_photography = require('../../assets/tabs-icons-freelancer/Photography.png');
const tf_editor = require('../../assets/tabs-icons-freelancer/editors.png');
const tf_videography = require('../../assets/tabs-icons-freelancer/Videography.png');
const tf_growth = require('../../assets/tabs-icons-freelancer/GrowthSpecialist.png');
const tf_script = require('../../assets/tabs-icons-freelancer/ScriptWriters.png');
const tf_styling = require('../../assets/tabs-icons-freelancer/Stylingmakeup.png');
const tf_fashion = require('../../assets/tabs-icons-freelancer/FashionDesigners.png');
const tf_voice = require('../../assets/tabs-icons-freelancer/VoiceOver.png');
const tf_models = require('../../assets/tabs-icons-freelancer/Modals.png');
const tf_property = require('../../assets/tabs-icons-freelancer/PropertyRental.png');


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
    icon: tf_growth,
    image: imgPhotography,
    heroLine1: 'Explore Our Creators', heroLine2: ' ', heroLine3: '',
    heroDesc: 'Discover top talents and connect with the right people for any project.',
    gradient: ['#3b82f6', '#2563eb'] as [string, string],
    charStyle: { right: -45, bottom: -65, width: 111, height: 104, }
  },
  {
    id: 'photography',
    label: 'Photography',
    icon: tf_photography,
    image: imgPhotography,
    heroLine1: 'Capture Every Moment', heroLine2: 'Beautifully', heroLine3: '',
    heroDesc: 'Turning moments into timeless visual stories with creativity and emotion.',
    gradient: ['#6366f1', '#4f46e5'] as [string, string],
    charStyle: { right: -45, bottom: -65, width: 230, height: 230, }
  },
  {
    id: 'editor',
    label: 'Editor',
    icon: tf_editor,
    image: imgEditor,
    heroLine1: 'Editing That Brings', heroLine2: 'Stories to Life', heroLine3: '',
    heroDesc: 'High-quality edits designed to make your content stand out across every platform.',
    gradient: ['#9D174D', '#831843'] as [string, string],
    charStyle: { right: -57, bottom: -67, width: 220, height: 220 }
  },
  {
    id: 'videography',
    label: 'Videography',
    icon: tf_videography,
    image: imgVideography,
    heroLine1: 'Bringing Ideas to Life', heroLine2: 'on Screen', heroLine3: '',
    heroDesc: 'High-quality edits designed to make your content stand out across every platform.',
    gradient: ['#0284C7', '#075985'] as [string, string],
    charStyle: { right: -55, bottom: -50, width: 230, height: 230 }
  },
  {
    id: 'growth',
    label: 'Growth\nSpecialist',
    icon: tf_growth,
    image: imgGrowth,
    heroLine1: 'Accelerate Your', heroLine2: 'Brand Growth', heroLine3: '',
    heroDesc: 'Growth-focused solutions tailored for modern creators, brands, and agencies.',
    gradient: ['#4338CA', '#3730A3'] as [string, string],
    charStyle: { right: -40, bottom: -60, width: 240, height: 240 }
  },
  {
    id: 'script',
    label: 'Script Writers',
    icon: tf_script,
    image: imgScriptWriters,
    heroLine1: 'Turning Ideas into ', heroLine2: 'Powerful Scripts', heroLine3: '',
    heroDesc: 'Creative scripts crafted for films, ads, reels, podcasts, and digital content.',
    gradient: ['#1E3A8A', '#1E40AF'] as [string, string],
    charStyle: { right: -30, bottom: -55, width: 220, height: 220 }
  },
  {
    id: 'styling',
    label: 'Styling &\nmakeup',
    icon: tf_styling,
    image: imgStyling,
    heroLine1: 'Beauty Styled to ', heroLine2: 'Perfection', heroLine3: '',
    heroDesc: 'Expert makeup and styling designed to elevate every look with elegance and precision.',
    gradient: ['#7E22CE', '#6B21A8'] as [string, string],
    charStyle: { right: -35, bottom: -45, width: 230, height: 230 }
  },
  {
    id: 'fashion',
    label: 'Fashion\nDesigners',
    icon: tf_fashion,
    image: imgFashion,
    heroLine1: 'Where Style Meets ', heroLine2: 'Creativity', heroLine3: '',
    heroDesc: 'From modern trends to timeless looks, discover fashion designs made to stand out.',
    gradient: ['#BE185D', '#9D174D'] as [string, string],
    charStyle: { right: -35, bottom: -55, width: 170, height: 165 }
  },
  {
    id: 'voice',
    label: 'Voice\nOver',
    icon: tf_voice,
    image: imgVoiceicon,
    heroLine1: 'The Perfect Voice for', heroLine2: '  Your Content', heroLine3: '',
    heroDesc: 'From reels to commercials, discover voice artists who make every script unforgettable.',
    gradient: ['rgba(7, 184, 201, 1)', 'rgba(4, 91, 99, 1)'] as [string, string],
    charStyle: { right: -40, bottom: -63, width: 200, height: 200 }
  },
  {
    id: 'models',
    label: 'Models',
    icon: tf_models,
    image: imgFashion,
    heroLine1: 'Strike the Perfect', heroLine2: 'Pose', heroLine3: '',
    heroDesc: 'Connect with professional models for your shoots, campaigns, and creative projects.',
    gradient: ['#DB2777', '#9D174D'] as [string, string],
    charStyle: { right: -30, bottom: -45, width: 170, height: 165 }
  },
  {
    id: 'property',
    label: 'Property\nRental',
    icon: tf_property,
    image: imgProperty,
    heroLine1: 'Spaces Designed for   ', heroLine2: ' Better Living', heroLine3: '',
    heroDesc: 'Explore premium rental homes, apartments, and workspaces tailored to your needs.',
    gradient: ['#B45309', '#92400E'] as [string, string],
    charStyle: { right: -40, bottom: -63, width: 225, height: 225 }
  },
];

const FREELANCER_CATEGORIES = [
  {
    id: 'f1',
    label: 'Lifestyle &\nLiving',
    iconSvg: CREATOR_CAT_SVGS['Lifestyle-Living'],
    image: fh_lifestyle,
    heroLine1: 'Elevate Your Everyday  ', heroLine2: 'Lifestyle ', heroLine3: '',
    heroDesc: 'Modern lifestyle inspiration for fashion, wellness, travel, home, and everyday living.',
    gradient: ['rgba(136, 21, 250, 1)', 'rgba(136, 21, 250, 1)'] as [string, string],
    charStyle: { right: -25, bottom: -45, width: 180, height: 180, opacity: 1 }
  },
  {
    id: 'f2',
    label: 'Tech',
    iconSvg: CREATOR_CAT_SVGS['Tech'],
    image: fh_tech,
    heroLine1: 'Technology That Powers  ', heroLine2: ' the Future ', heroLine3: '',
    heroDesc: 'Modern technology experiences crafted for speed, creativity, and growth.',
    gradient: ['rgba(170, 7, 121, 1)', 'rgba(68, 3, 48, 1))'] as [string, string],
    charStyle: { right: -25, bottom: -45, width: 180, height: 180, opacity: 1 }
  },
  {
    id: 'f3',
    label: 'Education',
    iconSvg: CREATOR_CAT_SVGS['Education'],
    image: fh_education,
    heroLine1: 'Unlock Your Learning ', heroLine2: ' Potential ', heroLine3: '',
    heroDesc: 'Modern education experiences designed for ambitious learners and future creators.',
    gradient: ['rgba(11, 145, 212, 1) ', 'rgba(4, 97, 144, 1)'] as [string, string],
    charStyle: { right: -25, bottom: -45, width: 180, height: 180, opacity: 1 }
  },
  {
    id: 'f4',
    label: 'Photography',
    iconSvg: CREATOR_CAT_SVGS['Photography'],
    image: fh_photography,
    heroLine1: 'Where Creativity ', heroLine2: ' Meets Photography', heroLine3: '',
    heroDesc: 'From portraits to brand shoots, every frame is crafted to stand out beautifully.',
    gradient: ['#D97706', '#B45309'] as [string, string],
    charStyle: { right: -25, bottom: -45, width: 180, height: 180, opacity: 1 }
  },
  {
    id: 'f5',
    label: 'Food',
    iconSvg: CREATOR_CAT_SVGS['Food'],
    image: fh_food,
    heroLine1: 'Eat Fresh. Feel Happy.', heroLine2: ' ', heroLine3: '',
    heroDesc: 'Tasty food experiences crafted for every foodie and every occasion.',
    gradient: ['rgba(68, 7, 201, 1)', 'rgba(68, 7, 201, 1)'] as [string, string],
    charStyle: { right: -25, bottom: -45, width: 180, height: 180, opacity: 1 }
  },
  {
    id: 'f6',
    label: 'Health',
    iconSvg: CREATOR_CAT_SVGS['Health'],
    image: fh_health,
    heroLine1: 'Your Health, Your  ', heroLine2: '  Priority', heroLine3: '',
    heroDesc: 'Smart wellness solutions designed for modern lifestyles and everyday care.',
    gradient: ['#0D9488', '#0F766E'] as [string, string],
    charStyle: { right: -25, bottom: -45, width: 180, height: 180, opacity: 1 }
  },
  {
    id: 'f7',
    label: 'Automotive',
    iconSvg: CREATOR_CAT_SVGS['Automotive'],
    image: fh_automotive,
    heroLine1: 'Performance Meets ', heroLine2: '  Innovation', heroLine3: '',
    heroDesc: 'Automotive experiences crafted for passionate drivers and modern lifestyles.',
    gradient: ['rgba(244, 102, 13, 1)', 'rgba(99, 40, 4, 1)'] as [string, string],
    charStyle: { right: -25, bottom: -45, width: 180, height: 180, opacity: 1 }
  },
  {
    id: 'f8',
    label: 'Comedy &\nMemes',
    iconSvg: CREATOR_CAT_SVGS['Comedy-Memes'],
    image: fh_comedy,
    heroLine1: 'Scroll Less, Laugh More', heroLine2: ' ', heroLine3: '',
    heroDesc: 'Your daily dose of humor, memes, and endless entertainment.',
    gradient: ['rgba(4, 63, 96, 1)', 'rgba(8, 130, 198, 1)'] as [string, string],
    charStyle: { right: -25, bottom: -45, width: 180, height: 180, opacity: 1 }
  },
  {
    id: 'f9',
    label: 'Entertainment',
    iconSvg: CREATOR_CAT_SVGS['Entertainment'],
    image: fh_entertainment,
    heroLine1: 'Endless Entertainment', heroLine2: ' Starts Here', heroLine3: '',
    heroDesc: 'Trending content, creators, music, and media all in one exciting experience.',
    gradient: ['rgba(13, 121, 244, 1)', 'rgba(8, 71, 142, 1)'] as [string, string],
    charStyle: { right: -25, bottom: -45, width: 180, height: 180, opacity: 1 }
  },
  {
    id: 'f10',
    label: 'Gaming &\nAnime',
    iconSvg: CREATOR_CAT_SVGS['Gaming-Anime'],
    image: fh_gaming,
    heroLine1: 'Game. Stream. Anime.', heroLine2: ' Repeat.', heroLine3: '',
    heroDesc: 'Everything you love about gaming and anime in one exciting experience.',
    gradient: ['rgba(136, 21, 250, 1)', 'rgba(53, 10, 97, 1)'] as [string, string],
    charStyle: { right: -25, bottom: -45, width: 180, height: 180, opacity: 1 }
  },
  {
    id: 'f11',
    label: 'Learning',
    iconSvg: CREATOR_CAT_SVGS['Learning'],
    image: fh_learning,
    heroLine1: 'Keep Learning, Keep  ', heroLine2: ' Growing', heroLine3: '',
    heroDesc: 'Modern learning experiences for ambitious minds and future creators.',
    gradient: ['rgba(170, 7, 121, 1)', 'rgba(170, 7, 121, 1)'] as [string, string],
    charStyle: { right: -25, bottom: -45, width: 180, height: 180, opacity: 1 }
  },
  {
    id: 'f12',
    label: 'News, Media\n& Magazins',
    iconSvg: CREATOR_CAT_SVGS['News-Media-Magazins'],
    image: fh_news,
    heroLine1: 'Delivering Powerful', heroLine2: ' Headlines & Stories', heroLine3: '',
    heroDesc: 'Collaborate with experienced journalists, editors, and digital publishers.',
    gradient: ['rgba(11, 145, 212, 1)', 'rgba(4, 97, 144, 1)'] as [string, string],
    charStyle: { right: -25, bottom: -45, width: 180, height: 180, opacity: 1 }
  },
  {
    id: 'f13',
    label: 'Sports',
    iconSvg: CREATOR_CAT_SVGS['Sports'],
    image: fh_sports,
    heroLine1: 'Unleash Peak Athletic', heroLine2: ' Performance', heroLine3: '',
    heroDesc: 'Connect with sports analysts, personal trainers, athletes, and fitness influencers.',
    gradient: ['rgba(68, 7, 201, 1)', 'rgba(68, 7, 201, 1)'] as [string, string],
    charStyle: { right: -25, bottom: -45, width: 180, height: 180, opacity: 1 }
  },
  {
    id: 'f14',
    label: 'Travel',
    iconSvg: CREATOR_CAT_SVGS['Travel'],
    image: fh_travel,
    heroLine1: 'Explore Breathtaking', heroLine2: ' Destinations Across Earth', heroLine3: '',
    heroDesc: 'Partner with travel vloggers, itinerary planners, and adventure storytellers.',
    gradient: ['rgba(244, 102, 13, 1)', 'rgba(244, 102, 13, 1)'] as [string, string],
    charStyle: { right: -20, bottom: -30, width: 170, height: 170, opacity: 1 }
  },
  {
    id: 'f15',
    label: 'Beauty',
    iconSvg: CREATOR_CAT_SVGS['Beauty'],
    image: fh_beauty,
    heroLine1: 'Redefining Aesthetics and', heroLine2: ' Modern Glamour', heroLine3: '',
    heroDesc: 'Work with makeup artists, skincare experts, beauty influencers, and stylists.',
    gradient: ['rgba(13, 121, 244, 1)', 'rgba(13, 121, 244, 1)'] as [string, string],
    charStyle: { right: -25, bottom: -40, width: 180, height: 180, opacity: 1 }
  },
  {
    id: 'f16',
    label: 'Fitness',
    iconSvg: CREATOR_CAT_SVGS['Fitness'],
    image: fh_fitness,
    heroLine1: 'Transform Your Body and', heroLine2: ' Push Your Limits', heroLine3: '',
    heroDesc: 'Discover elite coaches, workout programmers, and physique transformation experts.',
    gradient: ['rgba(156, 13, 244, 1)', 'rgba(91, 8, 142, 1)'] as [string, string],
    charStyle: { right: -25, bottom: -40, width: 180, height: 180, opacity: 1 }
  },
  {
    id: 'f17',
    label: 'Fashion',
    iconSvg: CREATOR_CAT_SVGS['Fashion'],
    image: fh_fashion,
    heroLine1: 'Setting the Trend with', heroLine2: ' Impeccable Style', heroLine3: '',
    heroDesc: 'Hire wardrobe stylists, fashion designers, models, and trendsetters for your campaign.',
    gradient: ['rgba(4, 63, 96, 1)', 'rgba(8, 130, 198, 1)'] as [string, string],
    charStyle: { right: -25, bottom: -45, width: 180, height: 180, opacity: 1 }
  },
  {
    id: 'f18',
    label: 'Finance &\nInvestments',
    iconSvg: CREATOR_CAT_SVGS['Finance-Investments'],
    image: fh_finance,
    heroLine1: 'Securing Wealth and', heroLine2: ' Financial Freedom', heroLine3: '',
    heroDesc: 'Connect with certified financial planners, market analysts, and investment advisors.',
    gradient: ['rgba(7, 184, 201, 1)', 'rgba(4, 91, 99, 1)'] as [string, string],
    charStyle: { right: -25, bottom: -35, width: 180, height: 180, opacity: 1 }
  },
  {
    id: 'f19',
    label: 'Arts',
    iconSvg: CREATOR_CAT_SVGS['Arts'],
    image: fh_arts,
    heroLine1: 'Expressive Masterpieces', heroLine2: ' Crafted with Soul', heroLine3: '',
    heroDesc: 'Discover traditional painters, digital illustrators, sculptors, and creative visionaries.',
    gradient: ['rgba(136, 21, 250, 1)', 'rgba(53, 10, 97, 1)'] as [string, string],
    charStyle: { right: -25, bottom: -35, width: 180, height: 180, opacity: 1 }
  },
  {
    id: 'f20',
    label: 'Business &\nStartups',
    iconSvg: CREATOR_CAT_SVGS['Business-Startups'],
    image: fh_business,
    heroLine1: 'Scaling Enterprises to', heroLine2: ' Unprecedented Heights', heroLine3: '',
    heroDesc: 'Collaborate with startup consultants, business strategists, and visionary entrepreneurs.',
    gradient: ['rgba(170, 7, 121, 1)', 'rgba(68, 3, 48, 1)'] as [string, string],
    charStyle: { right: -25, bottom: -30, width: 180, height: 180, opacity: 1 }
  },
  {
    id: 'f21',
    label: 'Community\nPages',
    iconSvg: CREATOR_CAT_SVGS['Community-Pages'],
    image: fh_community,
    heroLine1: 'Building Meaningful', heroLine2: ' Connections Together', heroLine3: '',
    heroDesc: 'Engage with community managers, moderators, and active group organizers.',
    gradient: ['#D946EF', '#A21CAF'] as [string, string],
    charStyle: { right: -25, bottom: -30, width: 180, height: 180, opacity: 1 }
  },
  {
    id: 'f22',
    label: 'Family, Kids\n& Pets',
    iconSvg: CREATOR_CAT_SVGS['Family-Kids-Pets'],
    image: fh_family,
    heroLine1: 'Heartwarming Content', heroLine2: ' for the Whole Family', heroLine3: '',
    heroDesc: 'Partner with parenting bloggers, family lifestyle creators, and child development experts.',
    gradient: ['rgba(11, 145, 212, 1)', 'rgba(4, 97, 144, 1)'] as [string, string],
    charStyle: { right: -25, bottom: -40, width: 180, height: 180, opacity: 1 }
  },
  {
    id: 'f23',
    label: 'Home &\nDecor',
    iconSvg: CREATOR_CAT_SVGS['Home-Decor'],
    image: fh_home,
    heroLine1: 'Transforming Spaces into', heroLine2: ' Beautiful Sanctuaries', heroLine3: '',
    heroDesc: 'Work with interior designers, DIY experts, home organizers, and decor specialists.',
    gradient: ['rgba(68, 7, 201, 1)', 'rgba(34, 4, 99, 1)'] as [string, string],
    charStyle: { right: -25, bottom: -30, width: 180, height: 180, opacity: 1 }
  },
  {
    id: 'f24',
    label: 'Law, Rights\n& Activism',
    iconSvg: CREATOR_CAT_SVGS['Law-Rights-Activism'],
    image: fh_law,
    heroLine1: 'Standing for Justice and', heroLine2: ' Powerful Advocacy', heroLine3: '',
    heroDesc: 'Connect with legal consultants, human rights advocates, and policy commentators.',
    gradient: ['rgba(244, 102, 13, 1)', 'rgba(99, 40, 4, 1)'] as [string, string],
    charStyle: { right: -25, bottom: -30, width: 180, height: 180, opacity: 1 }
  },
  {
    id: 'f25',
    label: 'Pets &\nAnimals',
    iconSvg: CREATOR_CAT_SVGS['Pets-Animals'],
    image: fh_pets,
    heroLine1: 'Celebrating Our Beloved', heroLine2: ' Animal Companions', heroLine3: '',
    heroDesc: 'Discover expert pet trainers, veterinarians, animal photographers, and pet influencers.',
    gradient: ['rgba(13, 121, 244, 1)', 'rgba(8, 71, 142, 1)'] as [string, string],
    charStyle: { right: -25, bottom: -30, width: 180, height: 180, opacity: 1 }
  },
  {
    id: 'f26',
    label: 'Politics',
    iconSvg: CREATOR_CAT_SVGS['Politics'],
    image: fh_politics,
    heroLine1: 'Informed Perspectives and', heroLine2: ' Civic Discourse', heroLine3: '',
    heroDesc: 'Engage with political analysts, commentators, debate hosts, and campaign strategists.',
    gradient: ['rgba(7, 184, 201, 1)', 'rgba(4, 91, 99, 1)'] as [string, string],
    charStyle: { right: -25, bottom: -30, width: 180, height: 180, opacity: 1 }
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




export default function ExploreTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, isGuest, userRole, userId, isProfileCompleted } = useAuth();
  const { requireProfile } = useProfileGate();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { category: paramCategory } = useLocalSearchParams<{ category?: string }>();
  // The category tile tapped on Home comes from whichever list matches the viewer's own
  // role (CATEGORIES for a Creator browsing Freelancers, FREELANCER_CATEGORIES for a
  // Freelancer browsing Creators) — check both, since we don't know userRole yet here.
  const isValidCategoryParam = (id?: string) =>
    !!id && (CATEGORIES.some(c => c.id === id) || FREELANCER_CATEGORIES.some(c => c.id === id));

  const [activeCategory, setActiveCategory] = useState(
    isValidCategoryParam(paramCategory) ? (paramCategory as string) : CATEGORIES[0].id
  );

  useEffect(() => {
    if (isValidCategoryParam(paramCategory)) {
      setActiveCategory(paramCategory as string);
    }
  }, [paramCategory]);
  const [portfolioModalVisible, setPortfolioModalVisible] = useState(false);
  const [selectedPortfolioLink, setSelectedPortfolioLink] = useState<string | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [collabSentIds, setCollabSentIds] = useState<Set<string>>(new Set());
  const [acceptedCollabOwnerIds, setAcceptedCollabOwnerIds] = useState<Set<string>>(new Set());
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string | null>(null);
  const [selectedExperience, setSelectedExperience] = useState<string | null>(null);
  const [filterModalType, setFilterModalType] = useState<'language' | 'location' | 'price' | 'experience' | null>(null);
  const [filterPanelVisible, setFilterPanelVisible] = useState(false);

  const LANGUAGE_OPTIONS = ['Hindi', 'English', 'Telugu', 'Tamil', 'Kannada', 'Malayalam', 'Punjabi', 'Marathi', 'Bengali', 'Gujarati'];
  const LOCATION_OPTIONS = ['Hyderabad', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'];
  const PRICE_OPTIONS = ['Free Collab', 'Paid Collab'];
  const EXPERIENCE_OPTIONS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

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
    // Browsing the feed doesn't require an account — token is optional here.
    try {
      const res = await getFeed(token);
      setPosts(Array.isArray(res.data) ? res.data : []);
    } catch { setPosts([]); } finally { setLoading(false); }
  }, [token]);

  useFocusEffect(useCallback(() => { fetchPosts(); }, [fetchPosts]));

  useFocusEffect(useCallback(() => {
    if (!token || isGuest) return;
    getSavedPostIds(token).then(res => {
      if (res.success && Array.isArray(res.data)) setSavedPostIds(new Set(res.data));
    });
  }, [token, isGuest]));

  const handleBookmark = useCallback(async (postId: string) => {
    if (isGuest || !token) { router.push('/role-selection'); return; }
    const isSaved = savedPostIds.has(postId);
    setSavedPostIds(prev => {
      const next = new Set(prev);
      if (isSaved) next.delete(postId); else next.add(postId);
      return next;
    });
    const res = await toggleSavePost(postId, token, isSaved);
    if (!res.success) {
      setSavedPostIds(prev => {
        const next = new Set(prev);
        if (isSaved) next.add(postId); else next.delete(postId);
        return next;
      });
    }
  }, [isGuest, token, router, savedPostIds]);

  useFocusEffect(useCallback(() => {
    if (!token || !userId) return;
    listCollaborations(token, { direction: 'all' }).then(res => {
      if (res.success && Array.isArray(res.data)) {
        const accepted = new Set<string>();
        const pendingPostIds = new Set<string>();
        res.data.forEach((r: any) => {
          // Contact shortcuts only while ACCEPTED — completing a collab closes
          // chat/calls (backend enforces the same), so the card reverts to
          // showing the Collaborate button for a fresh request.
          if (r.status === 'ACCEPTED') {
            const otherId = r.senderId === userId ? r.receiverId : r.senderId;
            if (otherId) accepted.add(otherId);
          }
          if (r.status === 'PENDING' && r.senderId === userId && r.postId) {
            pendingPostIds.add(r.postId);
          }
        });
        setAcceptedCollabOwnerIds(accepted);
        // Server is the source of truth on every visit — replaces any stale local-only
        // "Request Sent" state and also restores it if the app was closed/reopened.
        setCollabSentIds(pendingPostIds);
      }
    });
  }, [token, userId]));

  const onRefresh = async () => { setRefreshing(true); await fetchPosts(); setRefreshing(false); };


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

  useEffect(() => {
    if (!availableCategories.find(c => c.id === activeCategory)) {
      setActiveCategory(availableCategories[0].id);
    }
  }, [availableCategories]);

  const allCards = useMemo(() => posts.map((p) => {
    const owner = p.owner || {};
    const name = owner.name || (owner.role === 'FREELANCER' ? 'Freelancer' : 'Creator');
    return {
      id: p.id, ownerId: owner.id, ownerRole: owner.role, name,
      role: owner.role ? owner.role.charAt(0) + owner.role.slice(1).toLowerCase() : 'User',
      desc: p.description || '',
      price: p.collaborationType === 'PAID' ? 'Paid Collab' : 'Free Collab',
      budget: p.budget || null,
      time: timeAgo(p.createdAt),
      avatarUri: owner.profilePicture || null,
      isInitials: !owner.profilePicture,
      initials: getInitials(name),
      experience: owner.experience || '',
      languages: owner.languages || '',
      location: p.location || owner.location || '',
      category: owner.category?.slug || '',
      categories: Array.isArray(owner.categories) ? owner.categories : [],
      categorySlugs: Array.isArray(owner.categorySlugs) ? owner.categorySlugs : [],
      categoryNames: Array.isArray(owner.categoryNames) ? owner.categoryNames : [],
      isPremium: Boolean(owner.isPremium),
    };
  }), [posts]);

  // Creator tab IDs → exact backend Category slug (used when CREATOR is
  // browsing freelancers). One tile = one Category row now — see the
  // FREELANCER-role rows in the Category table (digitag-backend
  // sync-categories migration), so this is a direct 1:1 map, not a guess.
  const CATEGORY_SLUG_MAP: Record<string, string> = {
    photography: 'photography',
    editor: 'editors',
    videography: 'videography',
    growth: 'growth-specialist',
    script: 'script-writers',
    styling: 'styling-makeup',
    fashion: 'fashion-designers',
    property: 'property-rental',
    voice: 'voice-over',
    models: 'models',
  };

  // Freelancer tab IDs (f1-f26) → exact backend Category slug (used when
  // FREELANCER is browsing creators). Same 1:1 basis as above, against the
  // CREATOR-role rows.
  const FREELANCER_CATEGORY_SLUG_MAP: Record<string, string> = {
    f1: 'lifestyle-living',
    f2: 'tech',
    f3: 'education',
    f4: 'photography',
    f5: 'food',
    f6: 'health',
    f7: 'automotive',
    f8: 'comedy-and-memes',
    f9: 'entertainment',
    f10: 'gaming-and-anime',
    f11: 'learning',
    f12: 'news-media-and-magazines',
    f13: 'sports',
    f14: 'travel',
    f15: 'beauty',
    f16: 'fitness',
    f17: 'fashion',
    f18: 'finance-and-investments',
    f19: 'arts',
    f20: 'business-and-startups',
    f21: 'community-pages',
    f22: 'family-kids-and-pets',
    f23: 'home-and-decor',
    f24: 'law-rights-and-activism',
    f25: 'pets-and-animals',
    f26: 'politics',
  };

  const filteredCards = useMemo(() => allCards.filter((item) => {
    if (activeCategory && activeCategory !== 'all') {
      const slug = userRole === 'FREELANCER'
        ? FREELANCER_CATEGORY_SLUG_MAP[activeCategory]
        : CATEGORY_SLUG_MAP[activeCategory];
      const itemCategorySlugs: string[] = item.categorySlugs || [];
      if (!slug || !itemCategorySlugs.some((cs) => cs.toLowerCase() === slug)) return false;
    }
    if (selectedLanguage) {
      const langs = (item.languages || '').toLowerCase();
      if (!langs.includes(selectedLanguage.toLowerCase())) return false;
    }
    if (selectedLocation) {
      const loc = (item.location || '').toLowerCase();
      if (!loc.includes(selectedLocation.toLowerCase())) return false;
    }
    if (selectedPriceRange) {
      if (item.price !== selectedPriceRange) return false;
    }
    if (selectedExperience) {
      if ((item.experience || '').toLowerCase() !== selectedExperience.toLowerCase()) return false;
    }
    return true;
  }), [allCards, activeCategory, userRole, selectedLanguage, selectedLocation, selectedPriceRange, selectedExperience]);

  const EXPLORE_PREVIEW_LIMIT = 3;
  // Same as Home: the preview cap nudges a logged-in user to finish their profile.
  // Guests have no profile to complete, so it doesn't apply to them (Apple 5.1.1).
  const isExploreCapped = !isGuest && !isProfileCompleted;
  const hasMoreHiddenCards = isExploreCapped && filteredCards.length > EXPLORE_PREVIEW_LIMIT;
  const cards = isExploreCapped ? filteredCards.slice(0, EXPLORE_PREVIEW_LIMIT) : filteredCards;

  const handleCardTap = (postId: string, ownerId?: string) => {
    // Viewing a post is browsing, not an account action — guests can open it freely.
    // Logged-in users with an incomplete profile still get the completion nudge.
    if (token && !requireProfile('view this post')) return;
    router.push({ pathname: '/post-detail', params: { postId } } as any);
  };

  const handlePortfolio = async (ownerId?: string, ownerRole?: string) => {
    // Uses the public profile endpoint — viewing a portfolio link is browsing,
    // same as the rest of the profile, so it works for guests too.
    setSelectedPortfolioLink(null); setPortfolioLoading(true); setPortfolioModalVisible(true);
    try {
      if (!ownerId) { setPortfolioLoading(false); return; }
      const res = await getUserById(ownerId, token);
      const profileData = res.success ? (res.data?.creatorProfile || res.data?.freelancerProfile) : null;
      setSelectedPortfolioLink(profileData?.portfolioUrl || profileData?.portfolio || profileData?.portfolioLink || null);
    } catch { setSelectedPortfolioLink(null); } finally { setPortfolioLoading(false); }
  };

  const handleShare = async (postId: string) => {
    try {
      await Share.share({ message: `Check out this post on digitag! https://thedigitag.ai/post/${postId}`, title: 'digitag Post' });
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const handleMessage = async (ownerId?: string) => {
    if (isGuest || !token) { router.push('/role-selection'); return; }
    if (!requireProfile('message this user')) return;
    if (!ownerId) return;
    const res = await openConversationWith(token, ownerId);
    if (res.success && res.data?.id) {
      router.push({ pathname: '/chat/[id]', params: { id: res.data.id } } as any);
    } else {
      Alert.alert('Chat Error', (res as any).error || 'Could not open conversation.');
    }
  };

  const handleCall = useCallback(async (calleeId?: string) => {
    if (isGuest || !token) { router.push('/role-selection'); return; }
    if (!requireProfile('call this user')) return;
    if (!calleeId) return;
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
            remoteName: 'User',
            remoteImage: '',
          },
        } as any);
      } else {
        Alert.alert('Call Failed', (res as any).error || 'Could not start call.');
      }
    } catch (err: any) {
      Alert.alert('Call Failed', err?.message || 'Network error.');
    }
  }, [isGuest, token, router, requireProfile]);

  const handleCollab = useCallback(async (ownerId: string, postId: string) => {
    if (isGuest || !token) { router.push('/role-selection'); return; }
    if (!requireProfile('send a collab request')) return;
    if (collabSentIds.has(postId)) return;
    try {
      const res = await sendCollaboration(token, { receiverId: ownerId, postId, message: 'I would love to collaborate with you!' });
      if (res.success !== false) {
        setCollabSentIds(prev => new Set(prev).add(postId));
        Alert.alert('Collab Sent!', 'Your collaboration request has been sent.');
      } else {
        Alert.alert('Error', res.error || 'Could not send collab request.');
      }
    } catch {
      Alert.alert('Error', 'Could not send collab request.');
    }
  }, [isGuest, token, router, requireProfile, collabSentIds]);

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
              <Image
                source={item.isInitials ? require('../../assets/images/icon.png') : { uri: item.avatarUri }}
                style={s.cardAvatar}
                resizeMode="cover"
              />
            </View>
            <View style={s.cardNameArea}>
              <View style={s.cardNameRow}>
                <Text style={s.cardName} numberOfLines={1}>{item.name}</Text>
                <Ionicons name="shield-checkmark" size={14} color={accent} style={{ marginLeft: 6, flexShrink: 0 }} />
              </View>
              <View style={s.cardMetaRow}>
                <TouchableOpacity onPress={() => handlePortfolio(item.ownerId, item.ownerRole)}>
                  <Text style={[s.cardPortfolioLink, { color: accent }]}>See Portfolio</Text>
                </TouchableOpacity>
                <View style={s.timeRow}>
                  <Ionicons name="time-outline" size={12} color="#a1a2a4" />
                  <Text style={s.timeText}>{item.time || '4h ago'}</Text>
                </View>
              </View>
            </View>
            {/* Bookmark */}
            <TouchableOpacity style={s.bookmarkBtn} onPress={() => handleBookmark(item.id)}>
              <Ionicons
                name={savedPostIds.has(item.id) ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={savedPostIds.has(item.id) ? accent : '#fff'}
              />
            </TouchableOpacity>
          </View>

          {/* Description */}
          <TouchableOpacity onPress={() => toggleExpand(item.id)} activeOpacity={0.7}>
            <Text style={s.cardDesc} numberOfLines={expandedPosts.has(item.id) ? undefined : 2}>
              {item.desc || 'Looking for a Photographer experienced in creating engaging short-form content'}
              {!expandedPosts.has(item.id) && <Text style={{ color: accent }}>... See more</Text>}
            </Text>
          </TouchableOpacity>

          {/* Info pills */}
          <View style={s.pillWrapRow}>
            {!!item.experience && (
              <View style={s.pill}>
                <Ionicons name="briefcase-outline" size={13} color="#a1a2a4" />
                <Text style={s.pillText} numberOfLines={1}>{item.experience}</Text>
              </View>
            )}
            <View style={[s.pill, { borderColor: item.price === 'Paid Collab' ? 'rgba(34,197,94,0.4)' : 'rgba(167,139,250,0.4)' }]}>
              <Ionicons name={item.price === 'Paid Collab' ? 'cash-outline' : 'gift-outline'} size={13} color={item.price === 'Paid Collab' ? '#22c55e' : '#a78bfa'} />
              <Text style={[s.pillText, { color: item.price === 'Paid Collab' ? '#22c55e' : '#a78bfa' }]} numberOfLines={1}>{item.price}</Text>
            </View>
            {!!item.location && (
              <View style={s.pill}>
                <Ionicons name="location-outline" size={13} color="#a1a2a4" />
                <Text style={s.pillText} numberOfLines={1}>{item.location}</Text>
              </View>
            )}
            {!!item.budget && (
              <View style={[s.pill, { borderColor: 'rgba(251,191,36,0.4)' }]}>
                <Ionicons name="wallet-outline" size={13} color="#fbbf24" />
                <Text style={[s.pillText, { color: '#fbbf24' }]} numberOfLines={1}>₹{item.budget}</Text>
              </View>
            )}
          </View>
          {!!item.languages && (
            <View style={s.pillWrapRow}>
              <View style={s.pill}>
                <Ionicons name="language-outline" size={13} color="#a1a2a4" />
                <Text style={s.pillText} numberOfLines={1}>{item.languages}</Text>
              </View>
            </View>
          )}

          {/* Bottom Actions */}
          {acceptedCollabOwnerIds.has(item.ownerId) ? (
            <View style={s.cardBottom}>
              <View style={s.cardActions}>
                <TouchableOpacity onPress={() => handleMessage(item.ownerId)} activeOpacity={0.75}>
                  <ImageBackground source={require('../../assets/bg-icons.png')} style={s.iconCircleDark} imageStyle={{ borderRadius: 19 }}>
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
                  </ImageBackground>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleCall(item.ownerId)} activeOpacity={0.75}>
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
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[s.bigCollabBtn, { backgroundColor: accent, opacity: collabSentIds.has(item.id) ? 0.6 : 1 }]}
              onPress={() => handleCollab(item.ownerId, item.id)}
              activeOpacity={0.8}
              disabled={collabSentIds.has(item.id)}
            >
              <Ionicons
                name={collabSentIds.has(item.id) ? 'checkmark-circle-outline' : 'paper-plane-outline'}
                size={16}
                color="#fff"
              />
              <Text style={s.bigCollabBtnText}>
                {collabSentIds.has(item.id) ? 'Request Sent' : 'Send Request'}
              </Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>
    );
  }, [expandedPosts, handleCardTap, handlePortfolio, handleMessage, handleCall, handleCollab, handleShare, collabSentIds, acceptedCollabOwnerIds, savedPostIds, handleBookmark]);

  // Reusable filter form (Collab Type / Experience / Language / Location) — now lives inside
  // the filter panel modal (behind the header's filter icon) instead of always being visible.
  const filterPanelContent = (
    <View>
      <View style={s.filterRow}>
        <View style={s.filterCol}>
          <Text style={s.filterLabel}>Collab Type</Text>
          <TouchableOpacity style={[s.filterDropdown, selectedPriceRange ? s.filterDropdownActive : null]} activeOpacity={0.7} onPress={() => setFilterModalType('price')}>
            <Text style={[s.filterPlaceholder, selectedPriceRange ? s.filterValueText : null]}>{selectedPriceRange || 'Select Collab Type'}</Text>
            {selectedPriceRange ? <TouchableOpacity onPress={() => setSelectedPriceRange(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><Ionicons name="close-circle" size={16} color="#ED2A91" /></TouchableOpacity> : <Ionicons name="filter" size={16} color="#6e7180" />}
          </TouchableOpacity>
        </View>
        <View style={s.filterCol}>
          <Text style={s.filterLabel}>Experience</Text>
          <TouchableOpacity style={[s.filterDropdown, selectedExperience ? s.filterDropdownActive : null]} activeOpacity={0.7} onPress={() => setFilterModalType('experience')}>
            <Text style={[s.filterPlaceholder, selectedExperience ? s.filterValueText : null]}>{selectedExperience || 'Select experience'}</Text>
            {selectedExperience ? <TouchableOpacity onPress={() => setSelectedExperience(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><Ionicons name="close-circle" size={16} color="#ED2A91" /></TouchableOpacity> : <Ionicons name="chevron-down" size={16} color="#6e7180" />}
          </TouchableOpacity>
        </View>
      </View>
      <View style={[s.filterRow, { marginTop: 0 }]}>
        <View style={s.filterCol}>
          <Text style={s.filterLabel}>Language</Text>
          <TouchableOpacity style={[s.filterDropdown, selectedLanguage ? s.filterDropdownActive : null]} activeOpacity={0.7} onPress={() => setFilterModalType('language')}>
            <Text style={[s.filterPlaceholder, selectedLanguage ? s.filterValueText : null]}>{selectedLanguage || 'Select language'}</Text>
            {selectedLanguage ? <TouchableOpacity onPress={() => setSelectedLanguage(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><Ionicons name="close-circle" size={16} color="#ED2A91" /></TouchableOpacity> : <Ionicons name="chevron-down" size={16} color="#6e7180" />}
          </TouchableOpacity>
        </View>
        <View style={s.filterCol}>
          <Text style={s.filterLabel}>Location</Text>
          <TouchableOpacity style={[s.filterDropdown, selectedLocation ? s.filterDropdownActive : null]} activeOpacity={0.7} onPress={() => setFilterModalType('location')}>
            <Text style={[s.filterPlaceholder, selectedLocation ? s.filterValueText : null]}>{selectedLocation || 'Select location'}</Text>
            {selectedLocation ? <TouchableOpacity onPress={() => setSelectedLocation(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><Ionicons name="close-circle" size={16} color="#ED2A91" /></TouchableOpacity> : <Ionicons name="chevron-down" size={16} color="#6e7180" />}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Sidebar now owns category selection; the FlatList's header is just the per-category hero card.
  const listHeader = useMemo(() => (
    <View style={s.heroCard}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: activeCat.gradient[1], borderRadius: 24 }]} />
      <View style={[StyleSheet.absoluteFill, { opacity: 0.6, backgroundColor: activeCat.gradient[0], borderRadius: 24 }]} />
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
    </View>
  ), [activeCat, userRole]);

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

      {/* ═══ HEADER ═══ */}
      <View style={[s.header, { paddingTop: insets.top + 16 }]}>
        <View style={s.headerTopRow}>
          <View style={s.headerTitleRow}>
            <TouchableOpacity
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
              style={s.headerBackBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={s.headerTitleText}>Explore All</Text>
          </View>
          <TouchableOpacity
            style={[s.filterIconBtn, { backgroundColor: userRole === 'FREELANCER' ? '#f26930' : '#ed2a91' }]}
            activeOpacity={0.8}
            onPress={() => setFilterPanelVisible(true)}
          >
            <Ionicons name="options-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={s.subtitle}>Discover & Connect with the right people</Text>
      </View>

      {/* ═══ BODY: category sidebar + scrollable feed ═══ */}
      <View style={s.bodyRow}>
        {/* ── LEFT SIDEBAR ──
            The fixed width lives on this plain wrapping View, not on the ScrollView's own
            `style` — Android's Yoga layout doesn't reliably honor an explicit `width` set
            directly on a ScrollView when it's a row-sibling, and lets it expand instead
            (observed taking ~50% of the screen instead of 83px). Plain Views don't have
            this issue, so the ScrollView just fills the wrapper. */}
        <View style={s.sidebar}>
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
            nestedScrollEnabled={true}
          >
            {availableCategories.map((cat) => {
              const isActive = cat.id === activeCategory;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setActiveCategory(cat.id)}
                  activeOpacity={0.8}
                  style={[s.sidebarItem, isActive && s.sidebarItemActive]}
                >
                  {(cat as any).iconSvg ? (
                    <SvgXml xml={(cat as any).iconSvg} width={30} height={30} />
                  ) : (
                    <Image source={(cat as any).icon} style={{ width: 30, height: 30 }} resizeMode="contain" />
                  )}
                  <Text style={[s.sidebarLabel, isActive && s.sidebarLabelActive]} numberOfLines={2}>{cat.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── RIGHT: hero card + feed ──
            Wrapped in a plain View (rather than relying on FlatList's own `style` prop)
            because Android's Yoga layout can fail to resolve `flex: 1` on a FlatList that's
            a sibling of another element in a `flexDirection: 'row'` parent — the FlatList
            collapses to a sliver width, wrapping text one letter per line. iOS isn't affected. */}
        <View style={s.feedColumn}>
        <FlatList
        style={{ flex: 1 }}
        data={cards}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        ListFooterComponent={
          hasMoreHiddenCards ? (
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
                marginHorizontal: 16,
                marginTop: 4,
                marginBottom: 16,
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
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={s.emptyState}>
              <Ionicons name="compass-outline" size={48} color="#3A3A47" />
              <Text style={s.emptyTitle}>Nothing to explore yet</Text>
              <Text style={s.emptySubtitle}>Pull down to refresh — new posts will appear here.</Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 90 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ED2A91" />}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        initialNumToRender={4}
        windowSize={7}
        nestedScrollEnabled={true}
        />
        </View>
      </View>

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

      {/* ═══ FILTER PANEL MODAL (behind the header's filter icon) ═══ */}
      <Modal
        visible={filterPanelVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterPanelVisible(false)}
      >
        <View style={s.modalOverlay}>
          <TouchableOpacity style={s.modalDismiss} activeOpacity={1} onPress={() => setFilterPanelVisible(false)} />
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Filters</Text>
              <TouchableOpacity style={s.modalClose} onPress={() => setFilterPanelVisible(false)}>
                <Feather name="x" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {filterPanelContent}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═══ FILTER SELECTION MODAL ═══ */}
      <Modal
        visible={filterModalType !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalType(null)}
      >
        <View style={s.modalOverlay}>
          <TouchableOpacity style={s.modalDismiss} activeOpacity={1} onPress={() => setFilterModalType(null)} />
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>
                {filterModalType === 'language' ? 'Select Language'
                  : filterModalType === 'location' ? 'Select Location'
                  : filterModalType === 'price' ? 'Select Price Range'
                  : 'Select Experience'}
              </Text>
              <TouchableOpacity style={s.modalClose} onPress={() => setFilterModalType(null)}>
                <Feather name="x" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {(filterModalType === 'language' ? LANGUAGE_OPTIONS
                : filterModalType === 'location' ? LOCATION_OPTIONS
                : filterModalType === 'price' ? PRICE_OPTIONS
                : EXPERIENCE_OPTIONS
              ).map((option) => {
                const currentVal = filterModalType === 'language' ? selectedLanguage
                  : filterModalType === 'location' ? selectedLocation
                  : filterModalType === 'price' ? selectedPriceRange
                  : selectedExperience;
                const isSelected = currentVal === option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[s.filterOptionRow, isSelected && s.filterOptionRowActive]}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (filterModalType === 'language') setSelectedLanguage(isSelected ? null : option);
                      else if (filterModalType === 'location') setSelectedLocation(isSelected ? null : option);
                      else if (filterModalType === 'price') setSelectedPriceRange(isSelected ? null : option);
                      else setSelectedExperience(isSelected ? null : option);
                      setFilterModalType(null);
                    }}
                  >
                    <Text style={[s.filterOptionText, isSelected && { color: '#ED2A91' }]}>{option}</Text>
                    {isSelected && <Ionicons name="checkmark" size={18} color="#ED2A91" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  scroll: { flex: 5 },

  // Header
  header: { paddingHorizontal: 16, paddingBottom: 16, backgroundColor: '#000' },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  headerBackBtn: { padding: 2 },
  headerTitleText: { color: '#fff', fontSize: 26, fontFamily: 'Poppins_700Bold' },
  filterIconBtn: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  subtitle: { color: '#E2E2E2', fontSize: 12, marginTop: 8, fontFamily: 'Poppins_400Regular', lineHeight: 18 },

  // Body: sidebar + scrollable feed column
  bodyRow: { flex: 1, flexDirection: 'row' },
  sidebar: { width: 83, backgroundColor: '#0A0A0A' },
  sidebarItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    gap: 8,
  },
  sidebarItemActive: { backgroundColor: 'rgba(255,255,255,0.08)' },
  sidebarLabel: {
    color: '#fff',
    fontSize: 10,
    lineHeight: 13,
    fontFamily: 'Poppins_500Medium',
    textAlign: 'center',
    includeFontPadding: false,
  },
  sidebarLabelActive: { color: '#fff', fontFamily: 'Poppins_600SemiBold' },
  feedColumn: { flex: 1 },

  // Hero card — inset, rounded on all corners, sits as the feed's list header
  heroCard: {
    width: 333,
    height: 140,
    borderRadius: 24,
    overflow: 'hidden',
    marginHorizontal: 8,
    marginTop: 12,
    marginBottom: 8,
    padding: 20,
  },

  // Sparkle dots
  sparkleDot: { position: 'absolute', borderRadius: 99, backgroundColor: '#fff' },

  // Hero text + character
  heroContent: { flex: 1, position: 'relative' },
  heroTextArea: { maxWidth: '78%' },
  heroTitle: { fontSize: 18, lineHeight: 26, fontFamily: 'Poppins_700Bold', },
  heroTitleBold: { color: '#fff' },
  heroTitleFaded: { color: 'rgba(255,255,255,0.8)' },
  heroDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 18, marginTop: 8 },
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
  filterDropdownActive: { borderColor: '#ED2A91', backgroundColor: 'rgba(237,42,145,0.08)' },
  filterValueText: { color: '#fff', fontSize: 13, fontFamily: 'Poppins_400Regular' },

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
  cardNameArea: { flex: 1, paddingTop: 4, minWidth: 0 },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  cardName: { color: '#fff', fontSize: 16, fontFamily: 'Poppins_500Medium', flexShrink: 1 },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  cardPortfolioLink: { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  bookmarkBtn: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(39,39,42,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Description
  cardDesc: { color: '#d1d2d4', fontSize: 12, fontFamily: 'Poppins_300Light', lineHeight: 18, marginBottom: 14 },

  // Info pills
  pillWrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(64,64,64,0.5)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
  },
  pillText: { color: '#a1a2a4', fontSize: 11, fontFamily: 'Poppins_400Regular', flexShrink: 1 },

  // Bottom
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  bigCollabBtn: {
    width: '100%',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: 99, paddingVertical: 12, marginTop: 6,
  },
  bigCollabBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
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
    maxHeight: '70%', backgroundColor: '#1E1E24', borderTopLeftRadius: 30, borderTopRightRadius: 30,
    padding: 24, paddingBottom: 36, borderTopWidth: 1, borderColor: 'rgba(156,156,156,0.3)',
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

  filterOptionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  filterOptionRowActive: { backgroundColor: 'rgba(237,42,145,0.06)', borderRadius: 8, paddingHorizontal: 8 },
  filterOptionText: { color: '#fff', fontSize: 15, fontFamily: 'Poppins_400Regular' },
});
