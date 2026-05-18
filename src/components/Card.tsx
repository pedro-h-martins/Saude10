import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import React from 'react';
import { StyleSheet, Text, View, ViewProps, ViewStyle } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  title?: string;
}

export const Card: React.FC<CardProps> = ({ children, style, title, ...props }) => {
  return (
    <View style={[styles.card, style]} {...props}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.shadow,
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
