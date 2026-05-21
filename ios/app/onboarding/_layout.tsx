import { Stack } from 'expo-router';
import { colors } from '@/lib/design-system';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.bg.DEFAULT },
      }}
    />
  );
}
