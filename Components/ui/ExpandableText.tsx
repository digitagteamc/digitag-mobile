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
    <View style={{ position: 'absolute', left: 0, right: 0, opacity: 0 }}>
      <Text 
        style={style} 
        onTextLayout={onTextLayout}
      >
        {text}
      </Text>
    </View>
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
        <Text 
          style={style} 
          onPress={isTruncated ? () => setIsExpanded(false) : undefined}
          suppressHighlighting={true}
        >
          {text}
        </Text>
      </View>
    );
  }

  // Fallback if measurement failed or returned weird values
  const sliceEnd = length > 20 ? length - 15 : 60;
  const truncatedText = text.slice(0, Math.max(0, sliceEnd)).trim();

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
