import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { OnboardingShell, OnboardingHeader } from '@/components/onboarding/OnboardingShell';
import { Input, Text } from '@/components/primitives';
import { colors, spacing } from '@/lib/design-system';
import { setPreferences } from '@/lib/storage/preferences';

const MAX_LEN = 60;

export default function Phrase() {
  const [value, setValue] = useState('');
  const trimmed = value.trim();
  const canContinue = trimmed.length > 0;

  const handleNext = async () => {
    if (!canContinue) return;
    await setPreferences({ groundingPhrase: trimmed });
    router.push('/onboarding/intent');
  };

  return (
    <OnboardingShell
      step={2}
      cta={{ label: 'next', disabled: !canContinue, onPress: handleNext }}
    >
      <OnboardingHeader
        caption="STEP 2 OF 6"
        title="What's your phrase?"
        subtitle="a mantra that grounds you. echo will repeat it back. keep it short — one short sentence."
      />

      <View style={{ gap: spacing[2] }}>
        <Input
          value={value}
          onChangeText={setValue}
          placeholder="trust the work"
          autoCorrect={false}
          autoCapitalize="sentences"
          maxLength={MAX_LEN}
          returnKeyType="next"
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
