import React, { createContext, useContext, useState } from 'react';

interface AuthContextType {
    userPhone: string | null;
    token: string | null;
    userRole: string | null;
    isGuest: boolean;
    login: (phone: string, token?: string, role?: string) => void;
    loginAsGuest: () => void;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [userPhone, setUserPhone] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isGuest, setIsGuest] = useState<boolean>(false);

    const login = (phone: string, authToken?: string, role?: string) => {
        setIsGuest(false);
        setUserPhone(phone);
        if (authToken) setToken(authToken);
        if (role) setUserRole(role);
    };

    const loginAsGuest = () => {
        setIsGuest(true);
        setUserPhone(null);
        setToken(null);
        setUserRole(null);
    };

    const logout = () => {
        setIsGuest(false);
        setUserPhone(null);
        setToken(null);
        setUserRole(null);
    };

    return (
        <AuthContext.Provider value={{ userPhone, token, userRole, isGuest, login, loginAsGuest, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};