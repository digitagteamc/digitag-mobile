import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';

interface Props {
  onPress: () => void;
  title: string;
  colors?: readonly [string, string, ...string[]];
  locations?: readonly [number, number, ...number[]];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  borderColors?: readonly [string, string, ...string[]];
  shadowColor?: string;
  insetTopColor?: string;
  insetBottomColor?: string;
  containerStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  className?: string;
}

export default function GradientButton({
  onPress,
  title,
  colors = ['#7352DD', '#AB91EA', '#9187E0'],
  locations,
  start = { x: 0, y: 0.11 },
  end = { x: 1, y: 0.95 },
  borderColors,
  shadowColor = '#7352DD',
  insetTopColor,
  insetBottomColor,
  containerStyle,
  textStyle,
  className
}: Props) {
  const isTransparent = colors[0] === 'transparent' || colors[0] === 'rgba(0,0,0,0)';
  const isSolidColor = colors.length >= 2 && colors[0] === colors[1];
  const isSolidBorder = borderColors && borderColors.length >= 2 && borderColors[0] === borderColors[1];

  const content = (
    <View style={{
      height: 60,
      width: '100%',
      paddingHorizontal: 16,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 999,
      overflow: 'hidden',
      backgroundColor: isTransparent ? 'transparent' : (isSolidColor ? colors[0] : 'transparent')
    }}>
      {!isTransparent && !isSolidColor && (
        <LinearGradient
          colors={colors}
          locations={locations}
          start={start}
          end={end}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* Top-Left Inset Shadow Simulation */}
      {insetTopColor && (
        <LinearGradient
          colors={[insetTopColor, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.2, y: 0.4 }}
          style={[StyleSheet.absoluteFill, { borderRadius: 999 }]}
          pointerEvents="none"
        />
      )}

      {/* Bottom-Right Inset Shadow Simulation */}
      {insetBottomColor && (
        <LinearGradient
          colors={['transparent', insetBottomColor]}
          start={{ x: 0.8, y: 0.6 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: 999 }]}
          pointerEvents="none"
        />
      )}

      <Text
        style={textStyle}
        className="text-white text-[20px] font-poppins-semibold text-center"
      >
        {title}
      </Text>
    </View>
  );

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        {
          shadowColor: isTransparent ? 'transparent' : shadowColor,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: isTransparent ? 0 : 0.15,
          shadowRadius: 4,
          elevation: isTransparent ? 0 : 4,
        },
        containerStyle,
      ]}
      className={`rounded-full ${className || ''}`}
    >
      {borderColors ? (
        isSolidBorder ? (
          <View style={{
            borderWidth: 1.5,
            borderColor: borderColors[0],
            borderRadius: 999,
            width: '100%'
          }}>
            {content}
          </View>
        ) : (
          <View style={{ padding: 1.5, borderRadius: 999, overflow: 'hidden', width: '100%' }}>
            <LinearGradient
              colors={borderColors}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={{ backgroundColor: isTransparent ? 'transparent' : 'white', borderRadius: 999, width: '100%' }}>
              {content}
            </View>
          </View>
        )
      ) : (
        content
      )}
    </TouchableOpacity>
  );
}
