import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function AdDesignPage() {
    const router = useRouter();
    const [hasDesign, setHasDesign] = useState(true);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#060606' }}>
            <StatusBar barStyle="light-content" />
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                style={{ flex: 1 }}
            >
                {/* Header */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 20,
                    paddingTop: Platform.OS === 'android' ? 40 : 20,
                    paddingBottom: 20,
                    position: 'relative'
                }}>
                    <TouchableOpacity 
                        onPress={() => router.back()} 
                        style={{ position: 'absolute', left: 20, top: Platform.OS === 'android' ? 40 : 20, zIndex: 10 }}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={{
                        color: '#fff',
                        fontSize: 24,
                        fontFamily: 'Poppins_500Medium',
                        textAlign: 'center'
                    }}>
                        Ad Design
                    </Text>
                </View>

                {/* Question Card */}
                <View style={{
                    backgroundColor: '#12122A',
                    borderRadius: 22,
                    marginHorizontal: 16,
                    padding: 16,
                    borderWidth: 1.5,
                    borderColor: '#6C47FF',
                    marginTop: 10,
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

                {/* Upload Area */}
                {hasDesign && (
                    <TouchableOpacity 
                        activeOpacity={0.8}
                        style={{
                            backgroundColor: '#0C0C1E',
                            borderRadius: 20,
                            marginHorizontal: 16,
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

                {/* Freelancers List */}
                <Text style={{
                    color: '#fff',
                    fontSize: 16,
                    fontFamily: 'Poppins_500Medium',
                    marginHorizontal: 16,
                    marginTop: 32,
                    marginBottom: 16,
                }}>
                    Or our Verified Freelancers
                </Text>

                {/* Freelancer 1 */}
                <View style={{
                    backgroundColor: '#12122A',
                    borderRadius: 18,
                    marginHorizontal: 16,
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

                {/* Freelancer 2 */}
                <View style={{
                    backgroundColor: '#12122A',
                    borderRadius: 18,
                    marginHorizontal: 16,
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
            </ScrollView>

            {/* Bottom Button */}
            <View style={{
                position: 'absolute',
                bottom: Platform.OS === 'ios' ? 34 : 24,
                left: 0,
                right: 0,
                alignItems: 'center',
            }}>
                <View style={{
                    shadowColor: '#1A8CFF',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.4,
                    shadowRadius: 9,
                    elevation: 10,
                    width: '85%'
                }}>
                    <LinearGradient
                        colors={['#1A8CFF', '#6633E5']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ borderRadius: 26, overflow: 'hidden' }}
                    >
                        <TouchableOpacity
                            activeOpacity={0.85}
                            style={{
                                paddingVertical: 16,
                                alignItems: 'center',
                            }}
                            onPress={() => router.back()}
                        >
                            <Text style={{
                                color: '#fff',
                                fontSize: 16,
                                fontFamily: 'Poppins_500Medium',
                            }}>
                                Continue
                            </Text>
                        </TouchableOpacity>
                    </LinearGradient>
                </View>
            </View>
        </SafeAreaView>
    );
}
