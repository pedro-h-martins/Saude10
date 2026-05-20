import { Colors } from '@/constants/Colors';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  progress: number;
  height?: number;
  label?: string;
}

export const GoalProgressBar: React.FC<Props> = ({ progress, height = 10, label }) => {
  const pct = Math.round((progress || 0) * 100);
  return (
    <View style={styles.container}>
      <View style={[styles.bar, { height }]}> 
        <View style={[styles.fill, { width: `${Math.min(100, Math.max(0, pct))}%` }]} />
      </View>
      {label ? <Text style={styles.label}>{label}</Text> : <Text style={styles.label}>{pct}%</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%' },
  bar: { backgroundColor: Colors.timerBackground, borderRadius: 6, overflow: 'hidden' },
  fill: { backgroundColor: Colors.primary, height: '100%' },
  label: { marginTop: 8, color: Colors.textSecondary, fontSize: 12 },
});

export default GoalProgressBar;
