import { Tabs, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppBottomNav, { APP_TABS } from '../../Components/ui/AppBottomNav';
import { useProfileGate } from '../../context/ProfileGateContext';

export const NAV_BAR_HEIGHT = Platform.OS === 'ios' ? 90 : 70;

/**
 * Persistent bottom-nav layout. We mount expo-router's <Tabs /> with a custom
 * tab bar so the shared AppBottomNav stays visible across tab switches and
 * every screen gets consistent spacing + theme-aware active state.
 */
export default function TabsLayout() {
    const router = useRouter();
    const { requireProfile } = useProfileGate();
    const insets = useSafeAreaInsets();
    const sceneBottomPad = NAV_BAR_HEIGHT + (insets.bottom > 0 ? insets.bottom : 0);

    const isNavigating = React.useRef(false);

    const renderTabBar = useCallback((props: any) => {
        const activeRouteName = props.state.routes[props.state.index]?.name ?? 'index';
        const activeKey = routeToTabKey(activeRouteName);
        
        const handleTabPress = (tab: any) => {
            if (isNavigating.current) return;
            isNavigating.current = true;
            props.navigation.navigate(tabKeyToRoute(tab.key) as never);
            setTimeout(() => {
                isNavigating.current = false;
            }, 300);
        };

        return (
            <AppBottomNav
                activeKey={activeKey}
                onTabPress={handleTabPress}
                onFabPress={() => {
                    if (!requireProfile('create a post')) return;
                    router.push('/create-post' as any);
                }}
            />
        );
    }, [router]);

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: { display: 'none' },
                sceneStyle: { backgroundColor: 'transparent' },
            }}
            backBehavior="initialRoute"
            tabBar={renderTabBar}
        >
            <Tabs.Screen name="index" />
            <Tabs.Screen name="explore" />
            <Tabs.Screen name="messages" />
            <Tabs.Screen name="profile" />
            {/* Routes below exist in the file tree but are not shown as tabs. */}
            <Tabs.Screen name="creators" options={{ href: null }} />
            <Tabs.Screen name="brands" options={{ href: null }} />
            <Tabs.Screen name="agencies" options={{ href: null }} />
            <Tabs.Screen name="freelancers" options={{ href: null }} />
        </Tabs>
    );
}

function routeToTabKey(routeName: string): string {
    switch (routeName) {
        case 'index': return 'home';
        case 'explore': return 'explore';
        case 'messages': return 'messages';
        case 'profile': return 'profile';
        default: return 'home';
    }
}

function tabKeyToRoute(key: string): string {
    switch (key) {
        case 'home': return 'index';
        case 'explore': return 'explore';
        case 'messages': return 'messages';
        case 'profile': return 'profile';
        default: return 'index';
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _APP_TABS = APP_TABS; // keep import referenced for future use
