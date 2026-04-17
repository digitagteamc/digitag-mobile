import { Tabs } from 'expo-router';

export default function TabsLayout() {
    return (
        <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
            <Tabs.Screen name="index" />
            <Tabs.Screen name="creators" />
            <Tabs.Screen name="brands" />
            <Tabs.Screen name="agencies" />
            <Tabs.Screen name="freelancers" />
            <Tabs.Screen name="profile" />
            <Tabs.Screen name="create-post" />
            <Tabs.Screen name="explore" />
            <Tabs.Screen name="messages" />
        </Tabs>
    );
}
