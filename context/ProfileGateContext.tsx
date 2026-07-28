import { useRouter } from 'expo-router';
import React, { createContext, useCallback, useContext, useState } from 'react';
import CompleteProfileModal from '../Components/ui/CompleteProfileModal';
import ConfirmActionModal from '../Components/ui/ConfirmActionModal';
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
    const [guestGateVisible, setGuestGateVisible] = useState(false);
    const [pendingGuestAction, setPendingGuestAction] = useState('');

    const requireProfile = useCallback((action: string): boolean => {
        if (isGuest || !token) {
            setPendingGuestAction(action);
            setGuestGateVisible(true);
            return false;
        }
        if (isProfileCompleted) return true;

        setPendingAction(action);
        setModalVisible(true);
        return false;
    }, [isGuest, token, isProfileCompleted]);

    const handleGuestGateConfirm = useCallback(() => {
        setGuestGateVisible(false);
        router.push('/role-selection');
    }, [router]);

    const handleGuestGateDismiss = useCallback(() => {
        setGuestGateVisible(false);
    }, []);

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
            <ConfirmActionModal
                visible={guestGateVisible}
                title="Login or sign up to continue"
                message={pendingGuestAction ? `Create an account or log in to ${pendingGuestAction}.` : 'Create an account or log in to continue.'}
                confirmLabel="Login / Sign Up"
                confirmColor="#ED2A91"
                onConfirm={handleGuestGateConfirm}
                onDismiss={handleGuestGateDismiss}
            />
        </ProfileGateContext.Provider>
    );
}

export function useProfileGate() {
    return useContext(ProfileGateContext);
}
