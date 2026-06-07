import { Typography } from '@/constants/Typography';
import { useTheme } from '@/context/ThemeContext';
import { useMealRecord } from '@/hooks/useMealRecord';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card } from './Card';

export function NutritionWidget() {
const { colors } = useTheme();
const { mealLogs, totals, addMeal } = useMealRecord();
const [modalVisible, setModalVisible] = useState(false);
const [name, setName] = useState('');
const [mealType, setMealType] = useState('Café da manhã');
const [calories, setCalories] = useState('');
const [protein, setProtein] = useState('');
const [carbs, setCarbs] = useState('');
const [fat, setFat] = useState('');

const mealTypes = ['Café da manhã', 'Almoço', 'Jantar', 'Lanche'];

const handleSave = () => {
if (!name || !calories) return;

addMeal({
name,
mealType,
calories: parseInt(calories, 10),
protein: parseFloat(protein) || 0,
carbs: parseFloat(carbs) || 0,
fat: parseFloat(fat) || 0,
timestamp: new Date()
});

setName('');
setCalories('');
setProtein('');
setCarbs('');
setFat('');
setModalVisible(false);
};

return (
<Card title="Diário de Alimentação">
<View style={styles.totalsContainer}>
<View style={styles.totalBox}>
<Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.primary }}>{totals.calories}</Text>
<Text style={{ ...Typography.labelMedium, color: colors.onSurfaceVariant }}>kcal</Text>
</View>
<View style={styles.macrosContainer}>
<Text style={{ ...Typography.bodyMedium, color: colors.onSurfaceVariant }}>P: {totals.protein.toFixed(1)}g</Text>
<Text style={{ ...Typography.bodyMedium, color: colors.onSurfaceVariant }}>C: {totals.carbs.toFixed(1)}g</Text>
<Text style={{ ...Typography.bodyMedium, color: colors.onSurfaceVariant }}>G: {totals.fat.toFixed(1)}g</Text>
</View>
</View>

<Pressable style={[styles.addButton, { backgroundColor: colors.primaryContainer }]} onPress={() => setModalVisible(true)}>
<Text style={{ color: colors.primary, fontWeight: '600' }}>+ Adicionar Refeição</Text>
</Pressable>

{mealLogs.length > 0 && (
<View style={styles.listContainer}>
{mealLogs.slice(0, 3).map((meal, idx) => (
<View key={idx} style={[styles.mealItem, { borderBottomColor: colors.outlineVariant }]}>
<View>
<Text style={{ ...Typography.bodyMedium, fontWeight: '500', color: colors.onSurface }}>{meal.name}</Text>
<Text style={{ ...Typography.labelMedium, color: colors.onSurfaceVariant }}>{meal.mealType}</Text>
</View>
<Text style={{ ...Typography.bodyMedium, color: colors.onSurface }}>{meal.calories} kcal</Text>
</View>
))}
</View>
)}

<Modal visible={modalVisible} animationType="slide" transparent>
<View style={styles.modalOverlay}>
<View style={[styles.modalContent, { backgroundColor: colors.background }]}>
<Text style={{ ...Typography.titleLarge, marginBottom: 16, color: colors.onSurface }}>Nova Refeição</Text>
<ScrollView>
<TextInput
style={[styles.input, { borderColor: colors.outlineVariant, color: colors.onSurface }]}
placeholder="Nome do alimento"
value={name}
onChangeText={setName}
placeholderTextColor={colors.onSurfaceVariant}
/>

<View style={styles.typeSelector}>
{mealTypes.map(t => (
<Pressable
key={t}
style={[styles.typeButton, { borderColor: colors.outlineVariant }, mealType === t && { backgroundColor: colors.primary, borderColor: colors.primary }]}
onPress={() => setMealType(t)}
>
<Text style={[{ ...Typography.labelMedium, color: colors.onSurface }, mealType === t && { color: colors.surfaceContainerLowest, fontWeight: 'bold' }]}>{t}</Text>
</Pressable>
))}
</View>

<TextInput
style={[styles.input, { borderColor: colors.outlineVariant, color: colors.onSurface }]}
placeholder="Calorias (kcal)"
keyboardType="numeric"
value={calories}
onChangeText={setCalories}
placeholderTextColor={colors.onSurfaceVariant}
/>
<View style={styles.row}>
<TextInput
style={[styles.input, { flex: 1, marginRight: 8, borderColor: colors.outlineVariant, color: colors.onSurface }]}
placeholder="Proteínas (g)"
keyboardType="numeric"
value={protein}
onChangeText={setProtein}
placeholderTextColor={colors.onSurfaceVariant}
/>
<TextInput
style={[styles.input, { flex: 1, marginRight: 8, borderColor: colors.outlineVariant, color: colors.onSurface }]}
placeholder="Carbos (g)"
keyboardType="numeric"
value={carbs}
onChangeText={setCarbs}
placeholderTextColor={colors.onSurfaceVariant}
/>
<TextInput
style={[styles.input, { flex: 1, borderColor: colors.outlineVariant, color: colors.onSurface }]}
placeholder="Gorduras (g)"
keyboardType="numeric"
value={fat}
onChangeText={setFat}
placeholderTextColor={colors.onSurfaceVariant}
/>
</View>

<View style={styles.actions}>
<Pressable style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
<Text style={{ color: colors.onSurfaceVariant, fontWeight: '600' }}>Cancelar</Text>
</Pressable>
<Pressable style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave}>
<Text style={{ color: colors.surfaceContainerLowest, fontWeight: '600' }}>Salvar</Text>
</Pressable>
</View>
</ScrollView>
</View>
</View>
</Modal>
</Card>
);
}

const styles = StyleSheet.create({
totalsContainer: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
marginBottom: 16,
},
totalBox: {
alignItems: 'center',
},
macrosContainer: {
flexDirection: 'row',
gap: 8,
},
addButton: {
padding: 12,
borderRadius: 8,
alignItems: 'center',
marginBottom: 16,
},
listContainer: {
gap: 8,
},
mealItem: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
paddingVertical: 8,
borderBottomWidth: 1,
},
modalOverlay: {
flex: 1,
backgroundColor: 'rgba(0,0,0,0.5)',
justifyContent: 'flex-end',
},
modalContent: {
borderTopLeftRadius: 16,
borderTopRightRadius: 16,
padding: 24,
maxHeight: '80%',
},
input: {
borderWidth: 1,
borderRadius: 8,
padding: 12,
marginBottom: 12,
...Typography.bodyMedium,
},
typeSelector: {
flexDirection: 'row',
flexWrap: 'wrap',
gap: 8,
marginBottom: 16,
},
typeButton: {
paddingHorizontal: 16,
paddingVertical: 8,
borderRadius: 16,
borderWidth: 1,
},
row: {
flexDirection: 'row',
},
actions: {
flexDirection: 'row',
justifyContent: 'flex-end',
gap: 16,
marginTop: 16,
},
cancelBtn: {
padding: 12,
},
saveBtn: {
paddingHorizontal: 24,
paddingVertical: 12,
borderRadius: 8,
},
});
