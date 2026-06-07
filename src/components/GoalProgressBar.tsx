import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
progress: number;
height?: number;
label?: string;
}

export const GoalProgressBar: React.FC<Props> = ({ progress, height = 10, label }) => {
const { colors } = useTheme();
const pct = Math.round((progress || 0) * 100);
return (
<View style={styles.container}>
<View style={[styles.bar, { height, backgroundColor: colors.timerBackground }]}>
<View style={[styles.fill, { width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: colors.primary }]} />
</View>
{label ? <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>{label}</Text> : <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>{pct}%</Text>}
</View>
);
};

const styles = StyleSheet.create({
container: { width: '100%' },
bar: { borderRadius: 6, overflow: 'hidden' },
fill: { height: '100%' },
label: { marginTop: 8, fontSize: 12 },
});

export default GoalProgressBar;
