import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Hero() {
  const router = useRouter();
  const { isGuest } = useAuth();

  const handleGetStarted = () => {
    if (isGuest) {
      // Guests must log in first — navigate breaks out of the tab navigator
      router.navigate('/login');
    } else {
      router.push('/signup/role-selection');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Capture the Future</Text>
      <Text style={styles.subtitle}>The ultimate platform for creators and innovators.</Text>

      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.7}
        onPress={handleGetStarted}
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#12122b',
    padding: 20
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 40
  },
  subtitle: {
    color: '#ccc',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center'
  },
  button: {
    marginTop: 25,
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  }
});