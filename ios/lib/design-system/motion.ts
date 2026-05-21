import { Easing } from 'react-native-reanimated';

export const duration = {
  instant: 100,
  fast: 200,
  base: 300,
  slow: 500,
  slower: 800,
} as const;

export const easing = {
  out: Easing.out(Easing.cubic),
  inOut: Easing.inOut(Easing.cubic),
  in: Easing.in(Easing.cubic),
} as const;

export const spring = {
  tight: { damping: 18, stiffness: 280, mass: 0.6 },
  soft: { damping: 22, stiffness: 180, mass: 0.8 },
} as const;
