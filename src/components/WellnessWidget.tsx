import { Card } from '@/components/Card';
import { WellnessRating } from '@/components/WellnessRating';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useQuery, useRealm } from '@/context/RealmProvider';
import { UserProfile } from '@/models/UserProfile';
import { WellnessLog } from '@/models/WellnessLog';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Realm } from '@realm/react';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export const WellnessWidget = () => {
  const realm = useRealm();
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const users = useQuery(UserProfile);
  const user = users[0];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayLogs = useQuery(WellnessLog).filtered(
    'timestamp >= $0 AND timestamp < $1',
    today,
    tomorrow
  );

  useEffect(() => {
    if (todayLogs.length > 0) {
      const sorted = todayLogs.sorted('timestamp', true);
      const latest = sorted[0];
      setRating(latest.rating);
      setNote(latest.notes || '');
      setIsSubmitted(true);
    }
  }, []);

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
    setIsSubmitted(false);
  };

  const handleNoteChange = (text: string) => {
    setNote(text);
    setIsSubmitted(false);
  };

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert('Atenção', 'Por favor, selecione como você se sente.');
      return;
    }

    realm.write(() => {
      const existingToday = todayLogs.sorted('timestamp', true)[0];
      
      if (existingToday) {
        existingToday.rating = rating;
        existingToday.notes = note;
        existingToday.timestamp = new Date();
      } else {
        realm.create(WellnessLog, {
          _id: new Realm.BSON.ObjectId(),
          rating: rating,
          notes: note,
          timestamp: new Date(),
          userId: user?._id?.toString() || 'default',
        });
      }
    });

    setIsSubmitted(true);
    Alert.alert('Sucesso', 'Seu bem-estar foi registrado!');
  };

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="emoticon-outline" size={20} color={Colors.primary} />
        </View>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Bem-estar</Text>
          <Text style={styles.subtitle}>COMO VOCÊ SE SENTE HOJE?</Text>
        </View>
      </View>

      <View style={styles.content}>
        <WellnessRating 
          rating={rating} 
          onRatingChange={handleRatingChange} 
        />
        
        <View style={styles.noteContainer}>
          <Text style={styles.noteLabel}>O que você fez ou comeu hoje?</Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={handleNoteChange}
            placeholder="Atividade, comida, etc..."
            placeholderTextColor="#888"
            multiline
          />
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, isSubmitted && styles.submittedButton]} 
          onPress={handleSubmit}
          disabled={isSubmitted && rating > 0}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitted ? 'ENVIADO ✓' : 'ENVIAR'}
          </Text>
        </TouchableOpacity>

        {isSubmitted && (
          <Text style={styles.feedbackText}>
            Obrigado por registrar seu bem-estar!
          </Text>
        )}
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
    marginBottom: 16,
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
  titleSection: {
    flex: 1,
  },
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
  content: {
    alignItems: 'center',
  },
  noteContainer: {
    width: '100%',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
  },
  noteLabel: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
  },
  noteInput: {
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
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  submittedButton: {
    backgroundColor: Colors.accent,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 1,
  },
  feedbackText: {
    ...Typography.body,
    marginTop: 8,
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '500',
  },
});