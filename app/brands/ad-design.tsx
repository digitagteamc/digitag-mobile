import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { createAdRequest, getChannelCatalog, uploadImage } from '../../services/userService';

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

const FREELANCERS = [
    { id: 'designstudio', name: 'DesignStudio Pro', initial: 'D', detail: 'Brand Identity • 4.9★', price: '₹8,000' },
    { id: 'motioncraft', name: 'MotionCraft', initial: 'M', detail: 'Video Ads • 4.7★', price: '₹6,500' },
];

// "Strip Ad" on this flow vs "Strip Ads" on a channel's rate card.
const adTypeKey = (name = '') => name.toLowerCase().replace(/[^a-z]/g, '').replace(/ads?$/, '');

export default function AdDesignPage() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { token } = useAuth();
    const { channelId, channelName, adTypes, from, to, location, language } = useLocalSearchParams<{
        channelId?: string;
        channelName?: string;
        adTypes?: string;
        from?: string;
        to?: string;
        location?: string;
        language?: string;
    }>();

    const [hasDesign, setHasDesign] = useState(true);
    const [design, setDesign] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [hiredId, setHiredId] = useState<string | null>(null);
    const [sending, setSending] = useState(false);

    const adTypeNames = (adTypes || 'Strip Ad').split('|');
    const designName = adTypeNames[0].replace(/\s*Ads?$/, '');

    const pickDesign = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], quality: 0.9 });
        const asset = result.canceled ? null : result.assets?.[0];
        if (!asset) return;
        if (asset.fileSize && asset.fileSize > MAX_UPLOAD_BYTES) {
            Alert.alert('File too large', 'Choose a file under 50MB.');
            return;
        }
        setDesign(asset);
    };

    const creativeNote = async (authToken: string) => {
        const freelancer = FREELANCERS.find((f) => f.id === hiredId);
        if (freelancer) return `Hire ${freelancer.name} for the design`;
        if (!hasDesign) return 'Brand needs a freelancer for the design';
        if (!design) return 'Brand will share the design';
        // There is no video upload endpoint yet, so a video stays with the brand.
        if (design.type === 'video') return 'Brand has a video design and will share it';
        const upload = await uploadImage(
            { uri: design.uri, name: design.fileName || 'ad-design.jpg', type: design.mimeType || 'image/jpeg' },
            authToken,
            'posts',
        );
        if (!upload.success) throw new Error(upload.error || 'Could not upload your design.');
        return `Design: ${upload.data.url}`;
    };

    const showRequestSent = (requestId = '') => {
        router.replace({
            pathname: '/brands/request-sent',
            params: { requestId, channelName: channelName || '', adTypes: adTypeNames.join('|') },
        } as any);
    };

    const handleSend = async () => {
        if (sending) return;
        // Sample channels have no rate card, so nothing is sent for them.
        if (!channelId) {
            showRequestSent();
            return;
        }
        if (!token) return;

        setSending(true);
        try {
            const catalog = await getChannelCatalog(token, channelId);
            if (!catalog.success) throw new Error(catalog.error);

            const items = adTypeNames.flatMap((name) => {
                const item = catalog.data.find((i: any) => adTypeKey(i.adType?.name) === adTypeKey(name));
                return item ? [{ catalogItemId: item.id, quantity: item.minQuantity || 1 }] : [];
            });
            if (items.length === 0) {
                throw new Error(`${channelName || 'This channel'} hasn't published rates for these ad types yet.`);
            }

            const brief = [
                `Ad types: ${adTypeNames.join(', ')}`,
                `Location: ${location}`,
                `Language: ${language}`,
                await creativeNote(token),
            ].join('\n');

            const res = await createAdRequest(token, { channelId, brief, startDate: from, endDate: to, items });
            if (!res.success) throw new Error(res.error);
            showRequestSent(res.data?.id);
        } catch (error: any) {
            Alert.alert('Could not send request', error.message || 'Please try again.');
            setSending(false);
        }
    };

    return (
        <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
            <StatusBar barStyle="light-content" backgroundColor="#050507" />
            <View style={styles.blobTop} />
            <View style={styles.blobBottom} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 110 }}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Ad Design</Text>
                </View>

                <View style={styles.questionCard}>
                    <Text style={styles.questionTitle}>Do you have a {designName} design?</Text>
                    <Text style={styles.questionText}>Tell us how you want your ad creative handled</Text>

                    <View style={{ flexDirection: 'row', gap: 16 }}>
                        <TouchableOpacity
                            onPress={() => setHasDesign(true)}
                            activeOpacity={0.8}
                            style={[styles.choice, hasDesign && styles.choiceOn]}
                        >
                            {hasDesign && <Ionicons name="checkmark" size={14} color="#fff" />}
                            <Text style={[styles.choiceText, hasDesign && styles.choiceTextOn]}>Yes, I have it</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setHasDesign(false)}
                            activeOpacity={0.8}
                            style={[styles.choice, !hasDesign && styles.choiceOn]}
                        >
                            {!hasDesign && <Ionicons name="checkmark" size={14} color="#fff" />}
                            <Text style={[styles.choiceText, !hasDesign && styles.choiceTextOn]}>No, suggest freelancer</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {hasDesign && (
                    <TouchableOpacity activeOpacity={0.8} onPress={pickDesign} style={styles.upload}>
                        <LinearGradient colors={['#F0389B', '#FF8A5C']} style={styles.uploadIcon}>
                            <Ionicons name={design ? 'checkmark' : 'cloud-upload'} size={18} color="#fff" />
                        </LinearGradient>
                        <Text style={styles.uploadTitle} numberOfLines={1}>
                            {design ? design.fileName || 'Design selected' : 'Drag & drop or tap to upload'}
                        </Text>
                        <Text style={styles.uploadHint}>{design ? 'Tap to replace' : 'PNG, JPG, MP4  •  Max 50MB'}</Text>
                    </TouchableOpacity>
                )}

                <Text style={styles.sectionTitle}>Or our Verified Freelancers</Text>

                {FREELANCERS.map((freelancer) => {
                    const isHired = hiredId === freelancer.id;
                    return (
                        <View key={freelancer.id} style={styles.freelancer}>
                            <View style={styles.avatarRing}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{freelancer.initial}</Text>
                                </View>
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.freelancerName}>{freelancer.name}</Text>
                                <Text style={styles.freelancerDetail}>{freelancer.detail}</Text>
                                <Text style={styles.freelancerPrice}>{freelancer.price}</Text>
                            </View>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => setHiredId(isHired ? null : freelancer.id)}
                                style={[styles.hireBtn, isHired && styles.hireBtnOn]}
                            >
                                <Text style={[styles.hireText, isHired && { color: '#fff' }]}>{isHired ? 'Hired' : 'Hire'}</Text>
                                <Ionicons name={isHired ? 'checkmark' : 'arrow-forward'} size={12} color={isHired ? '#fff' : '#8B6DFF'} />
                            </TouchableOpacity>
                        </View>
                    );
                })}
            </ScrollView>

            <View style={[styles.footer, { bottom: insets.bottom + 20 }]}>
                <TouchableOpacity onPress={handleSend} disabled={sending} activeOpacity={0.85} style={styles.sendBtn}>
                    <LinearGradient colors={['#1A8CFF', '#6633E5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.sendGradient}>
                        {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendText}>Send Request</Text>}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#050507',
        overflow: 'hidden',
    },
    blobTop: {
        position: 'absolute',
        top: -110,
        left: -90,
        width: 280,
        height: 280,
        borderRadius: 140,
        backgroundColor: '#15112E',
    },
    blobBottom: {
        position: 'absolute',
        bottom: 40,
        right: -110,
        width: 330,
        height: 330,
        borderRadius: 165,
        backgroundColor: '#0B2826',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginTop: 16,
        marginBottom: 26,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 22,
        fontFamily: 'Poppins_500Medium',
    },
    questionCard: {
        backgroundColor: '#14112B',
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#6C47FF',
        padding: 16,
    },
    questionTitle: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Poppins_600SemiBold',
    },
    questionText: {
        color: '#D2D2D2',
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
        marginTop: 4,
        marginBottom: 14,
    },
    choice: {
        flex: 1,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#252550',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    choiceOn: {
        backgroundColor: '#7352DD',
        borderColor: '#7352DD',
    },
    choiceText: {
        color: '#D6D6D6',
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
    },
    choiceTextOn: {
        color: '#fff',
        fontFamily: 'Poppins_600SemiBold',
    },
    upload: {
        height: 104,
        marginTop: 20,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#34345C',
        borderStyle: 'dashed',
        backgroundColor: '#0C0C1E',
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadIcon: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
    uploadTitle: {
        color: '#fff',
        fontSize: 13,
        fontFamily: 'Poppins_500Medium',
    },
    uploadHint: {
        color: '#6A6A9A',
        fontSize: 10,
        fontFamily: 'Poppins_400Regular',
        marginTop: 2,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Poppins_500Medium',
        marginTop: 34,
        marginBottom: 12,
    },
    freelancer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#12122A',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#23233F',
        padding: 12,
        marginBottom: 12,
    },
    avatarRing: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#123A40',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#1D6A68',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: 15,
        fontFamily: 'Poppins_600SemiBold',
    },
    freelancerName: {
        color: '#fff',
        fontSize: 14,
        fontFamily: 'Poppins_600SemiBold',
    },
    freelancerDetail: {
        color: '#6A6A9A',
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
    },
    freelancerPrice: {
        color: '#00E5C3',
        fontSize: 12,
        fontFamily: 'Poppins_600SemiBold',
    },
    hireBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 26,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: '#7352DD',
        paddingHorizontal: 12,
        gap: 4,
    },
    hireBtnOn: {
        backgroundColor: '#7352DD',
    },
    hireText: {
        color: '#8B6DFF',
        fontSize: 11,
        fontFamily: 'Poppins_600SemiBold',
    },
    footer: {
        position: 'absolute',
        left: 38,
        right: 38,
    },
    sendBtn: {
        borderRadius: 26,
        shadowColor: '#1A8CFF',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 9,
        elevation: 10,
    },
    sendGradient: {
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendText: {
        color: '#fff',
        fontSize: 15,
        fontFamily: 'Poppins_500Medium',
    },
});
