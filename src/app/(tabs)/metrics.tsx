import { Card } from '@/components/Card';
import EvolutionCharts from '@/components/EvolutionCharts';
import { SymptomWidget } from '@/components/SymptomWidget';
import { ThemeColors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useQuery } from "@/context/RealmProvider";
import { useTheme } from '@/context/ThemeContext';
import { ActivityLog } from '@/models/ActivityLog';
import { BloodPressure } from '@/models/BloodPressure';
import { MealLog } from '@/models/MealLog';
import { SleepLog } from '@/models/SleepLog';
import { SymptomLog } from '@/models/SymptomLog';
import { UserProfile } from '@/models/UserProfile';
import { WellnessLog } from '@/models/WellnessLog';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const getMoodConfig = (rating: number, colors: ThemeColors) => {
  switch (rating) {
    case 1: return { icon: 'sad-outline', label: 'Péssimo', color: colors.moodTerrible };
    case 2: return { icon: 'trending-down-outline', label: 'Mal', color: colors.moodBad };
    case 3: return { icon: 'reorder-two-outline', label: 'Ok', color: colors.moodOk };
    case 4: return { icon: 'happy-outline', label: 'Bem', color: colors.moodGood };
    case 5: return { icon: 'star-outline', label: 'Ótimo', color: colors.moodGreat };
    default: return { icon: 'help-outline', label: 'Indefinido', color: colors.onSurfaceVariant };
  }
};

const getBPStatus = (systolic: number, diastolic: number, colors: ThemeColors) => {
  if (systolic >= 140 || diastolic >= 90) {
    return { label: 'Hipertensão Estágio 2', color: colors.error };
  } else if (systolic >= 130 || diastolic >= 80) {
    return { label: 'Hipertensão Estágio 1', color: colors.moodBad };
  } else if (systolic >= 120 && diastolic < 80) {
    return { label: 'Elevada', color: colors.moodOk };
  } else if (systolic < 120 && diastolic < 80) {
    return { label: 'Normal', color: colors.accent };
  }
  return { label: 'Desconhecido', color: colors.onSurfaceVariant };
};

const formatDate = (date?: Date | string | null) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  }) + ', ' + d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

function getItemKey(item: any) {
  try {
    const id = item?._id ?? item?.id ?? item;
    if (id == null) return String(Math.random());
    if (typeof id === 'object' && typeof id.toHexString === 'function') return id.toHexString();
    return String(id);
  } catch {
    return String(Math.random());
  }
}

