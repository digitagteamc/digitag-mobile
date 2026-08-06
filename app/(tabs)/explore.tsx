import { matchesPortfolioCategory } from '@/constants/portfolioCategories';
import PortfolioImageCarousel from '@/Components/PortfolioImageCarousel';
import { useAuth } from '@/context/AuthContext';
import { useCall } from '@/context/CallContext';
import { useProfileGate } from '@/context/ProfileGateContext';
import { buildCreatorSocialLinks, SocialLink } from '@/services/socialLinks';
import { cancelCollaboration, getFeed, getSavedPostIds, getUserById, initiateCall, listCollaborations, openConversationWith, sendCollaboration, toggleSavePost } from '@/services/userService';
import { getRoleTheme } from '@/theme/useRoleTheme';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Path, Svg, SvgXml } from 'react-native-svg';
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
const imgScriptWritersicon = require('../../assets/tabs_icons/Scripticon.webp');
const imgStylingicon = require('../../assets/tabs_icons/Stylingicon.webp');
const imgFashionicon = require('../../assets/tabs_icons/fashionicon.webp');
const imgPropertyicon = require('../../assets/tabs_icons/Propertyicon.webp');
const imgVoiceicon = require('../../assets/tabs_icons/VoiceOvericon.webp');
const imgAllCreator = require('../../assets/all-freelancer.png');
const imgAllFreelancer = require('../../assets/all-creator.png');

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
const tf_socialmedia = require('../../assets/tabs-icons-freelancer/SocialMediaManager.png');


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
    icon: imgAllCreator,
    image: imgPhotography,
    heroLine1: 'Explore Our Creators', heroLine2: ' ', heroLine3: '',
    heroDesc: 'Discover top talents and connect with the right people for any project.',
    gradient: ['#3b82f6', '#2563eb'] as [string, string],
    charStyle: { right: -40, bottom: -40, width: 111, height: 104, }
  },
  {
    id: 'photography',
    label: 'Photography',
    icon: tf_photography,
    image: imgPhotography,
    heroLine1: 'Capture Every Moment', heroLine2: 'Beautifully', heroLine3: '',
    heroDesc: 'Turning moments into timeless visual stories with creativity and emotion.',
    gradient: ['#6366f1', '#4f46e5'] as [string, string],
    charStyle: { right: -40, bottom: -40, width: 230, height: 230, }
  },
  {
    id: 'editor',
    label: 'Editor',
    icon: tf_editor,
    image: imgEditor,
    heroLine1: 'Editing That Brings', heroLine2: 'Stories to Life', heroLine3: '',
    heroDesc: 'High-quality edits designed to make your content stand out across every platform.',
    gradient: ['#9D174D', '#831843'] as [string, string],
    charStyle: { right: -30, bottom: -40, width: 220, height: 220 }
  },
  {
    id: 'videography',
    label: 'Videography',
    icon: tf_videography,
    image: imgVideography,
    heroLine1: 'Bringing Ideas to Life', heroLine2: 'on Screen', heroLine3: '',
    heroDesc: 'High-quality edits designed to make your content stand out across every platform.',
    gradient: ['#0284C7', '#075985'] as [string, string],
    charStyle: { right: -35, bottom: -50, width: 230, height: 230 }
  },
  {
    id: 'growth',
    label: 'Growth\nSpecialist',
    icon: tf_growth,
    image: imgGrowth,
    heroLine1: 'Accelerate Your', heroLine2: 'Brand Growth', heroLine3: '',
    heroDesc: 'Growth-focused solutions tailored for modern creators, brands, and agencies.',
    gradient: ['#4338CA', '#3730A3'] as [string, string],
    charStyle: { right: -30, bottom: -40, width: 240, height: 240 }
  },
  {
    id: 'script',
    label: 'Script Writers',
    icon: tf_script,
    image: imgScriptWriters,
    heroLine1: 'Turning Ideas into ', heroLine2: 'Powerful Scripts', heroLine3: '',
    heroDesc: 'Creative scripts crafted for films, ads, reels, podcasts, and digital content.',
    gradient: ['#1E3A8A', '#1E40AF'] as [string, string],
    charStyle: { right: -30, bottom: -45, width: 220, height: 220 }
  },
  {
    id: 'styling',
    label: 'Styling &\nmakeup',
    icon: tf_styling,
    image: imgStyling,
    heroLine1: 'Beauty Styled to ', heroLine2: 'Perfection', heroLine3: '',
    heroDesc: 'Expert makeup and styling designed to elevate every look with elegance and precision.',
    gradient: ['#7E22CE', '#6B21A8'] as [string, string],
    charStyle: { right: -25, bottom: -45, width: 230, height: 230 }
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
  {
    id: 'social-media-manager',
    label: 'Social Media\nManager',
    icon: tf_socialmedia,
    // Placeholder hero gif until a dedicated one is provided.
    image: imgGrowth,
    heroLine1: 'Grow Your Brand on  ', heroLine2: ' Every Platform', heroLine3: '',
    heroDesc: 'Skilled social media managers to plan, post, and grow your presence across platforms.',
    gradient: ['#0A3EFA', '#062B9E'] as [string, string],
    charStyle: { right: -40, bottom: -60, width: 240, height: 240 }
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

// Post.budget is a free-text field (e.g. "2000", "₹2,000") — pull out the
// numeric value so the Budget Range filter can bucket it.
function parseBudgetValue(budget: string | null | undefined): number | null {
  if (!budget) return null;
  const digits = budget.replace(/[^0-9.]/g, '');
  if (!digits) return null;
  const n = parseFloat(digits);
  return Number.isFinite(n) ? n : null;
}

// Display-only formatting for the budget pill — turns each run of digits
// into "K" notation (5000 -> 5K, 12500 -> 12.5K) so a range like
// "5000-10000" becomes "5K-10K". Doesn't touch the underlying budget value
// used anywhere else (e.g. parseBudgetValue above for filtering).
const formatBudgetK = (value: string | number) => {
  return String(value).replace(/\d+/g, (match) => {
    const num = parseInt(match, 10);
    if (num < 1000) return match;
    const k = num / 1000;
    return `${Number.isInteger(k) ? k : k.toFixed(1)}K`;
  });
};


const AnimatedImage = Animated.createAnimatedComponent(Image);

// Filter drawer (Collab Type / Experience / Language / Location) slides in
// from the right and covers the full screen: a left-side list of filter
// categories and a right-side pane showing that category's options.
const FILTER_DRAWER_WIDTH = Dimensions.get('window').width;
// 130px on typical/larger phones; compacts down on narrow devices so the
// options pane never gets crammed into a sliver.
const FILTER_CATEGORY_LIST_WIDTH = Math.min(130, Math.round(FILTER_DRAWER_WIDTH * 0.35));

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
  const call = useCall();
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

  // Sidebar auto-scroll: tapping a category scrolls it toward the top of the
  // sidebar so the user can see there are more categories below it, rather
  // than leaving the tap position (and everything below it) hidden off-screen.
  const sidebarScrollRef = useRef<ScrollView>(null);
  const sidebarItemY = useRef<Record<string, number>>({});
  const selectCategory = (id: string) => {
    setActiveCategory(id);
    const y = sidebarItemY.current[id];
    if (y !== undefined) {
      sidebarScrollRef.current?.scrollTo({ y: Math.max(y - 12, 0), animated: true });
    }
  };

  useEffect(() => {
    if (isValidCategoryParam(paramCategory)) {
      setActiveCategory(paramCategory as string);
    }
  }, [paramCategory]);
  const [portfolioModalVisible, setPortfolioModalVisible] = useState(false);
  const [selectedPortfolioLink, setSelectedPortfolioLink] = useState<string | null>(null);
  const [selectedSocialLinks, setSelectedSocialLinks] = useState<SocialLink[] | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  // Maps postId -> collaboration id, not just a Set, so a pending request can
  // be cancelled (DELETE /collaborations/:id) directly from this card.
  const [collabSentIds, setCollabSentIds] = useState<Map<string, string>>(new Map());
  const [cancellingCollabPostId, setCancellingCollabPostId] = useState<string | null>(null);
  const [acceptedCollabPostIds, setAcceptedCollabPostIds] = useState<Set<string>>(new Set());
  const [completedCollabPostIds, setCompletedCollabPostIds] = useState<Set<string>>(new Set());
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string | null>(null);
  const [selectedExperience, setSelectedExperience] = useState<string | null>(null);
  const [selectedBudgetRange, setSelectedBudgetRange] = useState<string | null>(null);
  const [selectedSort, setSelectedSort] = useState<string | null>(null);
  // Which filter category's options are currently shown in the right pane —
  // null just means "default to the first row" (see activeFilterRow below).
  const [filterModalType, setFilterModalType] = useState<'language' | 'location' | 'price' | 'experience' | 'budget' | 'sort' | null>(null);
  const [filterPanelVisible, setFilterPanelVisible] = useState(false);
  const drawerX = useSharedValue(FILTER_DRAWER_WIDTH);

  // Slide in whenever the drawer opens; closing animates back out first, then
  // unmounts the Modal once the animation would have finished — Modal's
  // `visible` prop has no exit-animation hook of its own.
  useEffect(() => {
    if (filterPanelVisible) {
      drawerX.value = FILTER_DRAWER_WIDTH;
      drawerX.value = withTiming(0, { duration: 260 });
    }
  }, [filterPanelVisible]);

  const closeFilterDrawer = () => {
    drawerX.value = withTiming(FILTER_DRAWER_WIDTH, { duration: 220 });
    setFilterModalType(null);
    setTimeout(() => setFilterPanelVisible(false), 220);
  };

  const drawerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: drawerX.value }],
  }));

  const LANGUAGE_OPTIONS = ['Hindi', 'English', 'Telugu', 'Tamil', 'Kannada', 'Malayalam', 'Punjabi', 'Marathi', 'Bengali', 'Gujarati'];
  const LOCATION_OPTIONS = ['Hyderabad', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'];
  const PRICE_OPTIONS = ['Free Collab', 'Paid Collab'];
  const EXPERIENCE_OPTIONS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
  const BUDGET_OPTIONS = ['Under ₹1000', '₹1000 - ₹5000', '₹5000+'];
  const SORT_OPTIONS = ['Recommended', 'Newest First'];

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
    if (!requireProfile('save this post') || !token) return;
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
  }, [token, requireProfile, savedPostIds]);

  useFocusEffect(useCallback(() => {
    if (!token || !userId) return;
    listCollaborations(token, { direction: 'all' }).then(res => {
      if (res.success && Array.isArray(res.data)) {
        const accepted = new Set<string>();
        const pendingPostIds = new Map<string, string>();
        const completedPostIds = new Set<string>();
        res.data.forEach((r: any) => {
          // Post-scoped — a Creator can have multiple posts, and an accepted
          // collaboration on one of them must only unlock chat/call for that
          // specific post, not every other post they've made.
          if (r.status === 'ACCEPTED' && r.postId) {
            accepted.add(r.postId);
          }
          if (r.status === 'PENDING' && r.senderId === userId && r.postId) {
            pendingPostIds.set(r.postId, r.id);
          }
          // Post-scoped, like pendingPostIds above — once the Creator marks this
          // specific collaboration complete, this card must show "Collaborated"
          // instead of reverting to the plain Collaborate button (which otherwise
          // looks like the request never happened, since completed collabs drop
          // out of `accepted` above).
          if (r.status === 'COMPLETED' && r.postId) {
            completedPostIds.add(r.postId);
          }
        });
        setAcceptedCollabPostIds(accepted);
        // Server is the source of truth on every visit — replaces any stale local-only
        // "Request Sent" state and also restores it if the app was closed/reopened.
        setCollabSentIds(pendingPostIds);
        setCompletedCollabPostIds(completedPostIds);
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
          icon: imgAllFreelancer,
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
      imageUrl: p.imageUrl || null,
      imageUrls: Array.isArray(p.imageUrls) && p.imageUrls.length ? p.imageUrls : (p.imageUrl ? [p.imageUrl] : []),
      price: p.collaborationType === 'PAID' ? 'Paid Collab' : 'Free Collab',
      budget: p.budget || null,
      time: timeAgo(p.createdAt),
      createdAtRaw: p.createdAt || null,
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
    'social-media-manager': 'social-media-management',
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
    if (selectedBudgetRange) {
      const val = parseBudgetValue(item.budget);
      if (val === null) return false;
      if (selectedBudgetRange === 'Under ₹1000' && !(val < 1000)) return false;
      if (selectedBudgetRange === '₹1000 - ₹5000' && !(val >= 1000 && val <= 5000)) return false;
      if (selectedBudgetRange === '₹5000+' && !(val > 5000)) return false;
    }
    return true;
  }), [allCards, activeCategory, userRole, selectedLanguage, selectedLocation, selectedPriceRange, selectedExperience, selectedBudgetRange]);

  // "Recommended" (default) keeps the backend's own order — boosted, then
  // Premium, then newest. "Newest First" ignores that and sorts purely by
  // creation time, since a user picking this filter wants chronological.
  const sortedCards = useMemo(() => {
    if (selectedSort !== 'Newest First') return filteredCards;
    return [...filteredCards].sort((a, b) => {
      const at = a.createdAtRaw ? new Date(a.createdAtRaw).getTime() : 0;
      const bt = b.createdAtRaw ? new Date(b.createdAtRaw).getTime() : 0;
      return bt - at;
    });
  }, [filteredCards, selectedSort]);

  const EXPLORE_PREVIEW_LIMIT = 3;
  // Same as Home: the preview cap nudges a logged-in user to finish their profile.
  // Guests have no profile to complete, so it doesn't apply to them (Apple 5.1.1).
  const isExploreCapped = !isGuest && !isProfileCompleted;
  const hasMoreHiddenCards = isExploreCapped && sortedCards.length > EXPLORE_PREVIEW_LIMIT;
  const cards = isExploreCapped ? sortedCards.slice(0, EXPLORE_PREVIEW_LIMIT) : sortedCards;

  const handleCardTap = (postId: string, ownerId?: string) => {
    // Viewing a post is browsing, not an account action — guests can open it freely.
    // Logged-in users with an incomplete profile still get the completion nudge.
    if (token && !requireProfile('view this post')) return;
    router.push({ pathname: '/post-detail', params: { postId } } as any);
  };

  const handlePortfolio = async (ownerId?: string, ownerRole?: string) => {
    // Uses the public profile endpoint — viewing a portfolio link is browsing,
    // same as the rest of the profile, so it works for guests too.
    setSelectedPortfolioLink(null); setSelectedSocialLinks(null); setPortfolioLoading(true); setPortfolioModalVisible(true);
    try {
      if (!ownerId) { setPortfolioLoading(false); return; }
      const res = await getUserById(ownerId, token);
      if (!res.success) return;
      // Creators don't have a real portfolio (no portfolio-image upload, no
      // portfolio URL field in creator signup) — show their social accounts
      // instead of an always-empty portfolio-link modal.
      if (ownerRole === 'CREATOR') { setSelectedSocialLinks(buildCreatorSocialLinks(res.data)); return; }
      const profileData = res.data?.creatorProfile || res.data?.freelancerProfile;
      setSelectedPortfolioLink(profileData?.portfolioUrl || profileData?.portfolio || profileData?.portfolioLink || null);
    } catch { setSelectedPortfolioLink(null); } finally { setPortfolioLoading(false); }
  };

  const handleShare = async (postId: string) => {
    try {
      await Share.share({ message: `Check out this post on digitag! https://thedigitag.ai/post/${postId}`, title: 'digitag Post' });
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const handleMessage = async (ownerId?: string) => {
    if (!requireProfile('message this user') || !token) return;
    if (!ownerId) return;
    const res = await openConversationWith(token, ownerId);
    if (res.success && res.data?.id) {
      router.push({ pathname: '/chat/[id]', params: { id: res.data.id } } as any);
    } else {
      Alert.alert('Chat Error', (res as any).error || 'Could not open conversation.');
    }
  };

  const handleCall = useCallback(async (calleeId?: string) => {
    if (!requireProfile('call this user') || !token) return;
    if (!calleeId) return;
    if (call.callMode !== 'idle') { call.resume(); return; }
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
  }, [token, router, requireProfile, call]);

  const handleCollab = useCallback(async (ownerId: string, postId: string) => {
    if (!requireProfile('send a collab request') || !token) return;
    if (collabSentIds.has(postId)) return;
    try {
      const res = await sendCollaboration(token, { receiverId: ownerId, postId, message: 'I would love to collaborate with you!' });
      if (res.success !== false && (res as any).data?.id) {
        setCollabSentIds(prev => new Map(prev).set(postId, (res as any).data.id));
        Alert.alert('Collab Sent!', 'Your collaboration request has been sent.');
      } else {
        Alert.alert('Error', (res as any).error || 'Could not send collab request.');
      }
    } catch {
      Alert.alert('Error', 'Could not send collab request.');
    }
  }, [token, router, requireProfile, collabSentIds]);

  const handleCancelCollab = useCallback((postId: string) => {
    if (!token) return;
    const collabId = collabSentIds.get(postId);
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
                setCollabSentIds(prev => {
                  const next = new Map(prev);
                  next.delete(postId);
                  return next;
                });
              } else {
                Alert.alert('Error', (res as any).error || 'Could not cancel the request.');
              }
            } catch {
              Alert.alert('Error', 'Could not cancel the request.');
            } finally {
              setCancellingCollabPostId(null);
            }
          },
        },
      ],
    );
  }, [token, collabSentIds, cancellingCollabPostId]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    const postTheme = getRoleTheme(item.ownerRole);
    const accent = postTheme.primary;
    return (
      <View style={{ paddingHorizontal: 8, paddingBottom: 20 }}>
        <TouchableOpacity
          style={[s.card, { borderColor: accent + '5D', borderTopColor: accent, borderTopWidth: 0, borderLeftWidth: 0.5, borderRightWidth: 0.5 }]}
          activeOpacity={1}
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
                <Text style={s.cardName} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
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
              <Image source={require('../../assets/Save.png')} style={{ width: 34, height: 34 }} resizeMode="contain" />
              {/* Filled bookmark (transparent bg, flood-filled from Save.png's
                  outline) layered on top so the "saved" state reads as a
                  solid filled icon, not just a recolored outline — the dark
                  circle underneath stays untouched. */}
              {savedPostIds.has(item.id) && (
                <Image
                  source={require('../../assets/SaveFilled.png')}
                  style={{ width: 34, height: 34, position: 'absolute', tintColor: accent }}
                  resizeMode="contain"
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Description — truncated by character count (not numberOfLines) so the
              "See more" link is never silently dropped. numberOfLines' own ellipsis
              clamp cuts the whole Text tree at the line limit, including any nested
              "See more" Text appended after a description that already fills 2 lines
              on its own — the link would just vanish with no room reserved for it. */}
          {(() => {
            const isExpanded = expandedPosts.has(item.id);
            const fullDesc = item.desc || 'Looking for a Photographer experienced in creating engaging short-form content';
            const needsTruncation = fullDesc.length > 100;
            const shownDesc = isExpanded || !needsTruncation ? fullDesc : fullDesc.slice(0, 100).trimEnd();
            return (
              <TouchableOpacity onPress={() => toggleExpand(item.id)} activeOpacity={0.7} disabled={!needsTruncation}>
                <Text style={s.cardDesc}>
                  {shownDesc}
                  {needsTruncation && (isExpanded ? ' ' : '... ')}
                  {needsTruncation && (
                    <Text style={{ color: accent }}>{isExpanded ? 'See less' : 'See more'}</Text>
                  )}
                </Text>
              </TouchableOpacity>
            );
          })()}

          {/* Portfolio images (up to 3, swipeable) — freelancer portfolio
              categories only (Photography, Property Rental, Fashion
              Designers, Models, Styling & Makeup). Explicit category check,
              not just imageUrls presence, so this stays correct even if a
              future feature adds images to other post types. */}
          {item.imageUrls.length > 0 && item.ownerRole === 'FREELANCER' && matchesPortfolioCategory(item.categoryNames) && (
            <PortfolioImageCarousel images={item.imageUrls} style={s.cardImageWrap} />
          )}

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
                <Text style={s.pillText} numberOfLines={1}>
                  Starting from <Text style={{ color: '#fbbf24' }}>₹{formatBudgetK(item.budget)}</Text>
                </Text>
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
          {completedCollabPostIds.has(item.id) ? (
            <View style={[s.bigCollabBtn, { backgroundColor: '#246307' }]}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
              <Text style={s.bigCollabBtnText}>Collaborated</Text>
            </View>
          ) : acceptedCollabPostIds.has(item.id) ? (
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
          ) : collabSentIds.has(item.id) ? (
            <TouchableOpacity
              style={[s.bigCollabBtn, { backgroundColor: accent, opacity: cancellingCollabPostId === item.id ? 0.6 : 1 }]}
              onPress={() => handleCancelCollab(item.id)}
              activeOpacity={0.8}
              disabled={cancellingCollabPostId === item.id}
            >
              <Ionicons name="close-circle-outline" size={16} color="#fff" />
              <Text style={s.bigCollabBtnText}>Sent · Tap to Cancel</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[s.bigCollabBtn, { backgroundColor: accent }]}
              onPress={() => handleCollab(item.ownerId, item.id)}
              activeOpacity={0.8}
            >
              <Image
                source={require('../../assets/collaborate.png')}
                style={{ width: 16, height: 16, tintColor: '#fff' }}
                resizeMode="contain"
              />
              <Text style={s.bigCollabBtnText}>Collaborate</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>
    );
  }, [expandedPosts, handleCardTap, handlePortfolio, handleMessage, handleCall, handleCollab, handleCancelCollab, handleShare, collabSentIds, cancellingCollabPostId, acceptedCollabPostIds, completedCollabPostIds, savedPostIds, handleBookmark]);

  // Reusable filter form (Collab Type / Experience / Language / Location) — lives inside
  // the main right-side filter drawer (behind the header's filter icon). Tapping a row
  // opens a second, narrower drawer stacked on top with that filter's option list.
  const FILTER_ROWS: Array<{ key: 'price' | 'experience' | 'language' | 'location' | 'budget' | 'sort'; label: string; placeholder: string; value: string | null; setValue: (v: string | null) => void; options: string[] }> = [
    { key: 'sort', label: 'Sort By', placeholder: 'Recommended', value: selectedSort, setValue: setSelectedSort, options: SORT_OPTIONS },
    { key: 'price', label: 'Collab Type', placeholder: 'Select Collab Type', value: selectedPriceRange, setValue: setSelectedPriceRange, options: PRICE_OPTIONS },
    { key: 'budget', label: 'Budget Range', placeholder: 'Select budget range', value: selectedBudgetRange, setValue: setSelectedBudgetRange, options: BUDGET_OPTIONS },
    { key: 'experience', label: 'Experience', placeholder: 'Select experience', value: selectedExperience, setValue: setSelectedExperience, options: EXPERIENCE_OPTIONS },
    { key: 'language', label: 'Language', placeholder: 'Select language', value: selectedLanguage, setValue: setSelectedLanguage, options: LANGUAGE_OPTIONS },
    { key: 'location', label: 'Location', placeholder: 'Select location', value: selectedLocation, setValue: setSelectedLocation, options: LOCATION_OPTIONS },
  ];

  // filterModalType null just means "nothing tapped yet this time" — default
  // the right pane to the first row so it's never empty, matching the
  // reference design where a category is always active.
  const activeFilterKey = filterModalType ?? FILTER_ROWS[0].key;
  const activeFilterRow = FILTER_ROWS.find((row) => row.key === activeFilterKey) || FILTER_ROWS[0];

  const clearAllFilters = () => {
    FILTER_ROWS.forEach((row) => row.setValue(null));
  };

  // Sidebar now owns category selection; the FlatList's header is just the per-category hero card.
  const listHeader = useMemo(() => (
    <View style={s.heroCard}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: activeCat.gradient[1], borderRadius: 24 }]} />
      <View style={[StyleSheet.absoluteFill, { opacity: 0.6, backgroundColor: activeCat.gradient[0], borderRadius: 24 }]} />
      <View style={s.heroContent}>
        <View style={s.heroTextArea}>
          <Text style={[s.heroTitle, s.heroTitleBold]}>{activeCat.heroLine1}</Text>
          {!!activeCat.heroLine2 && activeCat.heroLine2.trim().length > 0 && (
            <Text style={[s.heroTitle, s.heroTitleFaded]}>{activeCat.heroLine2}</Text>
          )}
          {!!activeCat.heroLine3 && activeCat.heroLine3.trim().length > 0 && (
            <Text style={[s.heroTitle, s.heroTitleFaded]}>{activeCat.heroLine3}</Text>
          )}
          <Text style={s.heroDesc}>{activeCat.heroDesc}</Text>
        </View>
        <HeroAnimatedImage source={activeCat.image} style={[s.heroCharacter, activeCat.charStyle, { width: 111, height: 104 }]} activeCatId={activeCat.id} isFreelancer={userRole === 'FREELANCER'} />
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
            <Image source={require('../../assets/filter.png')} style={{ width: 20, height: 20 }} resizeMode="contain" />
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
            ref={sidebarScrollRef}
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 90 }}
            nestedScrollEnabled={true}
          >
            {availableCategories.map((cat) => {
              const isActive = cat.id === activeCategory;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onLayout={(e) => { sidebarItemY.current[cat.id] = e.nativeEvent.layout.y; }}
                  onPress={() => selectCategory(cat.id)}
                  activeOpacity={0.8}
                  style={[s.sidebarItem, isActive && s.sidebarItemActive]}
                >
                  {(cat as any).iconSvg ? (
                    <SvgXml xml={(cat as any).iconSvg} width={24} height={24} />
                  ) : (
                    <Image source={(cat as any).icon} style={{ width: 24, height: 24 }} resizeMode="contain" />
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
                <Text style={s.modalTitle}>{selectedSocialLinks ? 'Social Links' : 'Portfolio Links'}</Text>
              </View>
              <TouchableOpacity style={s.modalClose} onPress={() => setPortfolioModalVisible(false)}>
                <Feather name="x" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
            {portfolioLoading ? (
              <ActivityIndicator color="#A78BFA" style={{ marginTop: 16 }} />
            ) : selectedSocialLinks ? (
              selectedSocialLinks.length > 0 ? (
                selectedSocialLinks.map((link) => (
                  <TouchableOpacity key={link.key} style={s.portfolioRow} onPress={async () => {
                    try {
                      await WebBrowser.openBrowserAsync(link.url);
                    } catch {
                      try {
                        await Linking.openURL(link.url);
                      } catch {
                        Alert.alert('Could not open link', 'This link could not be opened.');
                      }
                    }
                  }}>
                    <Ionicons name={link.icon as any} size={20} color={link.color} />
                    <Text style={[s.portfolioLinkText, { marginLeft: 10 }]} numberOfLines={1}>{link.url}</Text>
                    <Feather name="arrow-up-right" size={20} color="#A78BFA" />
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={s.noPortfolio}>No social links provided.</Text>
              )
            ) : selectedPortfolioLink ? (
              <TouchableOpacity style={s.portfolioRow} onPress={async () => {
                let url = selectedPortfolioLink.trim();
                if (!url) return;
                if (!url.startsWith('http')) url = 'https://' + url;
                try {
                  await WebBrowser.openBrowserAsync(url);
                } catch {
                  try {
                    await Linking.openURL(url);
                  } catch {
                    Alert.alert('Could not open link', 'This portfolio link could not be opened.');
                  }
                }
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

      {/* ═══ FILTER DRAWER (slides in from the right, behind the header's filter icon) ═══
          Single full-screen panel: a left-side list of filter categories and
          a right-side pane of that category's options, with a Filters/Clear
          All header and a Close/Apply footer. */}
      <Modal
        visible={filterPanelVisible}
        transparent
        animationType="fade"
        onRequestClose={closeFilterDrawer}
      >
        <View style={s.filterDrawerOverlay}>
          <TouchableOpacity style={s.filterDrawerDismiss} activeOpacity={1} onPress={closeFilterDrawer} />
          <Animated.View style={[s.filterDrawerPanel, { width: FILTER_DRAWER_WIDTH, paddingTop: insets.top + 20 }, drawerAnimStyle]}>
            <View style={s.filterHeaderRow}>
              <Text style={s.filterHeaderTitle}>Filters</Text>
              <TouchableOpacity onPress={clearAllFilters} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={[s.filterClearAllText,  ]}>Clear All</Text>
              </TouchableOpacity>
            </View>

            <View style={s.filterBodyRow}>
              {/* Left: filter categories */}
              <ScrollView style={s.filterCategoryList} showsVerticalScrollIndicator={false} bounces={false}>
                {FILTER_ROWS.map((row) => {
                  const isActive = row.key === activeFilterKey;
                  return (
                    <TouchableOpacity
                      key={row.key}
                      style={[s.filterCategoryItem, isActive && s.filterCategoryItemActive]}
                      activeOpacity={0.7}
                      onPress={() => setFilterModalType(row.key)}
                    >
                      <Text style={[s.filterCategoryText, isActive && s.filterCategoryTextActive]} numberOfLines={2}>
                        {row.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Right: options for the active category */}
              <ScrollView style={s.filterOptionsList} showsVerticalScrollIndicator={false} bounces={false}>
                {activeFilterRow.options.map((option) => {
                  const isSelected = activeFilterRow.value === option;
                  return (
                    <TouchableOpacity
                      key={option}
                      style={s.filterOptionRow}
                      activeOpacity={0.7}
                      onPress={() => activeFilterRow.setValue(isSelected ? null : option)}
                    >
                      {/* Ionicons' "checkmark" glyph is a fixed-weight font
                          icon — it has no stroke-width control. A custom SVG
                          path lets us draw a bolder tick instead. */}
                      <Svg width={16} height={16} viewBox="0 0 24 24">
                        <Path
                          d="M4 12.5L9.5 18L20 6"
                          fill="none"
                          stroke={isSelected ? '#fff' : '#6e7180'}
                          strokeWidth={4}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                      <Text style={[s.filterOptionText, !isSelected && { color: 'rgba(255,255,255,0.60)' }]}>{option}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={[s.filterFooterRow, { paddingBottom: insets.bottom || 12 }]}>
              <TouchableOpacity style={s.filterFooterBtn} activeOpacity={0.7} onPress={closeFilterDrawer}>
                <Text style={s.filterFooterCloseText}>CLOSE</Text>
              </TouchableOpacity>
              <View style={s.filterFooterDivider} />
              <TouchableOpacity style={s.filterFooterBtn} activeOpacity={0.7} onPress={closeFilterDrawer}>
                <Text style={[s.filterFooterApplyText  ]}>APPLY</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
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
  bodyRow: { flex: 1, flexDirection: 'row', gap: 4 },
  sidebar: { width: 83, backgroundColor: '#1E1E24', borderTopRightRadius: 20, borderBottomRightRadius: 20, overflow: 'hidden' },
  sidebarItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    marginBottom: 20,
    gap: 8,
  },
  sidebarItemActive: {
    // Closest RN equivalent of the CSS box-shadow: RN has no multi-shadow or
    // inset-shadow support, so the two inset highlights (top/bottom, 0.15
    // white) become 1px top/bottom border lines; the rest of the box-shadow
    // list is all ≤0.05 opacity (functionally invisible) so it's skipped.
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    shadowColor: 'rgba(145,145,145,1)',
    shadowOffset: { width: -2, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  sidebarLabel: {
    color: '#fff',
    fontSize: 11,
    lineHeight: 13,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    includeFontPadding: false,
  },
  sidebarLabelActive: { color: '#fff', fontFamily: 'Poppins_600SemiBold' },
  feedColumn: { flex: 1 },

  // Hero card — inset, rounded on all corners, sits as the feed's list header
  heroCard: {
    minHeight: 140,
    borderRadius: 24,
    overflow: 'hidden',
    marginHorizontal: 8,
    marginBottom: 8,
    padding: 20,
  },

  // Sparkle dots
  sparkleDot: { position: 'absolute', borderRadius: 99, backgroundColor: '#fff' },

  // Hero text + character
  heroContent: { flex: 1, position: 'relative' },
  heroTextArea: { maxWidth: '78%' },
  heroTitle: { fontSize: 14, lineHeight: 20, fontFamily: 'Poppins_700Bold', },
  heroTitleBold: { color: '#fff' },
  heroTitleFaded: { color: '#fff' },
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
  // Filter drawer (slides in from the right)
  filterDrawerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', flexDirection: 'row' },
  filterDrawerDismiss: { flex: 1 },
  filterDrawerPanel: {
    height: '100%', backgroundColor: '#060606',
  },
  filterHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderColor: '#524d4d',
  },
  filterHeaderTitle: { color: '#fff', fontSize: 16, fontFamily: 'Poppins_500Medium' },
  filterClearAllText: { fontSize: 16, fontFamily: 'Poppins_500Medium', color: '#fb4c4c'},
  filterBodyRow: { flex: 1, flexDirection: 'row' },
  filterCategoryList: {
    width: FILTER_CATEGORY_LIST_WIDTH, backgroundColor: '#323131',
  },
  filterCategoryItem: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderColor: '#524d4d' },
  filterCategoryItemActive: { backgroundColor: '#060606', borderColor: '#524d4d', borderBottomWidth: 1, },
  filterCategoryText: { color: '#939292', fontSize: 14, fontFamily: 'Poppins_400Regular' },
  filterCategoryTextActive: { color: '#fff', fontFamily: 'Poppins_500Medium', },
  filterOptionsList: { flex: 1, paddingHorizontal: 16, },
  filterFooterRow: {
    flexDirection: 'row', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)',
  },
  filterFooterBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 18 },
  filterFooterDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.15)' },
  filterFooterCloseText: {color: '#fff', fontSize: 14, fontFamily: 'Poppins_500Medium'  },
  filterFooterApplyText: {fontSize: 14, fontFamily: 'Poppins_500Medium', color: '#fb4c4c'},

  // Empty
  emptyState: { paddingHorizontal: 40, paddingTop: 60, alignItems: 'center', gap: 10 },
  emptyTitle: { color: '#fff', fontSize: 17, fontWeight: '600', marginTop: 10 },
  emptySubtitle: { color: '#888', fontSize: 13, textAlign: 'center', lineHeight: 20 },

  // Feed
  feedList: { paddingHorizontal: 8, gap: 20 },

  // Card
  card: {
    width: '100%', maxWidth: 333, minHeight: 287,
    backgroundColor: '#1a1a1a', borderRadius: 24, padding: 16,
    borderWidth: 1,
    alignSelf: 'center',
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  cardAvatarWrap: { marginRight: 14 },
  cardAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#333', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  cardInitials: { fontSize: 20, fontWeight: '700' },
  cardNameArea: { flex: 1, paddingTop: 4, minWidth: 0 },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  cardName: { color: '#fff', fontSize: 16, fontFamily: 'Poppins_500Medium', maxWidth: '80%', flexShrink: 1 },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  cardPortfolioLink: { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  bookmarkBtn: {
    width: 34, height: 34,
    justifyContent: 'center', alignItems: 'center',
  },

  // Description
  cardDesc: { color: '#d1d2d4', fontSize: 12, fontFamily: 'Poppins_300Light', lineHeight: 18, marginBottom: 14 },

  // Portfolio image(s) — up to 3, swipeable
  cardImageWrap: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    marginBottom: 14,
  },

  // Info pills
  pillWrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',  
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7,
  },
  pillText: { color: '#a1a1aa', fontSize: 12, fontFamily: 'Poppins_400Regular', flexShrink: 1 },

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
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 14, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: '#282828',
  },
  filterOptionText: { color: '#fff', fontSize: 12, fontFamily: 'Poppins_400Regular' },
});
