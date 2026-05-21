import { SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { colors, spacing } from '@/lib/design-system';
import { Text } from '@/components/primitives';

export default function OnboardingPlaceholder() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.DEFAULT }}>
      <View
        style={{
          flex: 1,
          padding: spacing[5],
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing[3],
        }}
      >
        <Text variant="caption">onboarding</Text>
        <Text variant="h2">Built in prompt 2</Text>
        <Text variant="body" color={colors.fg.muted}>
          Hero, grounding phrase, voice, alarm time, magic-moment pep talk.
        </Text>
      </View>
    </SafeAreaView>
  );
}
