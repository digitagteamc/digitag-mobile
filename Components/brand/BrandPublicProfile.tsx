import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, palette } from '../../theme/colors';
import { Avatar, BG, BRAND, Card, Pill } from './ui';

/** What a Creator / Freelancer sees when opening a brand's profile (from
 *  chat, notifications or a requirement). Public fields only — the backend
 *  never returns PAN/GSTIN here. */
export default function BrandPublicProfile({ profile }: { profile: any }) {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const b = profile.brandProfile || {};
    const location = [b.city, b.state].filter(Boolean).join(', ');
    const website = b.website ? (/^https?:/.test(b.website) ? b.website : `https://${b.website}`) : null;

    return (
        <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ paddingBottom: 60 }}>
            <LinearGradient colors={['rgba(115, 82, 221, 0.45)', 'transparent']} style={{ paddingTop: insets.top + 12, paddingBottom: 24, paddingHorizontal: 16 }}>
                <TouchableOpacity
                    onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as any))}
                    style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' }}
                >
                    <Ionicons name="arrow-back" size={20} color="#fff" />
                </TouchableOpacity>
                <View style={{ alignItems: 'center', marginTop: 8 }}>
                    <Avatar uri={b.profilePicture} name={b.name} size={96} rounded={false} />
                    <Text style={{ color: '#fff', fontSize: 22, fontFamily: fonts.bold, marginTop: 14 }}>{b.name || 'Brand'}</Text>
                    <Text style={{ color: palette.textMuted, fontSize: 13, fontFamily: fonts.regular, marginTop: 2 }}>
                        {[b.industry, location].filter(Boolean).join(' · ') || 'Brand'}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                        <Pill label="Brand" color={BRAND.primary} />
                        {b.approvalStatus === 'APPROVED' && <Pill label="Verified" color="#22C55E" />}
                    </View>
                </View>
            </LinearGradient>

            <View style={{ paddingHorizontal: 16 }}>
                {!!b.bio && (
                    <Card style={{ marginBottom: 12 }}>
                        <Text style={{ color: '#fff', fontSize: 15, fontFamily: fonts.semibold, marginBottom: 6 }}>About</Text>
                        <Text style={{ color: palette.textSecondary, fontSize: 13, fontFamily: fonts.regular, lineHeight: 19 }}>{b.bio}</Text>
                    </Card>
                )}
                <Card>
                    {!!website && <Link icon="globe-outline" label={b.website} onPress={() => Linking.openURL(website).catch(() => { })} />}
                    {!!b.instagramHandle && (
                        <Link icon="logo-instagram" label={`@${String(b.instagramHandle).replace(/^@/, '')}`}
                            onPress={() => Linking.openURL(`https://instagram.com/${String(b.instagramHandle).replace(/^@/, '')}`).catch(() => { })} />
                    )}
                    {!!b.youtubeHandle && (
                        <Link icon="logo-youtube" label={b.youtubeHandle}
                            onPress={() => Linking.openURL(`https://youtube.com/${String(b.youtubeHandle).startsWith('@') ? b.youtubeHandle : `@${b.youtubeHandle}`}`).catch(() => { })} />
                    )}
                    {!website && !b.instagramHandle && !b.youtubeHandle && (
                        <Text style={{ color: palette.textMuted, fontFamily: fonts.regular, fontSize: 13 }}>No public links yet.</Text>
                    )}
                </Card>
                <TouchableOpacity
                    onPress={() => router.push('/brand-requirements' as any)}
                    style={{ marginTop: 14, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: BRAND.primary }}
                >
                    <Text style={{ color: '#fff', fontFamily: fonts.semibold }}>See brand requirements</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

function Link({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
    return (
        <TouchableOpacity onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}>
            <Ionicons name={icon} size={18} color={BRAND.light} />
            <Text numberOfLines={1} style={{ color: '#fff', fontSize: 14, fontFamily: fonts.regular, marginLeft: 12, flex: 1 }}>{label}</Text>
            <Ionicons name="open-outline" size={16} color={palette.textMuted} />
        </TouchableOpacity>
    );
}
