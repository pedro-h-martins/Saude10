import { useTheme } from '@/context/ThemeContext';
import { Recipe } from '@/models/Recipe';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface RecipeCardProps {
recipe: Recipe;
onPress: () => void;
onToggleFavorite: () => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onPress, onToggleFavorite }) => {
const { colors } = useTheme();

return (
<TouchableOpacity style={[styles.card, { backgroundColor: colors.surfaceContainerLowest }]} onPress={onPress} activeOpacity={0.9}>
{recipe.imageUrl ? (
<Image source={{ uri: recipe.imageUrl }} style={styles.image} />
) : (
<View style={[styles.imagePlaceholder, { backgroundColor: colors.background }]}>
<Ionicons name="restaurant-outline" size={40} color={colors.primary} />
</View>
)}

<TouchableOpacity
style={styles.favoriteButton}
onPress={onToggleFavorite}
>
<Ionicons
name={recipe.isFavorite ? "heart" : "heart-outline"}
size={24}
color={recipe.isFavorite ? colors.error : colors.onSurfaceVariant}
/>
</TouchableOpacity>

<View style={styles.content}>
<Text style={{ fontSize: 10, fontWeight: 'bold', color: colors.primary, marginBottom: 4 }}>{recipe.category.toUpperCase()}</Text>
<Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.onSurface, marginBottom: 8 }}>{recipe.title}</Text>

<View style={styles.footer}>
{recipe.prepTime && (
<View style={styles.infoItem}>
<Ionicons name="time-outline" size={14} color={colors.onSurfaceVariant} />
<Text style={{ fontSize: 12, color: colors.onSurfaceVariant, marginLeft: 4 }}>{recipe.prepTime}</Text>
</View>
)}
{recipe.calories && (
<View style={styles.infoItem}>
<Ionicons name="flame-outline" size={14} color={colors.onSurfaceVariant} />
<Text style={{ fontSize: 12, color: colors.onSurfaceVariant, marginLeft: 4 }}>{recipe.calories}</Text>
</View>
)}
</View>
</View>
</TouchableOpacity>
);
};

const styles = StyleSheet.create({
card: {
borderRadius: 12,
marginBottom: 16,
overflow: 'hidden',
elevation: 3,
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.1,
shadowRadius: 4,
},
image: {
width: '100%',
height: 150,
},
imagePlaceholder: {
width: '100%',
height: 150,
justifyContent: 'center',
alignItems: 'center',
},
favoriteButton: {
position: 'absolute',
top: 10,
right: 10,
backgroundColor: 'rgba(255,255,255,0.8)',
borderRadius: 20,
padding: 6,
},
content: {
padding: 12,
},
footer: {
flexDirection: 'row',
alignItems: 'center',
},
infoItem: {
flexDirection: 'row',
alignItems: 'center',
marginRight: 16,
},
});
