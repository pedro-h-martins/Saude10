import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

type Props = TextInputProps & {
  error?: string | null;
  containerStyle?: any;
};

export const InputWithValidation: React.FC<Props> = ({ error, containerStyle, ...props }) => {
  const { colors } = useTheme();
  const placeholderColor = props.placeholderTextColor ?? colors.onSurfaceVariant;
  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput
        {...props}
        placeholderTextColor={placeholderColor}
        style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.onSurface }, props.style]}
      />
      {error ? <Text style={[styles.errorText, { color: colors.warning }]}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignSelf: 'stretch' },
  input: {
    padding: 14,
    borderRadius: 12,
  },
  errorText: { marginTop: 6, fontSize: 12 },
});
