import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other';
  time: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    text: 'Hi! I am looking for the video editor opportunity please Contact me Thank you!',
    sender: 'other',
    time: '11:05',
  },
  {
    id: '2',
    text: 'Hi! How can i help you',
    sender: 'me',
    time: '11:06',
  },
];

export default function ChatRoom() {
  const { id, name, avatar } = useLocalSearchParams();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const handleSend = () => {
    if (inputText.trim() === '') return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...messages, newMessage]);
    setInputText('');

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleCall = (type: 'Video' | 'Audio') => {
    Alert.alert(`${type} Call`, `Initiating ${type.toLowerCase()} call with ${name || 'User'}...`);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender === 'me';
    return (
      <View style={[styles.messageContainer, isMe ? styles.myMessageContainer : styles.otherMessageContainer]}>
        <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.otherBubble]}>
          <Text style={styles.messageText}>{item.text}</Text>
        </View>
        <View style={[styles.timeContainer, isMe ? styles.myTimeContainer : styles.otherTimeContainer]}>
          <Text style={styles.timeText}>{item.time}</Text>
          {isMe && <Ionicons name="checkmark-done" size={16} color="#888" style={styles.checkIcon} />}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      {/* Header Background Gradient */}
      <View style={styles.headerBackground}>
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
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>

          <Image
            source={{ uri: (avatar as string) || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop' }}
            style={styles.headerAvatar}
          />

          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{name || 'User'}</Text>
            <Text style={styles.headerStatus}>Last Seen at 11:30am</Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => handleCall('Video')} style={styles.actionIcon}>
              <Ionicons name="videocam-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleCall('Audio')} style={styles.actionIcon}>
              <Ionicons name="call-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.separator} />

        {/* Message Feed */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          ListHeaderComponent={<Text style={styles.dateSeparator}>Today</Text>}
        />

        {/* Input Bar */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.inputWrapper}>
            <View style={styles.inputContainer}>
              <TouchableOpacity style={styles.cameraBtn}>
                <LinearGradient
                  colors={['#ED2A91', '#E91E63']}
                  style={styles.iconCircle}
                >
                  <Ionicons name="camera" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>

              <TextInput
                style={styles.input}
                placeholder="Type a Message..."
                placeholderTextColor="#666"
                value={inputText}
                onChangeText={setInputText}
                multiline
              />

              <TouchableOpacity style={styles.attachBtn}>
                <Ionicons name="attach-outline" size={24} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity onPress={handleSend} style={styles.sendBtn}>
                <LinearGradient
                  colors={['#ED2A91', '#E91E63']}
                  style={styles.iconCircle}
                >
                  <Ionicons name="paper-plane" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#060606',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    marginRight: 8,
    marginTop: 40,

  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    marginTop: 40,

  },
  headerInfo: {
    flex: 1,
    marginTop: 40,
  },
  headerName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  headerStatus: {
    color: '#AAA',
    fontSize: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 40,

  },
  actionIcon: {
    padding: 4,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  dateSeparator: {
    color: '#666',
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 20,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  myBubble: {
    backgroundColor: '#1E1E1E',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#F26930',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 20,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  myTimeContainer: {
    justifyContent: 'flex-end',
  },
  otherTimeContainer: {
    justifyContent: 'flex-start',
  },
  timeText: {
    color: '#666',
    fontSize: 11,
  },
  checkIcon: {
    marginLeft: 4,
  },
  inputWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#060606',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 52,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingHorizontal: 12,
    maxHeight: 100,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBtn: {
    marginRight: 4,
  },
  attachBtn: {
    padding: 8,
  },
  sendBtn: {
    marginLeft: 4,
  },
});
