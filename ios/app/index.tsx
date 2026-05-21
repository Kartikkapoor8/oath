import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { colors } from '@/lib/design-system';
import { getPreferences, type UserPreferences } from '@/lib/storage/preferences';

export default function Index() {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);

  useEffect(() => {
    getPreferences().then(setPrefs);
  }, []);

  if (!prefs) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg.DEFAULT,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={colors.amber.DEFAULT} />
      </View>
    );
  }

  if (!prefs.hasOnboarded) return <Redirect href="/onboarding" />;
  if (!prefs.hasPaid) return <Redirect href="/paywall" />;
  return <Redirect href="/(tabs)/home" />;
}
