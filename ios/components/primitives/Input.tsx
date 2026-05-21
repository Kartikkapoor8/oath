import { useState } from 'react';
import {
  TextInput as RNTextInput,
  type TextInputProps as RNTextInputProps,
  View,
} from 'react-native';
import { colors, radius, spacing, fonts, fontSize } from '@/lib/design-system';

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
        backgroundColor: colors.bg.raised,
        borderColor: focused ? colors.amber.DEFAULT : colors.border.subtle,
        borderWidth: 1,
        borderRadius: radius.xl,
        paddingHorizontal: spacing[4],
        height: 56,
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
            fontSize: fontSize.body,
          },
          style,
        ]}
      />
    </View>
  );
}
