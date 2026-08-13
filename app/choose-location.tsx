import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    Image,
    SectionList,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette } from '../theme/colors';

// ── City image assets (same map used in BrandHome) ─────────────────────────
const CITY_IMAGES: Record<string, any> = {
    Hyderabad: require('../assets/Brands/Locations/Hyderabad.png'),
    Bangalore: require('../assets/Brands/Locations/Banglore.png'),
    Delhi: require('../assets/Brands/Locations/Delhi.png'),
    Gurugaon: require('../assets/Brands/Locations/Gurugaon.png'),
    Chennai: require('../assets/Brands/Locations/Chennai.png'),
    Kolkata: require('../assets/Brands/Locations/Kolkata.png'),
    Mumbai: require('../assets/Brands/Locations/Mumbai.png'),
    Pune: require('../assets/Brands/Locations/Pune.png'),
};

const imgLocation = require('../assets/location.png');

// ── Popular cities (same 8 as BrandHome) ────────────────────────────────────
const POPULAR_CITIES = ['Hyderabad', 'Bangalore', 'Delhi', 'Gurugaon', 'Chennai', 'Kolkata', 'Mumbai', 'Pune'];

// ── Full A-Z cities list ─────────────────────────────────────────────────────
const ALL_CITIES_RAW = [
    'Amaravati', 'Agra', 'Ahmedabad', 'Amritsar', 'Aurangabad',
    'Bangalore', 'Bhagalpur', 'Bhilai', 'Bhopal', 'Bilaspur',
    'Chandigarh', 'Chennai', 'Coimbatore',
    'Dehradun', 'Delhi', 'Dhanbad', 'Durgapur',
    'Faridabad', 'Gandhinagar', 'Goa', 'Gurugaon', 'Guwahati',
    'Howrah', 'Hubli', 'Hyderabad',
    'Indore', 'Jabalpur', 'Jaipur', 'Jalandhar', 'Jammu', 'Jodhpur',
    'Kanpur', 'Kochi', 'Kolkata',
    'Lucknow', 'Ludhiana',
    'Madurai', 'Mangalore', 'Mumbai', 'Mysore',
    'Nagpur', 'Nashik', 'Navi Mumbai', 'Noida',
    'Patna', 'Pimpri-Chinchwad', 'Pune',
    'Raipur', 'Rajkot', 'Ranchi',
    'Surat', 'Thane', 'Tiruchirappalli', 'Tirupati',
    'Vadodara', 'Varanasi', 'Vijayawada', 'Visakhapatnam',
];

/** Group a flat array of city names into letter sections */
function groupByLetter(cities: string[]) {
    const map: Record<string, string[]> = {};
    cities.forEach((city) => {
        const letter = city[0].toUpperCase();
        if (!map[letter]) map[letter] = [];
        map[letter].push(city);
    });
    return Object.keys(map)
        .sort()
        .map((letter) => ({ title: letter, data: map[letter] }));
}

