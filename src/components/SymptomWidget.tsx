import { Card } from '@/components/Card';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useRealm } from '@/context/RealmProvider';
import { SymptomLog } from '@/models/SymptomLog';
import { UserProfile } from '@/models/UserProfile';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Realm } from '@realm/react';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export const SymptomWidget = () => {
  const realm = useRealm();
  const [description, setDescription] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const users = useQuery(UserProfile);
  const { currentUser } = useAuth();
  const user = currentUser ?? (users.length > 0 ? users[0] : null);

  const handleChange = (text: string) => {
    setDescription(text);
    setIsSubmitted(false);
  };

  const handleSubmit = () => {
    if (!description || description.trim().length === 0) {
      Alert.alert('Atenção', 'Descreva o sintoma antes de enviar.');
      return;
    }

    if (!user) {
      Alert.alert('Atenção', 'Faça login para registrar sintomas.');
      return;
    }

    realm.write(() => {
      realm.create(SymptomLog, {
        _id: new Realm.BSON.ObjectId(),
        description: description.trim(),
        timestamp: new Date(),
        userId: user._id,
      });
    });

    setIsSubmitted(true);
    setDescription('');
    Alert.alert('Sucesso', 'Sintoma registrado!');
  };

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="stethoscope" size={20} color={Colors.primary} />
        </View>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Sintomas</Text>
          <Text style={styles.subtitle}>Registre sintomas físicos livres</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Descreva o sintoma</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={handleChange}
            placeholder="Ex.: dor de cabeça após exercício"
            placeholderTextColor="#888"
            multiline
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitted && styles.submittedButton]}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>{isSubmitted ? 'ENVIADO ✓' : 'REGISTRAR'}</Text>
        </TouchableOpacity>
      </View>
    </Card>
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
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.timerBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleSection: { flex: 1 },
  title: {
    ...Typography.h3,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 10,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  content: { alignItems: 'center' },
  inputContainer: {
    width: '100%',
    marginTop: 8,
  },
  label: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    width: '100%',
    minHeight: 60,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    ...Typography.body,
    fontSize: 14,
    color: Colors.text,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 12,
    width: '100%',
    alignItems: 'center',
  },
  submittedButton: { backgroundColor: Colors.accent },
  submitButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
