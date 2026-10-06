import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { listBrandRequirements } from '../../services/brandService';
import { fonts, palette } from '../../theme/colors';
import { useRoleTheme } from '../../theme/useRoleTheme';

/** Home-screen entry point for Creators / Freelancers into the brand
 *  requirements feed. Hidden for guests, brands, and when nothing is open
 *  to this user (freelancers only see "freelancer required" posts). */
export default function BrandRequirementsCard() {
    const router = useRouter();
    const theme = useRoleTheme();
    const { token, userRole, isGuest } = useAuth();
    const [count, setCount] = useState<number | null>(null);
    const eligible = !!token && !isGuest && (userRole === 'CREATOR' || userRole === 'FREELANCER');

    useFocusEffect(useCallback(() => {
        if (!eligible) return;
        listBrandRequirements(token!, { page: 1 }).then((r) => setCount(r.success ? r.data.meta?.total ?? r.data.items.length : null));
    }, [eligible, token]));

    if (!eligible || !count) return null;

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/brand-requirements' as any)}
            style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 18, marginBottom: 22, backgroundColor: theme.soft, borderWidth: 1, borderColor: theme.border }}
        >
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="business-outline" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: '#fff', fontSize: 15, fontFamily: fonts.semibold }}>Brand Requirements</Text>
                <Text style={{ color: palette.textSecondary, fontSize: 12, fontFamily: fonts.regular, marginTop: 2 }}>
                    {count} brand{count === 1 ? ' is' : 's are'} looking for {userRole === 'FREELANCER' ? 'freelancers' : 'creators'} — tap to collab
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.primary} />
        </TouchableOpacity>
    );
}
