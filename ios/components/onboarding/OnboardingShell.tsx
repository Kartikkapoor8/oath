import { type ReactNode, useEffect } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import Animated, {
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  cancelAnimation,
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
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

        <Pressable
          onPress={Keyboard.dismiss}
          accessible={false}
          style={{
            flex: 1,
            paddingHorizontal: spacing[6],
            paddingTop: spacing[10],
          }}
        >
          {children}
        </Pressable>

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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface ProgressDotsProps {
  step: number;
  totalSteps: number;
}

function ProgressDots({ step, totalSteps }: ProgressDotsProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: spacing[3],
        alignItems: 'center',
      }}
    >
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
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    cancelAnimation(scale);
    if (isCurrent) {
      // landing scale, then a slow living-pulse so the dot feels alive
      scale.value = withSpring(1.35, spring.tight);
      opacity.value = withTiming(1, { duration: duration.base, easing: easing.out });
      // chained breathing pulse 1.35 ↔ 1.5
      scale.value = withRepeat(
        withTiming(1.5, {
          duration: 1100,
          easing: Easing.inOut(Easing.cubic),
        }),
        -1,
        true,
      );
    } else if (isComplete) {
      scale.value = withTiming(1, { duration: duration.fast, easing: easing.out });
      opacity.value = withTiming(1, { duration: duration.fast, easing: easing.out });
    } else {
      scale.value = withTiming(1, { duration: duration.fast, easing: easing.out });
      opacity.value = withTiming(0.45, { duration: duration.fast, easing: easing.out });
    }
    return () => cancelAnimation(scale);
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
          width: 6,
          height: 6,
          borderRadius: 3,
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
    <View style={{ marginBottom: spacing[10], gap: spacing[3] }}>
      <Text variant="caption" color={colors.fg.muted}>
        {caption}
      </Text>
      <Text
        variant="display"
        color={colors.fg.DEFAULT}
        style={{ letterSpacing: -1.0 }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          variant="bodyLg"
          color={colors.fg.muted}
          style={{ marginTop: spacing[2], lineHeight: 26 }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
