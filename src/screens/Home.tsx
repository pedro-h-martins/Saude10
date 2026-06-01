import { Card } from '@/components/Card';
import { NutritionWidget } from '@/components/NutritionWidget';
import { PomodoroWidget } from '@/components/PomodoroWidget';
import ShareProgressButton from '@/components/ShareProgressButton';
import { SleepWidget } from '@/components/SleepWidget';
import { WaterWidget } from '@/components/WaterWidget';
import { WellnessWidget } from '@/components/WellnessWidget';
import { TypographyColors } from '@/constants/Typography';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@/context/RealmProvider';
import { useActivityTracking } from '@/hooks/useActivityTracking';
import { useSync } from '@/hooks/useSync';
import { useTheme } from '@/hooks/useTheme';
import { BloodPressure } from '@/models/BloodPressure';
import { calculateBMI } from '@/utils/health';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Realm } from '@realm/react';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DashboardHeader = ({ avatarUri, onAvatarPress, colors }: { avatarUri?: string | null; onAvatarPress?: () => void; colors: any }) => (
  <View style={styles.header}>
    <View style={styles.userSection}>
      <TouchableOpacity onPress={onAvatarPress} activeOpacity={0.8}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={[styles.avatarPlaceholderImage, { borderColor: colors.white }]} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary, borderColor: colors.white, shadowColor: colors.primary }]}>
            <Ionicons name="person" size={20} color={colors.white} />
          </View>
        )}
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.cardTitle }]}>SaudeIO</Text>
    </View>
    <TouchableOpacity style={[styles.notificationBtn, { backgroundColor: colors.white, shadowColor: colors.shadow }]}> 
      <View style={[styles.notificationDot, { backgroundColor: colors.error }]} />
      <Ionicons name="notifications-outline" size={24} color={colors.primary} />
    </TouchableOpacity>
  </View>
);

const ActivityCard = ({ steps, distanceFormatted, colors }: { steps: number; distanceFormatted: string; colors: any }) => (
  <LinearGradient
    colors={[colors.primary, colors.primaryLight]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.activityCard}
  >
    <View style={styles.activityHeader}>
      <Text style={[styles.activityLabel, { color: colors.white }]}>ATIVIDADE HOJE</Text>
      <View style={styles.lightningIcon}>
        <Ionicons name="flash" size={16} color={colors.white} />
      </View>
    </View>
    
    <Text style={[styles.stepsCount, { color: colors.white }]}>{steps.toLocaleString()}</Text>
    <Text style={[styles.stepsLabel, { color: colors.white }]}>Passos concluidos hoje</Text>

    <View style={styles.activityStats}>
      <View style={styles.statItem}>
        <Text style={[styles.statLabel, { color: colors.white }]}>DISTÂNCIA PERCORRIDA</Text>
        <Text style={[styles.statValue, { color: colors.white }]}>{distanceFormatted}</Text>
      </View>
      <View style={[styles.divider, { backgroundColor: colors.white + '30' }]} />
      <View style={styles.statItem}>
        <Text style={[styles.statLabel, { color: colors.white }]}>STATUS</Text>
        <View style={styles.statusRow}>
            <View style={[styles.greenDot, { backgroundColor: colors.accent }]} />
            <Text style={[styles.statValue, { color: colors.white }]}>ATIVO</Text>
        </View>
      </View>
    </View>
  </LinearGradient>
);

