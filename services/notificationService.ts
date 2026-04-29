import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const requestUserPermission = async () => {
  if (Platform.OS === 'ios') {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Authorization status:', authStatus);
    }
    return enabled;
  } else {
    // Android 13+ requires explicit permission
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }
};

export const getFCMToken = async () => {
  try {
    const hasPermission = await requestUserPermission();
    if (!hasPermission) {
      console.warn('User did not grant notification permissions.');
      return null;
    }
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    // TODO: Send this token to the backend so the server can push messages to it
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

export const setupNotificationListeners = () => {
  // Foreground listener
  const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
    console.log('A new FCM message arrived in the foreground!', remoteMessage);
    
    // You can handle foreground messages specifically here, or let expo-notifications show it
    await Notifications.scheduleNotificationAsync({
        content: {
          title: remoteMessage.notification?.title || 'New Notification',
          body: remoteMessage.notification?.body || '',
          data: remoteMessage.data,
        },
        trigger: null,
      });
  });

  // Background / Quit State tapped listener
  messaging().onNotificationOpenedApp(remoteMessage => {
    console.log('Notification caused app to open from background state:', remoteMessage.notification);
    handleNotificationRouting(remoteMessage.data);
  });

  // Initial notification (when app is opened from a quit state)
  messaging().getInitialNotification().then(remoteMessage => {
    if (remoteMessage) {
      console.log('Notification caused app to open from quit state:', remoteMessage.notification);
      handleNotificationRouting(remoteMessage.data);
    }
  });

  return () => {
    unsubscribeForeground();
  };
};

const handleNotificationRouting = (data: any) => {
  if (!data) return;

  const { type, id } = data;
  
  switch (type) {
    case 'CHAT':
      router.push({ pathname: '/chat/[id]', params: { id } } as any);
      break;
    case 'NEW_POST':
      // Adjust pathname if needed
      router.push({ pathname: '/post/[id]', params: { id } } as any);
      break;
    case 'COLLAB_REQUEST':
      // Route to notifications or collaboration requests screen
      router.push('/notifications');
      break;
    case 'CALLING':
      // Route to video call screen
      // router.push({ pathname: '/call/[id]', params: { id } } as any);
      break;
    case 'STATUS_UPDATE':
      // Route to specific screen
      router.push('/notifications');
      break;
    default:
      console.log('Unknown notification type:', type);
  }
};
