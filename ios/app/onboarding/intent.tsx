import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Target, Dumbbell, Anchor } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { OnboardingShell, OnboardingHeader } from '@/components/onboarding/OnboardingShell';
import { Text } from '@/components/primitives';
import { colors, duration, easing, radius, spacing, spring } from '@/lib/design-system';
import { setPreferences } from '@/lib/storage/preferences';
import type { Mode } from '@/lib/api/oath-engine';

interface ModeOption {
  mode: Mode;
  title: string;
  description: string;
  Icon: typeof Target;
}

const OPTIONS: ModeOption[] = [
  {
    mode: 'hardest_work',
    title: 'the hardest work',
    description:
      'the one task you keep putting off. the painful project. the difficult conversation.',
    Icon: Target,
  },
  {
    mode: 'gym_now',
    title: 'the morning lift',
    description: 'training, gym, run, anything physical that has to happen first.',
    Icon: Dumbbell,
  },
  {
    mode: 'grounding_phrases',
    title: 'the grounding moment',
    description: 'no work yet. just the ritual. center yourself before the day begins.',
    Icon: Anchor,
  },
];

export default function Intent() {
  const [selected, setSelected] = useState<Mode | null>(null);

  const handleNext = async () => {
    if (!selected) return;
    await setPreferences({ defaultMode: selected });
    router.push('/onboarding/voice');
  };

  return (
    <OnboardingShell
      step={3}
      cta={{ label: 'next', disabled: !selected, onPress: handleNext }}
    >
      <OnboardingHeader
        caption="STEP 3 OF 6"
        title="What's your morning frog?"
        subtitle="the kind of work you want to attack first. you can change this anytime."
      />

      <View style={{ gap: spacing[4] }}>
        {OPTIONS.map((opt) => (
          <ModeCard
            key={opt.mode}
            option={opt}
            isSelected={selected === opt.mode}
            anySelected={selected !== null}
            onPress={() => setSelected(opt.mode)}
          />
        ))}
      </View>
    </OnboardingShell>
  );
}

interface ModeCardProps {
  option: ModeOption;
  isSelected: boolean;
  anySelected: boolean;
  onPress: () => void;
}

function ModeCard({ option, isSelected, anySelected, onPress }: ModeCardProps) {
  const { Icon } = option;
  const scale = useSharedValue(1);
  const borderOpacity = useSharedValue(0);
  const glow = useSharedValue(0);
  const opacity = useSharedValue(1);

  // Drive the animation off prop changes via useEffect, not on every render.
  useEffect(() => {
    if (isSelected) {
      borderOpacity.value = withTiming(1, { duration: duration.fast, easing: easing.out });
      glow.value = withTiming(0.45, { duration: duration.base, easing: easing.out });
      scale.value = withSpring(1.02, spring.tight);
      opacity.value = withTiming(1, { duration: duration.fast });
    } else {
      borderOpacity.value = withTiming(0, { duration: duration.fast, easing: easing.out });
      glow.value = withTiming(0, { duration: duration.fast, easing: easing.out });
      scale.value = withSpring(1, spring.tight);
      opacity.value = withTiming(anySelected ? 0.55 : 1, {
        duration: duration.fast,
        easing: easing.out,
      });
    }
  }, [isSelected, anySelected, scale, borderOpacity, glow, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: `rgba(245, 158, 11, ${borderOpacity.value})`,
    shadowOpacity: glow.value,
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          backgroundColor: colors.bg.raised,
          borderRadius: radius['2xl'],
          borderWidth: 2,
          padding: spacing[6],
          shadowColor: colors.amber.DEFAULT,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 20,
        },
        animatedStyle,
      ]}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Select ${option.title}`}
        accessibilityState={{ selected: isSelected }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing[3],
          }}
        >
          <Icon
            color={isSelected ? colors.amber.bright : colors.amber.DEFAULT}
            size={32}
            strokeWidth={1.75}
          />
          <Text variant="h2" color={colors.fg.DEFAULT}>
            {option.title}
          </Text>
        </View>
        <Text
          variant="bodySm"
          color={colors.fg.muted}
          style={{ marginTop: spacing[3], lineHeight: 22 }}
        >
          {option.description}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
