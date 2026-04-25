import { Card } from '@/components/Card';
import { ProgressCircle } from '@/components/ProgressCircle';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@/context/RealmProvider';
import { useSync } from '@/hooks/useSync';
import { HydrationLog } from '@/models/HydrationLog';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Realm } from '@realm/react';
import React, { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export const WaterWidget = () => {
  const { currentUser } = useAuth();
  const user = currentUser;
  const { save } = useSync();
  
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

  const defaultGoal = user?.weight ? Math.round(user.weight * 35) : 2000;
  const targetGoal = user?.waterGoal || defaultGoal;
  const progress = Math.min(currentIntake / targetGoal, 1);

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
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="water" size={20} color="#2196F3" />
            </View>
            <View style={styles.titleSection}>
              <Text style={styles.title}>Hidratação</Text>
              <Text style={styles.subtitle}>META DIÁRIA: {targetGoal}ml</Text>
            </View>
          </View>

          <View style={styles.content}>
            <ProgressCircle size={100} progress={progress} strokeWidth={8}>
              <View style={styles.progressContent}>
                <Text style={styles.currentValue}>{currentIntake}</Text>
                <Text style={styles.unit}>ml</Text>
              </View>
            </ProgressCircle>

            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={styles.addButton} 
                onPress={() => handleAddWater(250)}
                onLongPress={() => handleRemoveWater(250)}
                delayLongPress={500}
              >
                <Ionicons name="add" size={24} color={Colors.white} />
                <Text style={styles.addButtonText}>250ml</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: '#E3F2FD' }]} 
                onPress={() => handleAddWater(500)}
                onLongPress={() => handleRemoveWater(500)}
                delayLongPress={500}
              >
                <Ionicons name="add" size={24} color="#2196F3" />
                <Text style={[styles.addButtonText, { color: '#2196F3' }]}>500ml</Text>
              </TouchableOpacity>
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
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Ajustar Meta de Água</Text>
            <Text style={styles.modalSubtitle}>
              Recomendação baseada no seu peso: {defaultGoal}ml
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>NOVA META (ml)</Text>
              <TextInput
                style={styles.textInput}
                placeholder={defaultGoal.toString()}
                keyboardType="numeric"
                value={newGoal}
                onChangeText={setNewGoal}
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleUpdateGoal}>
              <Text style={styles.saveButtonText}>SALVAR META</Text>
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
    marginBottom: 16,
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
    backgroundColor: '#E3F2FD',
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
    color: '#333',
  },
  subtitle: {
    fontSize: 12,
    color: '#999',
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
    color: '#2196F3',
  },
  unit: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  actionRow: {
    flex: 1,
    marginLeft: 20,
    gap: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  addButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 12,
    padding: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 16,
  },
});
