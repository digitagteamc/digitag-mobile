import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from './AuthContext';
import { getUnreadNotificationCount } from '../services/userService';

interface NotificationCountContextType {
    unreadCount: number;
    refreshUnreadCount: () => void;
    clearUnreadCount: () => void;
}

const NotificationCountContext = createContext<NotificationCountContextType>({
    unreadCount: 0,
    refreshUnreadCount: () => {},
    clearUnreadCount: () => {},
});

/** Drives the bell-icon badge (Home tab). Kept as its own small context
 *  rather than folded into AuthContext so any screen can read/refresh the
 *  count without pulling in all of auth. */
export function NotificationCountProvider({ children }: { children: React.ReactNode }) {
    const { token } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    const refreshUnreadCount = useCallback(async () => {
        if (!token) { setUnreadCount(0); return; }
        const res = await getUnreadNotificationCount(token);
        if (res.success) setUnreadCount(res.count);
    }, [token]);

    const clearUnreadCount = useCallback(() => setUnreadCount(0), []);

    useEffect(() => { refreshUnreadCount(); }, [refreshUnreadCount]);

    // Covers a push that arrived while the app was backgrounded/killed —
    // returning to the foreground re-checks the real count.
    useEffect(() => {
        const sub = AppState.addEventListener('change', (next) => {
            if (next === 'active') refreshUnreadCount();
        });
        return () => sub.remove();
    }, [refreshUnreadCount]);

    return (
        <NotificationCountContext.Provider value={{ unreadCount, refreshUnreadCount, clearUnreadCount }}>
            {children}
        </NotificationCountContext.Provider>
    );
}

export function useNotificationCount() {
    return useContext(NotificationCountContext);
}
