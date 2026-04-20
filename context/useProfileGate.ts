import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { useAuth } from './AuthContext';

/**
 * Gate deeper actions (collaborate, chat, call, bookmark…) behind profile
 * completion. Call `requireProfile(label)` at the top of an action handler:
 *
 *   const { requireProfile } = useProfileGate();
 *   const onCollab = () => {
 *     if (!requireProfile('collaborate')) return;
 *     // …proceed
 *   };
 *
 * Returns `true` when the profile is complete (action may proceed). When
 * incomplete, returns `false` and surfaces a prompt with a shortcut to the
 * correct signup screen for the user's role.
 */
export function useProfileGate() {
    const router = useRouter();
    const { isProfileCompleted, userRole, token, isGuest } = useAuth();

    const requireProfile = (action: string): boolean => {
        if (isGuest || !token) {
            Alert.alert('Sign In Required', `Please sign in to ${action}.`, [
                { text: 'Not now', style: 'cancel' },
                { text: 'Sign In', onPress: () => router.push('/role-selection') },
            ]);
            return false;
        }
        if (isProfileCompleted) return true;

        const signupPath = userRole?.toUpperCase() === 'FREELANCER'
            ? '/signup/freelancer'
            : '/signup/creator';

        Alert.alert(
            'Complete Your Profile',
            `To ${action}, please finish setting up your profile first. It only takes a moment.`,
            [
                { text: 'Not now', style: 'cancel' },
                { text: 'Complete Profile', onPress: () => router.push(signupPath as any) },
            ],
        );
        return false;
    };

    return { requireProfile, isProfileCompleted };
}
