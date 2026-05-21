import { View, type ViewProps } from 'react-native';
import { colors, radius, spacing } from '@/lib/design-system';

export interface CardProps extends ViewProps {
  elevated?: boolean;
  padding?: keyof typeof spacing;
}

export function Card({
  elevated = false,
  padding = 6,
  style,
  children,
  ...rest
}: CardProps) {
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: elevated ? colors.bg.elevated : colors.bg.raised,
          borderColor: colors.border.subtle,
          borderWidth: 1,
          borderRadius: radius['2xl'],
          padding: spacing[padding],
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
