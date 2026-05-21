import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import {
  fonts,
  fontSize,
  lineHeight,
  letterSpacing,
  colors,
} from '@/lib/design-system';

export type TextVariant =
  | 'displayXl'
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bodyLg'
  | 'body'
  | 'bodySm'
  | 'caption'
  | 'mono';

const variantToFont: Record<TextVariant, string> = {
  displayXl: fonts.display,
  display: fonts.display,
  h1: fonts.bodySemibold,
  h2: fonts.bodySemibold,
  h3: fonts.bodySemibold,
  bodyLg: fonts.body,
  body: fonts.body,
  bodySm: fonts.body,
  caption: fonts.monoMedium,
  mono: fonts.mono,
};

const variantToSize: Record<TextVariant, number> = {
  displayXl: fontSize.displayXl,
  display: fontSize.display,
  h1: fontSize.h1,
  h2: fontSize.h2,
  h3: fontSize.h3,
  bodyLg: fontSize.bodyLg,
  body: fontSize.body,
  bodySm: fontSize.bodySm,
  caption: fontSize.caption,
  mono: fontSize.bodySm,
};

const variantToLineHeight: Record<TextVariant, number> = {
  displayXl: lineHeight.displayXl,
  display: lineHeight.display,
  h1: lineHeight.h1,
  h2: lineHeight.h2,
  h3: lineHeight.h3,
  bodyLg: lineHeight.bodyLg,
  body: lineHeight.body,
  bodySm: lineHeight.bodySm,
  caption: lineHeight.caption,
  mono: lineHeight.bodySm,
};

const variantToLetterSpacing: Record<TextVariant, number> = {
  displayXl: letterSpacing.displayXl,
  display: letterSpacing.display,
  h1: letterSpacing.h1,
  h2: letterSpacing.h2,
  h3: letterSpacing.h3,
  bodyLg: letterSpacing.body,
  body: letterSpacing.body,
  bodySm: letterSpacing.body,
  caption: letterSpacing.caption,
  mono: letterSpacing.body,
};

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: string;
  uppercase?: boolean;
}

export function Text({
  variant = 'body',
  color,
  uppercase,
  style,
  children,
  ...rest
}: TextProps) {
  const resolvedColor =
    color ?? (variant === 'caption' ? colors.amber.dim : colors.fg.DEFAULT);

  return (
    <RNText
      {...rest}
      style={[
        {
          fontFamily: variantToFont[variant],
          fontSize: variantToSize[variant],
          lineHeight: variantToLineHeight[variant],
          letterSpacing: variantToLetterSpacing[variant],
          color: resolvedColor,
          textTransform: uppercase || variant === 'caption' ? 'uppercase' : 'none',
        },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}
