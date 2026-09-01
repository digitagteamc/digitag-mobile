import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.88;

const LOCATION_OPTIONS = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Gurugaon'];
const LANGUAGE_OPTIONS = ['Hindi', 'English', 'Telugu', 'Tamil', 'Kannada', 'Malayalam', 'Bengali', 'Marathi'];

const AD_BANNER_STRIPES: Record<string, string[]> = {
    'ad-1': ['#C9A84C', '#3A7D44', '#F4F4F4', '#3A7D44', '#E05A1B', '#F4F4F4', '#3A7D44', '#7EC8E3'],
    'ad-2': ['#7EC8E3', '#F4F4F4', '#3A7D44', '#E05A1B', '#C9A84C', '#F4F4F4', '#3A7D44', '#7EC8E3'],
    'ad-3': ['#E05A1B', '#F4F4F4', '#7EC8E3', '#3A7D44', '#C9A84C', '#F4F4F4', '#E05A1B', '#3A7D44'],
    'ad-4': ['#3A7D44', '#7EC8E3', '#C9A84C', '#F4F4F4', '#E05A1B', '#3A7D44', '#F4F4F4', '#7EC8E3'],
};

const CREATORS_LIST = [
    {
        id: '1', name: 'Arjun Mehta', category: 'Tech', followers: '8.4M',
        slots: '3 slots', slotColor: '#00D084', price: '₹ 45K',
        initials: 'A', platforms: ['logo-youtube'],
        avatarColor: '#5B1F20', avatarText: '#FFC8C8', borderColor: '#4A2A8E'
    },
    {
        id: '2', name: 'Priya Rao', category: 'Lifestyle', followers: '3.1M',
        slots: '1 slot', slotColor: '#E91E63', price: '₹ 28K',
        initials: 'P', platforms: ['logo-instagram'],
        avatarColor: '#541A35', avatarText: '#FFC8E3', borderColor: '#1A1A2E'
    },
    {
        id: '3', name: 'CodeCraft', category: 'Tech', followers: '5.6M',
        slots: '2 slots', slotColor: '#00D084', price: '₹ 38K',
        initials: 'C', platforms: ['logo-youtube'],
        avatarColor: '#1A2A54', avatarText: '#C8E3FF', borderColor: '#1A1A2E'
    },
    {
        id: '4', name: 'PodVibes', category: 'Podcast', followers: '2.8M',
        slots: '5 slots', slotColor: '#00D084', price: '₹ 22K',
        initials: 'C', platforms: ['logo-youtube', 'logo-instagram', 'logo-facebook'],
        avatarColor: '#541A35', avatarText: '#FFC8E3', borderColor: '#1A1A2E'
    },
];

const SLOTS_DATA = [
    { id: '1', name: 'Podcast', price: 15000 },
    { id: '2', name: 'Interview', price: 18000 },
    { id: '3', name: 'Fashion', price: 12000 },
    { id: '4', name: 'Lifestyle', price: 28000 },
    { id: '5', name: 'Tech Review', price: 12000 },
];

