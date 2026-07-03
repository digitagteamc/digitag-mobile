import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Stop, LinearGradient as SvgLinearGradient, Text as SvgText } from 'react-native-svg';

const splashWebp = require('../../assets/splash.webp');

// ─── Types ─────────────────────────────────────────────────────────────────
type SlideLine = {
  text: string;
  color?: string;
  gradient?: string[];
  gradientCoords?: { x1: string; y1: string; x2: string; y2: string };
};
type Slide = { lines: SlideLine[]; subtitle: string };

// ─── GradientText Helper ───────────────────────────────────────────────────
function GradientText({
  text,
  colors,
  fontSize,
  coords = { x1: '0', y1: '0', x2: '1', y2: '0' },
  style,
}: {
  text: string;
  colors: string[];
  fontSize: number;
  coords?: { x1: string; y1: string; x2: string; y2: string };
  style?: any;
}) {
  // Unique ID prevents text from disappearing during animations
  const gradId = `grad-${text.replace(/[^a-zA-Z0-9]/g, '')}`;
  const containerH = fontSize * 1.4;
  return (
    <View style={[{ height: containerH, width: '100%', justifyContent: 'center' }, style]}>
      <Svg height={containerH} width="100%" style={{ overflow: 'visible' }}>
        <Defs>
          <SvgLinearGradient id={gradId} x1={coords.x1} y1={coords.y1} x2={coords.x2} y2={coords.y2}>
            <Stop offset="0" stopColor={colors[0]} stopOpacity="1" />
            <Stop offset="1" stopColor={colors[1]} stopOpacity="1" />
          </SvgLinearGradient>
        </Defs>
        <SvgText
          fill={`url(#${gradId})`}
          fontSize={fontSize}
          fontFamily="Poppins_700Bold"
         
          x="0"
          y={containerH * 0.72}
          textAnchor="start"
        >
          {text}
        </SvgText>
      </Svg>
    </View>
  );
}

// ─── SplashStep0 ────────────────────────────────────────────────────────────
function SplashStep0({
  screenH,
  screenW,
  isCompact,
  isTablet,
  onGetStarted,
  slides,
}: {
  screenH: number;
  screenW: number;
  isCompact: boolean;
  isTablet: boolean;
  onGetStarted: () => void;
  slides: Slide[];
}) {
  const [slideIndex, setSlideIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % slides.length);
    }, 2500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [slides.length]);

  const activeSlide = slides[slideIndex];
  const fontSize = isCompact ? 32 : 40;
  // Hero image covers ~72% of screen height, matching Figma proportions
  const heroHeight = screenH * 0.72;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      {/* Full-screen hero image */}
      <Image
        source={splashWebp}
        style={
          isTablet
            ? [StyleSheet.absoluteFillObject, styles.heroImage]
            : [styles.heroImage, { height: screenH * 0.62 }]
        }
        resizeMode="cover"
      />

      {/* Full-screen gradient overlay fading from transparent to black at bottom */}
      <LinearGradient
        colors={isTablet ? ['transparent', 'rgba(0,0,0,0.65)', '#000000'] : ['transparent', 'rgba(0,0,0,0.55)', '#000000']}
        locations={isTablet ? [0.45, 0.75, 1] : [0.55, 0.8, 1]}
        style={isTablet ? StyleSheet.absoluteFillObject : styles.gradientOverlay}
        pointerEvents="none"
      />

      {/* Bottom content panel — absolutely positioned */}
      <SafeAreaView
        edges={['bottom', 'left', 'right']}
        style={styles.safeArea}
      >
        <View style={styles.contentWrapper}>
          {/* Text section — flex: 1 so it pushes button to bottom */}
          <View style={styles.topSection}>
            <Animated.View
              key={slideIndex}
              entering={FadeIn.duration(350)}
              exiting={FadeOut.duration(250)}
              style={styles.headlineContainer}
            >
              {activeSlide.lines.map((line, i) => (
                line.gradient ? (
                  <GradientText
                    key={i}
                    text={line.text}
                    colors={line.gradient}
                    fontSize={fontSize}
                    coords={line.gradientCoords}
                  />
                ) : (
                  <Text
                    key={i}
                    style={[
                      styles.headlineText,
                      { fontSize, color: line.color || '#FFFFFF' }
                    ]}
                  >
                    {line.text}
                  </Text>
                )
              ))}
            </Animated.View>

            {/* Subtitle */}
            <Animated.Text
              key={`sub-${slideIndex}`}
              entering={FadeIn.duration(350)}
              style={styles.subtitleText}
            >
              {activeSlide.subtitle}
            </Animated.Text>
          </View>

          {/* Fixed bottom section — button + pagination */}
          <View style={styles.bottomSection}>
            <TouchableOpacity
              onPress={onGetStarted}
              activeOpacity={0.85}
              style={styles.buttonTouchable}
            >
              <LinearGradient
                colors={['#FF611A', '#E526A6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Get Started  →</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Pagination dots */}
            <View style={styles.paginationContainer}>
              {slides.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.paginationDot,
                    {
                      width: idx === slideIndex ? 20 : 8,
                      backgroundColor: idx === slideIndex ? '#FF611A' : 'rgba(255,255,255,0.3)',
                    }
                  ]}
                />
              ))}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Constants ─────────────────────────────────────────────────────────────
