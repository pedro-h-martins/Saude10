import { Typography } from '@/constants/Typography';
import { useTheme } from '@/context/ThemeContext';
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
const { colors } = useTheme();
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
<View style={[styles.container, { backgroundColor: colors.background }]}>
<ScrollView contentContainerStyle={styles.content}>
<View style={styles.header}>
<Text style={{ ...Typography.titleMedium, fontSize: 20, color: colors.onSurface, flex: 1 }}>Compartilhe sua experiência</Text>
<TouchableOpacity onPress={onClose} style={styles.closeButton}>
<Ionicons name="close" size={24} color={colors.onSurface} />
</TouchableOpacity>
</View>

<Text style={{ ...Typography.bodyMedium, marginBottom: 20, color: colors.onSurfaceVariant }}>Ajude-nos a encontrar bugs e melhorar o aplicativo.</Text>

<Text style={{ ...Typography.bodyMedium, fontWeight: '600', marginBottom: 8, color: colors.onSurface }}>Como você avalia o app?</Text>
<View style={styles.ratingRow}>
{[1, 2, 3, 4, 5].map((value) => (
<TouchableOpacity
key={value}
style={[
styles.ratingBadge,
{ borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLowest },
rating === value && { backgroundColor: colors.primary, borderColor: colors.primary },
]}
onPress={() => setRating(value)}
>
<Text
style={[
{ ...Typography.bodyMedium, color: colors.onSurface },
rating === value && { color: colors.surfaceContainerLowest },
]}
>{value}</Text>
</TouchableOpacity>
))}
</View>

<Text style={{ ...Typography.bodyMedium, fontWeight: '600', marginBottom: 8, color: colors.onSurface }}>Tipo de feedback</Text>
<View style={styles.buttonGroup}>
{TYPES.map((option) => (
<TouchableOpacity
key={option.value}
style={[
styles.typeButton,
{ borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLowest },
type === option.value && { backgroundColor: colors.primary, borderColor: colors.primary },
]}
onPress={() => setType(option.value)}
>
<Text
style={[
{ ...Typography.bodyMedium, color: colors.onSurface },
type === option.value && { color: colors.surfaceContainerLowest },
]}
>{option.label}</Text>
</TouchableOpacity>
))}
</View>

<Text style={{ ...Typography.bodyMedium, fontWeight: '600', marginBottom: 8, color: colors.onSurface }}>O que aconteceu?</Text>
<TextInput
style={[styles.input, { borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLowest, color: colors.onSurface }]}
placeholder="Descreva o bug ou a sugestão"
placeholderTextColor={colors.onSurfaceVariant}
multiline
value={feedback}
onChangeText={setFeedback}
/>

<Text style={{ ...Typography.bodyMedium, fontWeight: '600', marginBottom: 8, color: colors.onSurface }}>Onde ocorreu?</Text>
<TextInput
style={[styles.input, { borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLowest, color: colors.onSurface }]}
placeholder="Tela ou ação opcional"
placeholderTextColor={colors.onSurfaceVariant}
value={contextText}
onChangeText={setContextText}
/>

<TouchableOpacity
style={[styles.submitButton, { backgroundColor: colors.primary }, !canSubmit && { backgroundColor: colors.onSurfaceVariant }]}
onPress={handleSubmit}
disabled={!canSubmit || submitting}
>
<Text style={{ ...Typography.bodyMedium, color: colors.surfaceContainerLowest }}>{submitting ? 'Enviando...' : 'Enviar feedback'}</Text>
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
closeButton: {
marginLeft: 12,
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
justifyContent: 'center',
alignItems: 'center',
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
alignItems: 'center',
},
input: {
minHeight: 80,
padding: 12,
marginBottom: 16,
borderRadius: 12,
borderWidth: 1,
textAlignVertical: 'top',
},
submitButton: {
marginTop: 8,
paddingVertical: 14,
borderRadius: 14,
alignItems: 'center',
},
});
