import React, { createContext, useContext, useState } from 'react';

export type Role = 'CREATOR' | 'FREELANCER';

export interface ProfileMap {
    CREATOR: boolean;
    FREELANCER: boolean;
}

interface AuthContextType {
    userPhone: string | null;
    userId: string | null;
    token: string | null;
    refreshToken: string | null;
    /** The currently-active session role (a.k.a. "which profile am I using right now"). */
    userRole: string | null;
    /** Whether the *active* role has a complete profile. */
    isProfileCompleted: boolean;
    /** Which roles on this account already have a completed profile. */
    profiles: ProfileMap;
    isGuest: boolean;
    login: (args: {
        phone: string;
        token?: string;
        refreshToken?: string;
        role?: string;
        id?: string;
        isProfileCompleted?: boolean;
        profiles?: Partial<ProfileMap>;
    }) => void;
    setProfileCompleted: (v: boolean) => void;
    /** Update which roles have completed profiles (e.g. after creating a new one). */
    setProfiles: (next: Partial<ProfileMap>) => void;
    /** Swap the active role locally (after a server switchRole call). */
    setActiveRole: (role: Role) => void;
    loginAsGuest: () => void;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const EMPTY_PROFILES: ProfileMap = { CREATOR: false, FREELANCER: false };

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [userPhone, setUserPhone] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isProfileCompleted, setIsProfileCompleted] = useState<boolean>(false);
    const [profiles, setProfilesState] = useState<ProfileMap>(EMPTY_PROFILES);
    const [isGuest, setIsGuest] = useState<boolean>(false);

    const login: AuthContextType['login'] = ({ phone, token, refreshToken, role, id, isProfileCompleted, profiles: incomingProfiles }) => {
        setIsGuest(false);
        setUserPhone(phone);
        if (token) setToken(token);
        if (refreshToken) setRefreshToken(refreshToken);
        if (role) setUserRole(role);
        if (id) setUserId(id);
        setIsProfileCompleted(Boolean(isProfileCompleted));
        if (incomingProfiles) {
            setProfilesState({ ...EMPTY_PROFILES, ...incomingProfiles });
        }
    };

    const setProfiles = (next: Partial<ProfileMap>) => {
        setProfilesState((prev) => ({ ...prev, ...next }));
    };

    const setActiveRole = (role: Role) => {
        setUserRole(role);
        // If the new active role already has a complete profile, lift the gate.
        setIsProfileCompleted(profiles[role] === true);
    };

    const loginAsGuest = () => {
        setIsGuest(true);
        setUserPhone(null);
        setUserId(null);
        setToken(null);
        setRefreshToken(null);
        setUserRole(null);
        setIsProfileCompleted(false);
        setProfilesState(EMPTY_PROFILES);
    };

    const logout = () => {
        setIsGuest(false);
        setUserPhone(null);
        setUserId(null);
        setToken(null);
        setRefreshToken(null);
        setUserRole(null);
        setIsProfileCompleted(false);
        setProfilesState(EMPTY_PROFILES);
    };

    return (
        <AuthContext.Provider
            value={{
                userPhone,
                userId,
                token,
                refreshToken,
                userRole,
                isProfileCompleted,
                profiles,
                isGuest,
                login,
                setProfileCompleted: setIsProfileCompleted,
                setProfiles,
                setActiveRole,
                loginAsGuest,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
