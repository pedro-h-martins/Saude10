import { Typography, TypographyColors } from '@/constants/Typography';
import { useTheme } from '@/hooks/useTheme';
import React from 'react';
import { StyleSheet, Text, View, ViewProps, ViewStyle } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  title?: string;
}

export const Card: React.FC<CardProps> = ({ children, style, title, ...props }) => {
  const { colors } = useTheme();
  const textStyles = TypographyColors(colors);

  return (
    <View style={[styles.card, { backgroundColor: colors.white, shadowColor: colors.shadow, borderColor: colors.border }, style]} {...props}>
      {title ? <Text style={[styles.title, textStyles.h3, { color: colors.cardTitle }]}>{title}</Text> : null}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  title: {
    ...Typography.h3,
    marginBottom: 8,
  },
});
