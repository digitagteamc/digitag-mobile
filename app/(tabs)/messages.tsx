import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

const MOCK_MESSAGES = [
  {
    id: '1',
    name: 'Priya Sharma',
    lastMessage: 'Hey! we loved your portfolio are you..',
    time: '3:05 pm',
    unreadCount: 2,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: '2',
    name: 'FreshBrew Co.',
    lastMessage: 'Thanks for contacting us! Let’s ho...',
    time: '1:25 pm',
    unreadCount: 1,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: '3',
    name: 'Laila Noor',
    lastMessage: 'Hi! I think we’d be a great fit for th....',
    time: '1:25 pm',
    unreadCount: 0,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: '4',
    name: 'Aadhya Sharma',
    lastMessage: 'Hi! I saw your post on digitag. le...',
    time: '23/3/2026',
    unreadCount: 1,
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1000&auto=format&fit=crop',
  },
];

export default function MessagesScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      {/* Top Background Gradient */}
      <View style={styles.topGradient}>
        <LinearGradient
          colors={['#421133', '#060606']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Messages</Text>
            <Text style={styles.headerSubtitle}>Your Collab Conversations</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Text style={styles.placeholderText}>Search here</Text>
          </View>
        </View>

        {/* Chat List */}
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {MOCK_MESSAGES.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.chatItem}
              onPress={() => router.push({
                pathname: '/chat/[id]',
                params: { id: item.id, name: item.name, avatar: item.avatar }
              })}
            >
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
              <View style={styles.chatDetails}>
                <View style={styles.nameRow}>
                  <Text style={styles.nameText}>{item.name}</Text>
                  <Text style={styles.timeText}>{item.time}</Text>
                </View>
                <View style={styles.messageRow}>
                  <Text style={styles.messageText} numberOfLines={1}>
                    {item.lastMessage}
                  </Text>
                  {item.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{item.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      {/* Bottom Tab Bar */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.tabBtn} onPress={() => router.push('/(tabs)')}>
          <Ionicons name="home-outline" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabBtn} onPress={() => router.push('/(tabs)/explore')}>
          <Ionicons name="compass-outline" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.activePillTab}>
          <Ionicons name="chatbubble-ellipses" size={20} color="#ED2A91" />
          <Text style={styles.activePillText}>Messages</Text>
        </View>

        <TouchableOpacity style={styles.tabBtn} onPress={() => router.push('/(tabs)/profile')}>
          <Ionicons name="person-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#060606',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 30,

  },
  backBtn: {
    marginRight: 15,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#AAA',
    fontSize: 14,
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  placeholderText: {
    color: '#888',
    fontSize: 16,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  chatDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  timeText: {
    color: '#AAA',
    fontSize: 12,
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageText: {
    color: '#AAA',
    fontSize: 14,
    flex: 1,
    marginRight: 10,
  },
  unreadBadge: {
    backgroundColor: '#F26930',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: '#15151A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#222',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  tabBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePillTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFDCEE',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 8,
  },
  activePillText: {
    color: '#ED2A91',
    fontWeight: '800',
    fontSize: 14,
  },
});
