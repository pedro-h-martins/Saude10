import { Card } from '@/components/Card';
import { WellnessRating } from '@/components/WellnessRating';
import { Typography } from '@/constants/Typography';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@/context/RealmProvider';
import { useTheme } from '@/context/ThemeContext';
import { useSync } from '@/hooks/useSync';
import { WellnessLog } from '@/models/WellnessLog';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Realm } from '@realm/react';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export const WellnessWidget = () => {
const { colors } = useTheme();
const { currentUser: user } = useAuth();
const { save } = useSync();

const [rating, setRating] = useState(0);
const [note, setNote] = useState('');
const [isSubmitted, setIsSubmitted] = useState(false);

const { today, tomorrow } = useMemo(() => {
const t = new Date();
t.setHours(0, 0, 0, 0);
const tm = new Date(t);
tm.setDate(tm.getDate() + 1);
return { today: t, tomorrow: tm };
}, []);

const todayLogs = useQuery(WellnessLog, (collection) =>
collection.filtered('timestamp >= $0 AND timestamp < $1', today, tomorrow),
[today, tomorrow]
);

useEffect(() => {
if (todayLogs.length > 0 && !isSubmitted && rating === 0) {
const sorted = todayLogs.sorted('timestamp', true);
const latest = sorted[0];
setRating(latest.rating);
setNote(latest.notes || '');
setIsSubmitted(true);
}
}, [todayLogs, isSubmitted, rating]);

const handleRatingChange = (newRating: number) => {
setRating(newRating);
setIsSubmitted(false);
};

const handleNoteChange = (text: string) => {
setNote(text);
setIsSubmitted(false);
};

const handleSubmit = () => {
if (rating === 0) {
Alert.alert('Atenção', 'Por favor, selecione como você se sente.');
return;
}

if (!user) {
Alert.alert('Atenção', 'Faça login para registrar seu bem-estar.');
return;
}

const existingToday = todayLogs.sorted('timestamp', true)[0];
const logId = existingToday ? existingToday._id : new Realm.BSON.ObjectId();

save('WellnessLog', logId.toHexString(), {
_id: logId,
rating: rating,
notes: note,
timestamp: new Date(),
userId: user._id,
});

setIsSubmitted(true);
Alert.alert('Sucesso', 'Seu bem-estar foi registrado!');
};

return (
<Card style={styles.container}>
<View style={styles.header}>
<View style={[styles.iconContainer, { backgroundColor: colors.timerBackground }]}>
<MaterialCommunityIcons name="emoticon-outline" size={20} color={colors.primary} />
</View>
<View style={styles.titleSection}>
<Text style={{ ...Typography.titleMedium, fontSize: 16, fontWeight: '700', color: colors.onSurface }}>Bem-estar</Text>
<Text style={{ fontSize: 10, color: colors.onSurfaceVariant, letterSpacing: 0.5 }}>COMO VOCÊ SE SENTE HOJE?</Text>
</View>
</View>

<View style={styles.content}>
<WellnessRating
rating={rating}
onRatingChange={handleRatingChange}
/>

<View style={[styles.noteContainer, { borderTopColor: colors.placeholderBackground }]}>
<Text style={{ ...Typography.bodyMedium, fontSize: 14, color: colors.onSurface, marginBottom: 8 }}>O que você fez ou comeu hoje?</Text>
<TextInput
style={[styles.noteInput, { backgroundColor: colors.inputBackground, color: colors.onSurface }]}
value={note}
onChangeText={handleNoteChange}
placeholder="Atividade, comida, etc..."
placeholderTextColor={colors.onSurfaceVariant}
multiline
/>
</View>

<TouchableOpacity
style={[styles.submitButton, { backgroundColor: colors.primary }, isSubmitted && { backgroundColor: colors.accent }]}
onPress={handleSubmit}
disabled={isSubmitted && rating > 0}
>
<Text style={{ color: colors.onPrimary, fontWeight: '700', fontSize: 14, letterSpacing: 1 }}>
{isSubmitted ? 'ENVIADO ✓' : 'ENVIAR'}
</Text>
</TouchableOpacity>

{isSubmitted && (
<Text style={{ ...Typography.bodyMedium, marginTop: 8, fontSize: 12, color: colors.accent, fontWeight: '500' }}>
Obrigado por registrar seu bem-estar!
</Text>
)}
</View>
</Card>
);
};

const styles = StyleSheet.create({
container: { padding: 16 },
header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
iconContainer: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
titleSection: { flex: 1 },
content: { alignItems: 'center' },
noteContainer: { width: '100%', marginTop: 16, borderTopWidth: 1, paddingTop: 16 },
noteInput: { width: '100%', minHeight: 60, borderRadius: 8, padding: 12, ...Typography.bodyMedium, fontSize: 14, textAlignVertical: 'top' },
submitButton: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 25, marginTop: 16, width: '100%', alignItems: 'center' },
});
