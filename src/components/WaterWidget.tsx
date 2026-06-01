import { Card } from '@/components/Card';
import { ProgressCircle } from '@/components/ProgressCircle';
import ShareProgressButton from '@/components/ShareProgressButton';
import { TypographyColors } from '@/constants/Typography';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@/context/RealmProvider';
import { useSync } from '@/hooks/useSync';
import { useTheme } from '@/hooks/useTheme';
import { useWaterGoal } from '@/hooks/useWaterGoal';
import { HydrationLog } from '@/models/HydrationLog';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Realm } from '@realm/react';
import React, { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export const WaterWidget = () => {
  const { colors } = useTheme();
  const textStyles = TypographyColors(colors);
  const { currentUser } = useAuth();
  const user = currentUser;
  const { save } = useSync();
  const { baseGoal, targetGoal, isAdjusted } = useWaterGoal();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const logs = useQuery(HydrationLog, (collection) =>
    collection.filtered('timestamp >= $0', today), [today]
  );

  const currentIntake = useMemo(() => {
    return logs.reduce((acc, log) => acc + log.amount, 0);
  }, [logs]);

  const defaultGoal = baseGoal;
  const progress = Math.min(currentIntake / targetGoal, 1);

  const shareMessage = useMemo(() => {
    if (currentIntake >= targetGoal) {
      const extra = isAdjusted ? ' (meta aumentada por exercício intenso)' : '';
      return `Bati minha meta de água hoje: bebi ${currentIntake}ml de ${targetGoal}ml${extra}. #Saude10`;
    }
    const extra = isAdjusted ? ' (meta aumentada por exercício intenso)' : '';
    return `Hoje já bebi ${currentIntake}ml de ${targetGoal}ml de água${extra}. Continuo cuidando da minha hidratação. #Saude10`;
  }, [currentIntake, targetGoal, isAdjusted]);

  const [modalVisible, setModalVisible] = useState(false);
  const [newGoal, setNewGoal] = useState(targetGoal.toString());

  const handleAddWater = (amount: number) => {
    if (!user) {
      Alert.alert('Atenção', 'Faça login para registrar a ingestão de água.');
      return;
    }

    const newId = new Realm.BSON.ObjectId();
    save('HydrationLog', newId.toHexString(), {
      _id: newId,
      amount,
      timestamp: new Date(),
      userId: user._id,
    });
  };

  const handleRemoveWater = (amount: number) => {
    if (currentIntake <= 0) return;

    const amountToRemove = Math.min(amount, currentIntake);

    if (!user) {
      Alert.alert('Atenção', 'Faça login para remover ingestão de água.');
      return;
    }

    const newId = new Realm.BSON.ObjectId();
    save('HydrationLog', newId.toHexString(), {
      _id: newId,
      amount: -amountToRemove,
      timestamp: new Date(),
      userId: user._id,
    });
  };

  const handleUpdateGoal = () => {
    const goalValue = parseInt(newGoal);
    if (!isNaN(goalValue) && goalValue > 0) {
      if (user) {
        save('UserProfile', user._id, { waterGoal: goalValue });
      }
      setModalVisible(false);
    }
  };

  return (
    <>
      <TouchableOpacity activeOpacity={0.8} onPress={() => setModalVisible(true)}>
        <Card style={styles.container}>
          <View style={styles.header}>
            <View style={[styles.iconContainer]}>
              <MaterialCommunityIcons name="water" size={20} color={colors.water} />
            </View>
            <View style={styles.titleSection}>
              <Text style={[styles.title, textStyles.h3, { color: colors.text }]}>Hidratação</Text>
              <Text style={[styles.subtitle, textStyles.caption, { color: colors.textSecondary }]}>
                META DIÁRIA: {targetGoal}ml
                {isAdjusted && (
                  <Text style={[styles.adjustmentBadge, { color: colors.qualityStar }]}> +15% (exercício intenso)</Text>
                )}
              </Text>
            </View>
          </View>

            <View style={styles.content}>
            <ProgressCircle size={100} progress={progress} strokeWidth={8} color={colors.water} backgroundColor={colors.border}>
              <View style={styles.progressContent}>
                <Text style={[styles.currentValue, { color: colors.water }]}>{currentIntake}</Text>
                <Text style={[styles.unit, textStyles.caption]}>ml</Text>
              </View>
            </ProgressCircle>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.water }]}
                onPress={() => handleAddWater(250)}
                onLongPress={() => handleRemoveWater(250)}
                delayLongPress={500}
              >
                <Ionicons name="add" size={24} color={colors.white} />
                <Text style={[styles.addButtonText, { color: colors.white }]}>250ml</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.water + '20' }]}
                onPress={() => handleAddWater(500)}
                onLongPress={() => handleRemoveWater(500)}
                delayLongPress={500}
              >
                <Ionicons name="add" size={24} color={colors.water} />
                <Text style={[styles.addButtonText, { color: colors.water }]}>500ml</Text>
              </TouchableOpacity>
            </View>
            <ShareProgressButton compact message={shareMessage} buttonStyle={styles.shareButton} />
          </View>
        </Card>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={[styles.modalOverlay, { backgroundColor: colors.shadow + '80' }]} onPress={() => setModalVisible(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: colors.white }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modalTitle, textStyles.h2, { color: colors.text }]}>Ajustar Meta de Água</Text>
            <Text style={[styles.modalSubtitle, textStyles.caption, { color: colors.textSecondary }]}>
              Recomendação baseada no seu peso: {defaultGoal}ml
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, textStyles.caption, { color: colors.textSecondary }]}>NOVA META (ml)</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                placeholder={defaultGoal.toString()}
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={newGoal}
                onChangeText={setNewGoal}
              />
            </View>

            <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleUpdateGoal}>
              <Text style={[styles.saveButtonText, { color: colors.white }]}>SALVAR META</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  unit: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionRow: {
    flex: 1,
    marginLeft: 20,
    gap: 8,
  },
  shareButton: {
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  addButtonText: {
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 24,
    padding: 24,
    width: '100%',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  adjustmentBadge: {
    fontSize: 10,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontWeight: '800',
    fontSize: 16,
  },
});
