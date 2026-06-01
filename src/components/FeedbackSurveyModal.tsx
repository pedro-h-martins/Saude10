import { Typography } from '@/constants/Typography';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    rating: number;
    feedback: string;
    type: 'bug' | 'suggestion';
    context?: string;
  }) => Promise<void>;
};

const TYPES = [
  { label: 'Bug', value: 'bug' as const },
  { label: 'Sugestão', value: 'suggestion' as const },
];

export function FeedbackSurveyModal({ visible, onClose, onSubmit }: Props) {
  const [rating, setRating] = useState(0);
  const [type, setType] = useState<'bug' | 'suggestion'>('bug');
  const [feedback, setFeedback] = useState('');
  const [contextText, setContextText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => rating > 0 && feedback.trim().length > 0, [rating, feedback]);

  const { colors } = useTheme();

  const handleSubmit = async () => {
    if (!canSubmit || submitting) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        rating,
        feedback: feedback.trim(),
        type,
        context: contextText.trim() || undefined,
      });
      setRating(0);
      setType('bug');
      setFeedback('');
      setContextText('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>Compartilhe sua experiência</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Ajude-nos a encontrar bugs e melhorar o aplicativo.</Text>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Como você avalia o app?</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.ratingBadge,
                    { borderColor: colors.border, backgroundColor: colors.white },
                    rating === value && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setRating(value)}
                >
                  <Text style={[
                    styles.ratingLabel,
                    { color: colors.text },
                    rating === value && { color: colors.white },
                  ]}>{value}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tipo de feedback</Text>
            <View style={styles.buttonGroup}>
              {TYPES.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                        styles.typeButton,
                        { borderColor: colors.border, backgroundColor: colors.white },
                        type === option.value && { backgroundColor: colors.primary, borderColor: colors.primary },
                      ]}
                  onPress={() => setType(option.value)}
                >
                      <Text style={[
                        styles.typeButtonText,
                        { color: colors.text },
                        type === option.value && { color: colors.white },
                      ]}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>O que aconteceu?</Text>
            <TextInput
              style={styles.input}
              placeholder="Descreva o bug ou a sugestão"
              placeholderTextColor={colors.textSecondary}
              multiline
              value={feedback}
              onChangeText={setFeedback}
            />

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Onde ocorreu?</Text>
            <TextInput
              style={styles.input}
              placeholder="Tela ou ação opcional"
              placeholderTextColor={colors.textSecondary}
              value={contextText}
              onChangeText={setContextText}
            />

            <TouchableOpacity
              style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled, { backgroundColor: colors.primary }]}
              onPress={handleSubmit}
              disabled={!canSubmit || submitting}
            >
              <Text style={[styles.submitButtonText, { color: colors.white }]}>{submitting ? 'Enviando...' : 'Enviar feedback'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  container: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  content: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    ...Typography.h3,
    fontSize: 20,
    flex: 1,
    flex: 1,
  },
  closeButton: {
    marginLeft: 12,
  },
  subtitle: {
    ...Typography.body,
    marginBottom: 20,
    
  },
  sectionTitle: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: 8,
    
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  ratingBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  ratingBadgeSelected: {
    backgroundColor: '#0052D4',
    borderColor: '#0052D4',
  },
  ratingLabel: {
    ...Typography.body,
    color: '#1C1C1C',
  },
  ratingLabelSelected: {
    color: '#FFFFFF',
  },
  buttonGroup: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  typeButtonSelected: {
    backgroundColor: '#0052D4',
    borderColor: '#0052D4',
  },
  typeButtonText: {
    ...Typography.body,
    color: '#1C1C1C',
  },
  typeButtonTextSelected: {
    color: '#FFFFFF',
  },
  input: {
    minHeight: 80,
    padding: 12,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    backgroundColor: '#FFFFFF',
    color: '#1C1C1C',
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#0052D4',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  submitButtonText: {
    ...Typography.body,
    color: '#FFFFFF',
  },
});
