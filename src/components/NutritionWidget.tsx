import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useMealRecord } from '@/hooks/useMealRecord';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card } from './Card';

export function NutritionWidget() {
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
          <Text style={styles.totalValue}>{totals.calories}</Text>
          <Text style={styles.totalLabel}>kcal</Text>
        </View>
        <View style={styles.macrosContainer}>
          <Text style={styles.macroText}>P: {totals.protein.toFixed(1)}g</Text>
          <Text style={styles.macroText}>C: {totals.carbs.toFixed(1)}g</Text>
          <Text style={styles.macroText}>G: {totals.fat.toFixed(1)}g</Text>
        </View>
      </View>

      <Pressable style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.addButtonText}>+ Adicionar Refeição</Text>
      </Pressable>

      {mealLogs.length > 0 && (
        <View style={styles.listContainer}>
          {mealLogs.slice(0, 3).map((meal, idx) => (
            <View key={idx} style={styles.mealItem}>
              <View>
                <Text style={styles.mealName}>{meal.name}</Text>
                <Text style={styles.mealType}>{meal.mealType}</Text>
              </View>
              <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
            </View>
          ))}
        </View>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nova Refeição</Text>
            <ScrollView>
              <TextInput
                style={styles.input}
                placeholder="Nome do alimento"
                value={name}
                onChangeText={setName}
              />
              
              <View style={styles.typeSelector}>
                {mealTypes.map(t => (
                  <Pressable 
                    key={t}
                    style={[styles.typeButton, mealType === t && styles.typeButtonActive]}
                    onPress={() => setMealType(t)}
                  >
                    <Text style={[styles.typeText, mealType === t && styles.typeTextActive]}>{t}</Text>
                  </Pressable>
                ))}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Calorias (kcal)"
                keyboardType="numeric"
                value={calories}
                onChangeText={setCalories}
              />
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 8 }]}
                  placeholder="Proteínas (g)"
                  keyboardType="numeric"
                  value={protein}
                  onChangeText={setProtein}
                />
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 8 }]}
                  placeholder="Carbos (g)"
                  keyboardType="numeric"
                  value={carbs}
                  onChangeText={setCarbs}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Gorduras (g)"
                  keyboardType="numeric"
                  value={fat}
                  onChangeText={setFat}
                />
              </View>

              <View style={styles.actions}>
                <Pressable style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </Pressable>
                <Pressable style={styles.saveBtn} onPress={handleSave}>
                  <Text style={styles.saveBtnText}>Salvar</Text>
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
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  totalLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  macrosContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  macroText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  addButton: {
    backgroundColor: '#E6F0FF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  addButtonText: {
    color: Colors.primary,
    fontWeight: '600',
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
    borderBottomColor: Colors.border,
  },
  mealName: {
    ...Typography.body,
    fontWeight: '500',
  },
  mealType: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  mealCalories: {
    ...Typography.body,
    color: Colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    ...Typography.h2,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    ...Typography.body,
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
    borderColor: Colors.border,
  },
  typeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeText: {
    ...Typography.caption,
    color: Colors.text,
  },
  typeTextActive: {
    color: Colors.white,
    fontWeight: 'bold',
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
  cancelBtnText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveBtnText: {
    color: Colors.white,
    fontWeight: '600',
  },
});
