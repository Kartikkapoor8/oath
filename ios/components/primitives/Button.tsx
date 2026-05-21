import { Pressable, type PressableProps, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors, radius, spacing, spring } from '@/lib/design-system';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'lg' | 'md' | 'sm';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const variantStyles: Record<
  ButtonVariant,
  { bg: string; border: string; fg: string }
> = {
  primary: {
    bg: colors.amber.DEFAULT,
    border: colors.amber.DEFAULT,
    fg: colors.bg.DEFAULT,
  },
  secondary: {
    bg: 'transparent',
    border: colors.amber.DEFAULT,
    fg: colors.amber.DEFAULT,
  },
  ghost: {
    bg: 'transparent',
    border: 'transparent',
    fg: colors.fg.muted,
  },
  destructive: {
    bg: colors.error,
    border: colors.error,
    fg: colors.fg.DEFAULT,
  },
};

const sizeStyles: Record<ButtonSize, { height: number; padX: number }> = {
  lg: { height: 56, padX: spacing[6] },
  md: { height: 48, padX: spacing[5] },
  sm: { height: 40, padX: spacing[4] },
};

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  fullWidth?: boolean;
}

export function Button({
  label,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  fullWidth = true,
  ...rest
}: ButtonProps) {
  const scale = useSharedValue(1);
  const v = variantStyles[variant];
  const s = sizeStyles[size];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        scale.value = withSpring(0.97, spring.tight);
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, spring.tight);
        rest.onPressOut?.(e);
      }}
      style={[
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderRadius: radius.xl,
          height: s.height,
          paddingHorizontal: s.padX,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'auto',
        },
        animatedStyle,
      ]}
    >
      <View>
        <Text variant="body" color={v.fg} style={{ fontWeight: '600' }}>
          {label}
        </Text>
      </View>
    </AnimatedPressable>
  );
}
