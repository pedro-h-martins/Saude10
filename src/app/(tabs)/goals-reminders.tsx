import { Card } from '@/components/Card';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useQuery, useRealm } from '@/context/RealmProvider';
import { useReminders } from '@/hooks/useReminders';
import { Goal } from '@/models/Goal';
import { Reminder } from '@/models/Reminder';
import { UserProfile } from '@/models/UserProfile';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { Realm } from '@realm/react';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GoalsRemindersScreen() {
  const realm = useRealm();
  const goals = useQuery(Goal);
  const users = useQuery(UserProfile);
  const user = users[0];
  const { reminders, addReminder, toggleReminder, deleteReminder } = useReminders();

  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  
  const [newGoalTitle, setNewGoalTitle] = useState('');
  
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [reminderType, setReminderType] = useState<Reminder['type']>('custom');

  const onTimeChange = (event: DateTimePickerChangeEvent, selectedDate: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    setReminderTime(selectedDate);
  };

  const handleAddGoal = () => {
    if (!newGoalTitle.trim()) {
      Alert.alert('Erro', 'Por favor, insira um título para a meta.');
      return;
    }

    try {
      realm.write(() => {
        const newGoal = realm.create(Goal, {
          _id: new Realm.BSON.ObjectId(),
          title: newGoalTitle,
          type: 'custom',
          startDate: new Date(),
          isActive: true,
        });
        if (user) {
          user.goals.push(newGoal);
        }
      });
      setNewGoalTitle('');
      setGoalModalVisible(false);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível adicionar a meta.');
    }
  };

  const handleAddReminder = () => {
    if (!newReminderTitle.trim()) {
      Alert.alert('Erro', 'Por favor, insira um título para o lembrete.');
      return;
    }

    const hours = reminderTime.getHours().toString().padStart(2, '0');
    const minutes = reminderTime.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;

    try {
      addReminder(newReminderTitle, timeString, reminderType);
      setNewReminderTitle('');
      setReminderModalVisible(false);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível adicionar o lembrete.');
    }
  };

  const confirmDeleteGoal = (goal: Goal) => {
    Alert.alert('Excluir Meta', 'Tem certeza que deseja excluir esta meta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => realm.write(() => realm.delete(goal)) },
    ]);
  };

  const confirmDeleteReminder = (reminder: Reminder) => {
    Alert.alert('Excluir Lembrete', 'Tem certeza que deseja excluir este lembrete?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => deleteReminder(reminder._id) },
    ]);
  };

  const renderGoalItem = (item: Goal) => (
    <Card key={item._id.toHexString()} style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemSubtitle}>Iniciada em: {item.startDate.toLocaleDateString()}</Text>
      </View>
      <TouchableOpacity onPress={() => confirmDeleteGoal(item)}>
        <Ionicons name="trash-outline" size={22} color={Colors.warning} />
      </TouchableOpacity>
    </Card>
  );

  const renderReminderItem = (item: Reminder) => (
    <Card key={item._id.toHexString()} style={styles.itemCard}>
      <View style={styles.reminderIconContainer}>
        <MaterialIcons 
          name={item.type === 'water' ? 'local-drink' : item.type === 'meditation' ? 'self-improvement' : 'notifications'} 
          size={24} 
          color={Colors.primary} 
        />
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemSubtitle}>{item.time}</Text>
      </View>
      <Switch
        value={item.isEnabled}
        onValueChange={() => toggleReminder(item._id)}
        trackColor={{ false: '#767577', true: Colors.primary + '80' }}
        thumbColor={item.isEnabled ? Colors.primary : '#f4f3f4'}
      />
      <TouchableOpacity onPress={() => confirmDeleteReminder(item)} style={{ marginLeft: 10 }}>
        <Ionicons name="trash-outline" size={22} color={Colors.warning} />
      </TouchableOpacity>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
            <Text style={styles.headerMainTitle}>Objetivos & Lembretes</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Minhas Metas</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setGoalModalVisible(true)}>
            <Ionicons name="add" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {goals.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Nenhuma meta definida.</Text>
          </View>
        ) : (
          goals.map(goal => renderGoalItem(goal))
        )}

        <View style={[styles.sectionHeader, { marginTop: 30 }]}>
          <Text style={styles.sectionTitle}>Lembretes Customizados</Text>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => {
              setReminderTime(new Date());
              setReminderModalVisible(true);
            }}
          >
            <Ionicons name="add" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {reminders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Nenhum lembrete configurado.</Text>
          </View>
        ) : (
          reminders.map(reminder => renderReminderItem(reminder))
        )}
      </ScrollView>

      {/* Goal Modal */}
      <Modal visible={goalModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nova Meta</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Correr 5km por dia"
              value={newGoalTitle}
              onChangeText={setNewGoalTitle}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setGoalModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleAddGoal}>
                <Text style={styles.saveBtnText}>Adicionar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reminder Modal */}
      <Modal visible={reminderModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Novo Lembrete</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Beber água ou Meditar"
              value={newReminderTitle}
              onChangeText={setNewReminderTitle}
            />
            
            <View style={styles.typeSelector}>
              {(['water', 'meditation', 'custom'] as const).map((t) => (
                <TouchableOpacity 
                  key={t}
                  style={[styles.typeBtn, reminderType === t && styles.typeBtnActive]}
                  onPress={() => setReminderType(t)}
                >
                  <Text style={[styles.typeBtnText, reminderType === t && styles.typeBtnTextActive]}>
                    {t === 'water' ? 'Água' : t === 'meditation' ? 'Meditar' : 'Outro'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.timePickerBtn} onPress={() => setShowTimePicker(true)}>
              <Ionicons name="time-outline" size={20} color={Colors.primary} />
              <Text style={styles.timePickerText}>
                Horário: {reminderTime.getHours().toString().padStart(2, '0')}:{reminderTime.getMinutes().toString().padStart(2, '0')}
              </Text>
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={reminderTime}
                mode="time"
                is24Hour={true}
                display="default"
                onValueChange={onTimeChange}
                onDismiss={() => setShowTimePicker(false)}
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setReminderModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleAddReminder}>
                <Text style={styles.saveBtnText}>Configurar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: 20 },
  header: { marginBottom: 20 },
  headerMainTitle: { ...Typography.h1, color: Colors.text },
  sectionTitle: { ...Typography.h2, color: Colors.text },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  addButton: { backgroundColor: Colors.primary, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  itemCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, padding: 15 },
  itemInfo: { flex: 1 },
  itemTitle: { ...Typography.h3, color: Colors.text, marginBottom: 2 },
  itemSubtitle: { ...Typography.caption, color: Colors.textSecondary },
  emptyCard: { padding: 20, alignItems: 'center', backgroundColor: Colors.white, borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: Colors.border },
  emptyText: { ...Typography.body, color: Colors.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: Colors.white, borderRadius: 16, padding: 20 },
  modalTitle: { ...Typography.h2, color: Colors.text, marginBottom: 20, textAlign: 'center' },
  input: { borderBottomWidth: 1, borderBottomColor: Colors.border, paddingVertical: 10, fontSize: 16, marginBottom: 20 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  modalBtn: { flex: 0.48, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#f0f0f0' },
  saveBtn: { backgroundColor: Colors.primary },
  cancelBtnText: { color: Colors.text, fontWeight: '600' },
  saveBtnText: { color: Colors.white, fontWeight: '600' },
  timePickerBtn: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: Colors.primary + '10', borderRadius: 8, marginBottom: 20 },
  timePickerText: { marginLeft: 10, color: Colors.primary, fontWeight: '500' },
  reminderIconContainer: { marginRight: 15 },
  typeSelector: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  typeBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#f0f0f0' },
  typeBtnActive: { backgroundColor: Colors.primary },
  typeBtnText: { fontSize: 13, color: Colors.text },
  typeBtnTextActive: { color: Colors.white, fontWeight: '600' },
});

