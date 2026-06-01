import { Card } from '@/components/Card';
import { Typography, TypographyColors } from '@/constants/Typography';
import { useSleepTracking } from '@/hooks/useSleepTracking';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const SleepWidget = () => {
  const { colors } = useTheme();
  const textStyles = TypographyColors(colors);
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
            <View style={[styles.iconContainer, { backgroundColor: colors.moon + '20' }]}>
                <Ionicons name="moon" size={20} color={colors.moon} />
              </View>
              <View style={styles.titleSection}>
                <Text style={[styles.title, textStyles.h3, { color: colors.text }]}>Sono</Text>
                <Text style={[styles.subtitle, textStyles.caption, { color: colors.textSecondary }]}>COMO VOCÊ DORMIU?</Text>
              </View>
          </View>

            <View style={styles.content}>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {lastLog ? formatDuration(calculateDurationHours(lastLog.startTime, lastLog.endTime)) : '--'}
              </Text>
              <Text style={[styles.statLabel, textStyles.caption]}>ÚLTIMA NOITE</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.statBox}>
              <View style={styles.qualityContainer}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons 
                    key={s} 
                    name={lastLog && lastLog.quality >= s ? "star" : "star-outline"} 
                    size={16} 
                    color={lastLog && lastLog.quality >= s ? colors.qualityStar : colors.border} 
                  />
                ))}
              </View>
              <Text style={[styles.statLabel, textStyles.caption]}>QUALIDADE</Text>
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
          style={[styles.modalOverlay, { backgroundColor: colors.shadow + '80' }]} 
          onPress={() => setModalVisible(false)}
        >
          <Pressable style={[styles.modalContent, { backgroundColor: colors.white }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modalTitle, textStyles.h2]}>Registrar Sono</Text>
            
            <View style={styles.timeRow}>
              <View style={styles.timeInputBox}>
                <Text style={[styles.inputLabel, textStyles.caption]}>FUI DORMIR</Text>
                <TouchableOpacity 
                  style={[styles.timeButton, { backgroundColor: colors.timerBackground }]} 
                  onPress={() => setShowStartPicker(true)}
                >
                  <Text style={[styles.timeText, { color: colors.text }]}>
                    {startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.timeInputBox}>
                <Text style={[styles.inputLabel, textStyles.caption]}>ACORDEI EM</Text>
                <TouchableOpacity 
                  style={[styles.timeButton, { backgroundColor: colors.timerBackground }]} 
                  onPress={() => setShowEndPicker(true)}
                >
                  <Text style={[styles.timeText, { color: colors.text }]}>
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

            <View style={[styles.durationPreview, { backgroundColor: colors.moon + '10' }]}>
              <Text style={[styles.durationText, { color: colors.moon, fontWeight: '600' }]}>Duração total: {formatDuration(durationHours)}</Text>
            </View>

            <Text style={[styles.inputLabel, textStyles.caption]}>QUALIDADE PERCEBIDA</Text>
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
                    color={quality >= s ? colors.qualityStar : colors.border} 
                  />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelBtn, { borderColor: colors.border, backgroundColor: colors.timerBackground }]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.saveBtn, { backgroundColor: colors.primary }]} 
                onPress={handleSave}
              >
                <Text style={[styles.saveBtnText, { color: colors.white }]}>SALVAR</Text>
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
  },
  subtitle: {
    ...Typography.caption,
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
    fontSize: 20,
    marginBottom: 4,
  },
  statLabel: {
    ...Typography.caption,
    fontSize: 10,
  },
  divider: {
    width: 1,
    height: 30,
  },
  qualityContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
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
    marginBottom: 8,
  },
  timeButton: {
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  timeText: {
    ...Typography.body,
    fontWeight: '600',
  },
  durationPreview: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  durationText: {
    ...Typography.body,
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
  cancelBtn: {},
  saveBtn: {},
  cancelBtnText: {
    ...Typography.body,
    fontWeight: '600',
  },
  saveBtnText: {
    ...Typography.body,
    fontWeight: '600',
  },
});
