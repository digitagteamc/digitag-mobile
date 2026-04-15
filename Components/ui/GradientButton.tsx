import React from 'react';
import { Text, TouchableOpacity, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  onPress: () => void;
  title: string;
  containerStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  className?: string;
}

export default function GradientButton({ onPress, title, containerStyle, textStyle, className }: Props) {
  return (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.8} 
      style={containerStyle}
      className={`rounded-full overflow-hidden shadow-[#7352DD] shadow-offset-w-[9.25px] shadow-offset-h-[13.75px] shadow-opacity-[0.13] shadow-radius-[2px] elevation-4 ${className}`}
    >
      <LinearGradient
        colors={['#7352DD', '#AB91EA', '#9187E0']}
        start={{ x: 0, y: 0.11 }}
        end={{ x: 1, y: 0.95 }}
        className="h-14 px-4 py-3 items-center justify-center rounded-full"
      >
        <Text 
          style={textStyle}
          className="text-white text-[20px] font-semibold text-center"
        >
          {title}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}
