import { Card } from '@/components/Card';
import { Typography } from '@/constants/Typography';
import { useTheme } from '@/context/ThemeContext';
import { useSleepTracking } from '@/hooks/useSleepTracking';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const SleepWidget = () => {
const { colors } = useTheme();
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
<View style={[styles.iconContainer, { backgroundColor: colors.sleepLight + '20' }]}>
<Ionicons name="moon" size={20} color={colors.sleep} />
</View>
<View style={styles.titleSection}>
<Text style={[styles.title, { color: colors.onSurface }]}>Sono</Text>
<Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>COMO VOCÊ DORMIU?</Text>
</View>
</View>

<View style={styles.content}>
<View style={styles.statBox}>
<Text style={[styles.statValue, { color: colors.primary }]}>
{lastLog ? formatDuration(calculateDurationHours(lastLog.startTime, lastLog.endTime)) : '--'}
</Text>
<Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>ÚLTIMA NOITE</Text>
</View>
<View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
<View style={styles.statBox}>
<View style={styles.qualityContainer}>
{[1, 2, 3, 4, 5].map((s) => (
<Ionicons
key={s}
name={lastLog && lastLog.quality >= s ? "star" : "star-outline"}
size={16}
color={lastLog && lastLog.quality >= s ? colors.moodOk : colors.outlineVariant}
/>
))}
</View>
<Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>QUALIDADE</Text>
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
<Pressable style={[styles.modalContent, { backgroundColor: colors.surfaceContainerLowest }]} onPress={(e) => e.stopPropagation()}>
<Text style={[styles.modalTitle, { color: colors.onSurface }]}>Registrar Sono</Text>

<View style={styles.timeRow}>
<View style={styles.timeInputBox}>
<Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>FUI DORMIR</Text>
<TouchableOpacity
style={[styles.timeButton, { backgroundColor: colors.cancelButtonBackground }]}
onPress={() => setShowStartPicker(true)}
>
<Text style={[styles.timeText, { color: colors.onSurface }]}>
{startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
</Text>
</TouchableOpacity>
</View>

<View style={styles.timeInputBox}>
<Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>ACORDEI EM</Text>
<TouchableOpacity
style={[styles.timeButton, { backgroundColor: colors.cancelButtonBackground }]}
onPress={() => setShowEndPicker(true)}
>
<Text style={[styles.timeText, { color: colors.onSurface }]}>
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

<View style={[styles.durationPreview, { backgroundColor: colors.sleepLight + '10' }]}>
<Text style={[styles.durationText, { color: colors.sleep }]}>Duração total: {formatDuration(durationHours)}</Text>
</View>

<Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>QUALIDADE PERCEBIDA</Text>
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
color={quality >= s ? colors.moodOk : colors.outlineVariant}
/>
</TouchableOpacity>
))}
</View>

<View style={styles.modalButtons}>
<TouchableOpacity
style={[styles.modalBtn, styles.cancelBtn, { backgroundColor: colors.cancelButtonBackground }]}
onPress={() => setModalVisible(false)}
>
<Text style={[styles.cancelBtnText, { color: colors.onSurfaceVariant }]}>CANCELAR</Text>
</TouchableOpacity>
<TouchableOpacity
style={[styles.modalBtn, styles.saveBtn, { backgroundColor: colors.primary }]}
onPress={handleSave}
>
<Text style={[styles.saveBtnText, { color: colors.surfaceContainerLowest }]}>SALVAR</Text>
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
...Typography.titleMedium,
fontSize: 16,
},
subtitle: {
...Typography.labelMedium,
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
...Typography.titleLarge,
fontSize: 20,
marginBottom: 4,
},
statLabel: {
...Typography.labelMedium,
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
backgroundColor: 'rgba(0,0,0,0.5)',
justifyContent: 'center',
padding: 20,
},
modalContent: {
borderRadius: 20,
padding: 20,
elevation: 5,
},
modalTitle: {
...Typography.titleLarge,
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
...Typography.labelMedium,
marginBottom: 8,
},
timeButton: {
borderRadius: 12,
padding: 12,
alignItems: 'center',
},
timeText: {
...Typography.bodyMedium,
fontWeight: '600',
},
durationPreview: {
padding: 12,
borderRadius: 12,
marginBottom: 20,
alignItems: 'center',
},
durationText: {
...Typography.bodyMedium,
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
},
saveBtn: {
},
cancelBtnText: {
...Typography.bodyMedium,
fontWeight: '600',
},
saveBtnText: {
...Typography.bodyMedium,
fontWeight: '600',
},
});
