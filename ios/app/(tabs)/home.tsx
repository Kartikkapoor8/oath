import { SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { colors, spacing } from '@/lib/design-system';
import { Text } from '@/components/primitives';

export default function HomePlaceholder() {
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
        <Text variant="caption">home</Text>
        <Text variant="h2">Built in prompt 2</Text>
        <Text variant="body" color={colors.fg.muted}>
          Tomorrow&apos;s alarm preview, intent capture entry point, transition-
          moment pep talks.
        </Text>
      </View>
    </SafeAreaView>
  );
}
