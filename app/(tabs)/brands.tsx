import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function BrandsScreen() {
  const { isGuest, userRole } = useAuth();

  if (isGuest) return <Redirect href="/login" />;
  if (userRole === 'BRAND') return <Redirect href="/(tabs)" />;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Brands Directory</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1e', justifyContent: 'center', alignItems: 'center' },
  text: { color: '#fff', fontSize: 24, fontWeight: 'bold' }
});