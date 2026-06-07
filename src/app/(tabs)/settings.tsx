import AudioLibraryComponent from '@/components/AudioLibrary';
import { Card } from '@/components/Card';
import { InputWithValidation } from '@/components/InputWithValidation';
import ShareProgressButton from '@/components/ShareProgressButton';
import { Typography } from '@/constants/Typography';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useQuery, useRealm } from '@/context/RealmProvider';
import { useSync } from '@/hooks/useSync';
import { Goal } from '@/models/Goal';
import { changePassword } from '@/services/auth';
import { EXPORT_CATEGORIES, exportHealthData, type ExportCategoryKey } from '@/services/exportData';
import { sendCategoryReportEmail } from '@/services/weeklyReport';
import { formatBirthDate as formatBirthDateFn, sanitizeNumberInput } from '@/utils/formatters';
import { validateBirthDate, validateHeight, validateWeight } from '@/utils/validation';
import { Ionicons } from '@expo/vector-icons';
import { Realm } from '@realm/react';
import * as FileSystem from 'expo-file-system';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const { colors, isDark, mode, setMode } = useTheme();
  const insets = useSafeAreaInsets();
  const goals = useQuery(Goal);
  const { currentUser } = useAuth();
  const user = React.useMemo(() => currentUser, [currentUser]);
  const realm = useRealm();
  const { signOut } = useAuth();
  const { save } = useSync();

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
  const [audioLibraryVisible, setAudioLibraryVisible] = useState(false);
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [selectedExportCategories, setSelectedExportCategories] = useState<ExportCategoryKey[]>(EXPORT_CATEGORIES.map((category) => category.key));
  const [isExporting, setIsExporting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

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
            if (user) {
              const updatedGoals = user.goals.filter(g => g._id.toHexString() !== goal._id.toHexString());
              save('UserProfile', user._id, { goals: updatedGoals });
            }
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
      const isNew = !editingGoal;
      const newGoalId = isNew ? new Realm.BSON.ObjectId() : editingGoal!._id;
      
      const goalData = {
        _id: newGoalId,
        title: goalTitle,
        type: 'custom',
        startDate: new Date(),
        isActive: true,
      };

      save('Goal', newGoalId.toHexString(), goalData);
      
      if (isNew && user) {
        realm.write(() => {
          const newGoal = realm.objectForPrimaryKey(Goal, newGoalId);
          if (newGoal && user) {
             user.goals.push(newGoal);
             save('UserProfile', user._id, { goals: user.goals });
          }
        });
      }
      
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

      if (user) {
        save('UserProfile', user._id, {
          name: formData.name,
          email: formData.email,
          weight: w.value as number,
          height: h.value as number,
          birthDate: parsedDate,
          updatedAt: new Date(),
        });
      }
      setIsEditing(false);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
      console.error(error);
    }
  };

  const handleExportData = async () => {
    if (!user) {
      return;
    }

    if (selectedExportCategories.length === 0) {
      Alert.alert('Selecione categorias', 'Escolha pelo menos uma categoria para exportar.');
      return;
    }

    try {
      setIsExporting(true);
      const directory = await FileSystem.Directory.pickDirectoryAsync();
      if (!directory) {
        Alert.alert('Exportação cancelada', 'Nenhuma pasta selecionada.');
        return;
      }

      const { uri } = await exportHealthData(realm, user._id, selectedExportCategories, directory.uri);
      Alert.alert('Exportado', `Arquivo salvo em:\n${uri}`);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível exportar seus dados.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSendReportEmail = async () => {
    if (!user) {
      return;
    }

    if (selectedExportCategories.length === 0) {
      Alert.alert('Selecione categorias', 'Escolha pelo menos uma categoria para o relatório.');
      return;
    }

    if (!user.email) {
      Alert.alert('E-mail ausente', 'Cadastre um e-mail no seu perfil para receber o relatório.');
      return;
    }

    try {
      setIsSendingEmail(true);
      const { sent, method } = await sendCategoryReportEmail(
        realm,
        user._id,
        selectedExportCategories,
        user.name || 'Usuário',
        user.email,
      );

      if (method === 'mail' && !sent) {
        Alert.alert('Cancelado', 'O envio do e-mail foi cancelado.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível enviar o relatório. Tente novamente.');
    } finally {
      setIsSendingEmail(false);
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
        save('UserProfile', user._id, {
          avatarUri: res.assets && res.assets[0] ? res.assets[0].uri : null,
          updatedAt: new Date(),
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
    save('UserProfile', user._id, {
      avatarUri: null,
      updatedAt: new Date(),
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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.onSurface }}>Usuário não encontrado.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: colors.surfaceContainerLowest }]}>
        <TouchableOpacity onPress={isEditing ? handleCancel : undefined}>
          <Ionicons name={isEditing ? "close" : "arrow-back"} size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Configurações</Text>
        <TouchableOpacity onPress={isEditing ? handleSave : () => setIsEditing(true)}>
          <Ionicons name={isEditing ? "checkmark" : "pencil"} size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={isEditing ? handlePickAvatar : undefined} activeOpacity={0.8}>
              <Image
                source={{ uri: user.avatarUri ?? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150' }}
                style={[styles.avatar, { borderColor: colors.surfaceContainerLowest }]}
              />
            </TouchableOpacity>
            {isEditing && (
              <View style={styles.editAvatarControls}>
                <TouchableOpacity style={[styles.editAvatarButton, { backgroundColor: colors.primary, borderColor: colors.surfaceContainerLowest }]} onPress={handlePickAvatar}>
                  <Ionicons name="camera" size={16} color={colors.white} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.removeAvatarButton, { backgroundColor: colors.warning, borderColor: colors.surfaceContainerLowest }]} onPress={handleRemoveAvatar}>
                  <Ionicons name="trash" size={16} color={colors.white} />
                </TouchableOpacity>
              </View>
            )}
          </View>
          <Text style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>PERFIL PESSOAL</Text>
          {isEditing ? (
            <View style={styles.editSection}>
              <TextInput
style={[styles.input, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant }]}
          value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Nome"
              />
              <TextInput
style={[styles.input, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant }]}
          value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="Email"
                keyboardType="email-address"
              />
<TouchableOpacity style={[styles.passwordChangeButton, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant }]} onPress={() => setPasswordModalVisible(true)}>
          <View style={[styles.iconCircleSmall, { backgroundColor: colors.primary }]}>
            <Ionicons name="lock-closed" size={16} color={colors.white} />
          </View>
          <Text style={[styles.passwordChangeText, { color: colors.onSurface }]}>Alterar senha</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
<Text style={[styles.userName, { color: colors.onSurface }]}>{user.name}</Text>
      <Text style={[styles.userEmail, { color: colors.onSurfaceVariant }]}>{user.email}</Text>
            </>
          )}
        </View>


        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Biometria e Fisiologia</Text>
        <View style={styles.biometryGrid}>
          <Card style={styles.biometryCard}>
            <Ionicons name="man-outline" size={24} color={colors.primary} />
                  {isEditing ? (
<InputWithValidation
          style={[styles.biometryInput, { color: colors.primary, backgroundColor: colors.cancelButtonBackground }]}
          value={formData.birthDate}
                      onChangeText={formatBirthDateInput}
                      keyboardType="numeric"
                      maxLength={10}
                    />
                  ) : (
                    <Text style={[styles.biometryValue, { color: colors.onSurface }]}>{birthYear}</Text>
                  )}
            <Text style={[styles.biometryLabel, { color: colors.onSurfaceVariant }]}>{isEditing ? 'NASCIMENTO' : 'ANO DE NASCIMENTO'}</Text>
          </Card>
          <Card style={styles.biometryCard}>
            <Ionicons name="resize-outline" size={24} color={colors.primary} />
            {isEditing ? (
<InputWithValidation
          style={[styles.biometryInput, { color: colors.primary, backgroundColor: colors.cancelButtonBackground }]}
          value={formData.height}
                onChangeText={(text) => setFormData({ ...formData, height: sanitizeNumberInput(text, 6) })}
                keyboardType="numeric"
              />
            ) : (
              <Text style={[styles.biometryValue, { color: colors.onSurface }]}>{user.height.toFixed(2)}</Text>
            )}
            <Text style={[styles.biometryLabel, { color: colors.onSurfaceVariant }]}>ALTURA (CM)</Text>
          </Card>
        </View>

        <Card style={[styles.weightCard, { backgroundColor: colors.primary }]}>
          <View style={styles.weightHeader}>
            <Ionicons name="scale-outline" size={24} color={colors.white} />
          </View>
          {isEditing ? (
            <InputWithValidation
              style={[styles.weightValue, { color: colors.primary, backgroundColor: colors.surfaceContainerLowest, borderRadius: 8, paddingHorizontal: 10 }]}
              value={formData.weight}
              onChangeText={(text) => setFormData({ ...formData, weight: sanitizeNumberInput(text, 6) })}
              keyboardType="numeric"
            />
          ) : (
            <Text style={[styles.weightValue, { color: colors.onPrimary }]}>{user.weight}</Text>
          )}
          <Text style={styles.weightLabel}>PESO (KG)</Text>
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Metas de Saúde</Text>
          {goals.length < 3 && (
            <TouchableOpacity onPress={handleAddGoal}>
              <Ionicons name="add-circle" size={28} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.sectionSubtitle, { color: colors.onSurfaceVariant }]}>Gerencie suas metas ativas (Máximo 3).</Text>

        {goals.map((goal) => {
          const isSelected = goal.isActive;
          return (
            <View key={goal._id.toHexString()} style={[styles.goalItem, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant }, isSelected && styles.goalItemActive, isSelected && { borderColor: colors.primary, backgroundColor: colors.waterLight }]}>
              <TouchableOpacity 
                style={styles.goalInfo} 
                onPress={() => {
                  if (isEditing) {
                    handleEditGoal(goal);
                  } else {
                    save('Goal', goal._id.toHexString(), { isActive: !goal.isActive });
                  }
                }}
              >
                <Ionicons 
                  name={isSelected ? "checkbox" : "square-outline"} 
                  size={22} 
                  color={isSelected ? colors.primary : colors.onSurfaceVariant} 
                  style={styles.goalIcon} 
                />
                <Text style={[styles.goalText, { color: colors.onSurface }, isSelected && styles.goalTextActive, isSelected && { color: colors.primary }]}>{goal.title}</Text>
              </TouchableOpacity>
              {!isEditing && (
                <ShareProgressButton
                  compact
                  title="Compartilhar meta"
                  message={`Minha meta ativa no Saude10: ${goal.title}`}
                  buttonStyle={[styles.shareActionButton, { backgroundColor: colors.primary }]}
                />
              )}
            </View>
          );
        })}

        
        {goals.length === 0 && (
<TouchableOpacity
      style={[styles.goalButton, { backgroundColor: colors.surfaceContainerLowest }]}
      onPress={handleAddGoal}
    >
            <Ionicons name="add-outline" size={18} color={colors.primary} style={styles.goalIcon} />
            <Text style={[styles.goalButtonText, { color: colors.primary }]}>Adicionar primeira meta</Text>
          </TouchableOpacity>
        )}

      {!isEditing && (
        <View style={[styles.reportSection, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant }]}>
        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Relatório</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.onSurfaceVariant }]}>Selecione as categorias que deseja incluir no relatório.</Text>
          {EXPORT_CATEGORIES.map((category) => {
            const selected = selectedExportCategories.includes(category.key);
            return (
              <TouchableOpacity
                key={category.key}
                style={[styles.exportCategoryRow, { backgroundColor: colors.cancelButtonBackground, borderColor: colors.outlineVariant }, selected && styles.exportCategoryRowSelected, selected && { backgroundColor: colors.waterLight, borderColor: colors.primary }]}
                onPress={() => {
                  setSelectedExportCategories((prev) =>
                    prev.includes(category.key)
                      ? prev.filter((item) => item !== category.key)
                      : [...prev, category.key]
                  );
                }}
              >
                <Ionicons
                  name={selected ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={selected ? colors.primary : colors.onSurfaceVariant}
                />
                <Text style={[styles.exportCategoryText, { color: colors.onSurface }, selected && styles.exportCategoryTextSelected, selected && { color: colors.primary }]}>{category.label}</Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={[styles.exportButton, { backgroundColor: colors.primary }]} onPress={handleExportData} disabled={isExporting}>
            <Ionicons name="document-text-outline" size={18} color={colors.onPrimary} style={{ marginRight: 8 }} />
            <Text style={[styles.exportButtonText, { color: colors.onPrimary }]}>{isExporting ? 'Exportando...' : 'Exportar JSON'}</Text>
          </TouchableOpacity>
<TouchableOpacity style={[styles.exportButton, { backgroundColor: colors.primary }]} onPress={handleSendReportEmail} disabled={isSendingEmail}>
      <Ionicons name="mail-outline" size={18} color={colors.onPrimary} style={{ marginRight: 8 }} />
      <Text style={[styles.exportButtonText, { color: colors.onPrimary }]}>{isSendingEmail ? 'Enviando...' : 'Enviar por e-mail'}</Text>
    </TouchableOpacity>
        </View>
      )}

{!isEditing && (
        <View style={[styles.themeSection, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant }]}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Aparência</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.onSurfaceVariant }]}>Escolha o tema do aplicativo.</Text>
          <View style={styles.themeModeRow}>
            {([['system', 'Automático', 'phone-portrait-outline'], ['light', 'Claro', 'sunny-outline'], ['dark', 'Escuro', 'moon-outline']] as const).map(([m, label, icon]) => (
              <TouchableOpacity
                key={m}
                style={[styles.themeModeChip, mode === m && styles.themeModeChipActive, { backgroundColor: mode === m ? colors.primaryContainer : colors.cancelButtonBackground, borderColor: mode === m ? colors.primary : colors.outlineVariant }]}
                onPress={() => setMode(m)}
              >
                <Ionicons name={icon as any} size={16} color={mode === m ? colors.onPrimaryContainer : colors.onSurfaceVariant} />
                <Text style={[styles.themeModeChipText, { color: mode === m ? colors.onPrimaryContainer : colors.onSurfaceVariant }]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

        </View>
      )}

      {!isEditing && (
        <View style={[styles.bottomMenu]}>
      <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.outlineVariant }]} onPress={() => setAudioLibraryVisible(true)}>
        <View style={[styles.menuIconCircle, { backgroundColor: colors.cancelButtonBackground }]}>
          <Ionicons name="musical-notes-outline" size={20} color={colors.primary} />
        </View>
        <Text style={[styles.menuItemText, { color: colors.onSurface }]}>Biblioteca de Audios</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceVariant} />
      </TouchableOpacity>

      <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.outlineVariant }]} onPress={() => signOut()}>
        <View style={[styles.menuIconCircle, { backgroundColor: colors.errorContainer }]}>
          <Ionicons name="log-out-outline" size={20} color={colors.warning} />
        </View>
        <Text style={[styles.menuItemText, { color: colors.warning }]}>Sair da conta</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceVariant} />
      </TouchableOpacity>
        </View>
      )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={false}
        visible={audioLibraryVisible}
        onRequestClose={() => setAudioLibraryVisible(false)}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <AudioLibraryComponent onClose={() => setAudioLibraryVisible(false)} />
        </SafeAreaView>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={goalModalVisible}
        onRequestClose={() => setGoalModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
<View style={[styles.modalContent, { backgroundColor: colors.surfaceContainerLowest }]}>
        <Text style={[styles.modalTitle, { color: colors.onSurface }]}>{editingGoal ? 'Editar Meta' : 'Nova Meta'}</Text>
<TextInput
          style={[styles.modalInput, { backgroundColor: colors.cancelButtonBackground }]}
          placeholder="Título da meta"
              value={goalTitle}
              onChangeText={setGoalTitle}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.cancelButtonBackground }]}
          onPress={() => setGoalModalVisible(false)}
        >
          <Text style={[styles.cancelButtonText, { color: colors.onSurfaceVariant }]}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSaveGoal}
        >
          <Text style={[styles.saveButtonText, { color: colors.onPrimary }]}>{editingGoal ? 'Salvar' : 'Adicionar'}</Text>
              </TouchableOpacity>
            </View>
            {editingGoal && (
<TouchableOpacity
            style={[styles.deleteGoalButton, { borderTopColor: colors.outlineVariant }]}
            onPress={() => handleDeleteGoal(editingGoal)}
          >
            <Ionicons name="trash-outline" size={18} color={colors.warning} />
            <Text style={[styles.deleteGoalButtonText, { color: colors.warning }]}>Excluir Meta</Text>
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
          <View style={[styles.modalContent, { backgroundColor: colors.surfaceContainerLowest }]}>
            <Text style={[styles.modalTitle, { color: colors.onSurface }]}>Alterar Senha</Text>
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
            {pwdError ? <Text style={{ color: colors.warning, marginBottom: 8 }}>{pwdError}</Text> : null}
            <View style={styles.modalButtons}>
              <TouchableOpacity
style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.cancelButtonBackground }]}
          onPress={() => {
            setPasswordModalVisible(false);
            setPwdCurrent('');
            setPwdNew('');
            setPwdConfirm('');
            setPwdError(null);
          }}
        >
          <Text style={[styles.cancelButtonText, { color: colors.onSurfaceVariant }]}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
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
                <Text style={[styles.saveButtonText, { color: colors.onPrimary }]}>{isChangingPassword ? 'Atualizando...' : 'Atualizar'}</Text>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    ...Typography.titleMedium,
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
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  editAvatarControls: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    flexDirection: 'row',
    gap: 8,
  },
  removeAvatarButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  sectionLabel: {
    ...Typography.labelMedium,
    marginBottom: 8,
    letterSpacing: 1.2,
  },
  userName: {
    ...Typography.titleLarge,
    marginBottom: 4,
  },
  userEmail: {
    ...Typography.bodyMedium,
  },
  editSection: {
    width: '100%',
    paddingHorizontal: 20,
  },
  input: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    ...Typography.bodyMedium,
  },
  sectionTitle: {
    ...Typography.titleMedium,
    marginTop: 10,
    marginBottom: 15,
  },
  sectionSubtitle: {
    ...Typography.bodyMedium,
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
    ...Typography.titleLarge,
    marginTop: 10,
    marginBottom: 5,
  },
  biometryInput: {
    ...Typography.titleLarge,
    marginTop: 10,
    marginBottom: 5,
    textAlign: 'center',
    width: '100%',
    borderRadius: 8,
  },
  biometryLabel: {
    ...Typography.labelMedium,
  },
  weightCard: {
    padding: 20,
    alignItems: 'center',
    flexDirection: 'column',
    marginBottom: 25,
  },
  weightHeader: {
    marginBottom: 10,
  },
  weightValue: {
    ...Typography.headlineLarge,
    marginBottom: 5,
  },
  weightLabel: {
    ...Typography.labelMedium,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  goalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  reportSection: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  exportCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  exportCategoryRowSelected: {
  },
  exportCategoryText: {
    ...Typography.bodyMedium,
    marginLeft: 12,
  },
  exportCategoryTextSelected: {
    fontWeight: '600',
  },
  exportButton: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  exportButtonText: {
    ...Typography.bodyMedium,
    fontWeight: '700',
  },
  goalIcon: {
    marginRight: 12,
  },
  goalButtonText: {
    ...Typography.bodyMedium,
  },
  themeSection: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  themeModeRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  themeModeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  themeModeChipActive: {
  },
  themeModeChipText: {
    ...Typography.labelMedium,
  },

  bottomMenu: {
    marginTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  menuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuItemText: {
    ...Typography.bodyMedium,
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
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  goalItemActive: {
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalText: {
    ...Typography.bodyMedium,
    marginLeft: 10,
  },
  goalTextActive: {
    fontWeight: '600',
  },
  shareActionButton: {
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
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
    ...Typography.titleLarge,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 20,
    ...Typography.bodyMedium,
  },
  passwordChangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 6,
  },
  iconCircleSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  passwordChangeText: {
    ...Typography.bodyMedium,
    fontWeight: '600',
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
  },
  saveButtonText: {
    ...Typography.bodyMedium,
    fontWeight: '600',
  },
  cancelButton: {
  },
  cancelButtonText: {
    ...Typography.bodyMedium,
    fontWeight: '600',
  },
  deleteGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  deleteGoalButtonText: {
    ...Typography.bodyMedium,
    fontWeight: '600',
  },
});

