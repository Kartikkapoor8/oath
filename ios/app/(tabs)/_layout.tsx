import { Tabs } from 'expo-router';
import { Home, BookText, Settings } from 'lucide-react-native';
import { colors } from '@/lib/design-system';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.amber.DEFAULT,
        tabBarInactiveTintColor: colors.fg.subtle,
        tabBarStyle: {
          backgroundColor: colors.bg.elevated,
          borderTopColor: colors.border.subtle,
          borderTopWidth: 1,
          height: 64,
          paddingTop: 8,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color }) => <Home color={color} size={24} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          tabBarIcon: ({ color }) => <BookText color={color} size={24} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color }) => <Settings color={color} size={24} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}
