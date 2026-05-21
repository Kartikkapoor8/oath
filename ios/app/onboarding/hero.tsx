import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { OnboardingShell, OnboardingHeader } from '@/components/onboarding/OnboardingShell';
import { Input, Text } from '@/components/primitives';
import { colors, spacing } from '@/lib/design-system';
import { setPreferences } from '@/lib/storage/preferences';

const MAX_LEN = 40;

export default function Hero() {
  const [value, setValue] = useState('');
  const trimmed = value.trim();
  const canContinue = trimmed.length > 0;

  const handleNext = async () => {
    if (!canContinue) return;
    await setPreferences({ hero: trimmed });
    router.push('/onboarding/phrase');
  };

  return (
    <OnboardingShell
      step={1}
      cta={{ label: 'next', disabled: !canContinue, onPress: handleNext }}
    >
      <OnboardingHeader
        caption="STEP 1 OF 6"
        title="Who do you look up to?"
        subtitle="future you will reference them in the morning ritual. think specific — Kobe, Harvey Specter, your dad, your coach."
      />

      <View style={{ gap: spacing[3] }}>
        <Input
          value={value}
          onChangeText={setValue}
          placeholder="Kobe Bryant"
          autoCorrect={false}
          autoCapitalize="words"
          maxLength={MAX_LEN}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={handleNext}
          autoFocus
        />
        <Text variant="caption" color={colors.fg.subtle}>
          {`${value.length} / ${MAX_LEN}`}
        </Text>
      </View>
    </OnboardingShell>
  );
}
