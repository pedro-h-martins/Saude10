import { Card } from '@/components/Card';
import EvolutionCharts from '@/components/EvolutionCharts';
import { SymptomWidget } from '@/components/SymptomWidget';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useQuery } from "@/context/RealmProvider";
import { ActivityLog } from '@/models/ActivityLog';
import { BloodPressure } from '@/models/BloodPressure';
import { SymptomLog } from '@/models/SymptomLog';
import { UserProfile } from '@/models/UserProfile';
import { WellnessLog } from '@/models/WellnessLog';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const getMoodConfig = (rating: number) => {
  switch (rating) {
    case 1: return { icon: 'sad-outline', label: 'Péssimo', color: '#E74C3C' };
    case 2: return { icon: 'trending-down-outline', label: 'Mal', color: '#E67E22' };
    case 3: return { icon: 'reorder-two-outline', label: 'Ok', color: '#F1C40F' };
    case 4: return { icon: 'happy-outline', label: 'Bem', color: '#2ECC71' };
    case 5: return { icon: 'star-outline', label: 'Ótimo', color: '#9B59B6' };
    default: return { icon: 'help-outline', label: 'Indefinido', color: Colors.textSecondary };
  }
};


const getBPStatus = (systolic: number, diastolic: number) => {
  if (systolic >= 140 || diastolic >= 90) {
    return { label: 'Hipertensão Estágio 2', color: '#C0392B' };
  } else if (systolic >= 130 || diastolic >= 80) {
    return { label: 'Hipertensão Estágio 1', color: '#E67E22' };
  } else if (systolic >= 120 && diastolic < 80) {
    return { label: 'Elevada', color: '#F1C40F' };
  } else if (systolic < 120 && diastolic < 80) {
    return { label: 'Normal', color: Colors.accent };
  }
  return { label: 'Desconhecido', color: Colors.textSecondary };
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  }) + ', ' + date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function Metrics() {
  const [activeTab, setActiveTab] = useState<'pressure' | 'mood' | 'symptoms'>('pressure');
  const [selectedMetric, setSelectedMetric] = useState<'weight' | 'steps'>('steps');
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
  const activityLogs = useQuery(ActivityLog).sorted('date', true);
  const userProfiles = useQuery(UserProfile);
  const userProfile = userProfiles && userProfiles.length > 0 ? userProfiles[0] : null;

  const renderPressureItem = ({ item }: { item: BloodPressure }) => {
    const status = getBPStatus(item.systolic, item.diastolic);

    return (
      <Card style={styles.measurementCard}>
        <View style={styles.cardHeader}>
          <View style={[styles.statusIndicator, { backgroundColor: status.color }]} />
          <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
        </View>

        <View style={styles.readingContainer}>
          <View>
            <Text style={styles.bpValue}>
              {item.systolic}
              <Text style={styles.separator}>/</Text>
              {item.diastolic}
              <Text style={styles.unit}> mmHg</Text>
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
    const config = getMoodConfig(item.rating);

    return (
      <Card style={styles.measurementCard}>
        <View style={styles.cardHeader}>
          <Ionicons name={config.icon as any} size={20} color={config.color} style={{ marginRight: 8 }} />
          <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
        </View>

        <View style={styles.moodContent}>
          <Text style={[styles.moodLabel, { color: config.color }]}>
            {config.label}
          </Text>
          {item.notes ? (
            <Text style={styles.noteText}>&quot;{item.notes}&quot;</Text>
          ) : (
            <Text style={styles.emptyNoteText}>Sem observações</Text>
          )}
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={Typography.h1}>Suas Métricas</Text>
        <Text style={Typography.caption}>Acompanhe seu progresso diário</Text>
      </View>

      <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
          <TouchableOpacity onPress={() => setSelectedMetric('weight')} style={[styles.smallSelector, selectedMetric === 'weight' && styles.smallSelectorActive]}>
            <Text style={[styles.smallSelectorText, selectedMetric === 'weight' && styles.smallSelectorTextActive]}>Peso</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSelectedMetric('steps')} style={[styles.smallSelector, selectedMetric === 'steps' && styles.smallSelectorActive]}>
            <Text style={[styles.smallSelectorText, selectedMetric === 'steps' && styles.smallSelectorTextActive]}>Média de passos</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {[7, 15, 30, 90, 180, 365].map((d) => (
            <TouchableOpacity key={d} onPress={() => setRangeDays(d)} style={[styles.rangeButton, rangeDays === d && styles.rangeButtonActive]}>
              <Text style={[styles.rangeText, rangeDays === d && styles.rangeTextActive]}>{getRangeLabel(d)}</Text>
            </TouchableOpacity>
          ))}
        </View>
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

        return null;
      })()}

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'pressure' && styles.activeTabButton]}
          onPress={() => setActiveTab('pressure')}
        >
          <Text style={[styles.tabText, activeTab === 'pressure' && styles.activeTabText]}>Pressão</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'mood' && styles.activeTabButton]}
          onPress={() => setActiveTab('mood')}
        >
          <Text style={[styles.tabText, activeTab === 'mood' && styles.activeTabText]}>Humor</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'symptoms' && styles.activeTabButton]}
          onPress={() => setActiveTab('symptoms')}
        >
          <Text style={[styles.tabText, activeTab === 'symptoms' && styles.activeTabText]}>Sintomas</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'pressure' && (
        <FlatList<BloodPressure>
          data={measurements}
          keyExtractor={(item) => item._id.toHexString()}
          renderItem={renderPressureItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={Typography.body}>Nenhum registro encontrado.</Text>
            </View>
          }
        />
      )}

      {activeTab === 'mood' && (
        <FlatList<WellnessLog>
          data={wellnessLogs}
          keyExtractor={(item) => item._id.toHexString()}
          renderItem={renderMoodItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={Typography.body}>Nenhum registro encontrado.</Text>
            </View>
          }
        />
      )}

      {activeTab === 'symptoms' && (
        <>
          <View style={styles.listContent}>
            <SymptomWidget />
          </View>
          <FlatList<SymptomLog>
            data={symptomLogs}
            keyExtractor={(item) => item._id.toHexString()}
            renderItem={({ item }: { item: SymptomLog }) => (
              <Card style={styles.measurementCard}>
                <View style={styles.cardHeader}>
                  <Ionicons name={'medkit-outline' as any} size={20} color={Colors.primary} style={{ marginRight: 8 }} />
                  <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
                </View>
                <View style={{ marginTop: 4 }}>
                  <Text style={styles.noteText}>&quot;{item.description}&quot;</Text>
                </View>
              </Card>
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={Typography.body}>Nenhum registro encontrado.</Text>
              </View>
            }
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 10,
    gap: 12,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: '#eee',
  },
  activeTabButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  listContent: {
    padding: 20,
    paddingTop: 10,
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
    ...Typography.caption,
    fontSize: 13,
  },
  readingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  bpValue: {
    ...Typography.h2,
    fontSize: 28,
  },
  separator: {
    color: Colors.textSecondary,
    fontWeight: '300',
  },
  unit: {
    ...Typography.body,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  statusLabel: {
    ...Typography.caption,
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  moodContent: {
    marginTop: 4,
  },
  moodLabel: {
    ...Typography.h3,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  noteText: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.text,
    fontStyle: 'italic',
  },
  emptyNoteText: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.textSecondary,
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
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: '#eee',
  },
  smallSelectorActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  smallSelectorText: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  smallSelectorTextActive: {
    color: '#fff',
  },
  rangeButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: '#eee',
  },
  rangeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  rangeText: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  rangeTextActive: {
    color: '#fff',
  },
});
