import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ExpandableText = ({ text, style, numberOfLines = 2 }: any) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [length, setLength] = useState(0);
  const [isTruncated, setIsTruncated] = useState(false);
  const [measured, setMeasured] = useState(false);

  const onTextLayout = useCallback(
    (e: any) => {
      if (measured) return;
      const lines = e.nativeEvent.lines;
      if (lines.length > numberOfLines) {
        let textLength = 0;
        for (let i = 0; i < numberOfLines; i++) {
          textLength += lines[i].text.length;
        }
        setLength(textLength);
        setIsTruncated(true);
      }
      setMeasured(true);
    },
    [numberOfLines, measured]
  );

  if (!text) {
    return null;
  }

  // Measure layer
  const measureLayer = !measured ? (
    <Text 
      style={[style, { position: 'absolute', opacity: 0 }]} 
      onTextLayout={onTextLayout}
    >
      {text}
    </Text>
  ) : null;

  if (!measured) {
    return (
      <View>
        {measureLayer}
        <Text style={style} numberOfLines={numberOfLines}>{text}</Text>
      </View>
    );
  }

  if (isExpanded || !isTruncated) {
    return (
      <View>
        <Text style={style}>
          {text}
        </Text>
        {isTruncated && (
          <Text style={[style, { color: '#A0A0B0', fontWeight: '600', marginTop: 2 }]} onPress={() => setIsExpanded(false)}>
            Show less
          </Text>
        )}
      </View>
    );
  }

  const truncatedText = text.slice(0, Math.max(0, length - 15)).trim();

  return (
    <View>
      <Text style={style}>
        {truncatedText}...
        <Text style={{ color: '#A0A0B0', fontWeight: '600' }} onPress={() => setIsExpanded(true)}>
          {' '}more
        </Text>
      </Text>
    </View>
  );
};

export default ExpandableText;
