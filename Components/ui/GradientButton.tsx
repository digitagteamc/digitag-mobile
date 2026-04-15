import React from 'react';
import { Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  onPress: () => void;
  title: string;
  containerStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export default function GradientButton({ onPress, title, containerStyle, textStyle }: Props) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[styles.container, containerStyle]}>
      <LinearGradient
        colors={['#7352DD', '#AB91EA', '#9187E0']}
        start={{ x: 0, y: 0.11 }}
        end={{ x: 1, y: 0.95 }}
        style={styles.gradient}
      >
        <Text style={[styles.text, textStyle]}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 99,
    shadowColor: '#7352DD',
    shadowOffset: { width: 9.25, height: 13.75 },
    shadowOpacity: 0.13,
    shadowRadius: 2,
    elevation: 4,
    overflow: 'hidden',
  },
  gradient: {
    height: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 99,
  },
  text: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  }
});