export function Home() {
  const { colors } = useTheme();
  const textStyles = TypographyColors(colors);
  const { currentUser } = useAuth();
  const user = currentUser;
  const { steps, formattedDistance } = useActivityTracking();
  const router = useRouter();
  const { save } = useSync();
  
  const bpLogs = useQuery(BloodPressure).sorted('timestamp', true);
  const lastBP = bpLogs.length > 0 ? bpLogs[0] : null;

  const [modalVisible, setModalVisible] = useState(false);
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const bmiData = useMemo(() => {
    return user ? calculateBMI(user.weight, user.height) : null;
  }, [user]);

  const handleSaveBP = () => {
    if (!systolic || !diastolic) return;

    if (!user) {
      Alert.alert('Atenção', 'É necessário fazer login para salvar medições.');
      return;
    }

    const newId = new Realm.BSON.ObjectId();
    save('BloodPressure', newId.toHexString(), {
      _id: newId,
      systolic: parseInt(systolic),
      diastolic: parseInt(diastolic),
      timestamp: date,
      userId: user._id,
    });

    setModalVisible(false);
    setSystolic('');
    setDiastolic('');
    setDate(new Date());
  };

  const chartData = useMemo(() => {
    
    const groups: { [key: string]: { systolic: number, diastolic: number, count: number, date: Date } } = {};
    
    const sortedLogs = [...bpLogs].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    sortedLogs.forEach(log => {
      const d = new Date(log.timestamp);
      const hours = d.getHours();
      const intervalStart = Math.floor(hours / 4) * 4;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${intervalStart}`;
      
      if (!groups[key]) {
        groups[key] = { systolic: 0, diastolic: 0, count: 0, date: d };
      }
      groups[key].systolic += log.systolic;
      groups[key].diastolic += log.diastolic;
      groups[key].count += 1;
    });

    return Object.values(groups).slice(-7).map(g => ({
      systolic: g.systolic / g.count,
      diastolic: g.diastolic / g.count,
      label: `${g.date.getDate()}/${g.date.getMonth()+1} ${g.date.getHours().toString().padStart(2, '0')}:${g.date.getMinutes().toString().padStart(2, '0')}`,
      isAverage: g.count > 1
    }));
  }, [bpLogs]);

  const formatDate = (date: Date) => {
    const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={{ paddingTop: insets.top }}>
          <DashboardHeader avatarUri={user?.avatarUri ?? null} onAvatarPress={() => router.push('/(tabs)/settings')} colors={colors} />
        </View>
        
        <View style={styles.activityContainer}>
          <ActivityCard steps={steps} distanceFormatted={formattedDistance} colors={colors} />
          <ShareProgressButton
            message={`Bati minha meta de passos hoje! Dei ${steps.toLocaleString()} passos. #Saude10`}
          />
        </View>

        <WellnessWidget />
        <WaterWidget />
        
        <TouchableOpacity 
          activeOpacity={0.8} 
          onPress={() => {
            setDate(new Date());
            setModalVisible(true);
          }}
        >
          <Card style={styles.bpCard}>
              <View style={styles.bpHeader}>
                  <View style={[styles.bpIconContainer, { backgroundColor: colors.bloodPressure + '20' }]}>
                      <MaterialIcons name="grid-on" size={20} color={colors.bloodPressure} />
                  </View>
                  <View style={styles.bpTitleSection}>
                      <Text style={[styles.cardTitle, textStyles.h3]}>Pressão arterial</Text>
                      <Text style={[styles.cardSubtitle, textStyles.caption]}>
                        {lastBP ? `ÚLTIMA VEZ: ${formatDate(lastBP.timestamp)}` : 'NENHUM REGISTRO'}
                      </Text>
                  </View>
              </View>
              <View style={styles.bpValueRow}>
                  <Text style={[styles.bpValueLarge, { color: colors.primary }]}>{lastBP ? lastBP.systolic : '--'}</Text>
                  <Text style={[styles.bpDivider, { color: colors.border }]}>/</Text>
                  <Text style={[styles.bpValueSmall, { color: colors.primary }]}>{lastBP ? lastBP.diastolic : '--'}</Text>
                  <Text style={[styles.bpUnit, textStyles.caption]}>MMHG</Text>
              </View>
              
              <View style={[styles.chartWrapper, { borderTopColor: colors.border }]}>
                  <View style={styles.barChartPlaceholder}>
                      {chartData.map((data, i) => (
                          <View key={i} style={styles.chartCol}>
                              <View style={[styles.bar, { 
                                  height: Math.min(60, data.systolic / 3), 
                                  backgroundColor: i === chartData.length - 1 ? colors.primary : colors.chartSecondary,
                                  width: 12,
                                  borderRadius: 6
                              }]} />
                              <Text style={[styles.chartLabel, textStyles.caption]}>{data.label}</Text>
                          </View>
                      ))}
                      {chartData.length === 0 && (
                        <Text style={[styles.noDataText, textStyles.caption]}>Toque para adicionar sua primeira medição</Text>
                      )}
                  </View>
              </View>
          </Card>
        </TouchableOpacity>

        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
              <Pressable style={[styles.modalContent, { backgroundColor: colors.white, shadowColor: colors.shadow }]} onPress={(e) => e.stopPropagation()}>
              <Text style={[styles.modalTitle, textStyles.h2]}>Nova Medição</Text>
              
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, textStyles.caption]}>SISTÓLICA</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: colors.inputBackground, color: colors.text }]}
                    placeholder="120"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    value={systolic}
                    onChangeText={setSystolic}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, textStyles.caption]}>DIASTÓLICA</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: colors.inputBackground, color: colors.text }]}
                    placeholder="80"
                    keyboardType="numeric"
                    value={diastolic}
                    onChangeText={setDiastolic}
                  />
                </View>
              </View>

              <View style={styles.dateTimeRow}>
                <TouchableOpacity 
                  style={[styles.dateTimeButton, { backgroundColor: colors.timerBackground }]} 
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                  <Text style={[styles.dateTimeText, { color: colors.text }]}>
                    {date.toLocaleDateString('pt-BR')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.dateTimeButton, { backgroundColor: colors.timerBackground }]} 
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={18} color={colors.primary} />
                  <Text style={[styles.dateTimeText, { color: colors.text }]}>
                    {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
              </View>

              {(showDatePicker || showTimePicker) && (
                <DateTimePicker
                  value={date}
                  mode={showDatePicker ? 'date' : 'time'}
                  is24Hour={true}
                  onValueChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    setShowTimePicker(false);
                    if (selectedDate) setDate(selectedDate);
                  }}
                  onDismiss={() => {
                    setShowDatePicker(false);
                    setShowTimePicker(false);
                  }}
                />
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalBtn, styles.cancelBtn, { borderColor: colors.border }]} 
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>CANCELAR</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalBtn, styles.saveBtn, { backgroundColor: colors.primary }]} 
                  onPress={handleSaveBP}
                >
                  <Text style={[styles.saveBtnText, { color: colors.white }]}>SALVAR</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        <SleepWidget />

        <NutritionWidget />
        
        <View style={styles.gridRow}>
            <PomodoroWidget />
            <Card style={styles.halfCard}>
                <Text style={[styles.gridCardTitle, { color: colors.cardTitle }]}>IMC</Text>
                {bmiData ? (
                  <View style={styles.imcContent}>
                    <Text style={[styles.imcValue, { color: colors[bmiData.colorKey] }]}>
                      {bmiData.value.toFixed(1)}
                    </Text>
                    <View style={[styles.imcBadge, { backgroundColor: colors[bmiData.colorKey] + '20' }]}>
                      <Text style={[styles.imcBadgeText, { color: colors[bmiData.colorKey] }]}>
                        {bmiData.isIdeal ? 'IDEAL' : bmiData.category.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <Text style={[styles.timerText, { color: colors.textSecondary }]}>N/A</Text>
                )}
            </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarPlaceholderImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  notificationDot: {
    position: 'absolute',
    top: 13,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    
    borderWidth: 1.5,
    zIndex: 1,
  },
  activityCard: {
    borderRadius: 24,
    padding: 24,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  activityContainer: {
    gap: 12,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  activityLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  lightningIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepsCount: {
    fontSize: 42,
    fontWeight: '800',
  },
  stepsLabel: {
    fontSize: 15,
    opacity: 0.9,
    marginBottom: 25,
  },
  activityStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 18,
    padding: 18,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 25,
    marginHorizontal: 15,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    
  },
  bpCard: {
    padding: 24,
  },
  bpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 20,
  },
  bpIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bpTitleSection: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  bpValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  bpValueLarge: {
    fontSize: 48,
    fontWeight: '800',
  },
  bpDivider: {
    fontSize: 28,
    marginHorizontal: 8,
    fontWeight: '300',
  },
  bpValueSmall: {
    fontSize: 32,
    fontWeight: '700',
  },
  bpUnit: {
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 10,
  },
  chartWrapper: {
    marginTop: 10,
    borderTopWidth: 1,
    paddingTop: 15,
  },
  barChartPlaceholder: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 80,
    gap: 12,
    justifyContent: 'space-between',
  },
  chartCol: {
    alignItems: 'center',
    gap: 8,
  },
  chartLabel: {
    fontSize: 8,
    fontWeight: '700',
    textAlign: 'center',
    width: 35,
  },
  noDataText: {
    fontSize: 12,
    fontStyle: 'italic',
    width: '100%',
    textAlign: 'center',
    paddingBottom: 20,
  },
  bar: {
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  textInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '700',
    borderWidth: 1,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateTimeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtn: {
  },
  saveBtn: {
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 15,
  },
  halfCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  gridCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 15,
    letterSpacing: 0.5,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '800',
  },
  imcContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  imcValue: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 6,
  },
  imcBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imcBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
