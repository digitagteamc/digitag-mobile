import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { refreshToken as apiRefreshToken, setRefreshTokenCallback } from '../services/userService';

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
    userRole: string | null;
    isProfileCompleted: boolean;
    profiles: ProfileMap;
    isGuest: boolean;
    /** true while restoring session from storage — show a loading screen */
    isLoading: boolean;
    /** true once the user has seen onboarding at least once */
    hasOnboarded: boolean;
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
    setProfiles: (next: Partial<ProfileMap>) => void;
    setActiveRole: (role: Role) => void;
    loginAsGuest: () => void;
    logout: () => void;
    markOnboarded: () => void;
}

const STORAGE_KEYS = {
    TOKEN: '@auth_token',
    REFRESH_TOKEN: '@auth_refresh_token',
    USER_PHONE: '@auth_phone',
    USER_ID: '@auth_user_id',
    USER_ROLE: '@auth_role',
    IS_PROFILE_COMPLETED: '@auth_profile_completed',
    PROFILES: '@auth_profiles',
    HAS_ONBOARDED: '@has_onboarded',
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const EMPTY_PROFILES: ProfileMap = { CREATOR: false, FREELANCER: false };

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [userPhone, setUserPhone] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [refreshTokenState, setRefreshTokenState] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isProfileCompleted, setIsProfileCompleted] = useState<boolean>(false);
    const [profiles, setProfilesState] = useState<ProfileMap>(EMPTY_PROFILES);
    const [isGuest, setIsGuest] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [hasOnboarded, setHasOnboarded] = useState<boolean>(false);

    // Restore session from AsyncStorage on app start
    useEffect(() => {
        restoreSession();
    }, []);

    // Wire up auto-refresh so userService can call it on 401
    useEffect(() => {
        setRefreshTokenCallback(async () => {
            const stored = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
            if (!stored) return null;
            try {
                const res = await apiRefreshToken(stored);
                if (res.success && res.data?.tokens) {
                    const newAccess = res.data.tokens.accessToken;
                    const newRefresh = res.data.tokens.refreshToken;
                    await AsyncStorage.multiSet([
                        [STORAGE_KEYS.TOKEN, newAccess],
                        [STORAGE_KEYS.REFRESH_TOKEN, newRefresh],
                    ]);
                    setToken(newAccess);
                    setRefreshTokenState(newRefresh);
                    return newAccess;
                }
            } catch { }
            return null;
        });
    }, []);

    async function restoreSession() {
        try {
            const [
                storedToken,
                storedRefresh,
                storedPhone,
                storedId,
                storedRole,
                storedProfileDone,
                storedProfiles,
                storedOnboarded,
            ] = await AsyncStorage.multiGet([
                STORAGE_KEYS.TOKEN,
                STORAGE_KEYS.REFRESH_TOKEN,
                STORAGE_KEYS.USER_PHONE,
                STORAGE_KEYS.USER_ID,
                STORAGE_KEYS.USER_ROLE,
                STORAGE_KEYS.IS_PROFILE_COMPLETED,
                STORAGE_KEYS.PROFILES,
                STORAGE_KEYS.HAS_ONBOARDED,
            ]);

            const rToken = storedRefresh[1];
            const hasOnboardedFlag = storedOnboarded[1] === 'true';
            setHasOnboarded(hasOnboardedFlag);

            if (rToken) {
                // Try to get a fresh access token using the stored refresh token
                try {
                    const res = await apiRefreshToken(rToken);
                    if (res.success && res.data?.tokens) {
                        const newToken = res.data.tokens.accessToken;
                        const newRefresh = res.data.tokens.refreshToken;

                        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, newToken);
                        await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefresh);

                        setToken(newToken);
                        setRefreshTokenState(newRefresh);
                        setUserPhone(storedPhone[1]);
                        setUserId(storedId[1]);
                        setUserRole(storedRole[1]);
                        setIsProfileCompleted(storedProfileDone[1] === 'true');
                        if (storedProfiles[1]) {
                            try { setProfilesState(JSON.parse(storedProfiles[1])); } catch { }
                        }
                    }
                    // If refresh fails (expired/revoked), session stays null → user goes to login
                } catch {
                    // Refresh token invalid — clear storage and proceed to login
                    await clearStorage();
                }
            }
        } catch {
            // Storage read error — proceed without session
        } finally {
            setIsLoading(false);
        }
    }

    async function clearStorage() {
        await AsyncStorage.multiRemove([
            STORAGE_KEYS.TOKEN,
            STORAGE_KEYS.REFRESH_TOKEN,
            STORAGE_KEYS.USER_PHONE,
            STORAGE_KEYS.USER_ID,
            STORAGE_KEYS.USER_ROLE,
            STORAGE_KEYS.IS_PROFILE_COMPLETED,
            STORAGE_KEYS.PROFILES,
        ]);
    }

    const login: AuthContextType['login'] = async ({ phone, token: tk, refreshToken: rTk, role, id, isProfileCompleted: ipc, profiles: incomingProfiles }) => {
        setIsGuest(false);
        setUserPhone(phone);
        if (tk) setToken(tk);
        if (rTk) setRefreshTokenState(rTk);
        if (role) setUserRole(role);
        if (id) setUserId(id);
        setIsProfileCompleted(Boolean(ipc));
        const mergedProfiles = { ...EMPTY_PROFILES, ...incomingProfiles };
        if (incomingProfiles) setProfilesState(mergedProfiles);

        // Persist to AsyncStorage
        const pairs: [string, string][] = [
            [STORAGE_KEYS.USER_PHONE, phone],
            [STORAGE_KEYS.IS_PROFILE_COMPLETED, String(Boolean(ipc))],
            [STORAGE_KEYS.PROFILES, JSON.stringify(mergedProfiles)],
            [STORAGE_KEYS.HAS_ONBOARDED, 'true'],
        ];
        if (tk) pairs.push([STORAGE_KEYS.TOKEN, tk]);
        if (rTk) pairs.push([STORAGE_KEYS.REFRESH_TOKEN, rTk]);
        if (role) pairs.push([STORAGE_KEYS.USER_ROLE, role]);
        if (id) pairs.push([STORAGE_KEYS.USER_ID, id]);

        setHasOnboarded(true);
        await AsyncStorage.multiSet(pairs);
    };

    const setProfileCompletedPersist = (v: boolean) => {
        setIsProfileCompleted(v);
        AsyncStorage.setItem(STORAGE_KEYS.IS_PROFILE_COMPLETED, String(v)).catch(() => { });
    };

    const setProfiles = (next: Partial<ProfileMap>) => {
        setProfilesState((prev) => {
            const merged = { ...prev, ...next };
            AsyncStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(merged)).catch(() => { });
            return merged;
        });
    };

    const setActiveRole = (role: Role) => {
        setUserRole(role);
        setIsProfileCompleted(profiles[role] === true);
        AsyncStorage.setItem(STORAGE_KEYS.USER_ROLE, role).catch(() => { });
    };

    const loginAsGuest = () => {
        setIsGuest(true);
        setUserPhone(null);
        setUserId(null);
        setToken(null);
        setRefreshTokenState(null);
        setUserRole(null);
        setIsProfileCompleted(false);
        setProfilesState(EMPTY_PROFILES);
    };

    const logout = async () => {
        setIsGuest(false);
        setUserPhone(null);
        setUserId(null);
        setToken(null);
        setRefreshTokenState(null);
        setUserRole(null);
        setIsProfileCompleted(false);
        setProfilesState(EMPTY_PROFILES);
        await clearStorage();
    };

    const markOnboarded = async () => {
        setHasOnboarded(true);
        await AsyncStorage.setItem(STORAGE_KEYS.HAS_ONBOARDED, 'true');
    };

    return (
        <AuthContext.Provider
            value={{
                userPhone,
                userId,
                token,
                refreshToken: refreshTokenState,
                userRole,
                isProfileCompleted,
                profiles,
                isGuest,
                isLoading,
                hasOnboarded,
                login,
                setProfileCompleted: setProfileCompletedPersist,
                setProfiles,
                setActiveRole,
                loginAsGuest,
                logout,
                markOnboarded,
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
