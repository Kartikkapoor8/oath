import { type ReactNode, useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Button, Text } from '@/components/primitives';
import { colors, duration, easing, spacing, spring } from '@/lib/design-system';

export interface OnboardingShellProps {
  step: number;
  totalSteps?: number;
  onBack?: () => void;
  cta: {
    label: string;
    disabled?: boolean;
    loading?: boolean;
    onPress: () => void;
  };
  children: ReactNode;
}

export function OnboardingShell({
  step,
  totalSteps = 6,
  onBack,
  cta,
  children,
}: OnboardingShellProps) {
  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={{ flex: 1, backgroundColor: colors.bg.DEFAULT }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing[5],
          paddingTop: spacing[2],
          height: 44,
        }}
      >
        <Pressable
          onPress={() => (onBack ? onBack() : router.back())}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={{
            width: 32,
            height: 32,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronLeft color={colors.fg.muted} size={24} />
        </Pressable>

        <ProgressDots step={step} totalSteps={totalSteps} />

        <View style={{ width: 32 }} />
      </View>

      <View
        style={{
          flex: 1,
          paddingHorizontal: spacing[6],
          justifyContent: 'center',
        }}
      >
        {children}
      </View>

      <View
        style={{
          paddingHorizontal: spacing[5],
          paddingBottom: spacing[8],
        }}
      >
        <Button
          label={cta.label}
          disabled={cta.disabled || cta.loading}
          onPress={cta.onPress}
        />
      </View>
    </SafeAreaView>
  );
}

interface ProgressDotsProps {
  step: number;
  totalSteps: number;
}

function ProgressDots({ step, totalSteps }: ProgressDotsProps) {
  return (
    <View style={{ flexDirection: 'row', gap: spacing[2] }}>
      {Array.from({ length: totalSteps }).map((_, i) => (
        <Dot key={i} index={i + 1} step={step} />
      ))}
    </View>
  );
}

function Dot({ index, step }: { index: number; step: number }) {
  const isCurrent = index === step;
  const isComplete = index < step;
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    if (isCurrent) {
      scale.value = withSpring(1.35, spring.tight);
      opacity.value = withTiming(1, { duration: duration.base, easing: easing.out });
    } else if (isComplete) {
      scale.value = withTiming(1, { duration: duration.fast, easing: easing.out });
      opacity.value = withTiming(1, { duration: duration.fast, easing: easing.out });
    } else {
      scale.value = withTiming(1, { duration: duration.fast, easing: easing.out });
      opacity.value = withTiming(0.5, { duration: duration.fast, easing: easing.out });
    }
  }, [isCurrent, isComplete, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const dotColor = isCurrent
    ? colors.amber.bright
    : isComplete
      ? colors.amber.DEFAULT
      : colors.fg.dim;

  return (
    <Animated.View
      style={[
        {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: dotColor,
        },
        animatedStyle,
      ]}
    />
  );
}

interface OnboardingHeaderProps {
  caption: string;
  title: string;
  subtitle?: string;
}

export function OnboardingHeader({ caption, title, subtitle }: OnboardingHeaderProps) {
  return (
    <View style={{ marginBottom: spacing[8], gap: spacing[2] }}>
      <Text variant="caption" color={colors.fg.muted}>
        {caption}
      </Text>
      <Text variant="h1" color={colors.fg.DEFAULT}>
        {title}
      </Text>
      {subtitle ? (
        <Text
          variant="body"
          color={colors.fg.muted}
          style={{ marginTop: spacing[2] }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
