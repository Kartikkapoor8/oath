import { Stack } from 'expo-router';
import { colors } from '@/lib/design-system';

export default function AlarmLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: colors.bg.DEFAULT },
        gestureEnabled: false,
      }}
    />
  );
}
