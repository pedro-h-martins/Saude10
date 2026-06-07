import { Card } from '@/components/Card';
import { Typography } from '@/constants/Typography';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useSync } from '@/hooks/useSync';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Realm } from '@realm/react';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export const SymptomWidget = () => {
const { colors } = useTheme();
const [description, setDescription] = useState('');
const [isSubmitted, setIsSubmitted] = useState(false);
const { currentUser } = useAuth();
const user = currentUser;
const { save } = useSync();

const handleChange = (text: string) => {
setDescription(text);
setIsSubmitted(false);
};

const handleSubmit = () => {
if (!description || description.trim().length === 0) {
Alert.alert('Atenção', 'Descreva o sintoma antes de enviar.');
return;
}

if (!user) {
Alert.alert('Atenção', 'Faça login para registrar sintomas.');
return;
}

const newId = new Realm.BSON.ObjectId();
save('SymptomLog', newId.toHexString(), {
_id: newId,
description: description.trim(),
timestamp: new Date(),
userId: user._id,
});

setIsSubmitted(true);
setDescription('');
Alert.alert('Sucesso', 'Sintoma registrado!');
};

return (
<Card style={styles.container}>
<View style={styles.header}>
<View style={[styles.iconContainer, { backgroundColor: colors.timerBackground }]}>
<MaterialCommunityIcons name="stethoscope" size={20} color={colors.primary} />
</View>
<View style={styles.titleSection}>
<Text style={{ ...Typography.titleMedium, fontSize: 16, fontWeight: '700', color: colors.onSurface }}>Sintomas</Text>
<Text style={{ fontSize: 10, color: colors.onSurfaceVariant, letterSpacing: 0.5 }}>Registre sintomas físicos livres</Text>
</View>
</View>

<View style={styles.content}>
<View style={styles.inputContainer}>
<Text style={{ ...Typography.bodyMedium, fontSize: 14, color: colors.onSurface, marginBottom: 8 }}>Descreva o sintoma</Text>
<TextInput
style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.onSurface }]}
value={description}
onChangeText={handleChange}
placeholder="Ex.: dor de cabeça após exercício"
placeholderTextColor={colors.onSurfaceVariant}
multiline
/>
</View>

<TouchableOpacity
style={[styles.submitButton, { backgroundColor: colors.primary }, isSubmitted && { backgroundColor: colors.accent }]}
onPress={handleSubmit}
>
<Text style={{ color: colors.onPrimary, fontWeight: '700', fontSize: 14 }}>{isSubmitted ? 'ENVIADO ✓' : 'REGISTRAR'}</Text>
</TouchableOpacity>
</View>
</Card>
);
};

const styles = StyleSheet.create({
container: {
padding: 16,
marginTop: 18,
marginBottom: 18,
},
header: {
flexDirection: 'row',
alignItems: 'center',
marginBottom: 12,
},
iconContainer: {
width: 36,
height: 36,
borderRadius: 18,
justifyContent: 'center',
alignItems: 'center',
marginRight: 12,
},
titleSection: { flex: 1 },
content: { alignItems: 'center' },
inputContainer: {
width: '100%',
marginTop: 8,
},
input: {
width: '100%',
minHeight: 60,
borderRadius: 8,
padding: 12,
...Typography.bodyMedium,
fontSize: 14,
textAlignVertical: 'top',
},
submitButton: {
paddingVertical: 12,
paddingHorizontal: 24,
borderRadius: 25,
marginTop: 12,
width: '100%',
alignItems: 'center',
},
});
