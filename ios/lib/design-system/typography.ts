export const fonts = {
  display: 'Geist-Bold',
  body: 'Geist-Regular',
  bodyMedium: 'Geist-Medium',
  bodySemibold: 'Geist-SemiBold',
  mono: 'GeistMono-Regular',
  monoMedium: 'GeistMono-Medium',
} as const;

export const fontSize = {
  displayXl: 48,
  display: 36,
  h1: 30,
  h2: 24,
  h3: 20,
  bodyLg: 18,
  body: 16,
  bodySm: 14,
  caption: 12,
} as const;

export const lineHeight = {
  displayXl: 52,
  display: 40,
  h1: 36,
  h2: 30,
  h3: 26,
  bodyLg: 26,
  body: 24,
  bodySm: 20,
  caption: 16,
} as const;

export const letterSpacing = {
  displayXl: -1.5,
  display: -1.0,
  h1: -0.75,
  h2: -0.5,
  h3: -0.25,
  body: 0,
  caption: 0.4,
} as const;

export type TypographyVariant = keyof typeof fontSize;
