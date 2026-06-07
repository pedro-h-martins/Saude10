import { Card } from '@/components/Card';
import { Typography } from '@/constants/Typography';
import { useTheme } from '@/context/ThemeContext';
import React, { useEffect, useRef, useState } from 'react';
import {
Image,
ImageSourcePropType,
StyleSheet,
Text,
TouchableOpacity,
View,
} from 'react-native';

interface StretchAnimationCardProps {
title: string;
description: string;
durationSeconds: number;
animationSource?: ImageSourcePropType;
accentColor?: string;
}

export const StretchAnimationCard: React.FC<StretchAnimationCardProps> = ({
title,
description,
durationSeconds,
animationSource,
accentColor,
}) => {
const { colors } = useTheme();
const resolvedAccentColor = accentColor ?? colors.primary;
const [isRunning, setIsRunning] = useState(false);
const [timeLeft, setTimeLeft] = useState(durationSeconds);
const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

useEffect(() => {
if (!isRunning) {
if (intervalRef.current) {
clearInterval(intervalRef.current);
intervalRef.current = null;
}
return;
}

intervalRef.current = setInterval(() => {
setTimeLeft((current) => {
if (current <= 1) {
if (intervalRef.current) {
clearInterval(intervalRef.current);
intervalRef.current = null;
}
setIsRunning(false);
return 0;
}
return current - 1;
});
}, 1000);

return () => {
if (intervalRef.current) {
clearInterval(intervalRef.current);
intervalRef.current = null;
}
};
}, [isRunning]);

const handleToggle = () => {
if (timeLeft === 0) {
setTimeLeft(durationSeconds);
}
setIsRunning((prev) => !prev);
};

const handleReset = () => {
setIsRunning(false);
setTimeLeft(durationSeconds);
};

return (
<Card style={[styles.card, { backgroundColor: colors.surfaceContainerLowest }]}>
<View style={styles.header}>
<View style={[styles.accentBar, { backgroundColor: resolvedAccentColor + '30' }]} />
<View style={styles.titleSection}>
<Text style={{ ...Typography.titleMedium, fontSize: 16, color: colors.onSurface, marginBottom: 4 }}>{title}</Text>
<Text style={{ ...Typography.labelMedium, color: colors.onSurfaceVariant, lineHeight: 18 }}>{description}</Text>
</View>
</View>

<View style={styles.animationContainer}>
{animationSource ? (
<Image
source={animationSource}
style={styles.animationImage}
resizeMode="contain"
/>
) : (
<View style={[styles.animationPlaceholder, { borderColor: resolvedAccentColor + '40', backgroundColor: colors.timerBackground }]}>
<Text style={[{ ...Typography.titleMedium, fontSize: 24, fontWeight: '700', color: undefined }, { color: resolvedAccentColor }]}>GIF</Text>
</View>
)}
</View>

<View style={styles.timerRow}>
<Text style={{ ...Typography.bodyMedium, color: colors.onSurfaceVariant }}>Duração</Text>
<Text style={{ ...Typography.titleMedium, fontSize: 20, color: colors.onSurface }}>{timeLeft}s</Text>
</View>

<View style={styles.controlsRow}>
<TouchableOpacity
style={[styles.controlButton, { backgroundColor: colors.timerBackground }, isRunning ? { backgroundColor: colors.primaryContainer } : { backgroundColor: colors.primary }]}
onPress={handleToggle}
>
<Text style={[{ ...Typography.bodyMedium, fontWeight: '700', color: undefined }, isRunning ? { color: colors.onPrimary } : { color: colors.onPrimary }]}>
{isRunning ? 'Pausar' : timeLeft === durationSeconds ? 'Iniciar' : 'Continuar'}
</Text>
</TouchableOpacity>
<TouchableOpacity style={[styles.controlButton, { backgroundColor: colors.timerBackground }]} onPress={handleReset}>
<Text style={{ ...Typography.bodyMedium, fontWeight: '700', color: colors.onSurfaceVariant }}>Resetar</Text>
</TouchableOpacity>
</View>
</Card>
);
};

const styles = StyleSheet.create({
card: {
width: 240,
marginRight: 16,
},
header: {
flexDirection: 'row',
alignItems: 'center',
marginBottom: 12,
},
accentBar: {
width: 5,
height: 40,
borderRadius: 3,
marginRight: 12,
},
titleSection: {
flex: 1,
},
animationContainer: {
height: 140,
justifyContent: 'center',
alignItems: 'center',
marginBottom: 14,
},
animationImage: {
width: 180,
height: 120,
borderRadius: 16,
},
animationPlaceholder: {
width: 170,
height: 120,
borderRadius: 18,
borderWidth: 1,
justifyContent: 'center',
alignItems: 'center',
},
timerRow: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
marginBottom: 12,
},
controlsRow: {
flexDirection: 'row',
justifyContent: 'space-between',
},
controlButton: {
flex: 1,
paddingVertical: 10,
borderRadius: 12,
alignItems: 'center',
justifyContent: 'center',
marginRight: 8,
},
});
