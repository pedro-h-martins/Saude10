import { Colors } from '@/constants/Colors';
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
  const handleShare = async () => {
    try {
      await Share.share({ title, message });
    } catch (error) {
      console.error('Erro ao compartilhar progresso:', error);
    }
  };

  const iconColor = compact ? Colors.primary : Colors.primary;

  return (
    <TouchableOpacity
      style={[styles.button, compact && styles.compactButton, buttonStyle]}
      onPress={handleShare}
      activeOpacity={0.75}
    >
      <Ionicons name="share-social-outline" size={compact ? 18 : 20} color={iconColor} />
      {!compact && <Text style={styles.label}>{buttonLabel}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
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
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
});

export default ShareProgressButton;
