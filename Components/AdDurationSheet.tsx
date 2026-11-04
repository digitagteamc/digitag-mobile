import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LOCATION_OPTIONS = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Gurugaon'];
const LANGUAGE_OPTIONS = ['Hindi', 'English', 'Telugu', 'Tamil', 'Kannada', 'Malayalam', 'Bengali', 'Marathi'];

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export type AdDuration = {
    from: Date;
    to: Date;
    location: string;
    language: string;
};

function formatShortDate(d: Date) {
    return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

function startOfToday() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// 6 full weeks (42 cells) so the sheet height never changes month to month.
function getCalendarDays(monthDate: Date) {
    const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    return Array.from({ length: 42 }, (_, i) => {
        const date = new Date(first.getFullYear(), first.getMonth(), i + 1 - first.getDay());
        return { date, inMonth: date.getMonth() === first.getMonth() };
    });
}

function Dropdown({
    label, placeholder, value, options, open, onToggle, onSelect,
}: {
    label: string;
    placeholder: string;
    value: string;
    options: string[];
    open: boolean;
    onToggle: () => void;
    onSelect: (value: string) => void;
}) {
    return (
        <View style={{ marginTop: 14 }}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity activeOpacity={0.8} onPress={onToggle} style={styles.dropdown}>
                <Text style={styles.dropdownText}>{value || placeholder}</Text>
                <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color="#E2E2E2" />
            </TouchableOpacity>
            {open && (
                <View style={styles.options}>
                    <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                        {options.map((option) => (
                            <TouchableOpacity
                                key={option}
                                style={styles.option}
                                onPress={() => { onSelect(option); onToggle(); }}
                            >
                                <Text style={[styles.dropdownText, option === value && { color: '#8B6DFF' }]}>{option}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );
}

export default function AdDurationSheet({
    visible, onClose, onContinue,
}: {
    visible: boolean;
    onClose: () => void;
    onContinue: (duration: AdDuration) => void;
}) {
    const insets = useSafeAreaInsets();
    const slide = useRef(new Animated.Value(0)).current;

    const [from, setFrom] = useState<Date | null>(null);
    const [to, setTo] = useState<Date | null>(null);
    const [month, setMonth] = useState(startOfToday());
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<'location' | 'language' | null>(null);
    const [location, setLocation] = useState('');
    const [language, setLanguage] = useState('');

    useEffect(() => {
        if (!visible) return;
        slide.setValue(0);
        Animated.timing(slide, { toValue: 1, duration: 260, useNativeDriver: true }).start();
    }, [visible, slide]);

    const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [Dimensions.get('window').height, 0] });

    // First tap sets From, second sets To, swapping if it lands before From.
    const pickDay = (date: Date) => {
        if (!from || to) {
            setFrom(date);
            setTo(null);
            return;
        }
        if (date < from) {
            setTo(from);
            setFrom(date);
        } else {
            setTo(date);
        }
        setCalendarOpen(false);
    };

    const toggleDropdown = (name: 'location' | 'language') => {
        setCalendarOpen(false);
        setOpenDropdown((open) => (open === name ? null : name));
    };

    const toggleCalendar = () => {
        setOpenDropdown(null);
        setCalendarOpen((open) => !open);
    };

    const handleContinue = () => {
        if (!from || !to || !location || !language) {
            Alert.alert('Almost there', 'Choose your dates, location and language to continue.');
            return;
        }
        onContinue({ from, to, location, language });
    };

    const dateField = (label: string, value: Date | null, onClear: () => void) => (
        <View style={{ flex: 1 }}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity activeOpacity={0.8} onPress={toggleCalendar} style={[styles.dateField, calendarOpen && styles.fieldActive]}>
                <Ionicons name="calendar" size={15} color="#9A9A9E" />
                <Text numberOfLines={1} style={[styles.dateText, value && { color: '#fff' }]}>
                    {value ? formatShortDate(value) : 'Choose date'}
                </Text>
                <TouchableOpacity onPress={onClear} hitSlop={8}>
                    <Ionicons name="close-circle" size={16} color="#B5B5B8" />
                </TouchableOpacity>
            </TouchableOpacity>
        </View>
    );

    const today = startOfToday();

    return (
        <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 22, paddingBottom: insets.bottom + 24 }}
                    >
                        <View style={styles.titleRow}>
                            <Text style={styles.title}>Select Your Ad Duration</Text>
                            <TouchableOpacity style={styles.closeBtn} activeOpacity={0.8} onPress={onClose}>
                                <Ionicons name="close" size={18} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 16 }}>
                            {dateField('From', from, () => { setFrom(null); setTo(null); })}
                            {dateField('To', to, () => setTo(null))}
                        </View>

                        {calendarOpen && (
                            <View style={styles.calendar}>
                                <View style={styles.calendarHeader}>
                                    <TouchableOpacity hitSlop={8} onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
                                        <Ionicons name="chevron-back" size={16} color="#9A9A9E" />
                                    </TouchableOpacity>
                                    <Text style={styles.calendarTitle}>{MONTH_NAMES[month.getMonth()]} {month.getFullYear()}</Text>
                                    <TouchableOpacity hitSlop={8} onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
                                        <Ionicons name="chevron-forward" size={16} color="#9A9A9E" />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.calendarGrid}>
                                    {WEEKDAY_LABELS.map((day) => (
                                        <View key={day} style={styles.calendarCell}>
                                            <Text style={styles.weekday}>{day}</Text>
                                        </View>
                                    ))}
                                    {getCalendarDays(month).map(({ date, inMonth }) => {
                                        const time = date.getTime();
                                        const isEdge = time === from?.getTime() || time === to?.getTime();
                                        const inRange = !!(from && to && date > from && date < to);
                                        const isPast = date < today;
                                        return (
                                            <TouchableOpacity
                                                key={time}
                                                disabled={isPast}
                                                activeOpacity={0.7}
                                                onPress={() => pickDay(date)}
                                                style={styles.calendarCell}
                                            >
                                                <View style={[styles.day, inRange && styles.dayInRange, isEdge && styles.dayEdge]}>
                                                    <Text style={[styles.dayText, (!inMonth || isPast) && { color: '#55555A' }, isEdge && { color: '#fff' }]}>
                                                        {date.getDate()}
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        )}

                        <Dropdown
                            label="Location"
                            placeholder="Select Location"
                            value={location}
                            options={LOCATION_OPTIONS}
                            open={openDropdown === 'location'}
                            onToggle={() => toggleDropdown('location')}
                            onSelect={setLocation}
                        />
                        <Dropdown
                            label="Select Language"
                            placeholder="Select a language"
                            value={language}
                            options={LANGUAGE_OPTIONS}
                            open={openDropdown === 'language'}
                            onToggle={() => toggleDropdown('language')}
                            onSelect={setLanguage}
                        />

                        <TouchableOpacity activeOpacity={0.85} onPress={handleContinue} style={styles.continueBtn}>
                            <LinearGradient colors={['#1A8CFF', '#6633E5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.continueGradient}>
                                <Text style={styles.continueText}>Continue</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </ScrollView>
                </Animated.View>
            </View>
        </Modal>
    );
}

const FIELD_BG = '#2B2B2D';
const FIELD_BORDER = 'rgba(255,255,255,0.12)';

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.72)',
    },
    sheet: {
        maxHeight: '88%',
        backgroundColor: '#171718',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 18,
    },
    title: {
        color: '#fff',
        fontSize: 18,
        fontFamily: 'Poppins_500Medium',
    },
    closeBtn: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#4A4A4D',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.55)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        color: '#fff',
        fontSize: 13,
        fontFamily: 'Poppins_400Regular',
        marginBottom: 6,
    },
    dateField: {
        height: 52,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: FIELD_BORDER,
        backgroundColor: FIELD_BG,
    },
    fieldActive: {
        borderColor: '#6C47FF',
    },
    dateText: {
        flex: 1,
        color: '#7E7E82',
        fontSize: 14,
        fontFamily: 'Poppins_400Regular',
    },
    dropdown: {
        height: 52,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: FIELD_BORDER,
        backgroundColor: FIELD_BG,
    },
    dropdownText: {
        color: '#fff',
        fontSize: 14,
        fontFamily: 'Poppins_400Regular',
    },
    options: {
        maxHeight: 170,
        marginTop: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: FIELD_BORDER,
        backgroundColor: FIELD_BG,
        overflow: 'hidden',
    },
    option: {
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderBottomWidth: 1,
        borderBottomColor: FIELD_BORDER,
    },
    calendar: {
        marginTop: 12,
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: FIELD_BORDER,
        backgroundColor: '#212123',
    },
    calendarHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    calendarTitle: {
        color: '#fff',
        fontSize: 14,
        fontFamily: 'Poppins_600SemiBold',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    calendarCell: {
        width: `${100 / 7}%`,
        alignItems: 'center',
        paddingVertical: 3,
    },
    weekday: {
        color: '#8A8A8E',
        fontSize: 11,
        fontFamily: 'Poppins_500Medium',
    },
    day: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayInRange: {
        backgroundColor: 'rgba(26,140,255,0.25)',
    },
    dayEdge: {
        backgroundColor: '#1A8CFF',
    },
    dayText: {
        color: '#E2E2E2',
        fontSize: 13,
        fontFamily: 'Poppins_500Medium',
    },
    continueBtn: {
        marginTop: 34,
        borderRadius: 26,
        shadowColor: '#1A8CFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 10,
    },
    continueGradient: {
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
    },
    continueText: {
        color: '#fff',
        fontSize: 15,
        fontFamily: 'Poppins_500Medium',
    },
});
