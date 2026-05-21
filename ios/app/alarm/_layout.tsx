import { Stack } from 'expo-router';
import { colors } from '@/lib/design-system';

export default function AlarmLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg.DEFAULT },
        // No swipe-to-dismiss while the ritual is playing — the whole point
        // is "no escape to the feed". The action button is the only exit.
        gestureEnabled: false,
        animation: 'fade',
        animationDuration: 200,
      }}
    />
  );
}
