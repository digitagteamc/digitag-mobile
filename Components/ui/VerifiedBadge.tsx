import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';

interface Props {
    isPremium?: boolean | null;
    size?: number;
    style?: any;
}

/** Premium's visible status symbol — a real verified checkmark, shown next
 *  to a user's name wherever they appear (profile, posts, chat, search,
 *  collabs, followers). Renders nothing for non-Premium users, so call
 *  sites can use it unconditionally: <VerifiedBadge isPremium={x.isPremium} />. */
export default function VerifiedBadge({ isPremium, size = 14, style }: Props) {
    if (!isPremium) return null;
    return (
        <View style={[{ marginLeft: 4 }, style]}>
            <Ionicons name="checkmark-circle" size={size} color="#3B82F6" />
        </View>
    );
}
