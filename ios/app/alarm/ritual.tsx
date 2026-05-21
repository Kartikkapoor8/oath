import { SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { colors, spacing } from '@/lib/design-system';
import { Text } from '@/components/primitives';

export default function RitualPlaceholder() {
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
        <Text variant="caption">alarm — ritual</Text>
        <Text variant="h2">Built in prompt 3</Text>
        <Text variant="body" color={colors.fg.muted}>
          Pep talk plays here after the alarm fires and the user taps the
          notification.
        </Text>
      </View>
    </SafeAreaView>
  );
}
