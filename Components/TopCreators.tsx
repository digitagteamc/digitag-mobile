import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.2.3:3001';
const RENDER_URL = `${API_BASE_URL}/creators`;

interface Creator {
  id: number;
  name: string;
  category: string;
}

export default function TopCreators() {
  const router = useRouter();
  const { isGuest } = useAuth();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCreators();
  }, []);

  const fetchCreators = async () => {
    try {
      const response = await fetch(RENDER_URL);
      const data = await response.json();
      if (Array.isArray(data)) {
        setCreators(data);
      } else {
        setCreators([]);
      }
    } catch (error) {
      console.error("Error fetching creators:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatorPress = (item: Creator) => {
    if (isGuest) {
      router.navigate('/login');
    } else {
      router.push({
        pathname: '/creator-details',
        params: {
          id: item.id.toString(),
          name: item.name,
          category: item.category,
        }
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#4f46e5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Top Creators</Text>
      <FlatList
        horizontal
        data={creators}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.75}
            onPress={() => handleCreatorPress(item)}
          >
            <View style={styles.avatarPlaceholder} />
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.role} numberOfLines={1}>{item.category}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={{ color: '#888', fontStyle: 'italic' }}>No creators yet.</Text>
        }
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#0f0f1e' },
  sectionTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  card: { backgroundColor: '#1e1e30', padding: 15, borderRadius: 15, marginRight: 15, alignItems: 'center', width: 140 },
  avatarPlaceholder: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#4f46e5', marginBottom: 10 },
  name: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  role: { color: '#aaa', fontSize: 12 }
});