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

  return (
    <TouchableOpacity
      style={[styles.button, compact && styles.compactButton, buttonStyle]}
      onPress={handleShare}
      activeOpacity={0.75}
    >
      <Ionicons name="share-social-outline" size={compact ? 16 : 20} color={Colors.white} />
      {!compact && <Text style={styles.label}>{buttonLabel}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  compactButton: {
    width: 36,
    height: 36,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  label: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
});

export default ShareProgressButton;