const SPLASH_SLIDES: Slide[] = [
  {
    lines: [
      { text: 'Connect.', color: '#FFFFFF' },
      {
        text: 'Create.',
        gradient: ['#ED2A91', '#FC6121'],
        gradientCoords: { x1: '0', y1: '0', x2: '1', y2: '0' }
      },
      { text: 'Collaborate.', color: '#FFFFFF' },
    ],
    subtitle: 'The ultimate platform for creators & brands',
  },
  {
    lines: [
      { text: 'Show skills.', color: '#FFFFFF' },
      {
        text: 'Get projects.',
        gradient: ['#F26930', '#ED2A91'],
        gradientCoords: { x1: '0', y1: '0', x2: '1', y2: '1' }
      },
    ],
    subtitle: 'Find projects and grow your career.',
  },
  {
    lines: [
      { text: 'Grow Your.', color: '#FFFFFF' },
      {
        text: 'Brand Faster.',
        gradient: ['#00D2FF', '#0071E3'],
        gradientCoords: { x1: '0', y1: '0', x2: '1', y2: '1' }
      },
    ],
    subtitle: 'Promote smarter. Grow faster.',
  },
  {
    lines: [
      { text: 'Manage.', color: '#FFFFFF' },
      {
        text: 'Collaborations.',
        gradient: ['#E2F20F', '#B2BD29'],
        gradientCoords: { x1: '0', y1: '0', x2: '1', y2: '0' }
      },
    ],
    subtitle: 'Connect brands with creators.',
  },
];

export default function Splash1() {
  const router = useRouter();
  const { height: screenH, width: screenW } = useWindowDimensions();
  const isCompact = screenH < 720;
  const isTablet = screenW >= 768;

  const handleNext = () => {
    router.replace('/role-selection');
  };

  return (
    <SplashStep0
      screenH={screenH}
      screenW={screenW}
      isCompact={isCompact}
      isTablet={isTablet}
      onGetStarted={handleNext}
      slides={SPLASH_SLIDES}
    />
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060606',
  },
  heroImage: {
    width: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  safeArea: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'flex-end',
    paddingBottom: 28,
  },
  topSection: {
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  bottomSection: {
    alignItems: 'center',
  },
  headlineContainer: {
    alignItems: 'flex-start',
    marginBottom: 10,
    width: '100%',
  },
  headlineText: {
    fontFamily: 'Poppins_700Bold',
    textAlign: 'left',
    lineHeight: 42,
    includeFontPadding: false,
  },
  subtitleText: {
    fontFamily: 'Poppins_400Regular',
    color: '#C7C7E0',
    textAlign: 'left',
    lineHeight: 22,
  },
  buttonTouchable: {
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: '#FF4D66',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 8,
    alignSelf: 'center',
    width: 260,
    marginBottom: 20,
  },
  buttonGradient: {
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  buttonText: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  paginationDot: {
    height: 8,
    borderRadius: 999,
  },

  // ─── Typography — font family & font size are defined here only ────────────
  fontHeadline: {
    fontFamily: 'Poppins_700Bold',

    fontSize: 40,
  },
  fontHeadlineCompact: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 32,
  },
  fontSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
  },
  fontButton: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
  },
});
