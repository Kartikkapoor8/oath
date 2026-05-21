import { useState } from 'react';
import {
  TextInput as RNTextInput,
  type TextInputProps as RNTextInputProps,
  View,
} from 'react-native';
import { colors, fonts, fontSize, radius, spacing } from '@/lib/design-system';

export interface InputProps extends RNTextInputProps {
  fullWidth?: boolean;
}

export function Input({
  fullWidth = true,
  style,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={{
        backgroundColor: colors.bg.elevated,
        borderRadius: radius['2xl'],
        borderColor: focused ? colors.amber.glow : colors.border.subtle,
        borderWidth: 1,
        // amber-tinted lift on focus, no border-flashing
        shadowColor: colors.amber.DEFAULT,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: focused ? 18 : 0,
        shadowOpacity: focused ? 0.18 : 0,
        paddingHorizontal: spacing[5],
        // single-line accent bar at the bottom, like Linear's inputs
        borderBottomColor: focused ? colors.amber.DEFAULT : colors.border.subtle,
        borderBottomWidth: focused ? 2 : 1,
        height: 64,
        justifyContent: 'center',
        alignSelf: fullWidth ? 'stretch' : 'auto',
      }}
    >
      <RNTextInput
        {...rest}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        placeholderTextColor={colors.fg.dim}
        selectionColor={colors.amber.DEFAULT}
        keyboardAppearance="dark"
        style={[
          {
            color: colors.fg.DEFAULT,
            fontFamily: fonts.body,
            fontSize: fontSize.bodyLg,
            letterSpacing: -0.2,
            paddingVertical: 0,
          },
          style,
        ]}
      />
    </View>
  );
}
