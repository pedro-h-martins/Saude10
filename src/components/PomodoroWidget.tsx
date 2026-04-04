import { Colors } from '@/constants/Colors';
import { usePomodoro } from '@/hooks/usePomodoro';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Card } from './Card';
import { ProgressCircle } from './ProgressCircle';

export const PomodoroWidget: React.FC = () => {
  const {
    timeLeft,
    mode,
    isRunning,
    toggleTimer,
    resetTimer,
    formatTime,
    progress,
  } = usePomodoro();

  const primaryColor = mode === 'focus' ? Colors.primary : Colors.accent;

  return (
    <Card style={styles.halfCard}>
      <Text style={styles.gridCardTitle}>
        {mode === 'focus' ? 'FOCO' : 'PAUSA'}
      </Text>
      
      <View style={styles.content}>
        <ProgressCircle 
          size={70} 
          strokeWidth={6} 
          progress={progress}
        >
          <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
        </ProgressCircle>

        <View style={styles.controls}>
          <TouchableOpacity 
            onPress={toggleTimer} 
            style={[styles.button, { backgroundColor: isRunning ? '#F1F5F9' : primaryColor + '15' }]}
          >
            <MaterialCommunityIcons 
              name={isRunning ? "pause" : "play"} 
              size={18} 
              color={isRunning ? "#475569" : primaryColor} 
            />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={resetTimer} 
            style={[styles.button, styles.resetButton]}
          >
            <MaterialCommunityIcons 
              name="refresh" 
              size={16} 
              color="#94A3B8" 
            />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  halfCard: {
    height: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    flex: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  gridCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  controls: {
    flexDirection: 'row',
    marginTop: 10,
    alignItems: 'center',
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  resetButton: {
    backgroundColor: '#F8FAFC',
  }
});
