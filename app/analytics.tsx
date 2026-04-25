import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function AnalyticsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Analytics</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.statsRow}>
            <View style={styles.statCardSmall}>
              <View style={styles.iconCircleWrapper}>
                <View style={[styles.iconCircle, styles.approvedIconCircle]}>
                   <Ionicons name="checkmark" size={20} color="#fff" />
                </View>
                <View style={styles.dottedBorder} />
              </View>
              <Text style={styles.statLabel}>Approved request</Text>
              <Text style={styles.statValue}>3</Text>
            </View>

            <View style={styles.statCardSmall}>
              <View style={styles.iconCircleWrapper}>
                <View style={[styles.iconCircle, styles.pendingIconCircle]}>
                   <View style={styles.innerDottedCircle} />
                </View>
              </View>
              <Text style={styles.statLabel}>Pending Request</Text>
              <Text style={styles.statValue}>5</Text>
            </View>
          </View>

          {/* Bottom Card: Total Collaboration */}
          <View style={styles.totalCard}>
            <View style={styles.totalCardContent}>
              <View>
                <Text style={styles.totalLabel}>Total Collaboration</Text>
                <Text style={styles.totalValue}>12</Text>
              </View>
              
              <TouchableOpacity onPress={() => router.push('/notifications' as any)}>
                <LinearGradient
                  colors={['#F15DAB', '#ED2A91']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.viewRequestBtn}
                >
                  <Text style={styles.viewRequestText}>View Request</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    marginTop: 50,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontFamily: 'Poppins_600SemiBold',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statCardSmall: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    minHeight: 180,
  },
  iconCircleWrapper: {
    width: 56,
    height: 56,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  approvedIconCircle: {
    backgroundColor: 'rgba(241, 93, 171, 0.15)',
  },
  pendingIconCircle: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dottedBorder: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(241, 93, 171, 0.4)',
    borderStyle: 'dashed',
  },
  innerDottedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#fff',
    borderStyle: 'dashed',
  },
  statLabel: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    marginBottom: 8,
    opacity: 0.9,
  },
  statValue: {
    color: '#fff',
    fontSize: 32,
    fontFamily: 'Poppins_700Bold',
  },
  totalCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  totalCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    marginBottom: 8,
    opacity: 0.9,
  },
  totalValue: {
    color: '#fff',
    fontSize: 36,
    fontFamily: 'Poppins_700Bold',
  },
  viewRequestBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 99,
  },
  viewRequestText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
});
