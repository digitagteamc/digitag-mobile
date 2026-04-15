import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image, Dimensions, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';

const { width } = Dimensions.get('window');

const creatorImg = require('../assets/images/creator.png');
const brandImg = require('../assets/images/brand.png');
const agencyImg = require('../assets/images/agency.png');
const freelancerImg = require('../assets/images/freelancer.png');

export default function Hero() {
  const router = useRouter();
  const { isGuest } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const roles = [
    {
      id: 'creator',
      title: 'Creator',
      description: 'Individual content makers and Influencers',
      color: '#ed2a91',
      image: creatorImg,
    },
    {
      id: 'brand',
      title: 'Brand',
      description: 'Company looking for collaboration',
      color: '#214ee7',
      image: brandImg,
    },
    {
      id: 'agency',
      title: 'Agency',
      description: 'Marketing & Creative Management firms',
      color: '#e2f20f',
      image: agencyImg,
    },
    {
      id: 'freelancer',
      title: 'Freelancer',
      description: 'Independent Professional & Promoters',
      color: '#f26930',
      image: freelancerImg,
    },
  ];

  const handleNext = () => {
    if (isGuest) {
      router.navigate('/login');
    } else {
      router.push('/signup/role-selection');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Complete Profile</Text>
        </View>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.circleProgress}>
            <Text style={styles.circleText}>1/2</Text>
          </View>
          <View style={styles.progressTextContainer}>
            <Text style={styles.progressTitle}>Personal Information</Text>
            <Text style={styles.progressSubtitle}>Next: Personal Address</Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Select Your Profile Type</Text>
          <Text style={styles.subtitle}>Complete your Profile to unlock collaboration features</Text>
        </View>

        {/* Grid */}
        <View style={styles.grid}>
          {roles.map((role) => {
            const isSelected = selectedRole === role.id;
            return (
              <TouchableOpacity
                key={role.id}
                style={styles.cardOuter}
                onPress={() => setSelectedRole(role.id)}
                activeOpacity={0.8}
              >
                {/* Background Box with Borders */}
                <View style={[
                    styles.cardInner, 
                    { 
                      borderColor: role.color, 
                      backgroundColor: isSelected ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)' 
                    }
                  ]}
                >
                  <Text style={[styles.cardTitle, { color: role.color }]}>{role.title}</Text>
                  <Text style={styles.cardDesc}>{role.description}</Text>
                </View>
                {/* Image floating */}
                <View style={styles.cardImageContainer} pointerEvents="none">
                   <Image source={role.image} style={styles.cardImage} resizeMode="contain" />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Next Button */}
        <TouchableOpacity 
          style={[styles.nextButton, !selectedRole && styles.nextButtonDisabled]}
          disabled={!selectedRole}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#060606',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  circleProgress: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    borderWidth: 4,
    borderColor: '#7352dd', 
    borderRightColor: 'rgba(255,255,255,0.1)',
    borderBottomColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  circleText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  progressTextContainer: {
    justifyContent: 'center',
  },
  progressTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  progressSubtitle: {
    color: '#6e7180',
    fontSize: 12,
    marginTop: 4,
  },
  titleContainer: {
    marginBottom: 60,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    color: '#6e7180',
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardOuter: {
    width: (width - 48) / 2, 
    height: 190,
    marginBottom: 60, 
    position: 'relative',
  },
  cardInner: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  cardImageContainer: {
     position: 'absolute',
     top: -65,
     width: '100%',
     height: 130,
     alignItems: 'center',
     justifyContent: 'center',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  cardDesc: {
    color: '#6e7180',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    paddingBottom: 10,
  },
  nextButton: {
    backgroundColor: '#7352dd',
    borderRadius: 30,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  }
});