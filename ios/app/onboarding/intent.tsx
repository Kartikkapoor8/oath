import { useState } from 'react';
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

      <View style={{ gap: spacing[3] }}>
        {OPTIONS.map((opt) => (
          <ModeCard
            key={opt.mode}
            option={opt}
            isSelected={selected === opt.mode}
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
  onPress: () => void;
}

function ModeCard({ option, isSelected, onPress }: ModeCardProps) {
  const { Icon } = option;
  const scale = useSharedValue(1);
  const borderOpacity = useSharedValue(0);
  const glow = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: `rgba(245, 158, 11, ${borderOpacity.value})`,
    shadowOpacity: glow.value,
  }));

  if (isSelected) {
    borderOpacity.value = withTiming(1, { duration: duration.fast, easing: easing.out });
    glow.value = withTiming(0.35, { duration: duration.base, easing: easing.out });
    scale.value = withSpring(1.01, spring.tight);
  } else {
    borderOpacity.value = withTiming(0, { duration: duration.fast, easing: easing.out });
    glow.value = withTiming(0, { duration: duration.fast, easing: easing.out });
    scale.value = withSpring(1, spring.tight);
  }

  return (
    <Animated.View
      style={[
        {
          backgroundColor: colors.bg.raised,
          borderRadius: radius['2xl'],
          borderWidth: 1,
          padding: spacing[5],
          shadowColor: colors.amber.DEFAULT,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 16,
        },
        animatedStyle,
      ]}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Select ${option.title}`}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
          <Icon
            color={isSelected ? colors.amber.bright : colors.amber.DEFAULT}
            size={24}
            strokeWidth={2}
          />
          <Text variant="h3" color={colors.fg.DEFAULT}>
            {option.title}
          </Text>
        </View>
        <Text
          variant="bodySm"
          color={colors.fg.muted}
          style={{ marginTop: spacing[2] }}
        >
          {option.description}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
