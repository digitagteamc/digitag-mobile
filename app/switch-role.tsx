import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import IconButton from '../Components/ui/IconButton';
import StatusBadge from '../Components/ui/StatusBadge';
import { Role, useAuth } from '../context/AuthContext';
import { fonts, palette, rolePalettes, spacing } from '../theme/colors';
import { switchRole as apiSwitchRole } from '../services/userService';

/**
 * Role switcher / add-role screen. Shown from Profile → Switch Role.
 *
 * Behavior:
 *   - If a role has a completed profile → "Switch to <Role>" (activates it)
 *   - If a role has no profile → "Add <Role> profile" (switches server-side
 *     and routes to the corresponding signup form so the user can create it)
 */
export default function SwitchRoleScreen() {
    const router = useRouter();
    const { token, userRole, profiles, setActiveRole } = useAuth();
    const [busy, setBusy] = useState<Role | null>(null);

    const choose = async (role: Role) => {
        if (!token) {
            Alert.alert('Sign in required', 'Please sign in to switch roles.');
            return;
        }
        setBusy(role);
        const res = await apiSwitchRole(token, role);
        setBusy(null);
        if (!res.success) {
            Alert.alert('Could not switch', res.error || 'Please try again.');
            return;
        }

        setActiveRole(role);

        // If the target role already has a profile, drop the user straight
        // into the tabs in that role. Otherwise send them to the signup form
        // for the role they just activated.
        if (profiles[role]) {
            router.replace('/(tabs)');
        } else {
            const target = role === 'FREELANCER' ? '/signup/freelancer' : '/signup/creator';
            router.replace(target as any);
        }
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <IconButton onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))}>
                    <Ionicons name="chevron-back" size={20} color="#fff" />
                </IconButton>
                <Text style={styles.headerTitle}>Switch Role</Text>
                <View style={{ width: 36 }} />
            </View>

            <Text style={styles.subtitle}>
                One account, two experiences. Switch between Creator and Freelancer whenever you like — your data stays intact on both sides.
            </Text>

            <RoleCard
                role="CREATOR"
                label="Creator"
                description="Content makers, influencers, and brand collaborators."
                active={userRole === 'CREATOR'}
                hasProfile={profiles.CREATOR}
                busy={busy === 'CREATOR'}
                onPress={() => choose('CREATOR')}
            />

            <RoleCard
                role="FREELANCER"
                label="Freelancer"
                description="Video editors, designers, photographers, writers."
                active={userRole === 'FREELANCER'}
                hasProfile={profiles.FREELANCER}
                busy={busy === 'FREELANCER'}
                onPress={() => choose('FREELANCER')}
            />
        </SafeAreaView>
    );
}

function RoleCard({
    role,
    label,
    description,
    active,
    hasProfile,
    busy,
    onPress,
}: {
    role: Role;
    label: string;
    description: string;
    active: boolean;
    hasProfile: boolean;
    busy: boolean;
    onPress: () => void;
}) {
    const theme = rolePalettes[role];

    return (
        <TouchableOpacity
            activeOpacity={0.88}
            onPress={onPress}
            disabled={busy}
            style={[
                styles.card,
                {
                    borderColor: active ? theme.primary : palette.border,
                    backgroundColor: active ? theme.soft : palette.surface,
                },
            ]}
        >
            <LinearGradient
                colors={[theme.soft, 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            <View style={[styles.cardDot, { backgroundColor: theme.primary }]} />
            <View style={{ flex: 1 }}>
                <View style={styles.cardTitleRow}>
                    <Text style={[styles.cardTitle, { color: theme.primary }]}>{label}</Text>
                    {active ? (
                        <StatusBadge label="Active" tone="role" role={role} size="sm" />
                    ) : hasProfile ? (
                        <StatusBadge label="Ready" tone="success" size="sm" />
                    ) : (
                        <StatusBadge label="Not set up" tone="warning" size="sm" />
                    )}
                </View>
                <Text style={styles.cardDesc}>{description}</Text>
                <Text style={[styles.cardCta, { color: theme.primary }]}>
                    {busy ? 'Switching…' : active ? 'Currently active' : hasProfile ? `Switch to ${label}` : `Add ${label} profile`}
                </Text>
            </View>
            {busy ? (
                <ActivityIndicator color={theme.primary} />
            ) : (
                <Ionicons name="chevron-forward" size={20} color={theme.primary} />
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: palette.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        justifyContent: 'space-between',
    },
    headerTitle: { color: palette.textPrimary, fontSize: 17, fontFamily: fonts.semibold },
    subtitle: {
        color: palette.textMuted,
        fontSize: 13,
        fontFamily: fonts.regular,
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.lg,
        lineHeight: 20,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginHorizontal: spacing.xl,
        marginBottom: spacing.md,
        padding: 16,
        borderRadius: 18,
        borderWidth: 1,
        overflow: 'hidden',
    },
    cardDot: { width: 10, height: 10, borderRadius: 5 },
    cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
    cardTitle: { fontSize: 17, fontFamily: fonts.bold },
    cardDesc: { color: palette.textSecondary, fontSize: 12, fontFamily: fonts.regular, lineHeight: 18 },
    cardCta: { fontSize: 12, fontFamily: fonts.semibold, marginTop: 8 },
});
