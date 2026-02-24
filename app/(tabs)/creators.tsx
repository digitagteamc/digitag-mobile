import { useAuth } from '@/context/AuthContext';
import { checkCreatorStatus } from '@/services/userService';
import { Redirect, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CreatorsLanding() {
  const router = useRouter();
  const { userPhone, token, isGuest, userRole } = useAuth();
  const [loading, setLoading] = useState(true);

  // Redirect guests immediately
  if (isGuest) return <Redirect href="/login" />;

  // Brands should see the creators list, which is now on the Home screen for them.
  if (userRole === 'BRAND') {
    return <Redirect href="/(tabs)" />;
  }

  useEffect(() => {
    checkStatus();
  }, [userPhone]);

  const checkStatus = async () => {
    if (userPhone && token) {
      try {
        const result = await checkCreatorStatus(token);
        if (result.success && result.data) {
          const status = result.data.creatorStatus || result.data.status;
          if (status === 'APPROVED') {
            router.replace('/Creators/dashboard');
            return;
          } else if (status === 'PENDING') {
            router.replace('/signup/pending');
            return;
          }
        }
      } catch (e) {
        console.log("Status check failed, showing landing page");
      }
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Creator Hub</Text>
      <Text style={styles.desc}>Join our network of elite creators and manage your posts.</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/signup/creator')}
      >
        <Text style={styles.buttonText}>Signup / Register</Text>
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