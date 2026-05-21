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
  const glow = useSharedValue(0.35);
  const scale = useSharedValue(1);

  useEffect(() => {
    glow.value = withRepeat(
      withTiming(0.7, {
        duration: 2500,
        easing: Easing.inOut(Easing.cubic),
      }),
      -1,
      true,
    );
    scale.value = withRepeat(
      withTiming(1.05, {
        duration: 2500,
        easing: Easing.inOut(Easing.cubic),
      }),
      -1,
      true,
    );
  }, [glow, scale]);

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: glow.value,
    transform: [{ scale: scale.value }],
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
              shadowRadius: 56,
            },
            glowStyle,
          ]}
        >
          <Text
            color={colors.amber.DEFAULT}
            style={{
              fontFamily: fonts.display,
              fontSize: 72,
              lineHeight: 76,
              letterSpacing: -2.5,
            }}
          >
            OATH
          </Text>
        </Animated.View>

        <View
          style={{
            marginTop: spacing[8],
            gap: spacing[3],
            alignItems: 'center',
          }}
        >
          <Text
            variant="h2"
            color={colors.fg.DEFAULT}
            style={{ textAlign: 'center', letterSpacing: -0.5 }}
          >
            the anti-feed morning ritual
          </Text>
          <Text
            variant="bodyLg"
            color={colors.fg.muted}
            style={{
              textAlign: 'center',
              paddingHorizontal: spacing[4],
              lineHeight: 26,
            }}
          >
            swear your hardest task at night. dismiss the alarm. one ritual
            plays. you start.
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
