import { useState } from 'react';
import { Platform, View } from 'react-native';
import { router } from 'expo-router';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { OnboardingShell, OnboardingHeader } from '@/components/onboarding/OnboardingShell';
import { Text } from '@/components/primitives';
import { colors, spacing } from '@/lib/design-system';
import { setPreferences } from '@/lib/storage/preferences';
import { formatAlarmTime12h } from '@/lib/helpers/onboarding-defaults';

function defaultAlarm(): Date {
  const d = new Date();
  d.setHours(6, 0, 0, 0);
  return d;
}

function format24h(d: Date): string {
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

export default function AlarmTime() {
  const [time, setTime] = useState<Date>(defaultAlarm);

  const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (selected) setTime(selected);
  };

  const handleNext = async () => {
    await setPreferences({ alarmTime: format24h(time) });
    router.push('/onboarding/notifications-permission');
  };

  return (
    <OnboardingShell
      step={5}
      cta={{ label: 'next', onPress: handleNext }}
    >
      <OnboardingHeader
        caption="STEP 5 OF 6"
        title="When do you wake up?"
        subtitle="tomorrow's ritual will be ready 15 minutes before your alarm. you can change this anytime."
      />

      <View style={{ alignItems: 'center', gap: spacing[5] }}>
        <Text
          variant="displayXl"
          color={colors.amber.DEFAULT}
          style={{ textAlign: 'center' }}
        >
          {formatAlarmTime12h(format24h(time))}
        </Text>

        {Platform.OS === 'ios' ? (
          <DateTimePicker
            value={time}
            mode="time"
            display="spinner"
            onChange={handleChange}
            themeVariant="dark"
            textColor={colors.fg.DEFAULT}
            minuteInterval={5}
            style={{ alignSelf: 'stretch' }}
          />
        ) : (
          <DateTimePicker value={time} mode="time" onChange={handleChange} />
        )}
      </View>
    </OnboardingShell>
  );
}
