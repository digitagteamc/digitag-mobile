import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ── Account items
interface AccountItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

export default function SettingsScreen() {
  const router = useRouter();
  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const ACCOUNT_ITEMS: AccountItem[] = [
    {
      id: 'password',
      icon: 'lock-closed-outline',
      label: 'Change Password',
      onPress: () => {},
    },
    {
      id: 'privacy',
      icon: 'shield-outline',
      label: 'Privacy Settings',
      onPress: () => {},
    },
    {
      id: 'terms',
      icon: 'document-text-outline',
      label: 'Terms of Service',
      onPress: () => Linking.openURL('https://digitag.in/terms').catch(() => {}),
    },
  ];

  return (
    <View style={styles.root}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      <SafeAreaView style={styles.safe}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingTop: statusBarHeight }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── HEADER ── */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Settings</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* ── ACCOUNT SECTION ── */}
          <Text style={styles.sectionTitle}>Account</Text>

          <View style={styles.card}>
            <View style={styles.cardBlur} />

            {ACCOUNT_ITEMS.map((item, index) => (
              <React.Fragment key={item.id}>
                <TouchableOpacity
                  style={styles.row}
                  activeOpacity={0.75}
                  onPress={item.onPress}
                >
                  <View style={styles.iconPill}>
                    <Ionicons name={item.icon} size={18} color="#F26930" />
                  </View>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={14} color="#9a9a9a" />
                </TouchableOpacity>

                {index < ACCOUNT_ITEMS.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>

          {/* ── PREFERENCES SECTION ── */}
          <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Preferences</Text>

          <View style={styles.card}>
            <View style={styles.cardBlur} />

            {/* Notifications row */}
            <View style={styles.row}>
              <View style={styles.iconPill}>
                <Ionicons name="notifications-outline" size={18} color="#F26930" />
              </View>
              <Text style={[styles.rowLabel, { flex: 1 }]}>Notifications</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#3a3a4a', true: '#6232FF' }}
                thumbColor="#fff"
                ios_backgroundColor="#3a3a4a"
              />
            </View>

            <View style={styles.divider} />

            {/* Language row */}
            <TouchableOpacity style={styles.row} activeOpacity={0.75}>
              <View style={styles.iconPill}>
                <Ionicons name="language-outline" size={18} color="#F26930" />
              </View>
              <Text style={[styles.rowLabel, { flex: 1 }]}>Language</Text>
              <Text style={styles.rowValue}>English</Text>
              <Ionicons name="chevron-forward" size={14} color="#9a9a9a" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1, minHeight: 40 }} />
        </ScrollView>

        {/* ── APP VERSION FOOTER ── */}
        <View style={styles.footer}>
          <Text style={styles.footerLabel}>App Version </Text>
          <Text style={styles.footerVersion}>1.0.0</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#060606',
  },
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 32,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '500',
    letterSpacing: -0.3,
  },

  // ── Section title
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 16,
  },

  // ── Card
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(156,156,156,0.5)',
    overflow: 'hidden',
    position: 'relative',
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#323232',
    shadowOffset: { width: -7, height: 17 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 4,
  },
  cardBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },

  // ── Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  iconPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(50,50,50,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(242,105,48,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  rowLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
    flex: 1,
  },
  rowValue: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '400',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(156,156,156,0.25)',
  },

  // ── Footer
  footer: {
    height: 56,
    backgroundColor: '#171717',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
  },
  footerVersion: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
