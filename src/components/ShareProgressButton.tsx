import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Share, StyleSheet, Text, TouchableOpacity, type StyleProp, type ViewStyle } from 'react-native';

type ShareProgressButtonProps = {
  message: string;
  title?: string;
  buttonLabel?: string;
  compact?: boolean;
  buttonStyle?: StyleProp<ViewStyle>;
};

const ShareProgressButton = ({
  message,
  title = 'Compartilhar progresso',
  buttonLabel = 'Compartilhar',
  compact = true,
  buttonStyle,
}: ShareProgressButtonProps) => {
  const { colors } = useTheme();
  const handleShare = async () => {
    try {
      await Share.share({ title, message });
    } catch (error) {
      console.error('Erro ao compartilhar progresso:', error);
    }
  };

  const flattenedStyle = StyleSheet.flatten(buttonStyle) as { backgroundColor?: string } | undefined;
  const hasColoredBg = !!(flattenedStyle && flattenedStyle.backgroundColor && flattenedStyle.backgroundColor !== colors.surfaceContainerLowest && flattenedStyle.backgroundColor !== 'transparent');
  const iconColor = hasColoredBg ? colors.onPrimary : colors.primary;

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant }, compact && styles.compactButton, buttonStyle]}
      onPress={handleShare}
      activeOpacity={0.75}
    >
      <Ionicons name="share-social-outline" size={compact ? 18 : 20} color={iconColor} />
      {!compact && <Text style={[styles.label, { color: colors.primary }, hasColoredBg && { color: colors.onPrimary }]}>{buttonLabel}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  compactButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    paddingHorizontal: 0,
    paddingVertical: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontWeight: '700',
    fontSize: 13,
  },
});

export default ShareProgressButton;
