import { Stack } from 'expo-router';
import { colors } from '@/lib/design-system';

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg.DEFAULT },
      }}
    />
  );
}
