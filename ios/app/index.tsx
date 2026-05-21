import { useEffect } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { getPreferences } from '@/lib/storage/preferences';
import { colors } from '@/lib/design-system';

export default function Index() {
  useEffect(() => {
    (async () => {
      const prefs = await getPreferences();
      if (!prefs.hasOnboarded) {
        router.replace('/onboarding');
      } else {
        router.replace('/(tabs)/home');
      }
    })();
  }, []);

  return <View style={{ flex: 1, backgroundColor: colors.bg.DEFAULT }} />;
}
