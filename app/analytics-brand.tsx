import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts, palette } from '../theme/colors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 40) / 2; // grid of 2x2 with 8px gap and 16px margins

export default function BrandAnalyticsScreen() {
  const router = useRouter();

  // Mock data matching the Figma design specs
  const stats = [
    {
      label: 'Views',
      value: '124K',
      change: '+12%',
      badgeColors: ['rgba(108, 71, 255, 0.15)', 'rgba(108, 71, 255, 0.25)'],
      textColor: '#A78BFA',
    },
    {
      label: 'Clicks',
      value: '8.4K',
      change: '+8%',
      badgeColors: ['rgba(0, 229, 195, 0.12)', 'rgba(0, 229, 195, 0.25)'],
      textColor: '#00E5C3',
    },
    {
      label: 'CTR',
      value: '6.7%',
      change: '+3%',
      badgeColors: ['rgba(237, 42, 145, 0.12)', 'rgba(237, 42, 145, 0.25)'],
      textColor: '#ED2A91',
    },
    {
      label: 'Watch',
      value: '2.4M',
      change: '+18%',
      badgeColors: ['rgba(245, 195, 68, 0.12)', 'rgba(245, 195, 68, 0.25)'],
      textColor: '#F5C344',
    },
  ];

  const dailyPerformance = [
    { day: 'M', height: 48 },
    { day: 'T', height: 78 },
    { day: 'W', height: 62 },
    { day: 'T', height: 94 },
    { day: 'F', height: 108 },
    { day: 'S', height: 82 },
    { day: 'S', height: 101 },
  ];

  const platformBreakdown = [
    { name: 'YouTube', pct: '72%', width: '72%', color: '#6D5EF5' },
    { name: 'Instagram', pct: '18%', width: '18%', color: '#ED2A91' },
    { name: 'Facebook', pct: '10%', width: '10%', color: '#3B82F6' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── Background Glowing Circles (Figma Style) ── */}
      <LinearGradient
        colors={['#6D5EF5', 'transparent']}
        style={[styles.glow, styles.glowTopLeft]}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['#00E5C3', 'transparent']}
        style={[styles.glow, styles.glowBottomRight]}
        pointerEvents="none"
      />

      <SafeAreaView style={styles.safeArea}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as any))}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Analytics</Text>
            <Text style={styles.headerSubtitle}>Nike Strip Ad • 16–21 Apr</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Stats Grid (2x2) ── */}
          <View style={styles.statsGrid}>
            {stats.map((item, index) => (
              <LinearGradient
                key={index}
                colors={['rgba(28, 28, 36, 0.65)', 'rgba(18, 18, 24, 0.45)']}
                style={styles.statCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.statValue}>{item.value}</Text>
                  <Text style={styles.statLabel}>{item.label}</Text>
                </View>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: item.badgeColors[0],
                      borderColor: item.badgeColors[1],
                    },
                  ]}
                >
                  <Text style={[styles.badgeText, { color: item.textColor }]}>
                    {item.change}
                  </Text>
                </View>
              </LinearGradient>
            ))}
          </View>

          {/* ── Daily Performance Chart ── */}
          <Text style={styles.sectionTitle}>Daily Performance</Text>
          <LinearGradient
            colors={['rgba(28, 28, 36, 0.55)', 'rgba(18, 18, 24, 0.35)']}
            style={styles.chartCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.chartContainer}>
              {dailyPerformance.map((bar, idx) => (
                <View key={idx} style={styles.barColumn}>
                  <View style={styles.barTrack}>
                    <LinearGradient
                      colors={['#8B5CF6', '#6D5EF5']}
                      style={[styles.barFill, { height: bar.height }]}
                    />
                  </View>
                  <Text style={styles.barDayText}>{bar.day}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>

          {/* ── Platform Breakdown ── */}
          <Text style={styles.sectionTitle}>Platform Breakdown</Text>
          <LinearGradient
            colors={['rgba(28, 28, 36, 0.55)', 'rgba(18, 18, 24, 0.35)']}
            style={styles.breakdownCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.breakdownList}>
              {platformBreakdown.map((item, idx) => (
                <View key={idx} style={styles.breakdownItem}>
                  <View style={styles.breakdownHeader}>
                    <Text style={styles.platformName}>{item.name}</Text>
                    <Text style={[styles.platformPct, { color: item.color }]}>
                      {item.pct}
                    </Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: item.width as any,
                          backgroundColor: item.color,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </LinearGradient>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  glow: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
  },
  glowTopLeft: {
    top: -110,
    left: -110,
    opacity: 0.18,
  },
  glowBottomRight: {
    bottom: -110,
    right: -110,
    opacity: 0.14,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  titleContainer: {
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontFamily: fonts.semibold,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: '#8A8A99',
    fontSize: 13,
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 18,
  },
  statCard: {
    width: CARD_WIDTH - 4,
    height: 96,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  cardHeader: {
    flex: 1,
  },
  statValue: {
    color: '#fff',
    fontSize: 26,
    fontFamily: fonts.bold,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  statLabel: {
    color: '#8A8A99',
    fontSize: 12,
    fontFamily: fonts.regular,
    marginTop: 1,
  },
  badge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: fonts.semibold,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: fonts.semibold,
    marginTop: 26,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  chartCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    paddingHorizontal: 8,
  },
  barColumn: {
    alignItems: 'center',
    gap: 8,
  },
  barTrack: {
    height: 110,
    justifyContent: 'flex-end',
  },
  barFill: {
    width: 24,
    borderRadius: 6,
  },
  barDayText: {
    color: '#8A8A99',
    fontSize: 11,
    fontFamily: fonts.regular,
  },
  breakdownCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  breakdownList: {
    gap: 16,
  },
  breakdownItem: {
    gap: 8,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  platformName: {
    color: '#fff',
    fontSize: 14,
    fontFamily: fonts.semibold,
  },
  platformPct: {
    fontSize: 14,
    fontFamily: fonts.semibold,
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
});
