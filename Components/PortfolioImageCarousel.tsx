import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';

/** Up to 3 portfolio work-sample images in a single image slot — swipe to see
 *  the rest, with paging dots when there's more than one. Measures its own
 *  width via onLayout since callers typically size the wrapper as
 *  width:'100%' of their own column, not a fixed pixel value known upfront.
 *  Shared between Explore's post card and the post-detail banner so both
 *  stay in sync instead of maintaining two copies of the same swipe logic. */
export default function PortfolioImageCarousel({ images, style }: { images: string[]; style?: ViewStyle }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [containerWidth, setContainerWidth] = useState(0);
    if (!images.length) return null;
    return (
        <View style={[styles.wrap, style]} onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
            {containerWidth > 0 && (
                <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={(e) => {
                        setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / containerWidth));
                    }}
                >
                    {images.map((uri, i) => (
                        <Image key={`${uri}-${i}`} source={{ uri }} style={{ width: containerWidth, height: '100%' }} resizeMode="cover" />
                    ))}
                </ScrollView>
            )}
            {images.length > 1 && (
                <View style={styles.dots}>
                    {images.map((_, i) => (
                        <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { overflow: 'hidden', backgroundColor: '#1E1E24', position: 'relative' },
    dots: {
        position: 'absolute',
        bottom: 10,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
    },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
    dotActive: { backgroundColor: '#fff', width: 16 },
});
