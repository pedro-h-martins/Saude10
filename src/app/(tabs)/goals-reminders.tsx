import { Card } from '@/components/Card';
import { GoalProgressBar } from '@/components/GoalProgressBar';
import { StretchSection } from '@/components/StretchSection';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useRealm } from '@/context/RealmProvider';
import { useGoals } from '@/hooks/useGoals';
import { useReminders } from '@/hooks/useReminders';
import { useSync } from '@/hooks/useSync';
import { getNextOccurrenceLabel, getWorkoutRecurrenceLabel, getWorkoutStatusText, isWorkoutCompleted, useWorkouts } from '@/hooks/useWorkouts';
import { ActivityLog } from '@/models/ActivityLog';
import { Goal } from '@/models/Goal';
import { HydrationLog } from '@/models/HydrationLog';
import { PomodoroLog } from '@/models/PomodoroLog';
import { Reminder } from '@/models/Reminder';
import { UserProfile } from '@/models/UserProfile';
import { Workout } from '@/models/Workout';
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
  const { currentUser } = useAuth();
  const user = currentUser ?? users[0];
  const { reminders, addReminder, toggleReminder, deleteReminder } = useReminders();
  const { workouts, toggleWorkoutCompleted } = useWorkouts();
  const { save, remove } = useSync();
  const { computed: computedGoals } = useGoals();

  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);

  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalMetric, setNewGoalMetric] = useState<string>('steps');
  const [newGoalTarget, setNewGoalTarget] = useState<string>('');
  const [newGoalUnit, setNewGoalUnit] = useState<string>('');
  const [newGoalPeriodType, setNewGoalPeriodType] = useState<'daily' | 'weekly' | 'custom'>('daily');
  const [newGoalCreateReminder, setNewGoalCreateReminder] = useState<boolean>(false);
  const [newGoalReminderTime, setNewGoalReminderTime] = useState<Date>(new Date());

  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [reminderType, setReminderType] = useState<Reminder['type']>('custom');
  const [workoutModalVisible, setWorkoutModalVisible] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [goalDetailModalVisible, setGoalDetailModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [metricValueInput, setMetricValueInput] = useState<string>('');

  const onTimeChange = (event: DateTimePickerChangeEvent, selectedDate: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    setReminderTime(selectedDate);
  };

  const handleAddGoal = () => {
    if (!newGoalTitle.trim()) {
      Alert.alert('Erro', 'Por favor, insira um título para a meta.');
      return;
    }
    if (!newGoalTarget.trim() || isNaN(Number(newGoalTarget))) {
      Alert.alert('Erro', 'Por favor, insira um valor alvo numérico para a meta.');
      return;
    }

    try {
      const newGoalId = new Realm.BSON.ObjectId();
      const payload: any = {
        _id: newGoalId,
        title: newGoalTitle,
        type: 'custom',
        metric: newGoalMetric,
        targetValue: Number(newGoalTarget),
        unit: newGoalUnit,
        periodType: newGoalPeriodType,
        startDate: new Date(),
        isActive: true,
      };

      save('Goal', newGoalId.toHexString(), payload);

      if (user) {
        realm.write(() => {
          const newGoal = realm.objectForPrimaryKey(Goal, newGoalId);
          if (newGoal && user) {
            user.goals.push(newGoal);
            save('UserProfile', user._id, { goals: user.goals });
          }
        });
      }

      if (newGoalCreateReminder) {
        const hours = newGoalReminderTime.getHours().toString().padStart(2, '0');
        const minutes = newGoalReminderTime.getMinutes().toString().padStart(2, '0');
        const timeString = `${hours}:${minutes}`;
        const mapping: Record<string, Reminder['type']> = { hydration: 'water', meditation: 'meditation', workout: 'custom', steps: 'custom', weight: 'custom' };
        const reminderType = mapping[newGoalMetric] ?? 'custom';
        addReminder(newGoalTitle, timeString, reminderType);
      }

      setNewGoalTitle('');
      setNewGoalTarget('');
      setNewGoalUnit('');
      setNewGoalMetric('steps');
      setNewGoalPeriodType('daily');
      setNewGoalCreateReminder(false);
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
      {
        text: 'Excluir', style: 'destructive', onPress: () => {
          if (user) {
            const updatedGoals = user.goals.filter(g => g._id.toHexString() !== goal._id.toHexString());
            save('UserProfile', user._id, { goals: updatedGoals });
          }
          remove('Goal', goal._id.toHexString());
        }
      },
    ]);
  };

  const confirmDeleteReminder = (reminder: Reminder) => {
    Alert.alert('Excluir Lembrete', 'Tem certeza que deseja excluir este lembrete?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => deleteReminder(reminder._id) },
    ]);
  };

  const openWorkoutDetail = (workout: Workout) => {
    setSelectedWorkout(workout);
    setWorkoutModalVisible(true);
  };

  const openGoalDetail = (goal: Goal) => {
    setSelectedGoal(goal);
    setMetricValueInput('');
    setGoalDetailModalVisible(true);
  };

  const handleToggleSelectedWorkout = async () => {
    if (!selectedWorkout) return;

    await toggleWorkoutCompleted(selectedWorkout._id);
  };

  const startOfDay = (d: Date) => {
    const r = new Date(d);
    r.setHours(0, 0, 0, 0);
    return r;
  };

  const endOfDay = (d: Date) => {
    const r = new Date(d);
    r.setHours(23, 59, 59, 999);
    return r;
  };

  const handleAddMetricValue = async (goal: Goal) => {
    const val = Number(metricValueInput);
    if (!val || isNaN(val)) {
      Alert.alert('Erro', 'Informe um valor numérico para adicionar.');
      return;
    }

    try {
      if ((goal as any).metric === 'steps') {
        const todayKey = new Date().toISOString().slice(0, 10);
        const existing = realm.objects(ActivityLog).filtered('date == $0', todayKey)[0] as any;
        if (existing) {
          save('ActivityLog', existing._id.toHexString(), { steps: (existing.steps ?? 0) + val, updatedAt: new Date() });
        } else {
          const id = new Realm.BSON.ObjectId();
          save('ActivityLog', id.toHexString(), { _id: id, date: todayKey, steps: val, distance: 0, updatedAt: new Date() });
        }
      } else if ((goal as any).metric === 'hydration') {
        const id = new Realm.BSON.ObjectId();
        save('HydrationLog', id.toHexString(), { _id: id, amount: val, timestamp: new Date(), userId: currentUser?._id ?? users[0]?._id ?? '' });
      } else if ((goal as any).metric === 'meditation') {
        for (let i = 0; i < Math.max(1, Math.floor(val)); i++) {
          const id = new Realm.BSON.ObjectId();
          save('PomodoroLog', id.toHexString(), { _id: id, type: 'focus', duration: 10, completedAt: new Date() });
        }
      } else if ((goal as any).metric === 'workout') {
        const id = new Realm.BSON.ObjectId();
        save('Workout', id.toHexString(), { _id: id, title: goal.title, instructions: '', isCompleted: true, isPredefined: false, isRecurring: false, createdAt: new Date(), completedAt: new Date(), lastCompletedAt: new Date() });
      } else if ((goal as any).metric === 'weight') {
        if (currentUser) {
          save('UserProfile', currentUser._id, { weight: val });
        } else {
          const userObj = users[0];
          if (userObj) save('UserProfile', userObj._id, { weight: val });
        }
      }

      setMetricValueInput('');
    } catch (err) {
      console.error('[goals-reminders] add metric value failed', err);
      Alert.alert('Erro', 'Não foi possível adicionar o valor.');
    }
  };

  const handleRemoveMetricValue = async (goal: Goal) => {
    const val = Number(metricValueInput) || 1;
    const count = Math.max(1, Math.floor(val));
    try {
      if ((goal as any).metric === 'steps') {
        const todayKey = new Date().toISOString().slice(0, 10);
        const existing = realm.objects(ActivityLog).filtered('date == $0', todayKey)[0] as any;
        if (existing) {
          const newVal = Math.max(0, (existing.steps ?? 0) - count);
          save('ActivityLog', existing._id.toHexString(), { steps: newVal, updatedAt: new Date() });
        }
      } else if ((goal as any).metric === 'hydration') {
        const start = startOfDay(new Date());
        const end = endOfDay(new Date());
        const entries = realm.objects(HydrationLog).filtered('timestamp >= $0 AND timestamp <= $1', start, end).sorted('timestamp', true) as any;
        for (let i = 0; i < count && i < entries.length; i++) {
          const e = entries[i];
          remove('HydrationLog', e._id.toHexString());
        }
      } else if ((goal as any).metric === 'meditation') {
        const start = startOfDay(new Date());
        const end = endOfDay(new Date());
        const entries = realm.objects(PomodoroLog).filtered('completedAt >= $0 AND completedAt <= $1', start, end).sorted('completedAt', true) as any;
        for (let i = 0; i < count && i < entries.length; i++) {
          const e = entries[i];
          remove('PomodoroLog', e._id.toHexString());
        }
      } else if ((goal as any).metric === 'workout') {
        const start = startOfDay(new Date());
        const end = endOfDay(new Date());
        const entries = realm.objects(Workout).filtered('title == $0 AND completedAt >= $1 AND completedAt <= $2', goal.title, start, end).sorted('completedAt', true) as any;
        for (let i = 0; i < count && i < entries.length; i++) {
          const e = entries[i];
          remove('Workout', e._id.toHexString());
        }
      } else if ((goal as any).metric === 'weight') {
        Alert.alert('Remover peso', 'Remover peso histórico não é suportado. Edite seu peso manualmente.');
      }

      setMetricValueInput('');
    } catch (err) {
      console.error('[goals-reminders] remove metric value failed', err);
      Alert.alert('Erro', 'Não foi possível remover o valor.');
    }
  };

  const renderWorkoutItem = (item: Workout) => {
    const statusText = getWorkoutStatusText(item);
    const recurrenceLabel = getWorkoutRecurrenceLabel(item);
    const nextOccurrenceLabel = item.isRecurring ? getNextOccurrenceLabel(item) : null;
    const completed = isWorkoutCompleted(item);

    return (
      <TouchableOpacity key={item._id.toHexString()} onPress={() => openWorkoutDetail(item)}>
        <Card style={styles.itemCard}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemSubtitle}>{recurrenceLabel}</Text>
            <Text style={styles.itemSubtitle}>{statusText}</Text>
            {nextOccurrenceLabel ? <Text style={styles.itemSubtitle}>{nextOccurrenceLabel}</Text> : null}
          </View>
          <Ionicons name={completed ? 'checkmark-circle-outline' : 'ellipse-outline'} size={22} color={completed ? Colors.primary : Colors.textSecondary} />
        </Card>
      </TouchableOpacity>
    );
  };

  const renderGoalItem = (item: Goal) => (
    <TouchableOpacity key={item._id.toHexString()} onPress={() => openGoalDetail(item)}>
      <Card style={styles.itemCard}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemSubtitle}>Iniciada em: {item.startDate.toLocaleDateString()}</Text>
          {(() => {
            try {
              const cg = (computedGoals as any).find((c: any) => c.goal._id.toHexString() === item._id.toHexString());
              if (cg) {
                return <GoalProgressBar progress={cg.progressPercent} label={cg.displayText} />;
              }
            } catch (e) {
              console.error('[goals-reminders] Error rendering goal item:', e);
            }
            return null;
          })()}
        </View>
        <TouchableOpacity onPress={() => confirmDeleteGoal(item)}>
          <Ionicons name="trash-outline" size={22} color={Colors.warning} />
        </TouchableOpacity>
      </Card>
    </TouchableOpacity>
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
          <Text style={styles.sectionTitle}>Treinos Pré-definidos</Text>
        </View>

        {workouts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Nenhum treino disponível.</Text>
          </View>
        ) : (
          workouts.map(workout => renderWorkoutItem(workout))
        )}

        <StretchSection />

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

      <Modal visible={goalModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nova Meta</Text>

            <TextInput
              style={styles.input}
              placeholder="Título: Ex: Caminhar 10.000 passos"
              value={newGoalTitle}
              onChangeText={setNewGoalTitle}
              autoFocus
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Alvo (número)"
                keyboardType="numeric"
                value={newGoalTarget}
                onChangeText={setNewGoalTarget}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Unidade (ex: passos, ml)"
                value={newGoalUnit}
                onChangeText={setNewGoalUnit}
              />
            </View>

            <Text style={{ marginTop: 8, marginBottom: 6, color: Colors.textSecondary }}>Métrica</Text>
            <View style={styles.typeSelector}>
              {(['steps', 'hydration', 'meditation', 'workout', 'weight'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.typeBtn, newGoalMetric === m && styles.typeBtnActive]}
                  onPress={() => setNewGoalMetric(m)}
                >
                  <Text style={[styles.typeBtnText, newGoalMetric === m && styles.typeBtnTextActive]}>
                    {m === 'steps' ? 'Passos' : m === 'hydration' ? 'Hidratação' : m === 'meditation' ? 'Meditar' : m === 'workout' ? 'Treinos' : 'Peso'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ marginTop: 8, marginBottom: 6, color: Colors.textSecondary }}>Período</Text>
            <View style={styles.typeSelector}>
              {(['daily', 'weekly', 'custom'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.typeBtn, newGoalPeriodType === p && styles.typeBtnActive]}
                  onPress={() => setNewGoalPeriodType(p)}
                >
                  <Text style={[styles.typeBtnText, newGoalPeriodType === p && styles.typeBtnTextActive]}>
                    {p === 'daily' ? 'Diário' : p === 'weekly' ? 'Semanal' : 'Personalizado'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
              <Text style={{ color: Colors.text }}>Criar lembrete para esta meta</Text>
              <Switch value={newGoalCreateReminder} onValueChange={setNewGoalCreateReminder} trackColor={{ false: '#767577', true: Colors.primary + '80' }} thumbColor={newGoalCreateReminder ? Colors.primary : '#f4f3f4'} />
            </View>

            {newGoalCreateReminder ? (
              <>
                <TouchableOpacity style={styles.timePickerBtn} onPress={() => setShowTimePicker(true)}>
                  <Ionicons name="time-outline" size={20} color={Colors.primary} />
                  <Text style={styles.timePickerText}>
                    Horário: {newGoalReminderTime.getHours().toString().padStart(2, '0')}:{newGoalReminderTime.getMinutes().toString().padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
                {showTimePicker && (
                  <DateTimePicker
                    value={newGoalReminderTime}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={(e, d) => {
                      setShowTimePicker(Platform.OS === 'ios');
                      if (d) setNewGoalReminderTime(d);
                    }}
                    onDismiss={() => setShowTimePicker(false)}
                  />
                )}
              </>
            ) : null}

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

      <Modal visible={workoutModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedWorkout?.title ?? 'Detalhes do Treino'}</Text>
            {selectedWorkout ? (
              <>
                <Text style={styles.workoutSubtitle}>{getWorkoutRecurrenceLabel(selectedWorkout)}</Text>
                <Text style={styles.workoutSubtitle}>{getWorkoutStatusText(selectedWorkout)}</Text>
                {selectedWorkout.isRecurring ? (
                  <Text style={styles.workoutDetailText}>{getNextOccurrenceLabel(selectedWorkout)}</Text>
                ) : null}
                <Text style={styles.modalText}>{selectedWorkout.instructions}</Text>
              </>
            ) : null}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setWorkoutModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Fechar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn, (!selectedWorkout || isWorkoutCompleted(selectedWorkout)) && styles.disabledBtn]}
                onPress={handleToggleSelectedWorkout}
                disabled={!selectedWorkout || isWorkoutCompleted(selectedWorkout)}
              >
                <Text style={styles.saveBtnText}>
                  {selectedWorkout
                    ? isWorkoutCompleted(selectedWorkout)
                      ? 'Treino concluído'
                      : 'Marcar como concluído'
                    : 'Concluir'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={goalDetailModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedGoal?.title ?? 'Detalhes da Meta'}</Text>
            {selectedGoal ? (
              <>
                <Text style={styles.workoutSubtitle}>Métrica: {(selectedGoal as any).metric ?? 'N/A'}</Text>
                <Text style={styles.workoutDetailText}>Iniciada em: {selectedGoal.startDate.toLocaleDateString()}</Text>
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: Colors.textSecondary, marginBottom: 6 }}>Valor</Text>
                  <TextInput style={styles.input} placeholder="Quantidade (ex: 1000)" keyboardType="numeric" value={metricValueInput} onChangeText={setMetricValueInput} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                    <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn, { flex: 0.48 }]} onPress={() => setMetricValueInput('')}>
                      <Text style={styles.cancelBtnText}>Limpar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modalBtn, styles.saveBtn, { flex: 0.23 }]} onPress={() => selectedGoal && handleAddMetricValue(selectedGoal)}>
                      <Text style={styles.saveBtnText}>Adicionar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modalBtn, styles.saveBtn, { flex: 0.23 }]} onPress={() => selectedGoal && handleRemoveMetricValue(selectedGoal)}>
                      <Text style={styles.saveBtnText}>Remover</Text>
                    </TouchableOpacity>
                  </View>
                </View>

              </>
            ) : null}

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setGoalDetailModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  workoutSubtitle: { ...Typography.caption, color: Colors.textSecondary, marginBottom: 8 },
  workoutDetailText: { ...Typography.body, color: Colors.textSecondary, marginBottom: 16, lineHeight: 20 },
  modalText: { ...Typography.body, color: Colors.textSecondary, marginBottom: 16, lineHeight: 20 },
  disabledBtn: { opacity: 0.6 },
});