export default function ChooseLocationScreen() {
    const router = useRouter();
    const { width: screenWidth } = useWindowDimensions();

    const [search, setSearch] = useState('');

    // Grid tile size — 4 columns with 10px gaps and 16px padding each side
    const TILE_GAP = 10;
    const TILE_COLS = 4;
    const TILE_WIDTH = (screenWidth - 32 - TILE_GAP * (TILE_COLS - 1)) / TILE_COLS;
    const TILE_HEIGHT = TILE_WIDTH * 1.05; // slightly taller than wide

    // Navigate to people-results filtered by the tapped city
    const handleCityPress = (city: string) => {
        router.push({
            pathname: '/people-results',
            params: { title: `Creators in ${city}`, role: 'CREATOR', location: city },
        } as any);
    };

    // Filter all cities by search query
    const filteredCities = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return ALL_CITIES_RAW;
        return ALL_CITIES_RAW.filter((c) => c.toLowerCase().includes(q));
    }, [search]);

    const sections = useMemo(() => groupByLetter(filteredCities), [filteredCities]);

    // Show popular cities only when there's no active search
    const showPopular = search.trim() === '';

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }} edges={['top']}>

            {/* ── Header ── */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingTop: 8,
                paddingBottom: 12,
                gap: 12,
            }}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <Text style={{
                    color: '#fff',
                    fontSize: 22,
                    fontFamily: 'Poppins_600SemiBold',
                    letterSpacing: -0.4,
                }}>
                    Choose location
                </Text>
            </View>

            {/* ── Search bar ── */}
            <View style={{
                marginHorizontal: 16,
                marginBottom: 20,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#1A1A2A',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#2A2A3E',
                paddingHorizontal: 14,
                paddingVertical: 11,
                gap: 10,
            }}>
                <Ionicons name="search" size={18} color="#666" />
                <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search by city"
                    placeholderTextColor="#555"
                    style={{
                        flex: 1,
                        color: '#fff',
                        fontFamily: 'Poppins_400Regular',
                        fontSize: 14,
                        padding: 0,
                    }}
                    returnKeyType="search"
                />
                {search.length > 0 ? (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <Ionicons name="close-circle" size={18} color="#555" />
                    </TouchableOpacity>
                ) : (
                    <Ionicons name="mic-outline" size={20} color="#666" />
                )}
            </View>

            <SectionList
                sections={sections}
                keyExtractor={(item) => item}
                showsVerticalScrollIndicator={false}
                stickySectionHeadersEnabled={false}
                contentContainerStyle={{ paddingBottom: 40 }}
                ListHeaderComponent={
                    showPopular ? (
                        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
                            {/* Popular Cities title */}
                            <Text style={{
                                color: '#fff',
                                fontSize: 20,
                                fontFamily: 'Poppins_600SemiBold',
                                marginBottom: 14,
                                letterSpacing: -0.3,
                            }}>
                                Popular Cities
                            </Text>

                            {/* 2-row × 4-column city grid */}
                            <View style={{ gap: TILE_GAP }}>
                                {/* Row 1 */}
                                <View style={{ flexDirection: 'row', gap: TILE_GAP }}>
                                    {POPULAR_CITIES.slice(0, 4).map((city) => (
                                        <TouchableOpacity
                                            key={city}
                                            activeOpacity={0.8}
                                            onPress={() => handleCityPress(city)}
                                            style={{
                                                width: TILE_WIDTH,
                                                height: TILE_HEIGHT,
                                                borderRadius: 14,
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <Image
                                                source={CITY_IMAGES[city] || imgLocation}
                                                style={{ width: '100%', height: '100%', position: 'absolute' }}
                                                resizeMode="cover"
                                            />
                                            {/* Dark gradient overlay at bottom */}
                                            {/* <View style={{
                                                position: 'absolute',
                                                bottom: 0,
                                                left: 0,
                                                right: 0,
                                                height: '55%',
                                                backgroundColor: 'rgba(0,0,0,0.45)',
                                                borderBottomLeftRadius: 14,
                                                borderBottomRightRadius: 14,
                                            }} /> */}
                                            <Text style={{
                                                position: 'absolute',
                                                top: 8,
                                                left: 6,
                                                right: 6,
                                                color: '#000',
                                                fontFamily: 'Poppins_600SemiBold',
                                                fontSize: 10,
                                                textAlign: 'center',
                                            }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                                                {city}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                {/* Row 2 */}
                                <View style={{ flexDirection: 'row', gap: TILE_GAP }}>
                                    {POPULAR_CITIES.slice(4, 8).map((city) => (
                                        <TouchableOpacity
                                            key={city}
                                            activeOpacity={0.8}
                                            onPress={() => handleCityPress(city)}
                                            style={{
                                                width: TILE_WIDTH,
                                                height: TILE_HEIGHT,
                                                borderRadius: 14,
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <Image
                                                source={CITY_IMAGES[city] || imgLocation}
                                                style={{ width: '100%', height: '100%', position: 'absolute' }}
                                                resizeMode="cover"
                                            />
                                            {/* <View style={{
                                                position: 'absolute',
                                                bottom: 0,
                                                left: 0,
                                                right: 0,
                                                height: '55%',
                                                backgroundColor: 'rgba(0,0,0,0.45)',
                                                borderBottomLeftRadius: 14,
                                                borderBottomRightRadius: 14,
                                            }} /> */}
                                            <Text style={{
                                                position: 'absolute',
                                                top: 8,
                                                left: 6,
                                                right: 6,
                                                color: '#000',
                                                fontFamily: 'Poppins_600SemiBold',
                                                fontSize: 10,
                                                textAlign: 'center',
                                            }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                                                {city}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>
                    ) : null
                }
                renderSectionHeader={({ section }) => (
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 16,
                        paddingTop: section.title === sections[0]?.title ? 0 : 8,
                        paddingBottom: 2,
                    }}>
                        {/* Show "All Cities" + "A - Z" only on the very first section header */}
                        {section.title === sections[0]?.title ? (
                            <>
                                <Text style={{
                                    color: '#fff',
                                    fontSize: 20,
                                    fontFamily: 'Poppins_600SemiBold',
                                    letterSpacing: -0.3,
                                }}>
                                    All Cities
                                </Text>
                                <Text style={{
                                    color: '#aaa',
                                    fontSize: 13,
                                    fontFamily: 'Poppins_500Medium',
                                }}>
                                    A - Z
                                </Text>
                            </>
                        ) : null}
                    </View>
                )}
                renderItem={({ item: city }) => (
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleCityPress(city)}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 16,
                            paddingVertical: 14,
                            borderBottomWidth: 1,
                            borderBottomColor: 'rgba(255,255,255,0.07)',
                            gap: 14,
                        }}
                    >
                        {/* Letter badge */}
                        <View style={{
                            width: 34,
                            height: 34,
                            borderRadius: 17,
                            backgroundColor: '#1E1E2E',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Text style={{
                                color: '#fff',
                                fontSize: 13,
                                fontFamily: 'Poppins_600SemiBold',
                            }}>
                                {city[0].toUpperCase()}
                            </Text>
                        </View>
                        {/* City name */}
                        <Text style={{
                            color: '#fff',
                            fontSize: 15,
                            fontFamily: 'Poppins_400Regular',
                            flex: 1,
                        }}>
                            {city}
                        </Text>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={{ alignItems: 'center', paddingTop: 40 }}>
                        <Ionicons name="location-outline" size={48} color="#444" />
                        <Text style={{
                            color: '#666',
                            fontFamily: 'Poppins_400Regular',
                            fontSize: 14,
                            marginTop: 12,
                        }}>
                            No cities found for "{search}"
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}
