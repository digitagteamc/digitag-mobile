import { useAuth } from '@/context/AuthContext';
import { Redirect, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CreatorsLanding() {
  const router = useRouter();
  const { isGuest, userRole, isProfileCompleted } = useAuth();

  if (isGuest) return <Redirect href="/role-selection" />;

  // Completed profiles land on home (the feed already shows opposite-role posts).
  if (isProfileCompleted) return <Redirect href="/(tabs)" />;

  const signupPath = userRole?.toUpperCase() === 'FREELANCER'
    ? '/signup/freelancer'
    : '/signup/creator';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Complete Your Profile</Text>
      <Text style={styles.desc}>
        Finish setting up your {userRole?.toLowerCase() || 'creator'} profile to unlock collaboration, chat, and direct calls.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push(signupPath as any)}
      >
        <Text style={styles.buttonText}>Complete Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1e', justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  desc: { color: '#ccc', textAlign: 'center', marginVertical: 20 },
  button: { backgroundColor: '#4f46e5', padding: 18, borderRadius: 12, width: '100%' },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' }
});