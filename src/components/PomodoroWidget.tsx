import ShareProgressButton from '@/components/ShareProgressButton';
import { useTheme } from '@/context/ThemeContext';
import { usePomodoro } from '@/hooks/usePomodoro';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Card } from './Card';
import { ProgressCircle } from './ProgressCircle';

export const PomodoroWidget: React.FC = () => {
const { colors } = useTheme();
const {
timeLeft,
mode,
isRunning,
toggleTimer,
resetTimer,
formatTime,
progress,
} = usePomodoro();

const primaryColor = mode === 'focus' ? colors.primary : colors.accent;

const shareMessage = isRunning
? mode === 'focus'
? `Estou em uma sessão de foco Pomodoro. Faltam ${formatTime(timeLeft)}.`
: `Estou em uma pausa Pomodoro. Faltam ${formatTime(timeLeft)}.`
: `Estou pronto para iniciar uma sessão Pomodoro.${mode === 'focus' ? ' Hora de focar!' : ' Hora da pausa!'}`;

return (
<Card style={[styles.halfCard, { backgroundColor: colors.pomodoroBg, borderColor: colors.pomodoroBorder, shadowColor: colors.shadow }]}>
<Text style={[styles.gridCardTitle, { color: colors.pomodoroMuted }]}>
{mode === 'focus' ? 'FOCO' : 'PAUSA'}
</Text>

<View style={styles.content}>
<ProgressCircle
size={70}
strokeWidth={6}
progress={progress}
>
<Text style={[styles.timerText, { color: colors.pomodoroText }]}>{formatTime(timeLeft)}</Text>
</ProgressCircle>

<View style={styles.controls}>
<TouchableOpacity
onPress={toggleTimer}
style={[styles.button, { backgroundColor: isRunning ? colors.cancelButtonBackground : primaryColor + '15' }]}
>
<MaterialCommunityIcons
name={isRunning ? "pause" : "play"}
size={18}
color={isRunning ? colors.onSurfaceVariant : primaryColor}
/>
</TouchableOpacity>

<TouchableOpacity
onPress={resetTimer}
style={[styles.button, styles.resetButton, { backgroundColor: colors.pomodoroSurface }]}
>
<MaterialCommunityIcons
name="refresh"
size={16}
color={colors.pomodoroMuted}
/>
</TouchableOpacity>
</View>
<ShareProgressButton compact message={shareMessage} buttonStyle={styles.shareButton} />
</View>
</Card>
);
};

const styles = StyleSheet.create({
halfCard: {
height: 160,
borderRadius: 24,
padding: 16,
flex: 1,
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.05,
shadowRadius: 10,
elevation: 2,
borderWidth: 1,
},
gridCardTitle: {
fontSize: 12,
fontWeight: '800',
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
},
shareButton: {
marginTop: 16,
alignSelf: 'center',
},
});
