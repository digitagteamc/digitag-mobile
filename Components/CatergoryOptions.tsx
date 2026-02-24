import { useAuth } from '@/context/AuthContext';
import { Href, useRouter } from 'expo-router';
import { Briefcase, Building2, Users, Zap } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CategoryOptions() {
  const router = useRouter();
  const { isGuest } = useAuth();

  const options: { id: string; label: string; icon: React.ReactNode; path: Href }[] = [
    { id: '1', label: 'Creators', icon: <Users color="#fff" size={28} />, path: '/creators' },
    { id: '2', label: 'Brands', icon: <Building2 color="#fff" size={28} />, path: '/brands' },
    { id: '3', label: 'Agencies', icon: <Zap color="#fff" size={28} />, path: '/agencies' },
    { id: '4', label: 'Freelancers', icon: <Briefcase color="#fff" size={28} />, path: '/freelancers' },
  ];

  const handlePress = (path: Href) => {
    if (isGuest) {
      // Guests → send to login (navigate escapes the tab navigator)
      router.navigate('/login');
    } else {
      router.push(path);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Explore Categories</Text>
      <View style={styles.grid}>
        {options.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            onPress={() => handlePress(item.path)}
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>{item.icon}</View>
            <Text style={styles.label}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, marginTop: 10 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  card: {
    width: '48%',
    backgroundColor: '#1e1e30',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#2e2e4e'
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },
  label: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});