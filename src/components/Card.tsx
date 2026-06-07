import { useTheme } from '@/context/ThemeContext';
import { Typography } from '@/constants/Typography';
import React from 'react';
import { StyleSheet, Text, View, type ViewProps, type ViewStyle, type FlexStyle } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  title?: string;
}

export const Card: React.FC<CardProps> = ({ children, style, title, ...props }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest }, style]} {...props}>
      {title ? <Text style={[styles.title, { color: colors.onSurface }]}>{title}</Text> : null}
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
    ...Typography.titleMedium,
    marginBottom: 8,
  },
});
