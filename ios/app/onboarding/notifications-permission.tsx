import { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { Button, Text } from '@/components/primitives';
import { colors, spacing } from '@/lib/design-system';
import {
  getNotificationPermission,
  requestNotificationPermission,
} from '@/lib/notifications/permissions';
import {
  scheduleDailyAlarm,
  cancelDailyAlarm,
} from '@/lib/alarms/scheduler';
import { getPreferences } from '@/lib/storage/preferences';

export default function NotificationsPermission() {
  const [busy, setBusy] = useState(false);

  const handleAllow = async () => {
    if (busy) return;
    setBusy(true);
    try {
      let state = await getNotificationPermission();
      if (state === 'undetermined') {
        state = await requestNotificationPermission();
      }
      const prefs = await getPreferences();
      if (state === 'granted' && prefs.alarmTime) {
        await scheduleDailyAlarm(prefs.alarmTime);
      }
      router.push('/onboarding/generating');
    } finally {
      setBusy(false);
    }
  };

  const handleSkip = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await cancelDailyAlarm();
      router.push('/onboarding/generating');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={{ flex: 1, backgroundColor: colors.bg.DEFAULT }}
    >
      <View
        style={{
          flex: 1,
          paddingHorizontal: spacing[6],
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing[5],
        }}
      >
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: colors.bg.raised,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: colors.amber.DEFAULT,
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: 24,
            shadowOpacity: 0.35,
          }}
        >
          <Bell color={colors.amber.DEFAULT} size={48} strokeWidth={1.5} />
        </View>

        <View style={{ gap: spacing[3], alignItems: 'center' }}>
          <Text variant="caption" color={colors.fg.muted}>
            ONE QUICK THING
          </Text>
          <Text
            variant="h1"
            color={colors.fg.DEFAULT}
            style={{ textAlign: 'center' }}
          >
            OATH needs notification access
          </Text>
          <Text
            variant="body"
            color={colors.fg.muted}
            style={{ textAlign: 'center' }}
          >
            we use a local notification to wake you at your set time. nothing
            leaves your phone. no servers. no tracking.
          </Text>
        </View>
      </View>

      <View
        style={{
          paddingHorizontal: spacing[5],
          paddingBottom: spacing[8],
          gap: spacing[3],
        }}
      >
        <Button label="allow notifications" onPress={handleAllow} disabled={busy} />
        <Button
          label="skip for now (no wake-up alarms)"
          variant="ghost"
          onPress={handleSkip}
          disabled={busy}
        />
      </View>
    </SafeAreaView>
  );
}
