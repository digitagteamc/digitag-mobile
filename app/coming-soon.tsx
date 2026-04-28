import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');

export default function ComingSoonScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="p-2"
                >
                    <ChevronLeft color="#FFFFFF" size={28} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {/* Glow and Coming Soon Circle */}
                <View style={styles.circleContainer}>
                    <Svg width={width} height={width} viewBox={`0 0 ${width} ${width}`}>
                        <Defs>
                            <RadialGradient
                                id="pinkGlow"
                                cx="50%"
                                cy="50%"
                                rx="50%"
                                ry="50%"
                                fx="50%"
                                fy="50%"
                            >
                                <Stop offset="0%" stopColor="#ED2A91" stopOpacity="0.8" />
                                <Stop offset="70%" stopColor="#ED2A91" stopOpacity="0.3" />
                                <Stop offset="100%" stopColor="#ED2A91" stopOpacity="0" />
                            </RadialGradient>
                        </Defs>
                        {/* The glowing aura */}
                        <Circle
                            cx={width / 2}
                            cy={width / 2}
                            r={width * 0.45}
                            fill="url(#pinkGlow)"
                        />
                        {/* The dark center circle */}
                        <Circle
                            cx={width / 2}
                            cy={width / 2}
                            r={width * 0.35}
                            fill="#0A0A10"
                        />
                    </Svg>
                    
                    {/* Coming Soon Text - Styled to look like the script in the image */}
                    <View style={styles.comingSoonTextContainer}>
                        <Text style={styles.comingText}>Coming</Text>
                        <Text style={styles.soonText}>Soon</Text>
                    </View>
                </View>

                {/* Subtext */}
                <View style={styles.textContainer}>
                    <Text style={styles.subtext}>
                        Brand and Agency flows are not yet available. Please choose Creator or Freelancer.
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 16,
        zIndex: 10,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -50,
    },
    circleContainer: {
        width: width,
        height: width,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    comingSoonTextContainer: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    comingText: {
        color: '#FFFFFF',
        fontSize: 56,
        fontFamily: 'cursive', // Fallback for script style
        fontStyle: 'italic',
        fontWeight: '300',
        lineHeight: 60,
    },
    soonText: {
        color: '#FFFFFF',
        fontSize: 56,
        fontFamily: 'cursive', // Fallback for script style
        fontStyle: 'italic',
        fontWeight: '300',
        lineHeight: 60,
        marginTop: -10,
        marginLeft: 40,
    },
    textContainer: {
        paddingHorizontal: 40,
        marginTop: 20,
    },
    subtext: {
        color: '#88889D',
        fontSize: 16,
        textAlign: 'center',
        fontFamily: 'Poppins_400Regular',
        lineHeight: 24,
    },
});
