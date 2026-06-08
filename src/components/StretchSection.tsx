import { StretchAnimationCard } from '@/components/StretchAnimationCard';
import { Typography } from '@/constants/Typography';
import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const stretches = [
{
id: 'neck',
title: 'Pescoço',
description: 'Incline a cabeça lentamente de um lado ao outro.',
durationSeconds: 30,
accentColor: '#67B7FF',
animationSource: require('../../assets/gifs/pescoco.gif'),
},
{
id: 'shoulders',
title: 'Ombros',
description: 'Alongue os deltoides traseiros com movimento suave de puxar o braço atrás do corpo.',
durationSeconds: 35,
accentColor: '#43C0B8',
animationSource: require('../../assets/gifs/Homem Fazendo Alongamento Dos Ombros Deltóides Traseiros.gif'),
},
{
id: 'back',
title: 'Coluna',
description: 'Estique-se para frente e sinta a alongada nas costas.',
durationSeconds: 40,
accentColor: '#FF9A57',
animationSource: require('../../assets/gifs/coluna.gif'),
},
];

export const StretchSection: React.FC = () => {
const { colors } = useTheme();

return (
<View style={styles.sectionContainer}>
<View style={styles.header}>
<View style={[styles.headerDot, { backgroundColor: colors.primary }]} />
<View>
<Text style={{ ...Typography.titleLarge, fontSize: 20, color: colors.onSurface }}>Alongamentos Rápidos</Text>
<Text style={{ ...Typography.labelMedium, color: colors.onSurfaceVariant, marginTop: 4 }}>Pausas simples para no trabalho ou em casa.</Text>
</View>
</View>

<ScrollView
horizontal
showsHorizontalScrollIndicator={false}
contentContainerStyle={styles.scrollRow}
>
{stretches.map((stretch) => (
<StretchAnimationCard
key={stretch.id}
title={stretch.title}
description={stretch.description}
durationSeconds={stretch.durationSeconds}
animationSource={stretch.animationSource}
accentColor={stretch.accentColor}
/>
))}
</ScrollView>
</View>
);
};

const styles = StyleSheet.create({
sectionContainer: {
marginTop: 24,
paddingBottom: 8,
},
header: {
flexDirection: 'row',
alignItems: 'center',
marginBottom: 16,
},
headerDot: {
width: 8,
height: 8,
borderRadius: 4,
marginRight: 10,
},
scrollRow: {
paddingLeft: 2,
paddingRight: 12,
},
});
