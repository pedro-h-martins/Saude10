import { Card } from '@/components/Card';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useQuery } from "@/context/RealmProvider";
import { BloodPressure } from '@/models/BloodPressure';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


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
  const measurements = useQuery(BloodPressure).sorted('timestamp', true);

  const renderItem = ({ item }: { item: BloodPressure }) => {
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={Typography.h1}>Histórico de Pressão</Text>
        <Text style={Typography.caption}>Acompanhe sua saúde cardiovascular</Text>
      </View>

      <FlatList
        data={measurements}
        keyExtractor={(item) => item._id.toHexString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={Typography.body}>Nenhuma medição registrada ainda.</Text>
          </View>
        }
      />
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
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
