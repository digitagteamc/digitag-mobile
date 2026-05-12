import { useAuth } from '@/context/AuthContext';
import { Redirect, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import CompleteProfileModal from '../../Components/ui/CompleteProfileModal';

export default function CreatorsLanding() {
    const router = useRouter();
    const { isGuest, userRole, isProfileCompleted } = useAuth();

    const [modalVisible, setModalVisible] = useState(true);

    if (isGuest) return <Redirect href="/role-selection" />;
    if (isProfileCompleted) return <Redirect href="/(tabs)" />;

    const signupPath = userRole?.toUpperCase() === 'FREELANCER'
        ? '/signup/freelancer'
        : '/signup/creator';

    return (
        <View style={{ flex: 1, backgroundColor: '#060606' }}>
            <CompleteProfileModal
                visible={modalVisible}
                role={userRole || 'CREATOR'}
                onComplete={() => {
                    setModalVisible(false);
                    setTimeout(() => router.replace(signupPath as any), 250);
                }}
                onDismiss={() => {
                    setModalVisible(false);
                    setTimeout(() => router.replace('/(tabs)'), 250);
                }}
            />
        </View>
    );
}
