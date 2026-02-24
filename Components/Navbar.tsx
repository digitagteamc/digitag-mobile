import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Platform, StatusBar as RNStatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { userRole } = useAuth();
  const router = useRouter();
  const isCreator = userRole?.toUpperCase() === 'CREATOR';

  return (
    <View style={styles.outerContainer}>
      <StatusBar style="light" />

      <View style={styles.container}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/')}>
          <Text style={styles.logoText}>DIGITAG</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        {isCreator && (
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => router.push('/creator-inbox')}
          >
            <Text style={styles.notifEmoji}>🔔</Text>
            {/* Optional: Add a red dot if there are unread notifications */}
            <View style={styles.notifDot} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: '#0f0f1e',
    // Adds padding for Android status bar to prevent collision
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  container: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start', // Centers the logo now that icons are gone
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e30',
  },
  logoText: {
    color: '#fff',
    fontSize: 22, // Slightly larger since it's the main focus
    fontWeight: '900',
    letterSpacing: 2,
  },
  notifBtn: {
    padding: 8,
    position: 'relative',
  },
  notifEmoji: {
    fontSize: 20,
  },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#0f0f1e',
  },
});