import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
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
              <Text style={styles.title}>Compartilhe sua experiência</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.subtitle}>Ajude-nos a encontrar bugs e melhorar o aplicativo.</Text>

            <Text style={styles.sectionTitle}>Como você avalia o app?</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.ratingBadge,
                    rating === value && styles.ratingBadgeSelected,
                  ]}
                  onPress={() => setRating(value)}
                >
                  <Text style={[
                    styles.ratingLabel,
                    rating === value && styles.ratingLabelSelected,
                  ]}
                  >{value}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Tipo de feedback</Text>
            <View style={styles.buttonGroup}>
              {TYPES.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.typeButton,
                    type === option.value && styles.typeButtonSelected,
                  ]}
                  onPress={() => setType(option.value)}
                >
                  <Text style={[
                    styles.typeButtonText,
                    type === option.value && styles.typeButtonTextSelected,
                  ]}
                  >{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>O que aconteceu?</Text>
            <TextInput
              style={styles.input}
              placeholder="Descreva o bug ou a sugestão"
              placeholderTextColor={Colors.textSecondary}
              multiline
              value={feedback}
              onChangeText={setFeedback}
            />

            <Text style={styles.sectionTitle}>Onde ocorreu?</Text>
            <TextInput
              style={styles.input}
              placeholder="Tela ou ação opcional"
              placeholderTextColor={Colors.textSecondary}
              value={contextText}
              onChangeText={setContextText}
            />

            <TouchableOpacity
              style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit || submitting}
            >
              <Text style={styles.submitButtonText}>{submitting ? 'Enviando...' : 'Enviar feedback'}</Text>
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
    backgroundColor: Colors.background,
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
    color: Colors.text,
    flex: 1,
  },
  closeButton: {
    marginLeft: 12,
  },
  subtitle: {
    ...Typography.body,
    marginBottom: 20,
    color: Colors.textSecondary,
  },
  sectionTitle: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.text,
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
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  ratingBadgeSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  ratingLabel: {
    ...Typography.body,
    color: Colors.text,
  },
  ratingLabelSelected: {
    color: Colors.white,
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
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  typeButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeButtonText: {
    ...Typography.body,
    color: Colors.text,
  },
  typeButtonTextSelected: {
    color: Colors.white,
  },
  input: {
    minHeight: 80,
    padding: 12,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    color: Colors.text,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: Colors.textSecondary,
  },
  submitButtonText: {
    ...Typography.body,
    color: Colors.white,
  },
});
