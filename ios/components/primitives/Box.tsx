import { View } from 'react-native';
import type { ComponentProps } from 'react';

export type BoxProps = ComponentProps<typeof View>;

export function Box(props: BoxProps) {
  return <View {...props} />;
}
