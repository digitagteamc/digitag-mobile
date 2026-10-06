import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Image, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { fonts, palette, rolePalettes } from '../../theme/colors';
import { AD_REQUEST_STATUS_COLOR, AD_REQUEST_STATUS_LABEL, AdRequestStatus } from '../../services/brandService';

// Shared building blocks for the brand screens — same dark surfaces, Poppins
// type and violet Brand accent as the rest of the app.

export const BRAND = rolePalettes.BRAND;
export const BG = '#060606';

export function ScreenHeader({ title, subtitle, right, onBack }: { title: string; subtitle?: string; right?: React.ReactNode; onBack?: () => void }) {
    const router = useRouter();
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1d1d24' }}>
            <TouchableOpacity
                onPress={onBack || (() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)))}
                style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#1c1c1c', alignItems: 'center', justifyContent: 'center' }}
            >
                <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 14 }}>
                <Text numberOfLines={1} style={{ color: '#fff', fontSize: 17, fontFamily: fonts.semibold }}>{title}</Text>
                {!!subtitle && <Text numberOfLines={1} style={{ color: palette.textMuted, fontSize: 12, fontFamily: fonts.regular }}>{subtitle}</Text>}
            </View>
            {right}
        </View>
    );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 24 }}>
            <Text style={{ color: '#fff', fontSize: 17, fontFamily: fonts.semibold }}>{title}</Text>
            {!!action && (
                <TouchableOpacity onPress={onAction} hitSlop={8}>
                    <Text style={{ color: BRAND.primary, fontSize: 13, fontFamily: fonts.semibold }}>{action}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

export function Chip({ label, active, onPress, color }: { label: string; active?: boolean; onPress?: () => void; color?: string }) {
    const c = color || BRAND.primary;
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            style={{
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, marginRight: 8,
                backgroundColor: active ? c : 'rgba(255,255,255,0.05)',
                borderWidth: 1, borderColor: active ? c : 'rgba(255,255,255,0.1)',
            }}
        >
            <Text style={{ color: active ? '#fff' : '#cfcfd8', fontSize: 13, fontFamily: fonts.semibold }}>{label}</Text>
        </TouchableOpacity>
    );
}

export function StatusPill({ status }: { status: AdRequestStatus }) {
    const color = AD_REQUEST_STATUS_COLOR[status];
    return (
        <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: color + '22', borderWidth: 1, borderColor: color + '66' }}>
            <Text style={{ color, fontSize: 11, fontFamily: fonts.semibold }}>{AD_REQUEST_STATUS_LABEL[status]}</Text>
        </View>
    );
}

export function Pill({ label, color }: { label: string; color: string }) {
    return (
        <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: color + '22', borderWidth: 1, borderColor: color + '66', alignSelf: 'flex-start' }}>
            <Text style={{ color, fontSize: 11, fontFamily: fonts.semibold }}>{label}</Text>
        </View>
    );
}

export function Avatar({ uri, name, size = 48, rounded = true, color }: { uri?: string | null; name?: string | null; size?: number; rounded?: boolean; color?: string }) {
    const radius = rounded ? size / 2 : 12;
    if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: radius, backgroundColor: '#1c1c24' }} />;
    const initials = (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
    const c = color || BRAND.primary;
    return (
        <View style={{ width: size, height: size, borderRadius: radius, backgroundColor: c + '22', borderWidth: 1, borderColor: c + '66', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: c, fontSize: size * 0.36, fontFamily: fonts.bold }}>{initials}</Text>
        </View>
    );
}

export function Card({ children, style, onPress }: { children: React.ReactNode; style?: ViewStyle; onPress?: () => void }) {
    const base: ViewStyle = { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 14 };
    if (onPress) {
        return <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[base, style]}>{children}</TouchableOpacity>;
    }
    return <View style={[base, style]}>{children}</View>;
}

export function PrimaryButton({ title, onPress, loading, disabled, color, style }: { title: string; onPress: () => void; loading?: boolean; disabled?: boolean; color?: string; style?: ViewStyle }) {
    const off = disabled || loading;
    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={off}
            activeOpacity={0.85}
            style={[{ backgroundColor: color || BRAND.primary, opacity: off ? 0.5 : 1, paddingVertical: 15, borderRadius: 14, alignItems: 'center' }, style]}
        >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 15, fontFamily: fonts.semibold }}>{title}</Text>}
        </TouchableOpacity>
    );
}

export function GhostButton({ title, onPress, color, style }: { title: string; onPress: () => void; color?: string; style?: ViewStyle }) {
    const c = color || '#cfcfd8';
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[{ paddingVertical: 13, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: c + '55' }, style]}>
            <Text style={{ color: c, fontSize: 14, fontFamily: fonts.semibold }}>{title}</Text>
        </TouchableOpacity>
    );
}

export function EmptyState({ icon = 'albums-outline', title, message, action, onAction }: { icon?: keyof typeof Ionicons.glyphMap; title: string; message?: string; action?: string; onAction?: () => void }) {
    return (
        <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: BRAND.soft, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Ionicons name={icon} size={28} color={BRAND.primary} />
            </View>
            <Text style={{ color: '#fff', fontSize: 16, fontFamily: fonts.semibold, textAlign: 'center' }}>{title}</Text>
            {!!message && <Text style={{ color: palette.textMuted, fontSize: 13, fontFamily: fonts.regular, textAlign: 'center', marginTop: 6, lineHeight: 19 }}>{message}</Text>}
            {!!action && <PrimaryButton title={action} onPress={onAction || (() => { })} style={{ marginTop: 18, paddingHorizontal: 28 }} />}
        </View>
    );
}

export function Loading() {
    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48 }}>
            <ActivityIndicator size="large" color={BRAND.primary} />
        </View>
    );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
    return <EmptyState icon="cloud-offline-outline" title="Couldn't load this" message={message} action="Try again" onAction={onRetry} />;
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
    return (
        <View style={{ marginBottom: 16 }}>
            <Text style={{ color: '#aaa', fontSize: 13, marginBottom: 8, marginLeft: 2, fontFamily: fonts.regular }}>{label}</Text>
            {children}
            {!!hint && <Text style={{ color: palette.textSubtle, fontSize: 11, marginTop: 6, marginLeft: 2, fontFamily: fonts.regular }}>{hint}</Text>}
        </View>
    );
}

export const inputStyle = {
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    fontSize: 15,
    fontFamily: fonts.regular,
} as const;

export function timeAgo(date: string | null | undefined) {
    if (!date) return '';
    const s = Math.max(0, (Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDate(date: string | null | undefined) {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
