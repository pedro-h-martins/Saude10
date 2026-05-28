import { Card } from '@/components/Card';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useSleepTracking } from '@/hooks/useSleepTracking';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const SleepWidget = () => {
  const { sleepLogs, saveSleepLog, calculateDurationHours, formatDuration } = useSleepTracking();

  const lastLog = useMemo(() => {
    return sleepLogs.length > 0 ? sleepLogs[0] : null;
  }, [sleepLogs]);

  const [modalVisible, setModalVisible] = useState(false);
  const [startTime, setStartTime] = useState(new Date(new Date().setHours(22, 0, 0, 0)));
  const [endTime, setEndTime] = useState(new Date(new Date().setHours(7, 0, 0, 0)));
  const [quality, setQuality] = useState(3);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const durationHours = useMemo(() => {
    let end = new Date(endTime);
    let start = new Date(startTime);

    // If end is before start, assume it's the next day
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }

    return calculateDurationHours(start, end);
  }, [startTime, endTime, calculateDurationHours]);

  const handleSave = () => {
    let finalEnd = new Date(endTime);
    if (finalEnd < startTime) {
      finalEnd.setDate(finalEnd.getDate() + 1);
    }

    saveSleepLog({
      startTime,
      endTime: finalEnd,
      quality,
    });
    setModalVisible(false);
    Alert.alert('Sucesso', 'Registro de sono salvo com sucesso!');
  };

  return (
    <>
      <TouchableOpacity activeOpacity={0.8} onPress={() => setModalVisible(true)}>
        <Card style={styles.container}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="moon" size={20} color="#6366F1" />
            </View>
            <View style={styles.titleSection}>
              <Text style={styles.title}>Sono</Text>
              <Text style={styles.subtitle}>COMO VOCÊ DORMIU?</Text>
            </View>
          </View>

          <View style={styles.content}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {lastLog ? formatDuration(calculateDurationHours(lastLog.startTime, lastLog.endTime)) : '--'}
              </Text>
              <Text style={styles.statLabel}>ÚLTIMA NOITE</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statBox}>
              <View style={styles.qualityContainer}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons
                    key={s}
                    name={lastLog && lastLog.quality >= s ? "star" : "star-outline"}
                    size={16}
                    color={lastLog && lastLog.quality >= s ? "#F1C40F" : Colors.border}
                  />
                ))}
              </View>
              <Text style={styles.statLabel}>QUALIDADE</Text>
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
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Registrar Sono</Text>

            <View style={styles.timeRow}>
              <View style={styles.timeInputBox}>
                <Text style={styles.inputLabel}>FUI DORMIR</Text>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => setShowStartPicker(true)}
                >
                  <Text style={styles.timeText}>
                    {startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.timeInputBox}>
                <Text style={styles.inputLabel}>ACORDEI EM</Text>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => setShowEndPicker(true)}
                >
                  <Text style={styles.timeText}>
                    {endTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {showStartPicker && (
              <DateTimePicker
                value={startTime}
                mode="time"
                is24Hour={true}
                onValueChange={(event, date) => {
                  setShowStartPicker(false);
                  if (date) setStartTime(date);
                }}
                onDismiss={() => setShowStartPicker(false)}
              />
            )}

            {showEndPicker && (
              <DateTimePicker
                value={endTime}
                mode="time"
                is24Hour={true}
                onValueChange={(event, date) => {
                  setShowEndPicker(false);
                  if (date) setEndTime(date);
                }}
                onDismiss={() => setShowEndPicker(false)}
              />
            )}

            <View style={styles.durationPreview}>
              <Text style={styles.durationText}>Duração total: {formatDuration(durationHours)}</Text>
            </View>

            <Text style={styles.inputLabel}>QUALIDADE PERCEBIDA</Text>
            <View style={styles.qualitySelector}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setQuality(s)}
                  style={styles.qualityBtn}
                >
                  <Ionicons
                    name={quality >= s ? "star" : "star-outline"}
                    size={32}
                    color={quality >= s ? "#F1C40F" : Colors.border}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={handleSave}
              >
                <Text style={styles.saveBtnText}>SALVAR</Text>
              </TouchableOpacity>
            </View>
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
    borderRadius: 10,
    backgroundColor: '#6366F120',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    ...Typography.h3,
    color: Colors.text,
    fontSize: 16,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    ...Typography.h2,
    color: Colors.primary,
    fontSize: 20,
    marginBottom: 4,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 10,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  qualityContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    ...Typography.h2,
    marginBottom: 20,
    textAlign: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  timeInputBox: {
    flex: 0.45,
  },
  inputLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  timeButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  timeText: {
    ...Typography.body,
    fontWeight: '600',
  },
  durationPreview: {
    backgroundColor: '#6366F110',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  durationText: {
    ...Typography.body,
    color: '#6366F1',
    fontWeight: '700',
  },
  qualitySelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  qualityBtn: {
    padding: 5,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalBtn: {
    flex: 0.48,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9',
  },
  saveBtn: {
    backgroundColor: Colors.primary,
  },
  cancelBtnText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  saveBtnText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600',
  },
});
