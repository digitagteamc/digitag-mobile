import { useRouter } from 'expo-router';
import React, { createContext, useCallback, useContext, useState } from 'react';
import CompleteProfileModal from '../Components/ui/CompleteProfileModal';
import { useAuth } from './AuthContext';

interface ProfileGateCtx {
    requireProfile: (action: string) => boolean;
    isProfileCompleted: boolean;
}

const ProfileGateContext = createContext<ProfileGateCtx>({
    requireProfile: () => true,
    isProfileCompleted: false,
});

export function ProfileGateProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { isProfileCompleted, userRole, token, isGuest } = useAuth();

    const [modalVisible, setModalVisible] = useState(false);
    const [pendingAction, setPendingAction] = useState('');

    const requireProfile = useCallback((action: string): boolean => {
        if (isGuest || !token) {
            // Still use Alert for the sign-in case (less common)
            router.push('/role-selection');
            return false;
        }
        if (isProfileCompleted) return true;

        setPendingAction(action);
        setModalVisible(true);
        return false;
    }, [isGuest, token, isProfileCompleted, router]);

    const handleComplete = useCallback(() => {
        setModalVisible(false);
        const signupPath = userRole?.toUpperCase() === 'FREELANCER'
            ? '/signup/freelancer'
            : '/signup/creator';
        setTimeout(() => router.push(signupPath as any), 250);
    }, [userRole, router]);

    const handleDismiss = useCallback(() => {
        setModalVisible(false);
    }, []);

    return (
        <ProfileGateContext.Provider value={{ requireProfile, isProfileCompleted: !!isProfileCompleted }}>
            {children}
            <CompleteProfileModal
                visible={modalVisible}
                role={userRole || 'CREATOR'}
                action={pendingAction}
                onComplete={handleComplete}
                onDismiss={handleDismiss}
            />
        </ProfileGateContext.Provider>
    );
}

export function useProfileGate() {
    return useContext(ProfileGateContext);
}
