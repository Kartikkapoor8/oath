import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Button, Text } from '@/components/primitives';
import { colors, fonts, spacing } from '@/lib/design-system';

export default function Welcome() {
  const glow = useSharedValue(0.3);

  useEffect(() => {
    glow.value = withRepeat(
      withTiming(0.6, {
        duration: 1500,
        easing: Easing.inOut(Easing.cubic),
      }),
      -1,
      true,
    );
  }, [glow]);

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: glow.value,
  }));

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={{ flex: 1, backgroundColor: colors.bg.DEFAULT }}
    >
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing[6],
        }}
      >
        <Animated.View
          style={[
            {
              shadowColor: colors.amber.DEFAULT,
              shadowOffset: { width: 0, height: 0 },
              shadowRadius: 40,
            },
            glowStyle,
          ]}
        >
          <Text
            color={colors.amber.DEFAULT}
            style={{
              fontFamily: fonts.display,
              fontSize: 64,
              lineHeight: 68,
              letterSpacing: -2,
            }}
          >
            OATH
          </Text>
        </Animated.View>

        <View style={{ marginTop: spacing[6], gap: spacing[3], alignItems: 'center' }}>
          <Text variant="h2" color={colors.fg.DEFAULT} style={{ textAlign: 'center' }}>
            the anti-feed morning ritual
          </Text>
          <Text
            variant="body"
            color={colors.fg.muted}
            style={{ textAlign: 'center', paddingHorizontal: spacing[2] }}
          >
            swear your hardest task at night. dismiss the alarm. one ritual plays.
            you start.
          </Text>
        </View>
      </View>

      <View
        style={{
          paddingHorizontal: spacing[5],
          paddingBottom: spacing[12],
        }}
      >
        <Button
          label="let's begin"
          onPress={() => router.push('/onboarding/hero')}
        />
      </View>
    </SafeAreaView>
  );
}