export default function Metrics() {
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'pressure' | 'mood' | 'symptoms' | 'meals' | 'sleep'>('pressure');
  const [selectedMetric, setSelectedMetric] = useState<'weight' | 'steps' | 'sleep_duration' | 'sleep_quality'>('steps');
  const [rangeDays, setRangeDays] = useState<number>(7);

  const getRangeLabel = (d: number) => {
    if (d === 7) return '7 dias';
    if (d === 15) return '15 dias';
    if (d === 30) return '30 dias';
    if (d === 90) return '3 meses';
    if (d === 180) return '6 meses';
    if (d === 365) return '12 meses';
    return `${d}d`;
  };
  const measurements = useQuery(BloodPressure).sorted('timestamp', true);
  const wellnessLogs = useQuery(WellnessLog).sorted('timestamp', true);
  const symptomLogs = useQuery(SymptomLog).sorted('timestamp', true);
  const mealLogs = useQuery<MealLog>('MealLog').sorted('timestamp', true);
  const sleepLogs = useQuery(SleepLog).sorted('startTime', true);
  const activityLogs = useQuery(ActivityLog).sorted('date', true);
  const userProfiles = useQuery(UserProfile);
  const userProfile = userProfiles && userProfiles.length > 0 ? userProfiles[0] : null;

  const renderSleepItem = ({ item }: { item: SleepLog }) => {
    const diffMs = item.endTime.getTime() - item.startTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.round((diffMs / (1000 * 60)) % 60);

    return (
      <Card style={styles.measurementCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="moon-outline" size={20} color={colors.sleep} style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.dateText}>
              {item.startTime.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </Text>
            <Text style={[Typography.labelMedium, { color: colors.onSurfaceVariant }]}>
              {item.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {item.endTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ ...Typography.bodyMedium, color: colors.primary, fontWeight: 'bold' }}>{hours}h {minutes}min</Text>
            <View style={styles.qualityContainer}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Ionicons
                  key={s}
                  name={item.quality >= s ? "star" : "star-outline"}
                  size={10}
                  color={item.quality >= s ? colors.moodOk : colors.outlineVariant}
                />
              ))}
            </View>
          </View>
        </View>
      </Card>
    );
  };

  const renderPressureItem = ({ item }: { item: BloodPressure }) => {
    const status = getBPStatus(item.systolic, item.diastolic, colors);

    return (
      <Card style={styles.measurementCard}>
        <View style={styles.cardHeader}>
          <View style={[styles.statusIndicator, { backgroundColor: status.color }]} />
          <Text style={[styles.dateText, { color: colors.onSurfaceVariant }]}>{formatDate(item.timestamp)}</Text>
        </View>

        <View style={styles.readingContainer}>
          <View>
            <Text style={[styles.bpValue, { color: colors.onSurface }]}>
              {item.systolic}
              <Text style={[styles.separator, { color: colors.onSurfaceVariant }]}>/</Text>
              {item.diastolic}
              <Text style={[styles.unit, { color: colors.onSurfaceVariant }]}> mmHg</Text>
            </Text>
            <Text style={[styles.statusLabel, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  const renderMoodItem = ({ item }: { item: WellnessLog }) => {
    const config = getMoodConfig(item.rating, colors);

    return (
      <Card style={styles.measurementCard}>
        <View style={styles.cardHeader}>
          <Ionicons name={config.icon as any} size={20} color={config.color} style={{ marginRight: 8 }} />
          <Text style={[styles.dateText, { color: colors.onSurfaceVariant }]}>{formatDate(item.timestamp)}</Text>
        </View>

        <View style={styles.moodContent}>
          <Text style={[styles.moodLabel, { color: config.color }]}>
            {config.label}
          </Text>
          {item.notes ? (
            <Text style={[styles.noteText, { color: colors.onSurface }]}>&quot;{item.notes}&quot;</Text>
          ) : (
            <Text style={[styles.emptyNoteText, { color: colors.onSurfaceVariant }]}>Sem observações</Text>
          )}
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList<any>
        data={
          activeTab === 'pressure' ? measurements : 
          activeTab === 'mood' ? wellnessLogs : 
          activeTab === 'symptoms' ? symptomLogs : 
          activeTab === 'sleep' ? sleepLogs :
          mealLogs
        }
        keyExtractor={(item) => getItemKey(item)}
        renderItem={({ item }) => {
          if (activeTab === 'pressure') return renderPressureItem({ item } as any);
          if (activeTab === 'mood') return renderMoodItem({ item } as any);
          if (activeTab === 'sleep') return renderSleepItem({ item } as any);
            if (activeTab === 'symptoms') {
                return (
                  <Card style={styles.measurementCard}>
                    <View style={styles.cardHeader}>
                      <Ionicons name={'medkit-outline' as any} size={20} color={colors.primary} style={{ marginRight: 8 }} />
                      <Text style={[styles.dateText, { color: colors.onSurfaceVariant }]}>{formatDate(item.timestamp)}</Text>
                    </View>
                    <View style={{ marginTop: 4 }}>
                      <Text style={[styles.noteText, { color: colors.onSurface }]}>&quot;{item.description}&quot;</Text>
                    </View>
                  </Card>
                );
              }

              return (
                <Card style={styles.measurementCard}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="restaurant-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                    <Text style={[styles.dateText, { color: colors.onSurfaceVariant }]}>{formatDate((item as any).timestamp)}</Text>
                  </View>
                  <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={{ ...Typography.bodyMedium, fontWeight: 'bold', color: colors.onSurface }}>{(item as any).name}</Text>
                      <Text style={{ ...Typography.labelMedium, color: colors.onSurfaceVariant }}>{(item as any).mealType}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ ...Typography.bodyMedium, color: colors.primary, fontWeight: 'bold' }}>{(item as any).calories} kcal</Text>
                      <Text style={{ ...Typography.labelMedium, color: colors.onSurfaceVariant }}>
                        P: {(item as any).protein}g • C: {(item as any).carbs}g • G: {(item as any).fat}g
                      </Text>
                    </View>
                  </View>
                </Card>
              );
        }}
        ListHeaderComponent={() => (
          <View>
            <View style={styles.header}>
              <Text style={[Typography.headlineLarge, { color: colors.onSurface }]}>Suas Métricas</Text>
              <Text style={[Typography.labelMedium, { color: colors.onSurfaceVariant }]}>Acompanhe seu progresso diário</Text>
            </View>

            <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
                nestedScrollEnabled
                directionalLockEnabled
              >
            <TouchableOpacity onPress={() => setSelectedMetric('weight')} style={[styles.smallSelector, { backgroundColor: colors.background, borderColor: colors.outlineVariant }, selectedMetric === 'weight' && { backgroundColor: colors.primary, borderColor: colors.primary }, { marginRight: 8 }]}>
              <Text style={[styles.smallSelectorText, { color: colors.onSurfaceVariant }, selectedMetric === 'weight' && { color: colors.onPrimary }]}>Peso</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedMetric('steps')} style={[styles.smallSelector, { backgroundColor: colors.background, borderColor: colors.outlineVariant }, selectedMetric === 'steps' && { backgroundColor: colors.primary, borderColor: colors.primary }, { marginRight: 8 }]}>
              <Text style={[styles.smallSelectorText, { color: colors.onSurfaceVariant }, selectedMetric === 'steps' && { color: colors.onPrimary }]}>Média de passos</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedMetric('sleep_duration')} style={[styles.smallSelector, { backgroundColor: colors.background, borderColor: colors.outlineVariant }, selectedMetric === 'sleep_duration' && { backgroundColor: colors.primary, borderColor: colors.primary }, { marginRight: 8 }]}>
              <Text style={[styles.smallSelectorText, { color: colors.onSurfaceVariant }, selectedMetric === 'sleep_duration' && { color: colors.onPrimary }]}>Duração do Sono</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedMetric('sleep_quality')} style={[styles.smallSelector, { backgroundColor: colors.background, borderColor: colors.outlineVariant }, selectedMetric === 'sleep_quality' && { backgroundColor: colors.primary, borderColor: colors.primary }, { marginRight: 8 }]}>
              <Text style={[styles.smallSelectorText, { color: colors.onSurfaceVariant }, selectedMetric === 'sleep_quality' && { color: colors.onPrimary }]}>Qualidade do Sono</Text>
            </TouchableOpacity>
              </ScrollView>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ flexDirection: 'row', alignItems: 'center' }}
                nestedScrollEnabled
                directionalLockEnabled
              >
              {[7, 15, 30, 90, 180, 365].map((d) => (
                <TouchableOpacity key={d} onPress={() => setRangeDays(d)} style={[styles.rangeButton, { backgroundColor: colors.background, borderColor: colors.outlineVariant }, rangeDays === d && { backgroundColor: colors.primary, borderColor: colors.primary }, { marginRight: 8 }]}>
                  <Text style={[styles.rangeText, { color: colors.onSurfaceVariant }, rangeDays === d && { color: colors.onPrimary }]}>{getRangeLabel(d)}</Text>
                </TouchableOpacity>
              ))}
              </ScrollView>
            </View>

            {(() => {
              if (selectedMetric === 'steps') {
                const days: { date: string; value: number }[] = [];
                for (let i = rangeDays - 1; i >= 0; i--) {
                  const d = new Date();
                  d.setDate(d.getDate() - i);
                  const key = d.toISOString().slice(0, 10);
                  const found = activityLogs.find((a: any) => (a.date || '').startsWith(key));
                  days.push({ date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }), value: found ? found.steps : 0 });
                }
                return <EvolutionCharts title={`Média de passos (${getRangeLabel(rangeDays)})`} data={days} />;
              }

              if (selectedMetric === 'weight') {
                const data: { date: string; value: number }[] = [];
                if (userProfile && typeof userProfile.weight === 'number') {
                  for (let i = rangeDays - 1; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    data.push({ date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }), value: Math.round(userProfile.weight) });
                  }
                }
                return <EvolutionCharts title={`Peso (${getRangeLabel(rangeDays)})`} data={data} />;
              }

              if (selectedMetric === 'sleep_duration') {
                const days: { date: string; value: number }[] = [];
                for (let i = rangeDays - 1; i >= 0; i--) {
                  const d = new Date();
                  d.setDate(d.getDate() - i);
                  const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                  
                  const startOfDay = new Date(d);
                  startOfDay.setHours(0, 0, 0, 0);
                  const endOfDay = new Date(d);
                  endOfDay.setHours(23, 59, 59, 999);
                  
                  const logsForDay = sleepLogs.filtered('endTime >= $0 AND endTime <= $1', startOfDay, endOfDay);
                  let totalHours = 0;
                  logsForDay.forEach(log => {
                    totalHours += (log.endTime.getTime() - log.startTime.getTime()) / (1000 * 60 * 60);
                  });
                  
                  days.push({ date: dateStr, value: parseFloat(totalHours.toFixed(1)) });
                }
                return <EvolutionCharts title={`Duração do Sono (horas - ${getRangeLabel(rangeDays)})`} data={days} />;
              }

              if (selectedMetric === 'sleep_quality') {
                const days: { date: string; value: number }[] = [];
                for (let i = rangeDays - 1; i >= 0; i--) {
                  const d = new Date();
                  d.setDate(d.getDate() - i);
                  const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                  
                  const startOfDay = new Date(d);
                  startOfDay.setHours(0, 0, 0, 0);
                  const endOfDay = new Date(d);
                  endOfDay.setHours(23, 59, 59, 999);
                  
                  const logsForDay = sleepLogs.filtered('endTime >= $0 AND endTime <= $1', startOfDay, endOfDay);
                  let avgQuality = 0;
                  if (logsForDay.length > 0) {
                    const sum = logsForDay.reduce((acc, log) => acc + log.quality, 0);
                    avgQuality = sum / logsForDay.length;
                  }
                  
                  days.push({ date: dateStr, value: parseFloat(avgQuality.toFixed(1)) });
                }
                return <EvolutionCharts title={`Qualidade do Sono (1-5 - ${getRangeLabel(rangeDays)})`} data={days} />;
              }

              return null;
            })()}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabContainer}
              nestedScrollEnabled
              directionalLockEnabled
            >
        <TouchableOpacity
            style={[styles.tabButton, { backgroundColor: colors.background, borderColor: colors.outlineVariant }, activeTab === 'pressure' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setActiveTab('pressure')}
          >
            <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.tabText, { color: colors.onSurfaceVariant }, activeTab === 'pressure' && { color: colors.onPrimary }]}>Pressão</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, { backgroundColor: colors.background, borderColor: colors.outlineVariant }, activeTab === 'mood' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setActiveTab('mood')}
          >
            <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.tabText, { color: colors.onSurfaceVariant }, activeTab === 'mood' && { color: colors.onPrimary }]}>Humor</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, { backgroundColor: colors.background, borderColor: colors.outlineVariant }, activeTab === 'sleep' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setActiveTab('sleep')}
          >
            <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.tabText, { color: colors.onSurfaceVariant }, activeTab === 'sleep' && { color: colors.onPrimary }]}>Sono</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, { backgroundColor: colors.background, borderColor: colors.outlineVariant }, activeTab === 'symptoms' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setActiveTab('symptoms')}
          >
            <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.tabText, { color: colors.onSurfaceVariant }, activeTab === 'symptoms' && { color: colors.onPrimary }]}>Sintomas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, { backgroundColor: colors.background, borderColor: colors.outlineVariant }, activeTab === 'meals' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setActiveTab('meals')}
          >
            <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.tabText, { color: colors.onSurfaceVariant }, activeTab === 'meals' && { color: colors.onPrimary }]}>Alimentação</Text>
          </TouchableOpacity>
            </ScrollView>

            {activeTab === 'symptoms' && (
              <View style={{ paddingHorizontal: 20 }}>
                <SymptomWidget />
              </View>
            )}
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<View style={styles.emptyContainer}><Text style={[Typography.bodyMedium, { color: colors.onSurfaceVariant }]}>Nenhum registro encontrado.</Text></View>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 14,
    gap: 12,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 88,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    ...Typography.bodyMedium,
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 20,
    paddingTop: 18,
  },
  measurementCard: {
    marginBottom: 15,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  dateText: {
    ...Typography.labelMedium,
    fontSize: 13,
  },
  readingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  bpValue: {
    ...Typography.titleLarge,
    fontSize: 28,
  },
  separator: {
    fontWeight: '300',
  },
  unit: {
    ...Typography.bodyMedium,
    fontSize: 16,
  },
  statusLabel: {
    ...Typography.labelMedium,
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  moodContent: {
    marginTop: 4,
  },
  moodLabel: {
    ...Typography.titleMedium,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  noteText: {
    ...Typography.bodyMedium,
    fontSize: 14,
    fontStyle: 'italic',
  },
  emptyNoteText: {
    ...Typography.labelMedium,
    fontSize: 12,
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallSelector: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  smallSelectorText: {
    ...Typography.bodyMedium,
    fontSize: 13,
  },
  qualityContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  rangeButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  rangeText: {
    ...Typography.bodyMedium,
    fontSize: 13,
  },
});
