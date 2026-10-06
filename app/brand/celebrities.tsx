import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Linking, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, BG, EmptyState, ErrorState, Loading, ScreenHeader, inputStyle } from '../../Components/brand/ui';
import { useAuth } from '../../context/AuthContext';
import { Celebrity, formatCount, listCelebrities } from '../../services/brandService';
import { fonts, palette } from '../../theme/colors';

/** "See all" for the Celebrities section on Brand Home. */
export default function CelebritiesScreen() {
    const { token } = useAuth();
    const [search, setSearch] = useState('');
    const [items, setItems] = useState<Celebrity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!token) return;
        const res = await listCelebrities(token, { search: search.trim() || undefined });
        if (res.success) { setItems(res.data.items); setError(null); } else setError(res.error);
        setLoading(false);
    }, [token, search]);

    useEffect(() => {
        const t = setTimeout(load, search ? 300 : 0);
        return () => clearTimeout(t);
    }, [load, search]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={['top', 'bottom']}>
            <ScreenHeader title="Celebrities" />
            <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', ...inputStyle, paddingVertical: 0 }}>
                    <Ionicons name="search" size={18} color={palette.textMuted} />
                    <TextInput value={search} onChangeText={setSearch} placeholder="Search celebrities" placeholderTextColor="#666"
                        style={{ flex: 1, color: '#fff', paddingVertical: 12, marginLeft: 8, fontFamily: fonts.regular }} />
                </View>
            </View>
            {loading ? <Loading /> : error && !items.length ? <ErrorState message={error} onRetry={load} /> : (
                <FlatList
                    data={items}
                    numColumns={2}
                    keyExtractor={(c) => c.id}
                    columnWrapperStyle={{ justifyContent: 'space-between' }}
                    contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                    ListEmptyComponent={<EmptyState icon="star-outline" title="No celebrities listed yet" />}
                    renderItem={({ item: c }) => (
                        <TouchableOpacity
                            activeOpacity={0.85}
                            disabled={!c.profileUrl}
                            onPress={() => c.profileUrl && Linking.openURL(c.profileUrl).catch(() => { })}
                            style={{ width: '48.5%', marginBottom: 14, padding: 14, borderRadius: 16, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
                        >
                            <Avatar uri={c.photoUrl} name={c.name} size={84} />
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                                <Text numberOfLines={1} style={{ color: '#fff', fontSize: 14, fontFamily: fonts.semibold, maxWidth: 120 }}>{c.name}</Text>
                                {c.isVerified && <Ionicons name="checkmark-circle" size={14} color="#60A5FA" style={{ marginLeft: 3 }} />}
                            </View>
                            {!!c.role && <Text style={{ color: palette.textMuted, fontSize: 12, fontFamily: fonts.regular }}>{c.role}</Text>}
                            <Text style={{ color: '#fff', fontSize: 12, fontFamily: fonts.semibold, marginTop: 4 }}>{formatCount(c.followerCount)} followers</Text>
                        </TouchableOpacity>
                    )}
                />
            )}
        </SafeAreaView>
    );
}
