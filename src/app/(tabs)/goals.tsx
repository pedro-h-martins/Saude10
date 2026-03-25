import { Card } from '@/components/Card';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useQuery, useRealm } from '@/context/RealmProvider';
import { Goal } from '@/models/Goal';
import { UserProfile } from '@/models/UserProfile';
import { Ionicons } from '@expo/vector-icons';
import { Realm } from '@realm/react';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GoalsScreen() {
  const realm = useRealm();
  const goals = useQuery(Goal);
  const users = useQuery(UserProfile);
  const user = users[0];

  const [modalVisible, setModalVisible] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');

  const addGoal = () => {
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
      setModalVisible(false);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível adicionar a meta.');
    }
  };

  const deleteGoal = (goal: Goal) => {
    Alert.alert(
      'Excluir Meta',
      'Tem certeza que deseja excluir esta meta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            realm.write(() => {
              realm.delete(goal);
            });
          },
        },
      ]
    );
  };

  const renderGoalItem = ({ item }: { item: Goal }) => (
    <Card style={styles.goalCard}>
      <View style={styles.goalInfo}>
        <Text style={styles.goalTitle}>{item.title}</Text>
        <Text style={styles.goalDate}>Iniciada em: {item.startDate.toLocaleDateString()}</Text>
      </View>
      <TouchableOpacity onPress={() => deleteGoal(item)}>
        <Ionicons name="trash-outline" size={24} color={Colors.warning} />
      </TouchableOpacity>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Minhas Metas</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={goals}
        keyExtractor={(item) => item._id.toHexString()}
        renderItem={renderGoalItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="flag-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>Você ainda não tem metas definidas.</Text>
          </View>
        }
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nova Meta</Text>
            <TextInput
              style={styles.input}
              placeholder="Título da meta (ex: Beber 2L de água)"
              value={newGoalTitle}
              onChangeText={setNewGoalTitle}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={addGoal}
              >
                <Text style={styles.saveButtonText}>Adicionar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    ...Typography.h1,
    color: Colors.text,
  },
  addButton: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
  },
  goalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    padding: 15,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: 4,
  },
  goalDate: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 10,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    width: '80%',
    padding: 20,
    borderRadius: 15,
  },
  modalTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    ...Typography.body,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: '#eee',
  },
  cancelButtonText: {
    color: Colors.text,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
});

