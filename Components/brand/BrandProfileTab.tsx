import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Linking, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { BrandProfile, getMyBrandProfile, updateBrandProfile } from '../../services/brandService';
import { uploadImage } from '../../services/userService';
import { fonts, palette } from '../../theme/colors';
import { Avatar, BG, BRAND, Card, Pill } from './ui';

const APPROVAL = {
    APPROVED: { label: 'Verified brand', color: '#22C55E' },
    PENDING: { label: 'Awaiting approval', color: '#F59E0B' },
    REJECTED: { label: 'Not approved', color: '#EF4444' },
} as const;

const maskPan = (pan?: string | null) => (pan ? `${pan.slice(0, 2)}•••••${pan.slice(-3)}` : '—');

/** Profile tab for BRAND accounts. */
export default function BrandProfileTab() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { token, logout } = useAuth();
    const [profile, setProfile] = useState<BrandProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        if (!token) return;
        const res = await getMyBrandProfile(token);
        setProfile(res.success ? res.data : null);
        setLoading(false);
    }, [token]);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    const changeLogo = async () => {
        if (!token || !profile) return;
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) { Alert.alert('Permission needed', 'Allow photo access to set your brand logo.'); return; }
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [1, 1] });
        if (result.canceled || !result.assets?.[0]) return;
        const asset = result.assets[0];
        setUploading(true);
        const up = await uploadImage({ uri: asset.uri, name: asset.fileName || 'logo.jpg', type: asset.mimeType || 'image/jpeg' }, token, 'profiles');
        if (!up.success || !up.data?.url) { setUploading(false); Alert.alert('Upload failed', up.error || 'Try again.'); return; }
        const res = await updateBrandProfile(token, { profilePicture: up.data.url, profilePictureKey: up.data.key } as any);
        setUploading(false);
        if (res.success) setProfile(res.data); else Alert.alert('Could not save logo', res.error);
    };

    const confirmLogout = () =>
        Alert.alert('Log out?', 'You can log back in with your mobile number.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log out', style: 'destructive', onPress: () => { logout(); router.replace('/role-selection'); } },
        ]);

    if (loading) {
        return <View style={{ flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={BRAND.primary} size="large" /></View>;
    }

    const approval = profile ? APPROVAL[profile.approvalStatus] : null;
    const location = [profile?.city, profile?.state].filter(Boolean).join(', ');

    const menu: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }[] = [
        { icon: 'paper-plane-outline', label: 'My Ad Requests', onPress: () => router.push('/brand/ad-requests' as any) },
        { icon: 'megaphone-outline', label: 'My Posts & Applicants', onPress: () => router.push('/brand/my-posts' as any) },
        { icon: 'people-outline', label: 'My Collabs', onPress: () => router.push('/my-collabs' as any) },
        { icon: 'tv-outline', label: 'Browse Channels', onPress: () => router.push('/brand/channels' as any) },
        { icon: 'notifications-outline', label: 'Notifications', onPress: () => router.push('/notifications' as any) },
        { icon: 'settings-outline', label: 'Settings', onPress: () => router.push('/settings' as any) },
        { icon: 'help-circle-outline', label: 'Help & Support', onPress: () => router.push('/help-support' as any) },
    ];

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: BG }}
            contentContainerStyle={{ paddingBottom: 120 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={BRAND.primary} />}
        >
            <LinearGradient colors={['rgba(115, 82, 221, 0.45)', 'transparent']} style={{ paddingTop: insets.top + 24, paddingBottom: 24, alignItems: 'center' }}>
                <TouchableOpacity onPress={changeLogo} activeOpacity={0.85} disabled={!profile || uploading}>
                    <Avatar uri={profile?.profilePicture} name={profile?.name} size={96} rounded={false} />
                    <View style={{ position: 'absolute', right: -6, bottom: -6, width: 30, height: 30, borderRadius: 15, backgroundColor: BRAND.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: BG }}>
                        {uploading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="camera" size={14} color="#fff" />}
                    </View>
                </TouchableOpacity>
                <Text style={{ color: '#fff', fontSize: 22, fontFamily: fonts.bold, marginTop: 14 }}>{profile?.name || 'Your Brand'}</Text>
                <Text style={{ color: palette.textMuted, fontSize: 13, fontFamily: fonts.regular, marginTop: 2 }}>
                    {[profile?.industry, location].filter(Boolean).join(' · ') || 'Brand'}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                    {approval && <Pill label={approval.label} color={approval.color} />}
                    {!!profile?.tagId && <Pill label={`ID ${profile.tagId}`} color="#8A8A99" />}
                </View>
            </LinearGradient>

            <View style={{ paddingHorizontal: 16 }}>
                {!profile ? (
                    <Card onPress={() => router.push('/signup/brand' as any)} style={{ alignItems: 'center' }}>
                        <Text style={{ color: '#fff', fontFamily: fonts.semibold }}>Complete your brand registration</Text>
                        <Text style={{ color: palette.textMuted, fontFamily: fonts.regular, fontSize: 12, marginTop: 4 }}>Tap to add your KYC details</Text>
                    </Card>
                ) : (
                    <Card>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <Text style={{ color: '#fff', fontSize: 15, fontFamily: fonts.semibold }}>Business details</Text>
                            <TouchableOpacity onPress={() => router.push('/signup/brand' as any)} hitSlop={8}>
                                <Text style={{ color: BRAND.primary, fontSize: 13, fontFamily: fonts.semibold }}>Edit</Text>
                            </TouchableOpacity>
                        </View>
                        <Detail label="PAN" value={maskPan(profile.pan)} />
                        <Detail label="GSTIN" value={profile.gstin || '—'} />
                        <Detail label="Location" value={location || '—'} />
                        <Detail label="Website" value={profile.website || '—'} onPress={profile.website ? () => Linking.openURL(/^https?:/.test(profile.website!) ? profile.website! : `https://${profile.website}`).catch(() => { }) : undefined} />
                        {profile.approvalStatus !== 'APPROVED' && (
                            <TouchableOpacity onPress={() => router.push('/signup/pending?role=BRAND' as any)} style={{ marginTop: 10 }}>
                                <Text style={{ color: approval?.color, fontSize: 12, fontFamily: fonts.semibold }}>
                                    {profile.approvalStatus === 'REJECTED' ? `Not approved: ${profile.rejectionReason || 'tap for details'}` : 'Editing PAN, GSTIN or name sends your brand for re-review.'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </Card>
                )}

                <Card style={{ marginTop: 14, paddingVertical: 4 }}>
                    {menu.map((m, i) => (
                        <TouchableOpacity key={m.label} onPress={m.onPress} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderTopWidth: i ? 1 : 0, borderTopColor: 'rgba(255,255,255,0.06)' }}>
                            <Ionicons name={m.icon} size={20} color={BRAND.light} />
                            <Text style={{ color: '#fff', fontSize: 14, fontFamily: fonts.regular, marginLeft: 14, flex: 1 }}>{m.label}</Text>
                            <Ionicons name="chevron-forward" size={18} color={palette.textMuted} />
                        </TouchableOpacity>
                    ))}
                </Card>

                <TouchableOpacity onPress={confirmLogout} style={{ marginTop: 14, paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)' }}>
                    <Text style={{ color: '#EF4444', fontSize: 14, fontFamily: fonts.semibold }}>Log out</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

function Detail({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) {
    return (
        <TouchableOpacity disabled={!onPress} onPress={onPress} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
            <Text style={{ color: palette.textMuted, fontSize: 13, fontFamily: fonts.regular }}>{label}</Text>
            <Text numberOfLines={1} style={{ color: onPress ? BRAND.light : '#fff', fontSize: 13, fontFamily: fonts.semibold, maxWidth: '65%' }}>{value}</Text>
        </TouchableOpacity>
    );
}
