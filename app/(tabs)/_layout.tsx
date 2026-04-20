import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import AppBottomNav, { APP_TABS } from '../../Components/ui/AppBottomNav';
import { palette } from '../../theme/colors';

/**
 * Persistent bottom-nav layout. We mount expo-router's <Tabs /> with a custom
 * tab bar so the shared AppBottomNav stays visible across tab switches and
 * every screen gets consistent spacing + theme-aware active state.
 */
export default function TabsLayout() {
    const router = useRouter();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: { display: 'none' },
                sceneStyle: { backgroundColor: palette.background },
            }}
            tabBar={(props) => {
                const activeRouteName = props.state.routes[props.state.index]?.name ?? 'index';
                const activeKey = routeToTabKey(activeRouteName);
                return (
                    <View>
                        <AppBottomNav
                            activeKey={activeKey}
                            onTabPress={(tab) => props.navigation.navigate(tabKeyToRoute(tab.key) as never)}
                            onFabPress={() => router.push('/create-post' as any)}
                        />
                    </View>
                );
            }}
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
