import { Stack } from 'expo-router';
import { colors } from '@/lib/design-system';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg.DEFAULT },
        animation: 'slide_from_right',
        animationDuration: 250,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    />
  );
}
