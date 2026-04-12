import { Card } from '@/components/Card';
import InputWithValidation from '@/components/InputWithValidation';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useRealm } from '@/context/RealmProvider';
import { Goal } from '@/models/Goal';
import { UserProfile } from '@/models/UserProfile';
import { changePassword } from '@/services/auth';
import { formatBirthDate as formatBirthDateFn, sanitizeNumberInput } from '@/utils/formatters';
import { validateBirthDate, validateHeight, validateWeight } from '@/utils/validation';
import { Ionicons } from '@expo/vector-icons';
import { Realm } from '@realm/react';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const calculateAge = (birthDate: Date) => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export default function SettingsScreen() {
  const users = useQuery(UserProfile);
  const goals = useQuery(Goal);
  const { currentUser } = useAuth();
  const user = React.useMemo(() => currentUser, [currentUser]);
  const realm = useRealm();
  const { signOut } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    weight: '',
    height: '',
    birthDate: '',
  });

  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalTitle, setGoalTitle] = useState('');
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const formatDisplayDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatBirthDateInput = (text: string) => setFormData(prev => ({ ...prev, birthDate: formatBirthDateFn(text) }));

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        weight: user.weight.toString(),
        height: user.height.toString(),
        birthDate: formatDisplayDate(user.birthDate),
      });
    }
  }, [user, currentUser]);

  const handleAddGoal = () => {
    if (goals.length >= 3) {
      Alert.alert('Limite Atingido', 'Você pode ter no máximo 3 metas.');
      return;
    }
    setEditingGoal(null);
    setGoalTitle('');
    setGoalModalVisible(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setGoalTitle(goal.title);
    setGoalModalVisible(true);
  };

  const handleDeleteGoal = (goal: Goal) => {
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
            setGoalModalVisible(false);
          },
        },
      ]
    );
  };

  const handleSaveGoal = () => {
    if (!goalTitle.trim()) {
      Alert.alert('Erro', 'Por favor, insira um título para a meta.');
      return;
    }

    try {
      realm.write(() => {
        if (editingGoal) {
          editingGoal.title = goalTitle;
        } else {
          const newGoal = realm.create(Goal, {
            _id: new Realm.BSON.ObjectId(),
            title: goalTitle,
            type: 'custom',
            startDate: new Date(),
            isActive: true,
          });
          if (user) {
            user.goals.push(newGoal);
          }
        }
      });
      setGoalModalVisible(false);
      setGoalTitle('');
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível salvar a meta.');
    }
  };

  const birthYear = React.useMemo(() => (user ? user.birthDate.getFullYear() : ''), [user]);

  const handleSave = () => {
    try {
      const birthCheck = validateBirthDate(formData.birthDate);
      if (!birthCheck.valid) {
        Alert.alert('Validação', birthCheck.error || 'Data inválida');
        return;
      }
      const w = validateWeight(formData.weight);
      const h = validateHeight(formData.height);
      if (!w.valid) {
        Alert.alert('Validação', w.error || 'Peso inválido');
        return;
      }
      if (!h.valid) {
        Alert.alert('Validação', h.error || 'Altura inválida');
        return;
      }

      const parsedDate = birthCheck.date as Date;
      if (calculateAge(parsedDate) <= 14) {
        Alert.alert('Validação', 'É necessário ter mais de 14 anos para criar uma conta.');
        return;
      }
      realm.write(() => {
        if (user) {
          user.name = formData.name;
          user.email = formData.email;
          user.weight = w.value as number;
          user.height = h.value as number;
          user.birthDate = parsedDate;
          user.updatedAt = new Date();
        }
      });
      setIsEditing(false);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
      console.error(error);
    }
  };

  const handlePickAvatar = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permissão', 'Permissão para acessar fotos é necessária.');
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, allowsEditing: true, aspect: [1, 1] });
      if (res.canceled) return;

      if (user) {
        realm.write(() => {
          user.avatarUri = res.assets && res.assets[0] ? res.assets[0].uri : undefined;
          user.updatedAt = new Date();
        });
        Alert.alert('Sucesso', 'Foto de perfil atualizada.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  const handleRemoveAvatar = () => {
    if (!user) return;
    realm.write(() => {
      (user as any).avatarUri = null;
      user.updatedAt = new Date();
    });
    Alert.alert('Removido', 'Foto de perfil removida.');
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        weight: user.weight.toString(),
        height: user.height.toString(),
        birthDate: formatDisplayDate(user.birthDate),
      });
    }
    setIsEditing(false);
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Usuário não encontrado.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={isEditing ? handleCancel : undefined}>
          <Ionicons name={isEditing ? "close" : "arrow-back"} size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configurações</Text>
        <TouchableOpacity onPress={isEditing ? handleSave : () => setIsEditing(true)}>
          <Ionicons name={isEditing ? "checkmark" : "pencil"} size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={isEditing ? handlePickAvatar : undefined} activeOpacity={0.8}>
              <Image
                source={{ uri: user.avatarUri ?? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150' }}
                style={styles.avatar}
              />
            </TouchableOpacity>
            {isEditing && (
              <View style={styles.editAvatarControls}>
                <TouchableOpacity style={styles.editAvatarButton} onPress={handlePickAvatar}>
                  <Ionicons name="camera" size={16} color={Colors.white} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.removeAvatarButton} onPress={handleRemoveAvatar}>
                  <Ionicons name="trash" size={16} color={Colors.white} />
                </TouchableOpacity>
              </View>
            )}
          </View>
          <Text style={styles.sectionLabel}>PERFIL PESSOAL</Text>
          {isEditing ? (
            <View style={styles.editSection}>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Nome"
              />
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="Email"
                keyboardType="email-address"
              />
              <TouchableOpacity style={styles.passwordChangeButton} onPress={() => setPasswordModalVisible(true)}>
                <View style={styles.iconCircleSmall}>
                  <Ionicons name="lock-closed" size={16} color={Colors.white} />
                </View>
                <Text style={styles.passwordChangeText}>Alterar senha</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </>
          )}
        </View>


        <Text style={styles.sectionTitle}>Biometria e Fisiologia</Text>
        <View style={styles.biometryGrid}>
          <Card style={styles.biometryCard}>
            <Ionicons name="man-outline" size={24} color={Colors.primary} />
                  {isEditing ? (
                    <InputWithValidation
                      style={styles.biometryInput}
                      value={formData.birthDate}
                      onChangeText={formatBirthDateInput}
                      keyboardType="numeric"
                      maxLength={10}
                    />
                  ) : (
                    <Text style={styles.biometryValue}>{birthYear}</Text>
                  )}
            <Text style={styles.biometryLabel}>{isEditing ? 'NASCIMENTO' : 'ANO DE NASCIMENTO'}</Text>
          </Card>
          <Card style={styles.biometryCard}>
            <Ionicons name="resize-outline" size={24} color={Colors.primary} />
            {isEditing ? (
              <InputWithValidation
                style={styles.biometryInput}
                value={formData.height}
                onChangeText={(text) => setFormData({ ...formData, height: sanitizeNumberInput(text, 6) })}
                keyboardType="numeric"
              />
            ) : (
              <Text style={styles.biometryValue}>{user.height.toFixed(2)}</Text>
            )}
            <Text style={styles.biometryLabel}>ALTURA (CM)</Text>
          </Card>
        </View>

        <Card style={styles.weightCard}>
          <View style={styles.weightHeader}>
            <Ionicons name="scale-outline" size={24} color={Colors.white} />
          </View>
          {isEditing ? (
            <InputWithValidation
              style={[styles.weightValue, { color: Colors.primary, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 10 }]}
              value={formData.weight}
              onChangeText={(text) => setFormData({ ...formData, weight: sanitizeNumberInput(text, 6) })}
              keyboardType="numeric"
            />
          ) : (
            <Text style={styles.weightValue}>{user.weight}</Text>
          )}
          <Text style={styles.weightLabel}>PESO (KG)</Text>
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Metas de Saúde</Text>
          {goals.length < 3 && (
            <TouchableOpacity onPress={handleAddGoal}>
              <Ionicons name="add-circle" size={28} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.sectionSubtitle}>Gerencie suas metas ativas (Máximo 3).</Text>

        {goals.map((goal) => {
          const isSelected = goal.isActive;
          return (
            <View key={goal._id.toHexString()} style={[styles.goalItem, isSelected && styles.goalItemActive]}>
              <TouchableOpacity 
                style={styles.goalInfo} 
                onPress={() => {
                  if (isEditing) {
                    handleEditGoal(goal);
                  } else {
                    realm.write(() => {
                      goal.isActive = !goal.isActive;
                    });
                  }
                }}
              >
                <Ionicons 
                  name={isSelected ? "checkbox" : "square-outline"} 
                  size={22} 
                  color={isSelected ? Colors.primary : Colors.textSecondary} 
                  style={styles.goalIcon} 
                />
                <Text style={[styles.goalText, isSelected && styles.goalTextActive]}>{goal.title}</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        
        {goals.length === 0 && (
          <TouchableOpacity 
            style={styles.goalButton}
            onPress={handleAddGoal}
          >
            <Ionicons name="add-outline" size={18} color={Colors.primary} style={styles.goalIcon} />
            <Text style={[styles.goalButtonText, { color: Colors.primary }]}>Adicionar primeira meta</Text>
          </TouchableOpacity>
        )}

        {!isEditing && (
          <View style={styles.bottomMenu}>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIconCircle}>
                <Ionicons name="notifications-outline" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.menuItemText}>Notificações e Lembretes</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIconCircle}>
                <Ionicons name="shield-checkmark-outline" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.menuItemText}>Privacidade de Dados</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => signOut()}>
              <View style={[styles.menuIconCircle, { backgroundColor: '#FFEEED' }] }>
                <Ionicons name="log-out-outline" size={20} color={Colors.warning} />
              </View>
              <Text style={[styles.menuItemText, { color: Colors.warning }]}>Sair da conta</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={goalModalVisible}
        onRequestClose={() => setGoalModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingGoal ? 'Editar Meta' : 'Nova Meta'}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Título da meta"
              value={goalTitle}
              onChangeText={setGoalTitle}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setGoalModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveGoal}
              >
                <Text style={styles.saveButtonText}>{editingGoal ? 'Salvar' : 'Adicionar'}</Text>
              </TouchableOpacity>
            </View>
            {editingGoal && (
              <TouchableOpacity
                style={styles.deleteGoalButton}
                onPress={() => handleDeleteGoal(editingGoal)}
              >
                <Ionicons name="trash-outline" size={18} color={Colors.warning} />
                <Text style={styles.deleteGoalButtonText}>Excluir Meta</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={passwordModalVisible}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Alterar Senha</Text>
            <InputWithValidation
              placeholder="Senha atual"
              secureTextEntry
              value={pwdCurrent}
              onChangeText={(t) => setPwdCurrent(t)}
              containerStyle={{ marginBottom: 12 }}
            />
            <InputWithValidation
              placeholder="Nova senha"
              secureTextEntry
              value={pwdNew}
              onChangeText={(t) => setPwdNew(t)}
              containerStyle={{ marginBottom: 12 }}
            />
            <InputWithValidation
              placeholder="Confirmar nova senha"
              secureTextEntry
              value={pwdConfirm}
              onChangeText={(t) => setPwdConfirm(t)}
              containerStyle={{ marginBottom: 8 }}
            />
            {pwdError ? <Text style={{ color: Colors.warning, marginBottom: 8 }}>{pwdError}</Text> : null}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setPasswordModalVisible(false);
                  setPwdCurrent('');
                  setPwdNew('');
                  setPwdConfirm('');
                  setPwdError(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={async () => {
                  setPwdError(null);
                  if (!pwdCurrent) {
                    setPwdError('Informe sua senha atual');
                    return;
                  }
                  if (pwdNew.length < 6) {
                    setPwdError('A nova senha deve ter ao menos 6 caracteres');
                    return;
                  }
                  if (pwdNew !== pwdConfirm) {
                    setPwdError('Confirmação não confere');
                    return;
                  }
                  try {
                    setIsChangingPassword(true);
                    const res = await changePassword(pwdCurrent, pwdNew as string) as any;
                    if (res && res.offline) {
                      Alert.alert('Offline', 'Alteração de senha salva e será enviada quando online.');
                    } else {
                      Alert.alert('Sucesso', 'Senha atualizada com sucesso.');
                    }
                    setPasswordModalVisible(false);
                    setPwdCurrent('');
                    setPwdNew('');
                    setPwdConfirm('');
                  } catch (e: any) {
                    console.error(e);
                    setPwdError(e?.message || 'Não foi possível alterar a senha');
                  } finally {
                    setIsChangingPassword(false);
                  }
                }}
              >
                <Text style={styles.saveButtonText}>{isChangingPassword ? 'Atualizando...' : 'Atualizar'}</Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: Colors.white,
  },
  headerTitle: {
    ...Typography.h3,
  },
  scrollContent: {
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.white,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: Colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  editAvatarControls: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    flexDirection: 'row',
    gap: 8,
  },
  removeAvatarButton: {
    backgroundColor: Colors.warning,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  sectionLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 1.2,
  },
  userName: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: 4,
  },
  userEmail: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  editSection: {
    width: '100%',
    paddingHorizontal: 20,
  },
  input: {
    backgroundColor: Colors.white,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Typography.body,
  },
  sectionCard: {
    padding: 15,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  rowValue: {
    ...Typography.body,
    color: Colors.text,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginTop: 10,
    marginBottom: 15,
  },
  sectionSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: 15,
  },
  biometryGrid: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  biometryCard: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
  },
  biometryValue: {
    ...Typography.h2,
    color: Colors.text,
    marginTop: 10,
    marginBottom: 5,
  },
  biometryInput: {
    ...Typography.h2,
    color: Colors.primary,
    marginTop: 10,
    marginBottom: 5,
    textAlign: 'center',
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  biometryLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  weightCard: {
    backgroundColor: Colors.primary,
    padding: 20,
    alignItems: 'center',
    flexDirection: 'column',
    marginBottom: 25,
  },
  weightHeader: {
    marginBottom: 10,
  },
  weightValue: {
    ...Typography.h1,
    color: Colors.white,
    marginBottom: 5,
  },
  weightLabel: {
    ...Typography.caption,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  goalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  goalButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: '#F0F7FF',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    marginRight: 12,
  },
  goalIcon: {
    marginRight: 12,
  },
  goalButtonText: {
    ...Typography.body,
    color: Colors.text,
  },
  goalButtonTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  bottomMenu: {
    marginTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuItemText: {
    ...Typography.body,
    fontWeight: '600',
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  goalItemActive: {
    borderColor: Colors.primary,
    backgroundColor: '#F0F7FF',
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalText: {
    ...Typography.body,
    color: Colors.text,
    marginLeft: 10,
  },
  goalTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  goalActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 5,
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 25,
    width: '100%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    ...Typography.h2,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 20,
    ...Typography.body,
  },
  passwordChangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 6,
  },
  iconCircleSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  passwordChangeText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  deleteGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
  },
  deleteGoalButtonText: {
    ...Typography.body,
    color: Colors.warning,
    fontWeight: '600',
  },
});

