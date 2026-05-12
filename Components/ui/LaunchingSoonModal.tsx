import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

// Target launch date — 15 days from first render
const LAUNCH_DATE = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

function getTimeLeft() {
  const diff = Math.max(0, LAUNCH_DATE.getTime() - Date.now());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds };
}

const DOT_POSITIONS = [
  { top: 18, left: 14 },
  { top: 18, right: 14 },
  { top: 80, left: 32 },
  { top: 80, right: 32 },
  { bottom: 160, left: 12 },
  { bottom: 160, right: 12 },
  { bottom: 80, left: 40 },
  { bottom: 80, right: 40 },
];

const CountdownBox = ({ value, label }: { value: number; label: string }) => (
  <View style={styles.countBox}>
    <Text style={styles.countNum}>{String(value).padStart(2, '0')}</Text>
    <Text style={styles.countLabel}>{label}</Text>
  </View>
);

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function LaunchingSoonModal({ visible, onClose }: Props) {
  const [time, setTime] = useState(getTimeLeft());
  const [email, setEmail] = useState('');

  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 18, stiffness: 160 });
      opacity.value = withTiming(1, { duration: 220 });
    } else {
      scale.value = withTiming(0.85, { duration: 180 });
      opacity.value = withTiming(0, { duration: 180 });
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handleNotify = () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    Alert.alert('You\'re on the list!', `We'll notify ${email} when we launch.`);
    setEmail('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />

        <Animated.View style={[styles.sheet, animStyle]}>
          <LinearGradient
            colors={['#1a1040', '#2e1b6e', '#5a1a5e']}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Decorative dots */}
          {DOT_POSITIONS.map((pos, i) => (
            <View key={i} style={[styles.dot, pos as any]} />
          ))}

          {/* Close button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Ionicons name="close" size={18} color="#fff" />
          </TouchableOpacity>

          {/* Rocket icon */}
          <View style={styles.iconWrap}>
            <LinearGradient
              colors={['#7c3aed', '#5b21b6']}
              style={styles.iconBg}
            >
              <Ionicons name="rocket-outline" size={38} color="#fff" />
            </LinearGradient>
          </View>

          {/* Title */}
          <Text style={styles.title}>Launching Soon</Text>
          <Text style={styles.subtitle}>Something amazing is on the way</Text>

          {/* Countdown */}
          <View style={styles.countRow}>
            <CountdownBox value={time.days} label="DAYS" />
            <CountdownBox value={time.hours} label="HOURS" />
            <CountdownBox value={time.minutes} label="MINUTES" />
            <CountdownBox value={time.seconds} label="SECONDS" />
          </View>

          {/* Email input */}
          <View style={styles.inputRow}>
            <Ionicons name="notifications-outline" size={18} color="rgba(255,255,255,0.5)" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.input}
              placeholder="Enter your email for updates"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.notifyBtn} onPress={handleNotify} activeOpacity={0.85}>
              <Text style={styles.notifyBtnText}>Notify Me</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom features */}
          <View style={styles.featuresRow}>
            <View style={styles.featureItem}>
              <View style={styles.featureIconBox}>
                <Ionicons name="calendar-outline" size={20} color="rgba(255,255,255,0.85)" />
              </View>
              <Text style={styles.featureLabel}>Early Access</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIconBox}>
                <Ionicons name="sparkles-outline" size={20} color="rgba(255,255,255,0.85)" />
              </View>
              <Text style={styles.featureLabel}>Exclusive Features</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIconBox}>
                <Ionicons name="notifications-outline" size={20} color="rgba(255,255,255,0.85)" />
              </View>
              <Text style={styles.featureLabel}>Launch Updates</Text>
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  sheet: {
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    paddingTop: 36,
    paddingBottom: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  dot: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrap: {
    marginBottom: 20,
  },
  iconBg: {
    width: 80,
    height: 80,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    marginBottom: 28,
  },
  countRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  countBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    minWidth: 64,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  countNum: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 28,
  },
  countLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 9,
    fontFamily: 'Poppins_400Regular',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingLeft: 14,
    paddingRight: 4,
    paddingVertical: 4,
    width: '100%',
    marginBottom: 28,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    paddingVertical: 10,
  },
  notifyBtn: {
    backgroundColor: '#6232FF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  notifyBtnText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  featuresRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  featureItem: {
    alignItems: 'center',
    gap: 8,
  },
  featureIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
});