export default function PreviewAdSheet({
    visible,
    adItem,
    onClose,
}: {
    visible: boolean;
    adItem: any | null;
    onClose: () => void;
}) {
    const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;

    // Step state
    const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
    const [hasDesign, setHasDesign] = useState(true);

    // Countdown timer for step 5
    const [countdown, setCountdown] = useState(23 * 3600 + 47 * 60 + 12);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (step === 5) {
            setCountdown(23 * 3600 + 47 * 60 + 12);
            timerRef.current = setInterval(() => {
                setCountdown(prev => (prev > 0 ? prev - 1 : 0));
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [step]);

    const formatCountdown = (secs: number) => {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        return `${String(h).padStart(2, '0')} : ${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}`;
    };

    // Form state
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [locationOpen, setLocationOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState('');
    const [languageOpen, setLanguageOpen] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState('');

    // Creator / Slot state
    const [selectedCreatorId, setSelectedCreatorId] = useState('1');
    const [selectedSlots, setSelectedSlots] = useState<string[]>(['4']);

    useEffect(() => {
        if (visible) {
            setStep(1);
            setFromDate('');
            setToDate('');
            setSelectedLocation('');
            setSelectedLanguage('');
            setLocationOpen(false);
            setLanguageOpen(false);
            setSelectedCreatorId('1');
            setSelectedSlots(['4']);
            setHasDesign(true);
            setCountdown(23 * 3600 + 47 * 60 + 12);
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                damping: 20,
                stiffness: 120,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: SHEET_HEIGHT,
                duration: 260,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    const stripes = adItem ? (AD_BANNER_STRIPES[adItem.id] || AD_BANNER_STRIPES['ad-1']) : AD_BANNER_STRIPES['ad-1'];
    const creator = CREATORS_LIST.find(c => c.id === selectedCreatorId);

    const toggleSlot = (id: string) => {
        if (selectedSlots.includes(id)) {
            setSelectedSlots(selectedSlots.filter(s => s !== id));
        } else {
            setSelectedSlots([...selectedSlots, id]);
        }
    };

    const totalSlotPrice = selectedSlots.reduce((sum, id) => {
        const slot = SLOTS_DATA.find(s => s.id === id);
        return sum + (slot ? slot.price : 0);
    }, 0);

    const formatPrice = (price: number) => `₹ ${price / 1000}K`;

    const DateField = ({ label, value, onChangeText }: { label: string; value: string; onChangeText: (v: string) => void }) => (
        <View style={{ flex: 1 }}>
            <Text style={{ color: '#aaa', fontSize: 12, fontFamily: 'Poppins_400Regular', marginBottom: 6 }}>{label}</Text>
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#1A1A2E',
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#2A2A3E',
                paddingHorizontal: 10,
                paddingVertical: Platform.OS === 'ios' ? 10 : 8,
                gap: 8,
            }}>
                <Ionicons name="calendar-outline" size={16} color="#666" />
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder="Choose date"
                    placeholderTextColor="#555"
                    style={{ flex: 1, color: '#fff', fontFamily: 'Poppins_400Regular', fontSize: 13 }}
                />
                {value !== '' && (
                    <TouchableOpacity onPress={() => onChangeText('')}>
                        <Ionicons name="close-circle" size={16} color="#555" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    const DropdownField = ({
        label, placeholder, open, onToggle, value, options, onSelect,
    }: {
        label: string; placeholder: string; open: boolean;
        onToggle: () => void; value: string;
        options: string[]; onSelect: (v: string) => void;
    }) => (
        <View style={{ marginTop: 16 }}>
            <Text style={{ color: '#aaa', fontSize: 12, fontFamily: 'Poppins_400Regular', marginBottom: 6 }}>{label}</Text>
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={onToggle}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#1A1A2E',
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: '#2A2A3E',
                    paddingHorizontal: 14,
                    paddingVertical: 13,
                }}
            >
                <Text style={{ color: value ? '#fff' : '#555', fontFamily: 'Poppins_400Regular', fontSize: 13 }}>
                    {value || placeholder}
                </Text>
                <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#666" />
            </TouchableOpacity>
            {open && (
                <View style={{
                    backgroundColor: '#1A1A2E',
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: '#2A2A3E',
                    marginTop: 4,
                    overflow: 'hidden',
                    maxHeight: 160,
                }}>
                    <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                        {options.map((opt) => (
                            <TouchableOpacity
                                key={opt}
                                onPress={() => { onSelect(opt); onToggle(); }}
                                style={{
                                    paddingHorizontal: 14,
                                    paddingVertical: 11,
                                    borderBottomWidth: 1,
                                    borderBottomColor: '#2A2A3E',
                                }}
                            >
                                <Text style={{ color: opt === value ? '#6C47FF' : '#fff', fontFamily: 'Poppins_400Regular', fontSize: 13 }}>
                                    {opt}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            {/* Backdrop */}
            <TouchableOpacity
                activeOpacity={1}
                onPress={onClose}
                style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' }}
            >
                {/* Sheet */}
                <Animated.View
                    style={[
                        {
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: SHEET_HEIGHT,
                            backgroundColor: '#111118',
                            borderTopLeftRadius: 24,
                            borderTopRightRadius: 24,
                            overflow: 'hidden',
                        },
                        { transform: [{ translateY: slideAnim }] },
                    ]}
                >
                    <TouchableOpacity activeOpacity={1} style={{ flex: 1 }}>
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 32 }}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* ── Header ── */}
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingHorizontal: 20,
                                paddingTop: 22,
                                paddingBottom: 14,
                            }}>
                                {step > 1 && step < 5 && (
                                    <TouchableOpacity onPress={() => setStep(step - 1 as 1 | 2 | 3 | 4)} style={{ marginRight: 16 }}>
                                        <Ionicons name="arrow-back" size={24} color="#fff" />
                                    </TouchableOpacity>
                                )}
                                <Text style={{
                                    color: '#fff',
                                    fontSize: 20,
                                    fontFamily: 'Poppins_600SemiBold',
                                    letterSpacing: -0.3,
                                    flex: 1,
                                }}>
                                    {step === 1 ? 'Preview Add' : step === 2 ? 'Select Creator' : step === 3 ? 'Book Slots' : step === 4 ? 'Ad Design' : 'Request Sent'}
                                </Text>
                                <TouchableOpacity
                                    onPress={onClose}
                                    style={{
                                        width: 34,
                                        height: 34,
                                        borderRadius: 17,
                                        backgroundColor: '#2A2A3E',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Ionicons name="close" size={18} color="#fff" />
                                </TouchableOpacity>
                            </View>

                            {/* ── Step 1: Form ── */}
                            {step === 1 && (
                                <>
                                    <View style={{
                                        marginHorizontal: 20,
                                        height: 160,
                                        borderRadius: 14,
                                        overflow: 'hidden',
                                        flexDirection: 'row',
                                    }}>
                                        {stripes.map((color, i) => (
                                            <View key={i} style={{ flex: 1, backgroundColor: color }} />
                                        ))}
                                    </View>
                                    <View style={{ paddingHorizontal: 20, marginTop: 22 }}>
                                        <Text style={{
                                            color: '#fff',
                                            fontSize: 17,
                                            fontFamily: 'Poppins_600SemiBold',
                                            marginBottom: 14,
                                        }}>
                                            Select Your Ad Duration
                                        </Text>
                                        <View style={{ flexDirection: 'row', gap: 10 }}>
                                            <DateField label="From" value={fromDate} onChangeText={setFromDate} />
                                            <DateField label="To" value={toDate} onChangeText={setToDate} />
                                        </View>
                                        <DropdownField
                                            label="Location"
                                            placeholder="Select Location"
                                            open={locationOpen}
                                            onToggle={() => { setLocationOpen(!locationOpen); setLanguageOpen(false); }}
                                            value={selectedLocation}
                                            options={LOCATION_OPTIONS}
                                            onSelect={setSelectedLocation}
                                        />
                                        <DropdownField
                                            label="Select Language"
                                            placeholder="Select a language"
                                            open={languageOpen}
                                            onToggle={() => { setLanguageOpen(!languageOpen); setLocationOpen(false); }}
                                            value={selectedLanguage}
                                            options={LANGUAGE_OPTIONS}
                                            onSelect={setSelectedLanguage}
                                        />
                                    </View>
                                </>
                            )}

                            {/* ── Step 2: Select Creator ── */}
                            {step === 2 && (
                                <>
                                    <View style={{ backgroundColor: '#111118', borderRadius: 14, padding: 16, marginHorizontal: 20, marginTop: 10, borderWidth: 1, borderColor: '#4A2A8E' }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                            <Text style={{ color: '#6A6A8B', fontSize: 13, fontFamily: 'Poppins_400Regular' }}>Campaign Duration</Text>
                                            <View style={{ backgroundColor: '#352166', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
                                                <Text style={{ color: '#fff', fontSize: 11, fontFamily: 'Poppins_500Medium' }}>6 Days</Text>
                                            </View>
                                        </View>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'Poppins_600SemiBold' }}>16 Apr 2026</Text>
                                            <Ionicons name="arrow-forward" size={16} color="#6C47FF" />
                                            <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'Poppins_600SemiBold' }}>21 Apr 2026</Text>
                                            <TouchableOpacity style={{ backgroundColor: '#352166', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
                                                <Ionicons name="calendar-outline" size={18} color="#fff" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <View style={{ backgroundColor: '#112211', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, marginHorizontal: 20, marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#2D452B' }}>
                                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#34C759' }} />
                                        <Text style={{ color: '#E8F5E9', fontSize: 13, fontFamily: 'Poppins_500Medium' }}>5 creators available for your dates</Text>
                                    </View>

                                    <View style={{ paddingHorizontal: 20, marginTop: 16, gap: 12 }}>
                                        {CREATORS_LIST.map((c) => {
                                            const isSelected = c.id === selectedCreatorId;
                                            return (
                                                <View key={c.id} style={{ backgroundColor: '#15151E', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: c.borderColor, flexDirection: 'row', alignItems: 'flex-start' }}>
                                                    <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c.avatarColor, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                                                        <Text style={{ color: c.avatarText, fontSize: 18, fontFamily: 'Poppins_600SemiBold' }}>{c.initials}</Text>
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                                                            <View>
                                                                <Text style={{ color: '#fff', fontSize: 15, fontFamily: 'Poppins_600SemiBold' }}>{c.name}</Text>
                                                                <Text style={{ color: '#aaa', fontSize: 12, fontFamily: 'Poppins_400Regular' }}>{c.category} • {c.followers}</Text>
                                                            </View>
                                                            <View style={{ flexDirection: 'row', gap: 6 }}>
                                                                {c.platforms.map((platform, idx) => (
                                                                    <Ionicons key={idx} name={platform as any} size={16} color={'#fff'} />
                                                                ))}
                                                            </View>
                                                        </View>
                                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                                                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                                                <View style={{ backgroundColor: 'transparent', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: c.slotColor }}>
                                                                    <Text style={{ color: c.slotColor, fontSize: 11, fontFamily: 'Poppins_500Medium' }}>{c.slots}</Text>
                                                                </View>
                                                                <View style={{ backgroundColor: '#2A2A3E', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
                                                                    <Text style={{ color: '#fff', fontSize: 11, fontFamily: 'Poppins_500Medium' }}>{c.price}</Text>
                                                                </View>
                                                            </View>
                                                            {isSelected ? (
                                                                <TouchableOpacity style={{ backgroundColor: '#6C47FF', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                                    <Ionicons name="checkmark" size={14} color="#fff" />
                                                                    <Text style={{ color: '#fff', fontSize: 12, fontFamily: 'Poppins_600SemiBold' }}>Selected</Text>
                                                                </TouchableOpacity>
                                                            ) : (
                                                                <TouchableOpacity onPress={() => setSelectedCreatorId(c.id)} style={{ backgroundColor: '#1A1A2E', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 6 }}>
                                                                    <Text style={{ color: '#fff', fontSize: 12, fontFamily: 'Poppins_500Medium' }}>Select</Text>
                                                                </TouchableOpacity>
                                                            )}
                                                        </View>
                                                    </View>
                                                </View>
                                            );
                                        })}
                                    </View>
                                </>
                            )}

                            {/* ── Step 3: Select Slots ── */}
                            {step === 3 && creator && (
                                <View style={{ paddingHorizontal: 20 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                                        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: creator.avatarColor || '#541A35', alignItems: 'center', justifyContent: 'center' }}>
                                            <Text style={{ color: creator.avatarText || '#fff', fontSize: 18, fontFamily: 'Poppins_600SemiBold' }}>
                                                {creator.initials}
                                            </Text>
                                        </View>
                                        <View style={{ marginLeft: 14 }}>
                                            <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'Poppins_500Medium' }}>{creator.name}</Text>
                                            <Text style={{ color: '#aaa', fontSize: 13, fontFamily: 'Poppins_400Regular' }}>{creator.category} • {creator.followers}</Text>
                                        </View>
                                    </View>

                                    <Text style={{ color: '#ececec', fontSize: 14, fontFamily: 'Poppins_400Regular', marginTop: 24, marginBottom: 16 }}>
                                        Select the content slots you'd like to book
                                    </Text>

                                    <View style={{
                                        flexDirection: 'row',
                                        flexWrap: 'wrap',
                                        justifyContent: 'space-between',
                                    }}>
                                        {SLOTS_DATA.map((slot) => {
                                            const isSelected = selectedSlots.includes(slot.id);
                                            return (
                                                <TouchableOpacity
                                                    key={slot.id}
                                                    activeOpacity={0.8}
                                                    onPress={() => toggleSlot(slot.id)}
                                                    style={{
                                                        width: '48%',
                                                        height: 78,
                                                        marginBottom: 10,
                                                        borderRadius: 20,
                                                        padding: 14,
                                                        backgroundColor: isSelected ? '#140F2E' : 'rgba(255,255,255,0.05)',
                                                        borderWidth: 1.5,
                                                        borderColor: isSelected ? '#6C47FF' : 'rgba(64,64,64,0.5)',
                                                        justifyContent: 'space-between',
                                                    }}
                                                >
                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                                        <Text style={{ color: '#fff', fontSize: 15, fontFamily: 'Poppins_500Medium' }}>
                                                            {slot.name}
                                                        </Text>
                                                        {isSelected && (
                                                            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#6C47FF', alignItems: 'center', justifyContent: 'center' }}>
                                                                <Ionicons name="checkmark" size={14} color="#fff" />
                                                            </View>
                                                        )}
                                                    </View>
                                                    <Text style={{ color: isSelected ? '#fff' : '#c2c1c4', fontSize: 14, fontFamily: 'Poppins_500Medium' }}>
                                                        {formatPrice(slot.price)}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            )}

                            {/* ── Step 4: Ad Design ── */}
                            {step === 4 && (
                                <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
                                    <View style={{
                                        backgroundColor: '#12122A',
                                        borderRadius: 22,
                                        padding: 16,
                                        borderWidth: 1.5,
                                        borderColor: '#6C47FF',
                                    }}>
                                        <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'Poppins_600SemiBold' }}>
                                            Do you have a Strip design?
                                        </Text>
                                        <Text style={{ color: '#D2D2D2', fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 4, marginBottom: 16 }}>
                                            Tell us how you want your ad creative handled
                                        </Text>
                                        
                                        <View style={{ flexDirection: 'row', gap: 12 }}>
                                            <TouchableOpacity 
                                                onPress={() => setHasDesign(true)}
                                                activeOpacity={0.8}
                                                style={{
                                                    flex: 1,
                                                    height: 42,
                                                    borderRadius: 21,
                                                    backgroundColor: hasDesign ? '#7352DD' : '#12122A',
                                                    borderWidth: hasDesign ? 0 : 1,
                                                    borderColor: '#252550',
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: 6
                                                }}
                                            >
                                                <Text style={{ color: hasDesign ? '#fff' : '#D6D6D6', fontSize: 12, fontFamily: 'Poppins_600SemiBold' }}>
                                                    Yes, I have it
                                                </Text>
                                                {hasDesign && <Ionicons name="checkmark" size={14} color="#fff" />}
                                            </TouchableOpacity>

                                            <TouchableOpacity 
                                                onPress={() => setHasDesign(false)}
                                                activeOpacity={0.8}
                                                style={{
                                                    flex: 1,
                                                    height: 42,
                                                    borderRadius: 21,
                                                    backgroundColor: !hasDesign ? '#7352DD' : '#12122A',
                                                    borderWidth: !hasDesign ? 0 : 1,
                                                    borderColor: '#252550',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Text style={{ color: !hasDesign ? '#fff' : '#D6D6D6', fontSize: 12, fontFamily: 'Poppins_400Regular' }}>
                                                    No, suggest freelancer
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {hasDesign && (
                                        <TouchableOpacity 
                                            activeOpacity={0.8}
                                            style={{
                                                backgroundColor: '#0C0C1E',
                                                borderRadius: 20,
                                                marginTop: 20,
                                                height: 110,
                                                borderWidth: 1,
                                                borderColor: '#252550',
                                                borderStyle: 'dashed',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Ionicons name="cloud-upload-outline" size={32} color="#6C47FF" style={{ marginBottom: 8 }} />
                                            <Text style={{ color: '#fff', fontSize: 14, fontFamily: 'Poppins_500Medium' }}>
                                                Drag & drop or tap to upload
                                            </Text>
                                            <Text style={{ color: '#6A6A9A', fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 4 }}>
                                                PNG, JPG, MP4  •  Max 50MB
                                            </Text>
                                        </TouchableOpacity>
                                    )}

                                    <Text style={{
                                        color: '#fff',
                                        fontSize: 16,
                                        fontFamily: 'Poppins_500Medium',
                                        marginTop: 32,
                                        marginBottom: 16,
                                    }}>
                                        Or our Verified Freelancers
                                    </Text>

                                    <View style={{
                                        backgroundColor: '#12122A',
                                        borderRadius: 18,
                                        padding: 14,
                                        borderWidth: 1,
                                        borderColor: '#1A1A36',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        marginBottom: 12,
                                    }}>
                                        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#2A2A3E', alignItems: 'center', justifyContent: 'center' }}>
                                            <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'Poppins_700Bold' }}>D</Text>
                                        </View>
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={{ color: '#fff', fontSize: 14, fontFamily: 'Poppins_600SemiBold' }}>DesignStudio Pro</Text>
                                            <Text style={{ color: '#6A6A9A', fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 }}>Brand Identity • 4.9★</Text>
                                            <Text style={{ color: '#00E5C3', fontSize: 12, fontFamily: 'Poppins_600SemiBold', marginTop: 2 }}>₹8,000</Text>
                                        </View>
                                        <TouchableOpacity style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            height: 28,
                                            borderRadius: 14,
                                            borderWidth: 1,
                                            borderColor: '#7352DD',
                                            paddingHorizontal: 12,
                                            gap: 4
                                        }}>
                                            <Text style={{ color: '#7352DD', fontSize: 11, fontFamily: 'Poppins_600SemiBold' }}>Hire</Text>
                                            <Ionicons name="arrow-forward" size={12} color="#7352DD" />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={{
                                        backgroundColor: '#12122A',
                                        borderRadius: 18,
                                        padding: 14,
                                        borderWidth: 1,
                                        borderColor: '#1A1A36',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                    }}>
                                        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#2A2A3E', alignItems: 'center', justifyContent: 'center' }}>
                                            <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'Poppins_700Bold' }}>M</Text>
                                        </View>
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={{ color: '#fff', fontSize: 14, fontFamily: 'Poppins_600SemiBold' }}>MotionCraft</Text>
                                            <Text style={{ color: '#6A6A9A', fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 }}>Video Ads • 4.7★</Text>
                                            <Text style={{ color: '#00E5C3', fontSize: 12, fontFamily: 'Poppins_600SemiBold', marginTop: 2 }}>₹6,500</Text>
                                        </View>
                                        <TouchableOpacity style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            height: 28,
                                            borderRadius: 14,
                                            borderWidth: 1,
                                            borderColor: '#7352DD',
                                            paddingHorizontal: 12,
                                            gap: 4
                                        }}>
                                            <Text style={{ color: '#7352DD', fontSize: 11, fontFamily: 'Poppins_600SemiBold' }}>Hire</Text>
                                            <Ionicons name="arrow-forward" size={12} color="#7352DD" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                            {/* ── Step 5: Request Sent ── */}
                            {step === 5 && (
                                <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
                                    {/* Status Card */}
                                    <View style={{
                                        backgroundColor: '#12122A',
                                        borderRadius: 28,
                                        borderWidth: 2,
                                        borderColor: '#6C47FF',
                                        overflow: 'hidden',
                                        paddingBottom: 28,
                                    }}>
                                        {/* Purple tint overlay */}
                                        <View style={{
                                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                            backgroundColor: '#6C47FF',
                                            opacity: 0.07,
                                            borderRadius: 28,
                                        }} />

                                        {/* Concentric circles + hourglass */}
                                        <View style={{ alignItems: 'center', marginTop: 28 }}>
                                            <View style={{
                                                width: 100, height: 100, borderRadius: 50,
                                                backgroundColor: 'rgba(108,71,255,0.18)',
                                                alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <View style={{
                                                    width: 80, height: 80, borderRadius: 40,
                                                    backgroundColor: 'rgba(108,71,255,0.22)',
                                                    alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    <View style={{
                                                        width: 60, height: 60, borderRadius: 30,
                                                        backgroundColor: 'rgba(108,71,255,0.28)',
                                                        alignItems: 'center', justifyContent: 'center',
                                                    }}>
                                                        <Text style={{ fontSize: 30 }}>⏳</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>

                                        {/* Awaiting Creator */}
                                        <Text style={{
                                            color: '#fff', fontSize: 18,
                                            fontFamily: 'Poppins_500Medium',
                                            textAlign: 'center', marginTop: 16,
                                        }}>
                                            Awaiting Creator
                                        </Text>
                                        <Text style={{
                                            color: '#D2D2D2', fontSize: 14,
                                            fontFamily: 'Poppins_400Regular',
                                            textAlign: 'center', marginTop: 6,
                                            paddingHorizontal: 24,
                                            lineHeight: 20,
                                        }}>
                                            {CREATORS_LIST.find(c => c.id === selectedCreatorId)?.name ?? 'Creator'} has been notified.{'\n'}They must respond within the time limit.
                                        </Text>

                                        {/* Countdown */}
                                        <View style={{
                                            alignSelf: 'center',
                                            marginTop: 20,
                                            backgroundColor: 'rgba(255,181,71,0.12)',
                                            borderWidth: 1.5,
                                            borderColor: '#FFB547',
                                            borderRadius: 28,
                                            paddingHorizontal: 32,
                                            paddingVertical: 14,
                                        }}>
                                            <Text style={{
                                                color: '#FFB547',
                                                fontSize: 22,
                                                fontFamily: 'Poppins_600SemiBold',
                                                letterSpacing: 2,
                                            }}>
                                                {formatCountdown(countdown)}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Journey Progress */}
                                    <Text style={{
                                        color: '#fff', fontSize: 16,
                                        fontFamily: 'Poppins_500Medium',
                                        marginTop: 28, marginBottom: 16,
                                    }}>
                                        Journey Progress
                                    </Text>

                                    {/* Timeline */}
                                    <View style={{ paddingLeft: 4 }}>
                                        {/* Step 1: Ad Type Selected */}
                                        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                                            <View style={{ alignItems: 'center', width: 28 }}>
                                                <View style={{
                                                    width: 28, height: 28, borderRadius: 14,
                                                    backgroundColor: '#00E5C3',
                                                    alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    <Ionicons name="checkmark" size={14} color="#070711" />
                                                </View>
                                                <View style={{ width: 2, height: 44, backgroundColor: '#6C47FF' }} />
                                            </View>
                                            <View style={{ marginLeft: 16, paddingTop: 2 }}>
                                                <Text style={{ color: '#C8C8E8', fontSize: 12, fontFamily: 'Poppins_400Regular' }}>Ad Type Selected</Text>
                                                <View style={{
                                                    marginTop: 6, alignSelf: 'flex-start',
                                                    backgroundColor: 'rgba(0,229,195,0.2)',
                                                    borderWidth: 1, borderColor: '#00E5C3',
                                                    borderRadius: 11, paddingHorizontal: 10, paddingVertical: 2,
                                                }}>
                                                    <Text style={{ color: '#00E5C3', fontSize: 12, fontFamily: 'Poppins_500Medium' }}>Strip Ad</Text>
                                                </View>
                                            </View>
                                        </View>

                                        {/* Step 2: Creator Chosen */}
                                        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                                            <View style={{ alignItems: 'center', width: 28 }}>
                                                <View style={{
                                                    width: 28, height: 28, borderRadius: 14,
                                                    backgroundColor: '#00E5C3',
                                                    alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    <Ionicons name="checkmark" size={14} color="#070711" />
                                                </View>
                                                <View style={{ width: 2, height: 52, backgroundColor: '#6C47FF' }} />
                                            </View>
                                            <View style={{ marginLeft: 16, paddingTop: 2 }}>
                                                <Text style={{ color: '#C8C8E8', fontSize: 12, fontFamily: 'Poppins_400Regular' }}>Creator Chosen</Text>
                                                <View style={{
                                                    marginTop: 6, alignSelf: 'flex-start',
                                                    backgroundColor: 'rgba(0,229,195,0.2)',
                                                    borderWidth: 1, borderColor: '#00E5C3',
                                                    borderRadius: 11, paddingHorizontal: 10, paddingVertical: 2,
                                                }}>
                                                    <Text style={{ color: '#00E5C3', fontSize: 12, fontFamily: 'Poppins_500Medium' }}>
                                                        {CREATORS_LIST.find(c => c.id === selectedCreatorId)?.name ?? 'Creator'}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>

                                        {/* Step 3: Awaiting Acceptance */}
                                        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                                            <View style={{ alignItems: 'center', width: 28 }}>
                                                <View style={{
                                                    width: 28, height: 28, borderRadius: 14,
                                                    backgroundColor: '#FFB547',
                                                    alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#070711' }} />
                                                </View>
                                                <View style={{ width: 2, height: 48, backgroundColor: '#1A1A36' }} />
                                            </View>
                                            <View style={{ marginLeft: 16, paddingTop: 2 }}>
                                                <Text style={{ color: '#fff', fontSize: 12, fontFamily: 'Poppins_400Regular' }}>Awaiting Acceptance</Text>
                                                <View style={{
                                                    marginTop: 6, alignSelf: 'flex-start',
                                                    backgroundColor: 'rgba(255,181,71,0.2)',
                                                    borderWidth: 1, borderColor: '#FFB547',
                                                    borderRadius: 11, paddingHorizontal: 10, paddingVertical: 2,
                                                }}>
                                                    <Text style={{ color: '#FFB547', fontSize: 12, fontFamily: 'Poppins_500Medium' }}>In Progress</Text>
                                                </View>
                                            </View>
                                        </View>

                                        {/* Step 4: Payment */}
                                        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                                            <View style={{ alignItems: 'center', width: 28 }}>
                                                <View style={{
                                                    width: 28, height: 28, borderRadius: 14,
                                                    borderWidth: 2, borderColor: '#3D3D61',
                                                    backgroundColor: '#0C0C24',
                                                    alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    <View style={{ width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: '#6A6A9A' }} />
                                                </View>
                                            </View>
                                            <View style={{ marginLeft: 16, paddingTop: 2 }}>
                                                <Text style={{ color: '#6A6A9A', fontSize: 12, fontFamily: 'Poppins_400Regular' }}>Payment</Text>
                                                <View style={{
                                                    marginTop: 6, alignSelf: 'flex-start',
                                                    backgroundColor: 'rgba(12,12,36,0.3)',
                                                    borderWidth: 1, borderColor: '#555576',
                                                    borderRadius: 11, paddingHorizontal: 10, paddingVertical: 2,
                                                }}>
                                                    <Text style={{ color: '#7352DD', fontSize: 12, fontFamily: 'Poppins_500Medium' }}>Pending</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Cancel Request Button */}
                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        onPress={onClose}
                                        style={{
                                            backgroundColor: '#12122A',
                                            borderWidth: 1,
                                            borderColor: '#3D3D61',
                                            borderRadius: 24,
                                            paddingVertical: 16,
                                            alignItems: 'center',
                                            marginTop: 32,
                                            marginBottom: 16,
                                        }}
                                    >
                                        <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'Poppins_500Medium' }}>
                                            Cancel Request
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </ScrollView>

                        {/* ── Footer ── */}
                        <View style={{
                            paddingHorizontal: 20,
                            paddingBottom: Platform.OS === 'ios' ? 28 : 20,
                            paddingTop: 10,
                            backgroundColor: '#111118',
                            borderTopWidth: step >= 3 ? 1 : 0,
                            borderTopColor: 'rgba(212,212,212,0.2)'
                        }}>
                            {step < 3 ? (
                                <View style={{
                                    shadowColor: '#2794ff',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.6,
                                    shadowRadius: 14,
                                    elevation: 15,
                                }}>
                                    <LinearGradient
                                        colors={['#2794ff', '#6C47FF']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={{ borderRadius: 99, overflow: 'hidden' }}
                                    >
                                        <TouchableOpacity
                                            activeOpacity={0.85}
                                            style={{
                                                paddingVertical: 16,
                                                alignItems: 'center',
                                            }}
                                            onPress={() => {
                                                if (step === 1) setStep(2);
                                                else if (step === 2) setStep(3);
                                            }}
                                        >
                                            <Text style={{
                                                color: '#fff',
                                                fontSize: 15,
                                                fontFamily: 'Poppins_600SemiBold',
                                            }}>
                                                Continue
                                            </Text>
                                        </TouchableOpacity>
                                    </LinearGradient>
                                </View>
                            ) : step === 3 ? (
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 }}>
                                    <View>
                                        <Text style={{ color: '#d2d2d2', fontSize: 12, fontFamily: 'Poppins_400Regular' }}>
                                            {selectedSlots.length} slots selected
                                        </Text>
                                        <Text style={{ color: '#fff', fontSize: 22, fontFamily: 'Poppins_700Bold', marginTop: 2 }}>
                                            {formatPrice(totalSlotPrice)}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        onPress={() => setStep(4)}
                                        style={{
                                            backgroundColor: '#6C47FF',
                                            borderRadius: 99,
                                            paddingHorizontal: 24,
                                            paddingVertical: 14,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            minWidth: 120,
                                        }}
                                    >
                                        <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'Poppins_500Medium', marginRight: 6 }}>
                                            Continue
                                        </Text>
                                        <Ionicons name="arrow-forward" size={18} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            ) : step === 4 ? (
                                <View style={{
                                    shadowColor: '#2794ff',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.6,
                                    shadowRadius: 14,
                                    elevation: 15,
                                }}>
                                    <LinearGradient
                                        colors={['#1A8CFF', '#6633E5']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={{ borderRadius: 99, overflow: 'hidden' }}
                                    >
                                        <TouchableOpacity
                                            activeOpacity={0.85}
                                            style={{
                                                paddingVertical: 16,
                                                alignItems: 'center',
                                            }}
                                            onPress={() => setStep(5)}
                                        >
                                            <Text style={{
                                                color: '#fff',
                                                fontSize: 15,
                                                fontFamily: 'Poppins_600SemiBold',
                                            }}>
                                                Complete Booking
                                            </Text>
                                        </TouchableOpacity>
                                    </LinearGradient>
                                </View>
                            ) : null}
                        </View>
                    </TouchableOpacity>
                </Animated.View>
            </TouchableOpacity>
        </Modal>
    );
}
