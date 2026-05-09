import { Colors } from '@/constants/Colors';
import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

type Props = TextInputProps & {
  error?: string | null;
  containerStyle?: any;
};

export const InputWithValidation: React.FC<Props> = ({ error, containerStyle, ...props }) => {
  const placeholderColor = props.placeholderTextColor ?? Colors.textSecondary;
  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput
        {...props}
        placeholderTextColor={placeholderColor}
        style={[styles.input, props.style]}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignSelf: 'stretch' },
  input: {
    backgroundColor: '#F5F7FA',
    padding: 14,
    borderRadius: 12,
    color: Colors.text,
  },
  errorText: { color: Colors.warning, marginTop: 6, fontSize: 12 },
});

export default InputWithValidation;
