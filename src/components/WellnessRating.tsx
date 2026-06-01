import { Typography, TypographyColors } from '@/constants/Typography';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface WellnessRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  disabled?: boolean;
}

const RATINGS = [
  { value: 1, icon: 'sad-outline', label: 'Péssimo' },
  { value: 2, icon: 'trending-down-outline', label: 'Mal' },
  { value: 3, icon: 'reorder-two-outline', label: 'Ok' },
  { value: 4, icon: 'happy-outline', label: 'Bem' },
  { value: 5, icon: 'star-outline', label: 'Ótimo' },
];

export const WellnessRating: React.FC<WellnessRatingProps> = ({
  rating,
  onRatingChange,
  disabled = false,
}) => {
  const { colors } = useTheme();
  const textStyles = TypographyColors(colors);

  return (
    <View style={styles.container}>
      {RATINGS.map((item) => {
        const isSelected = rating === item.value;
        return (
          <TouchableOpacity
            key={item.value}
            style={[
              styles.ratingButton,
              isSelected && { backgroundColor: colors.timerBackground },
              { borderColor: isSelected ? colors.primary : colors.border },
            ]}
            onPress={() => !disabled && onRatingChange(item.value)}
            disabled={disabled}
          >
            <Ionicons
              name={item.icon as any}
              size={28}
              color={isSelected ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.label,
                textStyles.caption,
                { color: isSelected ? colors.primary : colors.textSecondary }
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 10,
  },
  ratingButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    width: '18%',
  },
  label: {
    ...Typography.body,
    fontSize: 10,
    marginTop: 4,
  },
  selectedButton: {},
  selectedLabel: {
    fontWeight: 'bold',
  },
  unselectedLabel: {},
});